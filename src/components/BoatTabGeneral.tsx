import type { Boat } from "../lib/types";
import { flagEmoji } from "../lib/flags";

const BOAT_TYPE_LABELS: Record<string, string> = {
  Sailboat: "Velero",
  "Motor yacht": "Motor yacht",
  Catamaran: "Catamarán",
  RIB: "RIB",
  Motorboat: "Lancha",
  Other: "Otro",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="boat-detail-row">
      <span className="boat-detail-label">{label}</span>
      <span className="boat-detail-value">{value}</span>
    </div>
  );
}

export function BoatTabGeneral({ boat }: { boat: Boat }) {
  const ids = boat.identifiers;
  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <h4>Identificación</h4>
        <Row label="Nombre" value={boat.name} />
        <Row label="Marca / Modelo" value={boat.brandModel} />
        <Row label="Tipo" value={boat.boatType ? (BOAT_TYPE_LABELS[boat.boatType] ?? boat.boatType) : null} />
        <Row label="Año" value={boat.buildYear} />
        <Row label="Astillero" value={boat.shipyard} />
        <Row label="Matrícula" value={boat.registrationNumber} />
        <Row label="Bandera" value={boat.flag ? `${flagEmoji(boat.flag)} ${boat.flag}` : null} />
        <Row label="Identificador" value={boat.identifier} />
      </section>

      {ids && (
        <section className="boat-detail-section">
          <h4>Identificadores internacionales</h4>
          <Row label="MMSI" value={ids.mmsi} />
          <Row label="Indicativo radio (call sign)" value={ids.callSign} />
          <Row label="Nº IMO" value={ids.imoNumber} />
          <Row label="Nominativo internacional" value={ids.intNominativo} />
          <Row label="Código WIN (HIN)" value={ids.winCode} />
          <Row label="Ref. club / asociación" value={ids.atcnRef} />
        </section>
      )}

      <section className="boat-detail-section">
        <h4>Motor y propulsión</h4>
        <Row label="Propulsión" value={boat.propulsion} />
        <Row label="Notas motor" value={boat.engineNotes} />
      </section>

      {boat.notes && (
        <section className="boat-detail-section">
          <h4>Notas generales</h4>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{boat.notes}</p>
        </section>
      )}
    </div>
  );
}
