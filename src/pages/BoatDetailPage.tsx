import { useEffect, useState } from "react";
import type { Boat, BoatDocument } from "../lib/types";
import * as db from "../lib/db";
import { useAuth } from "../providers/AuthProvider";
import { BoatTabGeneral } from "../components/BoatTabGeneral";
import { BoatTabDimensions } from "../components/BoatTabDimensions";
import { BoatTabTanks } from "../components/BoatTabTanks";
import { BoatTabDocuments } from "../components/BoatTabDocuments";
import { flagEmoji } from "../lib/flags";

type Tab = "general" | "dimensions" | "tanks" | "documents";

const TABS: { key: Tab; label: string }[] = [
  { key: "general",    label: "General" },
  { key: "dimensions", label: "Dimensiones" },
  { key: "tanks",      label: "Tanques" },
  { key: "documents",  label: "Documentos" },
];

export function BoatDetailPage({ boat, onBack }: { boat: Boat; onBack: () => void }) {
  const { isSuperuser } = useAuth();
  const [tab, setTab] = useState<Tab>("general");
  const [docs, setDocs] = useState<BoatDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setDocsLoading(true);
    db.fetchBoatDocuments(boat.id)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [boat.id]);

  function refreshDocs() {
    db.fetchBoatDocuments(boat.id).then(setDocs).catch(() => {});
  }

  const flag = boat.flag ? `${flagEmoji(boat.flag)} ` : "";

  return (
    <div className="boat-detail-page">
      {/* ── Header ── */}
      <div className="boat-detail-header">
        <button className="btn-ghost" type="button" onClick={onBack} style={{ fontSize: "0.85rem" }}>
          ← Volver
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{flag}{boat.name}</h2>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.85rem", color: "var(--text-soft)" }}>
            {boat.brandModel ?? boat.boatType ?? ""}
            {boat.registrationNumber ? ` · ${boat.registrationNumber}` : ""}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "documents" && docs.length > 0 && (
              <span className="tab-badge">{docs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="tab-content">
        {tab === "general" && <BoatTabGeneral boat={boat} />}

        {tab === "dimensions" && (
          boat.dimensions
            ? <BoatTabDimensions dims={boat.dimensions} />
            : <p className="data-table-cell-muted">Sin datos de dimensiones registrados.</p>
        )}

        {tab === "tanks" && (
          boat.tanks && boat.tanks.length > 0
            ? <BoatTabTanks tanks={boat.tanks} />
            : <p className="data-table-cell-muted">Sin tanques registrados.</p>
        )}

        {tab === "documents" && (
          docsLoading
            ? <p className="data-table-cell-muted">Cargando…</p>
            : <BoatTabDocuments
                boatId={boat.id}
                docs={docs}
                onRefresh={refreshDocs}
                canEdit={isSuperuser}
              />
        )}
      </div>
    </div>
  );
}
