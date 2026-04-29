import { useEffect, useState } from "react";
import type { Boat, BoatDocument, BoatDimensions, BoatTank, BoatIdentifiers } from "../lib/types";
import * as db from "../lib/db";
import { useAuth } from "../providers/AuthProvider";
import { BoatTabGeneral } from "../components/BoatTabGeneral";
import { BoatTabDimensions } from "../components/BoatTabDimensions";
import { BoatTabTanks } from "../components/BoatTabTanks";
import { BoatTabDocuments } from "../components/BoatTabDocuments";
import { EditDimensionsModal } from "../components/EditDimensionsModal";
import { EditTanksModal } from "../components/EditTanksModal";
import { EditIdentifiersModal } from "../components/EditIdentifiersModal";
import { flagEmoji } from "../lib/flags";

type Tab = "general" | "dimensions" | "tanks" | "documents";

const TABS: { key: Tab; label: string }[] = [
  { key: "general",    label: "General" },
  { key: "dimensions", label: "Dimensiones" },
  { key: "tanks",      label: "Tanques" },
  { key: "documents",  label: "Documentos" },
];

export function BoatDetailPage({ boat: initialBoat, onBack, onEditBoat, onBoatUpdated }: {
  boat: Boat;
  onBack: () => void;
  onEditBoat?: (boat: Boat) => void;
  onBoatUpdated?: (boat: Boat) => void;
}) {
  const { canEditBoat } = useAuth();
  const [boat, setBoat] = useState(initialBoat);
  const canEdit = canEditBoat(boat.id);
  const [tab, setTab] = useState<Tab>("general");
  const [docs, setDocs] = useState<BoatDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [editModal, setEditModal] = useState<"dimensions" | "tanks" | "identifiers" | null>(null);

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
        {tab === "general" && (
          <BoatTabGeneral
            boat={boat}
            canEdit={canEdit}
            onEditBoat={onEditBoat ? () => onEditBoat(boat) : undefined}
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

        {tab === "tanks" && (
          <BoatTabTanks
            tanks={boat.tanks ?? []}
            canEdit={canEdit}
            onEdit={() => setEditModal("tanks")}
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
      {editModal === "dimensions" && (
        <EditDimensionsModal
          dims={boat.dimensions ?? {}}
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
