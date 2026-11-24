import { describe, expect, it } from 'vitest';
import { isInit, mp4Timescale, segmentTime } from './mediaTime';

describe('segmentTime', () => {
  it('reads a WebM Cluster timecode', () => {
    // Cluster, unknown size (0x01ff…), Timecode (0xE7) of 2 bytes = 20001 ms
    const b = new Uint8Array([0x1f, 0x43, 0xb6, 0x75, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xe7, 0x82, 0x4e, 0x21, 0, 0]);
    expect(segmentTime(b, 0)).toBeCloseTo(20.001);
  });
  it('is null for a piece that continues a segment', () => {
    expect(segmentTime(new Uint8Array(32).fill(7), 0)).toBeNull();
  });
  it('reads an MP4 fragment tfdt over the init timescale', () => {
    const box = (type: string, body: number[]) => { const n = 8 + body.length; return [0, 0, n >> 8, n & 255, ...[...type].map((c) => c.charCodeAt(0)), ...body]; };
    const init = new Uint8Array([...box('ftyp', [0, 0, 0, 0]), ...box('mdhd', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xac, 0x44, 0, 0, 0, 0])]);
    expect(isInit(init)).toBe(true);
    expect(mp4Timescale(init)).toBe(44100);
    const frag = new Uint8Array(box('moof', box('tfdt', [0, 0, 0, 0, 0, 0x0a, 0xc4, 0x40])));
    expect(segmentTime(frag, 44100)).toBeCloseTo(16);
  });
});
