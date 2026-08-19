import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { kk } from "./locales/kk";
import { ru } from "./locales/ru";

export const SUPPORTED_LANGUAGES = ["ru", "kk", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ru: "Русский",
  kk: "Қазақша",
  en: "English",
};

let initialized = false;

export function initI18n(): typeof i18n {
  if (initialized) return i18n;
  initialized = true;

  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        ru: { translation: ru },
        kk: { translation: kk },
        en: { translation: en },
      },
      fallbackLng: "ru",
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "jol.lang",
      },
      returnNull: false,
    });

  return i18n;
}

export default i18n;
