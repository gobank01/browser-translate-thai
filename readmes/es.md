<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — traducción con privacidad en el navegador" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Lee páginas y subtítulos con el modelo que tú elijas.</strong><br>Código abierto · Tu propia clave API · Sin servidor intermediario · Sin telemetría</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd><b>Español</b></kbd></a>
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
<p align="center"><a href="#installation">Instalar</a> · <a href="#quick-start">Inicio rápido</a> · <a href="./develop/README.md">Documentación</a> · <a href="../CHANGELOG.md">Cambios</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Incidencias</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Compatible con Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Compatible con Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Compatible con Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Última versión"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## ¿Por qué BrowserTranslate?

- **Tu modelo, tu clave.** Conecta una API en la nube, cualquier endpoint compatible con OpenAI o un entorno local, o empieza con los servicios gratuitos de Microsoft y Google, sin clave.
- **Directo, sin intermediarios.** El texto va de tu navegador directamente al proveedor que elijas. Este proyecto no tiene servidores ni recoge telemetría.
- **Pensado para leer.** Texto seleccionado, páginas completas y subtítulos de vídeo, cada uno con su propio proveedor y modelo.

<a id="features"></a>
## Funciones

- **Tarjeta de selección** — selecciona texto y haz clic en el icono, o pulsa **Alt+T** en el modo de atajo de teclado. La respuesta aparece en tiempo real en una tarjeta que puedes fijar y arrastrar; una selección corta puede mostrar una entrada de diccionario.
- **Traducción bilingüe de páginas completas** — la traducción aparece bajo el original a medida que te desplazas. Actívala desde la ventana emergente o con **Alt+A** en el modo de atajo de teclado.
- **Subtítulos de vídeo** — subtítulos bilingües en YouTube, grabaciones de Zoom y Canvas y reproductores HTML5 estándar. Sin transcripción de audio.
- **Muchos proveedores, varios modelos en cada uno** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen y más, además de LM Studio, Ollama y otros entornos locales. Guarda varios modelos por proveedor y elige uno para cada modo.
- **Tu propio prompt base** — consulta el predeterminado y escribe tus propias plantillas.
- **56 idiomas de destino**, interfaz en **15 idiomas**, temas claro y oscuro.

<a id="installation"></a>
## Instalación

**Chrome**, **Edge** y **Firefox** de escritorio. Descarga los paquetes desde [Releases](https://github.com/Lewen-Cai/browser-translate/releases); la extensión no está en la tienda de ningún navegador. Brave, Arc y otros navegadores Chromium usan el paquete de Chrome. Safari no es compatible.

<a id="install-chrome"></a>
### Chrome

1. Descarga el `…-chrome.zip` más reciente y descomprímelo en una carpeta que vayas a conservar.
2. Abre `chrome://extensions`, activa el **Modo de desarrollador**, haz clic en **Cargar descomprimida** y selecciona la carpeta.

<a id="install-edge"></a>
### Edge

Descarga el último `…-edge.zip` (la misma compilación que el paquete de Chrome) y descomprímelo en una carpeta que vayas a conservar. Después, abre `edge://extensions`, activa el **Modo de desarrollador** en la barra lateral izquierda, haz clic en **Cargar descomprimida** y selecciona la carpeta.

<a id="install-firefox"></a>
### Firefox

Firefox 140 o posterior. Descarga el `…-firefox.xpi` más reciente (firmado por Mozilla), ábrelo en Firefox y confirma.

**Actualizar:** la página de ajustes tiene un botón **Buscar actualizaciones** que encuentra el paquete para tu navegador. En Chrome y Edge, descomprime la nueva versión sobre la carpeta anterior y pulsa **Recargar** en la página de extensiones; en Firefox, abre el nuevo `.xpi`. En ambos casos se conserva tu configuración.

<a id="quick-start"></a>
## Inicio rápido

1. Todo empieza desactivado y sin motor elegido, así que ningún texto sale del navegador hasta que eliges uno. Para empezar sin clave, haz clic en el icono de ajustes de la ventana emergente, abre **Proveedores** y activa Microsoft o Google; luego elígelo para cada modo en **Motores de traducción** de la ventana emergente. Después selecciona un texto en una página web y haz clic en el icono azul.
2. Para usar tu propio modelo, haz clic en el icono de ajustes de la ventana emergente, abre **Proveedores**, elige un proveedor y pega su clave API. Verás la lista de sus modelos: añade los que quieras. El proveedor se activa solo.
3. En **Traducción → Motores de traducción**, elige proveedor y modelo para las tarjetas de selección, las páginas completas y los subtítulos.

Los ajustes se dividen en **General**, **Traducción**, **Proveedores**, **Subtítulos** y **Datos**. La [guía de uso](./develop/usage.md) (en inglés) explica cada función en detalle.

<a id="privacy"></a>
## Privacidad

Sin servidor intermediario, sin analíticas, sin registros remotos. El texto que traduces solo llega al servicio que hayas elegido. La configuración y las claves API se guardan en el almacenamiento local de extensiones del navegador y **no están cifradas**. Las opciones gratuitas de Microsoft y Google usan endpoints públicos no oficiales, sin afiliación ni garantía: lee el [aviso](./develop/free-services.md) antes de depender de ellas.

<a id="documentation"></a>
## Documentación

En inglés, en [`readmes/develop/`](./develop/README.md):

- [Guía de uso](./develop/usage.md) — todas las funciones, proveedores y modelos, control del razonamiento, prompts base
- [Servicios de traducción gratuitos](./develop/free-services.md)
- [Arquitectura, privacidad y validación](./develop/architecture.md)
- [Compilar desde el código fuente](./develop/building.md) — `pnpm dev`, la compilación para Firefox, empaquetado

Las notas de versión están en el [registro de cambios](../CHANGELOG.md); los errores y las peticiones van a [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Agradecimientos

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; un proyecto excelente del que aprendimos mucho al crear esta extensión.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logotipos de proveedores, iconos de fabricantes de modelos y la tabla que asocia cada modelo con su icono. Las marcas pertenecen a sus respectivos propietarios y solo identifican el servicio seleccionado.

<a id="license"></a>
## Licencia

[GPL-3.0](../LICENSE). Las obras derivadas que se distribuyan deben cumplir sus obligaciones de código fuente y de licencia. Los recursos de terceros conservan sus respectivas licencias.
