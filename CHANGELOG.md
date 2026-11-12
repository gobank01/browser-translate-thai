# Changelog

All notable changes will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.3.0] — 2026-11-12 · Thai dub

The first numbered release of the Thai-dub fork (gobank01/browser-translate-thai).
Everything since 0.2.3:

### Added
- **Thai dub.** Translated subtitles are spoken in sync with the video, the
  original sound ducked. Voices: GPT Audio Mini through OpenRouter (female
  Marin/Coral, male Cedar/Ash; each line checked against its transcript, with a
  Gemini TTS fallback), ElevenLabs as an option, or the Mac's own voice for free.
- **Starts by itself** on foreign-language videos (the spoken language is read
  from YouTube's auto-captions), with a progress note on the video and the
  video held until the dub is ready.
- **YouTube's own Thai audio first.** A video that already has a Thai audio
  track — YouTube's auto-dubs and creators' dubs — plays that instead: in sync
  and free. One click still switches to our dub.
- **Voice per channel.** The dub voice matches the channel's speaker (male or
  female), decided once per channel and remembered; a voice picked on the video
  overrides it for that channel.
- TH button, Option+D, popup switch and volume buttons, settings card, Thai
  interface language, spoken-style translation, on-disk audio cache.
- Setup wizard (`node setup.mjs`) and a Thai guide (GUIDE-TH.md). Keys stay in
  `.env.local` and are never committed.
- Optional watch log written as notes on this Mac, with a recommender.

## [0.2.3] — 2026-11-09

### Added
- **Firefox and Edge support.** Each release now has a package for Chrome,
  Edge and Firefox. Firefox needs version 140 or later and gets an `.xpi`
  signed by Mozilla for self-distribution, so it installs for good rather
  than as a temporary add-on; its install prompt declares that website
  content is sent elsewhere — the text you translate, going to the service
  you chose. The Edge package is the same build as Chrome's, which Brave and
  Arc also use. The update check offers Firefox the `.xpi` and the other
  browsers the Chromium package.
- **Several models per provider.** Each provider keeps a list of models, and
  selection cards, full pages and subtitles each choose a provider *and* a
  model — a strong model for selections and a cheap one for whole pages under
  the same key, say. The card's provider menu lists every model as well, and
  each model's answers are cached apart. Existing settings carry over: a
  provider's single model becomes a one-item list, and each mode keeps the
  provider and model it was using.
- **The endpoint's own model list.** Once a provider's key works, the models
  its endpoint offers are listed beside yours, with a search box; click one
  to add or remove it. A provider being set up switches itself on as soon as
  its key works and a model is chosen — one you have switched off stays off.
- **Vendor icons for models**, from LobeHub's own model table: about a
  hundred vendors, matched by model name on any provider — OpenRouter,
  SiliconFlow, a local runtime or a vendor's own API.

### Changed
- **Nothing is switched on or chosen in a new installation.** Microsoft and
  Google start switched off like every other provider, and no mode has an
  engine, so no text leaves the browser until you choose where it goes. For
  a key-free start, switch one on under Providers and choose it for each
  mode under Translation engines. Existing installations keep their
  settings.
- **A mode whose provider or model goes away is not configured, with no
  fallback.** If no engine is chosen for a mode, the provider it uses is
  switched off — by hand, or because its last model was removed, which now
  switches it off — or its model is removed or no longer offered by the
  provider, the engine picker shows *Not configured*, with one note below the
  pickers explaining it, and the card, the page and the subtitles report it
  instead of translating. Nothing is sent anywhere until you choose again;
  switching the provider back on does not restore the old choice.
  Switched-off providers no longer appear among the choices.
- **Redesigned settings.** General shows one live preview — the card at its
  chosen size over a page, with the trigger icon or your shortcut — above
  plain rows, and the shortcut fields appear only in hotkey mode. Data uses
  segmented steps for cache age and tiles for export and import. A provider
  opens into separate cards for connection, models and reasoning.
- **Providers are grouped** into free translation services, cloud APIs
  (bring your own key) and local or custom endpoints. The notice about the
  free services moved there, shown on request, and no longer sits under the
  engine pickers.
- **The popup leads with the current page:** the site's name, a larger
  Translate full page switch and a line saying which state the page is in.
  The engines sit in a card of their own; in hotkey mode the footer shows
  both shortcuts.
- **Shorter READMEs** in all 14 languages, with a badge for each supported
  browser and install steps per browser. Localized READMEs live in
  `readmes/<locale>.md`; the detail moved to English documentation in
  `readmes/develop/`.
- **Safer dependencies.** Build and test tooling is patched — `pnpm audit`
  went from 92 findings to 2, none of them in code the extension ships —
  ESLint moves to 10 and WXT to 0.21, and installs take only releases that
  have been public for at least a week. CI now builds with pnpm 11 and
  Node 22, as the new install settings require.

### Fixed
- **A switched-off provider was still used.** Turning a provider off only
  removed it from the pickers: modes already routed to it — Microsoft
  included — kept sending text to it. A switched-off provider is now never
  used.
- A change made in the popup could be undone by the settings page: with
  both open, the next change made on the settings page wrote back its older
  copy of everything else. Each page now writes only what it changes and
  shows changes made on the other.
- The Kimi icon was invisible on a light background; only its blue dot
  showed.
- The trigger-mode label no longer carries a "(default)" note that ran past
  the edge of its control.

## [0.2.2] — 2026-09-23

### Added
- **Complete READMEs in all 14 interface languages**, with a centered project
  header, language navigation and links to installation, configuration and
  project activity. Localized files use `README_<locale>.md`; the Simplified
  Chinese entry is now `README_zh-CN.md` instead of `README_CN.md`.
- **Custom base prompts** with a template library and editor. The default is
  visible and read-only; create from it or from a blank template through New.
  Save & apply in one step, or save without applying for later. Internal
  dictionary and output-format rules remain managed by the extension.
- **56 translation targets**, including US, UK and Australian English, and
  **14 interface languages**. New UI locales: Brazilian Portuguese, Italian,
  Russian, Turkish, Vietnamese and Indonesian. Search target languages by
  native, English or localized name, code, or common English-region aliases.
- **Subtitle preview and compact controls** for both lines, with exact size
  and opacity inputs, a small color palette, HEX entry and a visible reset
  button.

### Changed
- **A compact interface** with system UI fonts and five settings pages:
  General, Translation, Providers, Subtitles and Data. Provider setup is
  separate from translation policy; cache controls now live under Data.
- Popup focuses on target language, a current-page bilingual switch and
  compact engine choices. Trigger mode stays in settings. Version and update
  controls appear only in settings, using the same font as the interface, and
  what a check finds lands in a full-width strip below the header rather than
  inside it — so the header keeps one height and long localized instructions
  are not squeezed into a narrow column.
- Removed same-language blocking for selections, pages and subtitles so
  mixed-language text and regional rewrites can be requested normally.
- Generic English targets migrate to US English. Unsupported English
  varieties on free services silently fall back to generic English without
  switching providers. LLMs receive explicit regional instructions.

### Fixed
- **Passages no longer enter dictionary mode.** Short terms retain automatic
  lookup, but dictionary entries must match the whole selection. Suspect
  structured output is validated before rendering; invalid output gets one
  text-only correction and is never exposed as raw protocol JSON or cached.
- **Page and subtitle batches align by ID.** Missing/duplicate IDs and invalid
  value types are rejected. A failed batch uses validated text-only fallbacks
  instead of displaying raw responses. Retry attempts replace earlier streamed
  text rather than appending to it.
- Substantial mixed-script source text can display a mixed-language label
  instead of being confidently identified as English by character count.
- Prompt edits use separate LLM cache entries. Page and subtitle instructions
  are also isolated; free-service caches are independent of custom prompts.
- Subtitle settings show valid values from the player instead of blank
  dropdowns when a value is absent from a short preset list.

## [0.2.1] — 2026-08-30

### Added
- **Check for a new version, from the settings header.** Opposite the title:
  the installed version, and a button that asks GitHub whether a newer release
  exists. Only when you press it — nothing runs on its own, and nothing about
  you is sent. If there is one, it offers the build itself: one click
  downloads the `.zip`, and a note says what to do with it, because Chrome
  cannot install an extension it did not install in the first place.
- **DashScope now offers every region it publishes, and its subscription.**
  Beijing, Singapore, Hong Kong and US (Virginia) are listed separately, and so
  is Token Plan — a subscription on hosts of its own, whose `sk-sp-` keys the
  metered endpoints refuse and which refuses metered keys in turn. Frankfurt and
  Tokyo are reachable only at a per-workspace address, so this provider also
  lets you type one in. Each endpoint is a separate account with its own key and
  model list, and the form now says so.
- **A custom or local endpoint can say which reasoning parameter it reads.**
  Thinking control was previously only available for the vendors we had the
  mapping for; for a custom endpoint or a local runtime, what the server
  accepts is decided by software you chose, so you can now name it —
  `enable_thinking`, `reasoning_effort`, `thinking.type` and the rest — or
  leave it sending nothing, which is still the default.

### Changed
- **The selection card is one fixed size.** Its height used to come from
  whatever was in it, capped by however much window was left below the
  selection — so the same word came out four times taller at the top of a page
  than at the bottom, and every streamed answer grew the box line by line.
  Now the frame never moves: the original and the translation each scroll in
  their own half of it, and the card goes above the selection when it will not
  fit below. The original is capped at three tenths of the space the two panes
  share — it is there to check the translation against, not to be read instead
  of it. A card still waiting for its first words is the one exception to all
  of this: it shows only that it is waiting, at the size of saying so, and the
  frame arrives with the first words. Copy moved up beside translate-again,
  which leaves both panes the same width and their scrollbars lined up.
- **How big the card is, is now yours to set** (General → Appearance). Six
  widths and six heights. Fixing the size is what keeps an arriving answer from
  moving anything, but how much room that answer deserves depends on the screen
  it is read on.

### Fixed
- **Copying from the card no longer pastes a black background.** Chrome writes
  an HTML flavour alongside the plain text on a copy, and it carried the card's
  own background into whatever you pasted into. A copy that starts inside the
  card now yields the words alone.

## [0.2.0] — 2026-08-14

### Added
- **Many providers at once, and one per job.** Providers are now a list you
  configure independently rather than a single active profile, and each of the
  three surfaces — the selection card, full-page translation, and video
  subtitles — is routed to whichever one you want. Routing lives in General
  settings, because which provider answers is a policy about your reading, not
  a property of any provider. New arrivals: Anthropic (Claude), Gemini, and
  opencode, whose Zen and Go plans are separate products with separate
  catalogues and are offered as separate endpoints. The Providers page is a
  searchable panel of fixed height, so a growing list never pushes the rest of
  the page off the screen, and every provider that is switched on reports its
  own latency.
- **34 target languages, chosen separately from the interface language.** What
  you read in and what the extension speaks to you in are different questions.
- **The card answers on its own terms.** The credit line at its foot became a
  provider switcher — who answered and who could answer instead are the same
  question — with the target language at the other end of that line, a copy
  control beside the translation, and translate-again in the header. Every one
  of those choices lasts as long as the card and is never written back to
  settings: a provider tried on one paragraph is an answer about that
  paragraph, not a change of mind about the extension.
- **The card names the language pair**, detected from the selection itself so
  it is there before the answer is, and so it works with a model that never
  reports a detected language.
- **Subtitles beyond YouTube.** The translator now takes a site rather than
  assuming one. Zoom cloud recordings work — its transcript lives behind
  Zoom's own endpoint rather than on the video — as do Canvas recordings,
  which Canvas serves from an iframe of their own, and any player that ships
  its captions the standard way with a `<track>` element. The toggle joins the
  player's own control bar where there is one to join, and takes a corner of
  the picture where there is not.

### Changed
- The popup lost its status strip. Naming one provider could not stand for
  three, and the routing section below names all of them.
- Card dropdowns open downward, so choosing a provider never covers the
  translation you are choosing it for.

### Fixed
- Asking again now reaches past the cache, which would otherwise hand back the
  same words.
- The "already in your target language" notice no longer hides the language
  control, which is the one thing that can answer it.
- A second translation run can no longer have its chunks overwritten by the
  run it replaced.

## [0.1.9] — 2026-08-14

### Added
- Translate without an API key. A new translation-engine choice (Settings →
  Translation, and in the popup) picks between Microsoft, Google, and your own
  model. The two free engines need no key and no configuration, so a fresh
  install translates the moment it is loaded; selection, full-page and
  YouTube subtitles all go through whichever engine is selected. Your own
  API remains the only engine that does dictionary lookups, since those
  depend on the model deciding what a selection is. **These free options
  call public endpoints rather than official APIs — this project is not
  affiliated with Microsoft or Google, the endpoints may change or stop
  working without notice, and text you translate is sent to those services
  under their terms. See "A note on the free engines" in the README.**
- Auto-generated (ASR) YouTube captions are now translated. They used to be
  skipped for two reasons, both fixed: they render as a rolling window that
  covered the injected line, and they arrive a couple of words at a time,
  which is not enough context to translate. The subtitles are now drawn by
  the extension rather than injected into YouTube's caption markup, and ASR
  words are regrouped into sentences — split on punctuation, on a pause, or
  on length — before being sent.
- A settings menu inside the YouTube player, on the extension's button in the
  control bar: a switch for the subtitles, and a style page with display mode
  (bilingual, original only, translation only), which line sits on top,
  backdrop opacity, and size, colour, font and weight for each line
  separately. The same settings are on the options page.
- The subtitle block can be dragged by the grip above it, to either half of
  the picture — dragged past the middle it anchors to the top and stays there
  when the player grows. The position is kept as a percentage of the player's
  height, so it means the same thing inline as in fullscreen, and the block
  lifts clear of the control bar while that is on screen.
- The translation card can be moved by its grip and pinned. A pinned card
  holds its place on screen while you scroll, survives a click elsewhere, and
  translates the next selection without moving.
- The card shows the source text above the translation, clamped to three
  lines with a chevron to open it, and names whatever produced the
  translation — the model for an LLM, the service otherwise.
- Each provider shows its own mark in the picker, from Lobe Icons (MIT).

### Changed
- The theme system is deferred. Four palettes with uploadable variants, two
  token-injection points and a service worker that recoloured the toolbar
  icon pixel by pixel was a lot of machinery to carry through every new
  surface. It may come back in a form that costs less to carry; for now one
  palette remains, in light and dark, still following the system or your
  choice. Latin text is now set in JetBrains Mono (SIL OFL, bundled) and CJK
  in Source Han Serif — the family Google also publishes as Noto Serif CJK,
  SIL OFL. Like every CJK face here it is named rather than shipped: they are
  megabytes each. Corners are rounder throughout.
- The engine picker separates translation services from LLM providers rather
  than listing all three as peers, and the API fields are hidden — not just
  dimmed — when a service is selected.
- The provider dropdown is a real list showing each vendor's mark. A native
  select can only hold text.
- The settings page is one page per subject instead of everything that was not
  the API key piling up under "general": Translation (engine, target language,
  cache), General (trigger, shortcuts, appearance), Video (subtitles) and Data
  (import/export). Type is a notch larger throughout, section headings most of
  all.
- YouTube subtitles are set in the player's own caption font by default, so the
  translated line reads as a pair with the caption above it. Nothing is bundled
  — the family is named, and resolves to whatever the page and the system
  already provide.
- YouTube subtitles are translated around the playhead — roughly the next
  30 seconds, widened when the video plays faster — instead of the whole
  transcript up front. Subtitles start appearing within a second or two on a
  long video instead of after the entire track has been processed, scrubbing
  lands on the new position immediately, and nothing is spent on parts of
  the video that are never watched.
- YouTube subtitles are positioned and sized from the player rather than
  from YouTube's caption elements, so theater mode, fullscreen and resizing
  need no special handling.

### Fixed
- Dragging the subtitles could close the translation, for three separate
  reasons. Releasing a drag writes the new position, and the content script
  rebuilt every watcher on any stored change — so the drag tore the
  translator down mid-video. The drag also leaked a click onto the player,
  which pauses the video and, over an end screen, navigates away. And the
  overlay took YouTube's styles and event delegation, so it now lives in a
  shadow root.
- The translation card closed when you pressed its own pin, grip or source
  expander. Its outside-click check compared the event target against the
  shadow root, but a document listener sees that target retargeted to the
  host — so every press inside the card read as a press outside it.
- A subtitle line whose translation request failed used to stay on
  "translating…" for the rest of the video. Each cue now gets one retry and
  is then shown as the original alone.
- The button at the foot of the in-player style page reset only the block's
  position, so changing the subtitle size and colour and then pressing it
  appeared to do nothing. It resets every setting on the page. Its scroll track
  also ran into the panel's rounded corner and was clipped by it.
- Japanese and Korean had no font of their own anywhere in the extension.
  Korean fell through to the monospace tail of the stack, and Japanese Han
  characters were drawn with Chinese shapes — 直 and 骨 are not the same
  glyph in the two languages. The font stack now follows the language of the
  text: the interface language for the extension's own surfaces, the target
  language for the on-video subtitles.

### Note on upgrading
- The manifest now requests access to `edge.microsoft.com` and
  `translate-pa.googleapis.com`, the two free translation endpoints. Chrome
  asks you to approve the new permission when the extension updates.
- Cached translations from earlier versions are ignored (the cache key now
  includes which engine produced the entry, so results from different
  engines can't collide). They expire on the usual schedule.

## [0.1.8] — 2026-08-13

### Added
- Model thinking control, off by default: hybrid reasoning models (e.g.
  DeepSeek V4) think before every answer unless told not to, which made
  translations noticeably slower and billed invisible reasoning tokens. The
  extension now sends the provider's disable parameter by default for
  DeepSeek, Zhipu, Qwen (DashScope), SiliconFlow, and OpenRouter, restoring
  fast non-thinking replies. A "Model thinking" control (Settings → API, and
  in the popup for supported providers) turns thinking back on at five
  effort levels — Low / Medium / High / XHigh / Max — mapped to each
  provider's native parameter (reasoning_effort, thinking_budget, or
  reasoning.effort); the choice is remembered per provider. Providers
  without a safe parameter (OpenAI, Moonshot, Mistral, custom, local) are
  unaffected.
- Themes: four built-in themes — Cobalt (default, the previous look),
  Graphite, Sepia, and Teal — in Settings → General → Appearance. Each theme
  styles the popup, the settings page, and the in-page translation card,
  defines both light and dark variants (the light/dark mode setting keeps
  working independently), and carries its own typography — Cobalt keeps
  Geist, Graphite pairs a neutral grotesque with Consolas, Sepia is a serif
  with a typewriter mono, Teal a humanist sans. You can also upload your own
  theme as a JSON file and delete it again; the format (documented in the
  README) is validated strictly — all 12 color tokens required in light,
  unknown fields rejected. The extension's toolbar icon follows the theme
  too: it is tinted to the active theme's brand color using the same
  light/dark variant the page resolves, matching the in-page trigger icon.

### Removed
- Prompt templates. The four built-in styles and custom templates are gone;
  translation always uses one built-in prompt, and the model judges register
  and topic on its own. The Prompts settings page, the template pickers, and
  the related storage fields were removed — existing settings (and old
  settings-export files) load cleanly, with the legacy fields stripped.

## [0.1.7] — 2026-06-02

### Changed
- YouTube subtitle translation now works with manual / creator-provided caption
  tracks only. The translate button no longer appears on videos that have just
  auto-generated (ASR) captions — YouTube renders those in a rolling style that
  covered the translation line, so bilingual could not show. Manual-caption
  videos are unaffected.
- The Base URL hint in settings now matches the selected service type: cloud
  providers in Cloud mode, and self-hosted runtimes (LM Studio, Ollama,
  llama.cpp, vLLM) in Local mode (previously it always listed cloud providers,
  including Ollama by mistake).

## [0.1.6] — 2026-06-01

### Added
- YouTube subtitle translation: on a YouTube video, click the "译" button in the
  player controls to translate the video's existing captions. The translation
  appears as a second line beneath YouTube's native subtitle (bilingual), matching
  the caption font, with a "translating…" placeholder while it works. The line you
  are currently watching is translated first, and it keeps up when you seek.
  Requires the video to have captions (manual or auto-generated) with captions (CC)
  turned on. Works with your configured model — translation concurrency is
  provider-aware (cloud fans out across batches; local runs a shallow pipeline).
  YouTube only; it does not transcribe audio (no speech-recognition).

## [0.1.5] — 2026-05-31

### Added
- Full-page bilingual translation: translate a page's main content in place. The
  original stays, with the translation inserted under each block, rendered
  progressively as you scroll (only the visible part is translated). Page chrome —
  navigation, headers, footers, sidebars — is left alone, and blocks already in
  your target language are skipped. Toggle it from the popup ("Translate page" /
  "Show original") or with a hotkey (default Alt+A).
- Keyboard shortcuts are now set by pressing the keys (press-to-record), in
  Settings → General.

### Changed
- Selecting a long passage that is already in your target language now shows a
  brief "no translation needed" note instead of calling the model. Dictionary
  lookups of single words are unaffected.
- The popup leads with translation controls; API configuration moved below.
  Hotkey settings now live in Settings only, and both the selection and full-page
  hotkeys are active only in the "Hotkey" trigger mode.
- Cache default retention is now 7 days (was 30); still configurable.

### Removed
- Translation history. The cache already avoids re-charging for repeat
  translations; dropping the stored history reduces what the extension persists
  and simplifies the app.

## [0.1.4] — 2026-05-29

### Added
- Interface language now available in 8 languages — Simplified Chinese,
  Traditional Chinese, English, Japanese, Korean, Spanish, French, and German
  (Settings → General → Interface language). "Follow system" auto-detects the
  browser locale. The translation card follows the chosen language too.
- More cloud provider presets: Moonshot (Kimi), Zhipu GLM, Qwen (DashScope),
  SiliconFlow, OpenRouter, and Mistral, in addition to OpenAI and DeepSeek.
  Providers with separate China and International services offer an endpoint
  picker so you can choose the right base URL.

### Changed
- The target translation language list is unchanged.
- Translate vs. dictionary mode is now decided automatically by the model in a
  single streaming pass, replacing the client-side guess. The manual
  Translate/Define toggle on the card and the streaming on/off setting have been
  removed (translations always stream, revealed progressively in the card).
- Dictionary entries now include the term's formal translation in your language,
  shown separately from the explanatory definition.

## [0.1.3] — 2026-05-29

### Added
- Dictionary mode: selecting a single word or short term shows a structured
  dictionary entry (US/UK IPA for single English words, part of speech, numbered
  senses, and an example) instead of a full translation. The mode is
  auto-detected from the selection, with a manual Translate/Define toggle on the
  card, and the card follows your UI language. Uses your configured model — no
  third-party dictionary service.
- Settings export / import (Settings → Data): back up or transfer your
  configuration as a JSON file. API keys are excluded by default (opt-in
  checkbox to include them). History and cache are not exported.

### Fixed
- Orphaned content scripts (after the extension reloads or updates while a tab
  is open) now show a "refresh this page" message instead of a raw
  "Cannot read properties of undefined" error.

## [0.1.2] — 2026-05-29

### Added
- Per-provider config memory: each cloud provider (OpenAI / DeepSeek /
  Custom) and Local remembers its own Base URL, API key, and model.
  Switching providers restores the remembered config instead of clearing
  to a blank slate — no re-typing. The active request always uses the
  active provider's key (keys are never cross-sent).

### Changed
- Popup "Save config" button renamed to "Apply config" — it now both
  saves the draft and switches the active provider.
- Popup version label is read from the extension manifest instead of a
  hardcoded string.
- Dependencies: zustand 5.0.14, lucide-preact 1.17.0.

### Fixed
- Selection trigger icon and translation card no longer render off-screen
  on scrolled pages (the shadow host was viewport-anchored while its
  contents used document coordinates).
- Long translations now scroll inside the card instead of overflowing
  past the viewport.

### Removed
- Dead `followUp` backend code (a remnant of the dropped multi-turn
  follow-up input that had no UI to invoke it).

## [0.1.1] — 2026-05-28

### Added
- TranslationCard now follows the user's theme (light / dark / auto).
- Popup API section: explicit Cloud / Local provider type toggle and
  Cloud provider preset dropdown (OpenAI / DeepSeek / Custom).
- 5-state status indicator: NOT CONFIGURED / CHECKING / READY / MODEL
  NOT FOUND / OFFLINE, auto-pinged on popup open and on Save.
- README mentions LiteLLM / OpenRouter as the path to Anthropic and
  Gemini until native presets land.

### Changed
- Popup API section now uses an explicit "Save config" button (draft
  editing) instead of live-saving every keystroke. Translation section
  is unchanged.
- Background ping no longer requires an API key when the provider type
  is Local; the Authorization header is omitted when the key is empty.
- Translate path (background + OpenAI provider) parity: Authorization
  header skipped for local providers, lets local Ollama-style servers
  translate end-to-end without a dummy key.

### Removed
- Manual "Test connection" button (subsumed by the auto-pinged status
  indicator).
- "Translation style preset" idea from the deferred wishlist.
- "Native Anthropic / Gemini providers" idea from the deferred
  wishlist (resolved via the LiteLLM hint).

### Fixed
- The popup status indicator no longer reports `READY` based on
  "fields are non-empty" — it now reflects the actual ping result.

## [0.1.0] — 2026-05-28

### Added
- Selection-based translation: floating icon at top-right of selection (or hotkey-only mode), with a translation card that streams the LLM response inline.
- Single API configuration: Base URL, API Key, Model, default prompt template — works with any OpenAI-compatible endpoint (OpenAI, DeepSeek, Moonshot, Groq, SiliconFlow, OpenRouter, local Ollama, LM Studio, vLLM).
- One-click connection test that verifies the endpoint is reachable AND the configured model exists in the provider's `/models` list.
- 4 built-in prompt templates (General, Academic, Casual, Technical) plus unlimited user-defined templates with `{{text}}` / `{{targetLang}}` / `{{sourceLang}}` / `{{url}}` / `{{title}}` variables.
- Translation cache (configurable TTL) and translation history (searchable, capped, never leaves the device).
- Popup as a self-contained control center; full settings open in a dedicated tab.
- Light / Dark / Follow-system theme.
- UI in English and Simplified Chinese (auto-detects browser locale).
- Apparatus design system: self-hosted Geist Sans + Geist Mono, numbered section headers, hairline rules, custom rocker toggles.
- Chromium MV3; CI checks typecheck / lint / unit tests / production build on every PR.

### Privacy
- Zero relay: requests go directly from your browser to the configured provider.
- Zero telemetry: no analytics, no error reporting, no remote logging.
