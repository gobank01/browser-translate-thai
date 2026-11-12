import type { SiteButtonStyle, SiteSelectors } from './site';
import { MAX_DUB_RATE, MIN_DUB_RATE, clampDubRate } from '~/core/dub/settings';

/**
 * The Thai dub's piece of the player: a speaker + "TH" button beside the
 * subtitle button, a small menu on right-click / long-press, and toasts in the
 * bottom-left of the picture. Plain DOM with static markup — nothing from the
 * page or the subtitles is ever written as HTML.
 */

const BTN_CLASS = 'bt-dub-button';
const STYLE_ID = 'bt-dub-style';
const LONG_PRESS_MS = 500;

export type DubButtonState = 'off' | 'preparing' | 'on';

export interface DubUiStrings {
  titleOff: string;
  titleOn: string;
  preparing: string;
  clipVolume: string;
  rate: string;
  dubVolume: string;
}

export interface DubButtonDeps {
  strings: DubUiStrings;
  onToggle: () => void;
  getMenuValues: () => { duckVolume: number; rate: number; voiceURI: string; volume: number };
  onMenuChange: (patch: { duckVolume?: number; rate?: number; voiceURI?: string; volume?: number }) => void;
  /** Voices to switch between from the menu (e.g. female / male). Empty: none shown. */
  voices?: readonly { value: string; label: string }[];
}

export interface DubButtonHandle {
  setState: (state: DubButtonState) => void;
  remove: () => void;
}

const SPEAKER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '
  + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M11 5 6 9H2v6h4l5 4V5z"/>'
  + '<path class="bt-dub-wave" d="M15.5 8.5a5 5 0 0 1 0 7"/>'
  + '<path class="bt-dub-wave bt-dub-wave2" d="M19 5a10 10 0 0 1 0 14"/></svg>';
const SPINNER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '
  + 'stroke-width="2.5" stroke-linecap="round" aria-hidden="true" class="bt-dub-spin">'
  + '<path d="M12 3a9 9 0 1 0 9 9"/></svg>';

const CSS = `
.${BTN_CLASS}{display:inline-flex!important;align-items:center;justify-content:center;gap:1px;cursor:pointer;
  width:56px!important;color:#aaa;font:700 11px/1 Roboto,Arial,sans-serif;vertical-align:top}
.${BTN_CLASS}[data-state=on]{color:#3ea6ff}
.${BTN_CLASS}[data-state=preparing]{color:#fff}
.${BTN_CLASS}:focus-visible{outline:2px solid #3ea6ff;outline-offset:-2px}
.${BTN_CLASS} .bt-dub-spin{animation:bt-dub-spin 0.9s linear infinite}
.${BTN_CLASS}[data-state=on] .bt-dub-wave{animation:bt-dub-wave 1.2s ease-in-out infinite}
.${BTN_CLASS}[data-state=on] .bt-dub-wave2{animation-delay:0.3s}
@keyframes bt-dub-spin{to{transform:rotate(360deg)}}
@keyframes bt-dub-wave{0%,100%{opacity:1}50%{opacity:0.35}}
@media (prefers-reduced-motion:reduce){.${BTN_CLASS} *{animation:none!important}}
.bt-dub-status{position:absolute;left:12px;top:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;
  max-width:min(460px,85%);padding:8px 12px;border-radius:999px;background:rgb(0 0 0 / 0.78);color:#fff;
  font:500 14px/1.3 Roboto,Arial,sans-serif;pointer-events:none;transition:opacity 300ms}
.bt-dub-status[data-tone=ready]{background:rgb(22 101 52 / 0.9)}
.bt-dub-status .bar{width:64px;height:4px;border-radius:2px;background:rgb(255 255 255 / 0.25);overflow:hidden;flex:none}
.bt-dub-status .bar i{display:block;height:100%;background:#3ea6ff;transition:width 300ms}
.bt-dub-status .spin{width:12px;height:12px;border:2px solid rgb(255 255 255 / 0.35);border-top-color:#fff;
  border-radius:50%;flex:none;animation:bt-dub-spin 0.9s linear infinite}
.bt-dub-toast{position:absolute;left:12px;bottom:64px;z-index:2147483000;max-width:min(420px,80%);
  padding:8px 12px;border-radius:8px;background:rgb(0 0 0 / 0.85);color:#fff;
  font:500 14px/1.4 Roboto,Arial,sans-serif;pointer-events:auto}
.bt-dub-toast button{margin-left:8px;padding:0;border:0;background:none;color:#7cc4ff;
  font:inherit;text-decoration:underline;cursor:pointer}
.bt-dub-menu{position:absolute;right:12px;bottom:64px;z-index:2147483001;width:220px;padding:12px;
  border-radius:10px;background:rgb(28 28 28 / 0.95);color:#fff;font:400 13px/1.4 Roboto,Arial,sans-serif}
.bt-dub-menu label{display:block;margin:4px 0 10px}
.bt-dub-menu label:last-child{margin-bottom:0}
.bt-dub-menu span{display:flex;justify-content:space-between}
.bt-dub-menu input{width:100%;accent-color:#3ea6ff}
.bt-dub-voices{display:flex;gap:6px;margin-bottom:10px}
.bt-dub-voices button{flex:1;padding:6px 0;border:1px solid #555;border-radius:6px;background:none;
  color:#fff;font:500 13px/1 Roboto,Arial,sans-serif;cursor:pointer}
.bt-dub-voices button[aria-pressed=true]{background:#3ea6ff;border-color:#3ea6ff;color:#000}
.bt-dub-voices button:focus-visible{outline:2px solid #3ea6ff;outline-offset:1px}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function removeDubButton(): void {
  document.querySelector(`.${BTN_CLASS}`)?.remove();
}

/** Put the dub button in the control bar, right after the subtitle button. */
export function mountDubButton(
  style: SiteButtonStyle,
  selectors: SiteSelectors,
  deps: DubButtonDeps,
): DubButtonHandle | null {
  const host = style.container ? document.querySelector(style.container) : null;
  if (!host) return null;
  ensureStyle();
  removeDubButton();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = style.className ? `${style.className} ${BTN_CLASS}` : BTN_CLASS;
  btn.setAttribute('aria-haspopup', 'menu');
  const subs = host.querySelector('.bt-subs-button');
  if (subs) subs.after(btn);
  else host.insertBefore(btn, host.firstChild);

  let state: DubButtonState = 'off';
  let pressTimer = 0;
  let longPressed = false;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (longPressed) { longPressed = false; return; }
    deps.onToggle();
  });
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu(selectors, btn, deps);
  });
  btn.addEventListener('pointerdown', () => {
    longPressed = false;
    pressTimer = window.setTimeout(() => { longPressed = true; openMenu(selectors, btn, deps); }, LONG_PRESS_MS);
  });
  for (const end of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
    btn.addEventListener(end, () => clearTimeout(pressTimer));
  }

  function setState(next: DubButtonState): void {
    state = next;
    btn.dataset.state = state;
    btn.innerHTML = state === 'preparing' ? SPINNER : SPEAKER;
    btn.appendChild(document.createTextNode('TH'));
    const title = state === 'preparing' ? deps.strings.preparing
      : state === 'on' ? deps.strings.titleOn : deps.strings.titleOff;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.setAttribute('aria-pressed', String(state !== 'off'));
  }
  setState('off');

  return { setState, remove: () => btn.remove() };
}

/** The right-click menu: the video's volume while dubbing, and the dub's speed. */
function openMenu(selectors: SiteSelectors, anchor: HTMLElement, deps: DubButtonDeps): void {
  const player = document.querySelector<HTMLElement>(selectors.player);
  if (!player) return;
  player.querySelector('.bt-dub-menu')?.remove();
  const values = deps.getMenuValues();
  const menu = document.createElement('div');
  menu.className = 'bt-dub-menu';
  menu.setAttribute('role', 'menu');

  const slider = (label: string, value: number, min: number, max: number, step: number,
    format: (v: number) => string, onChange: (v: number) => void) => {
    const wrap = document.createElement('label');
    const head = document.createElement('span');
    const name = document.createElement('b');
    name.textContent = label;
    const out = document.createElement('output');
    out.textContent = format(value);
    head.append(name, out);
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) });
    input.setAttribute('aria-label', label);
    input.addEventListener('input', () => { out.textContent = format(Number(input.value)); });
    input.addEventListener('change', () => onChange(Number(input.value)));
    wrap.append(head, input);
    return wrap;
  };
  if (deps.voices?.length) {
    const row = document.createElement('div');
    row.className = 'bt-dub-voices';
    row.setAttribute('role', 'group');
    for (const v of deps.voices) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = v.label;
      b.setAttribute('aria-pressed', String(v.value === values.voiceURI));
      b.addEventListener('click', () => {
        for (const other of row.children) other.setAttribute('aria-pressed', String(other === b));
        deps.onMenuChange({ voiceURI: v.value });
      });
      row.appendChild(b);
    }
    menu.appendChild(row);
  }
  menu.append(
    slider(deps.strings.dubVolume, values.volume, 0, 100, 5, (v) => `${v}%`,
      (volume) => deps.onMenuChange({ volume })),
    slider(deps.strings.clipVolume, values.duckVolume, 0, 100, 5, (v) => `${v}%`,
      (duckVolume) => deps.onMenuChange({ duckVolume })),
    slider(deps.strings.rate, values.rate, MIN_DUB_RATE, MAX_DUB_RATE, 0.05, (v) => `${v.toFixed(2)}x`,
      (rate) => deps.onMenuChange({ rate: clampDubRate(rate) })),
  );
  // Clicks inside must not reach the player, which would pause the video.
  for (const type of ['click', 'pointerdown', 'mousedown', 'keydown'] as const) {
    menu.addEventListener(type, (e) => e.stopPropagation());
  }
  const close = (e?: Event) => {
    if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
    if (e && e.type === 'pointerdown' && menu.contains(e.target as Node)) return;
    menu.remove();
    document.removeEventListener('pointerdown', close, true);
    document.removeEventListener('keydown', close, true);
    if (e instanceof KeyboardEvent) anchor.focus();
  };
  setTimeout(() => {
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', close, true);
  });
  player.appendChild(menu);
  menu.querySelector('input')?.focus();
}

export interface ToastAction { label: string; run: () => void }

const TOAST_MS = 3000;

/** A short message in the bottom-left of the picture that clears itself. */
export function showDubToast(selectors: SiteSelectors, text: string, action?: ToastAction): void {
  const player = document.querySelector<HTMLElement>(selectors.player);
  if (!player) return;
  ensureStyle();
  player.querySelector('.bt-dub-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'bt-dub-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = text;
  if (action) {
    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = action.label;
    link.addEventListener('click', (e) => { e.stopPropagation(); action.run(); toast.remove(); });
    toast.appendChild(link);
  }
  toast.addEventListener('click', (e) => e.stopPropagation());
  player.appendChild(toast);
  setTimeout(() => toast.remove(), TOAST_MS);
}

export interface DubStatus {
  text: string;
  /** 0–1 for a progress bar; omitted for an indefinite wait. */
  progress?: number;
  tone?: 'busy' | 'ready';
}

/**
 * The dub's progress, top-left on the picture: loading captions, translating,
 * preparing the voice, ready. Null clears it. Announced politely to screen
 * readers; the element itself is not interactive.
 */
export function setDubStatus(selectors: SiteSelectors, status: DubStatus | null): void {
  const player = document.querySelector<HTMLElement>(selectors.player);
  let el = player?.querySelector<HTMLElement>('.bt-dub-status') ?? null;
  if (!status) { el?.remove(); return; }
  if (!player) return;
  ensureStyle();
  if (!el) {
    el = document.createElement('div');
    el.className = 'bt-dub-status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.append(document.createElement('span'), document.createElement('span'), document.createElement('span'));
    player.appendChild(el);
  }
  const tone = status.tone ?? 'busy';
  el.dataset.tone = tone;
  const [icon, label, bar] = el.children as unknown as [HTMLElement, HTMLElement, HTMLElement];
  icon.className = tone === 'busy' ? 'spin' : '';
  icon.textContent = tone === 'ready' ? '✓' : '';
  if (label.textContent !== status.text) label.textContent = status.text;
  if (status.progress === undefined) {
    bar.className = '';
    bar.replaceChildren();
  } else {
    bar.className = 'bar';
    if (!bar.firstChild) bar.appendChild(document.createElement('i'));
    (bar.firstChild as HTMLElement).style.width = `${Math.round(Math.min(1, Math.max(0, status.progress)) * 100)}%`;
  }
}
