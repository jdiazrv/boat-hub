import type { Boat } from "../lib/types";
import { flagEmoji } from "../lib/flags";
import { useI18n } from "../lib/i18n";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="boat-detail-row">
      <span className="boat-detail-label">{label}</span>
      <span className="boat-detail-value">{value}</span>
    </div>
  );
}

export function BoatTabGeneral({ boat, canEdit, onEditBoat, onEditIdentifiers }: {
  boat: Boat;
  canEdit?: boolean;
  onEditBoat?: () => void;
  onEditIdentifiers?: () => void;
}) {
  const { t } = useI18n();
  const ids = boat.identifiers;
  const hasIdentifiers = Boolean(ids && Object.values(ids).some((value) => value));

  const BOAT_TYPE_LABELS: Record<string, string> = {
    Sailboat: t("boatTypeSailboat"),
    "Motor yacht": t("boatTypeMotorYacht"),
    Catamaran: t("boatTypeCatamaran"),
    RIB: t("boatTypeRIB"),
    Motorboat: t("boatTypeMotorboat"),
    Other: t("boatTypeOther"),
  };

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <div className="boat-detail-section-head">
          <h4>{t("sectionIdentification")}</h4>
          {canEdit && onEditBoat && (
            <button className="btn-icon" type="button" title={t("editBoatData")} onClick={onEditBoat}>✏</button>
          )}
        </div>
        <Row label={t("fieldName")} value={boat.name} />
        <Row label={t("fieldBrandModel")} value={boat.brandModel} />
        <Row label={t("fieldBoatType")} value={boat.boatType ? (BOAT_TYPE_LABELS[boat.boatType] ?? boat.boatType) : null} />
        <Row label={t("fieldYear")} value={boat.buildYear} />
        <Row label={t("fieldShipyard")} value={boat.shipyard} />
        <Row label={t("fieldRegistration")} value={boat.registrationNumber} />
        <Row label={t("fieldFlag")} value={boat.flag ? `${flagEmoji(boat.flag)} ${boat.flag}` : null} />
        <Row label={t("fieldIdentifier")} value={boat.identifier} />
      </section>

      <section className="boat-detail-section">
        <div className="boat-detail-section-head">
          <h4>{t("sectionIntlIdentifiers")}</h4>
          {canEdit && onEditIdentifiers && (
            <button className="btn-icon" type="button" title={t("editIntlIdentifiers")} onClick={onEditIdentifiers}>✏</button>
          )}
        </div>
        <Row label={t("fieldMMSI")} value={ids?.mmsi} />
        <Row label={t("fieldCallSign")} value={ids?.callSign} />
        <Row label={t("fieldIMO")} value={ids?.imoNumber} />
        <Row label={t("fieldIntNominativo")} value={ids?.intNominativo} />
        <Row label={t("fieldWinCode")} value={ids?.winCode} />
        <Row label={t("fieldAtcnRef")} value={ids?.atcnRef} />
        {!hasIdentifiers && (
          <div className="empty-inline">
            <p className="data-table-cell-muted">{t("noData")}</p>
            {canEdit && onEditIdentifiers && (
              <button className="btn-ghost" type="button" onClick={onEditIdentifiers}>{t("addIdentifiers")}</button>
            )}
          </div>
        )}
      </section>

      <section className="boat-detail-section">
        <div className="boat-detail-section-head">
          <h4>{t("sectionEngineAndPropulsion")}</h4>
          {canEdit && onEditBoat && (
            <button className="btn-icon" type="button" title={t("editEngineData")} onClick={onEditBoat}>✏</button>
          )}
        </div>
        <Row label={t("fieldPropulsion")} value={boat.propulsion} />
        <Row label={t("fieldEngineNotes")} value={boat.engineNotes} />
        {!boat.propulsion && !boat.engineNotes && (
          <div className="empty-inline">
            <p className="data-table-cell-muted">{t("noData")}</p>
            {canEdit && onEditBoat && (
              <button className="btn-ghost" type="button" onClick={onEditBoat}>{t("addEngine")}</button>
            )}
          </div>
        )}
      </section>

      {(boat.notes || canEdit) && (
        <section className="boat-detail-section">
          <div className="boat-detail-section-head">
            <h4>{t("sectionGeneralNotes")}</h4>
            {canEdit && onEditBoat && (
              <button className="btn-icon" type="button" title={t("editGeneralNotes")} onClick={onEditBoat}>✏</button>
            )}
          </div>
          {boat.notes ? (
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{boat.notes}</p>
          ) : (
            <div className="empty-inline">
              <p className="data-table-cell-muted">{t("noNotes")}</p>
              {onEditBoat && (
                <button className="btn-ghost" type="button" onClick={onEditBoat}>{t("addNotes")}</button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
