import { useState } from "react";
import type { BoatDocument, BoatDocType } from "../lib/types";
import * as db from "../lib/db";
import { InputField, SelectField, TextareaField } from "./FormField";
import { Modal } from "./Modal";
import { useI18n } from "../lib/i18n";

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

function expiryStatus(date: string | null): "ok" | "soon" | "expired" | null {
  if (!date) return null;
  const diff = (new Date(date).getTime() - Date.now()) / 86400000;
  if (diff < 0)   return "expired";
  if (diff < 60)  return "soon";
  return "ok";
}

export function BoatTabDocuments({ boatId, docs, onRefresh, canEdit }: {
  boatId: string;
  docs: BoatDocument[];
  onRefresh: () => void;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<BoatDocument | null>(null);
  const [form, setForm] = useState<Omit<BoatDocument, "id" | "createdAt">>(EMPTY_DOC);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DOC_TYPE_LABELS: Record<BoatDocType, string> = {
    insurance:      t("docTypeInsurance"),
    tepai:          t("docTypeTepai"),
    seaworthiness:  t("docTypeSeaworthiness"),
    vhf_license:    t("docTypeVHF"),
    customs:        t("docTypeCustoms"),
    crew_list:      t("docTypeCrewList"),
    radio_license:  t("docTypeRadioLicense"),
    safety_cert:    t("docTypeSafetyCert"),
    other:          t("docTypeOther"),
  };
  const DOC_TYPES = Object.entries(DOC_TYPE_LABELS) as [BoatDocType, string][];

  const STATUS_PILL: Record<string, { label: string; color: string }> = {
    ok:      { label: t("docStatusValid"),   color: "var(--green, #22c55e)" },
    soon:    { label: t("docStatusSoon"),    color: "var(--yellow, #eab308)" },
    expired: { label: t("docStatusExpired"), color: "var(--red, #ef4444)" },
  };

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
      setError(e instanceof Error ? e.message : t("saving"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`${t("confirmDeleteDoc")} "${editing.label}"?`)) return;
    setSaving(true);
    try {
      await db.deleteBoatDocument(editing.id);
      onRefresh();
      setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saving"));
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen(doc: BoatDocument) {
    if (!doc.storagePath) return;
    // Open the window synchronously (before any await) to avoid popup blockers,
    // then navigate it once the signed URL is ready.
    const win = window.open("", "_blank");
    try {
      const url = await db.getBoatDocumentUrl(doc.storagePath);
      if (win) win.location.href = url;
    } catch {
      win?.close();
      alert(t("noData"));
    }
  }

  const grouped = DOC_TYPES.map(([type, label]) => ({
    type, label,
    items: docs.filter((d) => d.docType === type),
  })).filter((g) => g.items.length > 0);

  const otherItems = docs.filter((d) => !DOC_TYPES.some(([tp]) => tp === d.docType));

  return (
    <div className="boat-detail-sections">
      <section className="boat-detail-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h4 style={{ margin: 0 }}>{t("sectionDocumentation")}</h4>
          {canEdit && (
            <button className="btn-primary" type="button" style={{ fontSize: "0.85rem" }} onClick={openCreate}>
              + {t("add")}
            </button>
          )}
        </div>

        {docs.length === 0 && (
          <p className="data-table-cell-muted">{t("noDocuments")}</p>
        )}

        {grouped.map((g) => (
          <div key={g.type} style={{ marginBottom: "0.75rem" }}>
            <div className="schedule-category-header">{g.label}</div>
            {g.items.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                canEdit={canEdit}
                onEdit={openEdit}
                onOpen={handleOpen}
                statusPill={STATUS_PILL}
                tExpires={t("docExpires")}
                tIssuer={t("docIssuer")}
              />
            ))}
          </div>
        ))}

        {otherItems.length > 0 && (
          <div>
            <div className="schedule-category-header">{t("docTypeOthers")}</div>
            {otherItems.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                canEdit={canEdit}
                onEdit={openEdit}
                onOpen={handleOpen}
                statusPill={STATUS_PILL}
                tExpires={t("docExpires")}
                tIssuer={t("docIssuer")}
              />
            ))}
          </div>
        )}
      </section>

      {modal && (
        <Modal
          title={modal === "create" ? t("newDocument") : t("editDocument")}
          onClose={() => setModal(null)}
          wide
        >
          <div className="form-stack">
            <SelectField label={t("kind")} value={form.docType} onChange={(e) => set("docType", e.target.value as BoatDocType)}>
              {DOC_TYPES.map(([tp, l]) => <option key={tp} value={tp}>{l}</option>)}
            </SelectField>
            <InputField label={t("docFieldTitle")} required value={form.label} onChange={(e) => set("label", e.target.value)} />
            <InputField label={t("docFieldIssuer")} value={form.issuer ?? ""} onChange={(e) => set("issuer", e.target.value || null)} />
            <InputField label={t("docFieldIssuedDate")} type="date" value={form.issuedDate ?? ""} onChange={(e) => set("issuedDate", e.target.value || null)} />
            <InputField label={t("docFieldExpiryDate")} type="date" value={form.expiryDate ?? ""} onChange={(e) => set("expiryDate", e.target.value || null)} />
            <div>
              <label className="form-label">{t("docFieldFile")}</label>
              <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: "block", marginTop: "0.25rem", fontSize: "0.9rem" }} />
              {form.storagePath && !file && (
                <p style={{ fontSize: "0.8rem", marginTop: "0.25rem", color: "var(--text-soft)" }}>{t("docFileAlreadyUploaded")}</p>
              )}
            </div>
            <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              {editing && (
                <button className="btn-danger" type="button" onClick={handleDelete} disabled={saving}>{t("delete")}</button>
              )}
              <button className="btn-ghost" type="button" onClick={() => setModal(null)}>{t("cancel")}</button>
              <button className="btn-primary" type="button" onClick={handleSave} disabled={saving || !form.label}>
                {saving ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DocRow({ doc, canEdit, onEdit, onOpen, statusPill, tExpires, tIssuer }: {
  doc: BoatDocument;
  canEdit: boolean;
  onEdit: (d: BoatDocument) => void;
  onOpen: (d: BoatDocument) => void;
  statusPill: Record<string, { label: string; color: string }>;
  tExpires: string;
  tIssuer: string;
}) {
  const st = expiryStatus(doc.expiryDate);
  const pill = st ? statusPill[st] : null;
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
              {tExpires} {new Date(doc.expiryDate).toLocaleDateString("es")}
            </span>
          )}
          {doc.storagePath && (
            <button className="btn-icon" type="button" title="PDF" onClick={() => onOpen(doc)}>📄</button>
          )}
          {canEdit && (
            <button className="btn-icon" type="button" onClick={() => onEdit(doc)}>✏</button>
          )}
        </div>
      </div>
      {doc.issuer && <p className="doc-row-meta">{tIssuer} {doc.issuer}</p>}
    </div>
  );
}
