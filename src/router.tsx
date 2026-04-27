import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminMaintenanceTemplatesPage } from "./pages/AdminMaintenanceTemplatesPage";
import { AdminSystemCatalogPage } from "./pages/AdminSystemCatalogPage";
import { BoatSystemsPage } from "./pages/BoatSystemsPage";
import { BoatsPage } from "./pages/BoatsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FuelPage } from "./pages/FuelPage";
import { FutureActionsPage } from "./pages/FutureActionsPage";
import { HaulOutsPage } from "./pages/HaulOutsPage";
import { HoursPage } from "./pages/HoursPage";
import { InventoryCatalogPage } from "./pages/InventoryCatalogPage";
import { InventoryPage } from "./pages/InventoryPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { MarinasPage } from "./pages/MarinasPage";
import { ObservationsPage } from "./pages/ObservationsPage";
import { OwnersPage } from "./pages/OwnersPage";
import { PreventivePage } from "./pages/PreventivePage";
import { PurchasesPage } from "./pages/PurchasesPage";
import { SchedulePage } from "./pages/SchedulePage";
import { SettingsPage } from "./pages/SettingsPage";
import { ShipyardsPage } from "./pages/ShipyardsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "boats", element: <BoatsPage /> },
      { path: "owners", element: <OwnersPage /> },
      { path: "systems", element: <BoatSystemsPage /> },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "preventive", element: <PreventivePage /> },
      { path: "haul-outs", element: <HaulOutsPage /> },
      { path: "observations", element: <ObservationsPage /> },
      { path: "future-actions", element: <FutureActionsPage /> },
      { path: "purchases", element: <PurchasesPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "inventory-catalog", element: <InventoryCatalogPage /> },
      { path: "hours", element: <HoursPage /> },
      { path: "fuel", element: <FuelPage /> },
      { path: "marinas", element: <MarinasPage /> },
      { path: "shipyards", element: <ShipyardsPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "admin/users", element: <AdminUsersPage /> }
      ,{ path: "admin/maintenance-templates", element: <AdminMaintenanceTemplatesPage /> }
      ,{ path: "admin/system-catalog", element: <AdminSystemCatalogPage /> }
    ]
  }
]);
