import type { AppData, EngineRoute } from './schema';
import { CLOUD_PREFIX, CLOUD_VOICES } from '~/core/dub/cloudVoice';

/**
 * A Thai-dub build, made by the setup wizard (`node setup.mjs`), which writes
 * `.env.local` (gitignored, never committed):
 *
 *   WXT_THAI_DUB=1          this build is set up for Thai dubbing
 *   WXT_OPENROUTER_KEY      optional: translate with your own model
 *   WXT_ELEVENLABS_KEY      optional: natural voices (see cloudVoice.ts)
 *
 * The extension then translates and dubs into Thai straight after Load
 * unpacked — with OpenRouter if a key was given, the free Google service if not.
 *
 * ponytail: only fills what is empty — a key, a route or a language the user
 * set by hand is never overwritten. A build without these is the stock
 * extension.
 */
export const PRESET_MODEL = 'google/gemini-2.5-flash';

export interface PresetEnv {
  WXT_THAI_DUB?: string;
  WXT_OPENROUTER_KEY?: string;
  WXT_ELEVENLABS_KEY?: string;
}

const ENV: PresetEnv = import.meta.env;

/** A Thai-dub build shows Thai only: full pages hide the original text. */
export const PERSONAL_BUILD = Boolean(ENV.WXT_THAI_DUB || ENV.WXT_OPENROUTER_KEY);

/**
 * Bumped when the preset's one-time defaults change, so a store that already
 * took an older preset gets the new defaults once — and can change them after.
 */
const PRESET_VERSION = 4;

export function applyPersonalPreset(data: AppData, env: PresetEnv = ENV): AppData {
  const key = env.WXT_OPENROUTER_KEY;
  if (!key && !env.WXT_THAI_DUB) return data;
  const engines = data.settings.engines;
  const needsRoutes = !engines.selection || !engines.fullPage || !engines.subtitle;
  const needsDefaults = (data.settings.personalPreset ?? 0) < PRESET_VERSION;

  let providers = data.providers;
  let route: EngineRoute;
  if (key) {
    const row = providers.openrouter;
    route = { provider: 'openrouter', model: PRESET_MODEL };
    // A new preset version also brings the key this build was made with.
    if (!row.apiKey || (needsDefaults && row.apiKey !== key)) {
      providers = {
        ...providers,
        openrouter: {
          ...row,
          apiKey: key,
          model: row.model || PRESET_MODEL,
          models: row.models.includes(PRESET_MODEL) ? row.models : [PRESET_MODEL, ...row.models],
          enabled: true,
        },
      };
    }
  } else {
    // No key: the free Google service, switched on.
    route = { provider: 'google' };
    if (needsRoutes && !providers.google.enabled) {
      providers = { ...providers, google: { ...providers.google, enabled: true } };
    }
  }
  if (providers === data.providers && !needsRoutes && !needsDefaults) return data;

  const firstVoice = CLOUD_VOICES[0];
  return {
    ...data,
    providers,
    settings: {
      ...data.settings,
      engines: {
        selection: engines.selection ?? route,
        fullPage: engines.fullPage ?? route,
        subtitle: engines.subtitle ?? route,
      },
      // Once per preset version: Thai everywhere, Thai-only subtitles, auto dub.
      ...(needsDefaults && {
        targetLanguage: 'th',
        uiLanguage: 'th' as const,
        subtitleStyle: { ...data.settings.subtitleStyle, displayMode: 'translationOnly' as const },
        personalPreset: PRESET_VERSION,
        dub: {
          ...data.settings.dub,
          autoStart: true,
          voiceURI: data.settings.dub.voiceURI
            || (env.WXT_ELEVENLABS_KEY && firstVoice ? CLOUD_PREFIX + firstVoice.id : ''),
        },
      }),
    },
  };
}
