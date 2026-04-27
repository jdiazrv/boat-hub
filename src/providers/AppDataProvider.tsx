import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import * as db from "../lib/db";
import { loadAppData } from "../lib/data";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import type {
  AppData,
  Boat,
  FuelLog,
  FutureAction,
  FuturePurchase,
  HaulOut,
  HourLog,
  InventoryItem,
  MaintenanceTask,
  Marina,
  Observation,
  Owner,
  PreventiveTask,
  Shipyard,
  SystemCatalogEntry
} from "../lib/types";

type AppDataContextValue = AppData & {
  loading: boolean;
  initialLoad: boolean;
  refresh: () => Promise<void>;
  // Extended entities
  owners: Owner[];
  allBoats: Boat[];
  systemCatalog: SystemCatalogEntry[];
  maintenanceTasksFull: MaintenanceTask[];
  preventiveTasksFull: PreventiveTask[];
  haulOuts: HaulOut[];
  observations: Observation[];
  futureActions: FutureAction[];
  futurePurchases: FuturePurchase[];
  inventoryItemsFull: InventoryItem[];
  hourLogs: HourLog[];
  fuelLogs: FuelLog[];
  marinas: Marina[];
  shipyards: Shipyard[];
  /** Devuelve las horas de motor más recientes registradas para un barco, o null si no hay ningún apunte. */
  latestEngineHours: (boatId: string) => number | null;
};

const emptyData: AppData = {
  boats: [],
  maintenanceTasks: [],
  preventiveTasks: [],
  inventoryItems: [],
  source: "demo",
  error: null
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Extended state (only used when Supabase is configured)
  const [owners, setOwners] = useState<Owner[]>([]);
  const [allBoats, setAllBoats] = useState<Boat[]>([]);
  const [systemCatalog, setSystemCatalog] = useState<SystemCatalogEntry[]>([]);
  const [maintenanceTasksFull, setMaintenanceTasksFull] = useState<MaintenanceTask[]>([]);
  const [preventiveTasksFull, setPreventiveTasksFull] = useState<PreventiveTask[]>([]);
  const [haulOuts, setHaulOuts] = useState<HaulOut[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [futureActions, setFutureActions] = useState<FutureAction[]>([]);
  const [futurePurchases, setFuturePurchases] = useState<FuturePurchase[]>([]);
  const [inventoryItemsFull, setInventoryItemsFull] = useState<InventoryItem[]>([]);
  const [hourLogs, setHourLogs] = useState<HourLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [shipyards, setShipyards] = useState<Shipyard[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const nextData = await loadAppData();
    setData(nextData);

    if (isSupabaseConfigured) {
      try {
        const allBoatsData = await db.fetchBoats();
        const visibleBoatIds = allBoatsData.map((boat) => boat.id);

        const [
          ownersData,
          catalogData,
          maintenanceData,
          preventiveData,
          haulOutsData,
          observationsData,
          futureActionsData,
          futurePurchasesData,
          inventoryData,
          hourLogsData,
          fuelLogsData,
          marinasData,
          shipyardsData
        ] = await Promise.allSettled([
          db.fetchOwners(),
          db.fetchSystemCatalog(),
          visibleBoatIds.length ? db.fetchMaintenanceTasks(visibleBoatIds) : Promise.resolve([]),
          Promise.resolve([]),
          visibleBoatIds.length ? db.fetchHaulOuts(visibleBoatIds) : Promise.resolve([]),
          visibleBoatIds.length ? db.fetchObservations(visibleBoatIds) : Promise.resolve([]),
          visibleBoatIds.length ? db.fetchFutureActions(visibleBoatIds) : Promise.resolve([]),
          visibleBoatIds.length ? db.fetchFuturePurchases(visibleBoatIds) : Promise.resolve([]),
          visibleBoatIds.length ? db.fetchInventoryItems(visibleBoatIds) : Promise.resolve([]),
          visibleBoatIds.length ? db.fetchHourLogs(visibleBoatIds) : Promise.resolve([]),
          visibleBoatIds.length ? db.fetchFuelLogs(visibleBoatIds) : Promise.resolve([]),
          db.fetchMarinas(),
          db.fetchShipyards()
        ]);

        if (ownersData.status === "fulfilled") setOwners(ownersData.value);
        setAllBoats(allBoatsData);
        if (catalogData.status === "fulfilled") setSystemCatalog(catalogData.value);
        if (maintenanceData.status === "fulfilled") setMaintenanceTasksFull(maintenanceData.value);
        // preventiveData slot reserved but unused (no fetchPreventivePlans)
        if (haulOutsData.status === "fulfilled") setHaulOuts(haulOutsData.value);
        if (observationsData.status === "fulfilled") setObservations(observationsData.value);
        if (futureActionsData.status === "fulfilled") setFutureActions(futureActionsData.value);
        if (futurePurchasesData.status === "fulfilled") setFuturePurchases(futurePurchasesData.value);
        if (inventoryData.status === "fulfilled") setInventoryItemsFull(inventoryData.value);
        if (hourLogsData.status === "fulfilled") setHourLogs(hourLogsData.value);
        if (fuelLogsData.status === "fulfilled") setFuelLogs(fuelLogsData.value);
        if (marinasData.status === "fulfilled") setMarinas(marinasData.value);
        if (shipyardsData.status === "fulfilled") setShipyards(shipyardsData.value);
      } catch {
        // Ignore partial failures
      }
    }

    setLoading(false);
    setInitialLoad(false);
  }, []);

  // Wait for auth to resolve before loading data — avoids fetching without JWT.
  // Re-run when the logged-in user changes (login / logout).
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, userId, refresh]);

  const latestEngineHours = useCallback((boatId: string): number | null => {
    const boatLogs = hourLogs
      .filter((l) => l.boatId === boatId && l.hours != null)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
    return boatLogs.length > 0 ? boatLogs[0].hours : null;
  }, [hourLogs]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...data,
      loading,
      initialLoad,
      refresh,
      owners,
      allBoats,
      systemCatalog,
      maintenanceTasksFull,
      preventiveTasksFull,
      haulOuts,
      observations,
      futureActions,
      futurePurchases,
      inventoryItemsFull,
      hourLogs,
      fuelLogs,
      marinas,
      shipyards,
      latestEngineHours,
    }),
    [
      data, loading, initialLoad, refresh, owners, allBoats, systemCatalog,
      maintenanceTasksFull, preventiveTasksFull, haulOuts, observations,
      futureActions, futurePurchases, inventoryItemsFull, hourLogs,
      fuelLogs, marinas, shipyards, latestEngineHours
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
}
