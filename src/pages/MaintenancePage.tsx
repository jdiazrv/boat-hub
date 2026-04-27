import React, { useEffect, useMemo, useState } from "react";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as db from "../lib/db";
import type { BoatComponent, BoatSystem, HaulOut, HourCounter, MaintenanceKind, MaintenanceTask, MaintenanceTemplate, TaskAttachment } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { AttachmentGallery } from "../components/AttachmentGallery";
import { sysName, useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

const STATUSES = ["pending", "planned", "in_progress", "done", "cancelled", "postponed"] as const;
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

function TaskForm({
  initial, boatName, systems, components, templates, haulOuts, hourCounters, editing, existingAttachments, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<MaintenanceTask, "id" | "systemName" | "boatName" | "updatedAt">;
  boatName: string;
  systems: BoatSystem[];
  components: BoatComponent[];
  templates: MaintenanceTemplate[];
  haulOuts: HaulOut[];
  hourCounters: HourCounter[];
  editing: boolean;
  existingAttachments: TaskAttachment[];
  onSave: (d: Omit<MaintenanceTask, "id" | "systemName" | "boatName" | "updatedAt">, files: File[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(existingAttachments);
  const [files, setFiles] = useState<File[]>([]);
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(initial) ||
    files.length > 0 ||
    attachments.length !== existingAttachments.length;

  useEffect(() => { setAttachments(existingAttachments); }, [existingAttachments]);
  const [step, setStep] = useState<"catalog" | "details">(editing || initial.title ? "details" : "catalog");
  const [search, setSearch] = useState("");
  const [catalogSystemId, setCatalogSystemId] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualKind, setManualKind] = useState<MaintenanceKind>("corrective");
  const { t, locale } = useI18n();

  useEffect(() => {
    setForm(initial);
    setStep(editing || initial.title ? "details" : "catalog");
    setSearch("");
    setCatalogSystemId("");
    setManualTitle("");
    setManualKind("corrective");
    setFiles([]);
  }, [initial, editing]);

  const catalogSystems = useMemo(
    () => Array.from(
      new Map(templates.map((template) => [
        template.systemId,
        { id: template.systemId, nameEs: template.systemNameEs, nameEn: template.systemNameEn },
      ])).values()
    ).sort((a, b) => (locale === "es" ? a.nameEs : a.nameEn).localeCompare(locale === "es" ? b.nameEs : b.nameEn)),
    [templates, locale]
  );

  const visibleTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((template) => {
      if (catalogSystemId && template.systemId !== catalogSystemId) return false;
      if (!q) return true;
      return [
        template.title, template.titleEs ?? "", template.titleEn ?? "",
        template.description ?? "", template.descriptionEs ?? "", template.descriptionEn ?? "",
        template.systemNameEs, template.systemNameEn, template.systemCode,
      ].join(" ").toLowerCase().includes(q);
    });
  }, [catalogSystemId, search, templates]);

  const systemComponents = components.filter((c) => c.boatSystemId === form.boatSystemId);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((e) => e.id === templateId);
    if (!template) return;
    const matchingSystem = systems.find((s) => s.systemId === template.systemId);
    setForm((current) => ({
      ...current,
      templateId: template.id,
      boatSystemId: matchingSystem?.id ?? current.boatSystemId,
      title: locale === "es" ? template.titleEs || template.title : template.titleEn || template.title,
      description: locale === "es" ? template.descriptionEs || template.description : template.descriptionEn || template.description,
      kind: template.kind,
      priority: template.defaultPriority,
    }));
    setStep("details");
  }

  function startManualTask() {
    setForm((current) => ({
      ...current, templateId: null, title: manualTitle.trim(), kind: manualKind, description: null,
    }));
    setStep("details");
  }

  if (step === "catalog") {
    return (
      <div className="form-stack">
        <FormSection title="Elegir acción del catálogo">
          <div className="form-boat-badge">{boatName}</div>
          <HourCountersSummary counters={hourCounters} />
          <div className="filter-bar" style={{ marginBottom: "0.75rem" }}>
            <InputField
              label="Buscar acción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, descripción o sistema"
            />
            <SelectField label={t("system")} value={catalogSystemId} onChange={(e) => setCatalogSystemId(e.target.value)}>
              <option value="">Todos los sistemas</option>
              {catalogSystems.map((s) => (
                <option key={s.id} value={s.id}>{locale === "es" ? s.nameEs : s.nameEn}</option>
              ))}
            </SelectField>
          </div>
          <div className="catalog-picker-list">
            {visibleTemplates.map((template) => {
              const title = locale === "es"
                ? template.titleEs || template.titleEn || template.title
                : template.titleEn || template.titleEs || template.title;
              const systemName = locale === "es"
                ? template.systemNameEs || template.systemNameEn
                : template.systemNameEn || template.systemNameEs;
              return (
                <button className="picker-row" key={template.id} type="button" onClick={() => applyTemplate(template.id)}>
                  <span className="picker-row-sys">{systemName}</span>
                  <span className="picker-row-title">{title}</span>
                  <span className="picker-row-kind">{t(`kind_${template.kind}`)}</span>
                </button>
              );
            })}
            {visibleTemplates.length === 0 && (
              <p className="data-table-cell-muted">No hay acciones en el catálogo con esos filtros.</p>
            )}
          </div>
        </FormSection>

        <FormSection title="No está en el catálogo">
          <FormGrid>
            <InputField label={t("title")} value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
            <SelectField label={t("kind")} value={manualKind} onChange={(e) => setManualKind(e.target.value as MaintenanceKind)}>
              {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}
            </SelectField>
          </FormGrid>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
            <button className="btn-primary" disabled={!manualTitle.trim()} type="button" onClick={startManualTask}>
              Continuar
            </button>
          </div>
        </FormSection>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="btn-ghost" onClick={onCancel}>{t("cancel")}</button>
        </div>
      </div>
    );
  }

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form, files); }}>
      <FormSection title="Tarea">
        <div className="form-boat-badge">{boatName}</div>
        <HourCountersSummary counters={hourCounters} />
        {!editing && (
          <button className="btn-ghost" type="button" onClick={() => setStep("catalog")}>
            Cambiar acción
          </button>
        )}
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

      <FormSection title="Clasificación">
        <FormGrid>
          <SelectField label={t("kind")} value={form.kind} onChange={(e) => set("kind", e.target.value as typeof form.kind)}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}
          </SelectField>
          <SelectField label={t("status")} value={form.status} onChange={(e) => {
            const newStatus = e.target.value as typeof form.status;
            const isNowDone = newStatus === "done" || newStatus === "cancelled";
            setForm((p) => ({
              ...p,
              status: newStatus,
              doneDate: isNowDone ? (p.doneDate ?? new Date().toISOString().slice(0, 10)) : null,
            }));
          }}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </SelectField>
          <SelectField label={t("priority")} value={form.priority} onChange={(e) => set("priority", e.target.value as typeof form.priority)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </SelectField>
        </FormGrid>
      </FormSection>

      <FormSection title="Planificación">
        <FormGrid>
          <SelectField label="Varada" value={form.haulOutId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              const haul = haulOuts.find((h) => h.id === id);
              set("haulOutId", id);
              if (haul?.plannedDate) set("dueDate", haul.plannedDate);
            }}>
            <option value="">— Sin varada —</option>
            {haulOuts.map((h) => <option key={h.id} value={h.id}>{h.name}{h.plannedDate ? ` (${h.plannedDate})` : ""}</option>)}
          </SelectField>
          {(form.status !== "done" && form.status !== "cancelled") && (
            <InputField label={form.haulOutId ? "Fecha prevista en varada" : t("dueDate")} type="date" value={form.dueDate ?? ""}
              onChange={(e) => set("dueDate", e.target.value || null)} />
          )}
          {(form.status === "done" || form.status === "cancelled") && (
            <InputField label={t("doneDate")} type="date" value={form.doneDate ?? ""}
              onChange={(e) => set("doneDate", e.target.value || null)} />
          )}
          <InputField label={t("responsible")} value={form.responsible ?? ""}
            onChange={(e) => set("responsible", e.target.value || null)} />
          <InputField label="Realizado por" value={form.performedBy ?? ""}
            onChange={(e) => set("performedBy", e.target.value || null)} />
          <InputField label={t("engineHours")} type="number" value={form.engineHours ?? ""}
            onChange={(e) => set("engineHours", e.target.value ? Number(e.target.value) : null)} />
          <InputField label={t("cost")} type="number" value={form.cost ?? ""}
            onChange={(e) => set("cost", e.target.value ? Number(e.target.value) : null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>

      <FormSection title="Adjuntos">
        <AttachmentGallery
          attachments={attachments}
          onDeleted={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        />
        <FormGrid>
          <InputField label="Añadir fotografía" type="file" accept="image/*" multiple
            onChange={(e) => setFiles((current) => [...current, ...Array.from(e.target.files ?? [])])} />
          <InputField label="Añadir fichero" type="file" multiple
            onChange={(e) => setFiles((current) => [...current, ...Array.from(e.target.files ?? [])])} />
        </FormGrid>
        {files.length > 0 && (
          <div className="attachment-preview-list">
            {files.map((file, index) => (
              <span className="pill" key={`${file.name}-${index}`}>{file.name}</span>
            ))}
          </div>
        )}
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} disabled={editing && !isDirty} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function MaintenancePage() {
  const { t, locale } = useI18n();
  const { maintenanceTasks, maintenanceTasksFull, haulOuts, refresh, loading } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<MaintenanceTask | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterScheduled, setFilterScheduled] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status" | "system">("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const [boatComponents, setBoatComponents] = useState<BoatComponent[]>([]);
  const [hourCounters, setHourCounters] = useState<HourCounter[]>([]);
  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [editingAttachments, setEditingAttachments] = useState<TaskAttachment[]>([]);
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne, toggleAll } = useSelectMode();
  const [deleting, setDeleting] = useState(false);

  const boatName = activeBoat ? activeBoat.name : "Sin barco activo";

  const today = new Date().toISOString().slice(0, 10);
  const tasks = isSupabaseConfigured ? maintenanceTasksFull : maintenanceTasks;

  const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  const STATUS_ORDER = { in_progress: 0, pending: 1, planned: 2, postponed: 3, done: 4, cancelled: 5 };

  const filtered = useMemo(() => {
    const list = tasks.filter((task) => {
      if (activeBoatId && task.boatId !== activeBoatId) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterSystem && task.boatSystemId !== filterSystem) return false;
      if (filterScheduled && !(task.dueDate && task.dueDate >= today && (task.status === "planned" || task.status === "pending"))) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (![task.title, task.description ?? "", task.notes ?? ""].join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "dueDate") {
        const da = a.dueDate ?? "9999-99-99";
        const db2 = b.dueDate ?? "9999-99-99";
        return da < db2 ? -dir : da > db2 ? dir : 0;
      }
      if (sortBy === "priority") {
        return dir * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
      }
      if (sortBy === "status") {
        return dir * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
      }
      if (sortBy === "system") {
        return dir * (a.systemName ?? "").localeCompare(b.systemName ?? "");
      }
      return 0;
    });
    return list;
  }, [tasks, activeBoatId, filterStatus, filterPriority, filterSystem, filterScheduled, filterSearch, sortBy, sortDir, today]);

  useEffect(() => {
    if (!activeBoatId) return;
    Promise.all([
      db.fetchBoatSystems(activeBoatId),
      db.fetchBoatComponents(activeBoatId),
      db.fetchHourCounters(activeBoatId),
    ]).then(([systems, components, counters]) => {
      setBoatSystems(systems);
      setBoatComponents(components);
      setHourCounters(counters);
    }).catch(() => {});
  }, [activeBoatId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !activeBoatId) return;
    db.fetchMaintenanceTemplates(activeBoatId).then(setTemplates).catch(() => {});
  }, [activeBoatId]);

  const EMPTY: Omit<MaintenanceTask, "id" | "systemName" | "boatName" | "updatedAt"> = {
    templateId: null, boatId: activeBoatId ?? "", boatSystemId: null, boatComponentId: null, haulOutId: null,
    title: "", description: null, kind: "corrective", status: "pending",
    priority: "medium", dueDate: null, doneDate: null, responsible: null,
    performedBy: null, engineHours: null, cost: null, notes: null,
  };

  function openCreate() { setEditing(null); setEditingAttachments([]); setError(null); setModal("create"); }
  function openEdit(task: MaintenanceTask) {
    setEditing(task);
    setEditingAttachments([]);
    setError(null);
    setModal("edit");
    db.fetchTaskAttachments(task.id).then(setEditingAttachments).catch(() => {});
  }
  function closeModal() { setModal(null); setEditing(null); setEditingAttachments([]); }

  async function handleSave(data: Omit<MaintenanceTask, "id" | "systemName" | "boatName" | "updatedAt">, files: File[]) {
    const payload = { ...data, boatId: activeBoatId ?? data.boatId };
    if (!payload.boatId) { setError("No hay barco activo"); return; }
    if (!payload.boatSystemId) {
      const systems = boatSystems.length ? boatSystems : await db.fetchBoatSystems(payload.boatId);
      const fallbackSystem = systems[0];
      if (!fallbackSystem) {
        setError("Añade primero al menos un sistema al barco.");
        return;
      }
      payload.boatSystemId = fallbackSystem.id;
    }
    setSaving(true); setError(null);
    try {
      let taskId = editing?.id;
      if (editing) {
        await db.updateMaintenanceTask(editing.id, payload);
      } else {
        const created = await db.createMaintenanceTask(payload);
        taskId = created.id;
      }
      if (taskId && files.length) {
        await db.uploadTaskAttachments(payload.boatId, taskId, files);
      }
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar tarea "${editing.title}"?`)) return;
    setSaving(true);
    try { await db.deleteMaintenanceTask(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} tarea(s)? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => db.deleteMaintenanceTask(id)));
      await refresh();
      exitSelectMode();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("maintenance")}</span>
          <h2>{t("maintenanceBoard")}</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco en la barra lateral para ver sus tareas de mantenimiento.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("maintenance")} · {boatName}</span>
          <h2>{t("maintenanceBoard")}</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={exitSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ {t("newTask")}</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      <div className="filter-bar">
        <input
          className="form-input"
          placeholder="Buscar tarea…"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          style={{ minWidth: "180px" }}
        />
        <select className="form-input form-select" value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)}>
          <option value="">Todos los sistemas</option>
          {boatSystems.map((s) => <option key={s.id} value={s.id}>{sysName(s, locale)}</option>)}
        </select>
        <select className="form-input form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <select className="form-input form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">Todas las prioridades</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={filterScheduled} onChange={(e) => setFilterScheduled(e.target.checked)} />
          Solo programadas
        </label>
        <select className="form-input form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={{ minWidth: "140px" }}>
          <option value="dueDate">Ordenar: Fecha</option>
          <option value="priority">Ordenar: Prioridad</option>
          <option value="status">Ordenar: Estado</option>
          <option value="system">Ordenar: Sistema</option>
        </select>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
          title={sortDir === "asc" ? "Ascendente" : "Descendente"}
          style={{ padding: "0 0.6rem", fontSize: "1rem" }}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>


      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 7rem 3fr 1.4fr 6rem 6rem 5.5rem auto" }}>
            <SelectAllCheckbox selectMode={selectMode} ids={filtered.map((t) => t.id)} selected={selected} onToggleAll={toggleAll} />
            <span>Fecha</span><span>Tarea</span><span style={{marginLeft:"-15px"}}>Sistema</span><span style={{marginLeft:"-19px"}}>Tipo</span><span style={{marginLeft:"-23px"}}>Estado</span><span style={{marginLeft:"-27px"}}>Prioridad</span><span></span>
          </div>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No hay tareas de mantenimiento.</p></div>}
          {filtered.map((task) => {
            const isDone = task.status === "done" || task.status === "cancelled";
            const isOverdue = !isDone && task.dueDate && task.dueDate < today;

            let dateLabel: string;
            let dateStyle: React.CSSProperties = {};
            if (isDone) {
              dateLabel = task.doneDate ?? task.dueDate ?? "—";
              dateStyle = { color: "var(--text-soft)" };
            } else if (task.dueDate) {
              dateLabel = task.dueDate;
              dateStyle = {
                fontStyle: "italic",
                color: isOverdue ? "var(--danger)" : "var(--text-soft)",
                fontWeight: isOverdue ? 600 : undefined,
              };
            } else {
              dateLabel = "—";
              dateStyle = { color: "var(--text-soft)", opacity: 0.4 };
            }

            return (
            <div className="data-table-row" key={task.id} style={{ gridTemplateColumns: "1.5rem 7rem 3fr 1.4fr 6rem 6rem 5.5rem auto", alignItems: "center", background: selectMode && selected.has(task.id) ? "color-mix(in srgb, var(--danger) 6%, transparent)" : undefined }}>
              <SelectRowCheckbox selectMode={selectMode} id={task.id} selected={selected} onToggle={toggleOne} disabled={deleting} />
              <span style={{ fontSize: "0.82rem", ...dateStyle }}>{dateLabel}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                {task.hasPhoto && <span title="Tiene fotos" style={{ fontSize: "0.75rem", flexShrink: 0 }}>🖼</span>}
                {task.hasFile && <span title="Tiene archivos" style={{ fontSize: "0.75rem", flexShrink: 0 }}>📎</span>}
              </span>
              <span className="data-table-cell-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.systemName}</span>
              <span className={`pill kind-${task.kind}`}>{t(`kind_${task.kind}`)}</span>
              <span className={`pill ${task.status}`}>{t(task.status)}</span>
              <span className={`pill ${task.priority}`} style={{ visibility: isDone ? "hidden" : "visible" }}>{t(task.priority)}</span>
              <div className="row-actions">
                {isSupabaseConfigured && (
                  <button className="btn-icon" onClick={() => openEdit(task)} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={exitSelectMode} label="tarea" />

      {modal && (
        <Modal title={modal === "create" ? t("newTask") : t("editTask")} onClose={closeModal} wide>
          <TaskForm
            initial={editing
              ? {
                  templateId: editing.templateId ?? null, boatId: editing.boatId,
                  boatSystemId: editing.boatSystemId, boatComponentId: editing.boatComponentId,
                  haulOutId: editing.haulOutId, title: editing.title, description: editing.description,
                  kind: editing.kind, status: editing.status, priority: editing.priority,
                  dueDate: editing.dueDate, doneDate: editing.doneDate, responsible: editing.responsible,
                  performedBy: editing.performedBy, engineHours: editing.engineHours, cost: editing.cost, notes: editing.notes,
                }
              : EMPTY}
            boatName={boatName}
            systems={boatSystems}
            components={boatComponents}
            templates={templates}
            haulOuts={haulOuts.filter((h) => !activeBoatId || h.boatId === activeBoatId)}
            hourCounters={hourCounters}
            editing={!!editing}
            existingAttachments={editingAttachments}
            onSave={handleSave}
            onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal}
            loading={saving}
            error={error}
          />
        </Modal>
      )}
    </section>
  );
}
