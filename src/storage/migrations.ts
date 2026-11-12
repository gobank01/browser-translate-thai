import { APP_DATA_VERSION, isThinkingSetting, type AppData } from './schema';
import { isThinkingDialect } from '~/core/providers/thinking';
import { normalizeCardSize } from '~/core/card/size';
import type { GlobalSettings, ProviderConfig, ProvidersConfig } from './schema';
import { createDefaultProviders, defaultProviderConfig } from './defaults';
import { PROVIDERS, PROVIDER_IDS, SERVICE_IDS, isProviderId, type ProviderId } from '~/core/providers/registry';
import { isProviderReady } from '~/core/providers/resolve';
import { normalizeModelSet } from '~/core/providers/models';
import { normalizeEngineRouting } from '~/core/engines/routing';
import { normalizeTargetLanguage } from '~/core/language/targets';
import { normalizeSubtitlePosition, normalizeSubtitleStyle } from '~/core/subtitles/style';
import { normalizePromptSettings } from '~/core/prompt/templates';
import { normalizeDubSettings } from '~/core/dub/settings';
import { applyPersonalPreset } from './personalPreset';
import { isLocale } from '~/i18n/localeInfo';

/**
 * Integrity repairs applied to AppData on every load.
 * No version migration in v1 (this is the initial shape).
 * Every pass MUST return its input reference when nothing changes —
 * loadAppData uses identity to decide whether to write storage back.
 */
export function migrateAppData(input: AppData): AppData {
  if (typeof input.version !== 'number' || input.version > APP_DATA_VERSION) {
    throw new Error(`Unsupported AppData version: ${input.version}`);
  }

  let data = input;
  data = stripLegacyFields(data);
  data = adoptProviders(data);
  data = nameLegacyRouteModels(data);
  data = fillSettingsDefaults(data);
  data = applyPersonalPreset(data);
  return data;
}

/**
 * Give pre-v0.2.3 routes the model they were using.
 *
 * Before v0.2.3 a route was a bare provider id: one model per provider, so
 * there was nothing else to say. That model is now the provider's one-item
 * list, and here it is written into the route, so an upgraded store says
 * "DeepSeek, deepseek-flash" outright and keeps translating exactly as before.
 *
 * Only routes naming no model are touched. A route that names one — including
 * a model the user has since removed from the list — is left as it is: that
 * one is shown as not configured until the user picks again.
 */
/** The provider of a `{ provider }` route that names no model, if it is one. */
function bareRouteProvider(value: unknown): ProviderId | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as { provider?: unknown; model?: unknown };
  if (!isProviderId(r.provider) || (typeof r.model === 'string' && r.model.trim())) return null;
  return r.provider;
}

function nameLegacyRouteModels(data: AppData): AppData {
  const raw = (data.settings as unknown as { engines?: unknown }).engines;
  const lift = (value: unknown): unknown => {
    // A bare id is the v0.2.2 shape; `{ provider }` with no model is what a
    // v0.2.3 development build turned that into. Both mean "this provider's
    // one model" and get it named.
    const bare = isProviderId(value);
    const id = bare ? value : bareRouteProvider(value);
    if (!id || PROVIDERS[id].kind !== 'llm') return value;
    const model = data.providers[id]?.model;
    return model ? { provider: id, model } : value;
  };
  let engines: unknown;
  if (typeof raw === 'string') {
    // A single engine for every surface, as v0.1.9 stored it.
    const route = lift(raw);
    if (route === raw) return data;
    engines = { selection: route, fullPage: route, subtitle: route };
  } else if (raw && typeof raw === 'object') {
    const entries = Object.entries(raw as Record<string, unknown>);
    if (!entries.some(([, v]) => lift(v) !== v)) return data;
    engines = Object.fromEntries(entries.map(([k, v]) => [k, lift(v)]));
  } else {
    return data;
  }
  return { ...data, settings: { ...data.settings, engines } as GlobalSettings };
}

/** Settings keys replaced by `subtitlePosition` / `subtitleStyle` in v0.1.9. */
const LEGACY_SUBTITLE_KEYS = [
  'subtitleOffsetPct',
  'subtitleFontScale',
  'subtitleBackgroundOpacity',
  'subtitleTranslationOnly',
] as const;

/**
 * Strip keys left behind by removed features: the prompt-template system
 * (< v0.1.8), the theme system and the flat subtitle settings (< v0.1.9).
 * Idempotent.
 */
function stripLegacyFields(data: AppData): AppData {
  const d = data as AppData & {
    promptTemplates?: unknown;
    settings: GlobalSettings & { themeId?: unknown; customThemes?: unknown };
  };
  const hasTemplates = 'promptTemplates' in d;
  const hasThemeFields = 'themeId' in d.settings || 'customThemes' in d.settings;
  const staleSubtitleKeys = LEGACY_SUBTITLE_KEYS.filter((k) => k in d.settings);
  if (!hasTemplates && !hasThemeFields && staleSubtitleKeys.length === 0) return data;
  const { promptTemplates: _templates, ...rest } = d;
  const { themeId: _themeId, customThemes: _customThemes, ...settings } = d.settings;
  for (const key of staleSubtitleKeys) delete (settings as Record<string, unknown>)[key];
  return { ...rest, settings };
}

/** The single `api` object a store held before v0.2.0. */
interface LegacyApi {
  baseUrl?: unknown;
  apiKey?: unknown;
  model?: unknown;
  thinking?: unknown;
  providerType?: unknown;
  cloudProvider?: unknown;
  savedConfigs?: unknown;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** Which provider a pre-v0.2.0 store was actively translating through. */
function legacyActiveProvider(api: LegacyApi): ProviderId {
  if (api.providerType === 'local') return 'local';
  return isProviderId(api.cloudProvider) ? api.cloudProvider : 'custom';
}

/** Repair one row, returning the same reference when it is already sound. */
function normalizeRow(id: ProviderId, value: unknown): ProviderConfig {
  const fallback = defaultProviderConfig(id);
  if (value === null || typeof value !== 'object') return fallback;
  const row = value as Partial<ProviderConfig> & {
    thinking?: unknown;
    thinkingDialect?: unknown;
    models?: unknown;
  };
  const thinkingOk = row.thinking === undefined || isThinkingSetting(row.thinking);
  const dialectOk = row.thinkingDialect === undefined || isThinkingDialect(row.thinkingDialect);
  // A row from before v0.2.3 has a single `model` and no list; this turns it
  // into a one-item list and keeps the default on the list from then on.
  const modelSet = normalizeModelSet(row.model, row.models);
  // Counted rather than fixed at five: the optional fields are the ones a row
  // may legitimately lack, and a row carrying one must still be recognised as
  // sound. Rebuilding a sound row returns a new reference, which the client
  // reads as "migrated" and writes back — every load, forever.
  const optional = (row.thinking === undefined ? 0 : 1) + (row.thinkingDialect === undefined ? 0 : 1);
  const clean =
    typeof row.baseUrl === 'string' &&
    typeof row.apiKey === 'string' &&
    modelSet === null &&
    typeof row.enabled === 'boolean' &&
    thinkingOk &&
    dialectOk &&
    Object.keys(row).length === 5 + optional;
  if (clean) return value as ProviderConfig;
  const models = modelSet ?? { model: row.model as string, models: row.models as string[] };
  return {
    baseUrl: str(row.baseUrl, fallback.baseUrl),
    apiKey: str(row.apiKey, ''),
    model: models.model,
    models: models.models,
    ...(isThinkingSetting(row.thinking) && { thinking: row.thinking }),
    ...(isThinkingDialect(row.thinkingDialect) && { thinkingDialect: row.thinkingDialect }),
    enabled: typeof row.enabled === 'boolean' ? row.enabled : fallback.enabled,
  };
}

/** A legacy config's single model, as a one-item list. */
function legacyModels(value: unknown, fallback: string): Pick<ProviderConfig, 'model' | 'models'> {
  const model = str(value, fallback);
  return normalizeModelSet(model, undefined) ?? { model, models: [] };
}

/**
 * Build the provider table.
 *
 * Before v0.2.0 a store held one active `api` plus a bag of remembered
 * per-vendor configs. Those remembered configs become rows directly, the active
 * one wins for its own row, and it is switched on only if it was actually
 * usable — enabling a half-filled row would put a provider into routing that
 * cannot answer. The free services were always available, so they stay on.
 */
function providersFromLegacy(api: LegacyApi): ProvidersConfig {
  const out = createDefaultProviders();

  const saved = api.savedConfigs;
  if (saved && typeof saved === 'object') {
    for (const [slot, cfg] of Object.entries(saved as Record<string, unknown>)) {
      if (!isProviderId(slot) || !cfg || typeof cfg !== 'object') continue;
      const c = cfg as Record<string, unknown>;
      out[slot] = {
        baseUrl: str(c.baseUrl, out[slot].baseUrl),
        apiKey: str(c.apiKey, ''),
        ...legacyModels(c.model, ''),
        ...(isThinkingSetting(c.thinking) && { thinking: c.thinking }),
        enabled: false,
      };
    }
  }

  const active = legacyActiveProvider(api);
  const live: ProviderConfig = {
    baseUrl: str(api.baseUrl, out[active].baseUrl),
    apiKey: str(api.apiKey, out[active].apiKey),
    ...legacyModels(api.model, out[active].model),
    ...(isThinkingSetting(api.thinking) && { thinking: api.thinking }),
    enabled: false,
  };
  out[active] = { ...live, enabled: isProviderReady(active, live) };
  // A fresh install now starts with the free services off, but before v0.2.0
  // they were always available — a store from then keeps them.
  for (const id of SERVICE_IDS) out[id] = { ...out[id], enabled: true };
  return out;
}

function adoptProviders(data: AppData): AppData {
  const d = data as AppData & { api?: LegacyApi };
  const hasLegacyApi = 'api' in d;

  if (!hasLegacyApi) {
    const stored = data.providers as unknown;
    if (stored && typeof stored === 'object') {
      let clean = Object.keys(stored).length === PROVIDER_IDS.length;
      const out = {} as ProvidersConfig;
      for (const id of PROVIDER_IDS) {
        const row = normalizeRow(id, (stored as Record<string, unknown>)[id]);
        if (row !== (stored as Record<string, unknown>)[id]) clean = false;
        out[id] = row;
      }
      return clean ? data : { ...data, providers: out };
    }
    return { ...data, providers: createDefaultProviders() };
  }

  const { api, ...rest } = d;
  const providers = providersFromLegacy(api ?? {});
  const active = legacyActiveProvider(api ?? {});

  // Routing spoke of "the model" abstractly; now it names one. Whatever the
  // store was actually using is the only honest answer.
  const settings = data.settings as GlobalSettings & { engine?: unknown; engines?: unknown };
  const remap = (value: unknown) => (value === 'llm' ? active : value);
  const engines =
    settings.engines && typeof settings.engines === 'object'
      ? Object.fromEntries(
          Object.entries(settings.engines as Record<string, unknown>).map(([k, v]) => [k, remap(v)]),
        )
      : // Before v0.1.9 there was no choice to store: everything went to the model.
        remap(settings.engine ?? 'llm');

  return { ...rest, providers, settings: { ...settings, engines } as GlobalSettings };
}

function fillSettingsDefaults(data: AppData): AppData {
  const s = data.settings as GlobalSettings & { engine?: unknown };
  const fullPageHotkey = typeof s.fullPageHotkey === 'string' ? s.fullPageHotkey : 'Alt+A';
  // A store that named one provider for everything keeps it; one with nothing
  // configured gets nothing — a mode without an engine is not configured.
  const seed: ProviderId | null = isProviderId(s.engines) ? s.engines : null;
  const engines = normalizeEngineRouting(s.engines, seed);
  const prompts = normalizePromptSettings(s.prompts);
  const uiLanguage = s.uiLanguage === 'auto' || isLocale(s.uiLanguage) ? s.uiLanguage : 'auto';
  const cardSize = normalizeCardSize(s.cardSize);
  const subtitlePosition = normalizeSubtitlePosition(s.subtitlePosition);
  const subtitleStyle = normalizeSubtitleStyle(s.subtitleStyle);
  // Added with the Thai dub (v0.2.4): older stores get the defaults.
  const dub = normalizeDubSettings(s.dub);
  // A target language we no longer offer would be sent to the providers verbatim
  // and answered with something arbitrary, so it falls back rather than passes
  // through. Legacy generic English migrates to US English.
  const targetLanguage = normalizeTargetLanguage(s.targetLanguage);
  const unchanged =
    prompts === s.prompts &&
    uiLanguage === s.uiLanguage &&
    cardSize === s.cardSize &&
    fullPageHotkey === s.fullPageHotkey &&
    engines === s.engines &&
    targetLanguage === s.targetLanguage &&
    subtitlePosition === s.subtitlePosition &&
    subtitleStyle === s.subtitleStyle &&
    dub === s.dub &&
    !('engine' in s);
  if (unchanged) return data;

  // `engine` is dropped here rather than in stripLegacyFields: that pass runs
  // first, and adoptProviders still needs to read the old value.
  const { engine: _legacy, ...rest } = s;
  return {
    ...data,
    settings: {
      ...rest,
      engines,
      fullPageHotkey,
      targetLanguage,
      prompts,
      uiLanguage,
      subtitlePosition,
      subtitleStyle,
      dub,
      cardSize,
    },
  };
}
