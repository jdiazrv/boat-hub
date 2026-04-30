import type { BoatDimensions, SailInventoryItem } from "../lib/types";
import { OrcDiagram } from "./OrcDiagram";
import { useI18n } from "../lib/i18n";

const WIND_SPEEDS = [6, 8, 10, 12, 14, 16, 20];

function Row({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="boat-detail-row">
      <span className="boat-detail-label">{label}</span>
      <span className="boat-detail-value">{value}{unit ? <span style={{ opacity: 0.6, fontSize: "0.85em", marginLeft: 2 }}>{unit}</span> : null}</span>
    </div>
  );
}

function Section({ title, values, noDataLabel, children }: { title: string; values: unknown[]; noDataLabel: string; children: React.ReactNode }) {
  const hasData = values.some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== "";
  });
  return (
    <section className="boat-detail-section">
      <h4>{title}</h4>
      {hasData ? children : <p className="data-table-cell-muted">{noDataLabel}</p>}
    </section>
  );
}

function SailRow({ sail, labels }: { sail: SailInventoryItem; labels: Record<string, string> }) {
  return (
    <div className="sail-row">
      <div className="sail-row-header">
        <strong>{sail.label}</strong>
        <span className="pill" style={{ fontSize: "0.75rem" }}>{labels[sail.sailType] ?? sail.sailType}</span>
        {sail.condition && <span className="pill" style={{ fontSize: "0.72rem", opacity: 0.7 }}>{labels[sail.condition] ?? sail.condition}</span>}
      </div>
      <div className="sail-row-details">
        {sail.area      != null && <span>{labels.area}: <strong>{sail.area} m²</strong></span>}
        {sail.luff      != null && <span>{labels.luff}: <strong>{sail.luff} m</strong></span>}
        {sail.foot      != null && <span>{labels.foot}: <strong>{sail.foot} m</strong></span>}
        {sail.leech     != null && <span>{labels.leech}: <strong>{sail.leech} m</strong></span>}
        {sail.slu       != null && <span>SLU: <strong>{sail.slu} m</strong></span>}
        {sail.sle       != null && <span>SLE: <strong>{sail.sle} m</strong></span>}
        {sail.sl        != null && <span>SL: <strong>{sail.sl} m</strong></span>}
        {sail.shw       != null && <span>SHW: <strong>{sail.shw} m</strong></span>}
        {sail.sfl       != null && <span>SFL: <strong>{sail.sfl} m</strong></span>}
        {sail.material  && <span>{labels.material}: <strong>{sail.material}</strong></span>}
        {sail.year      != null && <span>{labels.year}: <strong>{sail.year}</strong></span>}
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
  const { t } = useI18n();
  const safeDims = dims ?? {};
  const sails = safeDims.sails ?? [];
  const hasPolar = safeDims.polarRows && safeDims.polarRows.length > 0;
  const winds = safeDims.polarWindSpeeds ?? WIND_SPEEDS;
  const hasAnyDimension = Object.values(safeDims).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== "";
  });

  const sailTypeLabels: Record<string, string> = {
    mainsail:       t("fieldMainsailArea"),
    headsail:       t("fieldHeadsailArea"),
    spinnaker_sym:  "Spinnaker simétrico",
    spinnaker_asym: "Spinnaker asimétrico",
    code_zero:      "Code Zero",
    gennaker:       "Gennaker",
    trysail:        "Trysail",
    storm_jib:      "Storm jib",
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

  const noData = t("noData");

  return (
    <div className="boat-detail-sections">
      {/* ── Tab header ──────────────────────────────────────────────── */}
      {canEdit && onEdit && (
        <div className="boat-detail-section-head" style={{ marginBottom: "0.5rem" }}>
          <span />
          <button
            className={hasAnyDimension ? "btn-icon" : "btn-ghost"}
            type="button"
            title={t("editDimensions")}
            onClick={onEdit}
          >
            {hasAnyDimension ? "✏" : t("addDimensions")}
          </button>
        </div>
      )}

      {/* ── Diagram ─────────────────────────────────────────────────── */}
      <section className="boat-detail-section boat-detail-section--diagram">
        <h4 style={{ margin: 0, marginBottom: "0.5rem" }}>{t("sectionRigDiagram")}</h4>
        <OrcDiagram dims={safeDims} />
      </section>

      {/* ── Class / Builder ───────────────────────────────────────────── */}
      <Section title={t("sectionClassBuilder")} noDataLabel={noData} values={[safeDims.designer, safeDims.builder, safeDims.seriesDate, safeDims.hullConstruction]}>
        <Row label={t("fieldDesigner")} value={safeDims.designer} />
        <Row label={t("fieldBuilder")} value={safeDims.builder} />
        <Row label={t("fieldSeriesDate")} value={safeDims.seriesDate} />
        <Row label={t("fieldHullConstruction")} value={safeDims.hullConstruction} />
      </Section>

      {/* ── Hull ──────────────────────────────────────────────────────── */}
      <Section title={t("sectionHull")} noDataLabel={noData} values={[safeDims.loa, safeDims.maxBeam, safeDims.draft, safeDims.displacement]}>
        <Row label={t("fieldLOA")} value={safeDims.loa} unit="m" />
        <Row label={t("fieldMaxBeam")} value={safeDims.maxBeam} unit="m" />
        <Row label={t("fieldDraft")} value={safeDims.draft} unit="m" />
        <Row label={t("fieldDisplacement")} value={safeDims.displacement != null ? safeDims.displacement.toLocaleString("es") : null} unit="kg" />
      </Section>

      {/* ── Propeller ─────────────────────────────────────────────────── */}
      <Section title={t("sectionPropeller")} noDataLabel={noData} values={[safeDims.propellerType, safeDims.propellerDiameter]}>
        <Row label={t("fieldPropellerType")} value={safeDims.propellerType} />
        <Row label={t("fieldPropellerDiameter")} value={safeDims.propellerDiameter} unit="m" />
      </Section>

      {/* ── Crew ──────────────────────────────────────────────────────── */}
      <Section title={t("sectionCrew")} noDataLabel={noData} values={[safeDims.crewMaxWeight, safeDims.crewMinWeight]}>
        <Row label={t("fieldCrewMaxWeight")} value={safeDims.crewMaxWeight} unit="kg" />
        <Row label={t("fieldCrewMinWeight")} value={safeDims.crewMinWeight} unit="kg" />
      </Section>

      {/* ── Rig ───────────────────────────────────────────────────────── */}
      <Section title={t("sectionRig")} noDataLabel={noData} values={[safeDims.P, safeDims.E, safeDims.IG, safeDims.ISP, safeDims.J, safeDims.BAS, safeDims.TPS, safeDims.spreadersCount, safeDims.carbonMast, safeDims.headsailFurler, safeDims.mainsailFurler]}>
        <Row label={t("fieldP")} value={safeDims.P} unit="m" />
        <Row label={t("fieldE")} value={safeDims.E} unit="m" />
        <Row label={t("fieldIG")} value={safeDims.IG} unit="m" />
        <Row label={t("fieldISP")} value={safeDims.ISP} unit="m" />
        <Row label={t("fieldJ")} value={safeDims.J} unit="m" />
        <Row label={t("fieldBAS")} value={safeDims.BAS} unit="m" />
        <Row label={t("fieldTPS")} value={safeDims.TPS} unit="m" />
        <Row label={t("fieldSpreadersCount")} value={safeDims.spreadersCount} />
        <Row label={t("fieldCarbonMast")} value={safeDims.carbonMast ? t("yes") : safeDims.carbonMast === false ? t("no") : null} />
        <Row label={t("fieldHeadsailFurler")} value={safeDims.headsailFurler ? t("yes") : safeDims.headsailFurler === false ? t("no") : null} />
        <Row label={t("fieldMainsailFurler")} value={safeDims.mainsailFurler ? t("yes") : safeDims.mainsailFurler === false ? t("no") : null} />
      </Section>

      {/* ── Sail areas ────────────────────────────────────────────────── */}
      <Section title={t("sectionSailAreas")} noDataLabel={noData} values={[safeDims.mainsailMeasured, safeDims.headsailMeasured, safeDims.asymmetricMeasured]}>
        <Row label={t("fieldMainsailArea")} value={safeDims.mainsailMeasured} unit="m²" />
        <Row label={t("fieldHeadsailArea")} value={safeDims.headsailMeasured} unit="m²" />
        <Row label={t("fieldAsymmetricArea")} value={safeDims.asymmetricMeasured} unit="m²" />
      </Section>

      {/* ── Sail inventory ────────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>{t("sectionSailInventory")}</h4>
        {sails.length > 0 ? (
          <div className="sail-list">
            {sails.map((s) => <SailRow key={s.id} sail={s} labels={sailTypeLabels} />)}
          </div>
        ) : (
          <p className="data-table-cell-muted">{noData}</p>
        )}
      </section>

      {/* ── VPP Polar table ───────────────────────────────────────────── */}
      <section className="boat-detail-section">
        <h4>{t("sectionPolarTable")}</h4>
        {hasPolar ? (
          <div style={{ overflowX: "auto" }}>
            <table className="polar-table">
              <thead>
                <tr>
                  <th>TWA</th>
                  {winds.map((w) => <th key={w}>{w} kt</th>)}
                </tr>
              </thead>
              <tbody>
                {safeDims.polarBeatAngles && (
                  <tr className="polar-row-beat">
                    <td>↑ {safeDims.polarBeatAngles.map((a) => `${a}°`).join(" / ")}</td>
                    {(safeDims.polarBeatVmg ?? []).map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )}
                {safeDims.polarRows!.map((row) => (
                  <tr key={row.twa}>
                    <td><strong>{row.twa}°</strong></td>
                    {row.speeds.map((s, i) => <td key={i}>{s}</td>)}
                  </tr>
                ))}
                {safeDims.polarRunVmg && (
                  <tr className="polar-row-run">
                    <td>↓ {t("polarRunVmg")}</td>
                    {safeDims.polarRunVmg.map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="data-table-cell-muted">{t("noPolarData")}</p>
        )}
      </section>
    </div>
  );
}
