import { useState } from "react";
import type { BoatDimensions, SailInventoryItem, PolarRow } from "../lib/types";
import { Modal } from "./Modal";
import { InputField, SelectField, TextareaField } from "./FormField";

type Props = {
  dims: BoatDimensions;
  onSave: (d: BoatDimensions) => Promise<void>;
  onClose: () => void;
};

type EditTab = "hull" | "rig" | "sails_areas" | "stability" | "sails_inv" | "polar";

const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: "hull",       label: "Casco" },
  { key: "rig",        label: "Aparejo" },
  { key: "sails_areas",label: "Superficies" },
  { key: "stability",  label: "Estabilidad" },
  { key: "sails_inv",  label: "Velas" },
  { key: "polar",      label: "Polares" },
];

const SAIL_TYPES = [
  { value: "mainsail",       label: "Mayor" },
  { value: "headsail",       label: "Génova / Foque" },
  { value: "spinnaker_sym",  label: "Spinnaker simétrico" },
  { value: "spinnaker_asym", label: "Spinnaker asimétrico" },
  { value: "code_zero",      label: "Code Zero" },
  { value: "gennaker",       label: "Gennaker" },
  { value: "trysail",        label: "Trysail" },
  { value: "storm_jib",      label: "Foque de capa" },
  { value: "other",          label: "Otro" },
];

function n(v: number | null | undefined) { return v ?? ""; }
function b(v: boolean | null | undefined) { return v === true ? "true" : v === false ? "false" : ""; }

function numOrNull(s: string) { const v = parseFloat(s); return isNaN(v) ? null : v; }
function boolOrNull(s: string) { return s === "true" ? true : s === "false" ? false : null; }

export function EditDimensionsModal({ dims: initial, onSave, onClose }: Props) {
  const [tab, setTab] = useState<EditTab>("hull");
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
      setError(e instanceof Error ? e.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar dimensiones y datos ORC" onClose={onClose} wide>
      <div className="form-stack">
        {/* inner tab bar */}
        <div className="tab-bar" style={{ marginBottom: "1rem" }}>
          {EDIT_TABS.map((t) => (
            <button key={t.key} type="button"
              className={`tab-btn${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {tab === "hull" && (
          <div className="form-grid">
            <InputField label="LOA — Eslora total (m)" type="number" value={n(d.loa)} onChange={(e) => set("loa", e.target.value)} />
            <InputField label="Manga máxima (m)" type="number" value={n(d.maxBeam)} onChange={(e) => set("maxBeam", e.target.value)} />
            <InputField label="Calado (m)" type="number" value={n(d.draft)} onChange={(e) => set("draft", e.target.value)} />
            <InputField label="Desplazamiento (kg)" type="number" value={n(d.displacement)} onChange={(e) => set("displacement", e.target.value)} />
            <InputField label="Superficie mojada (m²)" type="number" value={n(d.wettedArea)} onChange={(e) => set("wettedArea", e.target.value)} />
            <InputField label="DLR" type="number" value={n(d.dlr)} onChange={(e) => set("dlr", e.target.value)} />
            <InputField label="Clase IMS" value={d.imsClass ?? ""} onChange={(e) => setStr("imsClass", e.target.value)} />
            <InputField label="GPH" type="number" value={n(d.orcGph)} onChange={(e) => set("orcGph", e.target.value)} />
            <InputField label="APH" type="number" value={n(d.orcAph)} onChange={(e) => set("orcAph", e.target.value)} />
            <InputField label="CDL" type="number" value={n(d.orcCdl)} onChange={(e) => set("orcCdl", e.target.value)} />
            <InputField label="Nº certificado ORC" value={d.certNo ?? ""} onChange={(e) => setStr("certNo", e.target.value)} />
          </div>
        )}

        {tab === "rig" && (
          <div className="form-grid">
            <InputField label="P — Driza mayor (m)" type="number" value={n(d.P)} onChange={(e) => set("P", e.target.value)} />
            <InputField label="E — Pujamen mayor (m)" type="number" value={n(d.E)} onChange={(e) => set("E", e.target.value)} />
            <InputField label="IG — Altura triángulo proa (m)" type="number" value={n(d.IG)} onChange={(e) => set("IG", e.target.value)} />
            <InputField label="ISP — Altura spinnaker (m)" type="number" value={n(d.ISP)} onChange={(e) => set("ISP", e.target.value)} />
            <InputField label="J — Base triángulo proa (m)" type="number" value={n(d.J)} onChange={(e) => set("J", e.target.value)} />
            <InputField label="BAS — Boom sobre cubierta (m)" type="number" value={n(d.BAS)} onChange={(e) => set("BAS", e.target.value)} />
            <InputField label="TPS — Tangón (m)" type="number" value={n(d.TPS)} onChange={(e) => set("TPS", e.target.value)} />
            <InputField label="TL — Trunk length (m)" type="number" value={n(d.TL)} onChange={(e) => set("TL", e.target.value)} />
            <InputField label="MW — Ancho máx. palo (m)" type="number" value={n(d.MW)} onChange={(e) => set("MW", e.target.value)} />
            <InputField label="GO — Offset botavara (m)" type="number" value={n(d.GO)} onChange={(e) => set("GO", e.target.value)} />
            <InputField label="BD — Altura botavara (m)" type="number" value={n(d.BD)} onChange={(e) => set("BD", e.target.value)} />
            <InputField label="MWT — Peso palo (kg)" type="number" value={n(d.MWT)} onChange={(e) => set("MWT", e.target.value)} />
            <InputField label="MCG — CDG palo (m)" type="number" value={n(d.MCG)} onChange={(e) => set("MCG", e.target.value)} />
            <InputField label="Pares de barraganetes" type="number" value={n(d.spreadersCount)} onChange={(e) => set("spreadersCount", e.target.value)} />
            <SelectField label="Palo de carbono" value={b(d.carbonMast)} onChange={(e) => setBool("carbonMast", e.target.value)}>
              <option value="">—</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </SelectField>
            <SelectField label="Enrollador foque" value={b(d.headsailFurler)} onChange={(e) => setBool("headsailFurler", e.target.value)}>
              <option value="">—</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </SelectField>
          </div>
        )}

        {tab === "sails_areas" && (
          <div className="form-grid">
            <InputField label="Mayor medida (m²)" type="number" value={n(d.mainsailMeasured)} onChange={(e) => set("mainsailMeasured", e.target.value)} />
            <InputField label="Mayor rated (m²)" type="number" value={n(d.mainsailRated)} onChange={(e) => set("mainsailRated", e.target.value)} />
            <InputField label="Génova medida (m²)" type="number" value={n(d.headsailMeasured)} onChange={(e) => set("headsailMeasured", e.target.value)} />
            <InputField label="Génova rated (m²)" type="number" value={n(d.headsailRated)} onChange={(e) => set("headsailRated", e.target.value)} />
            <InputField label="Asimétrico medida (m²)" type="number" value={n(d.asymmetricMeasured)} onChange={(e) => set("asymmetricMeasured", e.target.value)} />
            <InputField label="Asimétrico rated (m²)" type="number" value={n(d.asymmetricRated)} onChange={(e) => set("asymmetricRated", e.target.value)} />
            <InputField label="Trysail (m²)" type="number" value={n(d.trysail)} onChange={(e) => set("trysail", e.target.value)} />
            <InputField label="Foque de temporal (m²)" type="number" value={n(d.stormJib)} onChange={(e) => set("stormJib", e.target.value)} />
            <InputField label="Foque gran viento (m²)" type="number" value={n(d.heavyJib)} onChange={(e) => set("heavyJib", e.target.value)} />
          </div>
        )}

        {tab === "stability" && (
          <div className="form-grid">
            <InputField label="RM rated (kg·m)" type="number" value={n(d.rmRated)} onChange={(e) => set("rmRated", e.target.value)} />
            <InputField label="Stability Index" type="number" value={n(d.stabilityIndex)} onChange={(e) => set("stabilityIndex", e.target.value)} />
            <InputField label="Límite estabilidad positiva (°)" type="number" value={n(d.lps)} onChange={(e) => set("lps", e.target.value)} />
          </div>
        )}

        {tab === "sails_inv" && (
          <div className="form-stack">
            {sails.map((sail, idx) => (
              <div key={sail.id} className="boat-detail-section" style={{ position: "relative" }}>
                <button type="button" className="btn-icon" style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={() => removeSail(idx)} title="Eliminar vela">✕</button>
                <div className="form-grid">
                  <InputField label="Nombre" value={sail.label} onChange={(e) => updateSail(idx, "label", e.target.value)} />
                  <SelectField label="Tipo" value={sail.sailType} onChange={(e) => updateSail(idx, "sailType", e.target.value)}>
                    {SAIL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </SelectField>
                  <InputField label="Área (m²)" type="number" value={sail.area ?? ""} onChange={(e) => updateSail(idx, "area", numOrNull(e.target.value))} />
                  <InputField label="Grátil (m)" type="number" value={sail.luff ?? ""} onChange={(e) => updateSail(idx, "luff", numOrNull(e.target.value))} />
                  <InputField label="Pujamen (m)" type="number" value={sail.foot ?? ""} onChange={(e) => updateSail(idx, "foot", numOrNull(e.target.value))} />
                  <InputField label="Baluma (m)" type="number" value={sail.leech ?? ""} onChange={(e) => updateSail(idx, "leech", numOrNull(e.target.value))} />
                  <InputField label="LP%" type="number" value={sail.lpPercent ?? ""} onChange={(e) => updateSail(idx, "lpPercent", numOrNull(e.target.value))} />
                  <InputField label="SLU (m)" type="number" value={sail.slu ?? ""} onChange={(e) => updateSail(idx, "slu", numOrNull(e.target.value))} />
                  <InputField label="SLE (m)" type="number" value={sail.sle ?? ""} onChange={(e) => updateSail(idx, "sle", numOrNull(e.target.value))} />
                  <InputField label="SL (m)" type="number" value={sail.sl ?? ""} onChange={(e) => updateSail(idx, "sl", numOrNull(e.target.value))} />
                  <InputField label="SHW (m)" type="number" value={sail.shw ?? ""} onChange={(e) => updateSail(idx, "shw", numOrNull(e.target.value))} />
                  <InputField label="SFL (m)" type="number" value={sail.sfl ?? ""} onChange={(e) => updateSail(idx, "sfl", numOrNull(e.target.value))} />
                  <InputField label="Material" value={sail.material ?? ""} onChange={(e) => updateSail(idx, "material", e.target.value || null)} />
                  <InputField label="Año" type="number" value={sail.year ?? ""} onChange={(e) => updateSail(idx, "year", numOrNull(e.target.value))} />
                  <SelectField label="Estado" value={sail.condition ?? ""} onChange={(e) => updateSail(idx, "condition", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="new">Nueva</option>
                    <option value="good">Bueno</option>
                    <option value="fair">Regular</option>
                    <option value="worn">Desgastada</option>
                  </SelectField>
                </div>
                <TextareaField label="Notas" value={sail.notes ?? ""} onChange={(e) => updateSail(idx, "notes", e.target.value || null)} />
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={addSail}>+ Añadir vela</button>
          </div>
        )}

        {tab === "polar" && (
          <div className="form-stack">
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-soft)" }}>
              Introduce los valores separados por comas, en el mismo orden que las velocidades de viento.
            </p>
            <InputField label="Velocidades de viento TWS (kt)" value={polarWinds} onChange={(e) => setPolarWinds(e.target.value)} />
            <InputField label="Ángulos de ceñida (°)" value={polarBeat} onChange={(e) => setPolarBeat(e.target.value)} />
            <InputField label="VMG ceñida (kt)" value={polarBeatVmg} onChange={(e) => setPolarBeatVmg(e.target.value)} />
            <InputField label="VMG popa (kt)" value={polarRunVmg} onChange={(e) => setPolarRunVmg(e.target.value)} />
            <InputField label="Ángulos de popa (°)" value={polarGybe} onChange={(e) => setPolarGybe(e.target.value)} />
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>Filas polares (TWA)</strong>
            </div>
            {polarRows.map((row, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ width: 80, flexShrink: 0 }}>
                  <InputField label="TWA (°)" type="number" value={row.twa} onChange={(e) => updatePolarRow(idx, "twa", e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <InputField label="Velocidades (kt, separadas por comas)" value={row.speeds.join(",")} onChange={(e) => updatePolarRow(idx, "speeds", e.target.value)} />
                </div>
                <button type="button" className="btn-icon" style={{ marginBottom: "0.1rem" }} onClick={() => removePolarRow(idx)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={addPolarRow}>+ Añadir fila TWA</button>
          </div>
        )}

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
