# Building from source

[← Documentation](./README.md)

Requires Node.js 22 or later and pnpm. The extension is built with [WXT](https://wxt.dev), Preact and Tailwind CSS.

```bash
pnpm install          # also generates WXT's types
pnpm dev              # Watch build: dist/chrome-mv3-dev/
pnpm dev:firefox      # Watch build: dist/firefox-mv3-dev/
pnpm test             # Tests in watch mode
pnpm test:run         # Single test run
pnpm typecheck        # WXT type generation + TypeScript
pnpm lint             # ESLint
pnpm build            # Production: dist/chrome-mv3/
pnpm build:firefox    # Production: dist/firefox-mv3/
pnpm zip              # Chrome/Edge package
pnpm zip:firefox      # Firefox package + the sources archive Mozilla asks for
```

## Loading a build

- **Chrome / Edge:** open `chrome://extensions` or `edge://extensions`, enable **Developer mode**, choose **Load unpacked** and select the development or production output folder. Reload it and refresh target webpages after changing builds.
- **Firefox:** open `about:debugging` → **This Firefox** → **Load Temporary Add-on** and pick the build's `manifest.json`. Temporary add-ons are removed when Firefox restarts; a permanent install needs the Mozilla-signed `.xpi` from Releases.

`pnpm dev` does not open a browser itself: load its output once, and it reloads on every change.

## Packaging

`pnpm zip` produces the Chromium package used by Chrome and Edge; releases attach it twice, as `-chrome.zip` and `-edge.zip`, so each browser has a download under its own name. `pnpm zip:firefox` produces the Firefox package and a sources archive: Mozilla reviews bundled add-ons against their source, and rebuilding from that archive with `pnpm install && pnpm zip:firefox` reproduces the package byte for byte. The Firefox package is signed through addons.mozilla.org as a self-distributed (unlisted) add-on.

## Dependencies

pnpm installs only releases that have been public for at least seven days, and blocks dependency install scripts except for an explicit allowlist (see `pnpm-workspace.yaml`).

Vendor and model icons come from [Lobe Icons](https://github.com/lobehub/lobe-icons) (MIT). Models are matched to icons with Lobe's own model table; `scripts/gen-model-icons.mjs` regenerates the table and the icon files from Lobe's packages — usage is in the script's header.
