import { useEffect, useMemo, useRef, useState } from "react";
import * as db from "../lib/db";
import { todayLocalISO } from "../lib/dates";
import type { BoatCatalogOverride, BoatScheduleEntry, BoatSystem, MaintenanceTemplate, MaintenanceTemplateSpare } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

// ─── Registrar un trabajo hecho ───────────────────────────────────────────────
// Crea la tarea en el historial de mantenimiento; el plan se pone al día solo
// (disparador sync_completed_maintenance_task_to_schedule). Así no hay dos
// sitios donde apuntar lo mismo.

type DoneFormValue = { doneDate: string; hours: number | null; cost: number | null; notes: string | null };

function RegisterDoneForm({
  entry, loading, error, onSave, onCancel,
}: {
  entry: BoatScheduleEntry;
  loading: boolean;
  error: string | null;
  onSave: (value: DoneFormValue) => void;
  onCancel: () => void;
}) {
  const today = todayLocalISO();
  const [form, setForm] = useState<DoneFormValue>({
    doneDate: today,
    hours: entry.currentHours != null ? Math.round(entry.currentHours * 10) / 10 : null,
    cost: null,
    notes: null,
  });
  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection title={entry.template.titleEn || entry.template.title}>
        <FormGrid>
          <InputField label="Fecha en que se hizo" type="date" required max={today} value={form.doneDate}
            onChange={(e) => setForm((p) => ({ ...p, doneDate: e.target.value }))} />
          <InputField label="Horas del contador" type="number" step="0.1" value={form.hours ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value ? Number(e.target.value) : null }))} />
          <InputField label="Coste" type="number" value={form.cost ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value ? Number(e.target.value) : null }))} />
        </FormGrid>
        <TextareaField label="Notas" value={form.notes ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))} />
        <p className="field-hint">Se guarda en el historial de mantenimiento y el plan se actualiza solo.</p>
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}

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

type StateFilter = "" | BoatScheduleEntry["state"];

const STATE_ORDER: Record<BoatScheduleEntry["state"], number> = { overdue: 0, never: 1, due_soon: 2, ok: 3 };

function stateLabel(state: BoatScheduleEntry["state"], locale: "es" | "en") {
  const es = { overdue: "Vencida", never: "Sin registrar", due_soon: "Próxima", ok: "Al día" };
  const en = { overdue: "Overdue", never: "Never logged", due_soon: "Due soon", ok: "Up to date" };
  return (locale === "es" ? es : en)[state];
}

// Gravedad en el Gantt: naranja si toca pronto o va poco pasada, rojo si va
// muy pasada (más de 30 días o de 50 h, o de un cuarto del intervalo si es corto).
type Severity = "late" | "warn" | null;

function overdueBy(entry: BoatScheduleEntry) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = entry.nextDueDate ? new Date(`${entry.nextDueDate}T00:00:00`) : null;
  const days = due ? Math.round((today.getTime() - due.getTime()) / 86400000) : 0;
  const hours = entry.nextDueHours != null && entry.currentHours != null
    ? entry.currentHours - entry.nextDueHours
    : 0;
  return { days: Math.max(0, days), hours: Math.max(0, hours) };
}

function agoLabel(days: number) {
  if (days >= 730) return `${Math.floor(days / 365)} años`;
  if (days >= 365) return "1 año";
  if (days >= 60) return `${Math.floor(days / 30)} meses`;
  return `${days} ${days === 1 ? "día" : "días"}`;
}

function severity(entry: BoatScheduleEntry): Severity {
  if (entry.state === "due_soon") return "warn";
  if (entry.state !== "overdue") return null;
  const { days, hours } = overdueBy(entry);
  const dayLimit = Math.min(30, entry.intervalDays ? entry.intervalDays / 4 : 30);
  const hourLimit = Math.min(50, entry.intervalHours ? entry.intervalHours / 4 : 50);
  return days > dayLimit || hours > hourLimit ? "late" : "warn";
}

type ModalMode =
  | { kind: "pick-template" }
  | { kind: "add-entry"; template: MaintenanceTemplate }
  | { kind: "edit-entry"; entry: BoatScheduleEntry }
  | { kind: "register-done"; entry: BoatScheduleEntry };

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
  const [stateFilter, setStateFilter] = useState<StateFilter>("");
  // Se abre en la última vista elegida (por defecto, el Gantt con las barras).
  const [view, setViewState] = useState<ScheduleView>(() => {
    try { return localStorage.getItem("schedule-view") === "list" ? "list" : "gantt"; }
    catch { return "gantt"; }
  });
  function setView(next: ScheduleView) {
    setViewState(next);
    try { localStorage.setItem("schedule-view", next); } catch { /* sin almacenamiento */ }
  }
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const { refresh: refreshAppData } = useAppData();

  async function refresh() {
    if (!activeBoatId) return;
    setLoading(true);
    try {
      const [s, tmpl, overrides, systems] = await Promise.all([
        db.fetchBoatSchedule(activeBoatId),
        db.fetchMaintenanceTemplates(),
        db.fetchBoatCatalogOverridesMap(activeBoatId),
        db.fetchBoatSystems(activeBoatId),
      ]);
      setSchedule(s);
      setBoatSystems(systems);
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

  const bySystem = useMemo(
    () => schedule.filter((e) => !systemFilter || e.template.systemCode === systemFilter),
    [schedule, systemFilter]
  );
  // Primero lo que pide atención: vencidas, sin registrar, próximas.
  const filtered = useMemo(
    () => bySystem
      .filter((e) => !stateFilter || e.state === stateFilter)
      .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]
        || (a.nextDueDate ?? "9999").localeCompare(b.nextDueDate ?? "9999")),
    [bySystem, stateFilter]
  );
  const stateCounts = bySystem.reduce<Record<string, number>>((acc, e) => {
    acc[e.state] = (acc[e.state] ?? 0) + 1;
    return acc;
  }, {});

  // Del trabajo hecho más antiguo al vencimiento más lejano, con al menos un
  // año a cada lado de hoy (y como mucho 5 atrás y 6 adelante).
  const ganttRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = startOfMonth(today);
    let start = addMonths(thisMonth, -12);
    let end = addMonths(thisMonth, 13);
    for (const entry of schedule) {
      const done = parseDate(entry.lastDoneAt);
      const due = parseDate(entry.nextDueDate);
      if (done && done < start) start = startOfMonth(done);
      if (due && due >= end) end = addMonths(startOfMonth(due), 2);
    }
    const earliest = addMonths(thisMonth, -60);
    const latest = addMonths(thisMonth, 72);
    if (start < earliest) start = earliest;
    if (end > latest) end = latest;
    const count = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    const months = Array.from({ length: count }, (_, index) => addMonths(start, index));
    const totalDays = Math.max(1, daysBetween(start, end));
    const todayPct = (daysBetween(start, today) / totalDays) * 100;
    // Una banda por año encima de los meses.
    const years: Array<{ year: number; months: number }> = [];
    for (const month of months) {
      const last = years[years.length - 1];
      if (last && last.year === month.getFullYear()) last.months += 1;
      else years.push({ year: month.getFullYear(), months: 1 });
    }
    return { start, end, months, years, totalDays, todayPct, thisMonth };
  }, [schedule]);

  // Al abrir el Gantt, se coloca en hoy (con algo de pasado a la vista).
  // Al cargar la página el tablero aún no tiene tamaño: se coloca en cuanto lo
  // tenga (ResizeObserver), y solo una vez por cambio de vista o de rango.
  const ganttRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const board = ganttRef.current;
    if (view !== "gantt" || !board) return;
    let positioned = false;
    const position = () => {
      const track = board.querySelector<HTMLElement>(".gantt-months");
      if (positioned || !track || board.clientWidth === 0 || track.offsetWidth === 0) return;
      const label = board.querySelector<HTMLElement>(".gantt-head-label")?.offsetWidth ?? 0;
      const todayPx = (ganttRange.todayPct / 100) * track.offsetWidth;
      board.scrollLeft = Math.max(0, todayPx - (board.clientWidth - label) / 3);
      positioned = true;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(board);
    return () => observer.disconnect();
  }, [view, ganttRange]);

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

  async function handleRegisterDone(value: DoneFormValue) {
    if (!activeBoatId || modal?.kind !== "register-done") return;
    const { entry } = modal;
    const system = boatSystems.find((s) => s.systemId === entry.template.systemId) ?? boatSystems[0];
    if (!system) { setError("Añade primero al menos un sistema al barco."); return; }
    setSaving(true); setError(null);
    try {
      await db.createMaintenanceTask({
        templateId: entry.templateId,
        boatId: activeBoatId,
        boatSystemId: system.id,
        boatComponentId: null,
        haulOutId: null,
        // El historial se lleva en inglés, sea cual sea el idioma de la app.
        title: entry.template.titleEn || entry.template.title,
        description: entry.template.descriptionEn || entry.template.description,
        kind: entry.template.kind,
        status: "done",
        priority: entry.template.defaultPriority,
        dueDate: null,
        doneDate: value.doneDate,
        responsible: null,
        performedBy: null,
        location: null,
        engineHours: value.hours,
        cost: value.cost,
        notes: value.notes,
      });
      await Promise.all([refresh(), refreshAppData()]);
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
    const base = intervalDays && intervalHours
      ? `${intervalDays} d / ${intervalHours} h`
      : intervalDays
        ? `${intervalDays} días`
        : intervalHours
          ? `${intervalHours} h motor`
          : "—";
    // Con las horas del contador (a mano o del barco), cuánto queda.
    if (entry.nextDueHours != null && entry.currentHours != null) {
      const left = Math.round(entry.nextDueHours - entry.currentHours);
      return left >= 0
        ? `${base} · ${locale === "es" ? "faltan" : "due in"} ${left} h`
        : `${base} · ${locale === "es" ? "pasada" : "over by"} ${-left} h`;
    }
    return base;
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

      <div className="filter-bar" style={{ marginTop: "-0.25rem" }}>
        {([""] as StateFilter[]).concat(["overdue", "never", "due_soon", "ok"]).map((state) => (
          <button
            key={state || "all"} type="button"
            className={stateFilter === state ? "filter-chip active" : "filter-chip"}
            onClick={() => setStateFilter(state)}
          >
            {state ? `${stateLabel(state, locale)} (${stateCounts[state] ?? 0})` : `Todas (${bySystem.length})`}
          </button>
        ))}
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
                <span className="schedule-row-sys">{entrySystem(entry, locale)} · {stateLabel(entry.state, locale)}</span>
                <span className="schedule-row-title">{entryTitle(entry, locale)}</span>
              </div>
              <div className="schedule-row-meta">
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">Intervalo</span>
                  <strong>{ruleLabel(entry)}</strong>
                </span>
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">{t("lastDoneAt")}</span>
                  <strong>
                    {entry.lastDoneAt ?? "—"}
                    {entry.lastDoneEngineHours != null ? ` · ${entry.lastDoneEngineHours} h` : ""}
                  </strong>
                </span>
                <span className="schedule-meta-item">
                  <span className="schedule-meta-label">Próxima</span>
                  <strong>{entry.nextDueDate ?? (entry.state === "never" ? "¿?" : "—")}</strong>
                </span>
              </div>
              <div className="schedule-row-actions">
                {isSupabaseConfigured && (
                  <>
                    <button
                      className="btn-ghost compact-button" type="button"
                      title="Registrar que se ha hecho"
                      onClick={() => { setError(null); setModal({ kind: "register-done", entry }); }}
                    >
                      ✓ Hecha
                    </button>
                    <button
                      className="btn-icon" type="button" title="Editar periodicidad"
                      onClick={() => setModal({ kind: "edit-entry", entry })}
                    >
                      ✏
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && schedule.length > 0 && (
            <div className="empty-state">
              <p>No hay trabajos periódicos con estos filtros.</p>
            </div>
          )}
        </div>
      )}

      {view === "gantt" && (
        <div
          className="gantt-board" ref={ganttRef}
          style={{ "--gantt-cols": ganttRange.months.length } as React.CSSProperties}
        >
          <div className="gantt-head">
            <div className="gantt-head-label">Trabajo periódico</div>
            <div className="gantt-timeline">
              <div className="gantt-years">
                {ganttRange.years.map((group) => (
                  <span key={group.year} style={{ gridColumn: `span ${group.months}` }}>
                    <strong>{group.year}</strong>
                  </span>
                ))}
              </div>
              <div className="gantt-months">
                {ganttRange.months.map((month) => (
                  <span
                    key={month.toISOString()}
                    className={month.getTime() === ganttRange.thisMonth.getTime() ? "is-today" : undefined}
                  >
                    {new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { month: "short" }).format(month)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {filtered.map((entry) => {
            const bar = ganttBar(entry);
            // Vencida por fecha: cola rayada desde el vencimiento hasta hoy.
            const duePct = bar ? bar.left + bar.width : null;
            const sev = severity(entry);
            const late = entry.state === "overdue" ? overdueBy(entry) : null;
            const overdueDays = late?.days ?? 0;
            return (
              <div key={entry.id} className={`gantt-row state-${entry.state}${sev ? ` sev-${sev}` : ""}`}>
                <button
                  type="button"
                  className="gantt-task"
                  onClick={() => setModal({ kind: "edit-entry", entry })}
                >
                  <span className="gantt-task-system">{entrySystem(entry, locale)}</span>
                  <span className="gantt-task-title">{entryTitle(entry, locale)}</span>
                  <span className="gantt-task-rule">{ruleLabel(entry)}</span>
                  {late && (
                    <span className="gantt-task-overdue">
                      {overdueDays > 0
                        ? `Vencida hace ${agoLabel(overdueDays)}`
                        : `Vencida por ${Math.round(late.hours)} h`}
                    </span>
                  )}
                  {entry.state === "due_soon" && <span className="gantt-task-overdue">Toca pronto</span>}
                </button>
                <div className="gantt-track">
                  <span className="gantt-today" style={{ left: `${ganttRange.todayPct}%` }} />
                  {overdueDays > 0 && duePct != null && (
                    <span
                      className="gantt-overdue-tail"
                      style={{ left: `${duePct}%`, width: `${Math.max(0, ganttRange.todayPct - duePct)}%` }}
                    />
                  )}
                  {bar ? (
                    <button
                      type="button"
                      className={`gantt-bar state-${entry.state}${sev ? ` sev-${sev}` : ""}`}
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
                      style={{ left: `calc(${ganttRange.todayPct}% + 0.5rem)` }}
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

      {modal?.kind === "register-done" && (
        <Modal title="Registrar trabajo hecho" onClose={closeModal}>
          <RegisterDoneForm
            entry={modal.entry}
            loading={saving}
            error={error}
            onSave={handleRegisterDone}
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
