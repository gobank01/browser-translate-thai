import type { Cue } from '~/core/subtitles/types';

/**
 * What one video site looks like to the subtitle translator.
 *
 * Everything the translator does — draw two lines over the picture, keep them
 * on the playhead, translate ahead of it, hide behind a control bar — is the
 * same wherever the video is. What differs is where the player is, how its
 * captions are obtained, and what counts as "a different video". Those are the
 * three things an adapter answers, and nothing else in the module names a site.
 */
export interface SubtitleSite {
  /** For logs and for telling two adapters apart. Never shown to a reader. */
  readonly id: string;
  /** The player element the overlay attaches to, and what it must dodge. */
  readonly selectors: SiteSelectors;
  /** Where the toggle joins the site's own controls, if it has any. */
  readonly button: SiteButtonStyle | null;
  /** The media the cues are timed against. */
  findVideo(): HTMLVideoElement | null;
  /**
   * Whether there is any point asking `probe` yet.
   *
   * A player appears before its captions do: Canvas renders the `<video>` a
   * second before it renders the `<track>` inside it. Probing in that gap gets
   * "nothing to translate" — a wrong answer that is then believed for good, so
   * the toggle never appears on a recording that has perfectly good captions.
   * Sites whose captions do not come from the page have nothing extra to wait
   * for and can leave this out; the default is simply that a video exists.
   */
  readyToProbe?(): boolean;
  /**
   * Changes when the page moves to different media. The translator drops
   * everything when it changes, so a site with one video per page can return a
   * constant and a site that swaps videos in place must not.
   */
  mediaKey(): string;
  /** Whether this page has anything worth offering to translate. */
  probe(): Promise<SiteProbe>;
  /** The cues for the current media, once the reader has asked for them. */
  fetchTranscript(): Promise<Cue[]>;
}

export interface SiteSelectors {
  /**
   * The overlay's host. It has to contain the picture and establish a
   * containing block, since the subtitles are positioned against it.
   */
  player: string;
  /** The site's own caption layer, hidden while ours is up. */
  nativeCaptions?: string;
  /** The control bar, measured so the subtitles can sit clear of it. */
  controls?: string;
  /** Class the site puts on the player while its controls are hidden. */
  autohideClass?: string;
}

export interface SiteButtonStyle {
  /**
   * The control-bar container the button is inserted into. Omit it where a bar
   * exists but is not somewhere a new control can simply be appended — a bar
   * whose right-hand group is positioned out of the flow drops an appended
   * button in the middle of itself, which reads as a fault.
   */
  container?: string;
  /**
   * Where to put the button when there is no container, or none is found. A
   * player we do not recognise still has a picture, and a corner of it is a
   * worse home for a control than a real control bar but a far better one than
   * nothing — without it there is no way to reach the menu at all.
   */
  fallback?: 'player-corner';
  /** The site's own button class, so ours inherits its sizing and hover. */
  className?: string;
  /**
   * Put it immediately before the first control matching this, rather than at
   * one end of the bar. A subtitle control belongs beside the site's own
   * captions button, not off in a corner of the bar next to the volume slider.
   */
  before?: string;
  /** Where among the site's buttons ours goes, when `before` finds nothing. */
  place?: 'start' | 'end';
  /** Colours, since a control bar's idea of "on" is the site's, not ours. */
  idleColor?: string;
  activeColor?: string;
  width?: string;
}

export type SiteProbe =
  /** There are captions. `languageCode` lets a needless translation be skipped. */
  | { kind: 'ready'; languageCode?: string; spokenLanguage?: string }
  /** Nothing to translate — the toggle should not be offered at all. */
  | { kind: 'none' }
  /** A live stream: there is no transcript to look ahead in. */
  | { kind: 'live' }
  /**
   * Could not tell without going and getting the transcript, which is not
   * something to do before anyone has asked. The toggle is offered and the
   * answer comes when it is pressed. `hint` is what to say if that fails: a
   * site may know the likeliest reason, and "turn captions on first" is a far
   * better message than "it did not work".
   */
  | { kind: 'unknown'; hint?: 'enableCaptions' };

/** The adapter for this page, or null where we have nothing to offer. */
export function siteFor(
  loc: Pick<Location, 'hostname' | 'pathname' | 'search'>,
  sites: readonly SiteMatcher[],
): SubtitleSite | null {
  for (const site of sites) {
    if (site.matches(loc)) return site.create();
  }
  return null;
}

export interface SiteMatcher {
  matches(loc: Pick<Location, 'hostname' | 'pathname' | 'search'>): boolean;
  create(): SubtitleSite;
}
