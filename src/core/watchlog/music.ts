import type { VideoDetails } from '~/entrypoints/content/videoSubs/bridgeProtocol';

/**
 * Is this a music video? Music is listened to, not studied, so it is neither
 * dubbed by itself nor kept in the learning log. YouTube's category says so
 * when the player reports it; otherwise the usual signs in the title and channel.
 */
const MUSIC_TITLE = /official\s*(music\s*)?(video|mv|audio|visualizer)|\bm\/?v\b|lyrics?\s*video|\bkaraoke\b|เนื้อเพลง|คาราโอเกะ|\bost\b|เพลงประกอบ/i;
const MUSIC_CHANNEL = /\s-\sTopic$|vevo$/i;

export function isMusicVideo(d: Pick<VideoDetails, 'title' | 'author' | 'category'> & { keywords?: string[] }): boolean {
  if (d.category === 'Music') return true;
  if (MUSIC_TITLE.test(d.title) || MUSIC_CHANNEL.test(d.author)) return true;
  // A record label's channel tagging the video as a song.
  return /\b(music|records)\b/i.test(d.author) && (d.keywords ?? []).some((k) => /\b(mv|song|tpop|kpop)\b|เพลง/i.test(k));
}
