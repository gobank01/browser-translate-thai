import { collectBlocks } from './collectBlocks';
import { groupIntoBatches } from './scheduler';
import { BilingualInjector } from './inject';
import { PERSONAL_BUILD } from '~/storage/personalPreset';
import { translateBatch, isConfigError } from '~/messaging/client';

const BATCH_LIMITS = { maxSegments: 8, maxChars: 2400 };
const MAX_IN_FLIGHT = 3;
const ROOT_MARGIN = '300px'; // begin translating slightly before the block enters view
const FLUSH_DEBOUNCE_MS = 150;

interface PageTranslatorDeps {
  getTargetLang: () => string;
  strings: { translateFailed: string; retry: string };
}

export interface PageTranslator {
  enable: () => void;
  disable: () => void;
  isOn: () => boolean;
}

export function createPageTranslator(deps: PageTranslatorDeps): PageTranslator {
  let on = false;
  const injector = new BilingualInjector(document, PERSONAL_BUILD);
  const queued = new Set<HTMLElement>(); // visible, awaiting dispatch
  const handled = new Set<HTMLElement>(); // observed (any state) — never re-observe
  let io: IntersectionObserver | null = null;
  let mo: MutationObserver | null = null;
  let flushTimer: number | undefined;
  let inFlight = 0;
  let reqSeq = 0;
  let epoch = 0; // bumped on disable; in-flight dispatches from an old session are dropped

  function observeNew(root: ParentNode) {
    if (!io) return;
    const blocks = collectBlocks(root);
    for (const block of blocks) {
      if (handled.has(block)) continue;
      handled.add(block);
      io.observe(block);
    }
  }

  function onIntersect(entries: IntersectionObserverEntry[]) {
    if (!io) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const block = entry.target as HTMLElement;
      io.unobserve(block);
      if (injector.has(block)) continue;
      injector.placeLoading(block);
      queued.add(block);
    }
    scheduleFlush();
  }

  function scheduleFlush() {
    window.clearTimeout(flushTimer);
    flushTimer = window.setTimeout(flush, FLUSH_DEBOUNCE_MS);
  }

  function flush() {
    if (!on) return;
    if (inFlight >= MAX_IN_FLIGHT) {
      scheduleFlush();
      return;
    }
    const ready = Array.from(queued);
    if (ready.length === 0) return;
    queued.clear();

    const batches = groupIntoBatches(ready, (b) => (b.textContent ?? '').length, BATCH_LIMITS);
    for (const batch of batches) {
      if (inFlight >= MAX_IN_FLIGHT) {
        // re-queue the remainder; a later flush picks it up
        batch.forEach((b) => queued.add(b));
        scheduleFlush();
        continue;
      }
      void dispatch(batch);
    }
  }

  async function dispatch(blocks: HTMLElement[]) {
    inFlight++;
    const myEpoch = epoch;
    const segments = blocks.map((b) => (b.textContent ?? '').trim());
    const requestId = `pageb-${Date.now()}-${++reqSeq}`;
    try {
      const translations = await translateBatch({
        type: 'translate:batch',
        requestId,
        segments,
        targetLang: deps.getTargetLang(),
        surface: 'fullPage',
      });
      if (myEpoch !== epoch) return; // session was torn down (and maybe restarted) — drop stale result
      blocks.forEach((b, i) => injector.setTranslation(b, translations[i] ?? ''));
    } catch (e) {
      if (myEpoch !== epoch) return; // stale failure from a previous session — do not touch the live one
      // A configuration problem says what to change rather than "failed".
      const message = isConfigError(e) ? e.message : deps.strings.translateFailed;
      blocks.forEach((b) => {
        injector.setError(b, message, deps.strings.retry, () => {
          injector.resetToLoading(b);
          queued.add(b);
          scheduleFlush();
        });
      });
    } finally {
      inFlight--;
      if (myEpoch === epoch && queued.size > 0) scheduleFlush();
    }
  }

  function enable() {
    if (on) return;
    on = true;
    io = new IntersectionObserver(onIntersect, { rootMargin: ROOT_MARGIN });
    // Note: blocks removed from the DOM (SPA navigation) stay referenced in `handled`
    // and the injector Map until disable(); bounded retention, acceptable for v0.1.5.
    mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) observeNew(n as Element);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    observeNew(document.body);
  }

  function disable() {
    if (!on) return;
    on = false;
    epoch++;
    window.clearTimeout(flushTimer);
    io?.disconnect();
    io = null;
    mo?.disconnect();
    mo = null;
    queued.clear();
    handled.clear();
    injector.teardown();
  }

  return { enable, disable, isOn: () => on };
}
