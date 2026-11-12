<p align="center">
  <img src="../assets/banner.png" alt="BrowserTranslate — 隐私优先的浏览器翻译" width="900">
</p>
<h1 align="center">BrowserTranslate</h1>
<p align="center">
  <strong>用你选择的模型，阅读网页与视频字幕。</strong><br>
  开源浏览器翻译 · 自带 API Key · 零中转 · 零遥测
</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd><b>简体中文</b></kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
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
<p align="center">
  <a href="#installation">安装</a> · <a href="#quick-start">快速上手</a> · <a href="./develop/README.md">文档</a> · <a href="../CHANGELOG.md">更新日志</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">问题反馈</a>
</p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="支持 Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="支持 Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="支持 Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="最新发布版本"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## 为什么选择 BrowserTranslate？

- **你的模型，你的 Key。** 接入云端 API、任意兼容 OpenAI 的端点或本地运行时；也可以先用免费的微软和谷歌翻译服务，无需 Key。
- **直连，无中转。** 文本从浏览器直接发往你选择的服务商。本项目不运营服务器，也不收集遥测数据。
- **为阅读而生。** 划词、整页和视频字幕，各自可以指定服务商和模型。

<a id="features"></a>
## 功能

- **划词卡片** — 选中文字后点击图标，或在快捷键模式下按 **Alt+T**。译文流式输出到卡片中，卡片可固定、可拖动；选中较短的词语时可得到词典释义。
- **整页双语翻译** — 随页面滚动，译文显示在原文下方。可在扩展弹出窗口中开启，或在快捷键模式下按 **Alt+A**。
- **视频字幕** — 为 YouTube、Zoom 和 Canvas 录制视频以及标准 HTML5 播放器提供双语字幕。不做音频转录。
- **多个服务商，每家多个模型** — OpenAI、Claude、Gemini、DeepSeek、OpenRouter、Qwen 等，以及 LM Studio、Ollama 等本地运行时。每个服务商可保存多个模型，并为每种模式分别选择。
- **自定义基础 Prompt** — 查看默认内容，编写自己的模板。
- **56 种目标语言**，界面支持 **15 种语言**，提供浅色与深色主题。

<a id="installation"></a>
## 安装

支持桌面版 **Chrome**、**Edge** 和 **Firefox**。安装包请从 [Releases](https://github.com/Lewen-Cai/browser-translate/releases) 下载；本扩展未上架任何浏览器的应用商店。Brave、Arc 等 Chromium 浏览器使用 Chrome 安装包。不支持 Safari。

<a id="install-chrome"></a>
### Chrome

1. 下载最新的 `…-chrome.zip`，解压到准备长期保留的目录。
2. 打开 `chrome://extensions`，启用**开发者模式**，点击**加载已解压的扩展程序**，选择该目录。

<a id="install-edge"></a>
### Edge

下载最新的 `…-edge.zip`（与 Chrome 版是同一个构建），解压到一个会长期保留的目录。然后打开 `edge://extensions`，在左侧边栏启用**开发者模式**，点击**加载已解压的扩展程序**，选择该目录。

<a id="install-firefox"></a>
### Firefox

需要 Firefox 140 或更高版本。下载最新的 `…-firefox.xpi`（已由 Mozilla 签名），用 Firefox 打开并确认安装。

**更新：** 设置页有一个**检查更新**按钮，会找到适合你浏览器的安装包。Chrome 和 Edge 上，把新版解压覆盖到原目录，再在扩展页点击**重新加载**；Firefox 上，打开新的 `.xpi` 即可。两种方式都会保留你的设置。

<a id="quick-start"></a>
## 快速上手

1. 新安装后所有服务都是关闭的，也没有选择任何翻译引擎，在你选定之前，不会有任何文字离开浏览器。想先不填 Key 直接试用，点击扩展弹出窗口中的设置图标，打开**服务商**，开启微软或谷歌，再在弹出窗口的**翻译引擎**里为各个场景选中它；然后在网页上选中一段文字，点击蓝色图标。
2. 要使用自己的模型，点击扩展弹出窗口中的设置图标，打开**服务商**，选择服务商并粘贴 API Key。扩展会列出它的模型——添加你需要的即可。该服务商会自动启用。
3. 在**翻译 → 翻译引擎**中，为划词卡片、整页和字幕分别选择服务商和模型。

设置分为**通用**、**翻译**、**服务商**、**字幕**和**数据**五页。各项功能的详细说明见[使用指南](./develop/usage.md)。

<a id="privacy"></a>
## 隐私

没有中转服务器，没有统计分析，没有远程日志。你翻译的文本只会发送给你选择的服务。设置和 API Key 保存在浏览器本地的扩展存储中，**未加密**。免费的微软和谷歌选项使用非官方公开端点，与这两家公司无任何关联，也不作任何担保——使用前请阅读[说明](./develop/free-services.md)。

<a id="documentation"></a>
## 文档

以下文档为英文，位于 [`readmes/develop/`](./develop/README.md)：

- [使用指南](./develop/usage.md) — 全部功能、服务商与模型、模型思考、基础 Prompt
- [免费翻译服务](./develop/free-services.md)
- [架构、隐私与校验](./develop/architecture.md)
- [从源码构建](./develop/building.md) — `pnpm dev`、Firefox 构建、打包

版本变化见[更新日志](../CHANGELOG.md)；问题和建议请提交到 [Issues](https://github.com/Lewen-Cai/browser-translate/issues)。

<a id="acknowledgements"></a>
## 致谢

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0；开发本扩展时学习借鉴的优秀项目。
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT；提供服务商标志、模型厂商图标，以及模型与图标的对应表。商标归各自权利人所有，仅用于标识所选服务。

<a id="license"></a>
## 许可证

[GPL-3.0](../LICENSE)。分发派生作品时须履行其源代码与许可义务。第三方素材保留各自的许可证。
