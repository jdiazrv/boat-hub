import { useEffect, useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as db from "../lib/db";
import type { BoatSystem, Observation } from "../lib/types";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { sysName, useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

const STATUSES = ["open", "converted", "closed", "cancelled"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

function ObservationForm({
  initial, boatName, systems, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<Observation, "id" | "boatName" | "systemName">;
  boatName: string;
  systems: BoatSystem[];
  onSave: (d: Omit<Observation, "id" | "boatName" | "systemName">) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const { t, locale } = useI18n();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection>
        <div className="form-boat-badge">{boatName}</div>
        <SelectField label={t("system")} value={form.boatSystemId ?? ""}
          onChange={(e) => set("boatSystemId", e.target.value || null)}>
          <option value="">-- Sistema --</option>
          {systems.map((s) => <option key={s.id} value={s.id}>{sysName(s, locale)}</option>)}
        </SelectField>
        <InputField label={t("title")} required value={form.title} onChange={(e) => set("title", e.target.value)} />
        <TextareaField label={t("description")} value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
        <FormGrid>
          <SelectField label={t("priority")} value={form.priority} onChange={(e) => set("priority", e.target.value as typeof form.priority)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </SelectField>
          <SelectField label={t("status")} value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </SelectField>
          <InputField label="Fecha observación" type="date" value={form.observedAt ?? ""} onChange={(e) => set("observedAt", e.target.value || null)} />
          <InputField label="Reportado por" value={form.reportedBy ?? ""} onChange={(e) => set("reportedBy", e.target.value || null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function ObservationsPage() {
  const { t, locale } = useI18n();
  const { observations, refresh, loading } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Observation | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne, toggleAll } = useSelectMode();
  const [deleting, setDeleting] = useState(false);

  const boatName = activeBoat ? activeBoat.name : "Sin barco activo";

  const filtered = observations.filter((o) => {
    if (activeBoatId && o.boatId !== activeBoatId) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    return true;
  });

  useEffect(() => {
    if (!activeBoatId) return;
    db.fetchBoatSystems(activeBoatId).then(setBoatSystems).catch(() => {});
  }, [activeBoatId]);

  const EMPTY: Omit<Observation, "id" | "boatName" | "systemName"> = {
    boatId: activeBoatId ?? "", boatSystemId: null, title: "", description: null,
    priority: "medium", status: "open", observedAt: null, reportedBy: null, notes: null,
  };

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(o: Observation) { setEditing(o); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(data: Omit<Observation, "id" | "boatName" | "systemName">) {
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
      if (editing) await db.updateObservation(editing.id, payload);
      else await db.createObservation(payload);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} observación(es)?`)) return;
    setDeleting(true);
    try { await Promise.all([...selected].map((id) => db.deleteObservation(id))); await refresh(); exitSelectMode(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar "${editing.title}"?`)) return;
    setSaving(true);
    try { await db.deleteObservation(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("observations")}</span>
          <h2>{t("observationsTitle")}</h2>
        </div>
        <div className="empty-state"><p>{t("noBoatSelected")}</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("observations")} · {boatName}</span>
          <h2>{t("observationsTitle")}</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={exitSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ {t("newObservation")}</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      <div className="filter-bar">
        <select className="form-input form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
        </select>
      </div>

      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 2fr 1fr 0.9fr 0.9fr auto" }}>
            <SelectAllCheckbox selectMode={selectMode} ids={filtered.map((o) => o.id)} selected={selected} onToggleAll={toggleAll} />
            <span>{t("colObservation")}</span><span>{t("system")}</span><span>{t("priority")}</span><span>{t("status")}</span><span></span>
          </div>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>{t("noObservations")}</p></div>}
          {filtered.map((o) => (
            <div className="data-table-row" key={o.id} style={{ gridTemplateColumns: "1.5rem 2fr 1fr 0.9fr 0.9fr auto" }}>
              <SelectRowCheckbox selectMode={selectMode} id={o.id} selected={selected} onToggle={toggleOne} disabled={deleting} />
              <div>
                <strong style={{ display: "block" }}>{o.title}</strong>
                {o.observedAt && <span className="data-table-cell-muted">{o.observedAt}</span>}
              </div>
              <span className="data-table-cell-muted">{o.systemName}</span>
              <span><span className={`pill ${o.priority}`}>{t(o.priority)}</span></span>
              <span><span className={`pill ${o.status}`}>{t(o.status)}</span></span>
              <div className="row-actions">
                {isSupabaseConfigured && (
                  <button className="btn-icon" onClick={() => openEdit(o)} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={exitSelectMode} label="observación" />

      {modal && (
        <Modal title={modal === "create" ? t("newObservation") : t("editObservation")} onClose={closeModal} wide>
          <ObservationForm
            initial={editing
              ? { boatId: editing.boatId, boatSystemId: editing.boatSystemId, title: editing.title,
                  description: editing.description, priority: editing.priority, status: editing.status,
                  observedAt: editing.observedAt, reportedBy: editing.reportedBy, notes: editing.notes }
              : EMPTY}
            boatName={boatName}
            systems={boatSystems}
            onSave={handleSave} onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal} loading={saving} error={error}
          />
        </Modal>
      )}
    </section>
  );
}
