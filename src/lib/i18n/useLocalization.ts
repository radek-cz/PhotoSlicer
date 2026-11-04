/** Exposes the active locale, translation function, and localized formatters. */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  isLocale,
  LANGUAGE_STORAGE_KEY,
  type Locale,
} from "./i18n";

export function useLocalization() {
  const { i18n, t } = useTranslation();
  const locale: Locale = isLocale(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "en";
  const setLocale = useCallback(
    async (nextLocale: Locale) => {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
      await i18n.changeLanguage(nextLocale);
    },
    [i18n],
  );

  return {
    locale,
    setLocale,
    t,
    formatNumber: (value: number) => new Intl.NumberFormat(locale).format(value),
    formatFileSize: (bytes: number) => {
      if (bytes < 1024) {
        return `${new Intl.NumberFormat(locale, {
          maximumFractionDigits: 0,
        }).format(bytes)} B`;
      }
      const units = ["kilobyte", "megabyte", "gigabyte", "terabyte"] as const;
      let value = bytes;
      let unitIndex = -1;
      while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
      }
      return new Intl.NumberFormat(locale, {
        style: "unit",
        unit: units[unitIndex],
        unitDisplay: "short",
        maximumFractionDigits: unitIndex === 0 ? 0 : 2,
      }).format(value);
    },
  };
}
