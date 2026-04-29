import { useState } from "react";
import type { BoatDocument, BoatDocType } from "../lib/types";
import * as db from "../lib/db";
import { InputField, SelectField, TextareaField } from "./FormField";
import { Modal } from "./Modal";

const DOC_TYPE_LABELS: Record<BoatDocType, string> = {
  insurance:      "Seguro",
  tepai:          "TEPAI (inspección técnica)",
  seaworthiness:  "Certificado de navegabilidad",
  vhf_license:    "Licencia VHF",
  customs:        "Despacho de aduanas",
  crew_list:      "Rol de tripulación",
  radio_license:  "Licencia de estación radio",
  safety_cert:    "Certificado de seguridad",
  other:          "Otro documento",
};

const DOC_TYPES = Object.entries(DOC_TYPE_LABELS) as [BoatDocType, string][];

function expiryStatus(date: string | null): "ok" | "soon" | "expired" | null {
  if (!date) return null;
  const diff = (new Date(date).getTime() - Date.now()) / 86400000;
  if (diff < 0)   return "expired";
  if (diff < 60)  return "soon";
  return "ok";
}

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  ok:      { label: "Vigente",  color: "var(--green, #22c55e)" },
  soon:    { label: "Caduca",   color: "var(--yellow, #eab308)" },
  expired: { label: "Caducado", color: "var(--red, #ef4444)" },
};

const EMPTY_DOC: Omit<BoatDocument, "id" | "createdAt"> = {
  boatId: "",
  docType: "insurance",
  label: "",
  storagePath: null,
  expiryDate: null,
  issuedDate: null,
  issuer: null,
  notes: null,
};

export function BoatTabDocuments({ boatId, docs, onRefresh, canEdit }: {
  boatId: string;
  docs: BoatDocument[];
  onRefresh: () => void;
  canEdit: boolean;
}) {
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<BoatDocument | null>(null);
  const [form, setForm] = useState<Omit<BoatDocument, "id" | "createdAt">>(EMPTY_DOC);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm({ ...EMPTY_DOC, boatId });
    setEditing(null);
    setFile(null);
    setError(null);
    setModal("create");
  }

  function openEdit(doc: BoatDocument) {
    setForm({
      boatId: doc.boatId,
      docType: doc.docType,
      label: doc.label,
      storagePath: doc.storagePath,
      expiryDate: doc.expiryDate,
      issuedDate: doc.issuedDate,
      issuer: doc.issuer,
      notes: doc.notes,
    });
    setEditing(doc);
    setFile(null);
    setError(null);
    setModal("edit");
  }

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let storagePath = form.storagePath;
      if (file) {
        storagePath = await db.uploadBoatDocument(boatId, file);
      }
      await db.upsertBoatDocument(boatId, {
        ...form,
        storagePath,
        id: editing?.id,
      });
      onRefresh();
      setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`¿Eliminar "${editing.label}"?`)) return;
    setSaving(true);
    try {
      await db.deleteBoatDocument(editing.id);
      onRefresh();
      setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen(doc: BoatDocument) {
    if (!doc.storagePath) return;
    try {
      const url = await db.getBoatDocumentUrl(doc.storagePath);
      window.open(url, "_blank");
    } catch {
      alert("No se pudo abrir el documento.");
    }
  }

  // Group docs by type
  const grouped = DOC_TYPES.map(([type, label]) => ({
    type, label,
    items: docs.filter((d) => d.docType === type),
  })).filter((g) => g.items.length > 0);

  const otherItems = docs.filter((d) => !DOC_TYPES.some(([t]) => t === d.docType));

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h4 style={{ margin: 0 }}>Documentación</h4>
          {canEdit && (
            <button className="btn-primary" type="button" style={{ fontSize: "0.85rem" }} onClick={openCreate}>
              + Añadir
            </button>
          )}
        </div>

        {docs.length === 0 && (
          <p className="data-table-cell-muted">Sin documentos registrados.</p>
        )}

        {grouped.map((g) => (
          <div key={g.type} style={{ marginBottom: "0.75rem" }}>
            <div className="schedule-category-header">{g.label}</div>
            {g.items.map((doc) => <DocRow key={doc.id} doc={doc} canEdit={canEdit} onEdit={openEdit} onOpen={handleOpen} />)}
          </div>
        ))}

        {otherItems.length > 0 && (
          <div>
            <div className="schedule-category-header">Otros</div>
            {otherItems.map((doc) => <DocRow key={doc.id} doc={doc} canEdit={canEdit} onEdit={openEdit} onOpen={handleOpen} />)}
          </div>
        )}
      </section>

      {modal && (
        <Modal
          title={modal === "create" ? "Nuevo documento" : "Editar documento"}
          onClose={() => setModal(null)}
          wide
        >
          <div className="form-stack">
            <SelectField label="Tipo" value={form.docType} onChange={(e) => set("docType", e.target.value as BoatDocType)}>
              {DOC_TYPES.map(([t, l]) => <option key={t} value={t}>{l}</option>)}
            </SelectField>
            <InputField label="Título / Descripción" required value={form.label} onChange={(e) => set("label", e.target.value)} />
            <InputField label="Emisor / Entidad" value={form.issuer ?? ""} onChange={(e) => set("issuer", e.target.value || null)} />
            <InputField label="Fecha de emisión" type="date" value={form.issuedDate ?? ""} onChange={(e) => set("issuedDate", e.target.value || null)} />
            <InputField label="Fecha de caducidad" type="date" value={form.expiryDate ?? ""} onChange={(e) => set("expiryDate", e.target.value || null)} />
            <div>
              <label className="form-label">Archivo PDF</label>
              <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: "block", marginTop: "0.25rem", fontSize: "0.9rem" }} />
              {form.storagePath && !file && (
                <p style={{ fontSize: "0.8rem", marginTop: "0.25rem", color: "var(--text-soft)" }}>Ya hay un archivo subido. Selecciona uno nuevo para reemplazarlo.</p>
              )}
            </div>
            <TextareaField label="Notas" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              {editing && (
                <button className="btn-danger" type="button" onClick={handleDelete} disabled={saving}>Eliminar</button>
              )}
              <button className="btn-ghost" type="button" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary" type="button" onClick={handleSave} disabled={saving || !form.label}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DocRow({ doc, canEdit, onEdit, onOpen }: {
  doc: BoatDocument;
  canEdit: boolean;
  onEdit: (d: BoatDocument) => void;
  onOpen: (d: BoatDocument) => void;
}) {
  const st = expiryStatus(doc.expiryDate);
  const pill = st ? STATUS_PILL[st] : null;
  return (
    <div className="doc-row">
      <div className="doc-row-main">
        <span className="doc-row-label">{doc.label}</span>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
          {pill && (
            <span className="pill" style={{ fontSize: "0.72rem", background: pill.color, color: "#fff" }}>{pill.label}</span>
          )}
          {doc.expiryDate && (
            <span style={{ fontSize: "0.78rem", color: "var(--text-soft)" }}>
              Caduca: {new Date(doc.expiryDate).toLocaleDateString("es")}
            </span>
          )}
          {doc.storagePath && (
            <button className="btn-icon" type="button" title="Abrir PDF" onClick={() => onOpen(doc)}>📄</button>
          )}
          {canEdit && (
            <button className="btn-icon" type="button" title="Editar" onClick={() => onEdit(doc)}>✏</button>
          )}
        </div>
      </div>
      {doc.issuer && <p className="doc-row-meta">Emisor: {doc.issuer}</p>}
    </div>
  );
}
