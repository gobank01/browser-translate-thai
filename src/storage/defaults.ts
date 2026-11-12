import { APP_DATA_VERSION, type AppData, type ProviderConfig, type ProvidersConfig } from './schema';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from '~/core/providers/registry';
import { DEFAULT_SUBTITLE_POSITION, DEFAULT_SUBTITLE_STYLE } from '~/core/subtitles/style';
import { DEFAULT_TARGET_LANGUAGE } from '~/core/language/targets';
import { DEFAULT_CARD_SIZE } from '~/core/card/size';
import { defaultPromptSettings } from '~/core/prompt/templates';
import { DEFAULT_DUB_SETTINGS } from '~/core/dub/settings';

/**
 * A blank row for `id`. Cloud vendors start on their first endpoint so the
 * field is filled in before the user opens it; the free services and the
 * hand-entered ones have nothing to pre-fill.
 *
 * Everything starts switched off, the free services included: no text leaves
 * the browser until the user has chosen where it goes. (Until v0.2.3 the free
 * services were on from the start; stores from then keep what they had.)
 */
export function defaultProviderConfig(id: ProviderId): ProviderConfig {
  const def = PROVIDERS[id];
  return {
    baseUrl: def.endpoints[0]?.baseUrl ?? '',
    apiKey: '',
    model: '',
    models: [],
    enabled: false,
  };
}

export function createDefaultProviders(): ProvidersConfig {
  const out = {} as ProvidersConfig;
  for (const id of PROVIDER_IDS) out[id] = defaultProviderConfig(id);
  return out;
}

export function createDefaultAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    providers: createDefaultProviders(),
    settings: {
      // Nothing is chosen in a new installation: no text leaves the browser
      // until the user picks an engine for a mode.
      engines: { selection: null, fullPage: null, subtitle: null },
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
      prompts: defaultPromptSettings(),
      triggerMode: 'icon',
      hotkey: 'Alt+T',
      fullPageHotkey: 'Alt+A',
      cacheEnabled: true,
      cacheTTLDays: 7,
      cardSize: DEFAULT_CARD_SIZE,
      subtitlePosition: DEFAULT_SUBTITLE_POSITION,
      subtitleStyle: DEFAULT_SUBTITLE_STYLE,
      dub: DEFAULT_DUB_SETTINGS,
      theme: 'auto',
      uiLanguage: 'auto',
    },
  };
}
