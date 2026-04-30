import { useEffect, useState } from "react";
import type { Boat, BoatDocument, BoatDimensions, BoatTank, BoatIdentifiers } from "../lib/types";
import * as db from "../lib/db";
import { useAuth } from "../providers/AuthProvider";
import { BoatTabGeneral } from "../components/BoatTabGeneral";
import { BoatTabDimensions } from "../components/BoatTabDimensions";
import { BoatTabTanks } from "../components/BoatTabTanks";
import { BoatTabDocuments } from "../components/BoatTabDocuments";
import { BoatTabPolars } from "../components/BoatTabPolars";
import { BoatTabSails } from "../components/BoatTabSails";
import { EditBoatGeneralModal } from "../components/EditBoatGeneralModal";
import { EditDimensionsModal } from "../components/EditDimensionsModal";
import { EditTanksModal } from "../components/EditTanksModal";
import { EditIdentifiersModal } from "../components/EditIdentifiersModal";
import { flagEmoji } from "../lib/flags";
import { useI18n } from "../lib/i18n";

type Tab = "general" | "dimensions" | "polars" | "sails" | "tanks" | "documents";

export function BoatDetailPage({ boat: initialBoat, onBack, onEditBoat, onBoatUpdated }: {
  boat: Boat;
  onBack: () => void;
  onEditBoat?: (boat: Boat) => void;
  onBoatUpdated?: (boat: Boat) => void;
}) {
  const { canEditBoat } = useAuth();
  const { t } = useI18n();
  const [boat, setBoat] = useState(initialBoat);
  const canEdit = canEditBoat(boat.id);
  const [tab, setTab] = useState<Tab>("general");
  const [docs, setDocs] = useState<BoatDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [editModal, setEditModal] = useState<"general" | "dimensions" | "polars" | "tanks" | "identifiers" | null>(null);

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

  async function saveDimensions(dims: BoatDimensions) {
    await db.updateBoatDimensions(boat.id, dims);
    setBoat((b) => { const updated = { ...b, dimensions: dims }; onBoatUpdated?.(updated); return updated; });
  }

  async function saveTanks(tanks: BoatTank[]) {
    await db.updateBoatTanks(boat.id, tanks);
    setBoat((b) => { const updated = { ...b, tanks }; onBoatUpdated?.(updated); return updated; });
  }

  async function saveIdentifiers(identifiers: BoatIdentifiers) {
    await db.updateBoatIdentifiers(boat.id, identifiers);
    setBoat((b) => { const updated = { ...b, identifiers }; onBoatUpdated?.(updated); return updated; });
  }

  async function saveGeneral(data: Pick<Boat,
    | "name"
    | "identifier"
    | "registrationNumber"
    | "brandModel"
    | "buildYear"
    | "shipyard"
    | "propulsion"
    | "boatType"
    | "engineNotes"
    | "notes"
    | "flag"
  >) {
    const updated = { ...boat, ...data };
    await db.updateBoat(boat.id, updated);
    setBoat(updated);
    onBoatUpdated?.(updated);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "general",    label: t("tabGeneral") },
    { key: "dimensions", label: t("tabDimensions") },
    { key: "polars",     label: t("tabPolars") },
    { key: "sails",      label: t("tabSails") },
    { key: "tanks",      label: t("tabTanks") },
    { key: "documents",  label: t("tabDocuments") },
  ];

  const flag = boat.flag ? `${flagEmoji(boat.flag)} ` : "";

  return (
    <div className="boat-detail-page">
      {/* ── Header ── */}
      <div className="boat-detail-header">
        <button className="btn-ghost" type="button" onClick={onBack} style={{ fontSize: "0.85rem" }}>
          ←
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
        {tab === "general" && (
          <BoatTabGeneral
            boat={boat}
            canEdit={canEdit}
            onEditBoat={() => setEditModal("general")}
            onEditIdentifiers={() => setEditModal("identifiers")}
          />
        )}

        {tab === "dimensions" && (
          <BoatTabDimensions
            dims={boat.dimensions ?? {}}
            canEdit={canEdit}
            onEdit={() => setEditModal("dimensions")}
          />
        )}

        {tab === "sails" && (
          <BoatTabSails
            dims={boat.dimensions ?? {}}
            canEdit={canEdit}
            onEdit={() => setEditModal("dimensions")}
          />
        )}

        {tab === "tanks" && (
          <BoatTabTanks
            tanks={boat.tanks ?? []}
            canEdit={canEdit}
            onEdit={() => setEditModal("tanks")}
          />
        )}

        {tab === "polars" && (
          <BoatTabPolars
            dims={boat.dimensions ?? {}}
            canEdit={canEdit}
            onEdit={() => setEditModal("polars")}
          />
        )}

        {tab === "documents" && (
          docsLoading
            ? <p className="data-table-cell-muted">Cargando…</p>
            : <BoatTabDocuments
                boatId={boat.id}
                docs={docs}
                onRefresh={refreshDocs}
                canEdit={canEdit}
              />
        )}
      </div>

      {/* ── Edit modals ── */}
      {editModal === "general" && (
        <EditBoatGeneralModal
          boat={boat}
          onSave={async (data) => { await saveGeneral(data); setEditModal(null); }}
          onClose={() => setEditModal(null)}
        />
      )}
      {(editModal === "dimensions" || editModal === "polars") && (
        <EditDimensionsModal
          dims={boat.dimensions ?? {}}
          initialTab={editModal === "polars" ? "polar" : "hull"}
          onSave={async (d) => { await saveDimensions(d); setEditModal(null); }}
          onClose={() => setEditModal(null)}
        />
      )}
      {editModal === "tanks" && (
        <EditTanksModal
          tanks={boat.tanks ?? []}
          onSave={async (t) => { await saveTanks(t); setEditModal(null); }}
          onClose={() => setEditModal(null)}
        />
      )}
      {editModal === "identifiers" && (
        <EditIdentifiersModal
          identifiers={boat.identifiers ?? {}}
          onSave={async (ids) => { await saveIdentifiers(ids); setEditModal(null); }}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}
