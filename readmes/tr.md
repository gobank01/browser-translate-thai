<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — gizlilik odaklı tarayıcı çevirisi" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Web sayfalarını ve altyazıları seçtiğiniz modelle okuyun.</strong><br>Açık kaynak · Kendi API anahtarınız · Aracı sunucu yok · Telemetri yok</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd>Français</kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd><b>Türkçe</b></kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center"><a href="#installation">Kurulum</a> · <a href="#quick-start">Hızlı başlangıç</a> · <a href="./develop/README.md">Belgeler</a> · <a href="../CHANGELOG.md">Değişiklikler</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Sorunlar</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome destekleniyor"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge destekleniyor"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox destekleniyor"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Son sürüm"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Neden BrowserTranslate?

- **Modeliniz, anahtarınız.** Bir bulut API'sine, OpenAI uyumlu herhangi bir uç noktaya ya da yerel bir çalışma ortamına bağlanın — veya anahtar gerektirmeyen ücretsiz Microsoft ve Google hizmetleriyle başlayın.
- **Doğrudan, aracısız.** Metin tarayıcınızdan doğrudan seçtiğiniz sağlayıcıya gider. Bu projenin bir sunucusu yoktur ve telemetri toplamaz.
- **Okumak için tasarlandı.** Seçili metin, sayfanın tamamı ve video altyazıları; her biri kendi sağlayıcısı ve modeliyle.

<a id="features"></a>
## Özellikler

- **Seçim kartı** — metni seçip simgeye tıklayın ya da kısayol modunda **Alt+T**'ye basın. Yanıt, sabitleyip sürükleyebileceğiniz bir karta akarak gelir; kısa bir seçim için sözlük girdisi gösterilebilir.
- **Tam sayfa iki dilli çeviri** — siz kaydırdıkça çeviriler özgün metnin altında belirir. Açılır pencereden ya da kısayol modunda **Alt+A** ile açın.
- **Video altyazıları** — YouTube, Zoom ve Canvas kayıtlarında ve standart HTML5 oynatıcılarda iki dilli altyazı. Sesten metne dönüştürme yapılmaz.
- **Çok sayıda sağlayıcı, her birinde birden fazla model** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen ve daha fazlası; ayrıca LM Studio, Ollama ve diğer yerel çalışma ortamları. Her sağlayıcıda birkaç model tutun ve her mod için birini seçin.
- **Kendi temel isteminiz** — varsayılanı okuyun, kendi şablonlarınızı yazın.
- **56 hedef dil**, **15 dilde** arayüz, açık ve koyu tema.

<a id="installation"></a>
## Kurulum

Masaüstünde **Chrome**, **Edge** ve **Firefox**. Paketleri [Releases](https://github.com/Lewen-Cai/browser-translate/releases) sayfasından indirin; uzantı hiçbir tarayıcı mağazasında yer almıyor. Brave, Arc ve diğer Chromium tabanlı tarayıcılar Chrome paketini kullanır. Safari desteklenmez.

<a id="install-chrome"></a>
### Chrome

1. En son `…-chrome.zip` dosyasını indirin ve silmeyeceğiniz bir klasöre açın.
2. `chrome://extensions` sayfasını açın, **Geliştirici modu**nu etkinleştirin, **Paketlenmemiş öğe yükle**'ye tıklayın ve klasörü seçin.

<a id="install-edge"></a>
### Edge

En son `…-edge.zip` dosyasını (Chrome paketiyle aynı derleme) indirip saklayacağınız bir klasöre çıkarın. Ardından `edge://extensions` sayfasını açın, sol kenar çubuğunda **Geliştirici modu**nu etkinleştirin, **Paketlenmemiş öğe yükle**'ye tıklayın ve klasörü seçin.

<a id="install-firefox"></a>
### Firefox

Firefox 140 veya üzeri gerekir. Mozilla tarafından imzalanmış en son `…-firefox.xpi` dosyasını indirin, Firefox'ta açın ve onaylayın.

**Güncelleme:** ayarlar sayfasındaki **Güncellemeleri denetle** düğmesi tarayıcınıza uygun paketi bulur. Chrome ve Edge'de yeni sürümü eski klasörün üzerine açın ve uzantılar sayfasında **Yeniden yükle**'ye basın; Firefox'ta yeni `.xpi` dosyasını açın. Her iki durumda da ayarlarınız korunur.

<a id="quick-start"></a>
## Hızlı başlangıç

1. Kurulumdan sonra her şey kapalıdır ve hiçbir motor seçili değildir; siz seçene kadar hiçbir metin tarayıcınızdan çıkmaz. Anahtarsız hızlı başlangıç için açılır penceredeki ayarlar simgesine tıklayın, **Sağlayıcılar** bölümünü açıp Microsoft ya da Google'ı açın, ardından açılır penceredeki **Çeviri motorları** bölümünde her mod için onu seçin; sonra bir web sayfasında metin seçip mavi simgeye tıklayın.
2. Kendi modelinizi kullanmak için açılır penceredeki ayarlar simgesine tıklayın, **Sağlayıcılar** bölümünü açın, bir sağlayıcı seçin ve API anahtarını yapıştırın. Sağlayıcının modelleri sizin için listelenir — istediklerinizi ekleyin. Sağlayıcı kendiliğinden etkinleşir.
3. **Çeviri → Çeviri motorları** bölümünde seçim kartları, tam sayfalar ve altyazılar için sağlayıcı ve model seçin.

Ayarlar **Genel**, **Çeviri**, **Sağlayıcılar**, **Altyazılar** ve **Veriler** sayfalarına ayrılır. Her özellik [kullanım kılavuzunda](./develop/usage.md) (İngilizce) ayrıntılı olarak anlatılır.

<a id="privacy"></a>
## Gizlilik

Aracı sunucu, analiz ya da uzaktan günlük kaydı yok. Çevirdiğiniz metin yalnızca seçtiğiniz hizmete gider. Ayarlar ve API anahtarları tarayıcının yerel uzantı depolamasında kalır ve **şifrelenmez**. Ücretsiz Microsoft ve Google seçenekleri resmî olmayan, herkese açık uç noktalar kullanır; bu şirketlerle bir bağı yoktur ve garanti verilmez. Bunlara güvenmeden önce [bildirimi](./develop/free-services.md) okuyun.

<a id="documentation"></a>
## Belgeler

İngilizce olarak [`readmes/develop/`](./develop/README.md) altında:

- [Kullanım kılavuzu](./develop/usage.md) — tüm özellikler, sağlayıcılar ve modeller, düşünme ayarları, temel istemler
- [Ücretsiz çeviri hizmetleri](./develop/free-services.md)
- [Mimari, gizlilik ve doğrulama](./develop/architecture.md)
- [Kaynaktan derleme](./develop/building.md) — `pnpm dev`, Firefox derlemesi, paketleme

Sürüm notları [değişiklik günlüğünde](../CHANGELOG.md); hata bildirimleri ve istekler için [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Teşekkürler

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; bu uzantıyı geliştirirken çok şey öğrendiğimiz harika bir proje.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; sağlayıcı logoları, model üreticisi simgeleri ve modelleri bunlarla eşleştiren tablo. Ticari markalar sahiplerine aittir ve yalnızca seçilen hizmeti belirtir.

<a id="license"></a>
## Lisans

[GPL-3.0](../LICENSE). Dağıtılan türev çalışmalar, lisansın kaynak kodu ve lisanslama yükümlülüklerine uymalıdır. Üçüncü taraf varlıklar kendi lisanslarını korur.
