import { useEffect, useRef, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { Button } from '~/ui/components/Button';
import { NumberControl } from '~/ui/components/NumberControl';
import { ColorControl } from '~/ui/components/ColorControl';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { useLocale, useT } from '~/i18n';
import { Captions, RotateCcw } from '~/ui/icons';
import { DubCard } from './DubCard';
import {
  DEFAULT_SUBTITLE_STYLE, SUBTITLE_FONT_FAMILY_IDS, SUBTITLE_FONT_FAMILIES,
  MIN_SUBTITLE_FONT_SCALE, MAX_SUBTITLE_FONT_SCALE,
  clampSubtitleBackgroundOpacity, clampSubtitleFontScale, clampSubtitleFontWeight,
  showsOriginal, showsTranslation,
  type SubtitleStyle, type SubtitleTextStyle, type SubtitleFontFamily,
} from '~/core/subtitles/style';

/** Every continuous value uses the same range as the player, not a preset-only select. */
export function VideoPage() {
  const stored = useAppStore((s) => s.data.settings.subtitleStyle);
  const update = useAppStore((s) => s.updateSettings);
  const [style, setStyle] = useState(stored);
  const [saveError, setSaveError] = useState(false);
  const latest = useRef(style);
  const committed = useRef(stored);
  const ownWrites = useRef(new WeakSet<SubtitleStyle>());
  const queue = useRef(Promise.resolve());
  const t = useT();
  const locale = useLocale();
  useEffect(() => {
    // A late storage acknowledgement must not overwrite a more recent preview.
    if (ownWrites.current.has(stored)) return;
    latest.current = stored;
    committed.current = stored;
    setStyle(stored);
  }, [stored]);

  function apply(patch: Partial<SubtitleStyle>, save = true) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setStyle(next);
    if (!save || JSON.stringify(next) === JSON.stringify(committed.current)) return;
    committed.current = next;
    ownWrites.current.add(next);
    // Serialize committed snapshots, keeping rapid changes to different fields.
    queue.current = queue.current.then(async () => {
      try {
        await update({ subtitleStyle: next });
        setSaveError(false);
      } catch {
        if (committed.current === next) committed.current = stored;
        setSaveError(true);
      }
    });
  }
  function textStyle(which: 'main' | 'translation', patch: Partial<SubtitleTextStyle>, save = true) {
    apply({ [which]: { ...latest.current[which], ...patch } }, save);
  }
  const fontLabels: Record<SubtitleFontFamily, string> = {
    youtube: t('subtitleFontDefault'), sans: 'Noto Sans', serif: 'Source Han Serif',
  };
  const columns = ['main', 'translation'] as const;
  const labelFor = (which: 'main' | 'translation', field: string) =>
    `${t(which === 'main' ? 'subtitleMainLine' : 'subtitleTranslationLine')} · ${field}`;
  const originalFirst = style.translationPosition !== 'above';
  const lineOrder = originalFirst ? columns : ['translation', 'main'] as const;
  const cjkSerif = locale === 'ja' ? "'Source Han Serif', 'Noto Serif CJK JP', serif"
    : locale === 'ko' ? "'Source Han Serif K', 'Noto Serif CJK KR', serif"
    : locale === 'zh-TW' ? "'Source Han Serif TC', 'Noto Serif CJK TC', serif"
    : "'Source Han Serif SC', 'Noto Serif CJK SC', serif";

  return (
    <div class="space-y-5">
      <div class="flex items-baseline justify-between gap-3">
        <SectionHeader icon={Captions} label={t('sectionSubtitles')} />
        <Button variant="secondary" size="sm" onClick={() => apply(DEFAULT_SUBTITLE_STYLE)}><RotateCcw size={13} />{t('subtitleReset')}</Button>
      </div>
      <figure class="ap-subtitle-preview" aria-label={t('subtitlePreview')} style={{ '--bt-cjk-serif': cjkSerif }}>
        <figcaption>{t('subtitlePreview')}</figcaption>
        <div class="ap-subtitle-preview-plate" style={{ background: `rgba(0, 0, 0, ${style.backgroundOpacity / 100})` }}>
          {lineOrder.map((which) => {
            if (which === 'main' ? !showsOriginal(style.displayMode) : !showsTranslation(style.displayMode)) return null;
            const text = style[which];
            return <div key={which} data-preview-line={which} dir="auto" lang={which === 'main' ? 'en' : locale}
              style={{ fontSize: `${18 * text.fontScale / 100}px`, color: text.color,
                fontWeight: text.fontWeight, fontFamily: SUBTITLE_FONT_FAMILIES[text.fontFamily] }}>
              {t(which === 'main' ? 'subtitlePreviewOriginal' : 'subtitlePreviewTranslation')}
            </div>;
          })}
        </div>
      </figure>
      <section class="ap-settings-panel">
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('subtitleDisplayMode')}</span>
          <SegmentedControl label={t('subtitleDisplayMode')} value={style.displayMode}
            options={[{ value: 'bilingual', label: t('subtitleDisplayBilingual') },
              { value: 'originalOnly', label: t('subtitleDisplayOriginalOnly') },
              { value: 'translationOnly', label: t('subtitleDisplayTranslationOnly') }]}
            onChange={(displayMode) => apply({ displayMode })} />
        </div>
        {style.displayMode === 'bilingual' && <div class="ap-subtitle-setting">
          <span class="text-sm">{t('subtitleTranslationPosition')}</span>
          <SegmentedControl label={t('subtitleTranslationPosition')} value={style.translationPosition}
            options={[{ value: 'above', label: t('subtitlePositionAbove') }, { value: 'below', label: t('subtitlePositionBelow') }]}
            onChange={(translationPosition) => apply({ translationPosition })} />
        </div>}
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('subtitleBackgroundOpacity')}</span>
          <div class="flex min-w-0 items-center gap-3">
            <input type="range" min="0" max="100" step="1" aria-label={t('subtitleBackgroundOpacity')}
              value={style.backgroundOpacity} class="w-28 max-w-full accent-ap-brand"
              onInput={(e) => apply({ backgroundOpacity: clampSubtitleBackgroundOpacity(Number(e.currentTarget.value)) }, false)}
              onChange={(e) => apply({ backgroundOpacity: clampSubtitleBackgroundOpacity(Number(e.currentTarget.value)) })} />
            <div class="w-20"><NumberControl label={t('subtitleBackgroundOpacity')} value={style.backgroundOpacity} min={0} max={100} buttons={false}
              onPreview={(v) => apply({ backgroundOpacity: v }, false)} onCommit={(v) => apply({ backgroundOpacity: v })} /></div>
          </div>
        </div>
      </section>
      <section class="ap-settings-panel">
        <div class="ap-subtitle-grid">
          <span aria-hidden="true" />
          {columns.map((which) => <h3 key={which} class="text-sm font-semibold">{t(which === 'main' ? 'subtitleMainLine' : 'subtitleTranslationLine')}</h3>)}
          <span class="text-sm text-ap-muted">{t('subtitleFontScale')}</span>
          {columns.map((which) => <NumberControl key={`size-${which}`} label={labelFor(which, t('subtitleFontScale'))}
            value={style[which].fontScale} min={MIN_SUBTITLE_FONT_SCALE} max={MAX_SUBTITLE_FONT_SCALE}
            onPreview={(v) => textStyle(which, { fontScale: clampSubtitleFontScale(v) }, false)}
            onCommit={(v) => textStyle(which, { fontScale: clampSubtitleFontScale(v) })} />)}
          <span class="text-sm text-ap-muted">{t('subtitleFontWeight')}</span>
          {columns.map((which) => <Select key={`weight-${which}`} aria-label={labelFor(which, t('subtitleFontWeight'))} value={String(style[which].fontWeight)}
            options={[300, 400, 500, 600, 700].map((v) => ({ value: String(v), label: String(v) }))}
            onChange={(e) => textStyle(which, { fontWeight: clampSubtitleFontWeight(Number(e.currentTarget.value)) })} />)}
          <span class="text-sm text-ap-muted">{t('subtitleFontFamily')}</span>
          {columns.map((which) => <Select key={`font-${which}`} aria-label={labelFor(which, t('subtitleFontFamily'))} value={style[which].fontFamily}
            options={SUBTITLE_FONT_FAMILY_IDS.map((id) => ({ value: id, label: fontLabels[id] }))}
            onChange={(e) => textStyle(which, { fontFamily: e.currentTarget.value as SubtitleFontFamily })} />)}
          <span class="text-sm text-ap-muted">{t('subtitleColor')}</span>
          {columns.map((which) => <ColorControl key={`color-${which}`} label={labelFor(which, t('subtitleColor'))} value={style[which].color}
            onPreview={(color) => textStyle(which, { color }, false)} onCommit={(color) => textStyle(which, { color })} />)}
        </div>
      </section>
      <DubCard />
      {saveError && <p role="alert" class="text-sm text-ap-danger">{t('promptSaveFailed')}</p>}
    </div>
  );
}
