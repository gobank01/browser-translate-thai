import { describe, it, expect } from 'vitest';
import { applyPersonalPreset, PRESET_MODEL } from './personalPreset';
import { createDefaultAppData } from './defaults';

describe('applyPersonalPreset', () => {
  it('is the stock extension without a key', () => {
    const data = createDefaultAppData();
    expect(applyPersonalPreset(data, {})).toBe(data);
  });

  it('fills OpenRouter, every route and Thai on a fresh store, then stays stable', () => {
    const out = applyPersonalPreset(createDefaultAppData(), { WXT_OPENROUTER_KEY: 'sk-or-test' });
    expect(out.providers.openrouter).toMatchObject({ apiKey: 'sk-or-test', enabled: true, model: PRESET_MODEL });
    expect(out.settings.engines.subtitle).toEqual({ provider: 'openrouter', model: PRESET_MODEL });
    expect(out.settings.targetLanguage).toBe('th');
    expect(out.settings.uiLanguage).toBe('th');
    expect(out.settings.subtitleStyle.displayMode).toBe('translationOnly');
    expect(out.settings.dub.autoStart).toBe(true);
    expect(applyPersonalPreset(out, { WXT_OPENROUTER_KEY: 'sk-or-test' })).toBe(out);
  });

  it('never overwrites what the user chose', () => {
    const data = createDefaultAppData();
    data.providers.openrouter.apiKey = 'mine';
    data.settings.engines.subtitle = { provider: 'google' };
    data.settings.personalPreset = 5;
    data.settings.subtitleStyle = { ...data.settings.subtitleStyle, displayMode: 'bilingual' };
    const out = applyPersonalPreset(data, { WXT_OPENROUTER_KEY: 'sk-or-test' });
    expect(out.settings.subtitleStyle.displayMode).toBe('bilingual');
    expect(out.providers.openrouter.apiKey).toBe('mine');
    expect(out.settings.engines.subtitle).toEqual({ provider: 'google' });
    expect(out.settings.engines.selection?.provider).toBe('openrouter');
  });

  it('without a key, routes everything to the free Google service', () => {
    const out = applyPersonalPreset(createDefaultAppData(), { WXT_THAI_DUB: '1' });
    expect(out.providers.google.enabled).toBe(true);
    expect(out.settings.engines.subtitle).toEqual({ provider: 'google' });
    expect(out.settings.dub.autoStart).toBe(true);
    expect(applyPersonalPreset(out, { WXT_THAI_DUB: '1' })).toBe(out);
  });
});
