import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES, LOCALE_LABELS } from './localeInfo';
import { MESSAGES } from './strings';

// pnpm/Vitest run from the repository root; Vite may rewrite import.meta.url
// to an HTTP URL in jsdom, so do not treat it as a filesystem URL here.
const root = process.cwd();
// English stays at the repository root, which is the only place GitHub reads a
// landing page from. Every other language lives in readmes/, under its own
// locale code.
const pathFor = (locale: string) => locale === 'en' ? 'README.md' : `readmes/${locale}.md`;
const others = LOCALES.filter((l) => l !== 'en');

/** Where a language chip should point, from the document doing the pointing. */
const navTarget = (from: string, to: string) => {
  if (to === 'en') return from === 'en' ? './README.md' : '../README.md';
  return from === 'en' ? `./readmes/${to}.md` : `./${to}.md`;
};

/**
 * The README is the short entry point: what it is, how to install it, how to
 * start. Detail lives in English under readmes/develop/ and every README links
 * there, so the READMEs stay short in all fourteen languages.
 */
const sections = [
  'why', 'features', 'installation', 'install-chrome', 'install-edge', 'install-firefox',
  'quick-start', 'privacy', 'documentation', 'acknowledgements', 'license',
];
const DEVELOP = 'readmes/develop';
const developDocs = ['README.md', 'usage.md', 'free-services.md', 'architecture.md', 'building.md'];
const commands = ['pnpm install', 'pnpm dev', 'pnpm dev:firefox', 'pnpm test', 'pnpm test:run', 'pnpm typecheck', 'pnpm lint', 'pnpm build', 'pnpm build:firefox', 'pnpm zip', 'pnpm zip:firefox'];

/** Check spelling/case even on Windows, where existsSync alone is case-insensitive. */
function existsWithExactCase(relative: string): boolean {
  let current = root;
  for (const part of relative.replace(/^\.\//, '').split('/')) {
    if (!part || part === '.' || part === '..' || !existsSync(current)) return false;
    if (!readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return existsSync(current);
}

/** Every local link and image in a markdown/HTML document. */
function localLinks(content: string): string[] {
  return [
    ...[...content.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]!),
    ...[...content.matchAll(/\]\(([^\s)]+)\)/g)].map((m) => m[1]!),
  ].filter((link) => !/^https:\/\//.test(link));
}

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to hyphens. */
function headingIds(content: string): string[] {
  return [...content.matchAll(/^#{1,6}\s+(.+)$/gm)]
    .map((m) => m[1]!.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-'));
}

/** Resolve a link from a document, failing on a missing file or fragment. */
function checkLink(fromFile: string, link: string, fragments: string[]) {
  if (link.startsWith('#')) {
    expect(fragments, `${fromFile} -> ${link}`).toContain(link.slice(1));
    return;
  }
  const [file] = link.split('#');
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), file!));
  expect(existsWithExactCase(target), `${fromFile} -> ${link}`).toBe(true);
}

describe('localized README coverage', () => {
  it('keeps English at the root, every other language in readmes/, and docs in readmes/develop/', () => {
    expect(readdirSync(root).filter((name) => /^README.*\.md$/.test(name))).toEqual(['README.md']);
    expect(readdirSync(path.join(root, 'readmes')).filter((name) => name.endsWith('.md')).sort())
      .toEqual([...others].sort().map((l) => `${l}.md`));
    expect(readdirSync(path.join(root, DEVELOP)).sort()).toEqual([...developDocs].sort());
    expect(readdirSync(root)).not.toContain('README_CN.md');
  });

  for (const locale of LOCALES) {
    describe(locale, () => {
      const file = pathFor(locale);
      const content = readFileSync(path.join(root, file), 'utf8');
      const headerText = content.slice(0, content.indexOf('<a id="why">'));
      const body = content.slice(headerText.length);
      const header = document.createElement('div');
      header.innerHTML = headerText;
      const up = locale === 'en' ? '.' : '..';

      it('centers the hero and links every language exactly once, marking itself', () => {
        expect(header.querySelector('h1[align="center"]')?.textContent).toBe('BrowserTranslate');
        const links = Array.from(header.querySelectorAll<HTMLAnchorElement>('a')).filter((a) => a.querySelector('kbd'));
        const hrefs = links.map((a) => a.getAttribute('href'));
        expect(hrefs.sort()).toEqual(LOCALES.map((l) => navTarget(locale, l)).sort());
        const current = header.querySelector('kbd > b');
        expect(current?.textContent).toBe(LOCALE_LABELS[locale]);
        expect(current?.closest('a')?.getAttribute('href')).toBe(navTarget(locale, locale));
        for (const link of links) expect(link.closest('p')?.getAttribute('align')).toBe('center');
        for (const image of header.querySelectorAll('img')) expect(image.getAttribute('alt')?.trim()).toBeTruthy();
      });

      it('shows a badge for each supported browser, linking to its install steps', () => {
        for (const browser of ['chrome', 'edge', 'firefox']) {
          const badge = header.querySelector(`a[href="#install-${browser}"] img`);
          expect(badge?.getAttribute('src'), browser).toMatch(/^https:\/\/img\.shields\.io\/badge\//);
        }
      });

      it('has the short structure and the facts a first reader needs', () => {
        const ids = [...content.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
        expect(ids).toEqual(sections);
        // Short is the point: the long README this replaced ran to nearly
        // 15,000 characters of body in English alone. The floor only catches a
        // translation that lost whole sections — CJK scripts say the same in far
        // fewer characters, so theirs is lower.
        const cjk = ['zh-CN', 'zh-TW', 'ja', 'ko'].includes(locale);
        expect(body.length).toBeGreaterThan(cjk ? 1800 : 2500);
        expect(body.length).toBeLessThan(7500);
        // "todo" is ordinary Portuguese/Spanish, not necessarily a TODO marker.
        expect(content).not.toMatch(/<!--\s*TODO\b|\bTODO:/);
        for (const value of ['56', '15', 'Alt+T', 'Alt+A', 'chrome://extensions', 'edge://extensions', '.xpi', '140', 'GPL-3.0']) {
          expect(body, value).toContain(value);
        }
        for (const key of ['subtitleGeneral', 'sectionTranslation', 'sectionProviders', 'sectionSubtitles', 'sectionData', 'sectionRouting', 'checkForUpdate'] as const) {
          expect(body, `settings label: ${key}`).toContain(MESSAGES[locale][key]);
        }
        for (const doc of ['usage.md', 'free-services.md', 'architecture.md', 'building.md']) {
          expect(body, `links ${doc}`).toContain(`${locale === 'en' ? './readmes' : '.'}/develop/${doc}`);
        }
      });

      it('uses valid local links, images and stable fragment targets', () => {
        for (const link of localLinks(content)) checkLink(file, link, sections);
        expect(content).not.toContain('README_CN.md');
        expect(content).toContain(`${up}/assets/banner.png`);
      });
    });
  }
});

describe('English documentation in readmes/develop/', () => {
  const read = (name: string) => readFileSync(path.join(root, DEVELOP, name), 'utf8');
  const all = developDocs.map(read).join('\n');

  for (const name of developDocs) {
    it(`${name}: local links and in-page anchors resolve`, () => {
      const content = read(name);
      for (const link of localLinks(content)) {
        const fragments = link.startsWith('#') ? headingIds(content) : [];
        checkLink(`${DEVELOP}/${name}`, link, fragments);
      }
    });
  }

  it('keeps the detail the README no longer carries', () => {
    for (const value of ['56', '15', '20', '{{...}}', 'chrome.storage.local', 'edge.microsoft.com', 'translate-pa.googleapis.com', 'about:debugging', '.xpi', 'Alt+T', 'Alt+A']) {
      expect(all, value).toContain(value);
    }
    expect(all).toMatch(/12[,.\s]?000/);
    for (const command of commands) expect(all, command).toContain(command);
    expect(all).toContain('../../assets/framework.png');
  });
});
