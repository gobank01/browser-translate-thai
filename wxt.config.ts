import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';
import { loadEnv } from 'vite';

/** .env.local, for the settings of a personal build. */
const personalEnv = loadEnv('production', process.cwd(), 'WXT_');

/**
 * Firefox's permanent id for this add-on. AMO ties every signed version to it,
 * and an installed copy only updates to a file carrying the same one — so it
 * must never change once the first version has been signed.
 */
const GECKO_ID = '{13a30e30-c1c2-45ad-9bd6-9734872155d5}';

export default defineConfig({
  srcDir: 'src',
  // A visible folder: Finder hides `.output`, which is where Load unpacked has to point.
  outDir: 'dist',
  // WXT builds Firefox as MV2 unless told otherwise. One manifest version for
  // every browser keeps the code paths the same: MV3 everywhere.
  manifestVersion: 3,
  vite: () => ({
    plugins: [preact()],
  }),
  zip: {
    // AMO asks for the source of a bundled add-on. An allowlist (WXT 0.21:
    // zipped = includeSources - excludeSources): the repository root also holds
    // local-only material (docs/, CLAUDE.md, scratch logs) that must never be
    // uploaded, and a new file of that kind should stay out without anyone
    // remembering to exclude it. Tests stay in: Tailwind scans every file
    // under src/ for class names, so leaving them out changes the CSS and the
    // reviewer's rebuild would no longer match the submitted package.
    includeSources: [
      'src/**',
      'public/**',
      'scripts/**',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'wxt.config.ts',
      'tsconfig.json',
      'tailwind.config.ts',
      'postcss.config.js',
      'README.md',
      'LICENSE',
    ],
  },
  hooks: {
    // `pnpm dev` grants <all_urls> for its reloader, which already covers every
    // optional host. Chrome then flags each optional one as redundant on every
    // reload. Dev only: a production build keeps them optional.
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.command === 'serve') delete manifest.optional_host_permissions;
    },
  },
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: [
      'storage', 'activeTab', 'contextMenus', 'alarms',
      // Personal builds: the watch log is written by a native host on this Mac.
      ...(personalEnv.WXT_WATCHLOG ? ['nativeMessaging'] : []),
    ],
    // The free translation engines. Most model endpoints stay permission-free:
    // they are chosen at runtime and send CORS headers that let a browser talk
    // to them directly.
    host_permissions: [
      'https://edge.microsoft.com/*',
      'https://translate-pa.googleapis.com/*',
    ],
    // opencode's endpoint sends no CORS headers at all, so no request header can
    // opt in and a host grant is the only way through. Optional rather than
    // required, and asked for when that provider is switched on, so nobody who
    // never uses it is prompted.
    optional_host_permissions: ['https://opencode.ai/*'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'BrowserTranslate',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
      },
    },
    commands: {
      'translate-selection': {
        suggested_key: { default: 'Alt+T' },
        description: 'Translate the current selection',
      },
    },
    web_accessible_resources: [
      {
        // model-icons: the vendor marks the selection card's model menu draws.
        resources: ['fonts/*', 'model-icons/*'],
        matches: ['<all_urls>'],
      },
    ],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: GECKO_ID,
          // 128 brought MAIN-world content scripts (the YouTube bridge); 140
          // brought the data-collection declaration below, which AMO now
          // requires of every new add-on.
          strict_min_version: '140.0',
          // Firefox shows this at install and asks for consent. The page text a
          // reader selects or translates leaves the browser for the service
          // they chose — a model endpoint of their own, or Microsoft's or
          // Google's free translator. Nothing goes to us; there is no server.
          data_collection_permissions: { required: ['websiteContent'] },
        },
      },
    }),
  }),
});
