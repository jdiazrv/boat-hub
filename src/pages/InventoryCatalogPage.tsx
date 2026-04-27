import { useEffect, useMemo, useState } from "react";
import { BulkDeleteBar } from "../components/SelectModeBar";
import * as db from "../lib/db";
import type { BoatSystem, InventoryCatalogItem } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

const CATEGORY_LABELS: Record<string, string> = {
  main_equipment: "Equipo principal",
  electronics: "Electrónica",
  safety: "Seguridad",
  sails_rigging: "Velas y jarcia",
  anchoring: "Fondeo",
  tools: "Herramientas",
  spare_part: "Repuesto",
  consumable: "Consumible",
  accessories: "Accesorios",
  documentation: "Documentación",
  other: "Otros",
};

export function InventoryCatalogPage() {
  const { locale } = useI18n();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const { systemCatalog } = useAppData();
  const boatName = activeBoat?.name ?? "";

  const [catalog, setCatalog] = useState<InventoryCatalogItem[]>([]);
  // catalogId → { entryId, inventoryItemId }
  const [trackedMap, setTrackedMap] = useState<Map<string, { entryId: string; inventoryItemId: string | null }>>(new Map());
  const [boatSystems, setBoatSystems] = useState<BoatSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // catalogIds of tracked items selected for bulk delete
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [onlyTracked, setOnlyTracked] = useState(false);

  async function refresh() {
    if (!activeBoatId) return;
    setLoading(true);
    setError(null);
    try {
      const [items, tracked, systems] = await Promise.all([
        db.fetchInventoryCatalog(),
        db.fetchBoatInventoryCatalog(activeBoatId),
        db.fetchBoatSystems(activeBoatId),
      ]);
      setCatalog(items);
      setTrackedMap(tracked);
      setBoatSystems(systems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando catálogo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [activeBoatId]);

  async function handleToggle(item: InventoryCatalogItem, checked: boolean) {
    if (!activeBoatId) return;
    setSaving(item.id);
    setError(null);
    setNotice(null);
    try {
      if (checked) {
        const matchingSystem = boatSystems.find((s) => s.systemCode === item.systemCode);
        await db.addBoatInventoryCatalogEntry(activeBoatId, item, matchingSystem?.id ?? null);
        setNotice(`"${locale === "es" ? item.nameEs : item.nameEn}" añadido al inventario.`);
      } else {
        const existing = trackedMap.get(item.id);
        if (existing) {
          const name = locale === "es" ? item.nameEs : item.nameEn;
          if (!confirm(`¿Eliminar "${name}" del inventario del barco?`)) { setSaving(null); return; }
          await db.removeBoatInventoryCatalogEntry(activeBoatId, item.id, existing.inventoryItemId);
          setSelected((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
          setNotice(`"${name}" eliminado del inventario.`);
        }
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(null);
    }
  }

  function toggleSelect(catalogId: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(catalogId) ? s.delete(catalogId) : s.add(catalogId);
      return s;
    });
  }

  function toggleSelectAll() {
    const visibleTracked = filtered_items().filter((item) => trackedMap.has(item.id)).map((i) => i.id);
    const allSelected = visibleTracked.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(visibleTracked));
  }

  async function handleDeleteSelected() {
    if (!activeBoatId || selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} elemento(s) del inventario del barco?`)) return;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      await Promise.all(
        Array.from(selected).map((catalogId) => {
          const existing = trackedMap.get(catalogId);
          if (!existing) return Promise.resolve();
          return db.removeBoatInventoryCatalogEntry(activeBoatId, catalogId, existing.inventoryItemId);
        })
      );
      setNotice(`${selected.size} elemento(s) eliminados del inventario.`);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando");
    } finally {
      setDeleting(false);
    }
  }

  const systemLookup = useMemo(() => {
    const map = new Map<string, { nameEs: string; nameEn: string }>();
    for (const s of systemCatalog) map.set(s.code, { nameEs: s.name_es, nameEn: s.name_en });
    return map;
  }, [systemCatalog]);

  const catalogSystems = useMemo(() => {
    const codes = Array.from(new Set(catalog.map((c) => c.systemCode)));
    return codes
      .map((code) => ({ code, ...systemLookup.get(code) ?? { nameEs: code, nameEn: code } }))
      .sort((a, b) => (locale === "es" ? a.nameEs : a.nameEn).localeCompare(locale === "es" ? b.nameEs : b.nameEn));
  }, [catalog, systemLookup, locale]);

  function filtered_items() {
    const q = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (systemFilter && item.systemCode !== systemFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (onlyTracked && !trackedMap.has(item.id)) return false;
      if (!q) return true;
      return [item.nameEs, item.nameEn, item.manufacturer ?? "", item.model ?? ""].join(" ").toLowerCase().includes(q);
    });
  }

  const filtered = useMemo(
    () => filtered_items(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, search, systemFilter, categoryFilter, onlyTracked, trackedMap]
  );

  const visibleTracked = filtered.filter((item) => trackedMap.has(item.id));
  const allVisibleSelected = visibleTracked.length > 0 && visibleTracked.every((item) => selected.has(item.id));

  if (!activeBoatId) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">Catálogo de inventario</span>
          <h2>Equipamiento del barco</h2>
        </div>
        <div className="empty-state"><p>Selecciona un barco para configurar su inventario.</p></div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="section-title">
          <span className="eyebrow">Catálogo de inventario · {boatName}</span>
          <h2>Equipamiento del barco</h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {!selectMode && trackedMap.size > 0 && (
            <button className="btn-ghost" onClick={() => setSelectMode(true)} type="button">Seleccionar</button>
          )}
          {selectMode && (
            <button className="btn-ghost" onClick={() => { setSelectMode(false); setSelected(new Set()); }} type="button">Cancelar</button>
          )}
          <span className="pill">{trackedMap.size} elementos</span>
        </div>
      </div>

      <p className="data-table-cell-muted" style={{ marginBottom: "1rem" }}>
        Marca los elementos que tiene este barco. Al marcar se crea automáticamente un registro en el inventario.
      </p>

      {error && <div className="banner warning-banner"><strong>Error</strong><span>{error}</span></div>}
      {notice && <div className="banner success-banner"><strong>OK</strong><span>{notice}</span></div>}

      <div className="filter-bar">
        <input
          className="form-input" type="search" placeholder="Buscar elemento…"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-input form-select" value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}>
          <option value="">Todos los sistemas</option>
          {catalogSystems.map((s) => (
            <option key={s.code} value={s.code}>{locale === "es" ? s.nameEs : s.nameEn}</option>
          ))}
        </select>
        <select className="form-input form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={onlyTracked} onChange={(e) => setOnlyTracked(e.target.checked)} />
          Solo marcados
        </label>
      </div>

      {loading && <p className="data-table-cell-muted">Cargando…</p>}

      <article className="panel-card">
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "1.5rem auto 1.4fr 2fr 1fr 1fr" }}>
            {selectMode
              ? <input type="checkbox" checked={allVisibleSelected} disabled={visibleTracked.length === 0} onChange={toggleSelectAll} style={{ width: "1rem", height: "1rem", cursor: "pointer" }} />
              : <span />}
            <span>En barco</span>
            <span>Sistema</span>
            <span>Elemento</span>
            <span>Categoría</span>
            <span>Fabricante/Modelo</span>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="empty-state"><p>No hay elementos con esos filtros.</p></div>
          )}
          {filtered.map((item) => {
            const isTracked = trackedMap.has(item.id);
            const isSaving = saving === item.id;
            const isSelected = selected.has(item.id);
            const sysInfo = systemLookup.get(item.systemCode);
            const sysLabel = locale === "es" ? sysInfo?.nameEs ?? item.systemCode : sysInfo?.nameEn ?? item.systemCode;
            const itemName = locale === "es" ? item.nameEs : item.nameEn;

            return (
              <div
                className="data-table-row"
                key={item.id}
                style={{
                  gridTemplateColumns: "1.5rem auto 1.4fr 2fr 1fr 1fr",
                  opacity: isSaving ? 0.5 : 1,
                  background: selectMode && isSelected ? "var(--danger-tint, rgba(239,68,68,0.07))" : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {selectMode && isTracked && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={deleting}
                      onChange={() => toggleSelect(item.id)}
                      style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                    />
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <input
                    type="checkbox"
                    checked={isTracked}
                    disabled={isSaving || !isSupabaseConfigured}
                    onChange={(e) => void handleToggle(item, e.target.checked)}
                    style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                  />
                </div>
                <span className="data-table-cell-muted">{sysLabel}</span>
                <div>
                  <strong style={{ display: "block" }}>{itemName}</strong>
                  {item.description && (
                    <span className="data-table-cell-muted" style={{ fontSize: "0.78rem" }}>{item.description}</span>
                  )}
                </div>
                <span className="data-table-cell-muted">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                <span className="data-table-cell-muted">
                  {[item.manufacturer, item.model].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </article>

      <BulkDeleteBar selectMode={selectMode} selected={selected} deleting={deleting} onDelete={handleDeleteSelected} onCancel={() => { setSelectMode(false); setSelected(new Set()); }} label="elemento" />
    </section>
  );
}
