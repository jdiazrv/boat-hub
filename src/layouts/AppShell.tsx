import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { exportAllToExcel } from "../lib/exportExcel";
import { exportAllToHtml } from "../lib/exportHtml";
import { CheckboxField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { ActiveBoatProvider, useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAuth } from "../providers/AuthProvider";
import { useAppData } from "../providers/AppDataProvider";

type NavItem = { to: string; key: string; exact?: boolean; superuserOnly?: boolean; multiBoatOnly?: boolean; requiresBoat?: boolean };
type NavGroup = { label: string; boatScoped: boolean; superuserOnly?: boolean; links: NavItem[] };
type ExportKind = "excel" | "html";
type ExportSectionKey =
  | "maintenanceTasks"
  | "haulOuts"
  | "observations"
  | "futureActions"
  | "futurePurchases"
  | "inventoryItems"
  | "hourLogs"
  | "fuelLogs"
  | "marinas"
  | "shipyards";

const EXPORT_SECTIONS: { key: ExportSectionKey; label: string }[] = [
  { key: "maintenanceTasks", label: "Mantenimiento" },
  { key: "haulOuts", label: "Varadas" },
  { key: "observations", label: "Observaciones" },
  { key: "futureActions", label: "Acciones futuras" },
  { key: "futurePurchases", label: "Compras" },
  { key: "inventoryItems", label: "Inventario" },
  { key: "hourLogs", label: "Horas motor" },
  { key: "fuelLogs", label: "Combustible" },
  { key: "marinas", label: "Marinas" },
  { key: "shipyards", label: "Varaderos" },
];

function createExportSelection() {
  return EXPORT_SECTIONS.reduce((selection, section) => {
    selection[section.key] = true;
    return selection;
  }, {} as Record<ExportSectionKey, boolean>);
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "navGroupFleet",
    boatScoped: false,
    links: [
      { to: "/", key: "dashboard", exact: true },
      { to: "/boats", key: "boats", multiBoatOnly: true },
    ],
  },
  {
    label: "navGroupMaintenance",
    boatScoped: true,
    links: [
      { to: "/maintenance", key: "maintenance" },
      { to: "/preventive", key: "preventive" },
      { to: "/observations", key: "observations" },
      { to: "/haul-outs", key: "haulOuts" },
    ],
  },
  {
    label: "navGroupPlanning",
    boatScoped: true,
    links: [
      { to: "/future-actions", key: "futureActions" },
      { to: "/purchases", key: "purchases" },
    ],
  },
  {
    label: "navGroupResources",
    boatScoped: true,
    links: [
      { to: "/inventory", key: "inventory" },
      { to: "/hours", key: "hours" },
      { to: "/fuel", key: "fuel" },
    ],
  },
  {
    label: "navGroupDirectories",
    boatScoped: false,
    links: [
      { to: "/marinas", key: "marinas" },
      { to: "/shipyards", key: "shipyards" },
    ],
  },
  {
    label: "navGroupConfig",
    boatScoped: false,
    links: [
      { to: "/systems", key: "systems" },
      { to: "/admin/maintenance-templates", key: "adminMaintenanceTemplates", requiresBoat: true },
      { to: "/inventory-catalog", key: "inventoryCatalog", requiresBoat: true },
    ],
  },
  {
    label: "navGroupAdmin",
    boatScoped: false,
    superuserOnly: true,
    links: [
      { to: "/owners", key: "owners" },
      { to: "/admin/users", key: "adminUsers" },
      { to: "/admin/system-catalog", key: "adminSystemCatalog" },
    ],
  },
  {
    label: "navGroupSettings",
    boatScoped: false,
    links: [
      { to: "/settings", key: "settings" },
    ],
  },
];

function BoatSelector() {
  const { boats, allBoats } = useAppData();
  const { activeBoatId, setActiveBoatId, activeBoat } = useActiveBoat();
  const displayBoats = isSupabaseConfigured ? allBoats : boats;

  if (displayBoats.length <= 1) return null;

  return (
    <div className="boat-selector">
      <span className="boat-selector-label">Barco activo</span>
      <select
        className="boat-selector-select"
        value={activeBoatId ?? ""}
        onChange={(e) => setActiveBoatId(e.target.value || null)}
      >
        {displayBoats.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {activeBoat && (
        <span className="boat-selector-sub">
          {"boatType" in activeBoat
            ? (activeBoat as { boatType?: string | null }).boatType
            : ("type" in activeBoat ? (activeBoat as { type: string }).type : null) ?? null}
        </span>
      )}
    </div>
  );
}

function NavGroup({
  group,
  isSuperuser,
  boatCount,
  activeBoatId,
  onNav,
}: {
  group: NavGroup;
  isSuperuser: boolean;
  boatCount: number;
  activeBoatId: string | null;
  onNav: () => void;
}) {
  const { t } = useI18n();

  const visibleLinks = group.links.filter((link) => {
    if (link.superuserOnly && !isSuperuser) return false;
    if (link.multiBoatOnly && boatCount <= 1) return false;
    if (link.requiresBoat && !activeBoatId) return false;
    return true;
  });

  if (!visibleLinks.length) return null;
  if (group.boatScoped && !activeBoatId) return null;
  if (group.superuserOnly && !isSuperuser) return null;

  return (
    <div className="nav-group">
      <span className="nav-group-label">{t(group.label)}</span>
      <div className="nav-group-links">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={onNav}
          >
            {t(link.key)}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function SidebarContent({ onNav }: { onNav: () => void }) {
  const { t } = useI18n();
  const { session, signOut, isSuperuser } = useAuth();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const { boats, allBoats, maintenanceTasksFull, haulOuts, observations, futureActions, futurePurchases, inventoryItemsFull, hourLogs, fuelLogs, marinas, shipyards } = useAppData();
  const boatCount = (isSupabaseConfigured ? allBoats : boats).length;
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);
  const [exportSelection, setExportSelection] = useState(createExportSelection);

  const exportData = {
    maintenanceTasks: maintenanceTasksFull,
    haulOuts,
    observations,
    futureActions,
    futurePurchases,
    inventoryItems: inventoryItemsFull,
    hourLogs,
    fuelLogs,
    marinas,
    shipyards,
  };

  function openExport(kind: ExportKind) {
    setExportSelection(createExportSelection());
    setExportKind(kind);
  }

  function runExport() {
    if (!exportKind) return;
    const boatName = activeBoat?.name ?? "Todos";
    const fullBoat = activeBoatId ? (allBoats.find((b) => b.id === activeBoatId) ?? null) : null;
    if (exportKind === "excel") exportAllToExcel(boatName, exportData, fullBoat, exportSelection);
    else exportAllToHtml(boatName, exportData, fullBoat, exportSelection);
    setExportKind(null);
  }

  function toggleExportSection(key: ExportSectionKey) {
    setExportSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const selectedSectionCount = EXPORT_SECTIONS.filter((section) => exportSelection[section.key]).length;

  return (
    <>
      <div className="brand-block">
        <span className="eyebrow">{t("appName")}</span>
        <h1 style={{ fontSize: "1.0rem", margin: "0.15rem 0 0" }}>Boat Hub</h1>
      </div>

      <BoatSelector />

      <nav className="nav-links">
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.label}
            group={group}
            isSuperuser={isSuperuser}
            boatCount={boatCount}
            activeBoatId={activeBoatId}
            onNav={onNav}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="ghost-button"
          onClick={() => openExport("excel")}
          type="button"
          style={{ width: "100%", textAlign: "left", marginBottom: "0.5rem", fontSize: "0.82rem", opacity: 0.75 }}
          title="Elegir secciones y exportar a Excel"
        >
          ↓ Exportar Excel
        </button>
        <button
          className="ghost-button"
          onClick={() => openExport("html")}
          type="button"
          style={{ width: "100%", textAlign: "left", marginBottom: "0.5rem", fontSize: "0.82rem", opacity: 0.75 }}
          title="Elegir secciones y exportar a HTML"
        >
          ↓ Exportar HTML
        </button>
        <div className="session-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className={`pill ${isSupabaseConfigured ? "online" : "demo"}`}>
              {isSupabaseConfigured ? t("connected") : t("demo")}
            </span>
            <span style={{ fontSize: "0.78rem", opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user.email ?? "demo@boat-hub.local"}
            </span>
          </div>
          {session && (
            <button className="ghost-button" onClick={() => void signOut()} type="button">
              {t("signOut")}
            </button>
          )}
        </div>
      </div>

      {exportKind && (
        <Modal title={`Exportar ${exportKind === "excel" ? "Excel" : "HTML"}`} onClose={() => setExportKind(null)}>
          <div className="form-stack">
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.9rem" }}>
              Elige qué secciones quieres incluir. Por defecto se exporta todo.
            </p>
            <div className="form-checkbox-grid">
              {EXPORT_SECTIONS.map((section) => (
                <CheckboxField
                  key={section.key}
                  label={`${section.label} (${exportData[section.key].length})`}
                  checked={exportSelection[section.key]}
                  onChange={() => toggleExportSection(section.key)}
                />
              ))}
            </div>
            <div className="form-actions">
              <button className="btn-ghost" type="button" onClick={() => setExportKind(null)}>
                Cancelar
              </button>
              <button className="btn-primary" type="button" onClick={runExport} disabled={selectedSectionCount === 0}>
                Exportar {selectedSectionCount} sección{selectedSectionCount === 1 ? "" : "es"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function AppShellInner() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar${navOpen ? " sidebar-open" : ""}`}>
        <SidebarContent onNav={() => setNavOpen(false)} />
      </aside>

      <main className="content-panel">
        <button
          className="mobile-nav-toggle"
          onClick={() => setNavOpen((v) => !v)}
          type="button"
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <Outlet />
      </main>
    </div>
  );
}

export function AppShell() {
  const { boats, allBoats } = useAppData();
  const displayBoats = isSupabaseConfigured ? allBoats : boats;

  return (
    <ActiveBoatProvider boats={displayBoats}>
      <AppShellInner />
    </ActiveBoatProvider>
  );
}
