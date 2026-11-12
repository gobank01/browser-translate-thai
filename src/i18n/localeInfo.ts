/** One registry for the interface picker, stored type and browser-language resolution. */
export const LOCALE_LABELS = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  'pt-BR': 'Português (Brasil)',
  it: 'Italiano',
  ru: 'Русский',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
} as const;

export type Locale = keyof typeof LOCALE_LABELS;
export const LOCALES = Object.keys(LOCALE_LABELS) as Locale[];
export const UI_LANGUAGE_OPTIONS = LOCALES.map((value) => ({ value, label: LOCALE_LABELS[value] }));
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.hasOwn(LOCALE_LABELS, value);
}
