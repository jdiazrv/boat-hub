import type { BoatDimensions } from "../lib/types";
import { OrcDiagram } from "./OrcDiagram";
import { useI18n } from "../lib/i18n";

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


export function BoatTabDimensions({ dims, canEdit, onEdit }: {
  dims: BoatDimensions;
  canEdit?: boolean;
  onEdit?: () => void;
}) {
  const { t } = useI18n();
  const safeDims = dims ?? {};
  const hasAnyDimension = Object.values(safeDims).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== "";
  });

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


    </div>
  );
}
