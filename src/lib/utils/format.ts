import { format, formatDistanceToNow, type Locale } from "date-fns";
import { enUS, kk as kkLocale, ru as ruLocale } from "date-fns/locale";

import type { SupportedLanguage } from "@/lib/i18n/config";

const LOCALE_MAP: Record<SupportedLanguage, Locale> = {
  ru: ruLocale,
  kk: kkLocale,
  en: enUS,
};

export function formatDateTime(iso: string, lang: SupportedLanguage): string {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: LOCALE_MAP[lang] });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string, lang: SupportedLanguage): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: LOCALE_MAP[lang] });
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string, lang: SupportedLanguage): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: LOCALE_MAP[lang] });
  } catch {
    return iso;
  }
}

export function formatNumber(value: number, lang: SupportedLanguage): string {
  const localeCode = lang === "kk" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU";
  return new Intl.NumberFormat(localeCode).format(value);
}
