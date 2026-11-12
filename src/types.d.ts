declare module '*.css?inline' {
  const css: string;
  export default css;
}

interface ImportMetaEnv {
  /** Personal builds only: see `storage/personalPreset.ts`. */
  readonly WXT_OPENROUTER_KEY?: string;
  /** Personal builds only: ElevenLabs voices for the Thai dub. */
  readonly WXT_ELEVENLABS_KEY?: string;
  /** Personal builds only: keep a watch log via the native host. */
  readonly WXT_WATCHLOG?: string;
  /** Set by setup: this is a Thai-dub build. */
  readonly WXT_THAI_DUB?: string;
  /** Set by setup: ElevenLabs voices, "Name:voiceId:female,Name:voiceId:male". */
  readonly WXT_DUB_VOICES?: string;
}
