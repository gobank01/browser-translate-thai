<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — tradução no navegador com foco em privacidade" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Leia páginas e legendas com o modelo que você escolher.</strong><br>Código aberto · Sua própria chave API · Sem servidor intermediário · Sem telemetria</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd>Français</kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd><b>Português (Brasil)</b></kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center">
  <a href="#installation">Instalar</a> · <a href="#quick-start">Primeiros passos</a> · <a href="./develop/README.md">Documentação</a> · <a href="../CHANGELOG.md">Alterações</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Issues</a>
</p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Compatível com Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Compatível com Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Compatível com Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Versão mais recente"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Por que o BrowserTranslate?

- **Seu modelo, sua chave.** Conecte uma API na nuvem, qualquer endpoint compatível com OpenAI ou um runtime local — ou comece com os serviços gratuitos da Microsoft e do Google, sem chave.
- **Direto, sem intermediário.** O texto vai do seu navegador direto para o provedor escolhido. O projeto não mantém servidor nem coleta telemetria.
- **Feito para leitura.** Texto selecionado, páginas inteiras e legendas de vídeo, cada um com seu próprio provedor e modelo.

<a id="features"></a>
## Recursos

- **Cartão de seleção** — selecione um texto e clique no ícone, ou pressione **Alt+T** no modo de atalho. A resposta chega em streaming num cartão que você pode fixar e arrastar; uma seleção curta pode receber um verbete de dicionário.
- **Tradução bilíngue da página inteira** — as traduções aparecem abaixo do original conforme você rola a página. Ative pelo popup ou com **Alt+A** no modo de atalho.
- **Legendas de vídeo** — legendas bilíngues no YouTube, em gravações do Zoom e do Canvas e em players HTML5 padrão. Sem transcrição de áudio.
- **Vários provedores, vários modelos em cada um** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen e outros, além de LM Studio, Ollama e outros runtimes locais. Guarde vários modelos por provedor e escolha um para cada modo.
- **Seu próprio prompt base** — leia o padrão e escreva seus próprios modelos de prompt.
- **56 idiomas de destino**, interface em **15 idiomas**, temas claro e escuro.

<a id="installation"></a>
## Instalação

**Chrome**, **Edge** e **Firefox** para desktop. Baixe os pacotes em [Releases](https://github.com/Lewen-Cai/browser-translate/releases); a extensão não está na loja de nenhum navegador. Brave, Arc e outros navegadores Chromium usam o pacote do Chrome. Safari não é suportado.

<a id="install-chrome"></a>
### Chrome

1. Baixe o `…-chrome.zip` mais recente e extraia numa pasta que você vai manter.
2. Abra `chrome://extensions`, ative o **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione a pasta.

<a id="install-edge"></a>
### Edge

Baixe o `…-edge.zip` mais recente (o mesmo build do pacote do Chrome) e descompacte-o numa pasta que você vai manter. Depois, abra `edge://extensions`, ative o **Modo do desenvolvedor** na barra lateral esquerda, clique em **Carregar sem compactação** e selecione a pasta.

<a id="install-firefox"></a>
### Firefox

Firefox 140 ou posterior. Baixe o `…-firefox.xpi` mais recente — assinado pela Mozilla —, abra-o no Firefox e confirme.

**Atualização:** a página de configurações tem um botão **Verificar atualizações** que encontra o pacote do seu navegador. No Chrome e no Edge, extraia a nova versão sobre a pasta antiga e clique em **Recarregar** na página de extensões; no Firefox, abra o novo `.xpi`. Suas configurações são mantidas em ambos os casos.

<a id="quick-start"></a>
## Primeiros passos

1. Tudo começa desativado e sem mecanismo escolhido, então nenhum texto sai do navegador até você escolher um. Para começar sem chave, clique no ícone de configurações do popup, abra **Provedores** e ative a Microsoft ou o Google; depois escolha-o para cada modo em **Mecanismos de tradução** no popup. Então selecione um texto numa página e clique no ícone azul.
2. Para usar seu próprio modelo, clique no ícone de configurações do popup, abra **Provedores**, escolha um provedor e cole a chave de API. Os modelos dele aparecem listados — adicione os que quiser. O provedor se ativa sozinho.
3. Em **Tradução → Mecanismos de tradução**, escolha provedor e modelo para os cartões de seleção, as páginas inteiras e as legendas.

As configurações se dividem em **Geral**, **Tradução**, **Provedores**, **Legendas** e **Dados**. O [guia de uso](./develop/usage.md) explica cada recurso em detalhe.

<a id="privacy"></a>
## Privacidade

Sem servidor intermediário, sem analytics, sem logs remotos. O texto que você traduz vai apenas para o serviço selecionado. Configurações e chaves de API ficam no armazenamento local de extensões do navegador e **não são criptografadas**. As opções gratuitas da Microsoft e do Google usam endpoints públicos não oficiais, sem vínculo com essas empresas e sem garantia — leia o [aviso](./develop/free-services.md) antes de depender delas.

<a id="documentation"></a>
## Documentação

Em inglês, em [`readmes/develop/`](./develop/README.md):

- [Guia de uso](./develop/usage.md) — todos os recursos, provedores e modelos, controles de raciocínio, prompts base
- [Serviços de tradução gratuitos](./develop/free-services.md)
- [Arquitetura, privacidade e validação](./develop/architecture.md)
- [Compilar a partir do código-fonte](./develop/building.md) — `pnpm dev`, o build para Firefox, empacotamento

As notas de versão estão no [changelog](../CHANGELOG.md); bugs e pedidos vão para as [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Agradecimentos

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; um projeto excelente com o qual aprendemos ao desenvolver esta extensão.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; logos de provedores, ícones dos fabricantes de modelos e a tabela que associa os modelos a eles. As marcas pertencem aos respectivos donos e servem apenas para identificar o serviço selecionado.

<a id="license"></a>
## Licença

[GPL-3.0](../LICENSE). Obras derivadas distribuídas devem cumprir as obrigações de código-fonte e de licenciamento. Recursos de terceiros mantêm suas respectivas licenças.
