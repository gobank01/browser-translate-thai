import { StorageClient } from '~/storage/client';
import { CacheStore } from '~/storage/cacheStore';
import { OpenAICompatibleProvider } from '~/core/providers/openai';
import {
  llmRequestConfig,
  isProviderReady,
  resolveRequestedRoute,
} from '~/core/providers/resolve';
import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import { routeConfig, routeProblem, type RouteProblem } from '~/core/engines/routing';
import { TranslationProviderError } from '~/core/providers/types';
import { computeCacheKey } from '~/core/cache/key';
import { getMtEngine, isMtEngineId, mtTranslateAll, type MtEngineId } from '~/core/mt';
import { selectionUserPrompt, textSystemPrompt } from '~/core/prompt/style';
import { selectionTask } from '~/core/selection/route';
import { selectionSystemPrompt } from '~/core/selection/prompt';
import { InvalidModelOutputError, responseCachePrompt, runSelection, SelectionStreamGate, validateSelectionResult, type ResultFormat } from '~/core/selection/response';
import { resolveBasePrompt } from '~/core/prompt/templates';
import { batchSystemPrompt, batchUserPrompt } from '~/core/batch/prompt';
import { clipKey, getClip, putClip } from '~/core/dub/audioCache';
import { modelFor, synthesize } from '~/core/dub/cloudTts';
import { guessGender, rememberChannelVoice, voiceForChannel, type ChannelVoices } from '~/core/dub/channelVoice';
import { PERSONAL_BUILD, PRESET_MODEL } from '~/storage/personalPreset';

/** Per-channel dub voices, kept apart from app:data so changing one rebuilds nothing. */
const CHANNELS_KEY = 'dub:channels';
const channelStore = {
  load: async () => ((await chrome.storage.local.get(CHANNELS_KEY))[CHANNELS_KEY] ?? {}) as ChannelVoices,
  save: (all: ChannelVoices) => chrome.storage.local.set({ [CHANNELS_KEY]: all }),
};
import { parseBatchArray } from '~/core/batch/parse';
import { runBatch } from '~/core/batch/runBatch';
import { languageName, normalizeTargetLanguage } from '~/core/language/targets';
import { t as i18nT, resolveLocale } from '~/i18n';
import { fetchLatestRelease } from '~/core/update/github';
import { isUpdateAvailable } from '~/core/update/version';
import type { CloudTtsResponse, Request, TranslateRequest, TranslateBatchRequest } from '~/messaging/types';

const WATCHLOG_HOST = 'com.bizdrive.watchlog';

/**
 * One dub line from a cloud voice (GPT Audio Mini or ElevenLabs), cached on
 * disk so a line is paid for once. Keys are baked in at build time from
 * .env.local and stay in the background.
 */
async function cloudTts(text: string, voiceURI: string): Promise<CloudTtsResponse> {
  const cacheKey = clipKey(voiceURI, modelFor(voiceURI), text);
  const cached = await getClip(cacheKey);
  if (cached) return { ok: true, url: cached };
  try {
    const url = await synthesize(voiceURI, text, {
      openrouter: import.meta.env.WXT_OPENROUTER_KEY,
      elevenlabs: import.meta.env.WXT_ELEVENLABS_KEY,
    });
    await putClip(cacheKey, url);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Parallel requests the free engines get per batch — they are far cheaper and
 *  faster per call than an LLM, so a page fills in noticeably sooner. */
const MT_BATCH_CONCURRENCY = 4;

export default defineBackground(() => {
  const client = new StorageClient();
  const activeAborts = new Map<string, AbortController>();

  chrome.runtime.onMessage.addListener((msg: Request, _sender, sendResponse) => {
    if (msg.type === 'dub:voice') {
      const key = import.meta.env.WXT_OPENROUTER_KEY;
      void voiceForChannel(msg.video, msg.current, {
        ...channelStore,
        guess: (video) => (key ? guessGender(video, key, PRESET_MODEL) : Promise.resolve(undefined)),
      }).then((voiceURI) => sendResponse({ voiceURI }), () => sendResponse({ voiceURI: null }));
      return true; // async response
    }
    if (msg.type === 'dub:remember') {
      void rememberChannelVoice(msg.channelId, msg.voiceURI, channelStore);
      return false;
    }
    if (msg.type === 'watch:log') {
      // Written into a folder of notes by a native host on this Mac
      // (watchlog/). Without the host installed this quietly fails.
      if (import.meta.env.WXT_WATCHLOG) {
        void chrome.runtime.sendNativeMessage(WATCHLOG_HOST, msg.record).catch(() => {});
      }
      return false;
    }
    if (msg.type === 'tts:cloud') {
      void cloudTts(msg.text, msg.voiceId).then(sendResponse);
      return true; // async response
    }
    if (msg.type === 'options:open') {
      // A content script cannot open extension pages itself. The tab goes in the
      // hash, which the settings page reads to decide where to start.
      void chrome.tabs.create({ url: chrome.runtime.getURL(`/options.html#${msg.tab}`) });
      return false;
    }
    if (msg.type === 'translate:abort') {
      activeAborts.get(msg.requestId)?.abort();
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'translate') {
      void handleTranslate(msg, _sender, client, activeAborts);
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'translate:batch') {
      void handleTranslateBatch(msg, _sender, client, activeAborts);
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'ping') {
      void handlePing(msg.requestId, msg.provider, client);
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'update:check') {
      void handleUpdateCheck(msg.requestId, client);
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  chrome.alarms.create('cache-evict', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cache-evict') {
      const data = await client.loadAppData();
      if (data.settings.cacheEnabled) {
        await new CacheStore(client, data.settings.cacheTTLDays).evictExpired();
      }
    }
  });
});

async function handleTranslate(
  msg: TranslateRequest,
  sender: chrome.runtime.MessageSender,
  client: StorageClient,
  activeAborts: Map<string, AbortController>,
): Promise<void> {
  const data = await client.loadAppData();
  const send = replyTo(sender);

  try {
    // Routing decides unless the request named someone — the card can send a
    // reader's on-the-spot choice, which lasts exactly as long as that card.
    // A route that is not configured is refused, never redirected.
    const route = resolveRequestedRoute(
      { provider: msg.provider, model: msg.model },
      data.settings.engines.selection,
      data.providers,
    );
    const problem = routeProblem(route, data.providers);
    if (problem || !route) {
      send({
        type: 'translate:error',
        requestId: msg.requestId,
        message: routeProblemMessage(problem ?? 'unset', data.settings.uiLanguage),
        kind: 'config',
      });
      return;
    }
    const engine: ProviderId = route.provider;
    // The row with the route's model in place, so the request, the cache key
    // and the readiness check below all agree on which model this is.
    const cfg = routeConfig(route, data.providers);
    // The guard, not a `kind` comparison: this one narrows `engine` to an
    // MtEngineId for the getMtEngine calls below. The registry lists exactly
    // the free engines as services, and a test holds the two lists together.
    const useMt = isMtEngineId(engine);
    if (!isProviderReady(engine, cfg)) {
      const locale = resolveLocale(
        data.settings.uiLanguage,
        typeof navigator !== 'undefined' ? navigator.language : 'en',
      );
      send({
        type: 'translate:error',
        requestId: msg.requestId,
        message: i18nT('noProfileError', locale),
        kind: 'auth',
      });
      return;
    }
    const targetLang = normalizeTargetLanguage(msg.targetLang ?? data.settings.targetLanguage);
    const task = selectionTask(msg.text);
    const basePrompt = resolveBasePrompt(data.settings.prompts);
    const systemPrompt = useMt ? undefined : selectionSystemPrompt(task, targetLang, basePrompt);

    let cacheKey: string | undefined;
    if (data.settings.cacheEnabled) {
      cacheKey = await computeCacheKey({
        text: msg.text, engine, model: cfg.model,
        mode: 'selection', targetLang,
        prompt: systemPrompt ? responseCachePrompt(systemPrompt) : undefined,
      });
      // A refresh still writes its result back — it is asking past the cache,
      // not asking for the answer to go unremembered.
      const cached = msg.refresh
        ? undefined
        : await new CacheStore(client, data.settings.cacheTTLDays).get(cacheKey);
      if (cached !== undefined) {
        const result = useMt ? { full: cached, format: 'text' as const } : validateSelectionResult(cached, msg.text, task);
        if (result) {
          if (result.format === 'text') send({ type: 'translate:chunk', requestId: msg.requestId, delta: result.full });
          send({ type: 'translate:done', requestId: msg.requestId, ...result, cached: true });
          return;
        }
      }
    }

    const abortCtl = new AbortController();
    activeAborts.set(msg.requestId, abortCtl);

    let full = '';
    let format: ResultFormat = 'text';
    try {
      if (useMt) {
        // No streaming to relay: deliver the finished text as a single chunk,
        // the same shape the cache-hit path above already sends.
        await withRetry(async () => {
          const [translated] = await getMtEngine(engine).translate({
            texts: [msg.text],
            targetLang,
            signal: abortCtl.signal,
          });
          full = translated ?? '';
        });
        if (full) send({ type: 'translate:chunk', requestId: msg.requestId, delta: full });
      } else {
        const provider = new OpenAICompatibleProvider(llmRequestConfig(engine, cfg));
        const result = await runSelection(msg.text, task, async (mode, repair) => {
          let raw = '';
          await withRetry(async () => {
            abortCtl.signal.throwIfAborted();
            // Each attempt replaces, rather than appends to, the previous stream.
            send({ type: 'translate:reset', requestId: msg.requestId });
            raw = '';
            const gate = new SelectionStreamGate();
            for await (const chunk of provider.translate({
              systemPrompt: selectionSystemPrompt(mode, targetLang, basePrompt, repair),
              userPrompt: selectionUserPrompt(msg.text, languageName(targetLang)),
              stream: true,
              signal: abortCtl.signal,
            })) {
              raw += chunk.delta;
              const visible = gate.push(chunk.delta);
              if (visible) send({ type: 'translate:chunk', requestId: msg.requestId, delta: visible });
            }
          });
          return raw;
        }, abortCtl.signal);
        full = result.full;
        format = result.format;
      }
    } finally {
      activeAborts.delete(msg.requestId);
    }

    if (cacheKey && full) {
      await new CacheStore(client, data.settings.cacheTTLDays).set(cacheKey, full);
    }

    send({ type: 'translate:done', requestId: msg.requestId, full, format, cached: false });
  } catch (e) {
    send({ type: 'translate:error', requestId: msg.requestId, ...translationErrorReply(e, data.settings.uiLanguage) });
  }
}

const ROUTE_PROBLEM_MESSAGE = {
  unset: 'errorNoEngine',
  'provider-off': 'errorProviderOff',
  'model-missing': 'errorModelMissing',
} as const;

/** What to tell the reader when a surface cannot be translated as configured. */
function routeProblemMessage(problem: RouteProblem, uiLanguage: string): string {
  const locale = resolveLocale(uiLanguage, typeof navigator !== 'undefined' ? navigator.language : 'en');
  return i18nT(ROUTE_PROBLEM_MESSAGE[problem], locale);
}

/**
 * The message and kind a failed translation is reported with. A model the
 * provider no longer offers is a configuration problem like a removed one:
 * the mode is not configured until the user chooses another model.
 */
function translationErrorReply(error: unknown, uiLanguage: string): { message: string; kind: string } {
  const locale = () => resolveLocale(uiLanguage, typeof navigator !== 'undefined' ? navigator.language : 'en');
  if (error instanceof InvalidModelOutputError) {
    return { message: i18nT('invalidModelOutput', locale()), kind: 'parse' };
  }
  if (error instanceof TranslationProviderError) {
    if (error.info.kind === 'model-gone') {
      return { message: `${i18nT('errorModelGone', locale())} (${error.message})`, kind: 'config' };
    }
    return { message: error.message, kind: error.info.kind };
  }
  return { message: error instanceof Error ? error.message : String(error), kind: 'unknown' };
}

async function handleTranslateBatch(
  msg: TranslateBatchRequest,
  sender: chrome.runtime.MessageSender,
  client: StorageClient,
  activeAborts: Map<string, AbortController>,
): Promise<void> {
  const data = await client.loadAppData();
  const send = replyTo(sender);

  try {
    const route = data.settings.engines[msg.surface];
    const problem = routeProblem(route, data.providers);
    if (problem || !route) {
      send({
        type: 'translate:batch:error',
        requestId: msg.requestId,
        message: routeProblemMessage(problem ?? 'unset', data.settings.uiLanguage),
        kind: 'config',
      });
      return;
    }
    const engine: ProviderId = route.provider;
    const cfg = routeConfig(route, data.providers);
    // The guard, not a `kind` comparison: this one narrows `engine` to an
    // MtEngineId for the getMtEngine calls below. The registry lists exactly
    // the free engines as services, and a test holds the two lists together.
    const useMt = isMtEngineId(engine);
    if (!isProviderReady(engine, cfg)) {
      const locale = resolveLocale(
        data.settings.uiLanguage,
        typeof navigator !== 'undefined' ? navigator.language : 'en',
      );
      send({
        type: 'translate:batch:error',
        requestId: msg.requestId,
        message: i18nT('noProfileError', locale),
        kind: 'auth',
      });
      return;
    }
    const targetLang = normalizeTargetLanguage(msg.targetLang ?? data.settings.targetLanguage);
    const systemPrompt = useMt ? undefined : batchSystemPrompt(targetLang, resolveBasePrompt(data.settings.prompts), msg.surface, PERSONAL_BUILD);

    // One AbortController for the whole batch request: runBatch may call
    // translateOnce many times (the batch call plus per-segment fallback), and
    // they all share this controller — one requestId is one user-cancellable
    // unit, so a single translate:abort cancels the entire page translation.
    const abortCtl = new AbortController();
    activeAborts.set(msg.requestId, abortCtl);

    // Batch responses must align by id and contain valid text. A broken batch
    // gets explicit text-only requests, never a raw-response fallback.
    const translateOnce = useMt
      ? async (segments: string[]) => {
          const parsed = await withRetry(() =>
            mtTranslateAll(
              getMtEngine(engine),
              { texts: segments, targetLang, signal: abortCtl.signal },
              MT_BATCH_CONCURRENCY,
            ),
          );
          return parsed;
        }
      : (() => {
          const provider = new OpenAICompatibleProvider(llmRequestConfig(engine, cfg));
          return async (segments: string[]) => {
            let raw = '';
            await withRetry(async () => {
              raw = '';
              for await (const chunk of provider.translate({
                systemPrompt: systemPrompt!,
                userPrompt: batchUserPrompt(segments, languageName(targetLang)),
                stream: false,
                signal: abortCtl.signal,
              })) {
                raw += chunk.delta;
              }
            });
            const parsed = parseBatchArray(raw, segments.length);
            return parsed && parsed.every((text, index) => validateSelectionResult(text, segments[index]!, 'translate'))
              ? parsed : null;
          };
        })();

    const translateSingle = async (segment: string): Promise<string> => {
      abortCtl.signal.throwIfAborted();
      if (useMt) {
        const results = await withRetry(() => getMtEngine(engine).translate({ texts: [segment], targetLang, signal: abortCtl.signal }));
        if (results[0] === undefined) throw new InvalidModelOutputError();
        return results[0];
      }
      const provider = new OpenAICompatibleProvider(llmRequestConfig(engine, cfg));
      let raw = '';
      await withRetry(async () => {
        abortCtl.signal.throwIfAborted();
        raw = '';
        for await (const chunk of provider.translate({
          systemPrompt: textSystemPrompt(targetLang, resolveBasePrompt(data.settings.prompts)) +
            `\nTranslate this one ${msg.surface === 'subtitle' ? 'subtitle' : 'web page'} segment as plain text, without a batch envelope.`,
          userPrompt: selectionUserPrompt(segment, languageName(targetLang)),
          stream: false, signal: abortCtl.signal,
        })) raw += chunk.delta;
      });
      const result = validateSelectionResult(raw, segment, 'translate');
      if (!result) throw new InvalidModelOutputError();
      return result.full;
    };

    const cacheStore = new CacheStore(client, data.settings.cacheTTLDays);
    const cacheEnabled = data.settings.cacheEnabled;

    const deps = {
      cacheGet: async (segment: string) => {
        if (!cacheEnabled) return undefined;
        const key = await computeCacheKey({
          text: segment,
          engine,
          model: cfg.model,
          mode: 'fullpage',
          targetLang,
          prompt: systemPrompt ? responseCachePrompt(systemPrompt) : undefined,
        });
        const cached = await cacheStore.get(key);
        return cached !== undefined && (useMt || validateSelectionResult(cached, segment, 'translate')) ? cached : undefined;
      },
      cacheSet: async (segment: string, translated: string) => {
        if (!cacheEnabled || !translated) return;
        const key = await computeCacheKey({
          text: segment,
          engine,
          model: cfg.model,
          mode: 'fullpage',
          targetLang,
          prompt: systemPrompt ? responseCachePrompt(systemPrompt) : undefined,
        });
        await cacheStore.set(key, translated);
      },
      translateOnce,
      translateSingle,
    };

    let translations: string[];
    try {
      translations = await runBatch(msg.segments, deps);
    } finally {
      activeAborts.delete(msg.requestId);
    }

    send({ type: 'translate:batch:done', requestId: msg.requestId, translations });
  } catch (e) {
    send({ type: 'translate:batch:error', requestId: msg.requestId, ...translationErrorReply(e, data.settings.uiLanguage) });
  }
}

/**
 * Send back to whoever asked.
 *
 * The frame matters now that subtitle translation runs in subframes: a tab
 * message with no frame named is delivered to every frame in the tab, so one
 * Canvas page with two recordings would have each frame sifting the other's
 * chunks out of its own stream. Naming the frame keeps each conversation to the
 * two ends that are having it.
 */
function replyTo(sender: chrome.runtime.MessageSender): (payload: object) => void {
  const tabId = sender.tab?.id;
  const frameId = sender.frameId;
  return (payload: object) => {
    if (tabId === undefined) {
      chrome.runtime.sendMessage(payload).catch(() => {});
      return;
    }
    const options = frameId === undefined ? undefined : { frameId };
    chrome.tabs.sendMessage(tabId, payload, options).catch(() => {});
  };
}

async function handlePing(
  requestId: string,
  provider: ProviderId,
  client: StorageClient,
): Promise<void> {
  const data = await client.loadAppData();
  const cfg = data.providers[provider];
  const send = (payload: object) => {
    chrome.runtime.sendMessage(payload).catch(() => {});
  };

  // The caller names what to probe. With a provider per surface there is no
  // single "the API" left to guess at, and each row on the Providers page
  // reports on itself.
  if (isMtEngineId(provider)) {
    await pingMtEngine(provider, requestId, send);
    return;
  }

  if (!cfg.baseUrl) {
    send({ type: 'ping:error', requestId, message: 'Base URL is empty' });
    return;
  }
  if (PROVIDERS[provider].needsKey && !cfg.apiKey) {
    send({ type: 'ping:error', requestId, message: 'API Key is empty' });
    return;
  }

  const endpoint = cfg.baseUrl.replace(/\/+$/, '') + '/models';
  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), 10000);
  const startedAt = Date.now();

  try {
    const headers: Record<string, string> = { ...PROVIDERS[provider].requiredHeaders };
    if (cfg.apiKey) {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: ctl.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const j = await response.json();
        if (j?.error?.message) detail = String(j.error.message).slice(0, 200);
      } catch { /* not JSON */ }
      send({ type: 'ping:error', requestId, status: response.status, message: detail });
      return;
    }

    let availableModels: string[] = [];
    try {
      const json = await response.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
      availableModels = list
        .map((m: { id?: string; name?: string }) => m.id ?? m.name ?? '')
        .filter((s: string) => s.length > 0);
    } catch {
      // response was 200 but not parseable as JSON — still considered ok
    }

    let modelInList: boolean | null = null;
    if (cfg.model) {
      if (availableModels.length > 0) {
        const wanted = cfg.model.toLowerCase();
        modelInList = availableModels.some((id) => id.toLowerCase() === wanted);
      }
      // else: list empty / unparseable → null (can't determine)
    }

    send({
      type: 'ping:ok',
      requestId,
      latencyMs,
      availableModels,
      modelInList,
      configuredModel: cfg.model,
    });
  } catch (e) {
    clearTimeout(timeout);
    const msg = (e as Error).name === 'AbortError' ? 'Timeout' : (e as Error).message || 'Network error';
    send({ type: 'ping:error', requestId, message: msg });
  }
}

/**
 * Reachability probe for a free engine: translate one short word and time it.
 * These endpoints have no status page and no /models to ask, and one of them
 * may be unreachable on a given network — an actual round trip is the only
 * honest way to report ready vs offline.
 */
async function pingMtEngine(
  engineId: MtEngineId,
  requestId: string,
  send: (payload: object) => void,
): Promise<void> {
  const engine = getMtEngine(engineId);
  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), 8000);
  const startedAt = Date.now();
  try {
    const [translated] = await engine.translate({
      texts: ['hello'],
      targetLang: 'zh-CN',
      sourceLang: 'en',
      signal: ctl.signal,
    });
    clearTimeout(timeout);
    if (!translated) {
      send({ type: 'ping:error', requestId, message: `${engine.label}: empty response` });
      return;
    }
    send({
      type: 'ping:ok',
      requestId,
      latencyMs: Date.now() - startedAt,
      availableModels: [],
      modelInList: true,
      configuredModel: engine.label,
    });
  } catch (e) {
    clearTimeout(timeout);
    const message = (e as Error).name === 'AbortError'
      ? 'Timeout'
      : (e as Error).message || 'Network error';
    send({ type: 'ping:error', requestId, message });
  }
}

async function withRetry<T>(fn: () => Promise<T>, max = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!(e instanceof TranslationProviderError) || !e.info.retryable) throw e;
      const backoff = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

/**
 * Ask GitHub what the newest release is, and remember the answer.
 *
 * Only ever because somebody pressed the button. Chrome cannot update this
 * extension for us — self-hosting installs only under enterprise policy on
 * Windows and macOS, and an unpacked extension is never updated at all — so
 * saying that a release exists is the whole of what can be done here, and doing
 * that unasked would be an outbound request buying nothing the reader could not
 * have had by asking.
 */
async function handleUpdateCheck(requestId: string, client: StorageClient): Promise<void> {
  // The asker may have closed the page while we were waiting on the network,
  // and a reply with nobody left to hear it is not an error worth raising.
  const send = (payload: object) => {
    chrome.runtime.sendMessage(payload).catch(() => {});
  };
  try {
    // Build-time constant: a Firefox build looks for the .xpi, every other
    // build — Chrome's zip also installs in Edge — for the Chromium zip.
    const release = await fetchLatestRelease(fetch, undefined, import.meta.env.BROWSER === 'firefox' ? 'firefox' : 'chromium');
    const available = isUpdateAvailable(release.tag, chrome.runtime.getManifest().version);
    await client.saveUpdateState({
      lastCheckedAt: Date.now(),
      latestTag: release.tag,
      releaseUrl: release.url,
      downloadUrl: release.downloadUrl,
    });
    send({
      type: 'update:result',
      requestId,
      latestTag: release.tag,
      updateAvailable: available,
      releaseUrl: release.url,
      downloadUrl: release.downloadUrl,
    });
  } catch (e) {
    send({
      type: 'update:error',
      requestId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
