import { useEffect, useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import * as db from "../lib/db";
import type { HourCounter, HourLog } from "../lib/types";
import { FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

function HourLogForm({
  initial, boatName, counters, lastKnownHours, onSave, onDelete, onCancel, loading, error,
}: {
  initial: Omit<HourLog, "id" | "boatName" | "counterName">;
  boatName: string;
  counters: HourCounter[];
  lastKnownHours: number | null;
  onSave: (d: Omit<HourLog, "id" | "boatName" | "counterName">) => void;
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
      <FormSection>
        <div className="form-boat-badge">{boatName}</div>
        {lastKnownHours != null && (
          <p style={{ fontSize: "0.84rem", color: "var(--text-soft)", margin: "0 0 0.5rem" }}>
            Último registro: <strong>{lastKnownHours} h</strong>
          </p>
        )}
        <FormGrid>
          <SelectField label="Contador" required value={form.hourCounterId}
            onChange={(e) => set("hourCounterId", e.target.value)}>
            <option value="">-- Contador --</option>
            {counters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <InputField label="Fecha" type="date" required value={form.loggedAt}
            onChange={(e) => set("loggedAt", e.target.value)} />
          <InputField label="Horas de motor" type="number" required value={form.hours}
            onChange={(e) => set("hours", Number(e.target.value))} />
          <InputField label="Registrado por" value={form.loggedBy ?? ""}
            onChange={(e) => set("loggedBy", e.target.value || null)} />
        </FormGrid>
        <TextareaField label={t("notes")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel={t("delete")} />
    </form>
  );
}

export function HoursPage() {
  const { t } = useI18n();
  const { hourLogs, refresh, loading, latestEngineHours } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<HourLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counters, setCounters] = useState<HourCounter[]>([]);
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne, toggleAll } = useSelectMode();
  const [deleting, setDeleting] = useState(false);

  const boatName = activeBoat ? activeBoat.name : "Sin barco activo";

  const filtered = hourLogs.filter((l) => !activeBoatId || l.boatId === activeBoatId);

  useEffect(() => {
    if (!activeBoatId) return;
    db.fetchHourCounters(activeBoatId).then(async (list) => {
      if (list.length === 0) {
        // Auto-create a default counter so the user can start logging immediately
        try {
          const created = await db.createHourCounter(activeBoatId, "Motor principal");
          setCounters([created]);
        } catch { /* ignore */ }
      } else {
        setCounters(list);
      }
    }).catch(() => {});
  }, [activeBoatId]);

  const lastHours = activeBoatId ? latestEngineHours(activeBoatId) : null;

  const EMPTY_LOG: Omit<HourLog, "id" | "boatName" | "counterName"> = {
    boatId: activeBoatId ?? "", hourCounterId: "",
    loggedAt: new Date().toISOString().slice(0, 10),
    hours: lastHours ?? 0, notes: null, loggedBy: null,
  };

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(l: HourLog) { setEditing(l); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(data: Omit<HourLog, "id" | "boatName" | "counterName">) {
    const payload = { ...data, boatId: activeBoatId ?? data.boatId };
    if (!payload.boatId) { setError("No hay barco activo"); return; }
    if (!payload.hourCounterId) {
      let availableCounters = counters;
      if (!availableCounters.length) {
        availableCounters = await db.fetchHourCounters(payload.boatId);
      }
      let fallbackCounter = availableCounters[0];
      if (!fallbackCounter) {
        fallbackCounter = await db.createHourCounter(payload.boatId, "Motor principal");
      }
      payload.hourCounterId = fallbackCounter.id;
    }
    setSaving(true); setError(null);
    try {
      if (editing) await db.updateHourLog(editing.id, payload);
      else await db.createHourLog(payload);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} registro(s)?`)) return;
    setDeleting(true);
    try { await Promise.all([...selected].map((id) => db.deleteHourLog(id))); await refresh(); exitSelectMode(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm("¿Eliminar este registro?")) return;
    setSaving(true);
    try { await db.deleteHourLog(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("hours")}</span>
          <h2>Registro de horas de uso</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco en la barra lateral para ver su registro de horas.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("hours")} · {boatName}</span>
          <h2>Registro de horas de uso</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={exitSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ {t("newHourLog")}</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      {!isSupabaseConfigured && (
        <div className="banner warning-banner"><p>Modo demo — conecta Supabase para registrar horas.</p></div>
      )}

      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 1.5fr 1fr 0.8fr auto" }}>
            <SelectAllCheckbox selectMode={selectMode} ids={filtered.map((l) => l.id)} selected={selected} onToggleAll={toggleAll} />
            <span>Contador</span><span>Fecha</span><span>Horas</span><span></span>
          </div>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No hay registros de horas.</p></div>}
          {filtered.map((l) => (
            <div className="data-table-row" key={l.id} style={{ gridTemplateColumns: "1.5rem 1.5fr 1fr 0.8fr auto" }}>
              <SelectRowCheckbox selectMode={selectMode} id={l.id} selected={selected} onToggle={toggleOne} disabled={deleting} />
              <span>{l.counterName}</span>
              <span className="data-table-cell-muted">{l.loggedAt}</span>
              <strong>{l.hours} h</strong>
              <div className="row-actions">
                {isSupabaseConfigured && (
                  <button className="btn-icon" onClick={() => openEdit(l)} type="button" title="Editar">✏</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={exitSelectMode} label="registro" />

      {modal && (
        <Modal title={modal === "create" ? t("newHourLog") : t("editHourLog")} onClose={closeModal}>
          <HourLogForm
            initial={editing
              ? { boatId: editing.boatId, hourCounterId: editing.hourCounterId,
                  loggedAt: editing.loggedAt, hours: editing.hours, notes: editing.notes, loggedBy: editing.loggedBy }
              : EMPTY_LOG}
            boatName={boatName}
            counters={counters}
            lastKnownHours={lastHours}
            onSave={handleSave} onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal} loading={saving} error={error}
          />
        </Modal>
      )}
    </section>
  );
}
