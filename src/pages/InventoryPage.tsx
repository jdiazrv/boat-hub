import { useEffect, useMemo, useState } from "react";
import { useSelectMode, SelectModeHeaderButtons, SelectAllCheckbox, SelectRowCheckbox, BulkDeleteBar } from "../components/SelectModeBar";
import { LoadingOverlay } from "../components/LoadingOverlay";
import * as db from "../lib/db";
import type { BoatComponent, BoatSystem, InventoryCategory, InventoryCatalogItem, InventoryItem, InventoryStatus } from "../lib/types";
import {
  FormActions,
  FormGrid,
  FormSection,
  InputField,
  SelectField,
  TextareaField,
} from "../components/FormField";
import { Modal } from "../components/Modal";
import { sysName, useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

function useInventoryCategories() {
  const { t } = useI18n();
  return [
    { value: "main_equipment" as InventoryCategory, label: t("catMainEquipment") },
    { value: "electronics" as InventoryCategory, label: t("catElectronics") },
    { value: "safety" as InventoryCategory, label: t("catSafety") },
    { value: "sails_rigging" as InventoryCategory, label: t("catSailsRigging") },
    { value: "anchoring" as InventoryCategory, label: t("catAnchoring") },
    { value: "tools" as InventoryCategory, label: t("catTools") },
    { value: "spare_part" as InventoryCategory, label: t("catSparePart") },
    { value: "consumable" as InventoryCategory, label: t("catConsumable") },
    { value: "accessories" as InventoryCategory, label: t("catAccessories") },
    { value: "documentation" as InventoryCategory, label: t("catDocumentation") },
    { value: "other" as InventoryCategory, label: t("catOther") },
  ];
}

function useInventoryStatuses() {
  const { t } = useI18n();
  return [
    { value: "on_board" as InventoryStatus, label: t("invStatusOnBoard") },
    { value: "off_board" as InventoryStatus, label: t("invStatusOffBoard") },
    { value: "in_repair" as InventoryStatus, label: t("invStatusInRepair") },
    { value: "disposed" as InventoryStatus, label: t("invStatusDisposed") },
  ];
}

type FormPayload = Omit<InventoryItem, "id" | "boatName" | "systemName" | "system" | "minimum">;

function InventoryForm({
  initial,
  boatName,
  systems,
  components,
  catalog,
  editing,
  onSave,
  onDelete,
  onCancel,
  loading,
  error,
}: {
  initial: FormPayload;
  boatName: string;
  systems: BoatSystem[];
  components: BoatComponent[];
  catalog: InventoryCatalogItem[];
  editing: boolean;
  onSave: (d: FormPayload) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { locale, t } = useI18n();
  const CATEGORIES = useInventoryCategories();
  const STATUSES = useInventoryStatuses();
  const [step, setStep] = useState<"catalog" | "details">(editing || initial.name ? "details" : "catalog");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSystemFilter, setCatalogSystemFilter] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState<InventoryCategory>("main_equipment");
  const [form, setForm] = useState(initial);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  const isSpare = form.category === "spare_part" || form.category === "consumable";

  // components filtered by selected system
  const systemComponents = components.filter((c) => c.boatSystemId === form.boatSystemId);

  // Catalog systems list
  const catalogSystems = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of catalog) {
      if (!seen.has(item.systemCode)) seen.set(item.systemCode, locale === "es" ? item.nameEs : item.nameEn);
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([code]) => code);
  }, [catalog, locale]);

  function getSystemLabel(code: string) {
    const item = catalog.find((c) => c.systemCode === code);
    return item ? (locale === "es" ? item.nameEs : item.nameEn) : code;
  }

  const visibleCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return catalog.filter((item) => {
      if (catalogSystemFilter && item.systemCode !== catalogSystemFilter) return false;
      if (!q) return true;
      return [item.nameEs, item.nameEn, item.manufacturer ?? "", item.model ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [catalog, catalogSearch, catalogSystemFilter]);

  function applyCatalogItem(item: InventoryCatalogItem) {
    const matchingSystem = systems.find((s) => s.systemCode === item.systemCode);
    setForm((current) => ({
      ...current,
      name: locale === "es" ? item.nameEs : item.nameEn,
      category: item.category,
      manufacturer: item.manufacturer ?? current.manufacturer,
      model: item.model ?? current.model,
      description: item.description ?? current.description,
      boatSystemId: matchingSystem?.id ?? current.boatSystemId,
    }));
    setStep("details");
  }

  function startManual() {
    setForm((current) => ({
      ...current,
      name: manualName.trim(),
      category: manualCategory,
    }));
    setStep("details");
  }

  if (step === "catalog") {
    return (
      <div className="form-stack">
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("sectionChooseFromCatalog")}</div>
        <div className="form-boat-badge">{boatName}</div>

        <div className="filter-bar" style={{ marginBottom: "0.75rem" }}>
          <input
            className="form-input" type="search" placeholder={t("searchCatalog")}
            value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)}
          />
          <select className="form-input form-select" value={catalogSystemFilter} onChange={(e) => setCatalogSystemFilter(e.target.value)}>
            <option value="">{t("allSystems")}</option>
            {catalogSystems.map((code) => (
              <option key={code} value={code}>{getSystemLabel(code)}</option>
            ))}
          </select>
        </div>

        <div className="catalog-picker-list">
          {visibleCatalog.map((item) => {
            const name = locale === "es" ? item.nameEs : item.nameEn;
            const sysLabel = getSystemLabel(item.systemCode);
            return (
              <button className="picker-row" key={item.id} type="button" onClick={() => applyCatalogItem(item)}>
                <span className="picker-row-sys">{sysLabel}</span>
                <span className="picker-row-title">{name}</span>
                <span className="picker-row-kind">{CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}</span>
              </button>
            );
          })}
          {visibleCatalog.length === 0 && (
            <p className="data-table-cell-muted">No hay elementos con esos filtros.</p>
          )}
        </div>

        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("sectionNotInCatalog")}</div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem" }}>{t("name")}</label>
              <input className="form-input" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder={t("name")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem" }}>{t("kind")}</label>
              <select className="form-input form-select" value={manualCategory} onChange={(e) => setManualCategory(e.target.value as InventoryCategory)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
            <button className="btn-primary" disabled={!manualName.trim()} type="button" onClick={startManual}>
              {t("save")}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button type="button" className="btn-ghost" onClick={onCancel}>{t("cancel")}</button>
        </div>
      </div>
    );
  }

  function handleSystemChange(systemId: string) {
    set("boatSystemId", systemId || null);
    set("boatComponentId", null);
  }

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormSection title={t("sectionIdentification")}>
        <div className="form-boat-badge">{boatName}</div>
        {!editing && (
          <button className="btn-ghost" type="button" style={{ alignSelf: "flex-start" }} onClick={() => setStep("catalog")}>
            {t("edit")}
          </button>
        )}
        <FormGrid>
          <SelectField
            label={t("kind")}
            value={form.category}
            onChange={(e) => set("category", e.target.value as InventoryCategory)}
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectField>
          <SelectField
            label="Sistema"
            value={form.boatSystemId ?? ""}
            onChange={(e) => handleSystemChange(e.target.value)}
          >
            <option value="">-- Sistema --</option>
            {systems.map((s) => <option key={s.id} value={s.id}>{sysName(s, locale)}</option>)}
          </SelectField>
          {systemComponents.length > 0 && (
            <SelectField
              label="Equipo / Componente"
              value={form.boatComponentId ?? ""}
              onChange={(e) => set("boatComponentId", e.target.value || null)}
            >
              <option value="">-- Equipo (opcional) --</option>
              {systemComponents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          )}
        </FormGrid>
        <InputField label="Nombre" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        <FormGrid>
          <InputField label="Fabricante" value={form.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value || null)} />
          <InputField label="Modelo" value={form.model ?? ""} onChange={(e) => set("model", e.target.value || null)} />
          <InputField label="Referencia" value={form.reference ?? ""} onChange={(e) => set("reference", e.target.value || null)} />
          <InputField label="Número de serie" value={form.serialNumber ?? ""} onChange={(e) => set("serialNumber", e.target.value || null)} />
        </FormGrid>
        <TextareaField label="Descripción" value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
      </FormSection>

      <FormSection title={t("sectionStatusAndLocation")}>
        <FormGrid>
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(e) => set("status", e.target.value as InventoryStatus)}
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SelectField>
          <InputField label="Ubicación a bordo" value={form.location ?? ""} onChange={(e) => set("location", e.target.value || null)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Cantidad y stock">
        <FormGrid>
          <InputField
            label="Cantidad"
            type="number"
            value={form.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
          />
          <InputField label="Unidad" value={form.unit ?? ""} onChange={(e) => set("unit", e.target.value || null)} />
          {isSpare && (
            <>
              <InputField
                label="Stock disponible"
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
              />
              <InputField
                label={t("minimumStock")}
                type="number"
                value={form.minimumStock ?? ""}
                onChange={(e) => set("minimumStock", e.target.value ? Number(e.target.value) : null)}
              />
            </>
          )}
        </FormGrid>
      </FormSection>

      <FormSection title={t("sectionAcquisition")}>
        <FormGrid>
          <InputField label="Proveedor" value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value || null)} />
          <InputField label="Fecha de compra" type="date" value={form.purchaseDate ?? ""} onChange={(e) => set("purchaseDate", e.target.value || null)} />
          <InputField label="Coste de adquisición" type="number" value={form.acquisitionCost ?? ""} onChange={(e) => set("acquisitionCost", e.target.value ? Number(e.target.value) : null)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Notas">
        <TextareaField label="Notas" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} dangerLabel="Eliminar" />
    </form>
  );
}

export function InventoryPage() {
  const { t, locale } = useI18n();
  const CATEGORIES = useInventoryCategories();
  const STATUSES = useInventoryStatuses();
  const { inventoryItems, inventoryItemsFull, refresh, loading } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSystem, setFilterSystem] = useState("");
  const [filterCategory, setFilterCategory] = useState<InventoryCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | "">("");
  const [filterLow, setFilterLow] = useState(false);
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const [boatComponents, setBoatComponents] = useState<BoatComponent[]>([]);
  const [inventoryCatalog, setInventoryCatalog] = useState<InventoryCatalogItem[]>([]);
  const { selectMode, selected, enterSelectMode, exitSelectMode, toggleOne, toggleAll } = useSelectMode();
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "equipment" | "spares">("all");

  const boatName = activeBoat ? activeBoat.name : "Sin barco activo";
  const allItems = isSupabaseConfigured ? inventoryItemsFull : inventoryItems;

  const EQUIPMENT_CATS: InventoryCategory[] = ["main_equipment", "electronics", "safety", "sails_rigging", "anchoring", "tools", "accessories", "documentation", "other"];
  const SPARE_CATS: InventoryCategory[] = ["spare_part", "consumable"];

  const filtered = allItems.filter((item) => {
    if (activeBoatId && item.boatId !== activeBoatId) return false;
    if (viewMode === "equipment" && !EQUIPMENT_CATS.includes(item.category)) return false;
    if (viewMode === "spares" && !SPARE_CATS.includes(item.category)) return false;
    if (filterSystem && item.boatSystemId !== filterSystem) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    const minStock = item.minimumStock ?? item.minimum ?? 0;
    if (filterLow && item.stock >= minStock) return false;
    return true;
  });

  useEffect(() => {
    if (!activeBoatId) return;
    Promise.all([
      db.fetchBoatSystems(activeBoatId),
      db.fetchBoatComponents(activeBoatId),
      db.fetchInventoryCatalog(),
    ]).then(([sys, comp, cat]) => {
      setBoatSystems(sys);
      setBoatComponents(comp);
      setInventoryCatalog(cat);
    }).catch(() => {});
  }, [activeBoatId]);

  const EMPTY: FormPayload = {
    boatId: activeBoatId ?? "",
    boatSystemId: null,
    boatComponentId: null,
    name: "",
    category: "main_equipment",
    reference: null,
    manufacturer: null,
    model: null,
    serialNumber: null,
    description: null,
    quantity: 1,
    unit: null,
    stock: 0,
    minimumStock: null,
    status: "on_board",
    location: null,
    supplier: null,
    purchaseDate: null,
    acquisitionCost: null,
    cost: null,
    notes: null,
  };

  function openCreate() { setEditing(null); setError(null); setModal("create"); }
  function openEdit(item: InventoryItem) { setEditing(item); setError(null); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave(data: FormPayload) {
    const payload = { ...data, boatId: activeBoatId ?? data.boatId };
    if (!payload.boatId) { setError("No hay barco activo"); return; }
    if (!payload.boatSystemId) {
      const systems = boatSystems.length ? boatSystems : await db.fetchBoatSystems(payload.boatId);
      const fallbackSystem = systems[0];
      if (!fallbackSystem) {
        setError("Añade primero al menos un sistema al barco.");
        return;
      }
      payload.boatSystemId = fallbackSystem.id;
    }
    setSaving(true); setError(null);
    try {
      if (editing) await db.updateInventoryItem(editing.id, payload);
      else await db.createInventoryItem(payload);
      await refresh(); closeModal();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!editing || !confirm(`¿Eliminar "${editing.name}"?`)) return;
    setSaving(true);
    try { await db.deleteInventoryItem(editing.id); await refresh(); closeModal(); }
    catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0 || !confirm(`¿Eliminar ${selected.size} elemento(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selected).map((id) => db.deleteInventoryItem(id)));
      exitSelectMode();
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error eliminando"); }
    finally { setBulkDeleting(false); }
  }

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">{t("inventory")}</span>
          <h2>{t("inventoryBoard")}</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco para ver su inventario.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">{t("inventory")} · {boatName}</span>
          <h2>{t("inventoryBoard")}</h2>
        </div>
        <SelectModeHeaderButtons selectMode={selectMode} onEnter={enterSelectMode} onCancel={exitSelectMode}>
          {isSupabaseConfigured && (
            <button className="btn-primary" onClick={openCreate} type="button">+ Añadir elemento</button>
          )}
        </SelectModeHeaderButtons>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.75rem" }}>
        {(["all", "equipment", "spares"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => { setViewMode(mode); setFilterCategory(""); }}
            style={{
              padding: "0.35rem 0.9rem",
              borderRadius: "2rem",
              border: "1px solid var(--border)",
              fontSize: "0.82rem",
              cursor: "pointer",
              background: viewMode === mode ? "var(--accent)" : "transparent",
              color: viewMode === mode ? "#fff" : "var(--text-soft)",
              fontWeight: viewMode === mode ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {mode === "all" ? "Todo" : mode === "equipment" ? "Equipos" : "Repuestos"}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <select className="form-input form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as InventoryCategory | "")}>
          <option value="">{t("allCategories")}</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="form-input form-select" value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)}>
          <option value="">{t("allSystems")}</option>
          {boatSystems.map((s) => <option key={s.id} value={s.id}>{sysName(s, locale)}</option>)}
        </select>
        <select className="form-input form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as InventoryStatus | "")}>
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <label className="form-checkbox-row" style={{ color: "var(--text-soft)" }}>
          <input type="checkbox" checked={filterLow} onChange={(e) => setFilterLow(e.target.checked)} />
          <span>{t("onlyLowStock")}</span>
        </label>
      </div>

      <article className="panel-card">
        {loading && <LoadingOverlay />}
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem 2fr 1fr 1fr 0.8fr 0.8fr 0.8fr auto" }}>
            <SelectAllCheckbox selectMode={selectMode} ids={filtered.map((i) => i.id)} selected={selected} onToggleAll={toggleAll} />
            <span>Elemento</span>
            <span>Sistema</span>
            <span>Categoría</span>
            <span>Cantidad</span>
            <span>Estado</span>
            <span>F. compra</span>
            <span></span>
          </div>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No hay elementos en el inventario.</p></div>}
          {filtered.map((item) => {
            const minStock = item.minimumStock ?? item.minimum ?? 0;
            const isLow = (item.category === "spare_part" || item.category === "consumable") && item.stock < minStock;
            const isSelected = selected.has(item.id);
            const component = item.boatComponentId
              ? boatComponents.find((c) => c.id === item.boatComponentId)
              : null;
            return (
              <div
                className="data-table-row"
                key={item.id}
                style={{
                  gridTemplateColumns: "1.5rem 2fr 1fr 1fr 0.8fr 0.8fr 0.8fr auto",
                  background: selectMode && isSelected ? "var(--danger-tint, rgba(239,68,68,0.07))" : undefined,
                }}
              >
                <SelectRowCheckbox selectMode={selectMode} id={item.id} selected={selected} onToggle={toggleOne} disabled={bulkDeleting} />
                <div>
                  <strong style={{ display: "block" }}>{item.name}</strong>
                  {component && <span className="data-table-cell-muted">{component.name}</span>}
                  {(item.manufacturer || item.model) && (
                    <span className="data-table-cell-muted">
                      {[item.manufacturer, item.model].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {item.reference && <span className="data-table-cell-muted"> · Ref: {item.reference}</span>}
                </div>
                <span className="data-table-cell-muted">{item.systemName}</span>
                <span><span className="pill">{CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}</span></span>
                <span className={isLow ? "stock-alert" : ""}>
                  {item.category === "spare_part" || item.category === "consumable"
                    ? `${item.stock} / mín ${minStock}`
                    : item.quantity}
                </span>
                <span className="data-table-cell-muted">{STATUSES.find((s) => s.value === item.status)?.label ?? item.status}</span>
                <span className="data-table-cell-muted">{item.purchaseDate ?? "-"}</span>
                <div className="row-actions">
                  {isSupabaseConfigured && (
                    <button className="btn-icon" onClick={() => openEdit(item)} type="button" title="Editar">✏</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={bulkDeleting} onDelete={handleDeleteSelected} onCancel={exitSelectMode} label="elemento" />

      {modal && (
        <Modal title={modal === "create" ? "Nuevo elemento" : "Editar elemento"} onClose={closeModal} wide>
          <InventoryForm
            initial={editing
              ? {
                  boatId: editing.boatId,
                  boatSystemId: editing.boatSystemId,
                  boatComponentId: editing.boatComponentId,
                  name: editing.name,
                  category: editing.category,
                  reference: editing.reference,
                  manufacturer: editing.manufacturer,
                  model: editing.model,
                  serialNumber: editing.serialNumber,
                  description: editing.description,
                  quantity: editing.quantity,
                  unit: editing.unit,
                  stock: editing.stock,
                  minimumStock: editing.minimumStock,
                  status: editing.status,
                  location: editing.location,
                  supplier: editing.supplier,
                  purchaseDate: editing.purchaseDate,
                  acquisitionCost: editing.acquisitionCost,
                  cost: editing.cost,
                  notes: editing.notes,
                }
              : EMPTY}
            boatName={boatName}
            systems={boatSystems}
            components={boatComponents}
            catalog={inventoryCatalog}
            editing={!!editing}
            onSave={handleSave}
            onDelete={editing ? handleDelete : undefined}
            onCancel={closeModal}
            loading={saving}
            error={error}
          />
        </Modal>
      )}
    </section>
  );
}
