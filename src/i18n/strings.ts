import { en, type StringKey } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';

import { ptBR } from './locales/pt-BR';
import { it } from './locales/it';
import { ru } from './locales/ru';
import { tr } from './locales/tr';
import { vi } from './locales/vi';
import { id } from './locales/id';
import { th } from './locales/th';
import type { Locale } from './localeInfo';

export { LOCALES, type Locale } from './localeInfo';
export type { StringKey };

export const MESSAGES: Record<Locale, Record<StringKey, string>> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ja,
  ko,
  es,
  fr,
  de,
  'pt-BR': ptBR,
  it,
  ru,
  tr,
  vi,
  id,
  th,
};
