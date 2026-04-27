import { useState } from "react";
import * as db from "../lib/db";
import type { Boat } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAppData } from "../providers/AppDataProvider";

const EMPTY_BOAT: Omit<Boat, "id" | "ownerIds" | "ownerNames"> = {
  name: "",
  identifier: null,
  registrationNumber: null,
  brandModel: null,
  buildYear: null,
  shipyard: null,
  propulsion: null,
  boatType: null,
  engineNotes: null,
  notes: null,
};

function BoatForm({
  initial,
  ownerIds: initialOwnerIds,
  owners,
  onSave,
  onDelete,
  onCancel,
  loading,
  error,
}: {
  initial: Omit<Boat, "id" | "ownerIds" | "ownerNames">;
  ownerIds: string[];
  owners: { id: string; name: string }[];
  onSave: (data: Omit<Boat, "id" | "ownerIds" | "ownerNames">, ownerIds: string[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const [selectedOwners, setSelectedOwners] = useState<string[]>(initialOwnerIds);
  const { t } = useI18n();

  function set(field: keyof typeof form, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  }

  function toggleOwner(id: string) {
    setSelectedOwners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form, selectedOwners);
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <FormSection title="Datos del barco">
        <FormGrid>
          <InputField label={t("name")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <InputField label="Identificador" value={form.identifier ?? ""} onChange={(e) => set("identifier", e.target.value)} />
          <InputField label="Matrícula / Registro" value={form.registrationNumber ?? ""} onChange={(e) => set("registrationNumber", e.target.value)} />
          <InputField label="Marca / Modelo" value={form.brandModel ?? ""} onChange={(e) => set("brandModel", e.target.value)} />
          <InputField label="Año de construcción" type="number" value={form.buildYear ?? ""} onChange={(e) => set("buildYear", e.target.value ? Number(e.target.value) : null)} />
          <InputField label="Astillero" value={form.shipyard ?? ""} onChange={(e) => set("shipyard", e.target.value)} />
          <InputField label="Propulsión / Motor" value={form.propulsion ?? ""} onChange={(e) => set("propulsion", e.target.value)} />
          <SelectField label="Tipo de barco" value={form.boatType ?? ""} onChange={(e) => set("boatType", e.target.value)}>
            <option value="">-- Selecciona --</option>
            <option value="Sailboat">Velero</option>
            <option value="Motor yacht">Motor yacht</option>
            <option value="Catamaran">Catamarán</option>
            <option value="RIB">RIB</option>
            <option value="Motorboat">Lancha</option>
            <option value="Other">Otro</option>
          </SelectField>
        </FormGrid>
        <TextareaField label="Notas motor" value={form.engineNotes ?? ""} onChange={(e) => set("engineNotes", e.target.value)} />
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </FormSection>

      {owners.length > 0 && (
        <FormSection title="Armadores">
          <div className="form-checkbox-grid">
            {owners.map((o) => (
              <label key={o.id} className="form-checkbox-row">
                <input
                  type="checkbox"
                  checked={selectedOwners.includes(o.id)}
                  onChange={() => toggleOwner(o.id)}
                />
                <span>{o.name}</span>
              </label>
            ))}
          </div>
        </FormSection>
      )}

      {error && <p className="form-error">{error}</p>}

      <FormActions
        onCancel={onCancel}
        loading={loading}
        danger={!!onDelete}
        onDanger={onDelete}
        dangerLabel={t("delete")}
      />
    </form>
  );
}

export function BoatsPage() {
  const { t } = useI18n();
  const { boats, allBoats, owners, refresh, loading } = useAppData();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Boat | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayBoats = isSupabaseConfigured ? allBoats : boats;

  function openCreate() {
    setEditing(null);
    setError(null);
    setModal("create");
  }

  function openEdit(boat: Boat) {
    setEditing(boat);
    setError(null);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  async function handleSave(
    data: Omit<Boat, "id" | "ownerIds" | "ownerNames">,
    ownerIds: string[]
  ) {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await db.updateBoat(editing.id, data, ownerIds);
      } else {
        await db.createBoat(data, ownerIds);
      }
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`¿Eliminar el barco "${editing.name}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      await db.deleteBoat(editing.id);
      await refresh();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("boats")}</span>
          <h2>Flota — contexto operativo por barco</h2>
        </div>
        {isSupabaseConfigured && (
          <button className="btn-primary" onClick={openCreate} type="button">
            + {t("newBoat")}
          </button>
        )}
      </div>

      {loading && <p className="data-table-cell-muted">Cargando…</p>}

      <div className="cards-grid">
        {displayBoats.map((boat) => {
          const full = allBoats.find((b) => b.id === boat.id);
          return (
            <article className="panel-card" key={boat.id}>
              <div className="panel-head">
                <h3>{"name" in boat ? (boat as Boat).name : (boat as typeof boats[0]).name}</h3>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span className="pill">{("boatType" in boat ? (boat as Boat).boatType : (boat as typeof boats[0]).type) ?? "Boat"}</span>
                  {isSupabaseConfigured && full && (
                    <button className="btn-icon" onClick={() => openEdit(full)} type="button" title="Editar">✏</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-soft)", margin: "0.3rem 0 0" }}>
                Matrícula: {("registrationNumber" in boat ? (boat as Boat).registrationNumber : (boat as typeof boats[0]).registrationNumber) ?? "-"}
              </p>
              <div className="detail-grid">
                <div>
                  <span>{t("owners")}</span>
                  <strong>
                    {("ownerNames" in boat
                      ? (boat as Boat).ownerNames.join(", ")
                      : (boat as typeof boats[0]).owners.join(", ")) || "-"}
                  </strong>
                </div>
                <div>
                  <span>{t("nextHaulOut")}</span>
                  <strong>{("nextHaulOut" in boat ? (boat as typeof boats[0]).nextHaulOut : null) ?? "-"}</strong>
                </div>
                <div>
                  <span>{t("openTasks")}</span>
                  <strong>{("openTasks" in boat ? (boat as typeof boats[0]).openTasks : "-")}</strong>
                </div>
                {isSupabaseConfigured && "brandModel" in boat && (boat as Boat).brandModel && (
                  <div>
                    <span>Marca / Modelo</span>
                    <strong>{(boat as Boat).brandModel}</strong>
                  </div>
                )}
                {isSupabaseConfigured && "buildYear" in boat && (boat as Boat).buildYear && (
                  <div>
                    <span>Año</span>
                    <strong>{(boat as Boat).buildYear}</strong>
                  </div>
                )}
                {isSupabaseConfigured && "propulsion" in boat && (boat as Boat).propulsion && (
                  <div>
                    <span>Propulsión</span>
                    <strong>{(boat as Boat).propulsion}</strong>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {displayBoats.length === 0 && !loading && (
          <div className="empty-state">
            <p>No hay barcos registrados.</p>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "create" ? t("newBoat") : t("editBoat")}
          onClose={closeModal}
          wide
        >
          <BoatForm
            initial={
              editing
                ? {
                    name: editing.name,
                    identifier: editing.identifier,
                    registrationNumber: editing.registrationNumber,
                    brandModel: editing.brandModel,
                    buildYear: editing.buildYear,
                    shipyard: editing.shipyard,
                    propulsion: editing.propulsion,
                    boatType: editing.boatType,
                    engineNotes: editing.engineNotes,
                    notes: editing.notes,
                  }
                : EMPTY_BOAT
            }
            ownerIds={editing?.ownerIds ?? []}
            owners={owners}
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
