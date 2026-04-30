import { useState } from "react";
import type { BoatIdentifiers } from "../lib/types";
import { Modal } from "./Modal";
import { InputField } from "./FormField";
import { useI18n } from "../lib/i18n";

export function EditIdentifiersModal({ identifiers: initial, onSave, onClose }: {
  identifiers: BoatIdentifiers;
  onSave: (ids: BoatIdentifiers) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [ids, setIds] = useState<BoatIdentifiers>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof BoatIdentifiers, val: string) {
    setIds((prev) => ({ ...prev, [key]: val || null }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saving"));
      setSaving(false);
    }
  }

  return (
    <Modal title={t("modalEditIdentifiers")} onClose={onClose} wide>
      <div className="form-stack">
        <div className="form-grid">
          <InputField label={t("fieldMMSI")} value={ids.mmsi ?? ""} onChange={(e) => set("mmsi", e.target.value)} />
          <InputField label={t("fieldCallSign")} value={ids.callSign ?? ""} onChange={(e) => set("callSign", e.target.value)} />
          <InputField label={t("fieldIMO")} value={ids.imoNumber ?? ""} onChange={(e) => set("imoNumber", e.target.value)} />
          <InputField label={t("fieldIntNominativo")} value={ids.intNominativo ?? ""} onChange={(e) => set("intNominativo", e.target.value)} />
          <InputField label={t("fieldWinCode")} value={ids.winCode ?? ""} onChange={(e) => set("winCode", e.target.value)} />
          <InputField label={t("fieldAtcnRef")} value={ids.atcnRef ?? ""} onChange={(e) => set("atcnRef", e.target.value)} />
        </div>
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
