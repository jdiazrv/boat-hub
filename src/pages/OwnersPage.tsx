import { useState } from "react";
import * as db from "../lib/db";
import type { Owner } from "../lib/types";
import { FormActions, FormSection, InputField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAppData } from "../providers/AppDataProvider";

const EMPTY: Omit<Owner, "id"> = { name: "", notes: null };

function OwnerForm({
  initial, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<Owner, "id">;
  onSave: (d: Omit<Owner, "id">) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const { t } = useI18n();

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection>
        <InputField label={t("name")} required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))} />
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function OwnersPage() {
  const { t } = useI18n();
  const { owners, refresh, loading } = useAppData();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(o: Owner) { setEditing(o); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(data: Omit<Owner, "id">) {
    setSaving(true); setError(null);
    try {
      if (editing) await db.updateOwner(editing.id, data);
      else await db.createOwner(data);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar "${editing.name}"?`)) return;
    setSaving(true);
    try { await db.deleteOwner(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("owners")}</span>
          <h2>Armadores</h2>
        </div>
        {isSupabaseConfigured && (
          <button className="btn-primary" onClick={openCreate} type="button">+ {t("newOwner")}</button>
        )}
      </div>

      {!isSupabaseConfigured && (
        <div className="banner warning-banner"><p>Modo demo — conecta Supabase para gestionar armadores.</p></div>
      )}

      <article className="panel-card">
        <div className="data-table" style={{ "--cols": "1fr auto" } as React.CSSProperties}>
          <div className="data-table-head" style={{ gridTemplateColumns: "1fr auto" }}>
            <span>Nombre</span>
            <span></span>
          </div>
          {owners.length === 0 && !loading && (
            <div className="empty-state"><p>No hay armadores registrados.</p></div>
          )}
          {owners.map((o) => (
            <div className="data-table-row" key={o.id} style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                <strong>{o.name}</strong>
                {o.notes && <p className="data-table-cell-muted" style={{ margin: "0.2rem 0 0" }}>{o.notes}</p>}
              </div>
              <div className="row-actions">
                <button className="btn-icon" onClick={() => openEdit(o)} type="button" title="Editar">✏</button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {modal && (
        <Modal title={modal === "create" ? t("newOwner") : t("editOwner")} onClose={closeModal}>
          <OwnerForm
            initial={editing ? { name: editing.name, notes: editing.notes } : EMPTY}
            onSave={handleSave} onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal} loading={saving} error={error}
          />
        </Modal>
      )}
    </section>
  );
}
