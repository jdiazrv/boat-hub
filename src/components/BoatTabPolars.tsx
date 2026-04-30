import type { BoatDimensions } from "../lib/types";
import { PolarChart } from "./PolarChart";

const WIND_SPEEDS = [6, 8, 10, 12, 14, 16, 20];

function hasValues(values?: number[] | null) {
  return Array.isArray(values) && values.length > 0;
}

export function BoatTabPolars({ dims, canEdit, onEdit }: {
  dims: BoatDimensions;
  canEdit?: boolean;
  onEdit?: () => void;
}) {
  const winds = hasValues(dims.polarWindSpeeds) ? dims.polarWindSpeeds! : WIND_SPEEDS;
  const hasPolarRows = Array.isArray(dims.polarRows) && dims.polarRows.length > 0;
  const hasPolar =
    hasPolarRows ||
    hasValues(dims.polarBeatAngles) ||
    hasValues(dims.polarBeatVmg) ||
    hasValues(dims.polarRunVmg) ||
    hasValues(dims.polarGybeAngles);

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <div className="boat-detail-section-head">
          <h4>Tabla polar VPP (kt)</h4>
          {canEdit && onEdit && (
            <button className="btn-icon" type="button" title="Editar polares" onClick={onEdit}>✏</button>
          )}
        </div>

        {hasPolar ? (
          <>
          <PolarChart dims={dims} />
          <div style={{ overflowX: "auto" }}>
            <table className="polar-table">
              <thead>
                <tr>
                  <th>TWA</th>
                  {winds.map((w) => <th key={w}>{w} kt</th>)}
                </tr>
              </thead>
              <tbody>
                {hasValues(dims.polarBeatAngles) && (
                  <tr className="polar-row-beat">
                    <td>Ceñida {dims.polarBeatAngles!.map((a) => `${a}°`).join(" / ")}</td>
                    {(dims.polarBeatVmg ?? []).map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )}
                {(dims.polarRows ?? []).map((row) => (
                  <tr key={row.twa}>
                    <td><strong>{row.twa}°</strong></td>
                    {winds.map((_, i) => <td key={i}>{row.speeds[i] ?? ""}</td>)}
                  </tr>
                ))}
                {hasValues(dims.polarRunVmg) && (
                  <tr className="polar-row-run">
                    <td>VMG popa</td>
                    {dims.polarRunVmg!.map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )}
                {hasValues(dims.polarGybeAngles) && (
                  <tr className="polar-row-run">
                    <td>Trasluchada</td>
                    {dims.polarGybeAngles!.map((v, i) => <td key={i}>{v}°</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="empty-inline">
            <p className="data-table-cell-muted">Sin polares registradas.</p>
            {canEdit && onEdit && (
              <button className="btn-ghost" type="button" onClick={onEdit}>+ Añadir polares</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
