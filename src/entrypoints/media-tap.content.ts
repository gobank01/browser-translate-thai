import {
  TAP_REQ, TAP_RES, type TapRequest, type TapResponse,
} from './content/videoSubs/tapProtocol';
import { isInit, mp4Timescale, segmentTime } from './content/videoSubs/mediaTime';

/**
 * MAIN-world tap on the audio a page's player downloads ahead of the playhead.
 *
 * Players on YouTube, Facebook, Instagram, Vimeo and most others stream through
 * Media Source Extensions: the page appends the audio piece by piece to a
 * SourceBuffer, usually a minute or more before it is heard. Keeping a copy of
 * those pieces is what lets a video with no captions be transcribed ahead of
 * the playhead and dubbed in time. Nothing leaves the page from here; the
 * content script asks for a span of audio when it needs one.
 *
 * A player appends a segment in several pieces as it downloads, so the pieces
 * are kept whole and in order (dropping one corrupts the stream), and the time
 * of each segment is read from its own header — the buffer's reported ranges
 * lag a piece behind, since the browser holds back frames it cannot finish.
 */

/** One appendBuffer call; `t` is set on a piece that starts a segment. */
interface Piece { data: Uint8Array; init: number; t?: number }
interface Tap { mime: string; ms: MediaSource; sb: SourceBuffer; inits: Uint8Array[]; scales: number[]; pieces: Piece[]; bytes: number }

/** Audio kept per stream; the oldest pieces go first. */
const MAX_BYTES = 40 * 1024 * 1024;
/** Two segments further apart than this are not one run (a seek between them). */
const MAX_SEGMENT_S = 20;

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    if (typeof MediaSource === 'undefined') return;
    const taps: Tap[] = [];
    const urlOf = new WeakMap<MediaSource, string>();
    const tapOf = new WeakMap<SourceBuffer, Tap>();

    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      const url = createObjectURL(obj);
      if (obj instanceof MediaSource) urlOf.set(obj, url);
      return url;
    };

    const addSourceBuffer = MediaSource.prototype.addSourceBuffer;
    MediaSource.prototype.addSourceBuffer = function (this: MediaSource, mime: string) {
      const sb = addSourceBuffer.call(this, mime);
      if (/^audio\//i.test(mime)) {
        const tap: Tap = { mime, ms: this, sb, inits: [], scales: [], pieces: [], bytes: 0 };
        taps.push(tap);
        tapOf.set(sb, tap);
      }
      return sb;
    };

    const appendBuffer = SourceBuffer.prototype.appendBuffer;
    SourceBuffer.prototype.appendBuffer = function (this: SourceBuffer, data: BufferSource) {
      const tap = tapOf.get(this);
      if (tap) {
        try {
          const bytes = data instanceof ArrayBuffer
            ? new Uint8Array(data.slice(0))
            : new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
          record(tap, bytes, this.timestampOffset);
        } catch { /* never get in the player's way */ }
      }
      return appendBuffer.call(this, data);
    };

    function record(tap: Tap, bytes: Uint8Array, offset: number) {
      if (isInit(bytes)) {
        tap.inits.push(bytes);
        tap.scales.push(mp4Timescale(bytes));
        return;
      }
      const t = segmentTime(bytes, tap.scales.at(-1) ?? 0);
      tap.pieces.push({ data: bytes, init: tap.inits.length - 1, ...(t !== null && { t: t + offset }) });
      tap.bytes += bytes.byteLength;
      while (tap.bytes > MAX_BYTES && tap.pieces.length > 1) tap.bytes -= tap.pieces.shift()!.data.byteLength;
    }

    /** End of the buffered range holding `t`, read now (no lag by then). */
    function rangeEnd(sb: SourceBuffer, t: number): number {
      try {
        const r = sb.buffered;
        for (let i = 0; i < r.length; i++) if (r.start(i) <= t + 0.1 && t < r.end(i)) return r.end(i);
      } catch { /* removed */ }
      return t;
    }

    window.addEventListener('message', (e) => {
      if (e.source !== window || (e.data as { source?: string })?.source !== TAP_REQ) return;
      const req = e.data as TapRequest;
      window.postMessage(answer(req), '*');
    });

    function answer(req: TapRequest): TapResponse {
      const none: TapResponse = { source: TAP_RES, id: req.id, ok: false };
      const tap = [...taps].reverse().find((t) => urlOf.get(t.ms) === req.src) ?? (req.src ? undefined : taps.at(-1));
      if (!tap) return none;
      if (req.probe) return { ...none, ok: true, mime: tap.mime };
      const { pieces } = tap;
      // The segment holding `from` (the latest copy, after a seek back), else
      // the first one that starts inside the span.
      let i = -1;
      for (let j = pieces.length - 1; j >= 0 && i < 0; j--) {
        const t = pieces[j]!.t;
        if (t !== undefined && t <= req.from + 0.05 && t > req.from - MAX_SEGMENT_S) i = j;
      }
      if (i < 0) i = pieces.findIndex((p) => p.t !== undefined && p.t > req.from && p.t < req.to);
      if (i < 0 || !tap.inits[pieces[i]!.init]) return none;
      const first = pieces[i]!;
      const run: Piece[] = [first];
      let last = first.t!;
      let end: number | undefined;
      for (let j = i + 1; j < pieces.length; j++) {
        const p = pieces[j]!;
        if (p.init !== first.init) break;
        if (p.t !== undefined) {
          if (p.t <= last || p.t - last > MAX_SEGMENT_S) break; // another part of the video
          if (p.t >= req.to) { end = p.t; break; }
          last = p.t;
        }
        run.push(p);
      }
      end ??= rangeEnd(tap.sb, last);
      if (end <= first.t!) return none;
      const parts = [tap.inits[first.init]!, ...run.map((p) => p.data)];
      const out = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0));
      let at = 0;
      for (const p of parts) { out.set(p, at); at += p.byteLength; }
      return { source: TAP_RES, id: req.id, ok: true, mime: tap.mime, start: first.t!, end, bytes: out.buffer };
    }
  },
});
