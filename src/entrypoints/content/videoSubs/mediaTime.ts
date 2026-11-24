/** Reading start times out of streamed media segments (see media-tap.content.ts). */

/** Does this chunk start a stream — an MP4 `ftyp`/`moov` or a WebM EBML header? */
export function isInit(b: Uint8Array): boolean {
  if (b.length < 8) return false;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return true; // EBML
  const box = String.fromCharCode(b[4]!, b[5]!, b[6]!, b[7]!);
  return box === 'ftyp' || box === 'moov';
}

/**
 * Seconds at which a media segment starts, read from its header, or null for
 * a piece that continues one: a WebM Cluster's Timecode (milliseconds, the
 * default scale), or an MP4 fragment's tfdt over the track's timescale.
 */
export function segmentTime(b: Uint8Array, timescale: number): number | null {
  if (b.length < 12) return null;
  if (b[0] === 0x1f && b[1] === 0x43 && b[2] === 0xb6 && b[3] === 0x75) {
    let p = 4 + vintLength(b[4]!); // past the Cluster's size
    if (b[p] !== 0xe7) return null; // Timecode comes first
    const len = vintLength(b[p + 1]!);
    const size = b[p + 1]! & (0xff >> len);
    p += 1 + len;
    let v = 0;
    for (let k = 0; k < size; k++) v = v * 256 + b[p + k]!;
    return v / 1000;
  }
  const box = String.fromCharCode(b[4]!, b[5]!, b[6]!, b[7]!);
  if (!['moof', 'styp', 'sidx', 'emsg'].includes(box) || !timescale) return null;
  const at = find(b, 'tfdt', 4096);
  if (at < 0) return null;
  const view = new DataView(b.buffer, b.byteOffset);
  const v = b[at + 4] === 1 ? Number(view.getBigUint64(at + 8)) : view.getUint32(at + 8);
  return v / timescale;
}

/** The audio track's timescale from an MP4 init segment (mdhd), or 0. */
export function mp4Timescale(b: Uint8Array): number {
  const at = find(b, 'mdhd', b.length);
  if (at < 0) return 0;
  const view = new DataView(b.buffer, b.byteOffset);
  return view.getUint32(at + (b[at + 4] === 1 ? 24 : 16));
}

/** Offset of a four-letter box type within the first `limit` bytes, or -1. */
function find(b: Uint8Array, type: string, limit: number): number {
  const c = [...type].map((ch) => ch.charCodeAt(0));
  for (let i = 0; i + 4 <= Math.min(b.length, limit); i++) {
    if (b[i] === c[0] && b[i + 1] === c[1] && b[i + 2] === c[2] && b[i + 3] === c[3]) return i;
  }
  return -1;
}

/** Bytes in an EBML variable-length integer, from its first byte. */
function vintLength(first: number): number {
  let n = 1;
  for (let mask = 0x80; n <= 8 && !(first & mask); mask >>= 1) n++;
  return n;
}
