import { useEffect, useMemo, useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as db from "../lib/db";
import type { BoatSystem } from "../lib/types";
import { FormActions, FormSection, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { sysName, useI18n } from "../lib/i18n";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

export function BoatSystemsPage() {
  const { locale } = useI18n();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const { systemCatalog } = useAppData();
  const [systems, setSystems] = useState<BoatSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogSystemId, setCatalogSystemId] = useState("");
  const [modal, setModal] = useState<"edit" | null>(null);
  const [editing, setEditing] = useState<BoatSystem | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const boatName = activeBoat?.name ?? "Sin barco activo";

  const resolvedSystems = useMemo(
    () =>
      systems.map((s) => {
        if (s.nameEs || s.nameEn) return s;
        const entry = systemCatalog.find((e) => e.id === s.systemId);
        return {
          ...s,
          systemCode: entry?.code ?? s.systemCode,
          nameEs: entry?.name_es ?? s.nameEs,
          nameEn: entry?.name_en ?? s.nameEn,
        };
      }),
    [systemCatalog, systems]
  );

  const availableCatalogSystems = loading
    ? []
    : systemCatalog.filter((e) => !systems.some((s) => s.systemId === e.id));

  async function load(boatId: string) {
    setLoading(true);
    try {
      setSystems(await db.fetchBoatSystems(boatId));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeBoatId) return;
    void load(activeBoatId);
  }, [activeBoatId]);

  async function handleAddSystem() {
    if (!activeBoatId || !catalogSystemId) return;
    setSaving(true); setError(null);
    try {
      await db.addBoatSystem(activeBoatId, catalogSystemId);
      setCatalogSystemId("");
      await load(activeBoatId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir sistema");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(sys: BoatSystem) {
    setEditing(sys);
    setEditNotes(sys.notes ?? "");
    setError(null);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  async function handleSaveEdit() {
    if (!editing || !activeBoatId) return;
    setSaving(true); setError(null);
    try {
      await db.updateBoatSystem(editing.id, editNotes || null);
      await load(activeBoatId);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || !activeBoatId) return;
    if (!confirm(`¿Quitar el sistema "${sysName(editing, locale)}" de este barco? Se eliminará la asociación con las tareas e inventario de este sistema.`)) return;
    setSaving(true); setError(null);
    try {
      await db.removeBoatSystem(editing.id);
      await load(activeBoatId);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar sistema");
    } finally {
      setSaving(false);
    }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">Sistemas</span>
          <h2>Sistemas del barco</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco en la barra lateral para ver sus sistemas.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">Sistemas · {boatName}</span>
          <h2>Sistemas del barco</h2>
        </div>
        {availableCatalogSystems.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <select
              className="form-input form-select"
              value={catalogSystemId}
              onChange={(e) => setCatalogSystemId(e.target.value)}
              style={{ minWidth: "16rem" }}
            >
              <option value="">Añadir sistema del catálogo…</option>
              {availableCatalogSystems.map((s) => (
                <option key={s.id} value={s.id}>{locale === 'en' ? (s.name_en || s.name_es) : (s.name_es || s.name_en)}</option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={() => void handleAddSystem()}
              type="button"
              disabled={!catalogSystemId || saving || loading}
            >
              Añadir
            </button>
          </div>
        )}
      </div>

      {error && <div className="banner warning-banner"><strong>Error</strong><span>{error}</span></div>}

      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1fr 0.4fr auto" }}>
            <span>Sistema</span>
            <span>Inventario</span>
            <span></span>
          </div>
          {!loading && resolvedSystems.length === 0 && (
            <div className="empty-state">
              <p>Este barco todavía no tiene sistemas asignados. Añade uno desde el catálogo.</p>
            </div>
          )}
          {resolvedSystems.map((sys) => (
            <div className="data-table-row" key={sys.id} style={{ gridTemplateColumns: "1fr 0.4fr auto" }}>
              <div>
                <strong style={{ display: "block" }}>{sysName(sys, locale)}</strong>
                {sys.notes && <span className="data-table-cell-muted">{sys.notes}</span>}
              </div>
              <span>
                <span className="pill">{sys.inventoryCount ?? 0}</span>
              </span>
              <div className="row-actions">
                <button className="btn-icon" onClick={() => openEdit(sys)} type="button" title="Editar">✏</button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {modal === "edit" && editing && (
        <Modal title={`Editar sistema · ${sysName(editing, locale)}`} onClose={closeModal}>
          <form className="form-stack" onSubmit={(e) => { e.preventDefault(); void handleSaveEdit(); }}>
            <FormSection title="Sistema">
              <p style={{ color: "var(--text-soft)", fontSize: "0.875rem" }}>
                El sistema proviene del catálogo global y no puede modificarse. Solo puedes editar las notas de este sistema en el barco.
              </p>
              <TextareaField
                label="Notas"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </FormSection>
            {error && <p className="form-error">{error}</p>}
            <FormActions
              onCancel={closeModal}
              loading={saving}
              danger
              onDanger={handleDelete}
              dangerLabel="Quitar sistema del barco"
            />
          </form>
        </Modal>
      )}
    </section>
  );
}
