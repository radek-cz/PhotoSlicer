/** Configures supported locales, lazy-loaded translations, and typed keys. */
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import type en from "./locales/en.json";

export const SUPPORTED_LOCALES = ["pl", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LANGUAGE_STORAGE_KEY = "photoslicer.locale";

type DotNestedKeys<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${DotNestedKeys<T[Key]>}`
      : never;
}[keyof T & string];

export type TranslationKey = DotNestedKeys<typeof en>;

export function isLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === value);
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
    returnNull: false;
  }
}

void i18n
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language: string) =>
      import(`./locales/${language}.json`),
    ),
  )
  .use(initReactI18next)
  .init({
    supportedLngs: SUPPORTED_LOCALES,
    fallbackLng: "en",
    load: "languageOnly",
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
      prefix: "{",
      suffix: "}",
    },
    returnNull: false,
  });

export default i18n;
