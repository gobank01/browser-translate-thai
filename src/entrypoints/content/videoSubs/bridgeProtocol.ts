export const BT_REQ = 'bt-yt-captions-request';
export const BT_RES = 'bt-yt-captions-response';
export const BT_FETCH_REQ = 'bt-yt-transcript-request';
export const BT_FETCH_RES = 'bt-yt-transcript-response';
/** Switch the player to its own audio track in a language (YouTube's dubs). */
export const BT_AUDIO_REQ = 'bt-yt-audio-request';
export const BT_AUDIO_RES = 'bt-yt-audio-response';

export interface AudioTrackRequest {
  source: typeof BT_AUDIO_REQ;
  id: string;
  /** Language code, e.g. 'th'. */
  lang: string;
}

export interface AudioTrackResponse {
  source: typeof BT_AUDIO_RES;
  id: string;
  /** 'already': that language is playing; 'switched': now it is; 'none': the video has no such track. */
  result: 'already' | 'switched' | 'none';
}

export interface CaptionTrack {
  baseUrl: string;
  languageCode: string; // e.g. 'en'
  kind?: string;        // 'asr' for auto-generated
  name?: string;        // display name
  vssId?: string;       // YouTube track id, e.g. '.en' or 'a.en' — used to match the active track
}

export interface CaptionsResponse {
  source: typeof BT_RES;
  isLive: boolean;
  tracks: CaptionTrack[];
  activeVssId?: string;        // vssId of the caption track the user currently has displayed
  activeLanguageCode?: string; // languageCode of the active track
  /** What the video is, for the personal watch log. */
  details?: VideoDetails;
}

export interface VideoDetails {
  videoId: string;
  title: string;
  author: string;
  channelId: string;
  lengthSeconds: number;
  keywords: string[];
  shortDescription: string;
}

/** Ask the MAIN-world bridge for the captured (pot-bearing) transcript of a language. */
export interface TranscriptRequest {
  source: typeof BT_FETCH_REQ;
  id: string;
  lang: string;
}

export interface TranscriptResponse {
  source: typeof BT_FETCH_RES;
  id: string;
  body: string;
  error?: string;
}
