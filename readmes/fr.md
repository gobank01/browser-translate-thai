<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — traduction dans le navigateur, respectueuse de la vie privée" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Lisez les pages et les sous-titres avec le modèle de votre choix.</strong><br>Open source · Votre propre clé API · Aucun relais · Aucune télémétrie</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd><b>Français</b></kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
  <a href="./th.md"><kbd>ไทย</kbd></a>
</p>
<p align="center"><a href="#installation">Installer</a> · <a href="#quick-start">Démarrage rapide</a> · <a href="./develop/README.md">Documentation</a> · <a href="../CHANGELOG.md">Changements</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Signaler un problème</a></p>
<p align="center">
  <a href="#install-chrome"><img src="https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&amp;logo=googlechrome&amp;logoColor=white" alt="Compatible avec Chrome"></a>
  <a href="#install-edge"><img src="https://img.shields.io/badge/Edge-supported-0078D7?style=flat-square&amp;logo=microsoftedge&amp;logoColor=white" alt="Compatible avec Edge"></a>
  <a href="#install-firefox"><img src="https://img.shields.io/badge/Firefox-supported-FF7139?style=flat-square&amp;logo=firefoxbrowser&amp;logoColor=white" alt="Compatible avec Firefox"></a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Dernière version"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Pourquoi BrowserTranslate ?

- **Votre modèle, votre clé.** Connectez une API cloud, n’importe quel endpoint compatible OpenAI ou un environnement local — ou commencez avec les services gratuits de Microsoft et Google, sans clé.
- **En direct, sans relais.** Le texte part de votre navigateur directement vers le fournisseur choisi. Ce projet n’exploite aucun serveur et ne collecte aucune télémétrie.
- **Conçu pour la lecture.** Texte sélectionné, pages entières et sous-titres vidéo, chacun avec son propre fournisseur et son propre modèle.

<a id="features"></a>
## Fonctionnalités

- **Carte de sélection** — sélectionnez du texte et cliquez sur l’icône, ou appuyez sur **Alt+T** en mode raccourci clavier. La réponse s’affiche au fil de l’eau dans une carte que vous pouvez épingler et déplacer ; une sélection courte peut donner une entrée de dictionnaire.
- **Traduction bilingue de pages entières** — les traductions apparaissent sous l’original à mesure que vous faites défiler. Activez-la depuis la fenêtre contextuelle, ou avec **Alt+A** en mode raccourci clavier.
- **Sous-titres vidéo** — sous-titres bilingues sur YouTube, les enregistrements Zoom et Canvas et les lecteurs HTML5 standard. Aucune transcription audio.
- **De nombreux fournisseurs, plusieurs modèles chacun** — OpenAI, Claude, Gemini, DeepSeek, OpenRouter, Qwen et d’autres, ainsi que LM Studio, Ollama et d’autres environnements locaux. Gardez plusieurs modèles par fournisseur et choisissez-en un pour chaque mode.
- **Votre propre prompt de base** — consultez celui par défaut et rédigez vos propres modèles de prompt.
- **56 langues cibles**, une interface en **15 langues**, thèmes clair et sombre.

<a id="installation"></a>
## Installation

**Chrome**, **Edge** et **Firefox** sur ordinateur. Téléchargez les paquets depuis [Releases](https://github.com/Lewen-Cai/browser-translate/releases) ; l’extension n’est dans la boutique d’aucun navigateur. Brave, Arc et les autres navigateurs Chromium utilisent le paquet Chrome. Safari n’est pas pris en charge.

<a id="install-chrome"></a>
### Chrome

1. Téléchargez le dernier `…-chrome.zip` et décompressez-le dans un dossier que vous conserverez.
2. Ouvrez `chrome://extensions`, activez le **mode développeur**, cliquez sur **Charger l’extension non empaquetée** et sélectionnez le dossier.

<a id="install-edge"></a>
### Edge

Téléchargez le dernier `…-edge.zip` (la même version que le paquet Chrome) et décompressez-le dans un dossier que vous conserverez. Ensuite, ouvrez `edge://extensions`, activez le **mode développeur** dans la barre latérale gauche, cliquez sur **Charger l’extension non empaquetée** et sélectionnez le dossier.

<a id="install-firefox"></a>
### Firefox

Firefox 140 ou version ultérieure. Téléchargez le dernier `…-firefox.xpi` — signé par Mozilla —, ouvrez-le dans Firefox et confirmez.

**Mise à jour :** la page des paramètres comporte un bouton **Rechercher les mises à jour** qui trouve le paquet adapté à votre navigateur. Sous Chrome et Edge, décompressez la nouvelle version par-dessus l’ancien dossier et cliquez sur **Recharger** dans la page des extensions ; sous Firefox, ouvrez le nouveau `.xpi`. Dans les deux cas, vos paramètres sont conservés.

<a id="quick-start"></a>
## Démarrage rapide

1. Tout est désactivé au départ et aucun moteur n’est choisi : aucun texte ne quitte le navigateur avant que vous n’en choisissiez un. Pour démarrer sans clé, cliquez sur l’icône des paramètres dans la fenêtre contextuelle, ouvrez **Fournisseurs** et activez Microsoft ou Google, puis choisissez-le pour chaque mode sous **Moteurs de traduction** dans la fenêtre contextuelle ; sélectionnez ensuite du texte sur une page web et cliquez sur l’icône bleue.
2. Pour utiliser votre propre modèle, cliquez sur l’icône des paramètres dans la fenêtre contextuelle, ouvrez **Fournisseurs**, choisissez un fournisseur et collez sa clé API. Ses modèles s’affichent : ajoutez ceux que vous voulez. Le fournisseur s’active de lui-même.
3. Dans **Traduction → Moteurs de traduction**, choisissez un fournisseur et un modèle pour les cartes de sélection, les pages entières et les sous-titres.

Les paramètres sont répartis entre **Général**, **Traduction**, **Fournisseurs**, **Sous-titres** et **Données**. Le [guide d’utilisation](./develop/usage.md) (en anglais) détaille chaque fonctionnalité.

<a id="privacy"></a>
## Confidentialité

Aucun serveur relais, aucune mesure d’audience, aucune journalisation à distance. Le texte que vous traduisez n’est envoyé qu’au service choisi. Les paramètres et les clés API restent dans le stockage local des extensions du navigateur et **ne sont pas chiffrés**. Les options gratuites Microsoft et Google passent par des endpoints publics non officiels, sans affiliation ni garantie : lisez l’[avertissement](./develop/free-services.md) avant de vous y fier.

<a id="documentation"></a>
## Documentation

En anglais, dans [`readmes/develop/`](./develop/README.md) :

- [Guide d’utilisation](./develop/usage.md) — toutes les fonctionnalités, fournisseurs et modèles, contrôle de la réflexion, prompts de base
- [Services de traduction gratuits](./develop/free-services.md)
- [Architecture, confidentialité et validation](./develop/architecture.md)
- [Compiler depuis les sources](./develop/building.md) — `pnpm dev`, le build Firefox, l’empaquetage

Les notes de version se trouvent dans le [journal des modifications](../CHANGELOG.md) ; bugs et demandes sont à signaler dans les [Issues](https://github.com/Lewen-Cai/browser-translate/issues).

<a id="acknowledgements"></a>
## Remerciements

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0 ; un excellent projet qui nous a beaucoup appris pendant la création de cette extension.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT ; logos des fournisseurs, icônes des éditeurs de modèles et la table qui associe chaque modèle à son icône. Les marques appartiennent à leurs propriétaires respectifs et servent uniquement à identifier le service choisi.

<a id="license"></a>
## Licence

[GPL-3.0](../LICENSE). Toute œuvre dérivée distribuée doit respecter les obligations de cette licence, notamment en matière de code source. Les ressources tierces conservent leurs licences respectives.
