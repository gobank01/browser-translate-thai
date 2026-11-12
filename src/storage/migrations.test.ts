import { describe, it, expect } from 'vitest';
import { migrateAppData } from './migrations';
import { APP_DATA_VERSION } from './schema';
import type { AppData, GlobalSettings } from './schema';
import { createDefaultAppData } from './defaults';
import { PROVIDER_IDS } from '~/core/providers/registry';

/**
 * A store shaped the way v0.1.9 wrote one: a single `api` plus per-vendor
 * `savedConfigs`, and one `engine` for every surface.
 */
function legacyStore(api: Record<string, unknown> = {}, settings: Record<string, unknown> = {}) {
  const base = createDefaultAppData();
  const { providers: _providers, ...rest } = base;
  const { engines: _engines, ...restSettings } = base.settings;
  return {
    ...rest,
    api: {
      baseUrl: '',
      apiKey: '',
      model: '',
      providerType: 'cloud',
      cloudProvider: 'custom',
      ...api,
    },
    settings: { ...restSettings, ...settings },
  } as unknown as AppData;
}

describe('migrateAppData', () => {
  it('returns data unchanged (same reference) when shape is valid', () => {
    const input = createDefaultAppData();
    // Identity matters: loadAppData writes storage back when the reference changes.
    expect(migrateAppData(input)).toBe(input);
  });

  it('leaves a row that named its own thinking dialect exactly as it was', () => {
    // The row repair checks the key count, so every optional field has to be
    // counted there too. Miss one and a sound row looks unsound, gets rebuilt
    // into a new reference, and loadAppData writes it back on every single load
    // — with the field it did not recognise dropped.
    const input = createDefaultAppData();
    input.providers.custom = { ...input.providers.custom, thinkingDialect: 'effort' };
    expect(migrateAppData(input)).toBe(input);
    expect(migrateAppData(input).providers.custom.thinkingDialect).toBe('effort');
  });

  it('drops a dialect it does not recognise, rather than putting it on the wire', () => {
    const input = createDefaultAppData();
    (input.providers.custom as unknown as Record<string, unknown>).thinkingDialect = 'made-up';
    const out = migrateAppData(input);
    expect('thinkingDialect' in out.providers.custom).toBe(false);
    expect(out.providers.custom.baseUrl).toBe(input.providers.custom.baseUrl);
  });

  it('throws on unknown future version', () => {
    expect(() => migrateAppData({ version: 99 } as never)).toThrow();
  });
});

describe('adopting the provider table', () => {
  it('gives every registered provider a row', () => {
    const out = migrateAppData(legacyStore());
    expect(Object.keys(out.providers).sort()).toEqual([...PROVIDER_IDS].sort());
  });

  it('drops the legacy api object once it has been read', () => {
    const out = migrateAppData(legacyStore({ model: 'm', baseUrl: 'b', apiKey: 'k' }));
    expect('api' in out).toBe(false);
  });

  it("moves the active vendor's live fields into its own row", () => {
    const out = migrateAppData(
      legacyStore({
        cloudProvider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: 'sk-x',
        model: 'deepseek-chat',
        thinking: 'xhigh',
      }),
    );
    expect(out.providers.deepseek).toEqual({
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-x',
      model: 'deepseek-chat',
      models: ['deepseek-chat'],
      thinking: 'xhigh',
      enabled: true,
    });
  });

  it('turns each remembered config into a row of its own', () => {
    // These used to be reachable only by switching the active vendor; now they
    // are providers in their own right.
    const out = migrateAppData(
      legacyStore({
        cloudProvider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-o',
        model: 'gpt-4o',
        savedConfigs: {
          deepseek: { baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-d', model: 'chat' },
          mistral: { baseUrl: 'https://api.mistral.ai/v1', apiKey: 'sk-m', model: 'large' },
        },
      }),
    );
    expect(out.providers.deepseek.model).toBe('chat');
    expect(out.providers.mistral.apiKey).toBe('sk-m');
  });

  it('switches on the vendor that was in use, and leaves the rest off', () => {
    const out = migrateAppData(
      legacyStore({
        cloudProvider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-o',
        model: 'gpt-4o',
        savedConfigs: {
          deepseek: { baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-d', model: 'chat' },
        },
      }),
    );
    expect(out.providers.openai.enabled).toBe(true);
    expect(out.providers.deepseek.enabled).toBe(false);
    // The free services were always available and stay that way.
    expect(out.providers.microsoft.enabled).toBe(true);
    expect(out.providers.google.enabled).toBe(true);
  });

  it('does not switch on a vendor that was never usable', () => {
    // A half-filled row in routing would be a provider that cannot answer.
    const out = migrateAppData(legacyStore({ cloudProvider: 'openai', apiKey: '', model: '' }));
    expect(out.providers.openai.enabled).toBe(false);
  });

  it('reads a self-hosted store into the local row', () => {
    const out = migrateAppData(
      legacyStore({ providerType: 'local', baseUrl: 'http://localhost:1234/v1', model: 'qwen' }),
    );
    expect(out.providers.local).toMatchObject({ model: 'qwen', enabled: true });
  });

  it('drops an invalid thinking value while keeping the rest of the row', () => {
    for (const bad of ['sometimes', 'auto']) {
      const out = migrateAppData(
        legacyStore({ cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm', thinking: bad }),
      );
      expect('thinking' in out.providers.deepseek, bad).toBe(false);
      expect(out.providers.deepseek.model, bad).toBe('m');
    }
  });

  it('keeps every valid thinking value', () => {
    for (const good of ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const) {
      const out = migrateAppData(
        legacyStore({ cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm', thinking: good }),
      );
      expect(out.providers.deepseek.thinking).toBe(good);
    }
  });

  it('repairs a malformed row without touching its neighbours', () => {
    const data = createDefaultAppData();
    data.providers.openai = { baseUrl: 'b', apiKey: 'k', model: 'm', models: ['m'], enabled: true };
    (data.providers as Record<string, unknown>).deepseek = { baseUrl: 123 };
    const out = migrateAppData(data);
    expect(out.providers.deepseek).toEqual({
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      model: '',
      models: [],
      enabled: false,
    });
    expect(out.providers.openai).toEqual({ baseUrl: 'b', apiKey: 'k', model: 'm', models: ['m'], enabled: true });
  });

  it('fills a row that is missing entirely', () => {
    const data = createDefaultAppData();
    delete (data.providers as Record<string, unknown>).gemini;
    expect(migrateAppData(data).providers.gemini.baseUrl).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai',
    );
  });
});

describe('routing migration', () => {
  it('resolves the abstract "llm" to whatever the store was actually using', () => {
    const out = migrateAppData(
      legacyStore(
        { cloudProvider: 'zhipu', baseUrl: 'b', apiKey: 'k', model: 'm' },
        { engines: { selection: 'llm', fullPage: 'google', subtitle: 'llm' } },
      ),
    );
    expect(out.settings.engines).toEqual({
      selection: { provider: 'zhipu', model: 'm' },
      fullPage: { provider: 'google' },
      subtitle: { provider: 'zhipu', model: 'm' },
    });
  });

  it('carries a v0.1.9 single engine over to every surface', () => {
    const out = migrateAppData(legacyStore({}, { engine: 'google' }));
    expect(out.settings.engines).toEqual({
      selection: { provider: 'google' },
      fullPage: { provider: 'google' },
      subtitle: { provider: 'google' },
    });
  });

  it('drops the legacy engine key once it has been read', () => {
    const out = migrateAppData(legacyStore({}, { engine: 'google' }));
    expect('engine' in out.settings).toBe(false);
  });

  it('leaves a provider we no longer ship unchosen, never substituting one', () => {
    const data = createDefaultAppData();
    data.settings.engines = { selection: 'yandex', fullPage: 'google', subtitle: 'google' } as never;
    expect(migrateAppData(data).settings.engines.selection).toBeNull();
  });

  it('preserves a valid routing table without rewriting storage', () => {
    const seed = createDefaultAppData();
    seed.settings.engines = {
      selection: { provider: 'anthropic', model: 'claude' },
      fullPage: { provider: 'gemini' },
      subtitle: { provider: 'microsoft' },
    };
    const normalized = migrateAppData(seed);
    // Identity is what stops a load/write loop through storage.onChanged.
    expect(migrateAppData(normalized)).toBe(normalized);
    expect(normalized.settings.engines.selection).toEqual({ provider: 'anthropic', model: 'claude' });
  });
});

describe('legacy field stripping', () => {
  it('removes promptTemplates from pre-v0.1.8 data', () => {
    const legacy = {
      ...legacyStore({ baseUrl: 'http://x', apiKey: 'k', model: 'm' }),
      promptTemplates: [{ id: 'builtin-general', name: 'General' }],
    } as unknown as AppData;
    const out = migrateAppData(legacy);
    expect('promptTemplates' in out).toBe(false);
    expect(out.providers.custom.baseUrl).toBe('http://x');
  });

  it('removes the theme fields left by v0.1.8', () => {
    const data = createDefaultAppData();
    Object.assign(data.settings, { themeId: 'sepia', customThemes: [] });
    const out = migrateAppData(data);
    expect('themeId' in out.settings).toBe(false);
    expect('customThemes' in out.settings).toBe(false);
  });
});

describe('settings integrity repair', () => {
  it('fills a missing fullPageHotkey with the default', () => {
    const data = createDefaultAppData();
    delete (data.settings as Partial<GlobalSettings>).fullPageHotkey;
    expect(migrateAppData(data).settings.fullPageHotkey).toBe('Alt+A');
  });

  it('keeps a user-customised fullPageHotkey', () => {
    const data = createDefaultAppData();
    data.settings.fullPageHotkey = 'Ctrl+Shift+P';
    expect(migrateAppData(data).settings.fullPageHotkey).toBe('Ctrl+Shift+P');
  });

  it('replaces a target language we no longer offer', () => {
    const data = createDefaultAppData();
    data.settings.targetLanguage = 'klingon';
    expect(migrateAppData(data).settings.targetLanguage).toBe('zh-CN');
  });

  it('migrates generic English to US without changing explicit regions', () => {
    for (const [old, expected] of [['en', 'en-US'], ['en-AU', 'en-AU'], ['en-GB', 'en-GB']]) {
      const data = createDefaultAppData();
      data.settings.targetLanguage = old!;
      expect(migrateAppData(data).settings.targetLanguage).toBe(expected);
    }
  });

  it('keeps a target language that is still on the list', () => {
    const data = createDefaultAppData();
    data.settings.targetLanguage = 'pt-PT';
    expect(migrateAppData(data).settings.targetLanguage).toBe('pt-PT');
  });

  it('accepts a version below the current one', () => {
    const data = { ...createDefaultAppData(), version: APP_DATA_VERSION } as AppData;
    expect(() => migrateAppData(data)).not.toThrow();
  });
});

describe('model lists (v0.2.3)', () => {
  it('turns a pre-v0.2.3 single model into a one-item list', () => {
    const data = createDefaultAppData();
    (data.providers as Record<string, unknown>).openrouter = {
      baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'k', model: 'a/b', enabled: true,
    };
    expect(migrateAppData(data).providers.openrouter).toEqual({
      baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'k', model: 'a/b', models: ['a/b'], enabled: true,
    });
  });

  it('lifts pre-v0.2.3 provider-id routes into routes, then stays stable', () => {
    const data = createDefaultAppData();
    (data.settings as unknown as Record<string, unknown>).engines = {
      selection: 'openrouter', fullPage: 'google', subtitle: 'microsoft',
    };
    const once = migrateAppData(data);
    expect(once.settings.engines.selection).toEqual({ provider: 'openrouter' });
    expect(migrateAppData(once)).toBe(once);
  });

  it('keeps a sound row with several models without rewriting it', () => {
    const data = createDefaultAppData();
    const row = {
      baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'k', model: 'a', models: ['a', 'b'], enabled: true,
    };
    data.providers.openrouter = row;
    expect(migrateAppData(data).providers.openrouter).toBe(row);
  });

  it('moves a default chosen in a development build to the front, then stays stable', () => {
    const data = createDefaultAppData();
    data.providers.openrouter = {
      baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'k', model: 'b', models: ['a', 'b'], enabled: true,
    };
    const once = migrateAppData(data);
    expect(once.providers.openrouter).toMatchObject({ model: 'b', models: ['b', 'a'] });
    expect(migrateAppData(once)).toBe(once);
  });
});

describe('routes name their model (v0.2.3)', () => {
  it('upgrades a v0.2.2 store to routes that name the model it was using', () => {
    const data = createDefaultAppData();
    (data.providers as Record<string, unknown>).deepseek = {
      baseUrl: 'https://api.deepseek.com/v1', apiKey: 'k', model: 'deepseek-flash', enabled: true,
    };
    (data.settings as unknown as Record<string, unknown>).engines = {
      selection: 'deepseek', fullPage: 'google', subtitle: 'deepseek',
    };
    const once = migrateAppData(data);
    expect(once.providers.deepseek.models).toEqual(['deepseek-flash']);
    expect(once.settings.engines).toEqual({
      selection: { provider: 'deepseek', model: 'deepseek-flash' },
      fullPage: { provider: 'google' },
      subtitle: { provider: 'deepseek', model: 'deepseek-flash' },
    });
    expect(migrateAppData(once)).toBe(once);
  });

  it('lifts a v0.1.9 single engine the same way', () => {
    const data = createDefaultAppData();
    (data.providers as Record<string, unknown>).deepseek = {
      baseUrl: 'https://api.deepseek.com/v1', apiKey: 'k', model: 'deepseek-flash', enabled: true,
    };
    (data.settings as unknown as Record<string, unknown>).engines = 'deepseek';
    expect(migrateAppData(data).settings.engines.subtitle).toEqual({ provider: 'deepseek', model: 'deepseek-flash' });
  });

  it('names the model on a provider-only route a development build left behind', () => {
    const data = createDefaultAppData();
    data.providers.deepseek = { ...data.providers.deepseek, apiKey: 'k', model: 'deepseek-flash', models: ['deepseek-flash'], enabled: true };
    data.settings.engines.selection = { provider: 'deepseek' };
    expect(migrateAppData(data).settings.engines.selection).toEqual({ provider: 'deepseek', model: 'deepseek-flash' });
  });

  it('never picks a model for a route whose model was removed', () => {
    const data = createDefaultAppData();
    data.providers.openrouter = {
      baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'k', model: 'a', models: ['a', 'c'], enabled: true,
    };
    const route = { provider: 'openrouter' as const, model: 'b' };
    data.settings.engines.fullPage = route;
    const once = migrateAppData(data);
    expect(once.settings.engines.fullPage).toBe(route);
    expect(migrateAppData(once)).toBe(once);
  });
});

describe('free services on upgrade (v0.2.3)', () => {
  it('keeps the free services on for a pre-v0.2.0 store, where they were always available', () => {
    const out = migrateAppData(legacyStore({ cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm' }));
    expect(out.providers.microsoft.enabled).toBe(true);
    expect(out.providers.google.enabled).toBe(true);
  });

  it('keeps whatever a v0.2.x store already says', () => {
    const data = createDefaultAppData();
    data.providers.microsoft.enabled = true;
    expect(migrateAppData(data).providers.microsoft.enabled).toBe(true);
  });
});

describe('Thai dub settings (v0.2.4)', () => {
  it('gives a store from before the dub the default dub settings', () => {
    const data = createDefaultAppData();
    delete (data.settings as Partial<GlobalSettings>).dub;
    const out = migrateAppData(data);
    expect(out.settings.dub).toEqual(createDefaultAppData().settings.dub);
    // …and is stable from then on, so it is not written back on every load.
    expect(migrateAppData(out)).toBe(out);
  });

  it('repairs a damaged dub block and keeps the rest of the settings', () => {
    const data = createDefaultAppData();
    data.settings.dub = { ...data.settings.dub, rate: 7, volume: Number.NaN };
    const out = migrateAppData(data);
    expect(out.settings.dub.rate).toBe(1.5);
    expect(out.settings.dub.volume).toBe(100);
    expect(out.settings.targetLanguage).toBe(data.settings.targetLanguage);
  });
});
