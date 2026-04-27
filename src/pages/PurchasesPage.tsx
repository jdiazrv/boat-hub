import { useEffect, useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as db from "../lib/db";
import type { BoatSystem, FuturePurchase } from "../lib/types";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { sysName, useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

const STATUSES = ["pending", "planned", "ordered", "received", "cancelled"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

function PurchaseForm({
  initial, boatName, systems, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<FuturePurchase, "id" | "boatName" | "systemName">;
  boatName: string;
  systems: BoatSystem[];
  onSave: (d: Omit<FuturePurchase, "id" | "boatName" | "systemName">) => void;
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
        <InputField label="Artículo" required value={form.articleName} onChange={(e) => set("articleName", e.target.value)} />
        <TextareaField label={t("description")} value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
        <FormGrid>
          <InputField label={t("quantity")} type="number" value={form.quantity ?? ""} onChange={(e) => set("quantity", e.target.value ? Number(e.target.value) : null)} />
          <InputField label={t("unit")} value={form.unit ?? ""} onChange={(e) => set("unit", e.target.value || null)} />
          <SelectField label={t("priority")} value={form.priority} onChange={(e) => set("priority", e.target.value as typeof form.priority)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </SelectField>
          <SelectField label={t("status")} value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </SelectField>
          <InputField label={t("supplier")} value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value || null)} />
          <InputField label="Coste estimado" type="number" value={form.estimatedCost ?? ""} onChange={(e) => set("estimatedCost", e.target.value ? Number(e.target.value) : null)} />
          <InputField label="Fecha objetivo" type="date" value={form.targetDate ?? ""} onChange={(e) => set("targetDate", e.target.value || null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function PurchasesPage() {
  const { t, locale } = useI18n();
  const { futurePurchases, refresh, loading } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<FuturePurchase | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne, toggleAll } = useSelectMode();
  const [deleting, setDeleting] = useState(false);

  const boatName = activeBoat ? activeBoat.name : "Sin barco activo";

  const filtered = futurePurchases.filter((p) => {
    if (activeBoatId && p.boatId !== activeBoatId) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  useEffect(() => {
    if (!activeBoatId) return;
    db.fetchBoatSystems(activeBoatId).then(setBoatSystems).catch(() => {});
  }, [activeBoatId]);

  const EMPTY: Omit<FuturePurchase, "id" | "boatName" | "systemName"> = {
    boatId: activeBoatId ?? "", boatSystemId: null, observationId: null,
    articleName: "", description: null, quantity: 1, unit: "unit",
    priority: "medium", status: "pending", supplier: null,
    estimatedCost: null, targetDate: null, notes: null,
  };

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(p: FuturePurchase) { setEditing(p); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(data: Omit<FuturePurchase, "id" | "boatName" | "systemName">) {
    const payload = { ...data, boatId: activeBoatId ?? data.boatId };
    if (!payload.boatId) { setError("No hay barco activo"); return; }
    setSaving(true); setError(null);
    try {
      if (editing) await db.updateFuturePurchase(editing.id, payload);
      else await db.createFuturePurchase(payload);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} compra(s)?`)) return;
    setDeleting(true);
    try { await Promise.all([...selected].map((id) => db.deleteFuturePurchase(id))); await refresh(); exitSelectMode(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar "${editing.articleName}"?`)) return;
    setSaving(true);
    try { await db.deleteFuturePurchase(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("purchases")}</span>
          <h2>Lista de compras pendientes</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco en la barra lateral para ver sus compras pendientes.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("purchases")} · {boatName}</span>
          <h2>Lista de compras pendientes</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={exitSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ {t("newPurchase")}</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      <div className="filter-bar">
        <select className="form-input form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
        </select>
      </div>

      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 2fr 1fr 0.7fr 0.7fr 0.8fr 0.8fr auto" }}>
            <SelectAllCheckbox selectMode={selectMode} ids={filtered.map((p) => p.id)} selected={selected} onToggleAll={toggleAll} />
            <span>Artículo</span><span>Sistema</span><span>Cant.</span><span>Prioridad</span><span>Estado</span><span>Coste est.</span><span></span>
          </div>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No hay compras pendientes.</p></div>}
          {filtered.map((p) => (
            <div className="data-table-row" key={p.id} style={{ gridTemplateColumns: "1.5rem 2fr 1fr 0.7fr 0.7fr 0.8fr 0.8fr auto" }}>
              <SelectRowCheckbox selectMode={selectMode} id={p.id} selected={selected} onToggle={toggleOne} disabled={deleting} />
              <div>
                <strong style={{ display: "block" }}>{p.articleName}</strong>
                {p.targetDate && <span className="data-table-cell-muted">{p.targetDate}</span>}
              </div>
              <span className="data-table-cell-muted">{p.systemName}</span>
              <span className="data-table-cell-muted">{p.quantity != null ? `${p.quantity} ${p.unit ?? ""}` : "-"}</span>
              <span><span className={`pill ${p.priority}`}>{t(p.priority)}</span></span>
              <span><span className={`pill ${p.status}`}>{t(p.status)}</span></span>
              <span className="data-table-cell-muted">{p.estimatedCost != null ? `${p.estimatedCost} €` : "-"}</span>
              <div className="row-actions">
                {isSupabaseConfigured && (
                  <button className="btn-icon" onClick={() => openEdit(p)} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={exitSelectMode} label="compra" />

      {modal && (
        <Modal title={modal === "create" ? t("newPurchase") : t("editPurchase")} onClose={closeModal} wide>
          <PurchaseForm
            initial={editing
              ? { boatId: editing.boatId, boatSystemId: editing.boatSystemId, observationId: editing.observationId,
                  articleName: editing.articleName, description: editing.description, quantity: editing.quantity,
                  unit: editing.unit, priority: editing.priority, status: editing.status, supplier: editing.supplier,
                  estimatedCost: editing.estimatedCost, targetDate: editing.targetDate, notes: editing.notes }
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
