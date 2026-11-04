/** Provides translations and synchronizes the document language with the UI. */
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { isLocale } from "../../i18n";

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const updateDocumentLanguage = (language: string) => {
      const locale = language.split("-")[0];
      if (isLocale(locale)) {
        document.documentElement.lang = locale;
      }
    };
    const initialLanguage = i18n.resolvedLanguage ?? i18n.language;
    updateDocumentLanguage(initialLanguage);
    const handleFailedLoading = (
      language: string,
      namespace: string,
      message: string,
    ) => {
      console.error(
        `Couldn't load ${namespace} translations for ${language}`,
        message,
      );
      setLoadError("Unable to load the selected language.");
    };
    i18n.on("languageChanged", updateDocumentLanguage);
    i18n.on("failedLoading", handleFailedLoading);

    return () => {
      i18n.off("languageChanged", updateDocumentLanguage);
      i18n.off("failedLoading", handleFailedLoading);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {loadError ? (
        <p role="alert">{loadError}</p>
      ) : (
        <Suspense fallback={<div role="status" aria-busy="true" />}>
          {children}
        </Suspense>
      )}
    </I18nextProvider>
  );
}
