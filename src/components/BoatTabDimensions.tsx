import type { BoatDimensions, SailInventoryItem } from "../lib/types";
import { OrcDiagram } from "./OrcDiagram";

function Row({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="boat-detail-row">
      <span className="boat-detail-label">{label}</span>
      <span className="boat-detail-value">{value}{unit ? <span style={{ opacity: 0.6, fontSize: "0.85em", marginLeft: 2 }}>{unit}</span> : null}</span>
    </div>
  );
}

const SAIL_TYPE_LABELS: Record<string, string> = {
  mainsail: "Mayor",
  headsail: "Génova / Foque",
  spinnaker_sym: "Spinnaker simétrico",
  spinnaker_asym: "Spinnaker asimétrico",
  code_zero: "Code Zero",
  gennaker: "Gennaker",
  trysail: "Trysail",
  storm_jib: "Foque de capa",
  other: "Otro",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Nueva",
  good: "Bueno",
  fair: "Regular",
  worn: "Desgastada",
};

function SailRow({ sail }: { sail: SailInventoryItem }) {
  return (
    <div className="sail-row">
      <div className="sail-row-header">
        <strong>{sail.label}</strong>
        <span className="pill" style={{ fontSize: "0.75rem" }}>{SAIL_TYPE_LABELS[sail.sailType] ?? sail.sailType}</span>
        {sail.condition && <span className="pill" style={{ fontSize: "0.72rem", opacity: 0.7 }}>{CONDITION_LABELS[sail.condition] ?? sail.condition}</span>}
      </div>
      <div className="sail-row-details">
        {sail.area      != null && <span>Área: <strong>{sail.area} m²</strong></span>}
        {sail.luff      != null && <span>Grátil: <strong>{sail.luff} m</strong></span>}
        {sail.foot      != null && <span>Pujamen: <strong>{sail.foot} m</strong></span>}
        {sail.leech     != null && <span>Baluma: <strong>{sail.leech} m</strong></span>}
        {sail.slu       != null && <span>SLU: <strong>{sail.slu} m</strong></span>}
        {sail.sle       != null && <span>SLE: <strong>{sail.sle} m</strong></span>}
        {sail.sl        != null && <span>SL: <strong>{sail.sl} m</strong></span>}
        {sail.shw       != null && <span>SHW: <strong>{sail.shw} m</strong></span>}
        {sail.sfl       != null && <span>SFL: <strong>{sail.sfl} m</strong></span>}
        {sail.material  && <span>Material: <strong>{sail.material}</strong></span>}
        {sail.year      != null && <span>Año: <strong>{sail.year}</strong></span>}
      </div>
      {sail.notes && <p className="sail-row-notes">{sail.notes}</p>}
    </div>
  );
}

export function BoatTabDimensions({ dims, canEdit, onEdit }: {
  dims: BoatDimensions;
  canEdit?: boolean;
  onEdit?: () => void;
}) {
  const hasSails = dims.sails && dims.sails.length > 0;

  return (
    <div className="boat-detail-sections">
      {/* ── Diagram ─────────────────────────────────────────────────── */}
      <section className="boat-detail-section boat-detail-section--diagram">
        <div className="boat-detail-section-head" style={{ width: "100%", marginBottom: "0.5rem" }}>
          <h4 style={{ margin: 0 }}>Esquema aparejo</h4>
          {canEdit && onEdit && (
            <button className="btn-icon" type="button" title="Editar dimensiones" onClick={onEdit}>✏</button>
          )}
        </div>
        <OrcDiagram dims={dims} />
      </section>

      {/* ── Class / Builder ───────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Clase y constructor</h4>
        <Row label="Diseñador" value={dims.designer} />
        <Row label="Constructor" value={dims.builder} />
        <Row label="Fecha de serie" value={dims.seriesDate} />
        <Row label="Construcción del casco" value={dims.hullConstruction} />
      </section>

      {/* ── Hull ──────────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Casco y apéndices</h4>
        <Row label="Eslora total (LOA)" value={dims.loa} unit="m" />
        <Row label="Manga máxima" value={dims.maxBeam} unit="m" />
        <Row label="Calado" value={dims.draft} unit="m" />
        <Row label="Desplazamiento" value={dims.displacement != null ? dims.displacement.toLocaleString("es") : null} unit="kg" />
      </section>

      {/* ── Propeller ─────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Hélice</h4>
        <Row label="Tipo" value={dims.propellerType} />
        <Row label="Diámetro" value={dims.propellerDiameter} unit="m" />
      </section>

      {/* ── Crew ──────────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Tripulación</h4>
        <Row label="Peso máximo" value={dims.crewMaxWeight} unit="kg" />
        <Row label="Peso mínimo" value={dims.crewMinWeight} unit="kg" />
      </section>

      {/* ── Rig ───────────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Aparejo</h4>
        <Row label="P — Driza mayor" value={dims.P} unit="m" />
        <Row label="E — Pujamen mayor" value={dims.E} unit="m" />
        <Row label="IG — Altura triángulo proa" value={dims.IG} unit="m" />
        <Row label="ISP — Altura spinnaker" value={dims.ISP} unit="m" />
        <Row label="J — Base triángulo proa" value={dims.J} unit="m" />
        <Row label="BAS — Boom sobre cubierta" value={dims.BAS} unit="m" />
        <Row label="TPS — Tangón" value={dims.TPS} unit="m" />
        <Row label="Pares de barraganetes" value={dims.spreadersCount} />
        <Row label="Palo de carbono" value={dims.carbonMast ? "Sí" : dims.carbonMast === false ? "No" : null} />
        <Row label="Enrollador foque" value={dims.headsailFurler ? "Sí" : dims.headsailFurler === false ? "No" : null} />
        <Row label="Enrollador mayor" value={dims.mainsailFurler ? "Sí" : dims.mainsailFurler === false ? "No" : null} />
      </section>

      {/* ── Sail areas ────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Superficies vélicas</h4>
        <Row label="Mayor" value={dims.mainsailMeasured} unit="m²" />
        <Row label="Génova / Foque" value={dims.headsailMeasured} unit="m²" />
        <Row label="Spinnaker / Asimétrico" value={dims.asymmetricMeasured} unit="m²" />
      </section>

      {/* ── Sail inventory ────────────────────────────────────────────── */}
      {hasSails && (
        <section className="boat-detail-section">
          <h4>Inventario de velas</h4>
          <div className="sail-list">
            {dims.sails!.map((s) => <SailRow key={s.id} sail={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}
