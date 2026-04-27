import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { BoatScheduleEntry, HourCounter } from "../lib/types";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";

// ─── Mark-done form ───────────────────────────────────────────────────────────

type DoneForm = {
  doneAt: string;
  engineHours: string;
  notes: string;
};

function MarkDoneModal({
  entry,
  hourCounters,
  editMode,
  loading,
  error,
  onSave,
  onClear,
  onCancel,
}: {
  entry: BoatScheduleEntry;
  hourCounters: HourCounter[];
  editMode: boolean;
  loading: boolean;
  error: string | null;
  onSave: (f: DoneForm) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const { locale } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<DoneForm>({
    doneAt: entry.lastDoneAt ?? today,
    engineHours: entry.lastDoneEngineHours != null ? String(entry.lastDoneEngineHours) : "",
    notes: entry.lastDoneNotes ?? "",
  });

  function set<K extends keyof DoneForm>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const title =
    locale === "es"
      ? entry.template.titleEs || entry.template.titleEn || entry.template.title
      : entry.template.titleEn || entry.template.titleEs || entry.template.title;
  const sysLabel =
    locale === "es"
      ? entry.template.systemNameEs || entry.template.systemNameEn
      : entry.template.systemNameEn || entry.template.systemNameEs;

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="eyebrow" style={{ marginBottom: "0.25rem" }}>{sysLabel}</div>
        <strong style={{ fontSize: "1rem" }}>{title}</strong>
      </div>

      {hourCounters.length > 0 && (
        <div className="form-boat-badge" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <span>Últimas horas motor</span>
          {hourCounters.map((counter) => (
            <strong key={counter.id}>{counter.name}: {counter.currentHours} h</strong>
          ))}
        </div>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">Fecha de realización</label>
          <input
            className="form-input" type="date" required
            value={form.doneAt}
            onChange={(e) => set("doneAt", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Horas de motor</label>
          <input
            className="form-input" type="number" min={0} placeholder="opcional"
            value={form.engineHours}
            onChange={(e) => set("engineHours", e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-input form-textarea" rows={3} placeholder="opcional"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
        {editMode && (
          <button type="button" className="btn-danger-ghost" disabled={loading} onClick={onClear}>
            Desmarcar hecho
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando…" : editMode ? "Guardar cambios" : "✓ Marcar hecho"}
        </button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PreventivePage() {
  const { t, locale } = useI18n();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const boatName = activeBoat?.name ?? "";

  const [schedule, setSchedule] = useState<BoatScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<"" | "overdue" | "due_soon" | "ok">("");
  const [markingEntry, setMarkingEntry] = useState<BoatScheduleEntry | null>(null);
  const [hourCounters, setHourCounters] = useState<HourCounter[]>([]);

  async function refresh() {
    if (!activeBoatId) return;
    setLoading(true);
    try {
      const [nextSchedule, counters] = await Promise.all([
        db.fetchBoatSchedule(activeBoatId),
        db.fetchHourCounters(activeBoatId),
      ]);
      setSchedule(nextSchedule);
      setHourCounters(counters);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, [activeBoatId]);

  const filtered = schedule.filter((e) => !filterState || e.state === filterState);

  async function handleMarkDone(form: DoneForm) {
    if (!markingEntry) return;
    setSaving(true); setSaveError(null);
    try {
      await db.updateScheduleEntry(markingEntry.id, {
        lastDoneAt: form.doneAt,
        lastDoneEngineHours: form.engineHours ? Number(form.engineHours) : null,
        lastDoneNotes: form.notes || null,
      });
      await refresh();
      setMarkingEntry(null);
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleClearDone() {
    if (!markingEntry) return;
    setSaving(true); setSaveError(null);
    try {
      await db.updateScheduleEntry(markingEntry.id, {
        lastDoneAt: null,
        lastDoneEngineHours: null,
        lastDoneNotes: null,
      });
      await refresh();
      setMarkingEntry(null);
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  function ruleLabel(entry: BoatScheduleEntry) {
    const { intervalDays, intervalHours } = entry;
    if (intervalDays && intervalHours) return `${intervalDays} d / ${intervalHours} h`;
    if (intervalDays) return `${intervalDays} días`;
    if (intervalHours) return `${intervalHours} h motor`;
    return "—";
  }

  function stateLabel(state: BoatScheduleEntry["state"]) {
    if (state === "overdue") return locale === "es" ? "Vencida" : "Overdue";
    if (state === "due_soon") return locale === "es" ? "Próxima" : "Due soon";
    return locale === "es" ? "Al día" : "OK";
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("preventive")}</span>
          <h2>{t("preventiveBoard")}</h2>
        </div>
        <div className="empty-state">
          <p>Selecciona un barco para ver su calendario de mantenimiento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("preventive")} · {boatName}</span>
          <h2>{t("preventiveBoard")}</h2>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="form-input form-select" value={filterState}
          onChange={(e) => setFilterState(e.target.value as typeof filterState)}
        >
          <option value="">Todas</option>
          <option value="overdue">Vencidas</option>
          <option value="due_soon">Próximas (30 días)</option>
          <option value="ok">Al día</option>
        </select>
        <span style={{ fontSize: "0.84rem", color: "var(--text-soft)" }}>
          {schedule.length} tareas en el calendario
        </span>
      </div>

      {loading && <p className="data-table-cell-muted">Cargando…</p>}

      {schedule.length === 0 && !loading && (
        <div className="empty-state">
          <p>
            Este barco no tiene calendario de mantenimiento configurado.
            Ve a <strong>Configuración → Plan de mantenimiento</strong> para añadir tareas.
          </p>
        </div>
      )}

      <div className="schedule-table">
        {filtered.map((entry) => {
          const title =
            locale === "es"
              ? entry.template.titleEs || entry.template.titleEn || entry.template.title
              : entry.template.titleEn || entry.template.titleEs || entry.template.title;
          const sysLabel =
            locale === "es"
              ? entry.template.systemNameEs || entry.template.systemNameEn
              : entry.template.systemNameEn || entry.template.systemNameEs;

          return (
            <div key={entry.id} className={`schedule-row state-${entry.state}`}>
              <div className="schedule-row-info">
                <span className="schedule-row-sys">{sysLabel}</span>
                <span className="schedule-row-title">{title}</span>
                {entry.lastDoneNotes && (
                  <span className="schedule-row-last-notes">{entry.lastDoneNotes}</span>
                )}
              </div>
              <div className="schedule-row-meta">
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">Intervalo</span>
                  <strong>{ruleLabel(entry)}</strong>
                </span>
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">Última</span>
                  <strong>
                    {entry.lastDoneAt ?? "—"}
                    {entry.lastDoneEngineHours ? ` · ${entry.lastDoneEngineHours} h` : ""}
                  </strong>
                </span>
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">Próxima</span>
                  <strong>{entry.nextDueDate ?? "—"}</strong>
                </span>
              </div>
              <div className="schedule-row-actions">
                <span className={`pill ${entry.state}`}>{stateLabel(entry.state)}</span>
                {isSupabaseConfigured && (
                  <button
                    className="btn-ghost btn-sm" type="button"
                    onClick={() => setMarkingEntry(entry)}
                  >
                    {entry.lastDoneAt ? "✏ Editar" : "✓ Hecho"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {markingEntry && (
        <Modal
          title={markingEntry.lastDoneAt ? "Editar realización" : "Registrar realización"}
          onClose={() => { setMarkingEntry(null); setSaveError(null); }}
        >
          <MarkDoneModal
            entry={markingEntry}
            hourCounters={hourCounters}
            editMode={!!markingEntry.lastDoneAt}
            loading={saving}
            error={saveError}
            onSave={handleMarkDone}
            onClear={handleClearDone}
            onCancel={() => { setMarkingEntry(null); setSaveError(null); }}
          />
        </Modal>
      )}
    </section>
  );
}
