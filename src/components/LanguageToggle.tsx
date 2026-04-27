import { useI18n } from "../lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="language-toggle" aria-label={t("language")}>
      <button
        className={locale === "es" ? "active" : ""}
        onClick={() => setLocale("es")}
        type="button"
      >
        ES
      </button>
      <button
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}

