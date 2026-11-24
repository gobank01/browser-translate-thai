/** Between the content script and the MAIN-world audio tap (media-tap.content.ts). */
export const TAP_REQ = 'bt-tap-request';
export const TAP_RES = 'bt-tap-response';

export interface TapRequest {
  source: typeof TAP_REQ;
  id: string;
  /** The video's currentSrc (a blob: URL for a MediaSource). */
  src: string;
  /** Seconds of video time wanted. */
  from: number;
  to: number;
  /** Only say whether audio is being kept for this video, and how far it reaches. */
  probe?: boolean;
}

export interface TapResponse {
  source: typeof TAP_RES;
  id: string;
  ok: boolean;
  mime?: string;
  /** Video time the returned audio starts and ends at. */
  start?: number;
  end?: number;
  /** A playable file: init segment plus the media pieces in order. */
  bytes?: ArrayBuffer;
  bufferedEnd?: number;
}

export function requestTap(req: Omit<TapRequest, 'source' | 'id'>, timeoutMs = 3000): Promise<TapResponse | null> {
  const id = `tap-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve) => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window && e.source !== null) return;
      const data = e.data as TapResponse;
      if (data?.source !== TAP_RES || data.id !== id) return;
      done(data);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    function done(r: TapResponse | null) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(r);
    }
    window.addEventListener('message', onMessage);
    window.postMessage({ source: TAP_REQ, id, ...req } satisfies TapRequest, '*');
  });
}
