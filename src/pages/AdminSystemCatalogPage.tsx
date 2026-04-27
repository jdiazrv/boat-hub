import { useEffect, useMemo, useState } from "react";
import { FormActions, FormGrid, FormSection, InputField } from "../components/FormField";
import { Modal } from "../components/Modal";
import * as db from "../lib/db";
import { isSupabaseConfigured } from "../lib/supabase";
import type { SystemCatalogEntry } from "../lib/types";
import { useAuth } from "../providers/AuthProvider";
import { useAppData } from "../providers/AppDataProvider";

type CatalogFormValue = {
  code: string;
  name_es: string;
  name_en: string;
};

function CatalogForm({
  initial,
  loading,
  error,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: CatalogFormValue;
  loading: boolean;
  error: string | null;
  onSave: (value: CatalogFormValue) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function set<K extends keyof CatalogFormValue>(key: K, value: CatalogFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="form-stack" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <FormSection title="Sistema del catálogo">
        <FormGrid>
          <InputField label="Código" required value={form.code} onChange={(event) => set("code", event.target.value)} />
          <InputField label="Nombre ES" required value={form.name_es} onChange={(event) => set("name_es", event.target.value)} />
          <InputField label="Nombre EN" required value={form.name_en} onChange={(event) => set("name_en", event.target.value)} />
        </FormGrid>
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={Boolean(onDelete)} onDanger={onDelete} dangerLabel="Eliminar" />
    </form>
  );
}

export function AdminSystemCatalogPage() {
  const { session, isSuperuser } = useAuth();
  const { systemCatalog, refresh } = useAppData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<SystemCatalogEntry | null>(null);

  const filteredSystems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return systemCatalog;
    return systemCatalog.filter((system) =>
      [system.code, system.name_es, system.name_en].join(" ").toLowerCase().includes(normalizedSearch)
    );
  }, [search, systemCatalog]);

  useEffect(() => {
    setLoading(false);
  }, [session?.user.id, isSuperuser, systemCatalog.length]);

  const currentForm: CatalogFormValue = editing
    ? { code: editing.code, name_es: editing.name_es, name_en: editing.name_en }
    : { code: "", name_es: "", name_en: "" };

  function closeModal() {
    setModal(null);
    setEditing(null);
    setError(null);
  }

  async function handleSave(value: CatalogFormValue) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (editing) {
        await db.updateSystemCatalogEntry(editing.id, value);
        setNotice("Sistema del catálogo actualizado.");
      } else {
        await db.createSystemCatalogEntry(value);
        setNotice("Sistema del catálogo creado.");
      }
      await refresh();
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save system catalog entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar sistema "${editing.name_es}" del catálogo?`)) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await db.deleteSystemCatalogEntry(editing.id);
      setNotice("Sistema del catálogo eliminado.");
      await refresh();
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete system catalog entry");
    } finally {
      setSaving(false);
    }
  }

  if (!isSupabaseConfigured) {
    return <section className="page"><div className="section-title"><span className="eyebrow">Admin</span><h2>Catálogo maestro de sistemas</h2></div><article className="panel-card"><p>Configura Supabase para gestionar el catálogo global de sistemas.</p></article></section>;
  }

  if (loading) {
    return <section className="page"><div className="section-title"><span className="eyebrow">Admin</span><h2>Catálogo maestro de sistemas</h2></div><article className="panel-card"><p>Cargando catálogo de sistemas...</p></article></section>;
  }

  if (!isSuperuser) {
    return <section className="page"><div className="section-title"><span className="eyebrow">Admin</span><h2>Catálogo maestro de sistemas</h2></div><article className="panel-card"><p>Esta sección solo está disponible para superusuarios.</p></article></section>;
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title"><span className="eyebrow">Admin</span><h2>Catálogo maestro de sistemas</h2></div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModal("create"); }} type="button">+ Nuevo sistema</button>
      </div>

      {error && <div className="banner warning-banner"><strong>Error</strong><span>{error}</span></div>}
      {notice && <div className="banner success-banner"><strong>OK</strong><span>{notice}</span></div>}

      <article className="panel-card">
        <div className="panel-head">
          <div>
            <h3>Sistemas globales</h3>
            <p className="data-table-cell-muted">Este catálogo normaliza los sistemas disponibles para todos los barcos.</p>
          </div>
          <span className="pill">{filteredSystems.length} sistemas</span>
        </div>

        <div className="filter-bar">
          <input className="form-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código o nombre" type="search" />
        </div>

        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1fr 1.5fr 1.5fr auto" }}>
            <span>Código</span><span>Nombre ES</span><span>Nombre EN</span><span></span>
          </div>
          {filteredSystems.length === 0 && <div className="empty-state"><p>No hay sistemas que coincidan con este filtro.</p></div>}
          {filteredSystems.map((system) => (
            <div className="data-table-row" key={system.id} style={{ gridTemplateColumns: "1fr 1.5fr 1.5fr auto" }}>
              <span className="data-table-cell-muted">{system.code}</span>
              <strong>{system.name_es}</strong>
              <span className="data-table-cell-muted">{system.name_en}</span>
              <div className="row-actions"><button className="btn-icon" onClick={() => { setEditing(system); setModal("edit"); }} type="button" title="Editar">✏</button></div>
            </div>
          ))}
        </div>
      </article>

      {modal && (
        <Modal title={modal === "create" ? "Nuevo sistema" : "Editar sistema"} onClose={closeModal} wide>
          <CatalogForm initial={currentForm} loading={saving} error={error} onSave={handleSave} onCancel={closeModal} onDelete={editing ? handleDelete : undefined} />
        </Modal>
      )}
    </section>
  );
}