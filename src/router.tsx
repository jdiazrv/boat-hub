import { Link, createBrowserRouter } from "react-router-dom";
import type { ComponentType } from "react";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/DashboardPage";

// Every page except the dashboard is loaded on demand so the first paint does not
// download the admin screens, the schedule Gantt, exports, etc.
function page<T extends Record<string, ComponentType>>(load: () => Promise<T>, name: keyof T) {
  return async () => ({ Component: (await load())[name] });
}

function NotFoundPage() {
  return (
    <section className="page">
      <div className="empty-state">
        <h2>404</h2>
        <p>Esta página no existe.</p>
        <Link to="/">Volver al panel</Link>
      </div>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "boats", lazy: page(() => import("./pages/BoatsPage"), "BoatsPage") },
      { path: "systems", lazy: page(() => import("./pages/BoatSystemsPage"), "BoatSystemsPage") },
      { path: "maintenance", lazy: page(() => import("./pages/MaintenancePage"), "MaintenancePage") },
      { path: "preventive", lazy: page(() => import("./pages/PreventivePage"), "PreventivePage") },
      { path: "haul-outs", lazy: page(() => import("./pages/HaulOutsPage"), "HaulOutsPage") },
      { path: "observations", lazy: page(() => import("./pages/ObservationsPage"), "ObservationsPage") },
      { path: "future-actions", lazy: page(() => import("./pages/FutureActionsPage"), "FutureActionsPage") },
      { path: "purchases", lazy: page(() => import("./pages/PurchasesPage"), "PurchasesPage") },
      { path: "inventory", lazy: page(() => import("./pages/InventoryPage"), "InventoryPage") },
      { path: "inventory-catalog", lazy: page(() => import("./pages/InventoryCatalogPage"), "InventoryCatalogPage") },
      { path: "hours", lazy: page(() => import("./pages/HoursPage"), "HoursPage") },
      { path: "hour-counters", lazy: page(() => import("./pages/HourCountersPage"), "HourCountersPage") },
      { path: "fuel", lazy: page(() => import("./pages/FuelPage"), "FuelPage") },
      { path: "marinas", lazy: page(() => import("./pages/MarinasPage"), "MarinasPage") },
      { path: "shipyards", lazy: page(() => import("./pages/ShipyardsPage"), "ShipyardsPage") },
      { path: "schedule", lazy: page(() => import("./pages/SchedulePage"), "SchedulePage") },
      { path: "settings", lazy: page(() => import("./pages/SettingsPage"), "SettingsPage") },
      { path: "admin/users", lazy: page(() => import("./pages/AdminUsersPage"), "AdminUsersPage") },
      {
        path: "admin/maintenance-templates",
        lazy: page(() => import("./pages/AdminMaintenanceTemplatesPage"), "AdminMaintenanceTemplatesPage"),
      },
      { path: "admin/system-catalog", lazy: page(() => import("./pages/AdminSystemCatalogPage"), "AdminSystemCatalogPage") },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
