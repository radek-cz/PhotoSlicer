import { useState } from "react";
import { isLocale } from "../../lib/i18n/i18n";
import { useLocalization } from "../../lib/i18n/useLocalization";
import "./LanguageSwitcher.css";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocalization();
  const [changeError, setChangeError] = useState(false);

  return (
    <>
      <label className="language-switcher">
        <span>{t("common.language")}</span>
        <select
          value={locale}
          onChange={async (event) => {
            if (!isLocale(event.target.value)) {
              return;
            }

            setChangeError(false);
            try {
              await setLocale(event.target.value);
            } catch (error) {
              console.error("Couldn't change application language", error);
              setChangeError(true);
            }
          }}
          aria-label={t("common.language")}
        >
          <option value="pl">{t("common.languageOptions.pl")}</option>
          <option value="en">{t("common.languageOptions.en")}</option>
        </select>
      </label>
      {changeError && <p role="alert">{t("common.languageChangeError")}</p>}
    </>
  );
}
