<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — terjemahan browser yang mengutamakan privasi" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Baca halaman dan subtitel dengan model pilihan Anda.</strong><br>Sumber terbuka · Kunci API sendiri · Tanpa server perantara · Tanpa telemetri</p>
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
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd><b>Bahasa Indonesia</b></kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center"><a href="#installation">Instalasi</a> · <a href="#quick-start">Mulai cepat</a> · <a href="./develop/README.md">Dokumentasi</a> · <a href="../CHANGELOG.md">Perubahan</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Isu</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome didukung"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge didukung"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox didukung"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Rilis terbaru"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Mengapa BrowserTranslate?

- **Model Anda, kunci Anda.** Hubungkan API cloud, endpoint apa pun yang kompatibel dengan OpenAI, atau runtime lokal — atau mulai dengan layanan gratis Microsoft dan Google, tanpa kunci.
- **Langsung, tanpa perantara.** Teks dikirim dari browser Anda langsung ke penyedia yang Anda pilih. Proyek ini tidak menjalankan server dan tidak mengumpulkan telemetri.
- **Dibuat untuk membaca.** Teks terpilih, halaman utuh, dan subtitel video, masing-masing dengan penyedia dan modelnya sendiri.

<a id="features"></a>
## Fitur

- **Kartu seleksi** — pilih teks lalu klik ikonnya, atau tekan **Alt+T** dalam mode pintasan. Jawaban mengalir ke kartu yang bisa disematkan dan diseret; seleksi pendek bisa mendapat entri kamus.
- **Terjemahan dwibahasa satu halaman** — terjemahan muncul di bawah teks asli saat Anda menggulir. Aktifkan dari popup, atau tekan **Alt+A** dalam mode pintasan.
- **Subtitel video** — subtitel dwibahasa di YouTube, rekaman Zoom dan Canvas, serta pemutar HTML5 standar. Tanpa transkripsi audio.
- **Banyak penyedia, beberapa model per penyedia** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen, dan lainnya, ditambah LM Studio, Ollama, dan runtime lokal lain. Simpan beberapa model per penyedia dan pilih satu untuk tiap mode.
- **Prompt dasar sendiri** — baca prompt bawaan dan tulis templat Anda sendiri.
- **56 bahasa target**, antarmuka dalam **15 bahasa**, tema terang dan gelap.

<a id="installation"></a>
## Instalasi

**Chrome**, **Edge**, dan **Firefox** versi desktop. Unduh paket dari [Releases](https://github.com/Lewen-Cai/browser-translate/releases); ekstensi ini tidak tersedia di toko browser mana pun. Brave, Arc, dan browser Chromium lain memakai paket Chrome. Safari tidak didukung.

<a id="install-chrome"></a>
### Chrome

1. Unduh `…-chrome.zip` terbaru dan ekstrak ke folder yang akan tetap Anda simpan.
2. Buka `chrome://extensions`, aktifkan **Mode developer**, klik **Muat yang belum dipaketkan**, lalu pilih folder tersebut.

<a id="install-edge"></a>
### Edge

Unduh `…-edge.zip` terbaru (build yang sama dengan paket Chrome) dan ekstrak ke folder yang akan Anda simpan. Lalu buka `edge://extensions`, aktifkan **Mode developer** di bilah sisi kiri, klik **Muat yang belum dipaketkan**, lalu pilih folder tersebut.

<a id="install-firefox"></a>
### Firefox

Memerlukan Firefox 140 atau lebih baru. Unduh `…-firefox.xpi` terbaru — sudah ditandatangani Mozilla — buka di Firefox, lalu konfirmasi.

**Pembaruan:** halaman pengaturan memiliki tombol **Periksa pembaruan** yang menemukan paket untuk browser Anda. Di Chrome dan Edge, ekstrak versi baru di atas folder lama lalu tekan **Muat ulang** di halaman ekstensi; di Firefox, buka `.xpi` yang baru. Pengaturan Anda tetap tersimpan.

<a id="quick-start"></a>
## Mulai cepat

1. Semuanya dimulai dalam keadaan mati dan belum ada mesin yang dipilih, jadi tidak ada teks yang keluar dari browser sebelum Anda memilihnya. Untuk mulai cepat tanpa kunci, klik ikon pengaturan di popup, buka **Penyedia**, aktifkan Microsoft atau Google, lalu pilih untuk setiap mode di **Mesin terjemahan** pada popup; setelah itu pilih teks di halaman web dan klik ikon biru.
2. Untuk memakai model Anda sendiri, klik ikon pengaturan di popup, buka **Penyedia**, pilih penyedia, lalu tempel kunci API-nya. Daftar modelnya langsung tersedia — tambahkan yang Anda inginkan. Penyedia akan aktif dengan sendirinya.
3. Di **Terjemahan → Mesin terjemahan**, pilih penyedia dan model untuk kartu seleksi, halaman penuh, dan subtitel.

Pengaturan terbagi menjadi halaman **Umum**, **Terjemahan**, **Penyedia**, **Subtitel**, dan **Data**. [Panduan penggunaan](./develop/usage.md) (bahasa Inggris) membahas setiap fitur secara rinci.

<a id="privacy"></a>
## Privasi

Tanpa server perantara, tanpa analitik, tanpa log jarak jauh. Teks yang Anda terjemahkan hanya dikirim ke layanan yang Anda pilih. Pengaturan dan kunci API tersimpan di penyimpanan ekstensi lokal browser dan **tidak dienkripsi**. Opsi gratis Microsoft dan Google memakai endpoint publik tidak resmi, tanpa afiliasi dan tanpa jaminan — baca [pemberitahuan](./develop/free-services.md) sebelum mengandalkannya.

<a id="documentation"></a>
## Dokumentasi

Dalam bahasa Inggris, di [`readmes/develop/`](./develop/README.md):

- [Panduan penggunaan](./develop/usage.md) — semua fitur, penyedia dan model, kontrol penalaran, prompt dasar
- [Layanan terjemahan gratis](./develop/free-services.md)
- [Arsitektur, privasi, dan validasi](./develop/architecture.md)
- [Membangun dari kode sumber](./develop/building.md) — `pnpm dev`, build Firefox, pengemasan

Catatan rilis ada di [changelog](../CHANGELOG.md); laporan bug dan permintaan fitur silakan diajukan di [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Ucapan terima kasih

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; proyek luar biasa yang menjadi tempat kami banyak belajar saat membangun ekstensi ini.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logo penyedia, ikon vendor model, dan tabel yang mencocokkan model dengan ikonnya. Merek dagang tetap milik pemiliknya masing-masing dan hanya mengidentifikasi layanan yang dipilih.

<a id="license"></a>
## Lisensi

[GPL-3.0](../LICENSE). Karya turunan yang didistribusikan wajib mematuhi kewajiban kode sumber dan lisensinya. Aset pihak ketiga tetap memakai lisensinya masing-masing.
