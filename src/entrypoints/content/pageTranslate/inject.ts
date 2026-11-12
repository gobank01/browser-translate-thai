import { PAGE_TRANSLATE_CSS, PAGE_TRANSLATE_STYLE_ID } from './styles';

const HIDDEN_SOURCE = 'bt-source-hidden';

/**
 * Inserts and manages the bilingual translation nodes in the page DOM. One node
 * per source block, tracked in a Map for clean teardown.
 */
export class BilingualInjector {
  private nodes = new Map<HTMLElement, HTMLElement>();
  private styleInjected = false;

  /**
   * `translationOnly`: once a block's translation arrives, hide the original
   * and show only the translation. Table cells keep both, since there the
   * translation lives inside the cell being hidden.
   */
  constructor(private readonly doc: Document, private readonly translationOnly = false) {}

  private ensureStyles(): void {
    if (this.styleInjected || this.doc.getElementById(PAGE_TRANSLATE_STYLE_ID)) {
      this.styleInjected = true;
      return;
    }
    const style = this.doc.createElement('style');
    style.id = PAGE_TRANSLATE_STYLE_ID;
    style.textContent = PAGE_TRANSLATE_CSS;
    this.doc.head.appendChild(style);
    this.styleInjected = true;
  }

  has(block: HTMLElement): boolean {
    return this.nodes.has(block);
  }

  /** Insert a shimmer placeholder node right after `block`. Idempotent per block. */
  placeLoading(block: HTMLElement): void {
    this.ensureStyles();
    if (this.nodes.has(block)) return;
    const node = this.doc.createElement('div');
    node.className = 'bt-bilingual';
    const shimmer = this.doc.createElement('span');
    shimmer.className = 'bt-bilingual-loading';
    node.appendChild(shimmer);
    this.insertNode(block, node);
    this.nodes.set(block, node);
  }

  /**
   * Place the bilingual node relative to the source block, adapting to layouts
   * that a plain afterend `<div>` would break: table cells (nest inside) and
   * flex/grid parents (span the full row instead of becoming a cramped item).
   */
  private insertNode(block: HTMLElement, node: HTMLElement): void {
    if (block.tagName === 'TD' || block.tagName === 'TH') {
      block.appendChild(node); // a sibling <div> between cells would break the row
      return;
    }
    block.insertAdjacentElement('afterend', node);
    this.applyParentLayout(block, node);
  }

  /** Make the node take its own full-width row inside flex/grid parents. */
  private applyParentLayout(block: HTMLElement, node: HTMLElement): void {
    const parent = block.parentElement;
    if (!parent) return;
    const display = this.doc.defaultView?.getComputedStyle(parent).display ?? '';
    if (display === 'flex' || display === 'inline-flex') {
      node.style.flexBasis = '100%';
      node.style.width = '100%';
    } else if (display === 'grid' || display === 'inline-grid') {
      node.style.gridColumn = '1 / -1';
    }
  }

  setTranslation(block: HTMLElement, text: string): void {
    const node = this.nodes.get(block);
    if (!node) return;
    node.textContent = text;
    if (this.translationOnly && node.parentElement !== block) {
      block.classList.add(HIDDEN_SOURCE);
      node.classList.add('bt-translation-only');
    }
  }

  setError(block: HTMLElement, message: string, retryLabel: string, onRetry: () => void): void {
    const node = this.nodes.get(block);
    if (!node) return;
    node.textContent = '';
    const err = this.doc.createElement('span');
    err.className = 'bt-bilingual-error';
    err.textContent = `${message} · ${retryLabel}`;
    err.addEventListener('click', onRetry);
    node.appendChild(err);
  }

  /** Reset a block back to loading (used by retry). */
  resetToLoading(block: HTMLElement): void {
    const node = this.nodes.get(block);
    if (!node) return;
    node.textContent = '';
    const shimmer = this.doc.createElement('span');
    shimmer.className = 'bt-bilingual-loading';
    node.appendChild(shimmer);
  }

  teardown(): void {
    for (const [block, node] of this.nodes) {
      node.remove();
      block.classList.remove(HIDDEN_SOURCE);
    }
    this.nodes.clear();
    this.doc.getElementById(PAGE_TRANSLATE_STYLE_ID)?.remove();
    this.styleInjected = false; // load-bearing: lets a later enable() re-inject the stylesheet
  }
}
