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

const WIND_SPEEDS = [6, 8, 10, 12, 14, 16, 20];

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

function SailRow({ sail }: { sail: SailInventoryItem }) {
  return (
    <div className="sail-row">
      <div className="sail-row-header">
        <strong>{sail.label}</strong>
        <span className="pill" style={{ fontSize: "0.75rem" }}>{SAIL_TYPE_LABELS[sail.sailType] ?? sail.sailType}</span>
        {sail.condition && <span className="pill" style={{ fontSize: "0.72rem", opacity: 0.7 }}>{sail.condition}</span>}
      </div>
      <div className="sail-row-details">
        {sail.area      != null && <span>Área: <strong>{sail.area} m²</strong></span>}
        {sail.luff      != null && <span>Grátil: <strong>{sail.luff} m</strong></span>}
        {sail.foot      != null && <span>Pujamen: <strong>{sail.foot} m</strong></span>}
        {sail.leech     != null && <span>Baluma: <strong>{sail.leech} m</strong></span>}
        {sail.lpPercent != null && <span>LP%: <strong>{sail.lpPercent}%</strong></span>}
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
  const winds = dims.polarWindSpeeds ?? WIND_SPEEDS;
  const hasPolar = dims.polarRows && dims.polarRows.length > 0;
  const hasSails = dims.sails && dims.sails.length > 0;

  return (
    <div className="boat-detail-sections">
      {/* ── ORC Diagram ─────────────────────────────────────────────── */}
      <section className="boat-detail-section boat-detail-section--diagram">
        <div className="boat-detail-section-head" style={{ width: "100%", marginBottom: "0.5rem" }}>
          <h4 style={{ margin: 0 }}>Esquema ORC</h4>
          {canEdit && onEdit && (
            <button className="btn-icon" type="button" title="Editar dimensiones" onClick={onEdit}>✏</button>
          )}
        </div>
        <OrcDiagram dims={dims} />
      </section>

      {/* ── Hull ──────────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Casco</h4>
        <Row label="Eslora total (LOA)" value={dims.loa} unit="m" />
        <Row label="Manga máxima" value={dims.maxBeam} unit="m" />
        <Row label="Calado" value={dims.draft} unit="m" />
        <Row label="Desplazamiento" value={dims.displacement != null ? dims.displacement.toLocaleString("es") : null} unit="kg" />
        <Row label="Superficie mojada" value={dims.wettedArea} unit="m²" />
        <Row label="DLR" value={dims.dlr} />
        <Row label="Clase IMS" value={dims.imsClass} />
      </section>

      {/* ── Rig ───────────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Aparejo (medidas ORC)</h4>
        <Row label="P — Driza mayor" value={dims.P} unit="m" />
        <Row label="E — Pujamen mayor" value={dims.E} unit="m" />
        <Row label="IG — Altura triángulo proa" value={dims.IG} unit="m" />
        <Row label="ISP — Altura spinnaker" value={dims.ISP} unit="m" />
        <Row label="J — Base triángulo proa" value={dims.J} unit="m" />
        <Row label="BAS — Boom sobre cubierta" value={dims.BAS} unit="m" />
        <Row label="TPS — Tangón" value={dims.TPS} unit="m" />
        <Row label="MW — Ancho máximo palo" value={dims.MW} unit="m" />
        <Row label="GO — Offset botavara" value={dims.GO} unit="m" />
        <Row label="BD — Altura botavara" value={dims.BD} unit="m" />
        <Row label="Peso del palo (MWT)" value={dims.MWT} unit="kg" />
        <Row label="CDG palo (MCG)" value={dims.MCG} unit="m" />
        <Row label="Obenques" value={dims.spreadersCount != null ? `${dims.spreadersCount} pares de barraganetes` : null} />
        <Row label="Palo de carbono" value={dims.carbonMast ? "Sí" : dims.carbonMast === false ? "No" : null} />
        <Row label="Enrollador foque" value={dims.headsailFurler ? "Sí" : dims.headsailFurler === false ? "No" : null} />
      </section>

      {/* ── Sail areas ────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Superficies vélicas</h4>
        <Row label="Mayor medida" value={dims.mainsailMeasured} unit="m²" />
        <Row label="Mayor rated" value={dims.mainsailRated} unit="m²" />
        <Row label="Génova medida" value={dims.headsailMeasured} unit="m²" />
        <Row label="Génova rated" value={dims.headsailRated} unit="m²" />
        <Row label="Asimétrico medida" value={dims.asymmetricMeasured} unit="m²" />
        <Row label="Asimétrico rated" value={dims.asymmetricRated} unit="m²" />
        <Row label="Trysail" value={dims.trysail} unit="m²" />
        <Row label="Foque de temporal" value={dims.stormJib} unit="m²" />
        <Row label="Foque gran viento" value={dims.heavyJib} unit="m²" />
      </section>

      {/* ── Stability ─────────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>Estabilidad</h4>
        <Row label="Momento adrizante (RM)" value={dims.rmRated} unit="kg·m" />
        <Row label="Stability Index" value={dims.stabilityIndex} />
        <Row label="Límite estabilidad positiva" value={dims.lps} unit="°" />
      </section>

      {/* ── ORC ratings ───────────────────────────────────────────────── */}
      {(dims.orcGph || dims.orcAph || dims.orcCdl) && (
        <section className="boat-detail-section">
          <h4>Rating ORC</h4>
          <Row label="GPH" value={dims.orcGph} />
          <Row label="APH" value={dims.orcAph} />
          <Row label="CDL" value={dims.orcCdl} />
          <Row label="Nº certificado" value={dims.certNo} />
        </section>
      )}

      {/* ── Sail inventory ────────────────────────────────────────────── */}
      {hasSails && (
        <section className="boat-detail-section">
          <h4>Inventario de velas</h4>
          <div className="sail-list">
            {dims.sails!.map((s) => <SailRow key={s.id} sail={s} />)}
          </div>
        </section>
      )}

      {/* ── VPP Polar table ───────────────────────────────────────────── */}
      {hasPolar && (
        <section className="boat-detail-section">
          <h4>Tabla polar VPP (kt)</h4>
          <div style={{ overflowX: "auto" }}>
            <table className="polar-table">
              <thead>
                <tr>
                  <th>TWA</th>
                  {winds.map((w) => <th key={w}>{w} kt</th>)}
                </tr>
              </thead>
              <tbody>
                {dims.polarBeatAngles && (
                  <tr className="polar-row-beat">
                    <td>↑ {dims.polarBeatAngles.map((a) => `${a}°`).join(" / ")}</td>
                    {(dims.polarBeatVmg ?? []).map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )}
                {dims.polarRows!.map((row) => (
                  <tr key={row.twa}>
                    <td><strong>{row.twa}°</strong></td>
                    {row.speeds.map((s, i) => <td key={i}>{s}</td>)}
                  </tr>
                ))}
                {dims.polarRunVmg && (
                  <tr className="polar-row-run">
                    <td>↓ VMG popa</td>
                    {dims.polarRunVmg.map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
