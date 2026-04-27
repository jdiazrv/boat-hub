import { boats as demoBoats, inventoryItems as demoInventoryItems, maintenanceTasks as demoMaintenanceTasks, preventiveTasks as demoPreventiveTasks } from "../data/mock";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { AppData, BoatSummary, InventoryItem, MaintenanceTask, PreventiveTask } from "./types";

type BoatRow = {
  id: string;
  name: string;
  registration_number: string | null;
  boat_type: string | null;
  owner_boats: Array<{
    owner_companies: Array<{
      name: string;
    }> | null;
  }> | null;
  haul_outs: Array<{
    planned_date: string | null;
    start_date: string | null;
  }> | null;
  maintenance_tasks: Array<{
    id: string;
  }> | null;
};

type MaintenanceRow = {
  id: string;
  boat_id: string;
  title: string;
  kind: MaintenanceTask["kind"];
  status: MaintenanceTask["status"];
  priority: MaintenanceTask["priority"];
  due_date: string | null;
  responsible: string | null;
  performed_by: string | null;
  boat_systems: Array<{
    system_catalog: Array<{
      name_en: string;
    }> | null;
  }> | null;
};

type PreventiveRow = {
  id: string;
  boat_id: string;
  title: string;
  interval_days: number | null;
  interval_hours: number | null;
  next_due_date: string | null;
  last_done_at: string | null;
  status: string;
  boat_systems: Array<{
    system_catalog: Array<{
      name_en: string;
    }> | null;
  }> | null;
};

type InventoryRow = {
  id: string;
  boat_id: string;
  name: string;
  stock: number;
  minimum_stock: number | null;
  location: string | null;
  supplier: string | null;
  boat_systems: Array<{
    system_catalog: Array<{
      name_en: string;
    }> | null;
  }> | null;
};

const demoData: AppData = {
  boats: demoBoats,
  maintenanceTasks: demoMaintenanceTasks,
  preventiveTasks: demoPreventiveTasks,
  inventoryItems: demoInventoryItems,
  source: "demo",
  error: null
};

function toRule(intervalDays: number | null, intervalHours: number | null) {
  if (intervalDays && intervalHours) {
    return `Every ${intervalDays} days or ${intervalHours} engine hours`;
  }

  if (intervalDays) {
    return `Every ${intervalDays} days`;
  }

  if (intervalHours) {
    return `Every ${intervalHours} engine hours`;
  }

  return "Custom interval";
}

function systemNameFromRelation(
  relation:
    | Array<{
        system_catalog: Array<{
          name_en: string;
        }> | null;
      }>
    | null
) {
  return relation?.[0]?.system_catalog?.[0]?.name_en ?? "Other and Miscellaneous";
}

function toPreventiveState(row: PreventiveRow): PreventiveTask["state"] {
  if (row.status === "done") {
    return "done";
  }

  if (row.next_due_date) {
    const nextDue = new Date(row.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (nextDue < today) {
      return "overdue";
    }
  }

  return "upcoming";
}

function sortByDateAsc<T>(rows: T[], pick: (row: T) => string | null) {
  return [...rows].sort((left, right) => {
    const leftValue = pick(left);
    const rightValue = pick(right);

    if (!leftValue && !rightValue) {
      return 0;
    }

    if (!leftValue) {
      return 1;
    }

    if (!rightValue) {
      return -1;
    }

    return leftValue.localeCompare(rightValue);
  });
}

export async function loadAppData(): Promise<AppData> {
  if (!isSupabaseConfigured || !supabase) {
    return demoData;
  }

  try {
    const boatsResult = await supabase
      .from("boats")
      .select(
        `
            id,
            name,
            registration_number,
            boat_type,
            owner_boats (
              owner_companies (
                name
              )
            ),
            haul_outs (
              planned_date,
              start_date
            ),
            maintenance_tasks (
              id
            )
          `
      )
      .order("name", { ascending: true });

    if (boatsResult.error) {
      throw boatsResult.error;
    }

    const visibleBoatIds = ((boatsResult.data ?? []) as BoatRow[]).map((boat) => boat.id);

    if (!visibleBoatIds.length) {
      return {
        boats: [],
        maintenanceTasks: [],
        preventiveTasks: [],
        inventoryItems: [],
        source: "supabase",
        error: null
      };
    }

    const [maintenanceResult, preventiveResult, inventoryResult] = await Promise.all([
      supabase
        .from("maintenance_tasks")
        .select(
          `
            id,
            boat_id,
            title,
            kind,
            status,
            priority,
            due_date,
            responsible,
            performed_by,
            boat_systems (
              system_catalog (
                name_en
              )
            )
          `
        )
        .in("boat_id", visibleBoatIds)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("preventive_plans")
        .select(
          `
            id,
            boat_id,
            title,
            interval_days,
            interval_hours,
            next_due_date,
            last_done_at,
            status,
            boat_systems (
              system_catalog (
                name_en
              )
            )
          `
        )
        .in("boat_id", visibleBoatIds)
        .order("next_due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("inventory_items")
        .select(
          `
            id,
            boat_id,
            name,
            stock,
            minimum_stock,
            location,
            supplier,
            boat_systems (
              system_catalog (
                name_en
              )
            )
          `
        )
        .in("boat_id", visibleBoatIds)
        .order("name", { ascending: true })
    ]);

    const firstError =
      maintenanceResult.error ||
      preventiveResult.error ||
      inventoryResult.error;

    if (firstError) {
      throw firstError;
    }

    const boats = (boatsResult.data as unknown as BoatRow[]).map((row): BoatSummary => {
      const nextHaulOut =
        sortByDateAsc(row.haul_outs ?? [], (haulOut) => haulOut.planned_date ?? haulOut.start_date)[0];

      return {
        id: row.id,
        name: row.name,
        type: row.boat_type ?? "Boat",
        registrationNumber: row.registration_number ?? "-",
        owners:
          row.owner_boats
            ?.map((ownerBoat) => ownerBoat.owner_companies?.[0]?.name)
            .filter((name): name is string => Boolean(name)) ?? [],
        nextHaulOut: nextHaulOut?.planned_date ?? nextHaulOut?.start_date ?? null,
        openTasks:
          row.maintenance_tasks?.filter((task) => Boolean(task.id)).length ?? 0
      };
    });

    const maintenanceTasks = (maintenanceResult.data as unknown as MaintenanceRow[]).map(
      (row): MaintenanceTask => ({
        id: row.id,
        boatId: row.boat_id,
        boatSystemId: null,
        boatComponentId: null,
        haulOutId: null,
        title: row.title,
        description: null,
        kind: row.kind,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        doneDate: null,
        responsible: row.responsible,
        performedBy: row.performed_by,
        engineHours: null,
        cost: null,
        notes: null,
        updatedAt: new Date().toISOString(),
        systemName: systemNameFromRelation(row.boat_systems),
        boatName: "",
      })
    );

    const preventiveTasks = (preventiveResult.data as unknown as PreventiveRow[]).map(
      (row): PreventiveTask => ({
        id: row.id,
        boatId: row.boat_id,
        boatSystemId: null,
        title: row.title,
        description: null,
        intervalDays: row.interval_days,
        intervalHours: row.interval_hours,
        nextDueDate: row.next_due_date,
        lastDoneAt: row.last_done_at,
        status: row.status as PreventiveTask["status"],
        responsible: null,
        notes: null,
        rule: toRule(row.interval_days, row.interval_hours),
        state: toPreventiveState(row),
        systemName: systemNameFromRelation(row.boat_systems),
        boatName: "",
      })
    );

    const inventoryItems = (inventoryResult.data as unknown as InventoryRow[]).map(
      (row): InventoryItem => ({
        id: row.id,
        boatId: row.boat_id,
        boatName: "",
        boatSystemId: null,
        boatComponentId: null,
        name: row.name,
        category: "spare_part",
        reference: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        description: null,
        quantity: Number(row.stock ?? 0),
        unit: null,
        stock: Number(row.stock ?? 0),
        minimumStock: Number(row.minimum_stock ?? 0),
        status: "on_board",
        minimum: Number(row.minimum_stock ?? 0),
        location: row.location ?? "-",
        supplier: row.supplier ?? "-",
        purchaseDate: null,
        acquisitionCost: null,
        cost: null,
        notes: null,
        systemName: systemNameFromRelation(row.boat_systems),
        system: systemNameFromRelation(row.boat_systems),
      })
    );

    return {
      boats,
      maintenanceTasks,
      preventiveTasks,
      inventoryItems,
      source: "supabase",
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Supabase data";

    return {
      ...demoData,
      error: message
    };
  }
}
