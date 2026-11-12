<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — перевод в браузере с уважением к приватности" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Читайте страницы и субтитры с выбранной вами моделью.</strong><br>Открытый код · Свой API-ключ · Без промежуточного сервера · Без телеметрии</p>
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
  <a href="./ru.md"><kbd><b>Русский</b></kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center"><a href="#installation">Установка</a> · <a href="#quick-start">Быстрый старт</a> · <a href="./develop/README.md">Документация</a> · <a href="../CHANGELOG.md">Изменения</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Issues</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome поддерживается"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge поддерживается"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox поддерживается"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Последний выпуск"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Почему BrowserTranslate?

- **Ваша модель, ваш ключ.** Подключите облачный API, любой OpenAI-совместимый эндпоинт или локальную среду — либо начните с бесплатных сервисов Microsoft и Google, ключ не нужен.
- **Напрямую, без посредника.** Текст идёт из браузера прямо к выбранному провайдеру. У проекта нет своего сервера, и он не собирает телеметрию.
- **Создан для чтения.** Выделенный текст, целые страницы и субтитры к видео — у каждого режима свой провайдер и своя модель.

<a id="features"></a>
## Возможности

- **Карточка для выделенного текста** — выделите текст и нажмите на значок (или **Alt+T** в режиме горячих клавиш). Ответ появляется по мере генерации в карточке, которую можно закрепить и перетащить; для короткого фрагмента может прийти словарная статья.
- **Двуязычный перевод всей страницы** — перевод появляется под оригиналом по мере прокрутки. Включается во всплывающем окне или клавишами **Alt+A** в режиме горячих клавиш.
- **Субтитры к видео** — двуязычные субтитры на YouTube, в записях Zoom и Canvas и в стандартных HTML5-плеерах. Распознавания речи нет.
- **Много провайдеров, у каждого несколько моделей** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen и другие, а также LM Studio, Ollama и прочие локальные среды. Держите у провайдера несколько моделей и выбирайте свою для каждого режима.
- **Свой базовый промпт** — посмотрите стандартный и напишите собственные шаблоны.
- **56 целевых языков**, интерфейс на **15 языках**, светлая и тёмная темы.

<a id="installation"></a>
## Установка

Настольные **Chrome**, **Edge** и **Firefox**. Пакеты скачиваются со страницы [Releases](https://github.com/Lewen-Cai/browser-translate/releases); в магазинах браузеров расширения нет. Brave, Arc и другие браузеры на Chromium используют пакет для Chrome. Safari не поддерживается.

<a id="install-chrome"></a>
### Chrome

1. Скачайте последний `…-chrome.zip` и распакуйте его в папку, которую не будете удалять.
2. Откройте `chrome://extensions`, включите **Режим разработчика**, нажмите **Загрузить распакованное расширение** и выберите папку.

<a id="install-edge"></a>
### Edge

Скачайте последний `…-edge.zip` (та же сборка, что и пакет для Chrome) и распакуйте его в папку, которую не будете удалять. Затем откройте `edge://extensions`, включите **Режим разработчика** на левой боковой панели, нажмите **Загрузить распакованное расширение** и выберите папку.

<a id="install-firefox"></a>
### Firefox

Нужен Firefox 140 или новее. Скачайте последний `…-firefox.xpi` (он подписан Mozilla), откройте его в Firefox и подтвердите установку.

**Обновление:** на странице настроек есть кнопка **Проверить обновления** — она находит пакет для вашего браузера. В Chrome и Edge распакуйте новую версию поверх старой папки и нажмите **Обновить** на странице расширений; в Firefox откройте новый `.xpi`. Настройки в любом случае сохраняются.

<a id="quick-start"></a>
## Быстрый старт

1. После установки всё выключено и сервис перевода не выбран, поэтому никакой текст не покидает браузер, пока вы его не выберете. Чтобы быстро начать без ключа, нажмите значок настроек во всплывающем окне, откройте **Провайдеры** и включите Microsoft или Google, затем выберите его для каждого режима в разделе **Сервисы перевода** во всплывающем окне; после этого выделите текст на странице и нажмите синий значок.
2. Чтобы подключить свою модель, нажмите значок настроек во всплывающем окне, откройте **Провайдеры**, выберите провайдера и вставьте его API-ключ. Список моделей подгрузится сам — добавьте нужные. Провайдер включится автоматически.
3. В разделе **Перевод → Сервисы перевода** выберите провайдера и модель для карточек, целых страниц и субтитров.

Настройки разделены на страницы **Общие**, **Перевод**, **Провайдеры**, **Субтитры** и **Данные**. Каждая функция подробно описана в [руководстве пользователя](./develop/usage.md) (на английском).

<a id="privacy"></a>
## Конфиденциальность

Ни промежуточного сервера, ни аналитики, ни удалённых логов. Переводимый текст уходит только в выбранный вами сервис. Настройки и API-ключи хранятся в локальном хранилище расширения в браузере и **не шифруются**. Бесплатные варианты Microsoft и Google используют неофициальные публичные эндпоинты — без связи с этими компаниями и без гарантий. Прежде чем на них полагаться, прочтите [предупреждение](./develop/free-services.md).

<a id="documentation"></a>
## Документация

На английском языке, в [`readmes/develop/`](./develop/README.md):

- [Руководство пользователя](./develop/usage.md) — все функции, провайдеры и модели, настройки рассуждения, базовые промпты
- [Бесплатные сервисы перевода](./develop/free-services.md)
- [Архитектура, конфиденциальность и проверка](./develop/architecture.md)
- [Сборка из исходного кода](./develop/building.md) — `pnpm dev`, сборка для Firefox, упаковка

Примечания к выпускам — в [журнале изменений](../CHANGELOG.md); об ошибках и пожеланиях пишите в [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Благодарности

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; отличный проект, у которого мы многому научились, создавая это расширение.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; логотипы провайдеров, значки разработчиков моделей и таблица, сопоставляющая им модели. Товарные знаки принадлежат их владельцам и лишь обозначают выбранный сервис.

<a id="license"></a>
## Лицензия

[GPL-3.0](../LICENSE). Распространяемые производные работы должны соблюдать её требования к исходному коду и лицензированию. Сторонние ресурсы сохраняют собственные лицензии.
