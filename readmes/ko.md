<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — 개인정보 보호 중심의 브라우저 번역" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>원하는 모델로 웹페이지와 영상 자막을 읽으세요.</strong><br>오픈 소스 · 직접 준비한 API 키 · 중계 서버 없음 · 원격 측정 없음</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd><b>한국어</b></kbd></a>
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
<p align="center"><a href="#installation">설치</a> · <a href="#quick-start">빠른 시작</a> · <a href="./develop/README.md">문서</a> · <a href="../CHANGELOG.md">변경 기록</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">문제 신고</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome 지원"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge 지원"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox 지원"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="최신 릴리스"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## BrowserTranslate를 선택하는 이유

- **내 모델, 내 키.** 클라우드 API, OpenAI 호환 엔드포인트, 로컬 실행 환경 중 원하는 곳에 연결하세요. 키 없이 무료 Microsoft·Google 서비스로 바로 시작할 수도 있습니다.
- **중계 없는 직접 연결.** 텍스트는 브라우저에서 선택한 제공업체로 곧바로 전송됩니다. 이 프로젝트는 서버를 운영하지 않으며 원격 측정 데이터도 수집하지 않습니다.
- **읽기에 맞춘 설계.** 선택한 텍스트, 전체 페이지, 영상 자막마다 제공업체와 모델을 따로 지정할 수 있습니다.

<a id="features"></a>
## 기능

- **선택 카드** — 텍스트를 선택하고 아이콘을 누르거나, 단축키 모드에서 **Alt+T**를 누릅니다. 번역은 고정하고 끌어서 옮길 수 있는 카드에 실시간으로 표시되며, 짧은 선택에는 사전 항목이 나올 수 있습니다.
- **전체 페이지 이중 언어 번역** — 스크롤하는 동안 원문 아래에 번역이 나타납니다. 팝업에서 켜거나 단축키 모드에서 **Alt+A**를 누릅니다.
- **영상 자막** — YouTube, Zoom·Canvas 녹화 영상, 표준 HTML5 플레이어에서 이중 언어 자막을 표시합니다. 음성을 전사하지는 않습니다.
- **다양한 제공업체, 업체마다 여러 모델** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen 등과 LM Studio, Ollama 같은 로컬 실행 환경을 지원합니다. 제공업체마다 여러 모델을 저장해 두고 모드별로 하나씩 고를 수 있습니다.
- **직접 작성하는 기본 프롬프트** — 기본 프롬프트를 확인하고 나만의 템플릿을 작성할 수 있습니다.
- **56개 대상 언어**, **15개 언어**로 된 인터페이스, 밝은 테마와 어두운 테마.

<a id="installation"></a>
## 설치

데스크톱용 **Chrome**, **Edge**, **Firefox**를 지원합니다. 패키지는 [Releases](https://github.com/Lewen-Cai/browser-translate/releases)에서 내려받으세요. 이 확장 프로그램은 어떤 브라우저 스토어에도 등록되어 있지 않습니다. Brave, Arc 등 다른 Chromium 브라우저는 Chrome 패키지를 사용합니다. Safari는 지원하지 않습니다.

<a id="install-chrome"></a>
### Chrome

1. 최신 `…-chrome.zip`을 내려받아 계속 보관할 폴더에 압축을 풉니다.
2. `chrome://extensions`를 열고 **개발자 모드**를 켠 뒤 **압축해제된 확장 프로그램을 로드합니다**를 눌러 그 폴더를 선택합니다.

<a id="install-edge"></a>
### Edge

최신 `…-edge.zip`(Chrome 패키지와 같은 빌드)을 내려받아 계속 둘 폴더에 압축을 풉니다. `edge://extensions`를 열고 왼쪽 사이드바에서 **개발자 모드**를 켠 뒤 **압축해제된 확장 프로그램을 로드합니다**를 눌러 그 폴더를 선택합니다.

<a id="install-firefox"></a>
### Firefox

Firefox 140 이상이 필요합니다. Mozilla가 서명한 최신 `…-firefox.xpi`를 내려받아 Firefox에서 열고 설치를 확인합니다.

**업데이트:** 설정 페이지의 **업데이트 확인** 버튼이 사용 중인 브라우저에 맞는 패키지를 찾아 줍니다. Chrome과 Edge에서는 새 버전을 기존 폴더에 덮어써서 압축을 풀고 확장 프로그램 페이지에서 **새로고침**을 누르세요. Firefox에서는 새 `.xpi`를 열면 됩니다. 어느 쪽이든 설정은 그대로 유지됩니다.

<a id="quick-start"></a>
## 빠른 시작

1. 설치 직후에는 모두 꺼져 있고 번역 엔진도 선택되어 있지 않아서, 선택하기 전에는 어떤 텍스트도 브라우저 밖으로 나가지 않습니다. 키 없이 바로 써 보려면 팝업의 설정 아이콘을 누르고 **제공업체**에서 Microsoft나 Google을 켠 다음, 팝업의 **번역 엔진**에서 용도별로 선택하세요. 그런 다음 웹페이지에서 텍스트를 선택하고 파란 아이콘을 누르면 됩니다.
2. 내 모델을 쓰려면 팝업의 설정 아이콘을 누르고 **제공업체**에서 제공업체를 고른 뒤 API 키를 붙여 넣습니다. 모델 목록이 자동으로 표시되니 원하는 모델을 추가하세요. 제공업체는 자동으로 켜집니다.
3. **번역 → 번역 엔진**에서 선택 카드, 전체 페이지, 자막에 쓸 제공업체와 모델을 고릅니다.

설정은 **일반**, **번역**, **제공업체**, **자막**, **데이터**로 나뉩니다. 기능별 자세한 설명은 [사용 안내서](./develop/usage.md)(영어)를 참고하세요.

<a id="privacy"></a>
## 개인정보

중계 서버, 사용 분석, 원격 로그가 없습니다. 번역하는 텍스트는 선택한 서비스로만 전송됩니다. 설정과 API 키는 브라우저의 로컬 확장 프로그램 저장소에 보관되며 **암호화되지 않습니다**. 무료 Microsoft·Google 옵션은 비공식 공개 엔드포인트를 사용하며 제휴 관계나 보증이 없습니다. 이 옵션에 의존하기 전에 [안내문](./develop/free-services.md)을 읽어 주세요.

<a id="documentation"></a>
## 문서

문서는 영어로만 제공되며 [`readmes/develop/`](./develop/README.md)에 있습니다.

- [사용 안내서](./develop/usage.md) — 모든 기능, 제공업체와 모델, 추론 제어, 기본 프롬프트
- [무료 번역 서비스](./develop/free-services.md)
- [구조, 개인정보, 검증](./develop/architecture.md)
- [소스에서 빌드하기](./develop/building.md) — `pnpm dev`, Firefox 빌드, 패키징

릴리스 노트는 [변경 기록](../CHANGELOG.md)에서 볼 수 있으며, 버그와 요청은 [Issues](https://github.com/Lewen-Cai/browser-translate/issues)에 남겨 주세요.

<a id="acknowledgements"></a>
## 감사의 말

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0. 이 확장 프로그램을 만들며 많은 것을 배운 훌륭한 프로젝트입니다.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT. 제공업체 로고, 모델 개발사 아이콘, 모델과 아이콘을 연결하는 표를 사용합니다. 상표는 각 소유자에게 있으며 선택한 서비스를 식별하는 용도로만 쓰입니다.

<a id="license"></a>
## 라이선스

[GPL-3.0](../LICENSE). 파생 저작물을 배포할 때는 소스 코드 제공과 라이선스 의무를 준수해야 합니다. 타사 자산에는 각자의 라이선스가 적용됩니다.
