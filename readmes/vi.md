<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — dịch trong trình duyệt, ưu tiên quyền riêng tư" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Đọc trang web và phụ đề bằng mô hình bạn lựa chọn.</strong><br>Mã nguồn mở · Khóa API của bạn · Không máy chủ trung gian · Không thu thập dữ liệu đo lường</p>
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
  <a href="./vi.md"><kbd><b>Tiếng Việt</b></kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center"><a href="#installation">Cài đặt</a> · <a href="#quick-start">Bắt đầu nhanh</a> · <a href="./develop/README.md">Tài liệu</a> · <a href="../CHANGELOG.md">Nhật ký thay đổi</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Báo lỗi</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Hỗ trợ Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Hỗ trợ Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Hỗ trợ Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Bản phát hành mới nhất"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Vì sao chọn BrowserTranslate?

- **Mô hình của bạn, khóa của bạn.** Kết nối API đám mây, bất kỳ endpoint tương thích OpenAI nào hoặc một môi trường chạy cục bộ — hoặc bắt đầu với dịch vụ miễn phí của Microsoft và Google, không cần khóa.
- **Trực tiếp, không trung gian.** Văn bản đi thẳng từ trình duyệt đến nhà cung cấp bạn chọn. Dự án không vận hành máy chủ nào và không thu thập dữ liệu đo lường.
- **Sinh ra để đọc.** Văn bản được chọn, cả trang web và phụ đề video — mỗi loại có nhà cung cấp và mô hình riêng.

<a id="features"></a>
## Tính năng

- **Thẻ dịch vùng chọn** — chọn văn bản rồi nhấp vào biểu tượng, hoặc nhấn **Alt+T** ở chế độ phím tắt. Kết quả hiện dần trong một thẻ có thể ghim và kéo đi; với đoạn chọn ngắn, bạn có thể nhận được một mục từ điển.
- **Dịch song ngữ cả trang** — bản dịch hiện bên dưới bản gốc khi bạn cuộn trang. Bật từ cửa sổ bật lên, hoặc nhấn **Alt+A** ở chế độ phím tắt.
- **Phụ đề video** — phụ đề song ngữ trên YouTube, bản ghi Zoom và Canvas, cùng các trình phát HTML5 tiêu chuẩn. Không chuyển giọng nói thành văn bản.
- **Nhiều nhà cung cấp, mỗi nơi nhiều mô hình** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen và nhiều hơn nữa, cùng LM Studio, Ollama và các môi trường chạy cục bộ khác. Lưu nhiều mô hình cho mỗi nhà cung cấp và chọn một mô hình cho từng chế độ.
- **Prompt cơ sở của riêng bạn** — xem prompt mặc định và tự viết mẫu riêng.
- **56 ngôn ngữ đích**, giao diện **15 ngôn ngữ**, chủ đề sáng và tối.

<a id="installation"></a>
## Cài đặt

**Chrome**, **Edge** và **Firefox** trên máy tính. Tải gói cài đặt từ [Releases](https://github.com/Lewen-Cai/browser-translate/releases); tiện ích không có trên cửa hàng của trình duyệt nào. Brave, Arc và các trình duyệt Chromium khác dùng gói Chrome. Không hỗ trợ Safari.

<a id="install-chrome"></a>
### Chrome

1. Tải `…-chrome.zip` mới nhất và giải nén vào một thư mục bạn sẽ giữ lại.
2. Mở `chrome://extensions`, bật **Chế độ dành cho nhà phát triển**, nhấp **Tải tiện ích đã giải nén** và chọn thư mục đó.

<a id="install-edge"></a>
### Edge

Tải `…-edge.zip` mới nhất (cùng bản dựng với gói Chrome) và giải nén vào một thư mục bạn sẽ giữ lại. Sau đó mở `edge://extensions`, bật **Chế độ dành cho nhà phát triển** ở thanh bên trái, nhấp **Tải tiện ích đã giải nén** và chọn thư mục đó.

<a id="install-firefox"></a>
### Firefox

Cần Firefox 140 trở lên. Tải `…-firefox.xpi` mới nhất — đã được Mozilla ký — mở bằng Firefox và xác nhận.

**Cập nhật:** trang cài đặt có nút **Kiểm tra cập nhật** để tìm gói phù hợp với trình duyệt của bạn. Trên Chrome và Edge, giải nén bản mới đè lên thư mục cũ rồi nhấn **Tải lại** trên trang tiện ích; trên Firefox, mở tệp `.xpi` mới. Cách nào thì cài đặt của bạn cũng được giữ nguyên.

<a id="quick-start"></a>
## Bắt đầu nhanh

1. Sau khi cài, mọi thứ đều đang tắt và chưa chọn công cụ dịch nào, nên không có văn bản nào rời khỏi trình duyệt cho đến khi bạn chọn. Để bắt đầu nhanh mà không cần khóa, nhấp biểu tượng cài đặt trong cửa sổ bật lên, mở **Nhà cung cấp** và bật Microsoft hoặc Google, rồi chọn nó cho từng chế độ ở **Công cụ dịch** trong cửa sổ bật lên; sau đó chọn một đoạn văn bản trên trang web và nhấp vào biểu tượng màu xanh.
2. Để dùng mô hình của bạn, nhấp biểu tượng cài đặt trong cửa sổ bật lên, mở **Nhà cung cấp**, chọn một nhà cung cấp và dán khóa API. Danh sách mô hình sẽ hiện sẵn — thêm những mô hình bạn muốn. Nhà cung cấp sẽ tự bật.
3. Trong **Dịch → Công cụ dịch**, chọn nhà cung cấp và mô hình cho thẻ vùng chọn, dịch cả trang và phụ đề.

Phần cài đặt chia thành các trang **Chung**, **Dịch**, **Nhà cung cấp**, **Phụ đề** và **Dữ liệu**. [Hướng dẫn sử dụng](./develop/usage.md) (tiếng Anh) trình bày chi tiết từng tính năng.

<a id="privacy"></a>
## Quyền riêng tư

Không máy chủ trung gian, không phân tích, không ghi nhật ký từ xa. Văn bản bạn dịch chỉ được gửi đến dịch vụ bạn đã chọn. Cài đặt và khóa API nằm trong bộ nhớ tiện ích cục bộ của trình duyệt và **không được mã hóa**. Các tùy chọn miễn phí của Microsoft và Google dùng endpoint công khai không chính thức, không liên kết với các hãng này và không có bảo đảm — hãy đọc [thông báo](./develop/free-services.md) trước khi dựa vào chúng.

<a id="documentation"></a>
## Tài liệu

Bằng tiếng Anh, trong [`readmes/develop/`](./develop/README.md):

- [Hướng dẫn sử dụng](./develop/usage.md) — mọi tính năng, nhà cung cấp và mô hình, điều khiển suy luận, prompt cơ sở
- [Dịch vụ dịch miễn phí](./develop/free-services.md)
- [Kiến trúc, quyền riêng tư và kiểm chứng](./develop/architecture.md)
- [Build từ mã nguồn](./develop/building.md) — `pnpm dev`, bản build Firefox, đóng gói

Ghi chú phát hành nằm trong [nhật ký thay đổi](../CHANGELOG.md); báo lỗi và đề xuất xin gửi tại [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Lời cảm ơn

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; một dự án xuất sắc mà chúng tôi đã học hỏi rất nhiều khi xây dựng tiện ích này.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logo nhà cung cấp, biểu tượng hãng phát triển mô hình và bảng ghép mô hình với các biểu tượng đó. Nhãn hiệu thuộc về chủ sở hữu tương ứng và chỉ dùng để nhận diện dịch vụ được chọn.

<a id="license"></a>
## Giấy phép

[GPL-3.0](../LICENSE). Tác phẩm phái sinh khi phân phối phải tuân thủ các nghĩa vụ về mã nguồn và cấp phép của giấy phép này. Tài nguyên bên thứ ba giữ nguyên giấy phép riêng.
