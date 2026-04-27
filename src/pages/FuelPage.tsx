import { useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import * as db from "../lib/db";
import type { FuelLog } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

const FUEL_TYPES = ["Diesel", "Gasoline", "LPG", "Electric", "Other"];

function FuelLogForm({
  initial, boatName, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<FuelLog, "id" | "boatName">;
  boatName: string;
  onSave: (d: Omit<FuelLog, "id" | "boatName">) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const { t } = useI18n();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection>
        <div className="form-boat-badge">{boatName}</div>
        <FormGrid>
          <InputField label="Fecha" type="date" required value={form.fuelledAt} onChange={(e) => set("fuelledAt", e.target.value)} />
          <SelectField label={t("fuelType")} value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
            {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
          </SelectField>
          <InputField label="Cantidad" type="number" required value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} />
          <SelectField label={t("unit")} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
            <option value="L">Litros</option>
            <option value="Gal">Galones</option>
          </SelectField>
          <InputField label={t("pricePerUnit")} type="number" value={form.pricePerUnit ?? ""} onChange={(e) => set("pricePerUnit", e.target.value ? Number(e.target.value) : null)} />
          <InputField label={t("totalCost")} type="number" value={form.totalCost ?? ""} onChange={(e) => set("totalCost", e.target.value ? Number(e.target.value) : null)} />
          <InputField label={t("supplier")} value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value || null)} />
          <InputField label={t("engineHours")} type="number" value={form.engineHoursAtFuelling ?? ""} onChange={(e) => set("engineHoursAtFuelling", e.target.value ? Number(e.target.value) : null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function FuelPage() {
  const { t } = useI18n();
  const { fuelLogs, refresh, loading } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<FuelLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne, toggleAll } = useSelectMode();
  const [deleting, setDeleting] = useState(false);

  const boatName = activeBoat ? activeBoat.name : "Sin barco activo";

  const filtered = fuelLogs.filter((l) => !activeBoatId || l.boatId === activeBoatId);
  const totalLiters = filtered.reduce((sum, l) => sum + l.quantity, 0);
  const totalCost = filtered.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);

  const EMPTY: Omit<FuelLog, "id" | "boatName"> = {
    boatId: activeBoatId ?? "", fuelledAt: new Date().toISOString().slice(0, 10),
    fuelType: "Diesel", quantity: 0, unit: "L",
    pricePerUnit: null, totalCost: null, supplier: null,
    engineHoursAtFuelling: null, notes: null,
  };

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(l: FuelLog) { setEditing(l); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(data: Omit<FuelLog, "id" | "boatName">) {
    const payload = { ...data, boatId: activeBoatId ?? data.boatId };
    if (!payload.boatId) { setError("No hay barco activo"); return; }
    setSaving(true); setError(null);
    try {
      if (editing) await db.updateFuelLog(editing.id, payload);
      else await db.createFuelLog(payload);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} repostaje(s)?`)) return;
    setDeleting(true);
    try { await Promise.all([...selected].map((id) => db.deleteFuelLog(id))); await refresh(); exitSelectMode(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm("¿Eliminar este repostaje?")) return;
    setSaving(true);
    try { await db.deleteFuelLog(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("fuel")}</span>
          <h2>Registro de combustible</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco en la barra lateral para ver su registro de combustible.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("fuel")} · {boatName}</span>
          <h2>Registro de combustible</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={exitSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ {t("newFuelLog")}</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      {!isSupabaseConfigured && (
        <div className="banner warning-banner"><p>Modo demo — conecta Supabase para registrar combustible.</p></div>
      )}

      {filtered.length > 0 && (
        <div className="cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div className="metric-card">
            <strong>{totalLiters.toFixed(0)} L</strong>
            <span className="data-table-cell-muted">Total combustible</span>
          </div>
          <div className="metric-card">
            <strong>{totalCost.toFixed(0)} €</strong>
            <span className="data-table-cell-muted">Coste total</span>
          </div>
          <div className="metric-card">
            <strong>{filtered.length}</strong>
            <span className="data-table-cell-muted">Repostajes</span>
          </div>
        </div>
      )}

      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 1fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr auto" }}>
            <SelectAllCheckbox selectMode={selectMode} ids={filtered.map((l) => l.id)} selected={selected} onToggleAll={toggleAll} />
            <span>Fecha</span><span>Tipo</span><span>Cantidad</span><span>€/u</span><span>Proveedor</span><span>Horas</span><span></span>
          </div>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No hay repostajes registrados.</p></div>}
          {filtered.map((l) => (
            <div className="data-table-row" key={l.id} style={{ gridTemplateColumns: "1.5rem 1fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr auto" }}>
              <SelectRowCheckbox selectMode={selectMode} id={l.id} selected={selected} onToggle={toggleOne} disabled={deleting} />
              <span className="data-table-cell-muted">{l.fuelledAt}</span>
              <span><span className="pill">{l.fuelType}</span></span>
              <strong>{l.quantity} {l.unit}</strong>
              <span className="data-table-cell-muted">{l.pricePerUnit != null ? `${l.pricePerUnit}` : "-"}</span>
              <span className="data-table-cell-muted">{l.supplier ?? "-"}</span>
              <span className="data-table-cell-muted">{l.engineHoursAtFuelling != null ? `${l.engineHoursAtFuelling} h` : "-"}</span>
              <div className="row-actions">
                {isSupabaseConfigured && (
                  <button className="btn-icon" onClick={() => openEdit(l)} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={exitSelectMode} label="repostaje" />

      {modal && (
        <Modal title={modal === "create" ? t("newFuelLog") : t("editFuelLog")} onClose={closeModal} wide>
          <FuelLogForm
            initial={editing
              ? { boatId: editing.boatId, fuelledAt: editing.fuelledAt, fuelType: editing.fuelType,
                  quantity: editing.quantity, unit: editing.unit, pricePerUnit: editing.pricePerUnit,
                  totalCost: editing.totalCost, supplier: editing.supplier,
                  engineHoursAtFuelling: editing.engineHoursAtFuelling, notes: editing.notes }
              : EMPTY}
            boatName={boatName}
            onSave={handleSave} onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal} loading={saving} error={error}
          />
        </Modal>
      )}
    </section>
  );
}
