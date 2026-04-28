import { useState } from "react";
import { flagEmoji } from "../lib/flags";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
type NavGroupDef = { label: string | null; boatScoped: boolean; superuserOnly?: boolean; collapsible?: boolean; links: NavItem[] };
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
  return EXPORT_SECTIONS.reduce((sel, s) => { sel[s.key] = true; return sel; }, {} as Record<ExportSectionKey, boolean>);
}

// label: null = sin cabecera (ítems directos sin grupo visual)
const NAV_GROUPS: NavGroupDef[] = [
  {
    label: null,
    boatScoped: false,
    links: [
      { to: "/", key: "dashboard", exact: true },
      { to: "/boats", key: "boats" },
    ],
  },
  {
    label: "navGroupDaily",
    boatScoped: true,
    collapsible: true,
    links: [
      { to: "/maintenance", key: "maintenance" },
      { to: "/observations", key: "observations" },
      { to: "/inventory", key: "inventory" },
      { to: "/hours", key: "hours" },
      { to: "/fuel", key: "fuel" },
    ],
  },
  {
    label: "navGroupPlanning",
    boatScoped: true,
    collapsible: true,
    links: [
      { to: "/preventive", key: "preventive" },
      { to: "/haul-outs", key: "haulOuts" },
      { to: "/future-actions", key: "futureActions" },
      { to: "/purchases", key: "purchases" },
    ],
  },
  {
    label: "navGroupDirectories",
    boatScoped: false,
    collapsible: true,
    links: [
      { to: "/marinas", key: "marinas" },
      { to: "/shipyards", key: "shipyards" },
    ],
  },
];

const CONFIG_LINKS: NavItem[] = [
  { to: "/systems", key: "systems" },
  { to: "/admin/maintenance-templates", key: "adminMaintenanceTemplates", requiresBoat: true },
  { to: "/hour-counters", key: "hourCounters", requiresBoat: true },
  { to: "/inventory-catalog", key: "inventoryCatalog", requiresBoat: true },
];
const ADMIN_LINKS: NavItem[] = [
  { to: "/admin/users", key: "adminUsers" },
  { to: "/admin/system-catalog", key: "adminSystemCatalog" },
];

// ── BoatSelector ──────────────────────────────────────────────────────────────
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
        {displayBoats.map((b) => {
          const flag = "flag" in b && (b as any).flag ? flagEmoji((b as any).flag) + " " : "";
          return <option key={b.id} value={b.id}>{flag}{b.name}</option>;
        })}
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

// ── NavLinks ──────────────────────────────────────────────────────────────────
function NavLinks({ links, onNav }: { links: NavItem[]; onNav: () => void }) {
  const { t } = useI18n();
  return (
    <div className="nav-group-links">
      {links.map((link) => (
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
  );
}

function CollapsibleGroup({ label, links, onNav }: {
  label: string;
  links: NavItem[];
  onNav: () => void;
}) {
  const location = useLocation();
  const hasActive = links.some((l) =>
    l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to)
  );
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="nav-group">
      <button
        className={`nav-group-toggle${hasActive ? " has-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {label}
        <span className={`nav-chevron${open ? " open" : ""}`}>›</span>
      </button>
      {open && <NavLinks links={links} onNav={onNav} />}
    </div>
  );
}

function NavGroupBlock({ group, isSuperuser, boatCount, activeBoatId, onNav }: {
  group: NavGroupDef;
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

  if (!group.label) {
    return <div className="nav-group"><NavLinks links={visibleLinks} onNav={onNav} /></div>;
  }

  if (group.collapsible) {
    return <CollapsibleGroup label={t(group.label)} links={visibleLinks} onNav={onNav} />;
  }

  return (
    <div className="nav-group">
      <span className="nav-group-label">{t(group.label)}</span>
      <NavLinks links={visibleLinks} onNav={onNav} />
    </div>
  );
}

// ── Config popover ────────────────────────────────────────────────────────────
function ConfigPopover({ isSuperuser, activeBoatId, onNav, onClose, onExport }: {
  isSuperuser: boolean;
  activeBoatId: string | null;
  onNav: () => void;
  onClose: () => void;
  onExport: (kind: ExportKind) => void;
}) {
  const { t } = useI18n();
  const configLinks = CONFIG_LINKS.filter((l) => !l.requiresBoat || activeBoatId);
  const adminLinks  = isSuperuser ? ADMIN_LINKS : [];
  function handleNav() { onNav(); onClose(); }

  return (
    <div className="config-popover">
      <div className="nav-group">
        <span className="nav-group-label">{t("navGroupConfig")}</span>
        <NavLinks links={configLinks} onNav={handleNav} />
      </div>
      {adminLinks.length > 0 && (
        <div className="nav-group" style={{ marginTop: "0.5rem" }}>
          <span className="nav-group-label">{t("navGroupAdmin")}</span>
          <NavLinks links={adminLinks} onNav={handleNav} />
        </div>
      )}
      <div className="nav-group" style={{ marginTop: "0.5rem" }}>
        <NavLinks links={[{ to: "/settings", key: "settings" }]} onNav={handleNav} />
      </div>
      <div className="nav-group" style={{ marginTop: "0.5rem" }}>
        <span className="nav-group-label">Exportar</span>
        <div className="nav-group-links">
          <button className="nav-link" style={{ textAlign: "left", background: "none", border: "1px solid transparent", width: "100%" }} type="button"
            onClick={() => { onExport("excel"); onClose(); }}>
            ↓ Excel
          </button>
          <button className="nav-link" style={{ textAlign: "left", background: "none", border: "1px solid transparent", width: "100%" }} type="button"
            onClick={() => { onExport("html"); onClose(); }}>
            ↓ HTML
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────
function SidebarContent({ onNav }: { onNav: () => void }) {
  const { t } = useI18n();
  const { session, signOut, isSuperuser, permissionLevel } = useAuth();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const { boats, allBoats, maintenanceTasksFull, haulOuts, observations, futureActions, futurePurchases, inventoryItemsFull, hourLogs, fuelLogs, marinas, shipyards } = useAppData();
  const boatCount = (isSupabaseConfigured ? allBoats : boats).length;
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);
  const [exportSelection, setExportSelection] = useState(createExportSelection);
  const [configOpen, setConfigOpen] = useState(false);

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

  const selectedSectionCount = EXPORT_SECTIONS.filter((s) => exportSelection[s.key]).length;

  return (
    <>
      <div className="brand-block">
        <span className="eyebrow">{t("appName")}</span>
        <h1 style={{ fontSize: "1.0rem", margin: "0.15rem 0 0" }}>Boat Hub</h1>
      </div>

      <BoatSelector />

      <nav className="nav-links">
        {NAV_GROUPS.map((group, i) => (
          <NavGroupBlock
            key={group.label ?? `unlabelled-${i}`}
            group={group}
            isSuperuser={isSuperuser}
            boatCount={boatCount}
            activeBoatId={activeBoatId}
            onNav={onNav}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ position: "relative" }}>
          {configOpen && (
            <ConfigPopover
              isSuperuser={isSuperuser}
              activeBoatId={activeBoatId}
              onNav={onNav}
              onClose={() => setConfigOpen(false)}
              onExport={openExport}
            />
          )}
          <div className="session-panel">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: 0 }}>
              <span style={{ fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user.email ?? "demo@boat-hub.local"}
              </span>
              <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>
                {isSuperuser ? "superuser" : (permissionLevel ?? "—")}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button
                className="ghost-button"
                style={{ fontSize: "0.8rem", opacity: 0.75 }}
                onClick={() => setConfigOpen((v) => !v)}
                type="button"
              >
                {t("navGroupConfig")}
              </button>
              {session && (
                <button className="ghost-button" onClick={() => void signOut()} type="button">
                  {t("signOut")}
                </button>
              )}
            </div>
          </div>
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
              <button className="btn-ghost" type="button" onClick={() => setExportKind(null)}>Cancelar</button>
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

// ── AppShell ──────────────────────────────────────────────────────────────────
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
