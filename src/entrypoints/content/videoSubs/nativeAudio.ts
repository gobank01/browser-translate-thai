import { BT_AUDIO_REQ, BT_AUDIO_RES, type AudioTrackResponse } from './bridgeProtocol';

/**
 * Ask YouTube's player to play its own audio track in `lang` — the dubs YouTube
 * and creators attach to a video. Resolves 'none' when there is no such track
 * or the bridge does not answer.
 */
export function switchToNativeAudio(lang: string, timeoutMs = 3000): Promise<AudioTrackResponse['result']> {
  const id = `audio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve) => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window && e.source !== null) return;
      const data = e.data as AudioTrackResponse;
      if (data?.source !== BT_AUDIO_RES || data.id !== id) return;
      done(data.result);
    };
    const timer = setTimeout(() => done('none'), timeoutMs);
    function done(result: AudioTrackResponse['result']) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(result);
    }
    window.addEventListener('message', onMessage);
    window.postMessage({ source: BT_AUDIO_REQ, id, lang }, '*');
  });
}
