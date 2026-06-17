import { useEffect, useMemo, useState } from "react";
import * as db from "../lib/db";
import type { BoatCatalogOverride, BoatScheduleEntry, MaintenanceTemplate, MaintenanceTemplateSpare } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";

// ─── Schedule entry form ──────────────────────────────────────────────────────

type EntryFormValue = {
  intervalDays: number | null;
  intervalHours: number | null;
  lastDoneAt: string | null;
  responsible: string | null;
  notes: string | null;
  spares: Array<Omit<MaintenanceTemplateSpare, "id" | "systemId" | "templateId">>;
};

function EntryForm({
  initial,
  template,
  loading,
  error,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: EntryFormValue;
  template: MaintenanceTemplate;
  loading: boolean;
  error: string | null;
  onSave: (v: EntryFormValue) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<EntryFormValue>(initial);
  const { t, locale } = useI18n();

  function set<K extends keyof EntryFormValue>(k: K, v: EntryFormValue[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function updateSpare(index: number, patch: Partial<EntryFormValue["spares"][number]>) {
    setForm((current) => ({
      ...current,
      spares: current.spares.map((spare, i) => (i === index ? { ...spare, ...patch } : spare)),
    }));
  }

  function addSpare() {
    setForm((current) => ({
      ...current,
      spares: [
        ...current.spares,
        { partName: "", partReference: "", manufacturer: null, quantity: 1, unit: "unit", notes: null },
      ],
    }));
  }

  function removeSpare(index: number) {
    setForm((current) => ({
      ...current,
      spares: current.spares.filter((_, i) => i !== index),
    }));
  }

  const sysLabel =
    locale === "es"
      ? template.systemNameEs || template.systemNameEn
      : template.systemNameEn || template.systemNameEs;
  const titleLabel =
    locale === "es"
      ? template.titleEs || template.titleEn || template.title
      : template.titleEn || template.titleEs || template.title;

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="eyebrow" style={{ marginBottom: "0.25rem" }}>{sysLabel}</div>
        <strong style={{ fontSize: "1rem" }}>{titleLabel}</strong>
        {(template.descriptionEs || template.descriptionEn) && (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: "var(--text-soft)" }}>
            {locale === "es"
              ? template.descriptionEs || template.descriptionEn
              : template.descriptionEn || template.descriptionEs}
          </p>
        )}
      </div>

      <FormSection title={t("intervalDays").replace(" (días)", "") + " / Horas"}>
        <FormGrid>
          <InputField
            label={t("intervalDays")} type="number" min={1}
            value={form.intervalDays ?? ""}
            onChange={(e) => set("intervalDays", e.target.value ? Number(e.target.value) : null)}
          />
          <InputField
            label={t("intervalHours")} type="number" min={1}
            value={form.intervalHours ?? ""}
            onChange={(e) => set("intervalHours", e.target.value ? Number(e.target.value) : null)}
          />
          <InputField
            label={t("lastDoneAt")} type="date"
            value={form.lastDoneAt ?? ""}
            onChange={(e) => set("lastDoneAt", e.target.value || null)}
          />
        </FormGrid>
      </FormSection>

      <FormSection title={t("responsible") + " / " + t("notes")}>
        <InputField
          label={t("responsible")}
          value={form.responsible ?? ""}
          onChange={(e) => set("responsible", e.target.value || null)}
        />
        <TextareaField
          label={t("notes")}
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
        />
      </FormSection>

      <FormSection title="Repuestos usados">
        <div className="spare-reference-list">
          {form.spares.map((spare, index) => (
            <div className="spare-reference-row" key={index}>
              <InputField
                label="Repuesto"
                value={spare.partName}
                onChange={(e) => updateSpare(index, { partName: e.target.value })}
              />
              <InputField
                label="Referencia"
                value={spare.partReference}
                onChange={(e) => updateSpare(index, { partReference: e.target.value })}
              />
              <InputField
                label="Fabricante"
                value={spare.manufacturer ?? ""}
                onChange={(e) => updateSpare(index, { manufacturer: e.target.value || null })}
              />
              <InputField
                label="Cant."
                type="number"
                min={0}
                step="0.01"
                value={spare.quantity}
                onChange={(e) => updateSpare(index, { quantity: e.target.value ? Number(e.target.value) : 1 })}
              />
              <button className="btn-icon" type="button" onClick={() => removeSpare(index)} title="Eliminar">
                ×
              </button>
            </div>
          ))}
          {form.spares.length === 0 && <p className="data-table-cell-muted">Sin repuestos asociados.</p>}
        </div>
        <button className="btn-ghost" type="button" onClick={addSpare}>
          + Añadir repuesto
        </button>
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions
        onCancel={onCancel} loading={loading}
        danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")}
      />
    </form>
  );
}

// ─── Add-from-catalog picker ──────────────────────────────────────────────────

function TemplatePicker({
  templates,
  existingTemplateIds,
  onPick,
  onCancel,
}: {
  templates: MaintenanceTemplate[];
  existingTemplateIds: Set<string>;
  onPick: (t: MaintenanceTemplate) => void;
  onCancel: () => void;
}) {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");

  const systems = Array.from(
    new Map(
      templates.map((t) => [
        t.systemCode,
        { code: t.systemCode, nameEs: t.systemNameEs, nameEn: t.systemNameEn },
      ])
    ).values()
  ).sort((a, b) => a.nameEs.localeCompare(b.nameEs));

  const filtered = templates.filter((t) => {
    if (existingTemplateIds.has(t.id)) return false;
    if (systemFilter && t.systemCode !== systemFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = locale === "es" ? t.titleEs || t.title : t.titleEn || t.title;
      if (!title.toLowerCase().includes(q) && !t.systemNameEs.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  return (
    <div className="form-stack">
      <div className="filter-bar" style={{ marginBottom: "0.75rem" }}>
        <input
          className="form-input" placeholder="Buscar…" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input form-select" value={systemFilter}
          onChange={(e) => setSystemFilter(e.target.value)}
        >
          <option value="">{t("allSystems")}</option>
          {systems.map((s) => (
            <option key={s.code} value={s.code}>
              {locale === "es" ? s.nameEs : s.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div style={{ maxHeight: "55vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {filtered.map((tmpl) => {
          const title =
            locale === "es"
              ? tmpl.titleEs || tmpl.titleEn || tmpl.title
              : tmpl.titleEn || tmpl.titleEs || tmpl.title;
          const sysLabel = locale === "es" ? tmpl.systemNameEs : tmpl.systemNameEn;
          return (
            <button key={tmpl.id} type="button" className="picker-row" onClick={() => onPick(tmpl)}>
              <span className="picker-row-sys">{sysLabel}</span>
              <span className="picker-row-title">{title}</span>
              <span className="picker-row-kind">{tmpl.kind}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: "var(--text-soft)", fontSize: "0.88rem", padding: "1rem 0" }}>
            {t("noActionsMatchFilter")}
          </p>
        )}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>{t("cancel")}</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ModalMode =
  | { kind: "pick-template" }
  | { kind: "add-entry"; template: MaintenanceTemplate }
  | { kind: "edit-entry"; entry: BoatScheduleEntry };

type ScheduleView = "list" | "gantt";

function parseDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function entryTitle(entry: BoatScheduleEntry, locale: "es" | "en") {
  return locale === "es"
    ? entry.template.titleEs || entry.template.titleEn || entry.template.title
    : entry.template.titleEn || entry.template.titleEs || entry.template.title;
}

function entrySystem(entry: BoatScheduleEntry, locale: "es" | "en") {
  return locale === "es"
    ? entry.template.systemNameEs || entry.template.systemNameEn
    : entry.template.systemNameEn || entry.template.systemNameEs;
}

export function SchedulePage() {
  const { t, locale } = useI18n();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const boatName = activeBoat?.name ?? "";

  const [schedule, setSchedule] = useState<BoatScheduleEntry[]>([]);
  const [allTemplates, setAllTemplates] = useState<MaintenanceTemplate[]>([]);
  const [templateSpares, setTemplateSpares] = useState<Record<string, MaintenanceTemplateSpare[]>>({});
  const [overridesMap, setOverridesMap] = useState<Map<string, BoatCatalogOverride>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [systemFilter, setSystemFilter] = useState("");
  const [view, setView] = useState<ScheduleView>("gantt");

  async function refresh() {
    if (!activeBoatId) return;
    setLoading(true);
    try {
      const [s, tmpl, overrides] = await Promise.all([
        db.fetchBoatSchedule(activeBoatId),
        db.fetchMaintenanceTemplates(),
        db.fetchBoatCatalogOverridesMap(activeBoatId),
      ]);
      setSchedule(s);
      setAllTemplates(tmpl);
      setOverridesMap(overrides);
      const spares = await db.fetchMaintenanceTemplateSpares(tmpl.map((template) => template.id));
      setTemplateSpares(
        spares.reduce<Record<string, MaintenanceTemplateSpare[]>>((acc, spare) => {
          if (!spare.templateId) return acc;
          acc[spare.templateId] = acc[spare.templateId] ?? [];
          acc[spare.templateId].push(spare);
          return acc;
        }, {})
      );
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void refresh();
  }, [activeBoatId]);

  const existingTemplateIds = new Set(schedule.map((e) => e.templateId));

  const systems = Array.from(
    new Map(schedule.map((e) => [
      e.template.systemCode,
      { code: e.template.systemCode, nameEs: e.template.systemNameEs, nameEn: e.template.systemNameEn },
    ])).values()
  ).sort((a, b) => a.nameEs.localeCompare(b.nameEs));

  const filtered = useMemo(
    () => schedule.filter((e) => !systemFilter || e.template.systemCode === systemFilter),
    [schedule, systemFilter]
  );

  const ganttRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = startOfMonth(today);
    const end = addMonths(start, 12);
    const months = Array.from({ length: 12 }, (_, index) => addMonths(start, index));
    return { start, end, months, totalDays: Math.max(1, daysBetween(start, end)) };
  }, []);

  function closeModal() { setModal(null); setError(null); }

  async function handleAddEntry(template: MaintenanceTemplate) {
    setModal({ kind: "add-entry", template });
  }

  async function handleSaveEntry(form: EntryFormValue) {
    if (!activeBoatId || modal?.kind !== "add-entry") return;
    if (!form.intervalDays && !form.intervalHours) {
      setError(t("intervalRequired"));
      return;
    }
    setSaving(true); setError(null);
    try {
      await db.addScheduleEntry(activeBoatId, modal.template.id, form);
      await db.replaceMaintenanceTemplateSpares(modal.template.id, modal.template.systemId, form.spares);
      await refresh();
      closeModal();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleUpdateEntry(form: EntryFormValue) {
    if (modal?.kind !== "edit-entry") return;
    setSaving(true); setError(null);
    try {
      await db.updateScheduleEntry(modal.entry.id, form);
      await db.replaceMaintenanceTemplateSpares(modal.entry.template.id, modal.entry.template.systemId, form.spares);
      await refresh();
      closeModal();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteEntry() {
    if (modal?.kind !== "edit-entry") return;
    if (!confirm("¿Eliminar esta tarea del calendario?")) return;
    setSaving(true);
    try {
      await db.deleteScheduleEntry(modal.entry.id);
      await refresh();
      closeModal();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function ruleLabel(entry: BoatScheduleEntry) {
    const { intervalDays, intervalHours } = entry;
    if (intervalDays && intervalHours) return `${intervalDays} d / ${intervalHours} h`;
    if (intervalDays) return `${intervalDays} días`;
    if (intervalHours) return `${intervalHours} h motor`;
    return "—";
  }

  function ganttBar(entry: BoatScheduleEntry) {
    const due = parseDate(entry.nextDueDate);
    if (!due) return null;

    const explicitStart = parseDate(entry.lastDoneAt);
    const intervalStart = entry.intervalDays ? addDays(due, -entry.intervalDays) : null;
    const start = explicitStart ?? intervalStart ?? due;
    const visibleStart = clamp(daysBetween(ganttRange.start, start), 0, ganttRange.totalDays);
    const visibleEnd = clamp(daysBetween(ganttRange.start, due), 0, ganttRange.totalDays);
    const left = (Math.min(visibleStart, visibleEnd) / ganttRange.totalDays) * 100;
    const width = Math.max(1.25, (Math.abs(visibleEnd - visibleStart) / ganttRange.totalDays) * 100);
    return { left, width, due };
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("maintenanceSchedule")}</span>
          <h2>{t("maintenanceSchedule")}</h2>
        </div>
        <div className="empty-state">
          <p>Selecciona un barco para configurar su plan de mantenimiento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("maintenanceSchedule")} · {boatName}</span>
          <h2>{t("maintenanceSchedule")}</h2>
        </div>
        {isSupabaseConfigured && (
          <button
            className="btn-primary" type="button"
            onClick={() => setModal({ kind: "pick-template" })}
          >
            + Añadir tarea
          </button>
        )}
      </div>

      <div className="filter-bar">
        <select
          className="form-input form-select" value={systemFilter}
          onChange={(e) => setSystemFilter(e.target.value)}
        >
          <option value="">{t("allSystems")}</option>
          {systems.map((s) => (
            <option key={s.code} value={s.code}>
              {locale === "es" ? s.nameEs : s.nameEn}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "0.84rem", color: "var(--text-soft)" }}>
          {schedule.length} tareas en el plan
        </span>
        <div className="view-toggle" role="tablist" aria-label="Vista del plan">
          <button
            type="button"
            className={view === "gantt" ? "active" : ""}
            onClick={() => setView("gantt")}
          >
            Gantt
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            Lista
          </button>
        </div>
      </div>

      {loading && <p className="data-table-cell-muted">Cargando…</p>}

      {schedule.length === 0 && !loading && (
        <div className="empty-state">
          <p>Este barco no tiene seguimiento periódico configurado.</p>
        </div>
      )}

      {view === "list" && (
        <div className="schedule-table">
          {filtered.map((entry) => (
            <div key={entry.id} className={`schedule-row state-${entry.state}`}>
              <div className="schedule-row-info">
                <span className="schedule-row-sys">{entrySystem(entry, locale)}</span>
                <span className="schedule-row-title">{entryTitle(entry, locale)}</span>
              </div>
              <div className="schedule-row-meta">
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">Intervalo</span>
                  <strong>{ruleLabel(entry)}</strong>
                </span>
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">{t("lastDoneAt")}</span>
                  <strong>{entry.lastDoneAt ?? "—"}</strong>
                </span>
              </div>
              <div className="schedule-row-actions">
                {isSupabaseConfigured && (
                  <button
                    className="btn-icon" type="button"
                    onClick={() => setModal({ kind: "edit-entry", entry })}
                  >
                    ✏
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "gantt" && (
        <div className="gantt-board">
          <div className="gantt-head">
            <div className="gantt-head-label">Trabajo periódico</div>
            <div className="gantt-months">
              {ganttRange.months.map((month) => (
                <span key={month.toISOString()}>
                  {new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { month: "short" }).format(month)}
                </span>
              ))}
            </div>
          </div>

          {filtered.map((entry) => {
            const bar = ganttBar(entry);
            return (
              <div key={entry.id} className={`gantt-row state-${entry.state}`}>
                <button
                  type="button"
                  className="gantt-task"
                  onClick={() => setModal({ kind: "edit-entry", entry })}
                >
                  <span className="gantt-task-system">{entrySystem(entry, locale)}</span>
                  <span className="gantt-task-title">{entryTitle(entry, locale)}</span>
                  <span className="gantt-task-rule">{ruleLabel(entry)}</span>
                </button>
                <div className="gantt-track">
                  {bar ? (
                    <button
                      type="button"
                      className={`gantt-bar state-${entry.state}`}
                      style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                      onClick={() => setModal({ kind: "edit-entry", entry })}
                      title={`${entryTitle(entry, locale)} · ${entry.nextDueDate ?? ""}`}
                    >
                      <span>{entry.nextDueDate}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="gantt-no-date"
                      onClick={() => setModal({ kind: "edit-entry", entry })}
                    >
                      Sin fecha
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="empty-state">
              <p>No hay trabajos periódicos con estos filtros.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {modal?.kind === "pick-template" && (
        <Modal title="Añadir tarea al plan" onClose={closeModal} wide>
          <TemplatePicker
            templates={allTemplates}
            existingTemplateIds={existingTemplateIds}
            onPick={handleAddEntry}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.kind === "add-entry" && (
        <Modal title="Configurar periodicidad" onClose={closeModal}>
          <EntryForm
            initial={(() => {
              const override = overridesMap.get(modal.template.id);
              const catalogSpares = (templateSpares[modal.template.id] ?? []).map((spare) => ({
                partName: spare.partName,
                partReference: spare.partReference,
                manufacturer: spare.manufacturer,
                quantity: spare.quantity,
                unit: spare.unit,
                notes: spare.notes,
              }));
              const overrideSpares = override?.spares.map((s) => ({
                partName: s.partName,
                partReference: s.partReference,
                manufacturer: s.manufacturer,
                quantity: s.quantity,
                unit: s.unit,
                notes: s.notes,
              })) ?? [];
              return {
                intervalDays: override?.intervalDays ?? modal.template.intervalDays ?? null,
                intervalHours: override?.intervalHours ?? modal.template.intervalHours ?? null,
                lastDoneAt: null,
                responsible: null,
                notes: override?.notes ?? null,
                spares: overrideSpares.length ? overrideSpares : catalogSpares,
              };
            })()}
            template={modal.template}
            loading={saving}
            error={error}
            onSave={handleSaveEntry}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.kind === "edit-entry" && (
        <Modal title="Editar periodicidad" onClose={closeModal}>
          <EntryForm
            initial={{
              intervalDays: modal.entry.intervalDays,
              intervalHours: modal.entry.intervalHours,
              lastDoneAt: modal.entry.lastDoneAt,
              responsible: modal.entry.responsible,
              notes: modal.entry.notes,
              spares: (templateSpares[modal.entry.template.id] ?? []).map((spare) => ({
                partName: spare.partName,
                partReference: spare.partReference,
                manufacturer: spare.manufacturer,
                quantity: spare.quantity,
                unit: spare.unit,
                notes: spare.notes,
              })),
            }}
            template={modal.entry.template}
            loading={saving}
            error={error}
            onSave={handleUpdateEntry}
            onCancel={closeModal}
            onDelete={handleDeleteEntry}
          />
        </Modal>
      )}

    </section>
  );
}
