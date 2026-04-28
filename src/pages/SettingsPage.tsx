import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { THEMES, applyTheme, getStoredTheme, type ThemeId } from "../lib/theme";
import { LanguageToggle } from "../components/LanguageToggle";

export function SettingsPage() {
  const { t, locale } = useI18n();
  const [activeTheme, setActiveTheme] = useState<ThemeId>(getStoredTheme);

  function handleTheme(id: ThemeId) {
    applyTheme(id);
    setActiveTheme(id);
  }

  return (
    <section className="page">
      <div className="section-title">
        <span className="eyebrow">{t("settings")}</span>
        <h2>{t("settings")}</h2>
      </div>

      <article className="panel-card">
        <h3>{locale === "es" ? "Idioma" : "Language"}</h3>
        <LanguageToggle />
      </article>

      <article className="panel-card">
        <h3>{locale === "es" ? "Paleta de colores" : "Color palette"}</h3>
        <p className="data-table-cell-muted" style={{ marginBottom: "1.25rem" }}>
          {locale === "es"
            ? "Elige el aspecto visual de la aplicación. Se guarda en este navegador."
            : "Choose the visual style of the application. Saved in this browser."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleTheme(theme.id)}
                style={{
                  background: theme.bg,
                  border: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
                  borderRadius: "0.6rem",
                  padding: "0.9rem 1rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  alignItems: "flex-start",
                  boxShadow: isActive ? `0 0 0 2px ${theme.accent}40` : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                <span style={{ display: "flex", gap: "0.35rem" }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: theme.accent, display: "inline-block" }} />
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: theme.dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)", display: "inline-block" }} />
                </span>
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: theme.dark ? "#f0f0f0" : "#1a1a1a" }}>
                  {locale === "es" ? theme.labelEs : theme.labelEn}
                </span>
                <span style={{ fontSize: "0.72rem", color: theme.dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>
                  {theme.dark ? (locale === "es" ? "Oscura" : "Dark") : (locale === "es" ? "Clara" : "Light")}
                </span>
                {isActive && (
                  <span style={{ fontSize: "0.7rem", color: theme.accent, fontWeight: 700 }}>
                    {locale === "es" ? "Activa" : "Active"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </article>
    </section>
  );
}
