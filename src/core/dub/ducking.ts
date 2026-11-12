/**
 * Turn the video's own sound down while the dub plays, and give it back
 * exactly as it was afterwards.
 */
export interface Ducker {
  /** Set the video to `percent` of the volume it had when ducking began. */
  duck: (percent: number) => void;
  restore: () => void;
  isDucked: () => boolean;
}

export function createDucker(video: HTMLMediaElement): Ducker {
  let original: number | null = null;
  return {
    duck(percent) {
      if (original === null) original = video.volume;
      video.volume = Math.min(1, Math.max(0, original * percent / 100));
    },
    restore() {
      if (original === null) return;
      video.volume = original;
      original = null;
    },
    isDucked: () => original !== null,
  };
}
