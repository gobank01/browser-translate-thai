import { describe, it, expect, beforeEach } from 'vitest';
import { subtitleSiteFor, SITES } from './index';
import { createGenericSite } from './generic';

function loc(url: string) {
  const u = new URL(url);
  return { hostname: u.hostname, pathname: u.pathname, search: u.search };
}

describe('subtitleSiteFor', () => {
  it('hands a YouTube watch page to its own adapter', () => {
    expect(subtitleSiteFor(loc('https://www.youtube.com/watch?v=abc'))?.id).toBe('youtube');
  });

  it('does not claim YouTube pages that are not watching anything', () => {
    // The bridge only captures caption requests the player makes, so a channel
    // or search page has nothing for the YouTube adapter to work with.
    expect(subtitleSiteFor(loc('https://www.youtube.com/feed/subscriptions'))?.id).toBe('generic');
  });

  it('hands a Zoom recording to its own adapter, on any regional host', () => {
    expect(subtitleSiteFor(loc('https://zoom.us/rec/play/xyz'))?.id).toBe('zoom');
    expect(subtitleSiteFor(loc('https://us02web.zoom.us/rec/share/abc'))?.id).toBe('zoom');
  });

  it('leaves the rest of Zoom alone — a meeting is not a recording', () => {
    expect(subtitleSiteFor(loc('https://zoom.us/j/1234567890'))?.id).toBe('generic');
  });

  it('falls through to the generic adapter everywhere else', () => {
    expect(subtitleSiteFor(loc('https://example.edu/lecture/3'))?.id).toBe('generic');
    expect(subtitleSiteFor(loc('https://vimeo.com/12345'))?.id).toBe('generic');
  });

  it('keeps the catch-all last, or it would swallow every site above it', () => {
    expect(SITES[SITES.length - 1]!.matches(loc('https://www.youtube.com/watch?v=a'))).toBe(true);
    expect(SITES.slice(0, -1).some((s) => s.matches(loc('https://example.edu/x')))).toBe(false);
  });
});

describe('the generic adapter', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('has nothing to offer on a page with no video', async () => {
    expect(await createGenericSite().probe()).toEqual({ kind: 'none' });
  });

  it('says so plainly when a video ships no captions at all', async () => {
    document.body.innerHTML = '<video></video>';
    expect(await createGenericSite().probe()).toEqual({ kind: 'none' });
  });

  it('withholds judgement while a declared track has yet to load', async () => {
    // Tracks are declared in the markup but their cues load lazily, so an empty
    // list this early is not proof that there is nothing to translate.
    document.body.innerHTML = '<video><track kind="subtitles" src="c.vtt"></video>';
    expect(await createGenericSite().probe()).toEqual({ kind: 'unknown' });
  });

  it('marks the player wrapper so the overlay can find it', async () => {
    document.body.innerHTML = '<div class="video-js"><video></video></div>';
    await createGenericSite().probe();
    expect(document.querySelector('.video-js')!.hasAttribute('data-bt-player')).toBe(true);
  });

  it('marks only one wrapper, so a second video does not leave two', async () => {
    document.body.innerHTML =
      '<div class="video-js" data-bt-player><video></video></div>' +
      '<div class="plyr"><video></video></div>';
    const site = createGenericSite();
    // The second video is the bigger one in the eyes of jsdom only if we say so;
    // what matters here is that marking is exclusive.
    await site.probe();
    expect(document.querySelectorAll('[data-bt-player]')).toHaveLength(1);
  });

  it('treats one page as one recording', () => {
    // Every player this adapter is meant for shows a single video per page; a
    // site that swaps media in place needs an adapter that can say so.
    const site = createGenericSite();
    expect(site.mediaKey()).toBe(location.pathname + location.search);
  });
});

describe('YouTube Shorts', () => {
  it('is handled by the YouTube adapter, keyed by the Short id', async () => {
    const { youtubeMatcher } = await import('./youtube');
    const { youtubeVideoId, youtubePlayerId } = await import('../bridgeProtocol');
    const loc = { hostname: 'www.youtube.com', pathname: '/shorts/MK1zLrR9gpM', search: '' };
    expect(youtubeMatcher.matches(loc)).toBe(true);
    expect(youtubeVideoId(loc)).toBe('MK1zLrR9gpM');
    expect(youtubePlayerId(loc)).toBe('shorts-player');
    expect(youtubeVideoId({ pathname: '/watch', search: '?v=abc&t=1' })).toBe('abc');
    expect(youtubePlayerId({ pathname: '/watch' })).toBe('movie_player');
  });
});
