<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — プライバシーを重視したブラウザ翻訳" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>好きなモデルで、ウェブページと動画字幕を読む。</strong><br>オープンソース · 自分の API キー · 中継サーバーなし · テレメトリなし</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd><b>日本語</b></kbd></a>
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
<p align="center"><a href="#installation">インストール</a> · <a href="#quick-start">クイックスタート</a> · <a href="./develop/README.md">ドキュメント</a> · <a href="../CHANGELOG.md">変更履歴</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">問題の報告</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome に対応"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge に対応"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox に対応"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="最新リリース"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## BrowserTranslate を選ぶ理由

- **自分のモデル、自分のキー。** クラウド API、任意の OpenAI 互換エンドポイント、ローカル実行環境に接続できます。キー不要の無料 Microsoft・Google サービスから始めることもできます。
- **直接接続、中継なし。** テキストはブラウザから選択したプロバイダーへ直接送られます。当プロジェクトはサーバーを運営せず、テレメトリも収集しません。
- **読むための設計。** 選択テキスト、ページ全体、動画字幕のそれぞれに、別々のプロバイダーとモデルを割り当てられます。

<a id="features"></a>
## 機能

- **選択カード** — テキストを選択してアイコンをクリックするか、ホットキーモードで **Alt+T** を押します。訳文はカードにストリーミング表示され、カードは固定やドラッグができます。短い語句を選ぶと辞書エントリが表示されることもあります。
- **ページ全体の対訳表示** — スクロールに合わせて原文の下に訳文が表示されます。ポップアップから有効にするか、ホットキーモードで **Alt+A** を押します。
- **動画字幕** — YouTube、Zoom と Canvas の録画、標準的な HTML5 プレーヤーで対訳字幕を表示します。音声の文字起こしは行いません。
- **多数のプロバイダー、それぞれ複数のモデル** — OpenAI、Claude、Gemini、DeepSeek、OpenRouter、Qwen など、さらに LM Studio、Ollama などのローカル実行環境にも対応。プロバイダーごとに複数のモデルを登録し、モードごとに使い分けられます。
- **独自の基本プロンプト** — 既定の内容を確認し、自分のテンプレートを作成できます。
- **56 の翻訳先言語**、**15 言語**のインターフェース、ライトテーマとダークテーマ。

<a id="installation"></a>
## インストール

デスクトップ版の **Chrome**、**Edge**、**Firefox** に対応しています。パッケージは [Releases](https://github.com/Lewen-Cai/browser-translate/releases) からダウンロードしてください。どのブラウザのストアにも公開していません。Brave や Arc などの Chromium 系ブラウザでは Chrome 用パッケージを使います。Safari には対応していません。

<a id="install-chrome"></a>
### Chrome

1. 最新の `…-chrome.zip` をダウンロードし、継続して使うフォルダーへ展開します。
2. `chrome://extensions` を開き、**デベロッパーモード**を有効にして、**パッケージ化されていない拡張機能を読み込む**からそのフォルダーを選びます。

<a id="install-edge"></a>
### Edge

最新の `…-edge.zip`（Chrome 版と同じビルド）をダウンロードし、残しておくフォルダーに展開します。`edge://extensions` を開き、左側のサイドバーで**デベロッパーモード**を有効にして、**パッケージ化されていない拡張機能を読み込む**からそのフォルダーを選びます。

<a id="install-firefox"></a>
### Firefox

Firefox 140 以降が必要です。最新の `…-firefox.xpi`（Mozilla の署名済み）をダウンロードし、Firefox で開いて確認します。

**更新：** 設定ページの**更新を確認**ボタンで、お使いのブラウザ用のパッケージを見つけられます。Chrome と Edge では新しいバージョンを既存のフォルダーへ上書き展開し、拡張機能ページで**再読み込み**を押します。Firefox では新しい `.xpi` を開きます。どちらの場合も設定は引き継がれます。

<a id="quick-start"></a>
## クイックスタート

1. インストール直後はすべて無効で、翻訳エンジンも選ばれていないため、選ぶまでテキストがブラウザーの外に送られることはありません。キーなしですぐ試すには、ポップアップの設定アイコンから**プロバイダー**を開いて Microsoft か Google を有効にし、ポップアップの**翻訳エンジン**で用途ごとに選びます。あとはウェブページでテキストを選択し、青いアイコンをクリックしてください。
2. 自分のモデルを使うには、ポップアップの設定アイコンをクリックし、**プロバイダー**を開いてプロバイダーを選び、API キーを貼り付けます。利用できるモデルが一覧表示されるので、使いたいものを追加します。プロバイダーは自動で有効になります。
3. **翻訳 → 翻訳エンジン**で、選択カード、ページ全体、字幕それぞれのプロバイダーとモデルを選びます。

設定は**全般**、**翻訳**、**プロバイダー**、**字幕**、**データ**の 5 つに分かれています。各機能の詳細は[使い方ガイド](./develop/usage.md)を参照してください。

<a id="privacy"></a>
## プライバシー

中継サーバー、アクセス解析、リモートログはいずれもありません。翻訳するテキストは選択したサービスにのみ送られます。設定と API キーはブラウザのローカル拡張機能ストレージに保存され、**暗号化されません**。無料の Microsoft・Google オプションは非公式の公開エンドポイントを使っており、両社とは無関係で、何の保証もありません。利用する前に[注意事項](./develop/free-services.md)をお読みください。

<a id="documentation"></a>
## ドキュメント

[`readmes/develop/`](./develop/README.md) にあります（英語）。

- [使い方ガイド](./develop/usage.md) — 全機能、プロバイダーとモデル、思考の制御、基本プロンプト
- [無料翻訳サービス](./develop/free-services.md)
- [アーキテクチャ、プライバシー、検証](./develop/architecture.md)
- [ソースからのビルド](./develop/building.md) — `pnpm dev`、Firefox 版のビルド、パッケージ化

リリースノートは[変更履歴](../CHANGELOG.md)に、不具合の報告や要望は [Issues](https://github.com/Lewen-Cai/browser-translate/issues) へどうぞ。

<a id="acknowledgements"></a>
## 謝辞

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0。この拡張機能を作るうえで多くを学んだ、優れたプロジェクトです。
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT。プロバイダーのロゴ、モデル提供元のアイコン、およびモデルとアイコンの対応表。商標は各権利者に帰属し、選択したサービスを示す目的でのみ使用しています。

<a id="license"></a>
## ライセンス

[GPL-3.0](../LICENSE)。派生物を配布する場合は、ソースコードとライセンスに関する義務を守る必要があります。サードパーティの素材にはそれぞれのライセンスが適用されます。
