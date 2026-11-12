import {
  BT_REQ,
  BT_RES,
  BT_FETCH_REQ,
  BT_FETCH_RES,
  type CaptionTrack,
  type TranscriptRequest,
  type TranscriptResponse,
  type VideoDetails,
  BT_AUDIO_REQ,
  BT_AUDIO_RES,
  type AudioTrackRequest,
  type AudioTrackResponse,
} from './content/videoSubs/bridgeProtocol';

/**
 * MAIN-world bridge (page context). Two jobs:
 *  1. BT_REQ  → read the player's caption track list + the active displayed track.
 *  2. BT_FETCH_REQ → fetch the transcript for a language via YouTube's Innertube API
 *     using the ANDROID client context. The web client's caption baseUrls require a
 *     poToken (returning empty bodies); the ANDROID client's baseUrls do not. This
 *     is how mature tools fetch captions post-poToken. No request interception, so
 *     the player's own captions are never disturbed.
 */
export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    function readInnertubeKey(): string {
      try {
        const cfg = (window as unknown as { ytcfg?: { get?: (k: string) => unknown } }).ytcfg;
        const k = cfg?.get?.('INNERTUBE_API_KEY');
        if (typeof k === 'string' && k) return k;
      } catch {
        /* ignore */
      }
      const m = document.documentElement.innerHTML.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      return m?.[1] ?? '';
    }

    interface ItTrack {
      baseUrl?: string;
      languageCode?: string;
      kind?: string;
    }

    async function fetchTranscriptViaInnertube(lang: string): Promise<string> {
      const videoId = new URLSearchParams(location.search).get('v');
      if (!videoId) throw new Error('no videoId in URL');
      const key = readInnertubeKey();
      if (!key) throw new Error('no INNERTUBE_API_KEY');

      const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en' } },
          videoId,
        }),
      });
      const data = (await playerRes.json()) as {
        captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: ItTrack[] } };
      };
      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      const inLang = tracks.filter((t) => t.languageCode === lang);
      const track = inLang.find((t) => t.kind !== 'asr') ?? inLang[0] ?? tracks[0];
      if (!track?.baseUrl) throw new Error(`no innertube caption track for lang ${lang}`);

      const url = track.baseUrl.replace(/&fmt=\w+$/, '') + '&fmt=json3';
      const tr = await fetch(url);
      const body = await tr.text();
      return body;
    }

    window.addEventListener('message', (e) => {
      const ds = (e.data as { source?: string })?.source;
      if (e.source !== window) return;

      // Transcript fetch via Innertube (ANDROID client → no poToken needed).
      if (ds === BT_FETCH_REQ) {
        const { id, lang } = e.data as TranscriptRequest;
        fetchTranscriptViaInnertube(lang)
          .then((body) =>
            window.postMessage({ source: BT_FETCH_RES, id, body } as TranscriptResponse, '*'),
          )
          .catch((err) =>
            window.postMessage(
              { source: BT_FETCH_RES, id, body: '', error: String(err) } as TranscriptResponse,
              '*',
            ),
          );
        return;
      }

      // YouTube's own dubbed audio tracks. The track objects are minified, so
      // the language is found by shape: the one property that holds an `id`
      // like "th.3".
      if (ds === BT_AUDIO_REQ) {
        const { id, lang } = e.data as AudioTrackRequest;
        const pl = document.getElementById('movie_player') as (HTMLElement & {
          getAvailableAudioTracks?: () => unknown[];
          getAudioTrack?: () => unknown;
          setAudioTrack?: (t: unknown) => void;
        }) | null;
        const langOf = (track: unknown): string => {
          for (const v of Object.values((track ?? {}) as Record<string, unknown>)) {
            const inner = v as { id?: unknown } | null;
            if (inner && typeof inner === 'object' && typeof inner.id === 'string' && /^[\w-]+\.\d+$/.test(inner.id)) {
              return inner.id.split('.')[0]!.split('-')[0]!.toLowerCase();
            }
          }
          return '';
        };
        let result: AudioTrackResponse['result'] = 'none';
        try {
          if (langOf(pl?.getAudioTrack?.()) === lang) result = 'already';
          else {
            const match = (pl?.getAvailableAudioTracks?.() ?? []).find((t) => langOf(t) === lang);
            if (match && pl?.setAudioTrack) { pl.setAudioTrack(match); result = 'switched'; }
          }
        } catch { /* a player without the API: nothing to switch */ }
        window.postMessage({ source: BT_AUDIO_RES, id, result } as AudioTrackResponse, '*');
        return;
      }

      if (ds !== BT_REQ) return;

      const player = document.getElementById('movie_player') as
        | (HTMLElement & {
            getPlayerResponse?: () => unknown;
            getOption?: (module: string, option: string) => unknown;
          })
        | null;
      const pr =
        (player?.getPlayerResponse?.() as Record<string, unknown> | undefined) ??
        (window as unknown as { ytInitialPlayerResponse?: Record<string, unknown> }).ytInitialPlayerResponse ??
        {};

      const captions =
        (pr as { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown[] } } }).captions
          ?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      const isLive = Boolean((pr as { videoDetails?: { isLiveContent?: boolean } }).videoDetails?.isLiveContent);

      const tracks: CaptionTrack[] = (captions as Record<string, unknown>[])
        .filter((t) => typeof t.baseUrl === 'string')
        .map((t) => ({
          baseUrl: String(t.baseUrl),
          languageCode: String(t.languageCode ?? ''),
          kind: t.kind ? String(t.kind) : undefined,
          vssId: t.vssId ? String(t.vssId) : undefined,
          name:
            (t.name as { simpleText?: string; runs?: { text?: string }[] } | undefined)?.simpleText ??
            (t.name as { runs?: { text?: string }[] } | undefined)?.runs?.[0]?.text,
        }));

      let activeVssId: string | undefined;
      let activeLanguageCode: string | undefined;
      try {
        const active = player?.getOption?.('captions', 'track') as
          | { vssId?: string; languageCode?: string }
          | undefined;
        if (active && typeof active === 'object') {
          activeVssId = active.vssId ? String(active.vssId) : undefined;
          activeLanguageCode = active.languageCode ? String(active.languageCode) : undefined;
        }
      } catch {
        /* captions module not ready */
      }

      const vd = (pr as { videoDetails?: Record<string, unknown> }).videoDetails;
      const details: VideoDetails | undefined = vd && typeof vd.videoId === 'string'
        ? {
            videoId: vd.videoId,
            title: String(vd.title ?? ''),
            author: String(vd.author ?? ''),
            channelId: String(vd.channelId ?? ''),
            lengthSeconds: Number(vd.lengthSeconds) || 0,
            keywords: Array.isArray(vd.keywords) ? vd.keywords.map(String).slice(0, 30) : [],
            shortDescription: String(vd.shortDescription ?? '').slice(0, 2000),
          }
        : undefined;

      window.postMessage({ source: BT_RES, isLive, tracks, activeVssId, activeLanguageCode, details }, '*');
    });
  },
});
