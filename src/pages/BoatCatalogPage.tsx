import { useEffect, useMemo, useState } from "react";
import * as db from "../lib/db";
import type { BoatCatalogOverride, BoatCatalogOverrideSpare, BoatScheduleEntry, MaintenanceTemplate } from "../lib/types";
import { FormGrid, FormSection, InputField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

// ─── Edit form (intervalos, materiales, notas) ────────────────────────────────

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

export function BoatCatalogPage() {
  const { t, locale } = useI18n();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const { systemCatalog } = useAppData();
  const boatName = activeBoat?.name ?? "";

  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [overridesMap, setOverridesMap] = useState<Map<string, BoatCatalogOverride>>(new Map());
  // templateId → scheduleEntry id (si está en seguimiento)
  const [scheduleMap, setScheduleMap] = useState<Map<string, BoatScheduleEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // templateId que está guardando
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [onlyTracked, setOnlyTracked] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTemplate | null>(null);

  async function refresh() {
    if (!activeBoatId) return;
    setLoading(true);
    setError(null);
    try {
      const [tmpl, overrides, schedule] = await Promise.all([
        db.fetchMaintenanceTemplates(),
        db.fetchBoatCatalogOverridesMap(activeBoatId),
        db.fetchBoatSchedule(activeBoatId),
      ]);
      setTemplates(tmpl);
      setOverridesMap(overrides);
      setScheduleMap(new Map(schedule.map((e) => [e.templateId, e])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [activeBoatId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (systemFilter && tpl.systemId !== systemFilter) return false;
      if (kindFilter && tpl.kind !== kindFilter) return false;
      if (onlyTracked && !scheduleMap.has(tpl.id)) return false;
      if (!q) return true;
      return [tpl.titleEs ?? "", tpl.titleEn ?? "", tpl.systemNameEs, tpl.systemNameEn].join(" ").toLowerCase().includes(q);
    });
  }, [templates, search, systemFilter, kindFilter, onlyTracked, scheduleMap]);

  function closeModal() { setEditing(null); setError(null); }

  function buildInitialForm(tpl: MaintenanceTemplate): OverrideFormValue {
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

  // Activa o desactiva el seguimiento de una tarea periódica
  async function handleToggleTracking(tpl: MaintenanceTemplate, checked: boolean) {
    if (!activeBoatId) return;
    const existing = scheduleMap.get(tpl.id);
    setSaving(tpl.id);
    setError(null);
    setNotice(null);
    try {
      if (checked) {
        // Tomar intervalos del override si existe, si no del catálogo
        const override = overridesMap.get(tpl.id);
        const intervalDays = override?.intervalDays ?? tpl.intervalDays ?? null;
        const intervalHours = override?.intervalHours ?? tpl.intervalHours ?? null;
        if (!intervalDays && !intervalHours) {
          setError(`"${locale === "es" ? tpl.titleEs || tpl.title : tpl.titleEn || tpl.title}" no tiene intervalo definido. Edita primero los intervalos.`);
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

  async function handleSaveOverride(form: OverrideFormValue) {
    if (!activeBoatId || !editing) return;
    setSaving(editing.id); setError(null); setNotice(null);
    try {
      await db.upsertBoatCatalogOverride(
        activeBoatId, editing.id,
        { intervalDays: form.intervalDays, intervalHours: form.intervalHours, notes: form.notes || null },
        form.spares
      );
      // Si la tarea está en seguimiento, actualizar también su intervalo en el plan
      const scheduleEntry = scheduleMap.get(editing.id);
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
    if (!activeBoatId || !editing) return;
    const existing = overridesMap.get(editing.id);
    if (!existing) return;
    if (!confirm(t("catalogOverrideReset") + "?")) return;
    setSaving(editing.id); setError(null); setNotice(null);
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

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("boatCatalog")}</span>
          <h2>{t("catalogOverridesTitle")}</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco para configurar su catálogo.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("boatCatalog")} · {boatName}</span>
          <h2>{t("catalogOverridesTitle")}</h2>
        </div>
        <span className="pill">{scheduleMap.size} en seguimiento</span>
      </div>

      <p className="data-table-cell-muted" style={{ marginBottom: "1rem" }}>
        {t("catalogOverridesSubtitle")}
      </p>

      {error && <div className="banner warning-banner"><strong>Error</strong><span>{error}</span></div>}
      {notice && <div className="banner success-banner"><strong>OK</strong><span>{notice}</span></div>}

      <div className="filter-bar">
        <input
          className="form-input" type="search" placeholder="Buscar tarea…"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-input form-select" value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}>
          <option value="">{t("allSystems")}</option>
          {systemCatalog.map((s) => (
            <option key={s.id} value={s.id}>{locale === "en" ? s.name_en : s.name_es}</option>
          ))}
        </select>
        <select className="form-input form-select" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
          <option value="">{t("allKinds")}</option>
          <option value="preventive">{t("kind_preventive")}</option>
          <option value="corrective">{t("kind_corrective")}</option>
          <option value="inspection">{t("kind_inspection")}</option>
          <option value="review">{t("kind_review")}</option>
          <option value="upgrade">{t("kind_upgrade")}</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={onlyTracked} onChange={(e) => setOnlyTracked(e.target.checked)} />
          Solo en seguimiento
        </label>
      </div>

      {loading && <p className="data-table-cell-muted">Cargando…</p>}

      <article className="panel-card">
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "auto 1.2fr 2fr 0.8fr 1fr auto" }}>
            <span>Seguimiento</span>
            <span>{t("system")}</span>
            <span>{t("title")}</span>
            <span>{t("kind")}</span>
            <span>Intervalo</span>
            <span></span>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="empty-state"><p>{t("noTemplatesMatch")}</p></div>
          )}
          {filtered.map((tpl) => {
            const hasOverride = overridesMap.has(tpl.id);
            const override = overridesMap.get(tpl.id);
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
              <div className="data-table-row" key={tpl.id} style={{ gridTemplateColumns: "auto 1.2fr 2fr 0.8fr 1fr auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <input
                    type="checkbox"
                    checked={isTracked}
                    disabled={isSavingThis || !isSupabaseConfigured || (!hasInterval && !isTracked)}
                    title={!hasInterval && !isTracked ? "Define primero el intervalo" : undefined}
                    onChange={(e) => void handleToggleTracking(tpl, e.target.checked)}
                    style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                  />
                </div>
                <span className="data-table-cell-muted">{sysLabel}</span>
                <div>
                  <strong style={{ display: "block" }}>{titleLabel}</strong>
                  {hasOverride && override?.notes && (
                    <span className="data-table-cell-muted" style={{ fontSize: "0.78rem" }}>{override.notes}</span>
                  )}
                </div>
                <span><span className={`pill kind-${tpl.kind}`}>{t(`kind_${tpl.kind}`)}</span></span>
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
                  {isSupabaseConfigured && (
                    <button
                      className="btn-icon" type="button"
                      onClick={() => setEditing(tpl)}
                      title={t("catalogOverrideEdit")}
                    >
                      ✏
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {editing && (
        <Modal title={t("catalogOverrideEdit")} onClose={closeModal} wide>
          <OverrideForm
            template={editing}
            initial={buildInitialForm(editing)}
            loading={saving === editing.id}
            error={error}
            onSave={handleSaveOverride}
            onReset={handleResetOverride}
            onCancel={closeModal}
            hasExistingOverride={overridesMap.has(editing.id)}
          />
        </Modal>
      )}
    </section>
  );
}
