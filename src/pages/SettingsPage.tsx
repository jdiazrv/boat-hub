import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { THEMES, applyTheme, getStoredTheme, type ThemeId } from "../lib/theme";
import { LanguageToggle } from "../components/LanguageToggle";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { isSupabaseConfigured } from "../lib/supabase";
import * as db from "../lib/db";
import type { HourCounter } from "../lib/types";

function CountersPanel({ boatId }: { boatId: string }) {
  const { locale } = useI18n();
  const [counters, setCounters] = useState<HourCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HourCounter | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setCounters(await db.fetchHourCounters(boatId)); } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [boatId]);

  function openCreate() { setName(""); setNotes(""); setError(null); setCreating(true); setEditing(null); }
  function openEdit(c: HourCounter) { setName(c.name); setNotes(c.notes ?? ""); setError(null); setEditing(c); setCreating(false); }
  function closeForm() { setCreating(false); setEditing(null); }

  async function handleSave() {
    if (!name.trim()) { setError(locale === "es" ? "El nombre es obligatorio" : "Name is required"); return; }
    setSaving(true); setError(null);
    try {
      if (editing) {
        await db.updateHourCounter(editing.id, { name: name.trim(), notes: notes.trim() || null });
      } else {
        await db.createHourCounter(boatId, name.trim(), notes.trim() || null);
      }
      await load(); closeForm();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: HourCounter) {
    if (!confirm(locale === "es" ? `¿Eliminar "${c.name}"?` : `Delete "${c.name}"?`)) return;
    setSaving(true);
    try { await db.deleteHourCounter(c.id); await load(); } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <article className="panel-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>{locale === "es" ? "Contadores de horas" : "Hour counters"}</h3>
        {isSupabaseConfigured && !creating && !editing && (
          <button className="btn-primary" type="button" onClick={openCreate}>
            + {locale === "es" ? "Nuevo contador" : "New counter"}
          </button>
        )}
      </div>

      {(creating || editing) && (
        <div className="form-stack" style={{ marginBottom: "1rem", padding: "1rem", background: "var(--surface-2, color-mix(in srgb, var(--accent) 6%, transparent))", borderRadius: "0.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>
              {locale === "es" ? "Nombre" : "Name"} *
            </label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === "es" ? "Ej: Motor principal, Watermaker…" : "E.g. Main engine, Watermaker…"}
              autoFocus
            />
            <label style={{ fontSize: "0.82rem", fontWeight: 600, marginTop: "0.25rem" }}>
              {locale === "es" ? "Notas" : "Notes"}
            </label>
            <input
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={locale === "es" ? "Opcional" : "Optional"}
            />
            {error && <p className="form-error">{error}</p>}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? "…" : (locale === "es" ? "Guardar" : "Save")}
              </button>
              <button className="btn-ghost" type="button" onClick={closeForm} disabled={saving}>
                {locale === "es" ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="data-table-cell-muted">{locale === "es" ? "Cargando…" : "Loading…"}</p>}
      {!loading && counters.length === 0 && !creating && (
        <p className="data-table-cell-muted">
          {locale === "es" ? "No hay contadores. Crea uno para registrar horas de uso." : "No counters. Create one to log usage hours."}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {counters.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "var(--surface-1, color-mix(in srgb, var(--accent) 4%, transparent))", borderRadius: "0.4rem" }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.name}</span>
              <span style={{ marginLeft: "0.75rem", fontSize: "0.82rem", opacity: 0.6 }}>{c.currentHours} h</span>
              {c.notes && <span style={{ marginLeft: "0.5rem", fontSize: "0.78rem", opacity: 0.5 }}>— {c.notes}</span>}
            </div>
            {isSupabaseConfigured && (
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button className="btn-icon" type="button" onClick={() => openEdit(c)} title={locale === "es" ? "Editar" : "Edit"}>✏</button>
                <button className="btn-icon" type="button" onClick={() => handleDelete(c)} title={locale === "es" ? "Eliminar" : "Delete"} style={{ color: "var(--danger)" }}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

export function SettingsPage() {
  const { t, locale } = useI18n();
  const { activeBoatId } = useActiveBoat();
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

      {isSupabaseConfigured && activeBoatId && (
        <CountersPanel boatId={activeBoatId} key={activeBoatId} />
      )}
      {isSupabaseConfigured && !activeBoatId && (
        <article className="panel-card">
          <h3>{locale === "es" ? "Contadores de horas" : "Hour counters"}</h3>
          <p className="data-table-cell-muted">
            {locale === "es" ? "Selecciona un barco para gestionar sus contadores." : "Select a boat to manage its counters."}
          </p>
        </article>
      )}
    </section>
  );
}
