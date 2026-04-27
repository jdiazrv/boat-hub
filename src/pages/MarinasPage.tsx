import { useState } from "react";
import { useSelectMode, SelectModeHeaderButtons, BulkDeleteBar } from "../components/SelectModeBar";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as db from "../lib/db";
import type { Marina } from "../lib/types";
import { CheckboxField, FormActions, FormGrid, FormSection, InputField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAppData } from "../providers/AppDataProvider";

const EMPTY: Omit<Marina, "id" | "createdBy"> = {
  name: "", country: null, region: null, address: null, latitude: null, longitude: null,
  website: null, phone: null, email: null, contactPerson: null, vhfChannel: null,
  mooringType: null, hasWater: false, hasElectricity: false, hasWifi: false,
  hasShowers: false, hasSecurity: false, rating: null, notes: null, infoDate: null, source: null,
};

function MarinaForm({
  initial, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<Marina, "id" | "createdBy">;
  onSave: (d: Omit<Marina, "id" | "createdBy">) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(initial);
  const { t } = useI18n();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection title="Identificación">
        <InputField label={t("name")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        <FormGrid>
          <InputField label={t("country")} value={form.country ?? ""} onChange={(e) => set("country", e.target.value || null)} />
          <InputField label={t("region")} value={form.region ?? ""} onChange={(e) => set("region", e.target.value || null)} />
          <InputField label={t("address")} value={form.address ?? ""} onChange={(e) => set("address", e.target.value || null)} />
          <InputField label="Tipo de amarre" value={form.mooringType ?? ""} onChange={(e) => set("mooringType", e.target.value || null)} />
          <InputField label="Latitud" type="number" value={form.latitude ?? ""} onChange={(e) => set("latitude", e.target.value ? Number(e.target.value) : null)} />
          <InputField label="Longitud" type="number" value={form.longitude ?? ""} onChange={(e) => set("longitude", e.target.value ? Number(e.target.value) : null)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Contacto">
        <FormGrid>
          <InputField label={t("phone")} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
          <InputField label="Email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} />
          <InputField label="Contacto" value={form.contactPerson ?? ""} onChange={(e) => set("contactPerson", e.target.value || null)} />
          <InputField label="Canal VHF" value={form.vhfChannel ?? ""} onChange={(e) => set("vhfChannel", e.target.value || null)} />
          <InputField label={t("website")} value={form.website ?? ""} onChange={(e) => set("website", e.target.value || null)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Servicios">
        <div className="form-checkbox-grid">
          <CheckboxField label={t("water")} checked={form.hasWater} onChange={(e) => set("hasWater", e.target.checked)} />
          <CheckboxField label={t("electricity")} checked={form.hasElectricity} onChange={(e) => set("hasElectricity", e.target.checked)} />
          <CheckboxField label={t("wifi")} checked={form.hasWifi} onChange={(e) => set("hasWifi", e.target.checked)} />
          <CheckboxField label={t("showers")} checked={form.hasShowers} onChange={(e) => set("hasShowers", e.target.checked)} />
          <CheckboxField label={t("security")} checked={form.hasSecurity} onChange={(e) => set("hasSecurity", e.target.checked)} />
        </div>
      </FormSection>

      <FormSection title="Otros">
        <FormGrid>
          <InputField label={t("rating")} type="number" value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : null)} />
          <InputField label="Fecha de información" type="date" value={form.infoDate ?? ""} onChange={(e) => set("infoDate", e.target.value || null)} />
          <InputField label="Fuente" value={form.source ?? ""} onChange={(e) => set("source", e.target.value || null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function MarinasPage() {
  const { t } = useI18n();
  const { marinas, refresh, loading } = useAppData();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Marina | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne } = useSelectMode();
  const [deleting, setDeleting] = useState(false);

  const filtered = marinas.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(m: Marina) { setEditing(m); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }
  function cancelSelectMode() { setError(null); exitSelectMode(); }

  async function handleSave(data: Omit<Marina, "id" | "createdBy">) {
    setSaving(true); setError(null);
    try {
      if (editing) await db.updateMarina(editing.id, data);
      else await db.createMarina(data);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar "${editing.name}"?`)) return;
    setSaving(true);
    try { await db.deleteMarina(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} marina(s)?`)) return;
    setError(null);
    setDeleting(true);
    try { await db.deleteMarinas([...selected]); await refresh(); exitSelectMode(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(false); }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("marinas")}</span>
          <h2>Directorio de marinas</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={cancelSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ {t("newMarina")}</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      {!isSupabaseConfigured && (
        <div className="banner warning-banner"><p>Modo demo — conecta Supabase para gestionar marinas.</p></div>
      )}

      <div className="filter-bar">
        <input className="form-input" placeholder="Buscar por nombre o país…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: "240px" }} />
      </div>

      {error && !modal && (
        <div className="banner warning-banner"><p>{error}</p></div>
      )}

      <div className="cards-grid" style={{ position: "relative" }}>
        {loading && <LoadingOverlay />}
        {!loading && filtered.length === 0 && <div className="empty-state"><p>No hay marinas registradas.</p></div>}
        {filtered.map((m) => (
          <article
            className="panel-card"
            key={m.id}
            style={{ position: "relative", outline: selectMode && selected.has(m.id) ? "2px solid var(--accent)" : undefined }}
          >
            {selectMode && (
              <input
                type="checkbox"
                checked={selected.has(m.id)}
                onChange={() => toggleOne(m.id)}
                disabled={deleting}
                style={{ position: "absolute", top: "0.6rem", left: "0.6rem", width: "1rem", height: "1rem", zIndex: 2, cursor: "pointer" }}
              />
            )}
            <div className="panel-head">
              <h3 style={{ fontSize: "1rem", paddingLeft: selectMode ? "1.6rem" : undefined }}>{m.name}</h3>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {m.rating != null && <span className="pill">★ {m.rating}</span>}
                {isSupabaseConfigured && !selectMode && (
                  <button className="btn-icon" onClick={() => openEdit(m)} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>
            <p style={{ margin: "0.3rem 0", fontSize: "0.88rem", color: "var(--text-soft)" }}>
              {[m.region, m.country].filter(Boolean).join(", ") || "-"}
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
              {m.hasWater && <span className="pill" style={{ fontSize: "0.75rem" }}>Agua</span>}
              {m.hasElectricity && <span className="pill" style={{ fontSize: "0.75rem" }}>Elec.</span>}
              {m.hasWifi && <span className="pill" style={{ fontSize: "0.75rem" }}>Wifi</span>}
              {m.hasSecurity && <span className="pill" style={{ fontSize: "0.75rem" }}>Vigilancia</span>}
              {m.hasShowers && <span className="pill" style={{ fontSize: "0.75rem" }}>Duchas</span>}
            </div>
            {m.phone && <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "var(--text-soft)" }}>{m.phone}</p>}
          </article>
        ))}
      </div>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={cancelSelectMode} label="marina" />

      {modal && (
        <Modal title={modal === "create" ? t("newMarina") : t("editMarina")} onClose={closeModal} wide>
          <MarinaForm
            initial={editing
              ? { name: editing.name, country: editing.country, region: editing.region, address: editing.address,
                  latitude: editing.latitude, longitude: editing.longitude, website: editing.website, phone: editing.phone,
                  email: editing.email, contactPerson: editing.contactPerson, vhfChannel: editing.vhfChannel,
                  mooringType: editing.mooringType, hasWater: editing.hasWater, hasElectricity: editing.hasElectricity,
                  hasWifi: editing.hasWifi, hasShowers: editing.hasShowers, hasSecurity: editing.hasSecurity,
                  rating: editing.rating, notes: editing.notes, infoDate: editing.infoDate, source: editing.source }
              : EMPTY}
            onSave={handleSave} onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal} loading={saving} error={error}
          />
        </Modal>
      )}
    </section>
  );
}
