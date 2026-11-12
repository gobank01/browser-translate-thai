import { requestCaptionTracks } from '../requestCaptionTracks';
import { fetchTranscript, pickTrack } from '../fetchTranscript';
import { fetchTranscriptText } from '../transcriptBridge';
import { switchToNativeAudio } from '../nativeAudio';
import type { CaptionsResponse } from '../bridgeProtocol';
import type { SiteMatcher, SiteProbe, SubtitleSite } from '../site';
import type { Cue } from '~/core/subtitles/types';

/**
 * YouTube.
 *
 * The only adapter that does not read the page for its captions. YouTube serves
 * a caption track's body only against a poToken the player holds, so the tracks
 * and the transcript both come back over the MAIN-world bridge that watches the
 * player's own requests — see `requestCaptionTracks` and `transcriptBridge`.
 */
export function createYouTubeSite(): SubtitleSite {
  // Probed once when the button is offered and reused when it is pressed, so a
  // press does not pay for a second round trip through the bridge.
  let probed: CaptionsResponse | null = null;

  function trackPref(captions: CaptionsResponse) {
    return { activeVssId: captions.activeVssId, activeLanguageCode: captions.activeLanguageCode };
  }

  async function captions(): Promise<CaptionsResponse | null> {
    if (probed) return probed;
    try {
      probed = await requestCaptionTracks();
    } catch {
      probed = null; // bridge not ready / timed out
    }
    return probed;
  }

  return {
    id: 'youtube',
    selectors: {
      player: '#movie_player',
      nativeCaptions: '.ytp-caption-window-container',
      controls: '.ytp-chrome-bottom',
      autohideClass: 'ytp-autohide',
    },
    button: {
      container: '.ytp-right-controls',
      className: 'ytp-button',
      place: 'start',
      idleColor: '#fff',
      activeColor: '#3ea6ff',
      width: '48px',
    },

    findVideo: () => document.querySelector<HTMLVideoElement>('video.html5-main-video, video'),

    // YouTube swaps videos in place, so the id in the address is the only thing
    // that says the cues on screen belong to what is playing.
    mediaKey: () => new URLSearchParams(location.search).get('v') ?? '',

    async probe(): Promise<SiteProbe> {
      const found = await captions();
      // The bridge reports what the player asked for. A reader who has never
      // turned captions on means a player that never asked, which is the
      // likeliest reason for an empty bridge — so say that rather than "failed".
      if (!found) return { kind: 'unknown', hint: 'enableCaptions' };
      if (found.isLive) return { kind: 'live' };
      const track = pickTrack(found.tracks, trackPref(found));
      if (!track) return { kind: 'none' };
      // Auto-generated captions are made from the audio, so their language is
      // the language being spoken — whatever track the viewer has on screen.
      const asr = found.tracks.find((t) => t.kind === 'asr');
      return { kind: 'ready', languageCode: track.languageCode, spokenLanguage: asr?.languageCode };
    },

    nativeAudio: (lang) => switchToNativeAudio(lang),

    async fetchTranscript(): Promise<Cue[]> {
      const found = await captions();
      if (!found) throw new Error('caption bridge unavailable');
      const track = pickTrack(found.tracks, trackPref(found));
      if (!track) throw new Error('no caption track');
      return fetchTranscript(track.languageCode, fetchTranscriptText);
    },
  };
}

export const youtubeMatcher: SiteMatcher = {
  matches: (loc) => loc.hostname.endsWith('youtube.com') && loc.pathname === '/watch',
  create: createYouTubeSite,
};
