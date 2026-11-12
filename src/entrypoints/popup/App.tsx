import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Switch } from '~/ui/components/Switch';
import { Shortcut } from '~/ui/components/Keycap';
import { Globe, Route, Settings, Volume2 } from '~/ui/icons';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { NumberControl } from '~/ui/components/NumberControl';
import { CLOUD_TTS, sameProviderVoices } from '~/core/dub/cloudVoice';
import type { DubSettings } from '~/core/dub/settings';
import { cn } from '~/lib/cn';
import { useT } from '~/i18n';
import { useApplyTheme } from '~/ui/useApplyTheme';
import { useApplyLocale } from '~/ui/useApplyLocale';
import { EngineRoutingPicker } from '~/ui/components/EngineRoutingPicker';
import { LanguageSelect } from '~/ui/components/LanguageSelect';
import type { PageStateResponse } from '~/messaging/types';

type Availability = 'loading' | 'ready' | 'unsupported' | 'refresh';

export function App() {
  const load = useAppStore((s) => s.load);
  const loaded = useAppStore((s) => s.loaded);
  const providers = useAppStore((s) => s.data.providers);
  const settings = useAppStore((s) => s.data.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const t = useT();
  useApplyTheme();
  useApplyLocale();
  const [pageOn, setPageOn] = useState(false);
  const [availability, setAvailability] = useState<Availability>('loading');
  const [tabId, setTabId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState<{ host: string; icon?: string } | null>(null);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!live) return;
        if (tab?.id === undefined || (tab.url && !/^(https?|file):/i.test(tab.url))) {
          setAvailability('unsupported');
          return;
        }
        setTabId(tab.id);
        if (tab.url) {
          try {
            const host = new URL(tab.url).hostname;
            // Only a web favicon: a data: or chrome: one is not worth the risk
            // of a broken image, and the globe is a fine stand-in.
            const icon = tab.favIconUrl && /^https?:/i.test(tab.favIconUrl) ? tab.favIconUrl : undefined;
            if (host) setSite({ host, icon });
          } catch { /* a URL we cannot parse just goes unnamed */ }
        }
        const reply = await chrome.tabs.sendMessage(tab.id, { type: 'page:query' }) as PageStateResponse | undefined;
        if (!live) return;
        if (typeof reply?.translated !== 'boolean') { setAvailability('refresh'); return; }
        setPageOn(reply.translated);
        setAvailability('ready');
      } catch {
        if (live) setAvailability('refresh');
      }
    })();
    return () => { live = false; };
  }, []);

  async function togglePage() {
    if (busy || availability !== 'ready' || tabId === undefined) return;
    setBusy(true);
    try {
      const reply = await chrome.tabs.sendMessage(tabId, { type: 'page:toggle' }) as PageStateResponse | undefined;
      if (typeof reply?.translated === 'boolean') setPageOn(reply.translated);
      else setAvailability('refresh');
    } catch {
      setAvailability('refresh');
    } finally { setBusy(false); }
  }

  if (!loaded) return <div class="p-5 text-sm text-ap-muted">{t('loading')}</div>;
  const pageHint = availability === 'loading' || busy ? t('loading')
    : availability === 'unsupported' ? t('pageUnsupported')
    : availability === 'refresh' ? t('pageRefresh') : undefined;

  const hotkeyMode = settings.triggerMode === 'hotkey';

  return (
    <div class="bg-ap-bg text-ap-fg">
      <header class="flex items-center gap-2.5 px-4 pb-1 pt-4">
        {/* The extension's own icon file, so it matches the toolbar exactly. */}
        <img src="/icon/source.svg" alt="" width={30} height={30} class="shrink-0" />
        <span class="text-sm font-semibold">BrowserTranslate</span>
        <button type="button" class="ml-auto rounded-lg p-1.5 text-ap-muted transition-colors hover:bg-ap-fg/5 hover:text-ap-fg"
          aria-label={t('openFullSettings')} title={t('openFullSettings')}
          onClick={() => { void chrome.runtime.openOptionsPage(); window.close(); }}>
          <Settings size={17} />
        </button>
      </header>

      <div class="space-y-3 px-4 py-3">
        {/* The one thing most visits are for: this page, in two languages. */}
        <section class={cn('rounded-[10px] border p-4 transition-colors',
          pageOn ? 'border-ap-brand/40 bg-ap-brand/[0.06]' : 'border-ap-border bg-ap-surface')}>
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-ap-border bg-ap-bg text-ap-muted">
              {site?.icon
                ? <img src={site.icon} alt="" width={20} height={20} onError={() => setSite((s) => s && { host: s.host })} />
                : <Globe size={18} />}
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-xs text-ap-muted">{site?.host ?? t('currentPage')}</div>
              <div class="text-sm font-medium">{t('pageTranslateFull')}</div>
            </div>
            <div class="shrink-0 scale-125">
              <Switch checked={pageOn} onChange={() => void togglePage()} label={t('pageTranslateFull')} hideLabel
                disabled={availability !== 'ready' || busy} />
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 border-t border-ap-border/70 pt-2.5 text-xs">
            {pageHint ? (
              <p role="status" class="leading-relaxed text-ap-muted">{pageHint}</p>
            ) : (
              <span class={cn('flex items-center gap-1.5', pageOn ? 'text-ap-brand' : 'text-ap-muted')}>
                <span class={cn('h-1.5 w-1.5 rounded-full', pageOn ? 'bg-ap-brand' : 'bg-ap-subtle')} />
                {pageOn ? t('pageStateOn') : t('pageStateOff')}
              </span>
            )}
            {hotkeyMode && <span class="ml-auto shrink-0"><Shortcut combo={settings.fullPageHotkey} /></span>}
          </div>
        </section>

        {/* The dub: on for every foreign video, and whose voice. */}
        {settings.dub.enabled && (() => {
          const dub = (patch: Partial<DubSettings>) => updateSettings({ dub: { ...settings.dub, ...patch } });
          const on = settings.dub.autoStart;
          return (
            <section class={cn('rounded-[10px] border p-4 transition-colors',
              on ? 'border-ap-brand/40 bg-ap-brand/[0.06]' : 'border-ap-border bg-ap-surface')}>
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ap-border bg-ap-bg text-ap-muted">
                  <Volume2 size={18} />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">{t('dubPopupTitle')}</div>
                  <div class="text-xs text-ap-muted">{t('dubPopupDesc')}</div>
                </div>
                <div class="shrink-0 scale-125">
                  <Switch checked={on} onChange={(autoStart) => void dub({ autoStart })} label={t('dubPopupTitle')} hideLabel />
                </div>
              </div>
              {CLOUD_TTS && (
                <div class="mt-3 border-t border-ap-border/70 pt-3">
                  <SegmentedControl label={t('dubVoice')} value={settings.dub.voiceURI}
                    options={sameProviderVoices(settings.dub.voiceURI).map((v) => ({
                      value: v.uri,
                      label: `${t(v.gender === 'female' ? 'dubFemale' : 'dubMale')} · ${v.name}`,
                    }))}
                    onChange={(voiceURI) => void dub({ voiceURI })} />
                </div>
              )}
              {/* Louder / quieter, for the dub and for the video under it. */}
              <div class="mt-3 space-y-2 border-t border-ap-border/70 pt-3">
                {(['volume', 'duckVolume'] as const).map((key) => (
                  <div key={key} class="flex items-center justify-between gap-3">
                    <span class="text-xs text-ap-muted">{t(key === 'volume' ? 'dubVolume' : 'dubClipVolume')}</span>
                    <div class="w-32 shrink-0">
                      <NumberControl label={t(key === 'volume' ? 'dubVolume' : 'dubClipVolume')}
                        value={settings.dub[key]} min={0} max={100} step={10}
                        onPreview={() => {}} onCommit={(v) => void dub({ [key]: v })} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        <LanguageSelect value={settings.targetLanguage} onChange={(value) => updateSettings({ targetLanguage: value })} />

        <section class="rounded-[10px] border border-ap-border bg-ap-surface px-4 pb-3 pt-3.5">
          <div class="mb-3 flex items-center gap-2 text-xs font-medium text-ap-muted">
            <Route size={14} />
            {t('sectionRouting')}
          </div>
          <EngineRoutingPicker engines={settings.engines} providers={providers}
            onChange={(next) => updateSettings({ engines: next })} compact />
        </section>
      </div>

      {/* In hotkey mode nothing appears on the page by itself, so say which keys to press. */}
      {hotkeyMode && (
        <footer class="flex items-center gap-2 border-t border-ap-border px-4 py-3 text-2xs text-ap-muted">
          <Shortcut combo={settings.hotkey} />
          <span>{t('surfaceSelection')}</span>
          <span class="text-ap-subtle">·</span>
          <Shortcut combo={settings.fullPageHotkey} />
          <span>{t('surfaceFullPage')}</span>
        </footer>
      )}
    </div>
  );
}
