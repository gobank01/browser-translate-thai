<p align="center">
  <img src="./assets/banner.png" alt="BrowserTranslate — privacy-first browser translation" width="900">
</p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>🇹🇭 <a href="./GUIDE-TH.md">พากย์ไทยอัตโนมัติสำหรับคลิปต่างประเทศ — อ่านคู่มือติดตั้งภาษาไทย</a></strong></p>
<p align="center">
  <strong>Read webpages and subtitles with the model you choose.</strong><br>
  Open-source browser translation · Bring your own key · No relay · No telemetry
</p>

<p align="center">
  <a href="./README.md"><kbd><b>English</b></kbd></a>
  <a href="./readmes/zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./readmes/zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./readmes/ja.md"><kbd>日本語</kbd></a>
  <a href="./readmes/ko.md"><kbd>한국어</kbd></a>
  <a href="./readmes/es.md"><kbd>Español</kbd></a>
  <a href="./readmes/fr.md"><kbd>Français</kbd></a><br>
  <a href="./readmes/de.md"><kbd>Deutsch</kbd></a>
  <a href="./readmes/pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./readmes/it.md"><kbd>Italiano</kbd></a>
  <a href="./readmes/ru.md"><kbd>Русский</kbd></a>
  <a href="./readmes/tr.md"><kbd>Türkçe</kbd></a>
  <a href="./readmes/vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./readmes/id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./readmes/th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center">
  <a href="#installation">Install</a> · <a href="#quick-start">Quick start</a> · <a href="./readmes/develop/README.md">Docs</a> · <a href="./CHANGELOG.md">Changelog</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Issues</a>
</p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome supported"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge supported"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox supported"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Latest release"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Why BrowserTranslate?

- **Your model, your key.** Connect a cloud API, any OpenAI-compatible endpoint or a local runtime — or start with the free Microsoft and Google services, no key needed.
- **Direct, no relay.** Text goes from your browser straight to the provider you chose. This project runs no server and collects no telemetry.
- **Made for reading.** Selected text, whole pages and video subtitles, each with its own provider and model.

<a id="features"></a>
## Features

- **Selection card** — select text and click the icon, or press **Alt+T** in hotkey mode. The answer streams into a card you can pin and drag; a short selection can get a dictionary entry.
- **Full-page bilingual translation** — translations appear under the original as you scroll. Turn it on from the popup, or **Alt+A** in hotkey mode.
- **Video subtitles** — bilingual captions on YouTube, Zoom and Canvas recordings and standard HTML5 players. No audio transcription.
- **Many providers, several models each** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen and more, plus LM Studio, Ollama and other local runtimes. Keep several models per provider and choose one for each mode.
- **Your own base prompt** — read the default and write your own templates.
- **56 target languages**, an interface in **15 languages**, light and dark themes.

<a id="installation"></a>
## Install

Desktop **Chrome**, **Edge** and **Firefox**. Download packages from [Releases](https://github.com/Lewen-Cai/browser-translate/releases); the extension is not in any browser's store. Brave, Arc and other Chromium browsers use the Chrome package. Safari is not supported.

<a id="install-chrome"></a>
### Chrome

1. Download the latest `…-chrome.zip` and unzip it into a folder you will keep.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and select the folder.

<a id="install-edge"></a>
### Edge

Download the latest `…-edge.zip` (the same build as the Chrome package) and unzip it into a folder you will keep. Then open `edge://extensions`, turn on **Developer mode** in the left sidebar, click **Load unpacked** and select the folder.

<a id="install-firefox"></a>
### Firefox

Firefox 140 or later. Download the latest `…-firefox.xpi` — signed by Mozilla — open it in Firefox and confirm.

**Updating:** the settings page has a **Check for updates** button that finds the package for your browser. On Chrome and Edge, unzip the new version over the old folder and press **Reload** on the extensions page; on Firefox, open the new `.xpi`. Your settings are kept either way.

<a id="quick-start"></a>
## Quick start

1. Everything starts switched off and no engine is chosen, so no text leaves your browser until you choose one. For a quick start without a key, click the popup's settings icon, open **Providers** and switch on Microsoft or Google, then choose it for each mode under **Translation engines** in the popup; then select some text on a webpage and click the blue icon.
2. To use your own model, click the popup's settings icon, open **Providers**, choose a provider and paste its API key. Its models are listed for you — add the ones you want. The provider switches itself on.
3. In **Translation → Translation engines**, choose a provider and model for selection cards, full pages and subtitles.

The settings are split into **General**, **Translation**, **Providers**, **Subtitles** and **Data**. The [usage guide](./readmes/develop/usage.md) covers each feature in detail.

<a id="privacy"></a>
## Privacy

No relay server, no analytics, no remote logging. The text you translate goes only to the service you selected. Settings and API keys stay in the browser's local extension storage and are **not encrypted**. The free Microsoft and Google options use unofficial public endpoints, with no affiliation and no warranty — read the [notice](./readmes/develop/free-services.md) before relying on them.

<a id="documentation"></a>
## Documentation

In English, under [`readmes/develop/`](./readmes/develop/README.md):

- [Usage guide](./readmes/develop/usage.md) — every feature, providers and models, thinking controls, base prompts
- [Free translation services](./readmes/develop/free-services.md)
- [Architecture, privacy and validation](./readmes/develop/architecture.md)
- [Building from source](./readmes/develop/building.md) — `pnpm dev`, the Firefox build, packaging

Release notes are in the [changelog](./CHANGELOG.md); bugs and requests go to [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Acknowledgements

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; an excellent project we learned from while building this extension.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; provider logos, model vendor icons and the table that matches models to them. Trademarks remain with their respective owners and only identify the selected service.

<a id="license"></a>
## License

[GPL-3.0](./LICENSE). Distributed derivative works must comply with its source-code and licensing obligations. Third-party assets retain their respective licenses.
