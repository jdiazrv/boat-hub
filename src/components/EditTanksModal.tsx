import { useState } from "react";
import type { BoatTank, TankType } from "../lib/types";
import { Modal } from "./Modal";
import { InputField, SelectField, TextareaField } from "./FormField";
import { useI18n } from "../lib/i18n";

export function EditTanksModal({ tanks: initial, onSave, onClose }: {
  tanks: BoatTank[];
  onSave: (t: BoatTank[]) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useI18n();

  const TANK_TYPES: { value: TankType; label: string }[] = [
    { value: "diesel",      label: t("tankTypeDiesel") },
    { value: "fresh_water", label: t("tankTypeFreshWater") },
    { value: "grey_water",  label: t("tankTypeGreyWater") },
    { value: "black_water", label: t("tankTypeBlackWater") },
    { value: "lpg",         label: t("tankTypeLPG") },
    { value: "other",       label: t("tankTypeOther") },
  ];

  const [tanks, setTanks] = useState<BoatTank[]>(initial.map((tk) => ({ ...tk })));
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
    setTanks((prev) => prev.map((tk, i) => i === idx ? { ...tk, [key]: val } : tk));
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
      setError(e instanceof Error ? e.message : t("saving"));
      setSaving(false);
    }
  }

  return (
    <Modal title={t("modalEditTanks")} onClose={onClose} wide>
      <div className="form-stack">
        {tanks.map((tank, idx) => (
          <div key={tank.id} className="boat-detail-section" style={{ position: "relative" }}>
            <button type="button" className="btn-icon" style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => remove(idx)} title={t("delete")}>✕</button>
            <div className="form-grid">
              <InputField label={t("fieldName")} value={tank.label} onChange={(e) => update(idx, "label", e.target.value)} />
              <SelectField label={t("kind")} value={tank.type} onChange={(e) => update(idx, "type", e.target.value as TankType)}>
                {TANK_TYPES.map((tk) => <option key={tk.value} value={tk.value}>{tk.label}</option>)}
              </SelectField>
              <InputField label={t("tankCapacity")} type="number" value={tank.capacity} onChange={(e) => update(idx, "capacity", parseFloat(e.target.value) || 0)} />
              <SelectField label={t("tankUnit")} value={tank.unit} onChange={(e) => update(idx, "unit", e.target.value as "L" | "gal")}>
                <option value="L">{t("tankUnitLiters")}</option>
                <option value="gal">{t("tankUnitGallons")}</option>
              </SelectField>
              <InputField label={t("fieldMaterial")} value={tank.material ?? ""} onChange={(e) => update(idx, "material", e.target.value || null)} />
            </div>
            <TextareaField label={t("notes")} value={tank.notes ?? ""} onChange={(e) => update(idx, "notes", e.target.value || null)} />
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={add}>{t("addTank")}</button>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button className="btn-ghost" type="button" onClick={onClose}>{t("cancel")}</button>
          <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
