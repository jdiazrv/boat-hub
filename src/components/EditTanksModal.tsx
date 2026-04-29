import { useState } from "react";
import type { BoatTank, TankType } from "../lib/types";
import { Modal } from "./Modal";
import { InputField, SelectField, TextareaField } from "./FormField";

const TANK_TYPES: { value: TankType; label: string }[] = [
  { value: "diesel",      label: "Gasoil" },
  { value: "fresh_water", label: "Agua dulce" },
  { value: "grey_water",  label: "Aguas grises" },
  { value: "black_water", label: "Aguas negras" },
  { value: "lpg",         label: "GLP / Gas" },
  { value: "other",       label: "Otro" },
];

export function EditTanksModal({ tanks: initial, onSave, onClose }: {
  tanks: BoatTank[];
  onSave: (t: BoatTank[]) => Promise<void>;
  onClose: () => void;
}) {
  const [tanks, setTanks] = useState<BoatTank[]>(initial.map((t) => ({ ...t })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() {
    setTanks((prev) => [...prev, {
      id: `tank-${Date.now()}`,
      type: "fresh_water",
      label: "",
      capacity: 0,
      unit: "L",
    }]);
  }

  function update<K extends keyof BoatTank>(idx: number, key: K, val: BoatTank[K]) {
    setTanks((prev) => prev.map((t, i) => i === idx ? { ...t, [key]: val } : t));
  }

  function remove(idx: number) {
    setTanks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(tanks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar tanques" onClose={onClose} wide>
      <div className="form-stack">
        {tanks.map((tank, idx) => (
          <div key={tank.id} className="boat-detail-section" style={{ position: "relative" }}>
            <button type="button" className="btn-icon" style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => remove(idx)} title="Eliminar">✕</button>
            <div className="form-grid">
              <InputField label="Nombre" value={tank.label} onChange={(e) => update(idx, "label", e.target.value)} />
              <SelectField label="Tipo" value={tank.type} onChange={(e) => update(idx, "type", e.target.value as TankType)}>
                {TANK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </SelectField>
              <InputField label="Capacidad" type="number" value={tank.capacity} onChange={(e) => update(idx, "capacity", parseFloat(e.target.value) || 0)} />
              <SelectField label="Unidad" value={tank.unit} onChange={(e) => update(idx, "unit", e.target.value as "L" | "gal")}>
                <option value="L">Litros (L)</option>
                <option value="gal">Galones (gal)</option>
              </SelectField>
              <InputField label="Material" value={tank.material ?? ""} onChange={(e) => update(idx, "material", e.target.value || null)} />
            </div>
            <TextareaField label="Notas" value={tank.notes ?? ""} onChange={(e) => update(idx, "notes", e.target.value || null)} />
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={add}>+ Añadir tanque</button>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button className="btn-ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
