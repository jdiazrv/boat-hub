import { useState } from "react";
import type { Boat } from "../lib/types";
import { COUNTRIES, flagEmoji } from "../lib/flags";
import { InputField, SelectField, TextareaField } from "./FormField";
import { Modal } from "./Modal";
import { useI18n } from "../lib/i18n";

type BoatGeneralFields = Pick<
  Boat,
  | "name"
  | "identifier"
  | "registrationNumber"
  | "brandModel"
  | "buildYear"
  | "shipyard"
  | "propulsion"
  | "boatType"
  | "engineNotes"
  | "notes"
  | "flag"
>;

export function EditBoatGeneralModal({ boat, onSave, onClose }: {
  boat: Boat;
  onSave: (data: BoatGeneralFields) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<BoatGeneralFields>({
    name: boat.name,
    identifier: boat.identifier,
    registrationNumber: boat.registrationNumber,
    brandModel: boat.brandModel,
    buildYear: boat.buildYear,
    shipyard: boat.shipyard,
    propulsion: boat.propulsion,
    boatType: boat.boatType,
    engineNotes: boat.engineNotes,
    notes: boat.notes,
    flag: boat.flag,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof BoatGeneralFields>(field: K, value: BoatGeneralFields[K]) {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saving"));
      setSaving(false);
    }
  }

  return (
    <Modal title={t("modalEditGeneralData")} onClose={onClose} wide>
      <div className="form-stack">
        <div className="form-grid">
          <InputField label={t("fieldName")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
          <InputField label={t("fieldIdentifier")} value={form.identifier ?? ""} onChange={(e) => set("identifier", e.target.value)} />
          <InputField label={t("fieldRegistrationNumber")} value={form.registrationNumber ?? ""} onChange={(e) => set("registrationNumber", e.target.value)} />
          <InputField label={t("fieldBrandModel")} value={form.brandModel ?? ""} onChange={(e) => set("brandModel", e.target.value)} />
          <InputField
            label={t("fieldBuildYear")}
            type="number"
            value={form.buildYear ?? ""}
            onChange={(e) => set("buildYear", e.target.value ? Number(e.target.value) : null)}
          />
          <InputField label={t("fieldShipyard")} value={form.shipyard ?? ""} onChange={(e) => set("shipyard", e.target.value)} />
          <InputField label={t("fieldPropulsionMotor")} value={form.propulsion ?? ""} onChange={(e) => set("propulsion", e.target.value)} />
          <SelectField label={t("fieldBoatTypeSelect")} value={form.boatType ?? ""} onChange={(e) => set("boatType", e.target.value)}>
            <option value="">--</option>
            <option value="Sailboat">{t("boatTypeSailboat")}</option>
            <option value="Motor yacht">{t("boatTypeMotorYacht")}</option>
            <option value="Catamaran">{t("boatTypeCatamaran")}</option>
            <option value="RIB">{t("boatTypeRIB")}</option>
            <option value="Motorboat">{t("boatTypeMotorboat")}</option>
            <option value="Other">{t("boatTypeOther")}</option>
          </SelectField>
          <SelectField label={t("fieldBandeira")} value={form.flag ?? ""} onChange={(e) => set("flag", e.target.value || null)}>
            <option value="">--</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {flagEmoji(country.code)} {country.es}
              </option>
            ))}
          </SelectField>
        </div>

        <TextareaField label={t("fieldEngineNotes")} value={form.engineNotes ?? ""} onChange={(e) => set("engineNotes", e.target.value)} />
        <TextareaField label={t("fieldGeneralNotes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />

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
