import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { TranslationPage } from './pages/TranslationPage';
import { GeneralPage } from './pages/GeneralPage';
import { VideoPage } from './pages/VideoPage';
import { DataPage } from './pages/DataPage';
import { ProvidersPanel } from './pages/ProvidersPanel';
import { Captions, Download, Languages, Settings, Server } from '~/ui/icons';
import { cn } from '~/lib/cn';
import { useT } from '~/i18n';
import { useApplyTheme } from '~/ui/useApplyTheme';
import { useApplyLocale } from '~/ui/useApplyLocale';
import { UpdateCheck, UpdateNotice, useUpdateCheck } from './UpdateCheck';

type Tab = 'general' | 'translation' | 'providers' | 'video' | 'data';
const TABS: readonly Tab[] = ['general', 'translation', 'providers', 'video', 'data'];
const initialTab = (hash: string): Tab => (TABS as readonly string[]).includes(hash) ? hash as Tab : 'general';

export function App() {
  const load = useAppStore((s) => s.load);
  const loaded = useAppStore((s) => s.loaded);
  // A link from the player (e.g. the dub's "how to enable" toast) names a tab.
  const [tab, setTab] = useState<Tab>(() => initialTab(location.hash.slice(1)));
  const t = useT();
  useApplyTheme();
  useApplyLocale();
  // Beside the other header concerns, and before the loading return, because
  // hooks cannot be called conditionally. It reads the manifest and, at most,
  // the result of a check the user asked for earlier.
  const update = useUpdateCheck();
  useEffect(() => { void load(); }, [load]);
  if (!loaded) return <div class="p-8 text-sm text-ap-muted">{t('loading')}</div>;

  const tabs: Array<{ id: Tab; label: string; icon: typeof Settings }> = [
    { id: 'general', label: t('subtitleGeneral'), icon: Settings },
    { id: 'translation', label: t('sectionTranslation'), icon: Languages },
    { id: 'providers', label: t('sectionProviders'), icon: Server },
    { id: 'video', label: t('sectionSubtitles'), icon: Captions },
    { id: 'data', label: t('sectionData'), icon: Download },
  ];
  return (
    <div class="min-h-screen bg-ap-bg text-ap-fg">
      <header class="border-b border-ap-border bg-ap-surface">
        <div class="mx-auto flex max-w-[1040px] items-center gap-3 px-6 py-5">
          <img src="/icon/source.svg" alt="" width={36} height={36} class="shrink-0" />
          <div class="min-w-0">
            <div class="text-base font-semibold">BrowserTranslate</div>
            <h1 class="mt-0.5 text-sm text-ap-muted">{t('settings')}</h1>
          </div>
          <UpdateCheck version={update.version} checking={update.checking} onCheck={() => void update.check()} />
        </div>
      </header>
      <UpdateNotice outcome={update.outcome} />
      <div class="mx-auto flex max-w-[1040px] flex-col gap-6 px-6 py-7 sm:flex-row sm:gap-8">
        <nav aria-label={t('settings')} class="shrink-0 sm:w-40">
          <ul class="flex flex-wrap gap-1 sm:sticky sm:top-6 sm:flex-col">
            {tabs.map((item) => <li key={item.id}>
              <button type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}
                class={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  tab === item.id ? 'bg-ap-brand/10 font-medium text-ap-brand' : 'text-ap-muted hover:bg-ap-fg/5 hover:text-ap-fg')}>
                <item.icon size={17} class="shrink-0" /><span>{item.label}</span>
              </button>
            </li>)}
          </ul>
        </nav>
        <main class="min-w-0 flex-1">
          {tab === 'general' && <GeneralPage />}
          {tab === 'translation' && <TranslationPage />}
          {tab === 'providers' && <ProvidersPanel />}
          {tab === 'video' && <VideoPage />}
          {tab === 'data' && <DataPage />}
        </main>
      </div>
    </div>
  );
}
