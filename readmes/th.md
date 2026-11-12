<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — แปลในเบราว์เซอร์ เน้นความเป็นส่วนตัว" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>อ่านเว็บและซับวิดีโอด้วยโมเดลที่คุณเลือก</strong><br>โอเพนซอร์ส · ใช้คีย์ของคุณเอง · ไม่ผ่านเซิร์ฟเวอร์กลาง · ไม่เก็บข้อมูลการใช้งาน</p>
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
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd><b>ไทย</b></kbd></a>
</p>
<p align="center"><a href="#installation">ติดตั้ง</a> · <a href="#quick-start">เริ่มใช้งาน</a> · <a href="./develop/README.md">เอกสาร</a> · <a href="../CHANGELOG.md">บันทึกการเปลี่ยนแปลง</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">แจ้งปัญหา</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="รองรับ Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="รองรับ Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="รองรับ Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="รุ่นล่าสุด"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## ทำไมต้อง BrowserTranslate?

- **โมเดลของคุณ คีย์ของคุณ** เชื่อม Cloud API, ปลายทางที่รองรับ OpenAI หรือโมเดลที่รันในเครื่อง — หรือเริ่มด้วยบริการฟรีของ Microsoft และ Google ไม่ต้องใช้คีย์
- **ส่งตรง ไม่ผ่านตัวกลาง** ข้อความไปจากเบราว์เซอร์ถึงผู้ให้บริการที่คุณเลือกโดยตรง โปรเจกต์นี้ไม่มีเซิร์ฟเวอร์และไม่เก็บข้อมูลการใช้งาน
- **ทำมาเพื่อการอ่าน** ข้อความที่เลือก ทั้งหน้าเว็บ และซับวิดีโอ แต่ละอย่างเลือกผู้ให้บริการและโมเดลแยกกันได้

<a id="features"></a>
## ฟีเจอร์

- **การ์ดแปลข้อความที่เลือก** — เลือกข้อความแล้วคลิกไอคอน หรือกด **Alt+T** ในโหมดคีย์ลัด คำแปลจะไหลเข้าการ์ดที่ปักและลากได้ ข้อความสั้นๆ จะได้คำอธิบายแบบพจนานุกรม
- **แปลทั้งหน้าแบบสองภาษา** — คำแปลขึ้นใต้ต้นฉบับขณะเลื่อนอ่าน เปิดจาก popup หรือกด **Alt+A** ในโหมดคีย์ลัด
- **ซับวิดีโอ** — ซับสองภาษาบน YouTube, คลิปบันทึกของ Zoom และ Canvas และตัวเล่น HTML5 มาตรฐาน ไม่มีการถอดเสียง
- **พากย์ไทย** — กดปุ่ม TH บนตัวเล่น (หรือ **Alt+D**) เพื่อฟังซับที่แปลแล้วเป็นเสียงไทยจากเสียงในเครื่อง ลดเสียงคลิปลงอัตโนมัติ ไม่มีการเรียกเครือข่ายเพิ่ม
- **ผู้ให้บริการหลายราย หลายโมเดลต่อราย** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen และอื่นๆ รวมถึง LM Studio, Ollama และโมเดลในเครื่องอื่นๆ เก็บหลายโมเดลต่อผู้ให้บริการและเลือกแยกตามโหมดได้
- **Base prompt ของคุณเอง** — อ่านค่าเริ่มต้นแล้วเขียนเทมเพลตของคุณเอง
- **ภาษาปลายทาง 56 ภาษา** หน้าจอ **15 ภาษา** มีธีมสว่างและมืด

<a id="installation"></a>
## ติดตั้ง

ใช้กับ **Chrome**, **Edge** และ **Firefox** บนเดสก์ท็อป ดาวน์โหลดแพ็กเกจจาก [Releases](https://github.com/Lewen-Cai/browser-translate/releases) ส่วนขยายนี้ไม่อยู่ในสโตร์ของเบราว์เซอร์ใด Brave, Arc และเบราว์เซอร์ Chromium อื่นใช้แพ็กเกจ Chrome ไม่รองรับ Safari

<a id="install-chrome"></a>
### Chrome

1. ดาวน์โหลดไฟล์ `…-chrome.zip` ล่าสุด แล้วแตกไฟล์ไว้ในโฟลเดอร์ที่จะเก็บไว้ถาวร
2. เปิด `chrome://extensions` เปิด **Developer mode** คลิก **Load unpacked** แล้วเลือกโฟลเดอร์นั้น

<a id="install-edge"></a>
### Edge

ดาวน์โหลดไฟล์ `…-edge.zip` ล่าสุด (บิลด์เดียวกับแพ็กเกจ Chrome) แล้วแตกไฟล์ไว้ในโฟลเดอร์ที่จะเก็บไว้ถาวร จากนั้นเปิด `edge://extensions` เปิด **Developer mode** ที่แถบด้านซ้าย คลิก **Load unpacked** แล้วเลือกโฟลเดอร์นั้น

<a id="install-firefox"></a>
### Firefox

Firefox 140 ขึ้นไป ดาวน์โหลดไฟล์ `…-firefox.xpi` ล่าสุด ซึ่ง Mozilla เซ็นรับรองแล้ว เปิดใน Firefox แล้วกดยืนยัน

**การอัปเดต:** หน้าตั้งค่ามีปุ่ม **ตรวจหาอัปเดต** ที่หาแพ็กเกจสำหรับเบราว์เซอร์ของคุณ บน Chrome และ Edge ให้แตกไฟล์เวอร์ชันใหม่ทับโฟลเดอร์เดิมแล้วกด **Reload** ในหน้าส่วนขยาย บน Firefox ให้เปิดไฟล์ `.xpi` ใหม่ การตั้งค่าจะยังอยู่ทั้งสองแบบ

<a id="quick-start"></a>
## เริ่มใช้งาน

1. ทุกอย่างเริ่มต้นแบบปิดและยังไม่เลือกเครื่องมือแปล จึงไม่มีข้อความออกจากเบราว์เซอร์จนกว่าคุณจะเลือก ถ้าอยากเริ่มเร็วโดยไม่ใช้คีย์ คลิกไอคอนตั้งค่าใน popup เปิด **ผู้ให้บริการ** แล้วเปิด Microsoft หรือ Google จากนั้นเลือกให้แต่ละโหมดใน **เครื่องมือแปล** ใน popup แล้วเลือกข้อความบนหน้าเว็บและคลิกไอคอนสีฟ้า
2. ถ้าจะใช้โมเดลของคุณเอง คลิกไอคอนตั้งค่าใน popup เปิด **ผู้ให้บริการ** เลือกผู้ให้บริการแล้ววาง API key ระบบจะแสดงรายชื่อโมเดลให้ — เพิ่มอันที่ต้องการ ผู้ให้บริการจะเปิดเอง
3. ใน **การแปล → เครื่องมือแปล** เลือกผู้ให้บริการและโมเดลสำหรับการ์ด ทั้งหน้า และซับ

การตั้งค่าแบ่งเป็น **ทั่วไป**, **การแปล**, **ผู้ให้บริการ**, **ซับไตเติล** และ **ข้อมูล** มีปุ่ม **ตรวจหาอัปเดต** ที่ส่วนหัว [คู่มือการใช้งาน](./develop/usage.md) อธิบายทุกฟีเจอร์อย่างละเอียด (ภาษาอังกฤษ)

<a id="privacy"></a>
## ความเป็นส่วนตัว

ไม่มีเซิร์ฟเวอร์ตัวกลาง ไม่มีระบบวิเคราะห์ ไม่มีการเก็บ log จากระยะไกล ข้อความที่คุณแปลส่งไปเฉพาะบริการที่คุณเลือก การตั้งค่าและ API key อยู่ในพื้นที่เก็บข้อมูลของส่วนขยายในเบราว์เซอร์และ **ไม่ได้เข้ารหัส** เสียงพากย์ไทยสร้างในเครื่องทั้งหมด ตัวเลือกฟรีของ Microsoft และ Google ใช้ปลายทางสาธารณะที่ไม่เป็นทางการ ไม่มีความเกี่ยวข้องและไม่มีการรับประกัน — อ่าน[ประกาศ](./develop/free-services.md)ก่อนใช้งานจริง

<a id="documentation"></a>
## เอกสาร

เป็นภาษาอังกฤษ อยู่ใน [`readmes/develop/`](./develop/README.md):

- [คู่มือการใช้งาน](./develop/usage.md) — ทุกฟีเจอร์ ผู้ให้บริการและโมเดล การควบคุมการคิด base prompt
- [บริการแปลฟรี](./develop/free-services.md)
- [สถาปัตยกรรม ความเป็นส่วนตัว และการตรวจสอบ](./develop/architecture.md)
- [บิลด์จากซอร์สโค้ด](./develop/building.md) — `pnpm dev`, บิลด์ Firefox, การแพ็กเกจ

บันทึกแต่ละรุ่นอยู่ใน [changelog](../CHANGELOG.md) แจ้งบั๊กและขอฟีเจอร์ได้ที่ [Issues](https://github.com/Lewen-Cai/browser-translate/issues)

<a id="acknowledgements"></a>
## ขอบคุณ

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0 โปรเจกต์ยอดเยี่ยมที่เราได้เรียนรู้ระหว่างสร้างส่วนขยายนี้
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT โลโก้ผู้ให้บริการ ไอคอนผู้ผลิตโมเดล และตารางจับคู่โมเดล เครื่องหมายการค้าเป็นของเจ้าของแต่ละราย ใช้เพียงเพื่อระบุบริการที่เลือก

<a id="license"></a>
## สัญญาอนุญาต

[GPL-3.0](../LICENSE) งานดัดแปลงที่เผยแพร่ต้องปฏิบัติตามข้อกำหนดด้านซอร์สโค้ดและสัญญาอนุญาต ทรัพยากรของบุคคลที่สามใช้สัญญาอนุญาตของตนเอง
