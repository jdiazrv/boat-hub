import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
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
    try {
      setCounters(await db.fetchHourCounters(boatId));
    } catch {
      setCounters([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [boatId]);

  function openCreate() {
    setName("");
    setNotes("");
    setError(null);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(counter: HourCounter) {
    setName(counter.name);
    setNotes(counter.notes ?? "");
    setError(null);
    setEditing(counter);
    setCreating(false);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError(locale === "es" ? "El nombre es obligatorio" : "Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await db.updateHourCounter(editing.id, { name: name.trim(), notes: notes.trim() || null });
      } else {
        await db.createHourCounter(boatId, name.trim(), notes.trim() || null);
      }
      await load();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(counter: HourCounter) {
    if (!confirm(locale === "es" ? `¿Eliminar "${counter.name}"?` : `Delete "${counter.name}"?`)) return;
    setSaving(true);
    try {
      await db.deleteHourCounter(counter.id);
      await load();
    } catch {
      // Keep the current list visible if deletion fails.
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="panel-card">
      <div className="panel-head">
        <h3>{locale === "es" ? "Contadores de horas" : "Hour counters"}</h3>
        {isSupabaseConfigured && !creating && !editing && (
          <button className="btn-primary" type="button" onClick={openCreate}>
            + {locale === "es" ? "Nuevo contador" : "New counter"}
          </button>
        )}
      </div>

      {(creating || editing) && (
        <div className="form-stack" style={{ marginBottom: "1rem", padding: "1rem", background: "var(--surface-2, color-mix(in srgb, var(--accent) 6%, transparent))", borderRadius: "0.5rem" }}>
          <label>
            <span>{locale === "es" ? "Nombre" : "Name"} *</span>
            <input
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={locale === "es" ? "Ej: Motor principal, Watermaker..." : "E.g. Main engine, Watermaker..."}
              autoFocus
            />
          </label>
          <label>
            <span>{locale === "es" ? "Notas" : "Notes"}</span>
            <input
              className="form-input"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={locale === "es" ? "Opcional" : "Optional"}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "..." : (locale === "es" ? "Guardar" : "Save")}
            </button>
            <button className="btn-ghost" type="button" onClick={closeForm} disabled={saving}>
              {locale === "es" ? "Cancelar" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="data-table-cell-muted">{locale === "es" ? "Cargando..." : "Loading..."}</p>}
      {!loading && counters.length === 0 && !creating && (
        <p className="data-table-cell-muted">
          {locale === "es" ? "No hay contadores. Crea uno para registrar horas de uso." : "No counters. Create one to log usage hours."}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {counters.map((counter) => (
          <div key={counter.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "var(--surface-1, color-mix(in srgb, var(--accent) 4%, transparent))", borderRadius: "0.4rem" }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{counter.name}</span>
              <span style={{ marginLeft: "0.75rem", fontSize: "0.82rem", opacity: 0.6 }}>{counter.currentHours} h</span>
              {counter.notes && <span style={{ marginLeft: "0.5rem", fontSize: "0.78rem", opacity: 0.5 }}>- {counter.notes}</span>}
            </div>
            {isSupabaseConfigured && (
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button className="btn-icon" type="button" onClick={() => openEdit(counter)} title={locale === "es" ? "Editar" : "Edit"}>✏</button>
                <button className="btn-icon" type="button" onClick={() => handleDelete(counter)} title={locale === "es" ? "Eliminar" : "Delete"} style={{ color: "var(--danger)" }}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

export function HourCountersPage() {
  const { locale } = useI18n();
  const { activeBoatId, activeBoat } = useActiveBoat();

  return (
    <section className="page">
      <div className="section-title">
        <span className="eyebrow">{locale === "es" ? "Configuracion" : "Configuration"}</span>
        <h2>{locale === "es" ? "Contadores de horas" : "Hour counters"}</h2>
        {activeBoat && <p>{activeBoat.name}</p>}
      </div>

      {isSupabaseConfigured && activeBoatId ? (
        <CountersPanel boatId={activeBoatId} key={activeBoatId} />
      ) : (
        <article className="panel-card">
          <p className="data-table-cell-muted">
            {locale === "es" ? "Selecciona un barco para gestionar sus contadores." : "Select a boat to manage its counters."}
          </p>
        </article>
      )}
    </section>
  );
}
