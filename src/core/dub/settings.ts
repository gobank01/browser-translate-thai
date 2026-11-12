/**
 * Thai dub settings. Pure data plus a normalizer that repairs whatever comes
 * back from storage, returning its input untouched when nothing needed fixing
 * (`loadAppData` uses identity to decide whether to write back).
 */
export interface DubSettings {
  /** Offer the dub button on the player and the Alt+D shortcut. */
  enabled: boolean;
  /** `SpeechSynthesisVoice.voiceURI`; empty = pick automatically (Kanya first). */
  voiceURI: string;
  /** Base speech rate, 0.8–1.5. */
  rate: number;
  /** Dub volume, 0–100. */
  volume: number;
  /** The video's own volume while dubbing, as a percent of what it was. 0 = muted. */
  duckVolume: number;
  /** Speed speech up (to MAX_AUTO_RATE) when a line would overrun its cue. */
  autoRate: boolean;
  /** Start dubbing by itself when a foreign-language video with captions opens. */
  autoStart: boolean;
}

export const MIN_DUB_RATE = 0.8;
export const MAX_DUB_RATE = 1.5;

export const DEFAULT_DUB_SETTINGS: DubSettings = {
  enabled: true,
  voiceURI: '',
  rate: 1,
  volume: 100,
  duckVolume: 10,
  autoRate: true,
  autoStart: false,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;

export function clampDubRate(v: number): number {
  return Math.round(clamp(v, MIN_DUB_RATE, MAX_DUB_RATE) * 100) / 100;
}

export function normalizeDubSettings(value: unknown): DubSettings {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const d = DEFAULT_DUB_SETTINGS;
  const next: DubSettings = {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : d.enabled,
    voiceURI: typeof raw.voiceURI === 'string' ? raw.voiceURI : d.voiceURI,
    rate: num(raw.rate, MIN_DUB_RATE, MAX_DUB_RATE, d.rate),
    volume: num(raw.volume, 0, 100, d.volume),
    duckVolume: num(raw.duckVolume, 0, 100, d.duckVolume),
    autoRate: typeof raw.autoRate === 'boolean' ? raw.autoRate : d.autoRate,
    autoStart: typeof raw.autoStart === 'boolean' ? raw.autoStart : d.autoStart,
  };
  const same = (Object.keys(next) as (keyof DubSettings)[]).every((k) => raw[k] === next[k])
    && Object.keys(raw).length === Object.keys(next).length;
  return same ? (value as DubSettings) : next;
}
