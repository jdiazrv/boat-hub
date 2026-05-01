import { useEffect, useState } from "react";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import * as db from "../lib/db";
import type { BoatComponent, BoatSystem, HaulOut, HourCounter, MaintenanceKind, MaintenanceTask, MaintenanceTemplate } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { sysName, useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";
import { AttachmentGallery } from "../components/AttachmentGallery";
import type { TaskAttachment } from "../lib/types";

const STATUSES_HAUL = ["planned", "preparing", "in_progress", "closed", "cancelled"] as const;
const STATUSES_TASK = ["pending", "planned", "in_progress", "done", "cancelled", "postponed"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const KINDS: MaintenanceKind[] = ["preventive", "corrective", "inspection", "review", "upgrade"];

function HourCountersSummary({ counters }: { counters: HourCounter[] }) {
  if (!counters.length) return null;
  return (
    <div className="form-boat-badge" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <span>Últimas horas motor</span>
      {counters.map((counter) => (
        <strong key={counter.id}>{counter.name}: {counter.currentHours} h</strong>
      ))}
    </div>
  );
}

// ─── Haul-out CRUD form ───────────────────────────────────────────────────────

function HaulOutForm({
  initial, boatName, shipyards, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<HaulOut, "id" | "boatName" | "shipyardName">;
  boatName: string;
  shipyards: { id: string; name: string }[];
  onSave: (d: Omit<HaulOut, "id" | "boatName" | "shipyardName">) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);
  const { t } = useI18n();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const pending = (form.estimatedCost ?? 0) - (form.paidToDate ?? 0);

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection title="Datos generales">
        <div className="form-boat-badge">{boatName}</div>
        <FormGrid>
          <InputField label="Nombre / referencia" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <SelectField label={t("status")} value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
            {STATUSES_HAUL.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </SelectField>
          <SelectField label="Varadero" value={form.shipyardId ?? ""} onChange={(e) => set("shipyardId", e.target.value || null)}>
            <option value="">-- Sin varadero --</option>
            {shipyards.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectField>
          <InputField label="Lugar / ubicación" value={form.location ?? ""} onChange={(e) => set("location", e.target.value || null)} />
          <InputField label={t("responsible")} value={form.responsible ?? ""} onChange={(e) => set("responsible", e.target.value || null)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Fechas">
        <FormGrid>
          <InputField label="Fecha inicio" type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value || null)} />
          <InputField label={t("endDate")} type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value || null)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Costes">
        <FormGrid>
          <InputField label="Presupuesto estimado (€)" type="number" value={form.estimatedCost ?? ""} onChange={(e) => set("estimatedCost", e.target.value ? Number(e.target.value) : null)} />
          <InputField label="Pagado hasta la fecha (€)" type="number" value={form.paidToDate ?? ""} onChange={(e) => set("paidToDate", e.target.value ? Number(e.target.value) : null)} />
          <InputField label="Coste final real (€)" type="number" value={form.finalCost ?? ""} onChange={(e) => set("finalCost", e.target.value ? Number(e.target.value) : null)} />
          {(form.estimatedCost != null || form.paidToDate != null) && (
            <div className="form-field">
              <label className="form-label">Pendiente de pago</label>
              <span style={{ padding: "0.42rem 0.75rem", fontSize: "0.95rem", color: pending > 0 ? "var(--accent-warm)" : "var(--accent)", fontWeight: 600 }}>
                {pending.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
              </span>
            </div>
          )}
        </FormGrid>
      </FormSection>

      <FormSection>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} disabled={!!onDelete && !isDirty} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

// ─── Task form (inline, no catalog step for haul-out context) ─────────────────

function HaulOutTaskForm({
  initial, systems, components, templates, hourCounters, editing, existingAttachments, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<MaintenanceTask, "id" | "systemName" | "boatName">;
  systems: BoatSystem[];
  components: BoatComponent[];
  templates: MaintenanceTemplate[];
  hourCounters: HourCounter[];
  editing: boolean;
  existingAttachments: TaskAttachment[];
  onSave: (d: Omit<MaintenanceTask, "id" | "systemName" | "boatName">, files: File[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(existingAttachments);
  const [files, setFiles] = useState<File[]>([]);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initial) || files.length > 0 || attachments.length !== existingAttachments.length;
  const { t, locale } = useI18n();

  useEffect(() => { setAttachments(existingAttachments); }, [existingAttachments]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const systemComponents = components.filter((c) => c.boatSystemId === form.boatSystemId);

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form, files); }}>
      <FormSection>
        <HourCountersSummary counters={hourCounters} />
        <SelectField label={t("system")} value={form.boatSystemId ?? ""}
          onChange={(e) => { set("boatSystemId", e.target.value || null); set("boatComponentId", null); }}>
          <option value="">-- Sistema --</option>
          {systems.map((s) => <option key={s.id} value={s.id}>{sysName(s, locale)}</option>)}
        </SelectField>
        {systemComponents.length > 0 && (
          <SelectField label="Equipo / Componente" value={form.boatComponentId ?? ""}
            onChange={(e) => set("boatComponentId", e.target.value || null)}>
            <option value="">-- Sin componente --</option>
            {systemComponents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        )}
        <InputField label={t("title")} required value={form.title} onChange={(e) => set("title", e.target.value)} />
        <TextareaField label={t("description")} value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
      </FormSection>

      <FormSection title={t("sectionClassification")}>
        <FormGrid>
          <SelectField label={t("kind")} value={form.kind} onChange={(e) => set("kind", e.target.value as typeof form.kind)}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}
          </SelectField>
          <SelectField label={t("status")} value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
            {STATUSES_TASK.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </SelectField>
          <SelectField label={t("priority")} value={form.priority} onChange={(e) => set("priority", e.target.value as typeof form.priority)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </SelectField>
        </FormGrid>
      </FormSection>

      <FormSection title={t("sectionPlanning")}>
        <FormGrid>
          <InputField label={t("responsible")} value={form.responsible ?? ""} onChange={(e) => set("responsible", e.target.value || null)} />
          <InputField label={t("labelPerformedBy")} value={form.performedBy ?? ""} onChange={(e) => set("performedBy", e.target.value || null)} />
          <InputField label={t("doneDate")} type="date" value={form.doneDate ?? ""} onChange={(e) => set("doneDate", e.target.value || null)} />
          <InputField label="Horas de motor" type="number" value={form.engineHours ?? ""} onChange={(e) => set("engineHours", e.target.value ? Number(e.target.value) : null)} />
          <InputField label={t("cost")} type="number" value={form.cost ?? ""} onChange={(e) => set("cost", e.target.value ? Number(e.target.value) : null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>

      <FormSection title={t("sectionAttachments")}>
        <AttachmentGallery attachments={attachments} onDeleted={(id) => setAttachments((p) => p.filter((a) => a.id !== id))} />
        <FormGrid>
          <InputField label={t("labelAddPhoto")} type="file" accept="image/*" multiple onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files ?? [])])} />
          <InputField label={t("labelAddFile")} type="file" multiple onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files ?? [])])} />
        </FormGrid>
        {files.length > 0 && (
          <div className="attachment-preview-list">
            {files.map((f, i) => <span className="pill" key={`${f.name}-${i}`}>{f.name}</span>)}
          </div>
        )}
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} disabled={editing && !isDirty} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function HaulOutsPage() {
  const { t, locale } = useI18n();
  const { haulOuts, shipyards, refresh, loading } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const boatName = activeBoat?.name ?? "Sin barco activo";

  // Haul-out modal state
  const [haulModal, setHaulModal] = useState<"create" | "edit" | null>(null);
  const [editingHaul, setEditingHaul] = useState<HaulOut | null>(null);
  const [haulSaving, setHaulSaving] = useState(false);
  const [haulError, setHaulError] = useState<string | null>(null);

  // Selected haul-out and its tasks
  const [selectedHaulOut, setSelectedHaulOut] = useState<HaulOut | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Task modal state
  const [taskModal, setTaskModal] = useState<"create" | "edit" | null>(null);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Boat data for task form
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const [boatComponents, setBoatComponents] = useState<BoatComponent[]>([]);
  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [hourCounters, setHourCounters] = useState<HourCounter[]>([]);

  const filtered = haulOuts.filter((h) => !activeBoatId || h.boatId === activeBoatId);

  const { selectMode: selectModeHauls, selected: selectedHauls, enterSelectMode: enterSelectHauls, exitSelectMode: exitSelectHauls, toggleOne: toggleHaul, toggleAll: toggleAllHauls } = useSelectMode();
  const { selectMode: selectModeTasks, selected: selectedTasks, enterSelectMode: enterSelectTasks, exitSelectMode: exitSelectTasks, toggleOne: toggleTask, toggleAll: toggleAllTasks } = useSelectMode();
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function handleDeleteSelectedHauls() {
    if (!confirm(`¿Eliminar ${selectedHauls.size} varada(s)? Esta acción no se puede deshacer.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedHauls].map((id) => db.deleteHaulOut(id)));
      await refresh();
      exitSelectHauls();
    } catch (err) { setHaulError(err instanceof Error ? err.message : "Error"); }
    finally { setBulkDeleting(false); }
  }

  async function handleDeleteSelectedTasks() {
    if (!selectedHaulOut || !confirm(`¿Eliminar ${selectedTasks.size} trabajo(s)? Esta acción no se puede deshacer.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedTasks].map((id) => db.deleteMaintenanceTask(id)));
      await loadTasks(selectedHaulOut);
      exitSelectTasks();
    } catch (err) { setHaulError(err instanceof Error ? err.message : "Error"); }
    finally { setBulkDeleting(false); }
  }

  useEffect(() => {
    if (!activeBoatId) return;
    Promise.all([
      db.fetchBoatSystems(activeBoatId),
      db.fetchBoatComponents(activeBoatId),
      db.fetchHourCounters(activeBoatId),
    ]).then(([sys, comp, counters]) => { setBoatSystems(sys); setBoatComponents(comp); setHourCounters(counters); }).catch(() => {});
    if (isSupabaseConfigured) {
      db.fetchMaintenanceTemplates(activeBoatId).then(setTemplates).catch(() => {});
    }
  }, [activeBoatId]);

  async function loadTasks(haulOut: HaulOut) {
    setSelectedHaulOut(haulOut);
    setTasksLoading(true);
    try { setTasks(await db.fetchHaulOutTasks(haulOut.id)); }
    catch { /* ignore */ }
    finally { setTasksLoading(false); }
  }

  // ── Haul-out CRUD ──────────────────────────────────────────────────────────

  const EMPTY_HAUL: Omit<HaulOut, "id" | "boatName" | "shipyardName"> = {
    boatId: activeBoatId ?? "", name: "", plannedDate: null, startDate: null, endDate: null,
    status: "planned", shipyardId: null, location: null, responsible: null,
    estimatedCost: null, paidToDate: null, finalCost: null, notes: null,
  };

  async function handleHaulSave(data: Omit<HaulOut, "id" | "boatName" | "shipyardName">) {
    const payload = { ...data, boatId: activeBoatId ?? data.boatId, plannedDate: data.startDate };
    if (!payload.boatId) { setHaulError("No hay barco activo"); return; }
    setHaulSaving(true); setHaulError(null);
    try {
      if (editingHaul) await db.updateHaulOut(editingHaul.id, payload);
      else await db.createHaulOut(payload);
      await refresh();
      setHaulModal(null); setEditingHaul(null);
      // Refresh tasks if we edited the selected haul-out
      if (editingHaul && selectedHaulOut?.id === editingHaul.id) {
        setSelectedHaulOut((prev) => prev ? { ...prev, ...payload } : prev);
      }
    } catch (err) { setHaulError(err instanceof Error ? err.message : "Error"); }
    finally { setHaulSaving(false); }
  }

  async function handleHaulDelete() {
    if (!editingHaul || !confirm(`¿Eliminar varada "${editingHaul.name}"?`)) return;
    setHaulSaving(true);
    try {
      await db.deleteHaulOut(editingHaul.id);
      await refresh();
      if (selectedHaulOut?.id === editingHaul.id) setSelectedHaulOut(null);
      setHaulModal(null); setEditingHaul(null);
    } catch (err) { setHaulError(err instanceof Error ? err.message : "Error"); }
    finally { setHaulSaving(false); }
  }

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  const EMPTY_TASK = (haulOutId: string, plannedDate: string | null): Omit<MaintenanceTask, "id" | "systemName" | "boatName"> => ({
    templateId: null, boatId: activeBoatId ?? "", boatSystemId: null, boatComponentId: null,
    haulOutId, title: "", description: null, kind: "preventive", status: "pending",
    priority: "medium", dueDate: plannedDate, doneDate: null, responsible: null,
    performedBy: null, engineHours: null, cost: null, notes: null,
  });

  function openTaskCreate() {
    if (!selectedHaulOut) return;
    setEditingTask(null); setTaskAttachments([]); setTaskError(null); setTaskModal("create");
  }

  function openTaskEdit(task: MaintenanceTask) {
    setEditingTask(task); setTaskAttachments([]); setTaskError(null); setTaskModal("edit");
    db.fetchTaskAttachments(task.id).then(setTaskAttachments).catch(() => {});
  }

  async function handleTaskSave(data: Omit<MaintenanceTask, "id" | "systemName" | "boatName">, files: File[]) {
    if (!selectedHaulOut) return;
    const payload = { ...data, boatId: activeBoatId ?? data.boatId, haulOutId: selectedHaulOut.id };
    if (!payload.boatSystemId) {
      const sys = boatSystems.length ? boatSystems : await db.fetchBoatSystems(payload.boatId);
      if (!sys[0]) { setTaskError("Añade primero al menos un sistema al barco."); return; }
      payload.boatSystemId = sys[0].id;
    }
    setTaskSaving(true); setTaskError(null);
    try {
      let taskId = editingTask?.id;
      if (editingTask) {
        await db.updateMaintenanceTask(editingTask.id, payload);
      } else {
        const created = await db.createMaintenanceTask(payload);
        taskId = created.id;
      }
      if (taskId && files.length) await db.uploadTaskAttachments(payload.boatId, taskId, files);
      await loadTasks(selectedHaulOut);
      setTaskModal(null); setEditingTask(null);
    } catch (err) { setTaskError(err instanceof Error ? err.message : "Error"); }
    finally { setTaskSaving(false); }
  }

  async function handleTaskDelete() {
    if (!editingTask || !selectedHaulOut || !confirm(`¿Eliminar "${editingTask.title}"?`)) return;
    setTaskSaving(true);
    try {
      await db.deleteMaintenanceTask(editingTask.id);
      await loadTasks(selectedHaulOut);
      setTaskModal(null); setEditingTask(null);
    } catch (err) { setTaskError(err instanceof Error ? err.message : "Error"); }
    finally { setTaskSaving(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("haulOuts")}</span>
          <h2>Varadas</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco en la barra lateral para ver sus varadas.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("haulOuts")} · {boatName}</span>
          <h2>Varadas</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectModeHauls} onEnter={enterSelectHauls} onCancel={exitSelectHauls}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={() => { setEditingHaul(null); setHaulError(null); setHaulModal("create"); }} type="button">
              + {t("newHaulOut")}
            </button>
          )}
        </SelectModeHeaderButtons>
      </div>

      {loading && <p className="data-table-cell-muted">Cargando…</p>}

      {selectedHaulOut ? (
        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>

          {/* Cabecera + métricas */}
          <article className="panel-card">
            <div className="panel-head" style={{ marginBottom: "0.75rem" }}>
              <div>
                <button className="btn-ghost btn-sm" type="button" onClick={() => setSelectedHaulOut(null)} style={{ marginBottom: "0.5rem" }}>
                  ← Varadas
                </button>
                <span className="eyebrow" style={{ fontSize: "0.68rem" }}>{selectedHaulOut.location ?? selectedHaulOut.shipyardName ?? "Varada"}</span>
                <h3 style={{ margin: "0.1rem 0 0", fontSize: "1rem" }}>{selectedHaulOut.name}</h3>
              </div>
              <div className="row-actions">
                {isSupabaseConfigured && (
                  <button className="btn-icon" onClick={() => { setEditingHaul(selectedHaulOut); setHaulError(null); setHaulModal("edit"); }} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>

            {(selectedHaulOut.estimatedCost != null || selectedHaulOut.paidToDate != null || selectedHaulOut.finalCost != null) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {selectedHaulOut.estimatedCost != null && (
                  <div className="metric-card" style={{ padding: "0.6rem 0.75rem" }}>
                    <strong style={{ fontSize: "1.1rem", display: "block" }}>{selectedHaulOut.estimatedCost.toLocaleString("es-ES")} €</strong>
                    <span className="data-table-cell-muted" style={{ fontSize: "0.72rem" }}>Presupuesto</span>
                  </div>
                )}
                {selectedHaulOut.paidToDate != null && (
                  <div className="metric-card" style={{ padding: "0.6rem 0.75rem" }}>
                    <strong style={{ fontSize: "1.1rem", display: "block" }}>{selectedHaulOut.paidToDate.toLocaleString("es-ES")} €</strong>
                    <span className="data-table-cell-muted" style={{ fontSize: "0.72rem" }}>Pagado</span>
                  </div>
                )}
                {selectedHaulOut.estimatedCost != null && selectedHaulOut.paidToDate != null && (
                  <div className="metric-card" style={{ padding: "0.6rem 0.75rem" }}>
                    <strong style={{ fontSize: "1.1rem", display: "block", color: (selectedHaulOut.estimatedCost - selectedHaulOut.paidToDate) > 0 ? "var(--accent-warm)" : "var(--accent)" }}>
                      {(selectedHaulOut.estimatedCost - selectedHaulOut.paidToDate).toLocaleString("es-ES")} €
                    </strong>
                    <span className="data-table-cell-muted" style={{ fontSize: "0.72rem" }}>Pendiente</span>
                  </div>
                )}
                {selectedHaulOut.finalCost != null && (
                  <div className="metric-card" style={{ padding: "0.6rem 0.75rem" }}>
                    <strong style={{ fontSize: "1.1rem", display: "block" }}>{selectedHaulOut.finalCost.toLocaleString("es-ES")} €</strong>
                    <span className="data-table-cell-muted" style={{ fontSize: "0.72rem" }}>Coste final</span>
                  </div>
                )}
              </div>
            )}
          </article>

          {/* Trabajos */}
          <article className="panel-card">
            <div className="panel-head" style={{ marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Trabajos ({tasks.length})</h3>
              <SelectModeHeaderButtons selectMode={selectModeTasks} onEnter={enterSelectTasks} onCancel={exitSelectTasks}>
                {isSupabaseConfigured && (
                  <button className="btn-primary" onClick={openTaskCreate} type="button" style={{ fontSize: "0.82rem", padding: "0.4rem 0.8rem" }}>
                    + Nuevo trabajo
                  </button>
                )}
              </SelectModeHeaderButtons>
            </div>
            <div className="data-table">
              <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 2fr 0.8fr 0.8fr 0.8fr auto" }}>
                <SelectAllCheckbox selectMode={selectModeTasks} ids={tasks.map((t) => t.id)} selected={selectedTasks} onToggleAll={toggleAllTasks} />
                <span>Trabajo</span><span>Tipo</span><span>Prioridad</span><span>Estado</span><span></span>
              </div>
              {tasksLoading && <div className="empty-state"><p>Cargando…</p></div>}
              {!tasksLoading && tasks.length === 0 && <div className="empty-state"><p>Sin trabajos asignados a esta varada.</p></div>}
              {tasks.map((task) => (
                <div key={task.id} className="data-table-row" style={{ gridTemplateColumns: "1.5rem 2fr 0.8fr 0.8fr 0.8fr auto", alignItems: "center", background: selectModeTasks && selectedTasks.has(task.id) ? "color-mix(in srgb, var(--danger) 6%, transparent)" : undefined }}>
                  <SelectRowCheckbox selectMode={selectModeTasks} id={task.id} selected={selectedTasks} onToggle={toggleTask} disabled={bulkDeleting} />
                  <div>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "0.88rem" }}>{task.title}</span>
                      {task.hasPhoto && <span title="Tiene fotos" style={{ fontSize: "0.7rem" }}>🖼</span>}
                      {task.hasFile && <span title="Tiene archivos" style={{ fontSize: "0.7rem" }}>📎</span>}
                    </span>
                    {task.systemName && <span className="data-table-cell-muted" style={{ fontSize: "0.75rem" }}>{task.systemName}</span>}
                  </div>
                  <span><span className={`pill kind-${task.kind}`}>{t(`kind_${task.kind}`)}</span></span>
                  <span><span className={`pill ${task.priority}`}>{t(task.priority)}</span></span>
                  <span><span className={`pill ${task.status}`}>{t(task.status)}</span></span>
                  <div className="row-actions">
                    {isSupabaseConfigured && (
                      <button className="btn-icon" onClick={() => openTaskEdit(task)} type="button" title="Editar">✏</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <>
        <article className="panel-card">
          <div className="data-table">
            <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 1.8fr 0.9fr auto" }}>
              <SelectAllCheckbox selectMode={selectModeHauls} ids={filtered.map((h) => h.id)} selected={selectedHauls} onToggleAll={toggleAllHauls} />
              <span>Varada</span><span>Estado</span><span></span>
            </div>
            {filtered.length === 0 && !loading && <div className="empty-state"><p>No hay varadas.</p></div>}
            {filtered.map((h) => (
              <div
                key={h.id}
                className="data-table-row"
                style={{ gridTemplateColumns: "1.5rem 1.8fr 0.9fr auto", cursor: "pointer", alignItems: "center", background: selectModeHauls && selectedHauls.has(h.id) ? "color-mix(in srgb, var(--danger) 6%, transparent)" : undefined }}
                onClick={() => { if (!selectModeHauls) void loadTasks(h); }}
              >
                <SelectRowCheckbox selectMode={selectModeHauls} id={h.id} selected={selectedHauls} onToggle={toggleHaul} disabled={bulkDeleting} />
                <div>
                  <span style={{ display: "block" }}>{h.name}</span>
                  <span className="data-table-cell-muted" style={{ fontSize: "0.78rem" }}>
                    {[h.location, h.shipyardName, h.startDate ?? h.plannedDate].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <span><span className={`pill ${h.status}`}>{t(h.status)}</span></span>
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  {isSupabaseConfigured && (
                    <button className="btn-icon" onClick={() => { setEditingHaul(h); setHaulError(null); setHaulModal("edit"); }} type="button" title="Editar">✏</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
        </>
      )}

      <BulkDeleteBar selectMode={selectModeHauls} selected={selectedHauls} deleting={bulkDeleting} onDelete={handleDeleteSelectedHauls} onCancel={exitSelectHauls} label="varada" />
      <BulkDeleteBar selectMode={selectModeTasks} selected={selectedTasks} deleting={bulkDeleting} onDelete={handleDeleteSelectedTasks} onCancel={exitSelectTasks} label="trabajo" />

      {/* ── Modal varada ── */}
      {(haulModal === "create" || haulModal === "edit") && (
        <Modal title={haulModal === "create" ? t("newHaulOut") : t("editHaulOut")} onClose={() => { setHaulModal(null); setEditingHaul(null); }} wide>
          <HaulOutForm
            initial={editingHaul
              ? { boatId: editingHaul.boatId, name: editingHaul.name, plannedDate: editingHaul.plannedDate,
                  startDate: editingHaul.startDate ?? editingHaul.plannedDate, endDate: editingHaul.endDate, status: editingHaul.status,
                  shipyardId: editingHaul.shipyardId, location: editingHaul.location,
                  responsible: editingHaul.responsible, estimatedCost: editingHaul.estimatedCost,
                  paidToDate: editingHaul.paidToDate, finalCost: editingHaul.finalCost, notes: editingHaul.notes }
              : EMPTY_HAUL}
            boatName={boatName}
            shipyards={shipyards.map((s) => ({ id: s.id, name: s.name }))}
            onSave={handleHaulSave}
            onDelete={editingHaul ? handleHaulDelete : undefined}
            onCancel={() => { setHaulModal(null); setEditingHaul(null); }}
            loading={haulSaving}
            error={haulError}
          />
        </Modal>
      )}

      {/* ── Modal trabajo ── */}
      {taskModal && selectedHaulOut && (
        <Modal
          title={taskModal === "create" ? "Nuevo trabajo de varada" : "Editar trabajo"}
          onClose={() => { setTaskModal(null); setEditingTask(null); }}
          wide
        >
          <HaulOutTaskForm
            initial={editingTask
              ? { templateId: editingTask.templateId ?? null, boatId: editingTask.boatId,
                  boatSystemId: editingTask.boatSystemId, boatComponentId: editingTask.boatComponentId,
                  haulOutId: editingTask.haulOutId, title: editingTask.title, description: editingTask.description,
                  kind: editingTask.kind, status: editingTask.status, priority: editingTask.priority,
                  dueDate: editingTask.dueDate, doneDate: editingTask.doneDate, responsible: editingTask.responsible,
                  performedBy: editingTask.performedBy, engineHours: editingTask.engineHours,
                  cost: editingTask.cost, notes: editingTask.notes }
              : EMPTY_TASK(selectedHaulOut.id, selectedHaulOut.startDate ?? selectedHaulOut.plannedDate)}
            systems={boatSystems}
            components={boatComponents}
            templates={templates}
            hourCounters={hourCounters}
            editing={!!editingTask}
            existingAttachments={taskAttachments}
            onSave={handleTaskSave}
            onDelete={editingTask ? handleTaskDelete : undefined}
            onCancel={() => { setTaskModal(null); setEditingTask(null); }}
            loading={taskSaving}
            error={taskError}
          />
        </Modal>
      )}
    </section>
  );
}
