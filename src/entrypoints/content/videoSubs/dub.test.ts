import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~/messaging/client', () => ({
  translateBatch: vi.fn(async (req: { segments: string[] }) => req.segments.map((s) => `ไทย:${s}`)),
  abortTranslate: vi.fn(),
}));
vi.mock('./nativeAudio', () => ({ switchToNativeAudio: vi.fn(async () => 'none') }));
vi.mock('./requestCaptionTracks', () => ({
  requestCaptionTracks: vi.fn(async () => ({
    source: 'bt-yt-captions-response',
    isLive: false,
    tracks: [{ baseUrl: 'u', languageCode: 'en' }],
  })),
}));
vi.mock('./fetchTranscript', async (orig) => ({
  ...((await orig()) as object),
  fetchTranscript: vi.fn(async () => [{ id: 0, startMs: 0, endMs: 5000, text: 'Hello' }]),
}));

vi.mock('~/core/dub/cloudVoice', async (orig) => {
  const actual = (await orig()) as typeof import('~/core/dub/cloudVoice');
  return { ...actual, sameProviderVoices: (uri: string) => actual.sameProviderVoices(uri, actual.OMNI_VOICES) };
});

import { createVideoSubTranslator, type DubDeps, type VideoSubsStrings } from './index';
import { createYouTubeSite } from './sites/youtube';
import { fetchTranscript } from './fetchTranscript';
import { switchToNativeAudio } from './nativeAudio';
import { DEFAULT_SUBTITLE_POSITION, DEFAULT_SUBTITLE_STYLE } from '~/core/subtitles/style';
import { DEFAULT_DUB_SETTINGS, type DubSettings } from '~/core/dub/settings';

const STRINGS = new Proxy({}, { get: (_t, key) => String(key) }) as VideoSubsStrings;
const DUB_STRINGS: DubDeps['strings'] = {
  titleOff: 'dub off', titleOn: 'dub on', preparing: 'preparing', clipVolume: 'clip', rate: 'rate', dubVolume: 'dubvol',
  noSubs: 'no subs', noVoice: 'no voice', noVoiceHelp: 'how', noEngine: 'no engine', openSettings: 'settings',
  autoStarted: 'auto {lang}', stop: 'stop', uiLocale: 'th',
  statusLoading: 'loading', statusTranslating: 'translating {n}/{total}', statusVoicing: 'voicing {n}/{total}',
  statusReady: 'ready', statusHeld: 'held',
  nativeSwitched: 'native switched', nativeAlready: 'native already', useOwnDub: 'own',
};

const KANYA = { name: 'Kanya', lang: 'th-TH', voiceURI: 'kanya', localService: true } as SpeechSynthesisVoice;

function fakeSynth(voices: SpeechSynthesisVoice[]) {
  return Object.assign(new EventTarget(), {
    speaking: false,
    getVoices: () => voices,
    speak: vi.fn(),
    cancel: vi.fn(),
  }) as unknown as SpeechSynthesis;
}

function make(dub: Partial<DubDeps> = {}, settings: Partial<DubSettings> = {}) {
  const dubDeps: DubDeps = {
    getSettings: () => ({ ...DEFAULT_DUB_SETTINGS, ...settings }),
    setSettings: vi.fn(),
    hasEngine: () => true,
    openSettings: vi.fn(),
    strings: DUB_STRINGS,
    synth: fakeSynth([KANYA]),
    ...dub,
  };
  const subs = createVideoSubTranslator({
    site: createYouTubeSite(),
    getTargetLang: () => 'th',
    strings: STRINGS,
    notify: vi.fn(),
    concurrency: 1,
    getPosition: () => DEFAULT_SUBTITLE_POSITION,
    setPosition: vi.fn(),
    getStyle: () => DEFAULT_SUBTITLE_STYLE,
    setStyle: vi.fn(),
    dub: dubDeps,
  });
  return { subs, dubDeps };
}

const dubButton = () => document.querySelector<HTMLButtonElement>('.bt-dub-button');
const toast = () => document.querySelector<HTMLElement>('.bt-dub-toast');
const video = () => document.querySelector('video')!;

async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
  document.head.innerHTML = '';
  document.body.innerHTML =
    '<div id="movie_player"><div class="ytp-right-controls"></div><video></video></div>';
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0 as unknown as number);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

describe('Thai dub in the player', () => {
  it('puts the TH button right after the subtitle button, labelled for screen readers', async () => {
    await make().subs.attachButton();
    const btn = dubButton()!;
    expect(btn.previousElementSibling?.classList.contains('bt-subs-button')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('dub off');
    expect(btn.dataset.state).toBe('off');
    expect(btn.textContent).toBe('TH');
  });

  it('offers no button when the dub is switched off in settings', async () => {
    await make({}, { enabled: false }).subs.attachButton();
    expect(dubButton()).toBeNull();
  });

  it('says so, with a link to settings, when no subtitle engine is chosen', async () => {
    const { subs, dubDeps } = make({ hasEngine: () => false });
    await subs.attachButton();
    await subs.toggleDub();
    expect(toast()?.textContent).toContain('no engine');
    toast()!.querySelector('button')!.click();
    expect(dubDeps.openSettings).toHaveBeenCalledWith('translation');
    expect(subs.isDubbing()).toBe(false);
  });

  it('says so when the computer has no Thai voice', async () => {
    const { subs, dubDeps } = make({ synth: fakeSynth([{ ...KANYA, lang: 'en-US' }]) });
    await subs.attachButton();
    await subs.toggleDub();
    expect(toast()?.textContent).toContain('no voice');
    toast()!.querySelector('button')!.click();
    expect(dubDeps.openSettings).toHaveBeenCalledWith('video');
  });

  it('says so when the video has no subtitles', async () => {
    vi.mocked(fetchTranscript).mockResolvedValueOnce([]);
    const { subs } = make();
    await subs.attachButton();
    await subs.toggleDub();
    await flush();
    expect(toast()?.textContent).toBe('no subs');
    expect(subs.isDubbing()).toBe(false);
    expect(dubButton()!.dataset.state).toBe('off');
  });

  it('turns subtitles on, ducks the video, and gives the volume back when switched off', async () => {
    const { subs } = make({}, { duckVolume: 30 });
    video().volume = 0.5;
    await subs.attachButton();
    await subs.toggleDub();
    await flush();
    expect(subs.isOn()).toBe(true);
    expect(subs.isDubbing()).toBe(true);
    expect(dubButton()!.dataset.state).toBe('preparing');
    expect(dubButton()!.getAttribute('aria-pressed')).toBe('true');
    expect(video().volume).toBeCloseTo(0.15);

    await subs.toggleDub();
    expect(subs.isDubbing()).toBe(false);
    expect(video().volume).toBe(0.5);
    expect(dubButton()!.dataset.state).toBe('off');
  });

  it('stops dubbing and restores the volume when subtitle translation is turned off', async () => {
    const { subs } = make();
    video().volume = 0.7;
    await subs.attachButton();
    await subs.toggleDub();
    await flush();
    subs.disable();
    expect(subs.isDubbing()).toBe(false);
    expect(video().volume).toBe(0.7);
  });

  it('opens the small menu on right-click', async () => {
    await make().subs.attachButton();
    dubButton()!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    const menu = document.querySelector('.bt-dub-menu')!;
    expect(menu.getAttribute('role')).toBe('menu');
    expect([...menu.querySelectorAll('input')].map((i) => i.getAttribute('aria-label'))).toEqual(['dubvol', 'clip', 'rate']);
  });

  it('starts by itself on a foreign-language video when auto-start is on', async () => {
    const { subs } = make({}, { autoStart: true });
    await subs.attachButton();
    await flush();
    expect(subs.isDubbing()).toBe(true);
    expect(toast()?.textContent).toContain('auto อังกฤษ');
    toast()!.querySelector('button')!.click();
    expect(subs.isDubbing()).toBe(false);
  });

  it('dubs a video whose spoken language is foreign even when Thai captions are on screen', async () => {
    const { requestCaptionTracks } = await import('./requestCaptionTracks');
    vi.mocked(requestCaptionTracks).mockResolvedValueOnce({
      source: 'bt-yt-captions-response', isLive: false,
      tracks: [{ baseUrl: 'u', languageCode: 'th' }, { baseUrl: 'a', languageCode: 'en', kind: 'asr' }],
      activeLanguageCode: 'th',
    });
    const { subs } = make({}, { autoStart: true });
    await subs.attachButton();
    await flush();
    expect(subs.isDubbing()).toBe(true);
  });

  it('leaves a Thai video alone', async () => {
    const { requestCaptionTracks } = await import('./requestCaptionTracks');
    vi.mocked(requestCaptionTracks).mockResolvedValueOnce({
      source: 'bt-yt-captions-response', isLive: false,
      tracks: [{ baseUrl: 'a', languageCode: 'th', kind: 'asr' }],
    });
    const { subs } = make({}, { autoStart: true });
    await subs.attachButton();
    await flush();
    expect(subs.isDubbing()).toBe(false);
  });

  it('does not auto-start without the setting', async () => {
    const { subs } = make();
    await subs.attachButton();
    await flush();
    expect(subs.isDubbing()).toBe(false);
  });

  it('switches voice from the menu and keeps dubbing with it', async () => {
    const fetchCloudAudio = vi.fn(async () => 'data:x');
    let settings: DubSettings = { ...DEFAULT_DUB_SETTINGS, voiceURI: 'oa:marin' };
    const { subs } = make({
      fetchCloudAudio,
      getSettings: () => settings,
      setSettings: (p) => { settings = { ...settings, ...p }; },
    });
    await subs.attachButton();
    await subs.toggleDub();
    await flush();
    dubButton()!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.bt-dub-voices button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['♀ Marin', '♀ Coral', '♂ Cedar', '♂ Ash']);
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true');
    buttons[2]!.click();
    await flush();
    expect(settings.voiceURI).toBe('oa:cedar');
    expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true');
    expect(subs.isDubbing()).toBe(true);
  });

  it('holds a playing video with a progress note, and asks the channel for its voice', async () => {
    const voiceForVideo = vi.fn(async () => 'oa:cedar');
    const { subs } = make({ voiceForVideo, fetchCloudAudio: vi.fn(async () => 'data:x') }, { voiceURI: 'oa:marin' });
    const v = video() as HTMLVideoElement & { paused: boolean };
    Object.defineProperty(v, 'paused', { value: false, writable: true, configurable: true });
    v.pause = vi.fn(() => { v.paused = true; });
    await subs.attachButton();
    const started = subs.toggleDub();
    expect(v.pause).toHaveBeenCalled();
    expect(document.querySelector('.bt-dub-status')?.textContent).toContain('loading');
    expect(document.querySelector('.bt-dub-status')?.textContent).toContain('held');
    await started;
    await flush();
    expect(voiceForVideo).toHaveBeenCalled();
    subs.toggleDub();
    expect(document.querySelector('.bt-dub-status')).toBeNull();
  });

  it('plays the video\'s own Thai track instead of dubbing, and dubs on request', async () => {
    vi.mocked(switchToNativeAudio).mockResolvedValueOnce('switched');
    const { subs } = make();
    await subs.attachButton();
    await subs.toggleDub();
    expect(subs.isDubbing()).toBe(false);
    expect(toast()?.textContent).toContain('native switched');
    toast()!.querySelector('button')!.click();
    await flush();
    expect(subs.isDubbing()).toBe(true);
    expect(vi.mocked(switchToNativeAudio)).toHaveBeenCalledTimes(1); // the own dub does not ask again
  });

  it('does not dub over a video already playing Thai', async () => {
    vi.mocked(switchToNativeAudio).mockResolvedValueOnce('already');
    const { subs } = make({}, { autoStart: true });
    await subs.attachButton();
    await flush();
    expect(subs.isDubbing()).toBe(false);
    expect(toast()?.textContent).toContain('native already');
  });
});
