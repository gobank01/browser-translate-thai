import { describe, it, expect, beforeEach } from 'vitest';
import { BilingualInjector } from './inject';
import { PAGE_TRANSLATE_STYLE_ID } from './styles';

describe('BilingualInjector', () => {
  let injector: BilingualInjector;
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<p id="a">Source A text content here.</p>';
    injector = new BilingualInjector(document);
  });

  it('injects the stylesheet once', () => {
    injector.placeLoading(document.getElementById('a')!);
    injector.placeLoading(document.getElementById('a')!);
    expect(document.querySelectorAll(`#${PAGE_TRANSLATE_STYLE_ID}`)).toHaveLength(1);
  });

  it('places a loading node after the block', () => {
    const block = document.getElementById('a')!;
    injector.placeLoading(block);
    const next = block.nextElementSibling!;
    expect(next.classList.contains('bt-bilingual')).toBe(true);
    expect(next.querySelector('.bt-bilingual-loading')).not.toBeNull();
  });

  it('replaces loading with translation text', () => {
    const block = document.getElementById('a')!;
    injector.placeLoading(block);
    injector.setTranslation(block, '译文 A');
    const next = block.nextElementSibling!;
    expect(next.textContent).toBe('译文 A');
    expect(next.querySelector('.bt-bilingual-loading')).toBeNull();
  });

  it('shows an error node with a retry handler', () => {
    const block = document.getElementById('a')!;
    let retried = false;
    injector.placeLoading(block);
    injector.setError(block, 'Failed', 'Retry', () => { retried = true; });
    const errEl = block.nextElementSibling!.querySelector('.bt-bilingual-error') as HTMLElement;
    expect(errEl.textContent).toContain('Failed');
    errEl.click();
    expect(retried).toBe(true);
  });

  it('does not double-insert for the same block', () => {
    const block = document.getElementById('a')!;
    injector.placeLoading(block);
    injector.placeLoading(block);
    expect(document.querySelectorAll('.bt-bilingual')).toHaveLength(1);
  });

  it('teardown removes all injected nodes and the stylesheet', () => {
    injector.placeLoading(document.getElementById('a')!);
    injector.teardown();
    expect(document.querySelectorAll('.bt-bilingual')).toHaveLength(0);
    expect(document.getElementById(PAGE_TRANSLATE_STYLE_ID)).toBeNull();
  });

  it('removes the error span (and its retry listener) when transitioning to translation', () => {
    const block = document.getElementById('a')!;
    let retried = 0;
    injector.placeLoading(block);
    injector.setError(block, 'Failed', 'Retry', () => { retried++; });
    const oldErr = block.nextElementSibling!.querySelector('.bt-bilingual-error') as HTMLElement;
    injector.setTranslation(block, '译文 A');
    const node = block.nextElementSibling!;
    expect(node.querySelector('.bt-bilingual-error')).toBeNull();
    expect(node.textContent).toBe('译文 A');
    // the detached old error span's listener no longer affects the live node
    oldErr.click();
    expect(retried).toBe(1); // clicking the detached span still fires once, but it is gone from the DOM
    expect(node.contains(oldErr)).toBe(false);
  });

  it('resetToLoading after an error restores the shimmer', () => {
    const block = document.getElementById('a')!;
    injector.placeLoading(block);
    injector.setError(block, 'Failed', 'Retry', () => {});
    injector.resetToLoading(block);
    const node = block.nextElementSibling!;
    expect(node.querySelector('.bt-bilingual-loading')).not.toBeNull();
    expect(node.querySelector('.bt-bilingual-error')).toBeNull();
  });

  it('teardown is safe to call twice', () => {
    injector.placeLoading(document.getElementById('a')!);
    injector.teardown();
    expect(() => injector.teardown()).not.toThrow();
  });

  it('inserts inside a table cell instead of after it', () => {
    document.body.innerHTML = '<table><tr><td id="c">Cell text content here.</td></tr></table>';
    const cell = document.getElementById('c')!;
    injector.placeLoading(cell);
    expect(cell.querySelector('.bt-bilingual')).not.toBeNull();
    expect(cell.nextElementSibling).toBeNull();
  });

  it('spans the full row when the parent is a flex container', () => {
    document.body.innerHTML = '<div style="display:flex"><p id="f">Flex child text content.</p></div>';
    const block = document.getElementById('f')!;
    injector.placeLoading(block);
    const node = block.nextElementSibling as HTMLElement;
    expect(node.style.flexBasis).toBe('100%');
    expect(node.style.width).toBe('100%');
  });

  it('spans all columns when the parent is a grid container', () => {
    document.body.innerHTML = '<div style="display:grid"><p id="g">Grid child text content.</p></div>';
    const block = document.getElementById('g')!;
    injector.placeLoading(block);
    const node = block.nextElementSibling as HTMLElement;
    expect(node.style.gridColumn).toBe('1 / -1');
  });

  it('inserts a normal block as a sibling with no layout overrides', () => {
    document.body.innerHTML = '<div><p id="n">Normal block text content.</p></div>';
    const block = document.getElementById('n')!;
    injector.placeLoading(block);
    const node = block.nextElementSibling as HTMLElement;
    expect(node.classList.contains('bt-bilingual')).toBe(true);
    expect(node.style.flexBasis).toBe('');
    expect(node.style.gridColumn).toBe('');
  });
});

describe('BilingualInjector translation-only', () => {
  it('hides the original once its translation arrives, and shows it again on teardown', () => {
    document.body.innerHTML = '<p id="p">Hello</p>';
    const block = document.getElementById('p')!;
    const inj = new BilingualInjector(document, true);
    inj.placeLoading(block);
    expect(block.classList.contains('bt-source-hidden')).toBe(false);
    inj.setTranslation(block, 'สวัสดี');
    expect(block.classList.contains('bt-source-hidden')).toBe(true);
    inj.teardown();
    expect(block.classList.contains('bt-source-hidden')).toBe(false);
    expect(document.body.textContent).toBe('Hello');
  });
});
