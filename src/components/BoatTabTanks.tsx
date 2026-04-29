import type { BoatTank, TankType } from "../lib/types";

const TANK_LABELS: Record<TankType, string> = {
  diesel:      "Gasoil",
  fresh_water: "Agua dulce",
  grey_water:  "Aguas grises",
  black_water: "Aguas negras",
  lpg:         "GLP / Gas",
  other:       "Otro",
};

const TANK_ICONS: Record<TankType, string> = {
  diesel:      "⛽",
  fresh_water: "💧",
  grey_water:  "🔄",
  black_water: "🚽",
  lpg:         "🔥",
  other:       "🪣",
};

function TankBar({ pct }: { pct: number }) {
  return (
    <div className="tank-bar-track">
      <div className="tank-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function BoatTabTanks({ tanks }: { tanks: BoatTank[] }) {
  const totalDiesel = tanks.filter((t) => t.type === "diesel").reduce((s, t) => s + t.capacity, 0);
  const totalWater  = tanks.filter((t) => t.type === "fresh_water").reduce((s, t) => s + t.capacity, 0);

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <h4>Capacidades nominales</h4>

        {tanks.length === 0 && (
          <p className="data-table-cell-muted">Sin tanques registrados.</p>
        )}

        <div className="tank-list">
          {tanks.map((tank) => (
            <div key={tank.id} className="tank-card">
              <div className="tank-card-header">
                <span className="tank-icon">{TANK_ICONS[tank.type] ?? "🪣"}</span>
                <div>
                  <strong>{tank.label}</strong>
                  <span className="pill" style={{ marginLeft: "0.4rem", fontSize: "0.75rem" }}>
                    {TANK_LABELS[tank.type] ?? tank.type}
                  </span>
                </div>
                <span className="tank-capacity">
                  {tank.capacity.toLocaleString("es")} {tank.unit}
                </span>
              </div>
              <TankBar pct={100} />
              {tank.material && (
                <p className="tank-meta">Material: {tank.material}</p>
              )}
              {tank.notes && (
                <p className="tank-meta">{tank.notes}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {(totalDiesel > 0 || totalWater > 0) && (
        <section className="boat-detail-section">
          <h4>Resumen</h4>
          {totalDiesel > 0 && (
            <div className="boat-detail-row">
              <span className="boat-detail-label">Total gasoil</span>
              <span className="boat-detail-value">{totalDiesel.toLocaleString("es")} L</span>
            </div>
          )}
          {totalWater > 0 && (
            <div className="boat-detail-row">
              <span className="boat-detail-label">Total agua dulce</span>
              <span className="boat-detail-value">{totalWater.toLocaleString("es")} L</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
