# Usage guide

[← Documentation](./README.md)

- [Selection translation](#selection-translation)
- [Full-page translation](#full-page-translation)
- [Video subtitles](#video-subtitles)
- [Languages](#languages)
- [Providers and models](#providers-and-models)
- [Thinking controls](#thinking-controls)
- [Your base prompt](#your-base-prompt)
- [The settings pages](#the-settings-pages)

## Selection translation

Select text, then click the floating icon — or choose hotkey mode in **General** and press **Alt+T** (both shortcuts operate only in hotkey mode). The card streams ordinary text, shows the source above the result and offers copy, retranslate, provider/model and target-language controls. Per-card choices do not change global settings; retranslate bypasses the cache.

The card keeps a fixed size, set in **General**, where a live preview shows it over a page. Source and translation scroll independently; the source occupies at most 30% of the shared body. While waiting, the card shows a compact loading state. Pin it to keep it open while scrolling or clicking elsewhere, and drag it out of the way.

**Dictionary lookup for short selections.** A model can define a word or short term with translation, pronunciation, part of speech, senses and an example. Obvious passages, multiline text and code-like selections use a translation-only prompt. Free services translate text but do not generate dictionary entries.

**Mixed-language input is allowed.** Matching source and target languages never blocks a request. Regional rewrites depend on the selected model or service.

## Full-page translation

Translates page content in place, keeping originals above translations and generally excluding navigation, headers and footers. Translation progresses around the viewport as you scroll. Use the popup's **Translate full page** switch, or **Alt+A** in hotkey mode. Unsupported browser pages disable the switch; if the page was open before the extension loaded, the popup asks you to refresh it.

## Video subtitles

Works with existing captions on **YouTube**, **Zoom cloud recordings**, **Canvas course recordings**, and compatible players exposing captions through standard `<track>`/TextTrack mechanisms. Support depends on the site's player and accessible caption track; not every embedded player has been tested. **No audio transcription is performed.**

Click the translation icon in the player's controls, then enable subtitle translation. If no suitable control bar is available, the button appears in a corner of the video. On YouTube, enable native captions (CC) first so the track is loaded. Other players may also need their caption track activated. Creator-provided and supported auto-generated captions can be used; rolling ASR fragments are combined into sentences before translation.

Original and translated lines are drawn over the player. Drag the block using its grip; its position is remembered, including in fullscreen, and it moves clear of visible player controls. Translation prioritizes cues around the playhead and adapts after seeking. Speaker labels are kept outside translation and restored verbatim when recognized. Latency depends on the provider and video; there is no fixed response-time guarantee.

The player menu and **Settings → Subtitles** control bilingual/original-only/translation-only display, line order, background opacity, and each line's size, color, font and weight. Settings includes a live preview, precise numeric controls, a small color palette, HEX input and a reset button.

## Languages

**56 translation targets** are independent of the **15 interface languages**. The interface can follow the browser's locale. Target pickers in the popup, settings and card search native, English and interface-language names, language codes and English-region aliases. RTL names keep their reading direction while menu rows stay aligned.

English targets are **United States, United Kingdom and Australia**; old generic `en` settings migrate to US English. Chinese targets are **Simplified and Traditional**. LLMs receive explicit regional spelling and vocabulary instructions. Free services use the requested variety where supported, otherwise generic English silently, without switching providers.

## Providers and models

**Settings → Providers** groups providers by what they ask of you:

- **Free translation services** — Microsoft and Google. No key needed. Like everything else they start switched off, and no mode has an engine until you choose one, so no text leaves the browser until you switch a service on and choose it. Read the [notice](./free-services.md) before relying on them.
- **Cloud APIs · bring your own key** — OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral and opencode.
- **Local & custom** — LM Studio, Ollama, llama.cpp, vLLM and any other OpenAI-compatible endpoint.

Open a provider and enter its API key (local runtimes need none). Once the endpoint answers, the models it offers are listed beside yours, with a search box and each model's vendor icon. Add as many as you like. A provider being set up switches itself on as soon as its key works and a model is chosen; one you have switched off stays off. Removing a provider's last model switches it off. Enabled rows report connection status and latency; that check contacts the provider.

**Translation → Translation engines** assigns a provider *and model* to selection cards, full pages and subtitles independently — for example a strong model for selections and a cheap one for whole pages, under the same OpenRouter key. Each model's results are cached separately. Settings from v0.2.2 carry over: each mode keeps the provider and the model it was using.

A mode is **not configured** — the picker shows *Not configured* in its place, and one note under the pickers says what that means — when no engine has been chosen for it (as in a new installation), when its provider is switched off (by hand, or because its last model was removed, which switches the provider off), or when its model was removed from the provider's list. A model the provider itself no longer offers is reported the same way the first time a translation is attempted. Switching a provider off or removing a model forgets the modes that used it: switching it back on or adding the model again does not bring them back, so choose again. There is no fallback: until you choose again, that mode reports the problem on the card, the page and the subtitles rather than sending text anywhere else. A switched-off provider never appears among the choices and is never used.

Endpoint choices distinguish regions and plans: for example, opencode Zen/Go and Qwen's Beijing, Singapore, Hong Kong and Virginia regions plus Token Plan. Accounts, keys and model catalogs are not necessarily interchangeable. Supported providers can also accept custom workspace URLs where needed.

## Thinking controls

Where supported, the extension requests thinking off by default and offers **Low / Medium / High / XHigh / Max** levels mapped to provider parameters. For custom/local servers, select the parameter dialect or leave **Send nothing**. When no supported control is sent, the server's default applies. Actual support, latency and reasoning-token billing depend on the endpoint/model, not just the UI setting.

## Your base prompt

In **Translation → Base prompt**, the library is beside the editor (stacked on narrow windows). The default is visible and read-only. **New** creates from the default or from scratch. Guidance is inside the card below the editor. Selecting a template only opens it; the prompt currently in use is marked separately.

- **Save & apply** saves a draft and applies it in one step.
- **Save changes** updates the prompt already in use.
- **Apply Prompt** applies a saved template; it is disabled when already in use.
- **Cancel** discards local edits.
- **Template actions** contains save without applying, duplicate, replace draft text with the default, and delete. Destructive replacement/deletion requires confirmation; deleting the active template falls back to Default.

Custom instructions **replace**, rather than append to, the default base prompt. The extension still adds target language, regional conventions, routing and output-format rules; these internal protocols are not editable. Conflicting instructions or weaker models may produce imperfect results. Literal `{{...}}` is not substituted: this is a plain-text editor.

Store up to **20 custom templates**, each with up to **12,000 characters** of instructions. Templates apply only to LLMs, not Microsoft/Google translation services. Prompt changes use separate cache entries. Templates and the active choice are included in settings exports.

## The settings pages

- **General** — interface language, light/dark mode, card size (with a live preview) and trigger mode with its shortcuts.
- **Translation** — target language, translation engines and the base prompt.
- **Providers** — credentials and models.
- **Subtitles** — the appearance of on-video subtitles.
- **Data** — cache lifetime and settings export/import. Exports exclude the cache, and exclude API keys unless explicitly requested.

The popup holds the **Translate full page** switch for the current site, the target language and the engine choices. Trigger mode and shortcuts are settings-only.
