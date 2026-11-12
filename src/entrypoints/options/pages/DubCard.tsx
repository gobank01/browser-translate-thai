import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { useT } from '~/i18n';
import { Switch } from '~/ui/components/Switch';
import { Select } from '~/ui/components/Select';
import { Button } from '~/ui/components/Button';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { Volume2 } from '~/ui/icons';
import { MAX_DUB_RATE, MIN_DUB_RATE, clampDubRate, type DubSettings } from '~/core/dub/settings';
import { loadVoices, pickVoice, voicesFor } from '~/core/dub/voice';
import { CLOUD_TTS, CLOUD_VOICES, cloudVoiceId } from '~/core/dub/cloudVoice';
import type { CloudTtsRequest, CloudTtsResponse } from '~/messaging/types';

/** Read aloud by "Listen" — always Thai, since the voices offered are Thai. */
const SAMPLE = 'สวัสดีครับ นี่คือเสียงพากย์ไทยจาก BrowserTranslate';

/** Settings › Subtitles › Thai dub. */
export function DubCard() {
  const dub = useAppStore((s) => s.data.settings.dub);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | null>(null);
  const [draft, setDraft] = useState(dub);
  useEffect(() => setDraft(dub), [dub]);

  useEffect(() => {
    const synth = globalThis.speechSynthesis;
    if (!synth) { setVoices([]); return; }
    let alive = true;
    void loadVoices(synth).then((all) => { if (alive) setVoices(voicesFor(all, 'th')); });
    return () => { alive = false; synth.cancel(); };
  }, []);

  const save = (patch: Partial<DubSettings>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    void update({ dub: next });
  };

  async function listen() {
    const cloudId = CLOUD_TTS ? cloudVoiceId(draft.voiceURI) : null;
    if (cloudId) {
      const req: CloudTtsRequest = { type: 'tts:cloud', text: SAMPLE, voiceId: cloudId };
      const res = await chrome.runtime.sendMessage(req) as CloudTtsResponse;
      if (!res?.ok) return;
      const audio = new Audio(res.url);
      audio.playbackRate = draft.rate;
      audio.volume = draft.volume / 100;
      void audio.play();
      return;
    }
    const synth = globalThis.speechSynthesis;
    const voice = voices && pickVoice(voices, draft.voiceURI);
    if (!synth || !voice) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(SAMPLE);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = draft.rate;
    u.volume = draft.volume / 100;
    synth.speak(u);
  }

  const noVoice = !CLOUD_TTS && voices !== null && voices.length === 0;
  const cloudOptions = CLOUD_TTS
    ? CLOUD_VOICES.map((v) => ({
        value: v.uri,
        label: `${v.provider} · ${t(v.gender === 'female' ? 'dubFemale' : 'dubMale')} · ${v.name}`,
      }))
    : [];
  const systemOptions = (voices ?? []).map((v) => ({ value: v.voiceURI, label: `${t('dubSystemVoice')} · ${v.name}` }));
  const range = (label: string, key: 'rate' | 'volume' | 'duckVolume', min: number, max: number, step: number,
    format: (v: number) => string) => (
    <div class="ap-subtitle-setting">
      <span class="text-sm">{label}</span>
      <div class="flex min-w-0 items-center gap-3">
        <input type="range" min={min} max={max} step={step} aria-label={label} value={draft[key]}
          class="w-36 max-w-full accent-ap-brand" disabled={!draft.enabled}
          onInput={(e) => setDraft({ ...draft, [key]: Number(e.currentTarget.value) })}
          onChange={(e) => {
            const v = Number(e.currentTarget.value);
            save({ [key]: key === 'rate' ? clampDubRate(v) : v });
          }} />
        <output class="w-12 text-right text-sm tabular-nums text-ap-muted">{format(draft[key])}</output>
      </div>
    </div>
  );

  return (
    <section class="ap-settings-panel space-y-3" aria-labelledby="bt-dub-title">
      <div id="bt-dub-title"><SectionHeader icon={Volume2} label={t('dubTitle')} /></div>
      <Switch checked={draft.enabled} onChange={(enabled) => save({ enabled })}
        label={t('dubTitle')} description={t('dubDescription')} />
      <div class="ap-subtitle-setting">
        <span class="text-sm">{t('dubVoice')}</span>
        <div class="flex min-w-0 items-end gap-2">
          <div class="w-56 max-w-full">
            <Select aria-label={t('dubVoice')} value={draft.voiceURI} disabled={!draft.enabled || noVoice}
              options={noVoice
                ? [{ value: '', label: t('dubVoiceNone') }]
                : [...cloudOptions, { value: '', label: t('dubVoiceAuto') }, ...systemOptions]}
              onChange={(e) => save({ voiceURI: e.currentTarget.value })} />
          </div>
          <Button variant="secondary" size="md" onClick={() => void listen()}
            disabled={!draft.enabled || (!cloudVoiceId(draft.voiceURI) && !voices?.length)}>
            <Volume2 size={14} />{t('dubTry')}
          </Button>
        </div>
      </div>
      {!CLOUD_TTS && noVoice && <p role="note" class="text-xs text-ap-muted">{t('dubVoiceHelp')}</p>}
      {range(t('dubRate'), 'rate', MIN_DUB_RATE, MAX_DUB_RATE, 0.05, (v) => `${v.toFixed(2)}x`)}
      {range(t('dubVolume'), 'volume', 0, 100, 5, (v) => `${v}%`)}
      {range(t('dubClipVolume'), 'duckVolume', 0, 100, 5, (v) => `${v}%`)}
      <label class="flex items-center gap-2 py-1.5 text-sm">
        <input type="checkbox" class="h-4 w-4 accent-ap-brand" checked={draft.autoRate} disabled={!draft.enabled}
          onChange={(e) => save({ autoRate: e.currentTarget.checked })} />
        {t('dubAutoRate')}
      </label>
      <label class="flex items-center gap-2 py-1.5 text-sm">
        <input type="checkbox" class="h-4 w-4 accent-ap-brand" checked={draft.autoStart} disabled={!draft.enabled}
          onChange={(e) => save({ autoStart: e.currentTarget.checked })} />
        {t('dubAutoStart')}
      </label>
    </section>
  );
}
