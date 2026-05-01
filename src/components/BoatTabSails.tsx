import type { BoatDimensions, SailInventoryItem } from "../lib/types";
import { useI18n } from "../lib/i18n";

function SailRow({ sail, labels }: { sail: SailInventoryItem; labels: Record<string, string> }) {
  return (
    <div className="sail-row">
      <div className="sail-row-header">
        <strong>{sail.label}</strong>
        <span className="pill" style={{ fontSize: "0.75rem" }}>{labels[sail.sailType] ?? sail.sailType}</span>
        {sail.condition && <span className="pill" style={{ fontSize: "0.72rem", opacity: 0.7 }}>{labels[sail.condition] ?? sail.condition}</span>}
      </div>
      <div className="sail-row-details">
        {sail.area     != null && <span>{labels.area}: <strong>{sail.area} m²</strong></span>}
        {sail.luff     != null && <span>{labels.luff}: <strong>{sail.luff} m</strong></span>}
        {sail.foot     != null && <span>{labels.foot}: <strong>{sail.foot} m</strong></span>}
        {sail.leech    != null && <span>{labels.leech}: <strong>{sail.leech} m</strong></span>}
        {sail.slu      != null && <span>SLU: <strong>{sail.slu} m</strong></span>}
        {sail.sle      != null && <span>SLE: <strong>{sail.sle} m</strong></span>}
        {sail.sl       != null && <span>SL: <strong>{sail.sl} m</strong></span>}
        {sail.shw      != null && <span>SHW: <strong>{sail.shw} m</strong></span>}
        {sail.sfl      != null && <span>SFL: <strong>{sail.sfl} m</strong></span>}
        {sail.material && <span>{labels.material}: <strong>{sail.material}</strong></span>}
        {sail.year     != null && <span>{labels.year}: <strong>{sail.year}</strong></span>}
      </div>
      {sail.notes && <p className="sail-row-notes">{sail.notes}</p>}
    </div>
  );
}

export function BoatTabSails({ dims, canEdit, onEdit }: {
  dims: BoatDimensions;
  canEdit?: boolean;
  onEdit?: () => void;
}) {
  const { t } = useI18n();
  const sails = dims?.sails ?? [];

  const labels: Record<string, string> = {
    mainsail:       t("fieldMainsailArea"),
    headsail:       t("fieldHeadsailArea"),
    spinnaker_sym:  t("sailSpinnakerSym"),
    spinnaker_asym: t("sailSpinnakerAsym"),
    code_zero:      t("sailCodeZero"),
    gennaker:       t("sailGennaker"),
    trysail:        t("sailTrysail"),
    storm_jib:      t("sailStormJib"),
    other:          t("boatTypeOther"),
    new:            t("sailConditionNew"),
    good:           t("sailConditionGood"),
    fair:           t("sailConditionFair"),
    worn:           t("sailConditionWorn"),
    area:           t("fieldArea"),
    luff:           t("fieldLuff"),
    foot:           t("fieldFoot"),
    leech:          t("fieldLeech"),
    material:       t("fieldMaterial"),
    year:           t("fieldSailYear"),
  };

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <div className="boat-detail-section-head">
          <h4>{t("sectionSailInventory")}</h4>
          {canEdit && onEdit && (
            <button className="btn-icon" type="button" title={t("editDimensions")} onClick={onEdit}>✏</button>
          )}
        </div>
        {sails.length > 0 ? (
          <div className="sail-list">
            {sails.map((s) => <SailRow key={s.id} sail={s} labels={labels} />)}
          </div>
        ) : (
          <div className="empty-inline">
            <p className="data-table-cell-muted">{t("noData")}</p>
            {canEdit && onEdit && (
              <button className="btn-ghost" type="button" onClick={onEdit}>+ {t("addSail")}</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
