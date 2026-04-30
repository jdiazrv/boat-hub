import { useState } from "react";
import type { BoatDimensions, SailInventoryItem, PolarRow } from "../lib/types";
import { Modal } from "./Modal";
import { InputField, SelectField, TextareaField } from "./FormField";
import { useI18n } from "../lib/i18n";

type Props = {
  dims: BoatDimensions;
  onSave: (d: BoatDimensions) => Promise<void>;
  onClose: () => void;
  initialTab?: EditTab;
};

type EditTab = "hull" | "rig" | "sails_areas" | "sails_inv" | "polar";

function n(v: number | null | undefined) { return v ?? ""; }
function b(v: boolean | null | undefined) { return v === true ? "true" : v === false ? "false" : ""; }

function numOrNull(s: string) { const v = parseFloat(s); return isNaN(v) ? null : v; }
function boolOrNull(s: string) { return s === "true" ? true : s === "false" ? false : null; }

export function EditDimensionsModal({ dims: initial, onSave, onClose, initialTab = "hull" }: Props) {
  const { t } = useI18n();

  const EDIT_TABS: { key: EditTab; label: string }[] = [
    { key: "hull",        label: t("sectionHull") },
    { key: "rig",         label: t("sectionRig") },
    { key: "sails_areas", label: t("sectionSailAreas") },
    { key: "sails_inv",   label: t("sectionSailInventory") },
    { key: "polar",       label: t("tabPolars") },
  ];

  const SAIL_TYPES = [
    { value: "mainsail",       label: t("fieldMainsailArea") },
    { value: "headsail",       label: t("fieldHeadsailArea") },
    { value: "spinnaker_sym",  label: "Spinnaker simétrico" },
    { value: "spinnaker_asym", label: "Spinnaker asimétrico" },
    { value: "code_zero",      label: "Code Zero" },
    { value: "gennaker",       label: "Gennaker" },
    { value: "trysail",        label: "Trysail" },
    { value: "storm_jib",      label: "Storm jib" },
    { value: "other",          label: t("boatTypeOther") },
  ];

  const [tab, setTab] = useState<EditTab>(initialTab);
  const [d, setD] = useState<BoatDimensions>({ ...initial });
  const [sails, setSails] = useState<SailInventoryItem[]>(initial.sails ?? []);
  const [polarRows, setPolarRows] = useState<PolarRow[]>(initial.polarRows ?? []);
  const [polarWinds, setPolarWinds] = useState((initial.polarWindSpeeds ?? [6,8,10,12,14,16,20]).join(","));
  const [polarBeat, setPolarBeat]   = useState((initial.polarBeatAngles ?? []).join(","));
  const [polarBeatVmg, setPolarBeatVmg] = useState((initial.polarBeatVmg ?? []).join(","));
  const [polarRunVmg, setPolarRunVmg]   = useState((initial.polarRunVmg ?? []).join(","));
  const [polarGybe, setPolarGybe]       = useState((initial.polarGybeAngles ?? []).join(","));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof BoatDimensions>(key: K, val: string) {
    setD((prev) => ({ ...prev, [key]: numOrNull(val) }));
  }
  function setStr<K extends keyof BoatDimensions>(key: K, val: string) {
    setD((prev) => ({ ...prev, [key]: val || null }));
  }
  function setBool<K extends keyof BoatDimensions>(key: K, val: string) {
    setD((prev) => ({ ...prev, [key]: boolOrNull(val) }));
  }

  function addSail() {
    setSails((prev) => [...prev, {
      id: `sail-${Date.now()}`,
      label: "",
      sailType: "headsail",
    }]);
  }

  function updateSail(idx: number, key: keyof SailInventoryItem, val: string | number | null) {
    setSails((prev) => prev.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  }

  function removeSail(idx: number) {
    setSails((prev) => prev.filter((_, i) => i !== idx));
  }

  function addPolarRow() {
    setPolarRows((prev) => [...prev, { twa: 0, speeds: [] }]);
  }

  function updatePolarRow(idx: number, key: "twa" | "speeds", val: string) {
    setPolarRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      if (key === "twa") return { ...r, twa: numOrNull(val) ?? 0 };
      return { ...r, speeds: val.split(",").map((s) => numOrNull(s.trim()) ?? 0) };
    }));
  }

  function removePolarRow(idx: number) {
    setPolarRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function csvToNums(s: string) {
    return s.split(",").map((v) => numOrNull(v.trim())).filter((v): v is number => v !== null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const final: BoatDimensions = {
        ...d,
        sails,
        polarRows,
        polarWindSpeeds: csvToNums(polarWinds),
        polarBeatAngles: csvToNums(polarBeat),
        polarBeatVmg:    csvToNums(polarBeatVmg),
        polarRunVmg:     csvToNums(polarRunVmg),
        polarGybeAngles: csvToNums(polarGybe),
      };
      await onSave(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saving"));
      setSaving(false);
    }
  }

  return (
    <Modal title={t("modalEditDimensions")} onClose={onClose} wide>
      <div className="form-stack">
        <div className="tab-bar" style={{ marginBottom: "1rem" }}>
          {EDIT_TABS.map((tb) => (
            <button key={tb.key} type="button"
              className={`tab-btn${tab === tb.key ? " active" : ""}`}
              onClick={() => setTab(tb.key)}
            >{tb.label}</button>
          ))}
        </div>

        {tab === "hull" && (
          <div className="form-grid">
            <InputField label={t("fieldDesigner")} value={d.designer ?? ""} onChange={(e) => setStr("designer", e.target.value)} />
            <InputField label={t("fieldBuilder")} value={d.builder ?? ""} onChange={(e) => setStr("builder", e.target.value)} />
            <InputField label={t("fieldSeriesDate")} value={d.seriesDate ?? ""} onChange={(e) => setStr("seriesDate", e.target.value)} />
            <InputField label={t("fieldHullConstruction")} value={d.hullConstruction ?? ""} onChange={(e) => setStr("hullConstruction", e.target.value)} />
            <InputField label={t("fieldLoaM")} type="number" value={n(d.loa)} onChange={(e) => set("loa", e.target.value)} />
            <InputField label={t("fieldMaxBeamM")} type="number" value={n(d.maxBeam)} onChange={(e) => set("maxBeam", e.target.value)} />
            <InputField label={t("fieldDraftM")} type="number" value={n(d.draft)} onChange={(e) => set("draft", e.target.value)} />
            <InputField label={t("fieldDisplacementKg")} type="number" value={n(d.displacement)} onChange={(e) => set("displacement", e.target.value)} />
            <InputField label={t("fieldPropellerTypeFull")} value={d.propellerType ?? ""} onChange={(e) => setStr("propellerType", e.target.value)} />
            <InputField label={t("fieldPropellerDiameterM")} type="number" value={n(d.propellerDiameter)} onChange={(e) => set("propellerDiameter", e.target.value)} />
            <InputField label={t("fieldCrewMaxWeightKg")} type="number" value={n(d.crewMaxWeight)} onChange={(e) => set("crewMaxWeight", e.target.value)} />
            <InputField label={t("fieldCrewMinWeightKg")} type="number" value={n(d.crewMinWeight)} onChange={(e) => set("crewMinWeight", e.target.value)} />
          </div>
        )}

        {tab === "rig" && (
          <div className="form-grid">
            <InputField label={t("fieldPM")} type="number" value={n(d.P)} onChange={(e) => set("P", e.target.value)} />
            <InputField label={t("fieldEM")} type="number" value={n(d.E)} onChange={(e) => set("E", e.target.value)} />
            <InputField label={t("fieldIGM")} type="number" value={n(d.IG)} onChange={(e) => set("IG", e.target.value)} />
            <InputField label={t("fieldISPM")} type="number" value={n(d.ISP)} onChange={(e) => set("ISP", e.target.value)} />
            <InputField label={t("fieldJM")} type="number" value={n(d.J)} onChange={(e) => set("J", e.target.value)} />
            <InputField label={t("fieldBASM")} type="number" value={n(d.BAS)} onChange={(e) => set("BAS", e.target.value)} />
            <InputField label={t("fieldTPSM")} type="number" value={n(d.TPS)} onChange={(e) => set("TPS", e.target.value)} />
            <InputField label={t("fieldSpreadersCountFull")} type="number" value={n(d.spreadersCount)} onChange={(e) => set("spreadersCount", e.target.value)} />
            <SelectField label={t("fieldCarbonMast")} value={b(d.carbonMast)} onChange={(e) => setBool("carbonMast", e.target.value)}>
              <option value="">—</option>
              <option value="true">{t("yes")}</option>
              <option value="false">{t("no")}</option>
            </SelectField>
            <SelectField label={t("fieldHeadsailFurler")} value={b(d.headsailFurler)} onChange={(e) => setBool("headsailFurler", e.target.value)}>
              <option value="">—</option>
              <option value="true">{t("yes")}</option>
              <option value="false">{t("no")}</option>
            </SelectField>
            <SelectField label={t("fieldMainsailFurler")} value={b(d.mainsailFurler)} onChange={(e) => setBool("mainsailFurler", e.target.value)}>
              <option value="">—</option>
              <option value="true">{t("yes")}</option>
              <option value="false">{t("no")}</option>
            </SelectField>
          </div>
        )}

        {tab === "sails_areas" && (
          <div className="form-grid">
            <InputField label={t("fieldMainsailM2")} type="number" value={n(d.mainsailMeasured)} onChange={(e) => set("mainsailMeasured", e.target.value)} />
            <InputField label={t("fieldHeadsailM2")} type="number" value={n(d.headsailMeasured)} onChange={(e) => set("headsailMeasured", e.target.value)} />
            <InputField label={t("fieldAsymmetricM2")} type="number" value={n(d.asymmetricMeasured)} onChange={(e) => set("asymmetricMeasured", e.target.value)} />
          </div>
        )}

        {tab === "sails_inv" && (
          <div className="form-stack">
            {sails.map((sail, idx) => (
              <div key={sail.id} className="boat-detail-section" style={{ position: "relative" }}>
                <button type="button" className="btn-icon" style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={() => removeSail(idx)} title={t("delete")}>✕</button>
                <div className="form-grid">
                  <InputField label={t("fieldSailLabel")} value={sail.label} onChange={(e) => updateSail(idx, "label", e.target.value)} />
                  <SelectField label={t("kind")} value={sail.sailType} onChange={(e) => updateSail(idx, "sailType", e.target.value)}>
                    {SAIL_TYPES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </SelectField>
                  <InputField label={t("fieldArea")} type="number" value={sail.area ?? ""} onChange={(e) => updateSail(idx, "area", numOrNull(e.target.value))} />
                  <InputField label={t("fieldLuff")} type="number" value={sail.luff ?? ""} onChange={(e) => updateSail(idx, "luff", numOrNull(e.target.value))} />
                  <InputField label={t("fieldFoot")} type="number" value={sail.foot ?? ""} onChange={(e) => updateSail(idx, "foot", numOrNull(e.target.value))} />
                  <InputField label={t("fieldLeech")} type="number" value={sail.leech ?? ""} onChange={(e) => updateSail(idx, "leech", numOrNull(e.target.value))} />
                  <InputField label="LP%" type="number" value={sail.lpPercent ?? ""} onChange={(e) => updateSail(idx, "lpPercent", numOrNull(e.target.value))} />
                  <InputField label="SLU (m)" type="number" value={sail.slu ?? ""} onChange={(e) => updateSail(idx, "slu", numOrNull(e.target.value))} />
                  <InputField label="SLE (m)" type="number" value={sail.sle ?? ""} onChange={(e) => updateSail(idx, "sle", numOrNull(e.target.value))} />
                  <InputField label="SL (m)" type="number" value={sail.sl ?? ""} onChange={(e) => updateSail(idx, "sl", numOrNull(e.target.value))} />
                  <InputField label="SHW (m)" type="number" value={sail.shw ?? ""} onChange={(e) => updateSail(idx, "shw", numOrNull(e.target.value))} />
                  <InputField label="SFL (m)" type="number" value={sail.sfl ?? ""} onChange={(e) => updateSail(idx, "sfl", numOrNull(e.target.value))} />
                  <InputField label={t("fieldMaterial")} value={sail.material ?? ""} onChange={(e) => updateSail(idx, "material", e.target.value || null)} />
                  <InputField label={t("fieldSailYear")} type="number" value={sail.year ?? ""} onChange={(e) => updateSail(idx, "year", numOrNull(e.target.value))} />
                  <SelectField label={t("fieldSailCondition")} value={sail.condition ?? ""} onChange={(e) => updateSail(idx, "condition", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="new">{t("sailConditionNew")}</option>
                    <option value="good">{t("sailConditionGood")}</option>
                    <option value="fair">{t("sailConditionFair")}</option>
                    <option value="worn">{t("sailConditionWorn")}</option>
                  </SelectField>
                </div>
                <TextareaField label={t("fieldSailNotes")} value={sail.notes ?? ""} onChange={(e) => updateSail(idx, "notes", e.target.value || null)} />
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={addSail}>{t("addSail")}</button>
          </div>
        )}

        {tab === "polar" && (
          <div className="form-stack">
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-soft)" }}>
              {t("polarHint")}
            </p>
            <InputField label={t("polarWindsLabel")} value={polarWinds} onChange={(e) => setPolarWinds(e.target.value)} />
            <InputField label={t("polarBeatAnglesLabel")} value={polarBeat} onChange={(e) => setPolarBeat(e.target.value)} />
            <InputField label={t("polarBeatVmgLabel")} value={polarBeatVmg} onChange={(e) => setPolarBeatVmg(e.target.value)} />
            <InputField label={t("polarRunVmgLabel")} value={polarRunVmg} onChange={(e) => setPolarRunVmg(e.target.value)} />
            <InputField label={t("polarGybeAnglesLabel")} value={polarGybe} onChange={(e) => setPolarGybe(e.target.value)} />
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>{t("polarRowsLabel")}</strong>
            </div>
            {polarRows.map((row, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ width: 80, flexShrink: 0 }}>
                  <InputField label={t("polarTwaLabel")} type="number" value={row.twa} onChange={(e) => updatePolarRow(idx, "twa", e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <InputField label={t("polarSpeedsLabel")} value={row.speeds.join(",")} onChange={(e) => updatePolarRow(idx, "speeds", e.target.value)} />
                </div>
                <button type="button" className="btn-icon" style={{ marginBottom: "0.1rem" }} onClick={() => removePolarRow(idx)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={addPolarRow}>{t("addPolarRow")}</button>
          </div>
        )}

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
