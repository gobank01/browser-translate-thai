<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — 隱私優先的瀏覽器翻譯" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>用你選擇的模型，閱讀網頁與影片字幕。</strong><br>開源瀏覽器翻譯 · 自備 API Key · 無中繼伺服器 · 零遙測</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd><b>繁體中文</b></kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd>Français</kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center"><a href="#installation">安裝</a> · <a href="#quick-start">快速上手</a> · <a href="./develop/README.md">文件</a> · <a href="../CHANGELOG.md">更新紀錄</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">問題回報</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="支援 Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="支援 Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="支援 Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="最新發行版本"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## 為什麼選擇 BrowserTranslate？

- **你的模型，你的金鑰。** 連接雲端 API、任何相容 OpenAI 的端點或本機執行環境；也可以先使用免費的 Microsoft 與 Google 翻譯服務，不需要金鑰。
- **直接連線，沒有中繼。** 文字從瀏覽器直接傳送給你選擇的服務商。本專案不營運任何伺服器，也不收集遙測資料。
- **專為閱讀設計。** 選取文字、整個網頁和影片字幕，各自可以指定服務商與模型。

<a id="features"></a>
## 功能

- **選取翻譯卡片** — 選取文字後點選圖示，或在快捷鍵模式下按 **Alt+T**。譯文以串流方式顯示在卡片中，卡片可以釘選和拖曳；選取較短的詞語時可取得詞典條目。
- **整頁雙語翻譯** — 隨著頁面捲動，譯文會顯示在原文下方。可從彈出視窗開啟，或在快捷鍵模式下按 **Alt+A**。
- **影片字幕** — 為 YouTube、Zoom 與 Canvas 的錄影以及標準 HTML5 播放器提供雙語字幕。不進行音訊轉錄。
- **多家服務商，每家多個模型** — OpenAI、Claude、Gemini、DeepSeek、OpenRouter、Qwen 等，以及 LM Studio、Ollama 等本機執行環境。每家服務商可保存多個模型，並為每種模式分別選擇。
- **自訂基礎 Prompt** — 查看預設內容，撰寫自己的範本。
- **56 種目標語言**，介面支援 **15 種語言**，提供淺色與深色主題。

<a id="installation"></a>
## 安裝

支援桌面版 **Chrome**、**Edge** 與 **Firefox**。請從 [Releases](https://github.com/Lewen-Cai/browser-translate/releases) 下載安裝套件；本擴充功能並未上架任何瀏覽器的線上商店。Brave、Arc 等 Chromium 瀏覽器請使用 Chrome 套件。不支援 Safari。

<a id="install-chrome"></a>
### Chrome

1. 下載最新的 `…-chrome.zip`，解壓縮至準備長期保留的資料夾。
2. 開啟 `chrome://extensions`，啟用**開發人員模式**，按一下**載入未封裝項目**，選擇該資料夾。

<a id="install-edge"></a>
### Edge

下載最新的 `…-edge.zip`（與 Chrome 版是同一個建置），解壓縮到一個會長期保留的資料夾。然後開啟 `edge://extensions`，在左側側邊欄啟用**開發人員模式**，按一下**載入未封裝項目**，選擇該資料夾。

<a id="install-firefox"></a>
### Firefox

需要 Firefox 140 以上版本。下載最新的 `…-firefox.xpi`（已由 Mozilla 簽署），用 Firefox 開啟並確認安裝。

**更新：** 設定頁有一個**檢查更新**按鈕，會找出適合你瀏覽器的安裝套件。在 Chrome 與 Edge 上，將新版解壓縮覆蓋原資料夾，再到擴充功能頁按**重新載入**；在 Firefox 上，開啟新的 `.xpi` 即可。兩種方式都會保留你的設定。

<a id="quick-start"></a>
## 快速上手

1. 剛安裝時所有服務都是關閉的，也沒有選擇任何翻譯引擎，在你選定之前，不會有任何文字離開瀏覽器。想先不填金鑰直接試用，點選彈出視窗中的設定圖示，開啟**服務商**，開啟 Microsoft 或 Google，再在彈出視窗的**翻譯引擎**中為各個情境選取它；然後在網頁上選取一段文字，點選藍色圖示。
2. 若要使用自己的模型，點選彈出視窗中的設定圖示，開啟**服務商**，選擇服務商並貼上 API 金鑰。擴充功能會列出它的模型——加入你需要的即可。該服務商會自動啟用。
3. 在**翻譯 → 翻譯引擎**中，為選取翻譯卡片、整頁和字幕分別選擇服務商與模型。

設定分為**通用**、**翻譯**、**服務商**、**字幕**與**資料**五頁。各項功能的詳細說明請見[使用指南](./develop/usage.md)。

<a id="privacy"></a>
## 隱私

沒有中繼伺服器、沒有使用分析、沒有遠端記錄。你翻譯的文字只會傳送給你選擇的服務。設定與 API 金鑰保存在瀏覽器本機的擴充功能儲存空間中，**並未加密**。免費的 Microsoft 與 Google 選項使用非官方的公開端點，與兩家公司沒有任何關係，也不提供任何擔保——使用前請先閱讀[說明](./develop/free-services.md)。

<a id="documentation"></a>
## 文件

以下文件為英文，位於 [`readmes/develop/`](./develop/README.md)：

- [使用指南](./develop/usage.md) — 所有功能、服務商與模型、模型思考、基礎 Prompt
- [免費翻譯服務](./develop/free-services.md)
- [架構、隱私與驗證](./develop/architecture.md)
- [從原始碼建置](./develop/building.md) — `pnpm dev`、Firefox 建置、封裝

版本變更請見[更新紀錄](../CHANGELOG.md)；問題與建議請提交至 [Issues](https://github.com/Lewen-Cai/browser-translate/issues)。

<a id="acknowledgements"></a>
## 致謝

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0；開發本擴充功能時學習借鏡的優秀專案。
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT；提供服務商標誌、模型廠商圖示，以及模型與圖示的對照表。商標歸各自權利人所有，僅用於識別所選服務。

<a id="license"></a>
## 授權條款

[GPL-3.0](../LICENSE)。散布衍生作品時必須履行其原始碼與授權義務。第三方素材保留各自的授權條款。
