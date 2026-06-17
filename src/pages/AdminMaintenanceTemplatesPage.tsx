import { useEffect, useMemo, useState } from "react";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import * as db from "../lib/db";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import type { BoatCatalogOverride, BoatCatalogOverrideSpare, BoatScheduleEntry, MaintenanceKind, MaintenanceTemplate, Priority, SystemCatalogEntry } from "../lib/types";
import { useAuth } from "../providers/AuthProvider";
import { useAppData } from "../providers/AppDataProvider";
import { useActiveBoat } from "../providers/ActiveBoatProvider";

const KINDS: MaintenanceKind[] = ["preventive", "corrective", "inspection", "review", "upgrade"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

// ─── Template form (global CRUD — superuser only) ─────────────────────────────

type TemplateFormValue = {
  systemId: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  kind: MaintenanceKind;
  defaultPriority: Priority;
  sortOrder: number;
  intervalDays: number | null;
  intervalHours: number | null;
};

function TemplateForm({
  initial,
  systems,
  loading,
  error,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: TemplateFormValue;
  systems: SystemCatalogEntry[];
  loading: boolean;
  error: string | null;
  onSave: (value: TemplateFormValue) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(initial);
  const { t } = useI18n();

  useEffect(() => { setForm(initial); }, [initial]);

  function set<K extends keyof TemplateFormValue>(key: K, value: TemplateFormValue[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection title={t("templateClassification")}>
        <FormGrid>
          <SelectField label={t("system")} value={form.systemId} onChange={(e) => set("systemId", e.target.value)}>
            <option value="">-- {t("system")} --</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name_es} / {s.name_en}</option>
            ))}
          </SelectField>
          <SelectField label={t("kind")} value={form.kind} onChange={(e) => {
            const k = e.target.value as MaintenanceKind;
            setForm((c) => ({ ...c, kind: k, intervalDays: k === "preventive" ? c.intervalDays : null, intervalHours: k === "preventive" ? c.intervalHours : null }));
          }}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}
          </SelectField>
          <SelectField label={t("priority")} value={form.defaultPriority} onChange={(e) => set("defaultPriority", e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </SelectField>
          <InputField
            label={t("sortOrder")}
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) => set("sortOrder", Number(e.target.value || 0))}
          />
          {form.kind === "preventive" && (
            <>
              <InputField
                label={t("intervalDays")}
                type="number"
                min={1}
                value={form.intervalDays ?? ""}
                onChange={(e) => set("intervalDays", e.target.value ? Number(e.target.value) : null)}
              />
              <InputField
                label={t("intervalHours")}
                type="number"
                min={1}
                value={form.intervalHours ?? ""}
                onChange={(e) => set("intervalHours", e.target.value ? Number(e.target.value) : null)}
              />
            </>
          )}
        </FormGrid>
      </FormSection>

      <FormSection title={t("titleInSpanish")}>
        <InputField
          label={t("title")}
          required
          value={form.titleEs}
          onChange={(e) => set("titleEs", e.target.value)}
          placeholder="Ej: Cambio de aceite del motor"
        />
        <TextareaField
          label={t("description")}
          value={form.descriptionEs}
          onChange={(e) => set("descriptionEs", e.target.value)}
          placeholder="Descripcion tecnica en espanol"
        />
      </FormSection>

      <FormSection title={t("titleInEnglish")}>
        <InputField
          label={t("title")}
          required
          value={form.titleEn}
          onChange={(e) => set("titleEn", e.target.value)}
          placeholder="e.g. Engine oil change"
        />
        <TextareaField
          label={t("description")}
          value={form.descriptionEn}
          onChange={(e) => set("descriptionEn", e.target.value)}
          placeholder="Technical description in English"
        />
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions
        onCancel={onCancel}
        loading={loading}
        danger={Boolean(onDelete)}
        onDanger={onDelete}
        dangerLabel={t("delete")}
      />
    </form>
  );
}

// ─── Override form (per-boat customization — owner_admin) ─────────────────────

type OverrideFormValue = {
  intervalDays: number | null;
  intervalHours: number | null;
  notes: string;
  spares: Array<Omit<BoatCatalogOverrideSpare, "id" | "overrideId">>;
};

function OverrideForm({
  template,
  initial,
  loading,
  error,
  onSave,
  onReset,
  onCancel,
  hasExistingOverride,
}: {
  template: MaintenanceTemplate;
  initial: OverrideFormValue;
  loading: boolean;
  error: string | null;
  onSave: (v: OverrideFormValue) => void;
  onReset: () => void;
  onCancel: () => void;
  hasExistingOverride: boolean;
}) {
  const [form, setForm] = useState<OverrideFormValue>(initial);
  const { t, locale } = useI18n();

  function set<K extends keyof OverrideFormValue>(k: K, v: OverrideFormValue[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function updateSpare(index: number, patch: Partial<OverrideFormValue["spares"][number]>) {
    setForm((p) => ({ ...p, spares: p.spares.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  }

  function addSpare() {
    setForm((p) => ({
      ...p,
      spares: [...p.spares, { partName: "", partReference: "", manufacturer: null, quantity: 1, unit: "unit", notes: null }],
    }));
  }

  function removeSpare(index: number) {
    setForm((p) => ({ ...p, spares: p.spares.filter((_, i) => i !== index) }));
  }

  const titleLabel = locale === "es"
    ? template.titleEs || template.titleEn || template.title
    : template.titleEn || template.titleEs || template.title;
  const sysLabel = locale === "es"
    ? template.systemNameEs || template.systemNameEn
    : template.systemNameEn || template.systemNameEs;

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="eyebrow" style={{ marginBottom: "0.25rem" }}>{sysLabel}</div>
        <strong style={{ fontSize: "1rem" }}>{titleLabel}</strong>
        {(template.descriptionEs || template.descriptionEn) && (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: "var(--text-soft)" }}>
            {locale === "es" ? template.descriptionEs || template.descriptionEn : template.descriptionEn || template.descriptionEs}
          </p>
        )}
        {(template.intervalDays || template.intervalHours) && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-soft)" }}>
            {t("catalogValueFromCatalog")}:{" "}
            {[template.intervalDays ? `${template.intervalDays}d` : null, template.intervalHours ? `${template.intervalHours}h` : null].filter(Boolean).join(" / ")}
          </div>
        )}
      </div>

      <FormSection title={t("catalogOverrideIntervals")}>
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
        </FormGrid>
      </FormSection>

      <FormSection title={t("catalogOverrideMaterials")}>
        <div className="spare-reference-list">
          {form.spares.map((spare, index) => (
            <div className="spare-reference-row" key={index}>
              <InputField label="Repuesto" value={spare.partName}
                onChange={(e) => updateSpare(index, { partName: e.target.value })} />
              <InputField label="Referencia" value={spare.partReference}
                onChange={(e) => updateSpare(index, { partReference: e.target.value })} />
              <InputField label="Fabricante" value={spare.manufacturer ?? ""}
                onChange={(e) => updateSpare(index, { manufacturer: e.target.value || null })} />
              <InputField label="Cant." type="number" min={0} step="0.01" value={spare.quantity}
                onChange={(e) => updateSpare(index, { quantity: e.target.value ? Number(e.target.value) : 1 })} />
              <button className="btn-icon" type="button" onClick={() => removeSpare(index)} title="Eliminar">×</button>
            </div>
          ))}
          {form.spares.length === 0 && <p className="data-table-cell-muted">Sin materiales personalizados.</p>}
        </div>
        <button className="btn-ghost" type="button" onClick={addSpare}>+ Añadir material</button>
      </FormSection>

      <FormSection title={t("catalogOverrideNotes")}>
        <TextareaField label={t("notes")} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </FormSection>

      {error && <p className="form-error">{error}</p>}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem", flexWrap: "wrap" }}>
        {hasExistingOverride && (
          <button type="button" className="btn-danger-ghost" disabled={loading} onClick={onReset}>
            {t("catalogOverrideReset")}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onCancel}>{t("cancel")}</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando…" : t("save")}
        </button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminMaintenanceTemplatesPage() {
  const { t, locale } = useI18n();
  const { session, isSuperuser } = useAuth();
  const { systemCatalog } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();

  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [overridesMap, setOverridesMap] = useState<Map<string, BoatCatalogOverride>>(new Map());
  const [scheduleMap, setScheduleMap] = useState<Map<string, BoatScheduleEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // templateId or "form"
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<MaintenanceKind | "">("");
  const [systemFilter, setSystemFilter] = useState("");
  const [onlyTracked, setOnlyTracked] = useState(false);

  // modal state
  type ModalMode = "create-global" | "edit-global" | "override" | null;
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingTemplate, setEditingTemplate] = useState<MaintenanceTemplate | null>(null);

  const globalTemplates = useMemo(() => templates.filter((t) => t.boatId === null), [templates]);

  function applyFilters(list: MaintenanceTemplate[]) {
    const q = search.trim().toLowerCase();
    return list.filter((tpl) => {
      if (kindFilter && tpl.kind !== kindFilter) return false;
      if (systemFilter && tpl.systemId !== systemFilter) return false;
      if (onlyTracked && !scheduleMap.has(tpl.id)) return false;
      if (!q) return true;
      return [tpl.titleEs ?? "", tpl.titleEn ?? "", tpl.systemNameEs, tpl.systemNameEn, tpl.systemCode]
        .join(" ").toLowerCase().includes(q);
    });
  }

  const filteredGlobal = useMemo(() => applyFilters(globalTemplates), [globalTemplates, search, kindFilter, systemFilter, onlyTracked, scheduleMap]);

  const emptyForm: TemplateFormValue = {
    systemId: systemCatalog[0]?.id ?? "",
    titleEs: "",
    titleEn: "",
    descriptionEs: "",
    descriptionEn: "",
    kind: "corrective",
    defaultPriority: "medium",
    sortOrder: 0,
    intervalDays: null,
    intervalHours: null,
  };

  const currentTemplateForm: TemplateFormValue = editingTemplate
    ? {
        systemId: editingTemplate.systemId,
        titleEs: editingTemplate.titleEs ?? "",
        titleEn: editingTemplate.titleEn ?? editingTemplate.title ?? "",
        descriptionEs: editingTemplate.descriptionEs ?? "",
        descriptionEn: editingTemplate.descriptionEn ?? editingTemplate.description ?? "",
        kind: editingTemplate.kind,
        defaultPriority: editingTemplate.defaultPriority,
        sortOrder: editingTemplate.sortOrder,
        intervalDays: editingTemplate.intervalDays ?? null,
        intervalHours: editingTemplate.intervalHours ?? null,
      }
    : emptyForm;

  async function refresh() {
    if (!session) { setTemplates([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const tmpl = await db.fetchMaintenanceTemplates(activeBoatId);
      setTemplates(tmpl);

      if (activeBoatId) {
        const [schedule, overrides] = await Promise.all([
          db.fetchBoatSchedule(activeBoatId),
          db.fetchBoatCatalogOverridesMap(activeBoatId).catch(() => new Map<string, BoatCatalogOverride>()),
        ]);
        setScheduleMap(new Map(schedule.map((e) => [e.templateId, e])));
        setOverridesMap(overrides);
      } else {
        setScheduleMap(new Map());
        setOverridesMap(new Map());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load catalog");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [session?.user.id, activeBoatId]);

  function closeModal() { setModal(null); setEditingTemplate(null); setError(null); }

  // ── Global template CRUD (superuser) ──────────────────────────────────────

  async function handleSaveTemplate(value: TemplateFormValue) {
    if (!value.titleEs.trim() || !value.titleEn.trim()) {
      setError(t("titleRequiredBothLanguages"));
      return;
    }
    setSaving("form");
    setError(null);
    setNotice(null);
    try {
      if (editingTemplate) {
        await db.updateMaintenanceTemplate(editingTemplate.id, {
          systemId: value.systemId,
          titleEs: value.titleEs,
          titleEn: value.titleEn,
          descriptionEs: value.descriptionEs || null,
          descriptionEn: value.descriptionEn || null,
          kind: value.kind,
          defaultPriority: value.defaultPriority,
          sortOrder: value.sortOrder,
          intervalDays: value.intervalDays,
          intervalHours: value.intervalHours,
        });
        setNotice(t("templateUpdated"));
      } else {
        await db.createMaintenanceTemplate({
          boatId: null,
          createdBy: session?.user.id ?? null,
          systemId: value.systemId,
          title: value.titleEn,
          titleEs: value.titleEs,
          titleEn: value.titleEn,
          description: value.descriptionEn || null,
          descriptionEs: value.descriptionEs || null,
          descriptionEn: value.descriptionEn || null,
          kind: value.kind,
          defaultPriority: value.defaultPriority,
          sortOrder: value.sortOrder,
          intervalDays: value.intervalDays,
          intervalHours: value.intervalHours,
        });
        setNotice(t("templateCreated"));
      }
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save template");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteTemplate() {
    if (!editingTemplate) return;
    const name = locale === "en" ? (editingTemplate.titleEn ?? editingTemplate.title) : (editingTemplate.titleEs ?? editingTemplate.title);
    if (!confirm(`${t("confirmDeleteTemplate")} "${name}"?`)) return;
    setSaving("form");
    setError(null);
    setNotice(null);
    try {
      await db.deleteMaintenanceTemplate(editingTemplate.id);
      setNotice(t("templateDeleted"));
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete template");
    } finally {
      setSaving(null);
    }
  }

  // ── Per-boat override (owner_admin) ───────────────────────────────────────

  function buildOverrideInitial(tpl: MaintenanceTemplate): OverrideFormValue {
    const existing = overridesMap.get(tpl.id);
    if (existing) {
      return {
        intervalDays: existing.intervalDays,
        intervalHours: existing.intervalHours,
        notes: existing.notes ?? "",
        spares: existing.spares.map((s) => ({
          partName: s.partName, partReference: s.partReference,
          manufacturer: s.manufacturer, quantity: s.quantity, unit: s.unit, notes: s.notes,
        })),
      };
    }
    return { intervalDays: tpl.intervalDays, intervalHours: tpl.intervalHours, notes: "", spares: [] };
  }

  async function handleSaveOverride(form: OverrideFormValue) {
    if (!activeBoatId || !editingTemplate) return;
    setSaving(editingTemplate.id);
    setError(null);
    setNotice(null);
    try {
      await db.upsertBoatCatalogOverride(
        activeBoatId, editingTemplate.id,
        { intervalDays: form.intervalDays, intervalHours: form.intervalHours, notes: form.notes || null },
        form.spares
      );
      const scheduleEntry = scheduleMap.get(editingTemplate.id);
      if (scheduleEntry) {
        await db.updateScheduleEntry(scheduleEntry.id, {
          intervalDays: form.intervalDays,
          intervalHours: form.intervalHours,
        });
      }
      setNotice(t("catalogOverrideSaved"));
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando");
    } finally {
      setSaving(null);
    }
  }

  async function handleResetOverride() {
    if (!activeBoatId || !editingTemplate) return;
    const existing = overridesMap.get(editingTemplate.id);
    if (!existing) return;
    if (!confirm(t("catalogOverrideReset") + "?")) return;
    setSaving(editingTemplate.id);
    setError(null);
    setNotice(null);
    try {
      await db.deleteBoatCatalogOverride(existing.id);
      setNotice(t("catalogOverrideDeleted"));
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error restaurando");
    } finally {
      setSaving(null);
    }
  }

  // ── Tracking toggle ───────────────────────────────────────────────────────

  async function handleToggleTracking(tpl: MaintenanceTemplate, checked: boolean) {
    if (!activeBoatId) return;
    const existing = scheduleMap.get(tpl.id);
    setSaving(tpl.id);
    setError(null);
    setNotice(null);
    try {
      if (checked) {
        const override = overridesMap.get(tpl.id);
        const intervalDays = override?.intervalDays ?? tpl.intervalDays ?? null;
        const intervalHours = override?.intervalHours ?? tpl.intervalHours ?? null;
        if (!intervalDays && !intervalHours) {
          const name = locale === "es" ? tpl.titleEs || tpl.title : tpl.titleEn || tpl.title;
          setError(`"${name}" no tiene intervalo definido. Edita primero los intervalos.`);
          setSaving(null);
          return;
        }
        await db.addScheduleEntry(activeBoatId, tpl.id, { intervalDays, intervalHours });
      } else if (existing) {
        await db.deleteScheduleEntry(existing.id);
      }
      await refresh();
      setNotice(checked ? "Tarea añadida al seguimiento." : "Tarea quitada del seguimiento.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const boatName = activeBoat && "name" in activeBoat ? (activeBoat as { name: string }).name : "";

  if (!isSupabaseConfigured) {
    return (
      <section className="page">
        <div className="section-title"><span className="eyebrow">{t("maintenance")}</span><h2>{t("maintenanceCatalogTitle")}</h2></div>
        <article className="panel-card"><p>{t("supabaseMissing")}</p></article>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="page">
        <div className="section-title"><span className="eyebrow">{t("maintenance")}</span><h2>{t("maintenanceCatalogTitle")}</h2></div>
        <article className="panel-card"><p>{t("loadingCatalog")}</p></article>
      </section>
    );
  }

  const cols = activeBoatId
    ? "auto 1.2fr 2fr 0.8fr 1fr auto"
    : "1.2fr 2fr 0.8fr 0.8fr auto";

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">
            {activeBoatId ? `${t("maintenanceCatalogTitle")} · ${boatName}` : t("maintenanceCatalogTitle")}
          </span>
          <h2>{t("maintenanceCatalogTitle")}</h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {activeBoatId && (
            <span className="pill">{scheduleMap.size} en seguimiento</span>
          )}
          <button
            className="btn-primary"
            onClick={() => { setEditingTemplate(null); setModal("create-global"); }}
            type="button"
          >
            + {t("newMaintenanceTemplate")}
          </button>
        </div>
      </div>

      {error && <div className="banner warning-banner"><strong>Error</strong><span>{error}</span></div>}
      {notice && <div className="banner success-banner"><strong>OK</strong><span>{notice}</span></div>}

      <div className="filter-bar">
        <input
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchByTitleOrSystem")}
          type="search"
        />
        <select className="form-input form-select" value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}>
          <option value="">{t("allSystems")}</option>
          {systemCatalog.map((s) => (
            <option key={s.id} value={s.id}>{locale === "en" ? s.name_en : s.name_es}</option>
          ))}
        </select>
        <select className="form-input form-select" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as MaintenanceKind | "")}>
          <option value="">{t("allKinds")}</option>
          {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}
        </select>
        {activeBoatId && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={onlyTracked} onChange={(e) => setOnlyTracked(e.target.checked)} />
            Solo en seguimiento
          </label>
        )}
      </div>

      <article className="panel-card">
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: cols }}>
            {activeBoatId && <span>Seguimiento</span>}
            <span>{t("system")}</span>
            <span>{t("title")}</span>
            <span>{t("kind")}</span>
            <span>Intervalo</span>
            <span></span>
          </div>

          {filteredGlobal.length === 0 && !loading && (
            <div className="empty-state"><p>{t("noTemplatesMatch")}</p></div>
          )}

          {filteredGlobal.map((tpl) => {
            const override = overridesMap.get(tpl.id);
            const hasOverride = !!override;
            const isTracked = scheduleMap.has(tpl.id);
            const isSavingThis = saving === tpl.id;
            const intervalDays = override?.intervalDays ?? tpl.intervalDays;
            const intervalHours = override?.intervalHours ?? tpl.intervalHours;
            const hasInterval = !!(intervalDays || intervalHours);
            const titleLabel = locale === "es"
              ? tpl.titleEs || tpl.titleEn || tpl.title
              : tpl.titleEn || tpl.titleEs || tpl.title;
            const sysLabel = locale === "es"
              ? tpl.systemNameEs || tpl.systemNameEn
              : tpl.systemNameEn || tpl.systemNameEs;

            return (
              <div className="data-table-row" key={tpl.id} style={{ gridTemplateColumns: cols }}>
                {activeBoatId && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {hasInterval ? (
                      <input
                        type="checkbox"
                        checked={isTracked}
                        disabled={isSavingThis}
                        title={isTracked ? "Quitar del seguimiento" : "Añadir al seguimiento periódico"}
                        onChange={(e) => void handleToggleTracking(tpl, e.target.checked)}
                        style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                      />
                    ) : (
                      <span className="data-table-cell-muted" style={{ fontSize: "0.75rem" }}>—</span>
                    )}
                  </div>
                )}
                <span className="data-table-cell-muted">{sysLabel}</span>
                <div>
                  <strong style={{ display: "block" }}>{titleLabel}</strong>
                  {hasOverride && override?.notes && (
                    <span className="data-table-cell-muted" style={{ fontSize: "0.78rem" }}>{override.notes}</span>
                  )}
                </div>
                <span><span className="pill">{t(`kind_${tpl.kind}`)}</span></span>
                <div>
                  {hasInterval ? (
                    <span style={{ fontSize: "0.88rem" }}>
                      {[intervalDays ? `${intervalDays}d` : null, intervalHours ? `${intervalHours}h` : null].filter(Boolean).join(" / ")}
                      {hasOverride && (
                        <span className="pill" style={{ marginLeft: "0.4rem", fontSize: "0.7rem" }}>{t("catalogValueCustom")}</span>
                      )}
                    </span>
                  ) : (
                    <span className="data-table-cell-muted">—</span>
                  )}
                </div>
                <div className="row-actions">
                  {activeBoatId && (
                    <button
                      className="btn-icon" type="button"
                      onClick={() => { setEditingTemplate(tpl); setModal("override"); }}
                      title={t("catalogOverrideEdit")}
                    >
                      ✏
                    </button>
                  )}
                  <button
                    className="btn-icon" type="button"
                    onClick={() => { setEditingTemplate(tpl); setModal("edit-global"); }}
                    title={t("edit")}
                  >
                    ⚙
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {/* Global CRUD modal (superuser) */}
      {(modal === "create-global" || modal === "edit-global") && (
        <Modal
          title={modal === "create-global" ? t("newMaintenanceTemplate") : t("editMaintenanceTemplate")}
          onClose={closeModal}
          wide
        >
          <TemplateForm
            initial={currentTemplateForm}
            systems={systemCatalog}
            loading={saving === "form"}
            error={error}
            onSave={handleSaveTemplate}
            onCancel={closeModal}
            onDelete={editingTemplate ? handleDeleteTemplate : undefined}
          />
        </Modal>
      )}

      {/* Per-boat override modal (owner_admin) */}
      {modal === "override" && editingTemplate && (
        <Modal title={t("catalogOverrideEdit")} onClose={closeModal} wide>
          <OverrideForm
            template={editingTemplate}
            initial={buildOverrideInitial(editingTemplate)}
            loading={saving === editingTemplate.id}
            error={error}
            onSave={handleSaveOverride}
            onReset={handleResetOverride}
            onCancel={closeModal}
            hasExistingOverride={overridesMap.has(editingTemplate.id)}
          />
        </Modal>
      )}
    </section>
  );
}
