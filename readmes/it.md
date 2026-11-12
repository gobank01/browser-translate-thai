<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — traduzione nel browser attenta alla privacy" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Leggi pagine e sottotitoli con il modello che scegli tu.</strong><br>Open source · La tua chiave API · Nessun server intermediario · Nessuna telemetria</p>
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
  <a href="./it.md"><kbd><b>Italiano</b></kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center">
  <a href="#installation">Installa</a> · <a href="#quick-start">Per iniziare</a> · <a href="./develop/README.md">Documentazione</a> · <a href="../CHANGELOG.md">Novità</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Segnalazioni</a>
</p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Chrome supportato"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Edge supportato"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Firefox supportato"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Ultima versione"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Perché BrowserTranslate?

- **Il tuo modello, la tua chiave.** Collega un’API cloud, qualsiasi endpoint compatibile con OpenAI o un runtime locale — oppure inizia con i servizi gratuiti di Microsoft e Google, senza chiave.
- **Diretto, senza intermediari.** Il testo va dal tuo browser direttamente al fornitore che hai scelto. Il progetto non gestisce server e non raccoglie telemetria.
- **Pensato per la lettura.** Testo selezionato, pagine intere e sottotitoli dei video, ciascuno con il proprio fornitore e modello.

<a id="features"></a>
## Funzionalità

- **Scheda di selezione** — seleziona un testo e fai clic sull’icona, oppure premi **Alt+T** in modalità scorciatoia. La risposta arriva in streaming in una scheda che puoi fissare e trascinare; una selezione breve può ricevere una voce di dizionario.
- **Traduzione bilingue dell’intera pagina** — le traduzioni compaiono sotto l’originale mentre scorri. Attivala dal popup o con **Alt+A** in modalità scorciatoia.
- **Sottotitoli dei video** — sottotitoli bilingui su YouTube, nelle registrazioni di Zoom e Canvas e nei player HTML5 standard. Nessuna trascrizione dell’audio.
- **Molti fornitori, più modelli per ciascuno** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen e altri, più LM Studio, Ollama e altri runtime locali. Tieni più modelli per fornitore e scegline uno per ogni modalità.
- **Il tuo prompt di base** — leggi quello predefinito e scrivi i tuoi modelli di prompt.
- **56 lingue di destinazione**, interfaccia in **15 lingue**, temi chiaro e scuro.

<a id="installation"></a>
## Installazione

**Chrome**, **Edge** e **Firefox** desktop. Scarica i pacchetti da [Releases](https://github.com/Lewen-Cai/browser-translate/releases); l’estensione non è presente in nessuno store dei browser. Brave, Arc e gli altri browser Chromium usano il pacchetto per Chrome. Safari non è supportato.

<a id="install-chrome"></a>
### Chrome

1. Scarica l’ultimo `…-chrome.zip` ed estrailo in una cartella da conservare.
2. Apri `chrome://extensions`, abilita **Modalità sviluppatore**, fai clic su **Carica estensione non pacchettizzata** e seleziona la cartella.

<a id="install-edge"></a>
### Edge

Scarica l’ultimo `…-edge.zip` (la stessa build del pacchetto Chrome) ed estrailo in una cartella che conserverai. Poi apri `edge://extensions`, abilita **Modalità sviluppatore** nella barra laterale sinistra, fai clic su **Carica estensione non pacchettizzata** e seleziona la cartella.

<a id="install-firefox"></a>
### Firefox

Firefox 140 o successivo. Scarica l’ultimo `…-firefox.xpi` — firmato da Mozilla —, aprilo in Firefox e conferma.

**Aggiornamenti:** nella pagina delle impostazioni il pulsante **Cerca aggiornamenti** trova il pacchetto per il tuo browser. Su Chrome ed Edge estrai la nuova versione sopra la vecchia cartella e premi **Ricarica** nella pagina delle estensioni; su Firefox apri il nuovo `.xpi`. In entrambi i casi le impostazioni vengono conservate.

<a id="quick-start"></a>
## Per iniziare

1. All’inizio è tutto disattivato e nessun motore è scelto, così nessun testo lascia il browser finché non ne scegli uno. Per iniziare subito senza chiave, fai clic sull’icona delle impostazioni nel popup, apri **Fornitori** e attiva Microsoft o Google, poi sceglilo per ogni modalità in **Motori di traduzione** nel popup; quindi seleziona un testo in una pagina web e fai clic sull’icona blu.
2. Per usare un tuo modello, fai clic sull’icona delle impostazioni nel popup, apri **Fornitori**, scegli un fornitore e incolla la sua chiave API. I suoi modelli vengono elencati: aggiungi quelli che vuoi. Il fornitore si attiva da solo.
3. In **Traduzione → Motori di traduzione** scegli fornitore e modello per le schede di selezione, le pagine intere e i sottotitoli.

Le impostazioni sono divise in **Generali**, **Traduzione**, **Fornitori**, **Sottotitoli** e **Dati**. La [guida all’uso](./develop/usage.md) descrive ogni funzionalità in dettaglio.

<a id="privacy"></a>
## Privacy

Nessun server intermediario, nessuna analisi, nessun log remoto. Il testo che traduci va solo al servizio che hai selezionato. Impostazioni e chiavi API restano nell’archivio locale delle estensioni del browser e **non sono cifrate**. Le opzioni gratuite di Microsoft e Google usano endpoint pubblici non ufficiali, senza alcuna affiliazione e senza garanzia — leggi l’[avviso](./develop/free-services.md) prima di farci affidamento.

<a id="documentation"></a>
## Documentazione

In inglese, in [`readmes/develop/`](./develop/README.md):

- [Guida all’uso](./develop/usage.md) — tutte le funzionalità, fornitori e modelli, controlli del ragionamento, prompt di base
- [Servizi di traduzione gratuiti](./develop/free-services.md)
- [Architettura, privacy e validazione](./develop/architecture.md)
- [Compilare dai sorgenti](./develop/building.md) — `pnpm dev`, la build per Firefox, la creazione dei pacchetti

Le note di rilascio sono nel [changelog](../CHANGELOG.md); bug e richieste vanno nelle [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Ringraziamenti

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; un progetto eccellente da cui abbiamo imparato molto sviluppando questa estensione.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; loghi dei fornitori, icone dei produttori di modelli e la tabella che associa i modelli a queste icone. I marchi restano dei rispettivi proprietari e servono solo a identificare il servizio selezionato.

<a id="license"></a>
## Licenza

[GPL-3.0](../LICENSE). Le opere derivate distribuite devono rispettare gli obblighi relativi al codice sorgente e alla licenza. Le risorse di terze parti mantengono le rispettive licenze.
