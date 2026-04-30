import type { BoatTank, TankType } from "../lib/types";
import { useI18n } from "../lib/i18n";

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

export function BoatTabTanks({ tanks, canEdit, onEdit }: {
  tanks: BoatTank[];
  canEdit?: boolean;
  onEdit?: () => void;
}) {
  const { t } = useI18n();

  const TANK_LABELS: Record<TankType, string> = {
    diesel:      t("tankTypeDiesel"),
    fresh_water: t("tankTypeFreshWater"),
    grey_water:  t("tankTypeGreyWater"),
    black_water: t("tankTypeBlackWater"),
    lpg:         t("tankTypeLPG"),
    other:       t("tankTypeOther"),
  };

  const totalDiesel = tanks.filter((t) => t.type === "diesel").reduce((s, t) => s + t.capacity, 0);
  const totalWater  = tanks.filter((t) => t.type === "fresh_water").reduce((s, t) => s + t.capacity, 0);

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <div className="boat-detail-section-head">
          <h4>{t("sectionTankCapacities")}</h4>
          {canEdit && onEdit && (
            <button className="btn-icon" type="button" title={t("editTanks")} onClick={onEdit}>✏</button>
          )}
        </div>

        {tanks.length === 0 && (
          <div className="empty-inline">
            <p className="data-table-cell-muted">{t("noTanks")}</p>
            {canEdit && onEdit && (
              <button className="btn-ghost" type="button" onClick={onEdit}>{t("addTank")}</button>
            )}
          </div>
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
                <p className="tank-meta">{t("tankMaterial")}: {tank.material}</p>
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
          <h4>{t("sectionTankSummary")}</h4>
          {totalDiesel > 0 && (
            <div className="boat-detail-row">
              <span className="boat-detail-label">{t("totalDiesel")}</span>
              <span className="boat-detail-value">{totalDiesel.toLocaleString("es")} L</span>
            </div>
          )}
          {totalWater > 0 && (
            <div className="boat-detail-row">
              <span className="boat-detail-label">{t("totalFreshWater")}</span>
              <span className="boat-detail-value">{totalWater.toLocaleString("es")} L</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
