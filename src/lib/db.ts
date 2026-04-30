import { supabase } from "./supabase";
import type {
  Boat,
  BoatCatalogOverride,
  BoatCatalogOverrideSpare,
  BoatComponent,
  BoatDocument,
  BoatDimensions,
  BoatIdentifiers,
  BoatInventoryCatalogEntry,
  BoatSystem,
  BoatTank,
  FuelLog,
  FutureAction,
  FuturePurchase,
  HaulOut,
  HaulOutItem,
  HourCounter,
  HourLog,
  InventoryCatalogItem,
  InventoryItem,
  BoatScheduleEntry,
  MaintenanceTemplate,
  MaintenanceTemplateSpare,
  MaintenanceTask,
  Marina,
  Observation,
  Owner,
  SchedulePlan,
  Shipyard,
  SystemCatalogEntry,
} from "./types";

function db() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentUserId() {
  const { data, error } = await db().auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

function applyBoatScope<T extends { eq: (column: string, value: string) => T; in: (column: string, values: string[]) => T }>(
  query: T,
  boatScope?: string | string[]
) {
  if (!boatScope) {
    return query;
  }

  return Array.isArray(boatScope) ? query.in("boat_id", boatScope) : query.eq("boat_id", boatScope);
}

function parseCoordinates(value: string | null | undefined) {
  if (!value) return { latitude: null, longitude: null };
  const [latitude, longitude] = value
    .split(",")
    .map((part) => {
      const parsed = Number(part.trim());
      return Number.isFinite(parsed) ? parsed : null;
    });
  return { latitude: latitude ?? null, longitude: longitude ?? null };
}

function formatCoordinates(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (latitude == null && longitude == null) return null;
  return `${latitude ?? ""}, ${longitude ?? ""}`;
}

function isMissingColumnError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "42703"
  );
}

function parseRates(value: unknown) {
  const rates = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const numberValue = (key: string) => {
    const value = rates[key];
    return typeof value === "number" ? value : null;
  };
  const stringValue = (key: string) => {
    const value = rates[key];
    return typeof value === "string" ? value : null;
  };

  return {
    liftInOutPrice: numberValue("liftInOutPrice"),
    pressureWashPrice: numberValue("pressureWashPrice"),
    dailyStoragePrice: numberValue("dailyStoragePrice"),
    monthlyStoragePrice: numberValue("monthlyStoragePrice"),
    annualStoragePrice: numberValue("annualStoragePrice"),
    currency: stringValue("currency"),
    vatPercent: numberValue("vatPercent"),
  };
}

function formatRates(payload: {
  liftInOutPrice?: number | null;
  pressureWashPrice?: number | null;
  dailyStoragePrice?: number | null;
  monthlyStoragePrice?: number | null;
  annualStoragePrice?: number | null;
  currency?: string | null;
  vatPercent?: number | null;
}) {
  return {
    liftInOutPrice: payload.liftInOutPrice ?? null,
    pressureWashPrice: payload.pressureWashPrice ?? null,
    dailyStoragePrice: payload.dailyStoragePrice ?? null,
    monthlyStoragePrice: payload.monthlyStoragePrice ?? null,
    annualStoragePrice: payload.annualStoragePrice ?? null,
    currency: payload.currency ?? null,
    vatPercent: payload.vatPercent ?? null,
  };
}

// ─── System Catalog ───────────────────────────────────────────────────────────

export async function fetchSystemCatalog(): Promise<SystemCatalogEntry[]> {
  const { data, error } = await db()
    .from("system_catalog")
    .select("id, code, name_es, name_en")
    .order("name_en");
  if (error) throw error;
  return (data ?? []) as SystemCatalogEntry[];
}

export async function createSystemCatalogEntry(payload: Omit<SystemCatalogEntry, "id">) {
  const { error } = await db()
    .from("system_catalog")
    .insert({
      code: payload.code,
      name_es: payload.name_es,
      name_en: payload.name_en,
    });
  if (error) throw error;
}

export async function updateSystemCatalogEntry(id: string, payload: Partial<Omit<SystemCatalogEntry, "id">>) {
  const { error } = await db()
    .from("system_catalog")
    .update({
      code: payload.code,
      name_es: payload.name_es,
      name_en: payload.name_en,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSystemCatalogEntry(id: string) {
  const { error } = await db().from("system_catalog").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchMaintenanceTemplates(boatId?: string | null): Promise<MaintenanceTemplate[]> {
  let q = db()
    .from("maintenance_templates")
    .select(
      `id, boat_id, created_by, system_id, title, title_es, title_en,
       description, description_es, description_en,
       kind, default_priority, sort_order, interval_days, interval_hours,
       system_catalog ( code, name_es, name_en )`
    )
    .order("sort_order")
    .order("title");

  if (boatId) {
    // global templates (boat_id is null) + this boat's own templates
    q = q.or(`boat_id.is.null,boat_id.eq.${boatId}`);
  } else {
    q = q.is("boat_id", null);
  }

  const { data, error } = await q;
  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => {
    const sc = Array.isArray(row.system_catalog) ? row.system_catalog[0] : row.system_catalog;
    return {
      id: row.id,
      boatId: row.boat_id ?? null,
      createdBy: row.created_by ?? null,
      systemId: row.system_id,
      systemCode: sc?.code ?? "",
      systemNameEs: sc?.name_es ?? "",
      systemNameEn: sc?.name_en ?? "",
      title: row.title,
      titleEs: row.title_es ?? null,
      titleEn: row.title_en ?? null,
      description: row.description,
      descriptionEs: row.description_es ?? null,
      descriptionEn: row.description_en ?? null,
      kind: row.kind,
      defaultPriority: row.default_priority,
      sortOrder: row.sort_order ?? 0,
      intervalDays: row.interval_days ?? null,
      intervalHours: row.interval_hours ?? null,
    };
  });
}

// ─── Schedule Plans (superuser reference plans) ───────────────────────────────

export async function fetchSchedulePlans(): Promise<SchedulePlan[]> {
  // Fetch plans
  const { data: plansData, error: plansError } = await db()
    .from("maintenance_schedule_plans")
    .select("id, name_es, name_en, description_es, description_en, sort_order")
    .order("sort_order");
  if (plansError) throw plansError;
  if (!plansData || plansData.length === 0) return [];

  const planIds = (plansData as any[]).map((p) => p.id);

  // Fetch items with templates in a single query using explicit FK hint
  const { data: itemsData, error: itemsError } = await db()
    .from("maintenance_schedule_plan_items")
    .select(`
      id, plan_id, template_id, interval_days, interval_hours, sort_order,
      maintenance_templates!maintenance_schedule_plan_items_template_id_fkey (
        id, boat_id, created_by, system_id, title, title_es, title_en,
        description, description_es, description_en, kind, default_priority, sort_order,
        system_catalog ( code, name_es, name_en )
      )
    `)
    .in("plan_id", planIds)
    .order("sort_order");
  if (itemsError) throw itemsError;

  const itemsByPlan = new Map<string, any[]>();
  for (const item of (itemsData ?? []) as any[]) {
    const list = itemsByPlan.get(item.plan_id) ?? [];
    list.push(item);
    itemsByPlan.set(item.plan_id, list);
  }

  return (plansData as any[]).map((plan) => ({
    id: plan.id,
    nameEs: plan.name_es,
    nameEn: plan.name_en,
    descriptionEs: plan.description_es,
    descriptionEn: plan.description_en,
    sortOrder: plan.sort_order,
    items: (itemsByPlan.get(plan.id) ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((item: any) => {
        const mt = Array.isArray(item.maintenance_templates)
          ? item.maintenance_templates[0]
          : item.maintenance_templates;
        const sc = Array.isArray(mt?.system_catalog)
          ? mt.system_catalog[0]
          : mt?.system_catalog;
        return {
          id: item.id,
          planId: item.plan_id,
          templateId: item.template_id,
          intervalDays: item.interval_days,
          intervalHours: item.interval_hours,
          sortOrder: item.sort_order,
          template: {
            id: mt?.id ?? item.template_id,
            boatId: mt?.boat_id ?? null,
            createdBy: mt?.created_by ?? null,
            systemId: mt?.system_id ?? "",
            systemCode: sc?.code ?? "",
            systemNameEs: sc?.name_es ?? "",
            systemNameEn: sc?.name_en ?? "",
            title: mt?.title ?? "",
            titleEs: mt?.title_es ?? null,
            titleEn: mt?.title_en ?? null,
            description: mt?.description ?? null,
            descriptionEs: mt?.description_es ?? null,
            descriptionEn: mt?.description_en ?? null,
            kind: mt?.kind ?? "preventive",
            defaultPriority: mt?.default_priority ?? "medium",
            sortOrder: mt?.sort_order ?? 0,
            intervalDays: mt?.interval_days ?? null,
            intervalHours: mt?.interval_hours ?? null,
          },
        };
      }),
  }));
}

export async function createMaintenanceTemplate(
  payload: Omit<MaintenanceTemplate, "id" | "systemCode" | "systemNameEs" | "systemNameEn">
) {
  const { error } = await db()
    .from("maintenance_templates")
    .insert({
      boat_id: payload.boatId ?? null,
      created_by: payload.createdBy ?? null,
      system_id: payload.systemId,
      title: payload.titleEn ?? payload.titleEs ?? payload.title,
      title_es: payload.titleEs,
      title_en: payload.titleEn,
      description: payload.descriptionEn ?? payload.descriptionEs ?? payload.description,
      description_es: payload.descriptionEs,
      description_en: payload.descriptionEn,
      kind: payload.kind,
      default_priority: payload.defaultPriority,
      sort_order: payload.sortOrder,
      interval_days: payload.intervalDays ?? null,
      interval_hours: payload.intervalHours ?? null,
    });
  if (error) throw error;
}

export async function updateMaintenanceTemplate(
  id: string,
  payload: Partial<Omit<MaintenanceTemplate, "id" | "systemCode" | "systemNameEs" | "systemNameEn">>
) {
  const { error } = await db()
    .from("maintenance_templates")
    .update({
      system_id: payload.systemId,
      title: payload.titleEn ?? payload.titleEs ?? payload.title,
      title_es: payload.titleEs,
      title_en: payload.titleEn,
      description: payload.descriptionEn ?? payload.descriptionEs ?? payload.description,
      description_es: payload.descriptionEs,
      description_en: payload.descriptionEn,
      kind: payload.kind,
      default_priority: payload.defaultPriority,
      sort_order: payload.sortOrder,
      interval_days: payload.intervalDays ?? null,
      interval_hours: payload.intervalHours ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMaintenanceTemplate(id: string) {
  const { error } = await db().from("maintenance_templates").delete().eq("id", id);
  if (error) throw error;
}

// ─── Spare references used by system/template tasks ──────────────────────────

export async function fetchMaintenanceTemplateSpares(templateIds: string[]): Promise<MaintenanceTemplateSpare[]> {
  if (!templateIds.length) return [];

  const { data, error } = await db()
    .from("system_spare_references")
    .select("id, system_id, template_id, part_name, part_reference, manufacturer, quantity, unit, notes")
    .in("template_id", templateIds)
    .order("part_name");

  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    systemId: row.system_id,
    templateId: row.template_id,
    partName: row.part_name,
    partReference: row.part_reference,
    manufacturer: row.manufacturer,
    quantity: Number(row.quantity ?? 1),
    unit: row.unit ?? "unit",
    notes: row.notes,
  }));
}

export async function replaceMaintenanceTemplateSpares(
  templateId: string,
  systemId: string,
  spares: Array<Omit<MaintenanceTemplateSpare, "id" | "systemId" | "templateId">>
) {
  const client = db();
  const { error: deleteError } = await client
    .from("system_spare_references")
    .delete()
    .eq("template_id", templateId);

  if (deleteError) throw deleteError;

  const rows = spares
    .filter((spare) => spare.partName.trim() || spare.partReference.trim())
    .map((spare) => ({
      system_id: systemId,
      template_id: templateId,
      part_name: spare.partName.trim() || spare.partReference.trim(),
      part_reference: spare.partReference.trim(),
      manufacturer: spare.manufacturer?.trim() || null,
      quantity: spare.quantity || 1,
      unit: spare.unit.trim() || "unit",
      notes: spare.notes?.trim() || null,
    }));

  if (!rows.length) return;

  const { error } = await client.from("system_spare_references").insert(rows);
  if (error) throw error;
}

// ─── Boat Catalog Overrides ───────────────────────────────────────────────────

function mapOverrideRow(row: any): BoatCatalogOverride {
  const mt = Array.isArray(row.maintenance_templates)
    ? row.maintenance_templates[0]
    : row.maintenance_templates;
  const sc = Array.isArray(mt?.system_catalog)
    ? mt.system_catalog[0]
    : mt?.system_catalog;
  const spares = (row.boat_catalog_override_spares ?? []).map((s: any): BoatCatalogOverrideSpare => ({
    id: s.id,
    overrideId: s.override_id,
    partName: s.part_name,
    partReference: s.part_reference ?? "",
    manufacturer: s.manufacturer ?? null,
    quantity: Number(s.quantity ?? 1),
    unit: s.unit ?? "unit",
    notes: s.notes ?? null,
  }));
  return {
    id: row.id,
    boatId: row.boat_id,
    templateId: row.template_id,
    intervalDays: row.interval_days ?? null,
    intervalHours: row.interval_hours ?? null,
    notes: row.notes ?? null,
    spares,
    template: {
      id: mt?.id ?? row.template_id,
      boatId: mt?.boat_id ?? null,
      createdBy: mt?.created_by ?? null,
      systemId: mt?.system_id ?? "",
      systemCode: sc?.code ?? "",
      systemNameEs: sc?.name_es ?? "",
      systemNameEn: sc?.name_en ?? "",
      title: mt?.title ?? "",
      titleEs: mt?.title_es ?? null,
      titleEn: mt?.title_en ?? null,
      description: mt?.description ?? null,
      descriptionEs: mt?.description_es ?? null,
      descriptionEn: mt?.description_en ?? null,
      kind: mt?.kind ?? "preventive",
      defaultPriority: mt?.default_priority ?? "medium",
      sortOrder: mt?.sort_order ?? 0,
      intervalDays: mt?.interval_days ?? null,
      intervalHours: mt?.interval_hours ?? null,
    },
  };
}

export async function fetchBoatCatalogOverrides(boatId: string): Promise<BoatCatalogOverride[]> {
  const { data, error } = await db()
    .from("boat_catalog_overrides")
    .select(`
      id, boat_id, template_id, interval_days, interval_hours, notes,
      boat_catalog_override_spares ( id, override_id, part_name, part_reference, manufacturer, quantity, unit, notes ),
      maintenance_templates (
        id, boat_id, created_by, system_id, title, title_es, title_en,
        description, description_es, description_en, kind, default_priority, sort_order,
        interval_days, interval_hours,
        system_catalog ( code, name_es, name_en )
      )
    `)
    .eq("boat_id", boatId)
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as any[]).map(mapOverrideRow);
}

export async function fetchBoatCatalogOverridesMap(boatId: string): Promise<Map<string, BoatCatalogOverride>> {
  const overrides = await fetchBoatCatalogOverrides(boatId);
  return new Map(overrides.map((o) => [o.templateId, o]));
}

export async function upsertBoatCatalogOverride(
  boatId: string,
  templateId: string,
  payload: { intervalDays: number | null; intervalHours: number | null; notes: string | null },
  spares: Array<Omit<BoatCatalogOverrideSpare, "id" | "overrideId">>
): Promise<string> {
  const client = db();

  const { data, error } = await client
    .from("boat_catalog_overrides")
    .upsert(
      { boat_id: boatId, template_id: templateId, interval_days: payload.intervalDays, interval_hours: payload.intervalHours, notes: payload.notes },
      { onConflict: "boat_id,template_id" }
    )
    .select("id")
    .single();
  if (error) throw error;
  const overrideId = (data as any).id as string;

  // Reemplazar materiales
  await client.from("boat_catalog_override_spares").delete().eq("override_id", overrideId);
  const rows = spares
    .filter((s) => s.partName.trim())
    .map((s) => ({
      override_id: overrideId,
      part_name: s.partName.trim(),
      part_reference: s.partReference.trim(),
      manufacturer: s.manufacturer?.trim() || null,
      quantity: s.quantity || 1,
      unit: s.unit.trim() || "unit",
      notes: s.notes?.trim() || null,
    }));
  if (rows.length) {
    const { error: sparesError } = await client.from("boat_catalog_override_spares").insert(rows);
    if (sparesError) throw sparesError;
  }

  return overrideId;
}

export async function deleteBoatCatalogOverride(id: string) {
  const { error } = await db().from("boat_catalog_overrides").delete().eq("id", id);
  if (error) throw error;
}

// ─── Inventory Catalog ────────────────────────────────────────────────────────

export async function fetchInventoryCatalog(): Promise<InventoryCatalogItem[]> {
  const { data, error } = await db()
    .from("inventory_catalog")
    .select("id, system_code, name_es, name_en, category, manufacturer, model, description, sort_order")
    .order("system_code")
    .order("sort_order")
    .order("name_es");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    systemCode: r.system_code,
    nameEs: r.name_es,
    nameEn: r.name_en,
    category: r.category,
    manufacturer: r.manufacturer ?? null,
    model: r.model ?? null,
    description: r.description ?? null,
    sortOrder: r.sort_order ?? 0,
  }));
}

// catalogId → { entryId, inventoryItemId }
export async function fetchBoatInventoryCatalog(boatId: string): Promise<Map<string, { entryId: string; inventoryItemId: string | null }>> {
  const { data, error } = await db()
    .from("boat_inventory_catalog")
    .select("id, catalog_id, inventory_item_id")
    .eq("boat_id", boatId);
  if (error) throw error;
  return new Map(((data ?? []) as any[]).map((r) => [
    r.catalog_id as string,
    { entryId: r.id as string, inventoryItemId: r.inventory_item_id as string | null },
  ]));
}

export async function addBoatInventoryCatalogEntry(
  boatId: string,
  catalogItem: InventoryCatalogItem,
  boatSystemId: string | null,
): Promise<void> {
  const client = db();

  // Create the inventory item
  const { data: itemData, error: itemError } = await client
    .from("inventory_items")
    .insert({
      boat_id: boatId,
      boat_system_id: boatSystemId,
      name: catalogItem.nameEs,
      category: catalogItem.category,
      manufacturer: catalogItem.manufacturer,
      model: catalogItem.model,
      description: catalogItem.description,
      quantity: 1,
      unit: "unit",
      stock: 0,
      status: "on_board",
    })
    .select("id")
    .single();
  if (itemError) throw itemError;
  const inventoryItemId = (itemData as any).id as string;

  // Track the link
  const { error } = await client
    .from("boat_inventory_catalog")
    .upsert(
      { boat_id: boatId, catalog_id: catalogItem.id, inventory_item_id: inventoryItemId },
      { onConflict: "boat_id,catalog_id" }
    );
  if (error) throw error;
}

export async function removeBoatInventoryCatalogEntry(
  boatId: string,
  catalogId: string,
  inventoryItemId: string | null,
): Promise<void> {
  const client = db();
  // Delete the inventory item if it was created from the catalog
  if (inventoryItemId) {
    await client.from("inventory_items").delete().eq("id", inventoryItemId);
  }
  await client
    .from("boat_inventory_catalog")
    .delete()
    .eq("boat_id", boatId)
    .eq("catalog_id", catalogId);
}

// ─── Owners ───────────────────────────────────────────────────────────────────

export async function fetchOwners(): Promise<Owner[]> {
  const { data, error } = await db()
    .from("owner_companies")
    .select("id, name, notes")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Owner[];
}

export async function createOwner(payload: Omit<Owner, "id">) {
  const { data, error } = await db()
    .from("owner_companies")
    .insert({ name: payload.name, notes: payload.notes })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOwner(id: string, payload: Partial<Omit<Owner, "id">>) {
  const { error } = await db()
    .from("owner_companies")
    .update({ name: payload.name, notes: payload.notes })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOwner(id: string) {
  const { error } = await db().from("owner_companies").delete().eq("id", id);
  if (error) throw error;
}

// ─── Boats ────────────────────────────────────────────────────────────────────

function boatIdentifier(payload: { name: string; identifier?: string | null }) {
  const value = payload.identifier?.trim() || payload.name.trim();
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || `barco-${Date.now()}`;
}

export async function fetchBoats(): Promise<Boat[]> {
  const { data, error } = await db()
    .from("boats")
    .select(
      `id, name, identifier, registration_number, brand_model, build_year,
       shipyard, propulsion, boat_type, engine_notes, notes, flag,
       dimensions, tanks, identifiers`
    )
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    identifier: r.identifier,
    registrationNumber: r.registration_number,
    brandModel: r.brand_model,
    buildYear: r.build_year,
    shipyard: r.shipyard,
    propulsion: r.propulsion,
    boatType: r.boat_type,
    engineNotes: r.engine_notes,
    notes: r.notes,
    flag: r.flag ?? null,
    dimensions: r.dimensions ?? null,
    tanks: r.tanks ?? null,
    identifiers: r.identifiers ?? null,
    ownerIds: [],
    ownerNames: [],
  }));
}

export async function createBoat(
  payload: Omit<Boat, "id" | "ownerIds" | "ownerNames">
) {
  const { data, error } = await db()
    .from("boats")
    .insert({
      name: payload.name,
      identifier: boatIdentifier(payload),
      registration_number: payload.registrationNumber,
      brand_model: payload.brandModel,
      build_year: payload.buildYear,
      shipyard: payload.shipyard,
      propulsion: payload.propulsion,
      boat_type: payload.boatType,
      engine_notes: payload.engineNotes,
      notes: payload.notes,
      flag: payload.flag ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBoat(
  id: string,
  payload: Partial<Omit<Boat, "id" | "ownerIds" | "ownerNames">>
) {
  const { error } = await db()
    .from("boats")
    .update({
      name: payload.name,
      identifier: boatIdentifier({
        name: payload.name ?? "",
        identifier: payload.identifier,
      }),
      registration_number: payload.registrationNumber,
      brand_model: payload.brandModel,
      build_year: payload.buildYear,
      shipyard: payload.shipyard,
      propulsion: payload.propulsion,
      boat_type: payload.boatType,
      engine_notes: payload.engineNotes,
      notes: payload.notes,
      flag: payload.flag ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBoat(id: string) {
  const { error } = await db().from("boats").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBoatDimensions(id: string, dimensions: BoatDimensions) {
  const { error } = await db().from("boats").update({ dimensions }).eq("id", id);
  if (error) throw error;
}

export async function updateBoatTanks(id: string, tanks: BoatTank[]) {
  const { error } = await db().from("boats").update({ tanks }).eq("id", id);
  if (error) throw error;
}

export async function updateBoatIdentifiers(id: string, identifiers: BoatIdentifiers) {
  const { error } = await db().from("boats").update({ identifiers }).eq("id", id);
  if (error) throw error;
}

// ─── Boat Documents ───────────────────────────────────────────────────────────

export async function fetchBoatDocuments(boatId: string): Promise<BoatDocument[]> {
  const { data, error } = await db()
    .from("boat_documents")
    .select("id, boat_id, doc_type, label, storage_path, expiry_date, issued_date, issuer, notes, created_at")
    .eq("boat_id", boatId)
    .order("doc_type")
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    docType: r.doc_type,
    label: r.label,
    storagePath: r.storage_path ?? null,
    expiryDate: r.expiry_date ?? null,
    issuedDate: r.issued_date ?? null,
    issuer: r.issuer ?? null,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  }));
}

export async function upsertBoatDocument(boatId: string, doc: Omit<BoatDocument, "id" | "createdAt"> & { id?: string }) {
  const payload = {
    boat_id: boatId,
    doc_type: doc.docType,
    label: doc.label,
    storage_path: doc.storagePath ?? null,
    expiry_date: doc.expiryDate ?? null,
    issued_date: doc.issuedDate ?? null,
    issuer: doc.issuer ?? null,
    notes: doc.notes ?? null,
    updated_at: new Date().toISOString(),
  };
  if (doc.id) {
    const { error } = await db().from("boat_documents").update(payload).eq("id", doc.id);
    if (error) throw error;
  } else {
    const { error } = await db().from("boat_documents").insert(payload);
    if (error) throw error;
  }
}

export async function deleteBoatDocument(id: string) {
  const { error } = await db().from("boat_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadBoatDocument(boatId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `boats/${boatId}/docs/${Date.now()}.${ext}`;
  const { error } = await db().storage.from("boat-documents").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function getBoatDocumentUrl(path: string): Promise<string> {
  const { data, error } = await db().storage.from("boat-documents").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ─── Boat Systems ─────────────────────────────────────────────────────────────

export async function fetchBoatSystems(boatId: string): Promise<BoatSystem[]> {
  const { data, error } = await db()
    .from("boat_systems")
    .select("id, boat_id, system_id, notes, inventory_items ( id )")
    .eq("boat_id", boatId)
    .order("id");
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    boat_id: string;
    system_id: string;
    notes: string | null;
    inventory_items: { id: string }[];
  }>;

  const systemIds = Array.from(new Set(rows.map((row) => row.system_id).filter(Boolean)));

  let catalogById = new Map<string, { code: string; name_es: string; name_en: string }>();

  if (systemIds.length) {
    const { data: catalogData, error: catalogError } = await db()
      .from("system_catalog")
      .select("id, code, name_es, name_en")
      .in("id", systemIds);

    if (catalogError) throw catalogError;

    catalogById = new Map(
      ((catalogData ?? []) as Array<{ id: string; code: string; name_es: string; name_en: string }>).map(
        (catalog) => [
          catalog.id,
          {
            code: catalog.code,
            name_es: catalog.name_es,
            name_en: catalog.name_en,
          },
        ]
      )
    );
  }

  return rows.map((row) => {
    const catalog = catalogById.get(row.system_id);

    return {
      id: row.id,
      boatId: row.boat_id,
      systemId: row.system_id,
      systemCode: catalog?.code ?? "",
      nameEs: catalog?.name_es ?? "",
      nameEn: catalog?.name_en ?? "",
      notes: row.notes,
      inventoryCount: Array.isArray(row.inventory_items) ? row.inventory_items.length : 0,
    };
  });
}

export async function updateBoatSystem(id: string, notes: string | null) {
  const { error } = await db()
    .from("boat_systems")
    .update({ notes })
    .eq("id", id);
  if (error) throw error;
}

export async function addBoatSystem(boatId: string, systemId: string, notes?: string) {
  const { error } = await db()
    .from("boat_systems")
    .insert({ boat_id: boatId, system_id: systemId, notes: notes ?? null });
  if (error) throw error;
}

export async function removeBoatSystem(id: string) {
  const { error } = await db().from("boat_systems").delete().eq("id", id);
  if (error) throw error;
}

// ─── Boat Components ──────────────────────────────────────────────────────────

export async function fetchBoatComponents(boatId: string): Promise<BoatComponent[]> {
  const { data, error } = await db()
    .from("boat_components")
    .select("id, boat_id, boat_system_id, name, manufacturer, model, serial_number, notes")
    .eq("boat_id", boatId)
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatSystemId: r.boat_system_id,
    name: r.name,
    manufacturer: r.manufacturer,
    model: r.model,
    serialNumber: r.serial_number,
    notes: r.notes,
  }));
}

export async function createBoatComponent(payload: Omit<BoatComponent, "id">) {
  const { error } = await db().from("boat_components").insert({
    boat_id: payload.boatId,
    boat_system_id: payload.boatSystemId,
    name: payload.name,
    manufacturer: payload.manufacturer ?? null,
    model: payload.model ?? null,
    serial_number: payload.serialNumber ?? null,
    notes: payload.notes ?? null,
  });
  if (error) throw error;
}

export async function updateBoatComponent(id: string, payload: Partial<Omit<BoatComponent, "id" | "boatId">>) {
  const { error } = await db().from("boat_components").update({
    boat_system_id: payload.boatSystemId,
    name: payload.name,
    manufacturer: payload.manufacturer ?? null,
    model: payload.model ?? null,
    serial_number: payload.serialNumber ?? null,
    notes: payload.notes ?? null,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteBoatComponent(id: string) {
  const { error } = await db().from("boat_components").delete().eq("id", id);
  if (error) throw error;
}

// ─── Maintenance Tasks ────────────────────────────────────────────────────────

export async function fetchMaintenanceTasks(boatScope?: string | string[], haulOutId?: string): Promise<MaintenanceTask[]> {
  let q = db()
    .from("maintenance_tasks")
    .select(
      `id, template_id, boat_id, boat_system_id, boat_component_id, haul_out_id, title, description,
       kind, status, priority, due_date, completed_at, responsible, performed_by,
       engine_hours, estimated_cost, notes, updated_at,
       boats ( name ),
       boat_systems ( system_catalog ( name_es, name_en ) )`
    )
    .order("due_date", { ascending: true, nullsFirst: false });
  q = applyBoatScope(q, boatScope);
  if (haulOutId) q = q.eq("haul_out_id", haulOutId);
  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as any[];
  const taskIds = rows.map((r) => r.id as string);

  // Fetch attachment presence in one query
  const attachmentMap = new Map<string, { hasPhoto: boolean; hasFile: boolean }>();
  if (taskIds.length) {
    const { data: attData } = await db()
      .from("attachments")
      .select("target_id, document_category")
      .eq("target_type", "maintenance_task")
      .in("target_id", taskIds);
    for (const a of (attData ?? []) as any[]) {
      const entry = attachmentMap.get(a.target_id) ?? { hasPhoto: false, hasFile: false };
      if (a.document_category === "photo") entry.hasPhoto = true;
      else entry.hasFile = true;
      attachmentMap.set(a.target_id, entry);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    templateId: r.template_id,
    boatId: r.boat_id,
    boatSystemId: r.boat_system_id,
    boatComponentId: r.boat_component_id,
    haulOutId: r.haul_out_id,
    title: r.title,
    description: r.description,
    kind: r.kind,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date,
    doneDate: r.completed_at ? r.completed_at.slice(0, 10) : null,
    responsible: r.responsible,
    performedBy: r.performed_by,
    engineHours: r.engine_hours,
    cost: r.estimated_cost,
    notes: r.notes,
    updatedAt: r.updated_at,
    systemName: r.boat_systems?.system_catalog?.name_en ?? "Other",
    boatName: r.boats?.name ?? "",
    hasPhoto: attachmentMap.get(r.id)?.hasPhoto ?? false,
    hasFile: attachmentMap.get(r.id)?.hasFile ?? false,
  }));
}

export async function createMaintenanceTask(payload: Omit<MaintenanceTask, "id" | "systemName" | "boatName">) {
  const { data, error } = await db().from("maintenance_tasks").insert({
    template_id: payload.templateId ?? null,
    boat_id: payload.boatId,
    boat_system_id: payload.boatSystemId,
    haul_out_id: payload.haulOutId,
    title: payload.title,
    description: payload.description,
    kind: payload.kind,
    status: payload.status,
    priority: payload.priority,
    due_date: payload.dueDate,
    completed_at: payload.doneDate ?? null,
    responsible: payload.responsible,
    performed_by: payload.performedBy,
    engine_hours: payload.engineHours,
    estimated_cost: payload.cost,
    notes: payload.notes,
  }).select("id").single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateMaintenanceTask(id: string, payload: Partial<Omit<MaintenanceTask, "id" | "systemName" | "boatName">>) {
  const { error } = await db().from("maintenance_tasks").update({
    template_id: payload.templateId,
    boat_system_id: payload.boatSystemId,
    haul_out_id: payload.haulOutId,
    title: payload.title,
    description: payload.description,
    kind: payload.kind,
    status: payload.status,
    priority: payload.priority,
    due_date: payload.dueDate,
    completed_at: payload.doneDate ?? null,
    responsible: payload.responsible,
    performed_by: payload.performedBy,
    engine_hours: payload.engineHours,
    estimated_cost: payload.cost,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteMaintenanceTask(id: string) {
  const { error } = await db().from("maintenance_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadTaskAttachments(boatId: string, taskId: string, files: File[]) {
  if (!files.length) return;

  const client = db();

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${boatId}/maintenance_task/${taskId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await client.storage
      .from("attachments")
      .upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { error } = await client.from("attachments").insert({
      boat_id: boatId,
      target_type: "maintenance_task",
      target_id: taskId,
      file_name: file.name,
      storage_bucket: "attachments",
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      document_category: file.type.startsWith("image/") ? "photo" : "file",
    });

    if (error) throw error;
  }
}

export async function fetchTaskAttachments(taskId: string): Promise<import("./types").TaskAttachment[]> {
  const client = db();
  const { data, error } = await client
    .from("attachments")
    .select("id, file_name, storage_path, mime_type, file_size_bytes, document_category, created_at")
    .eq("target_type", "maintenance_task")
    .eq("target_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as any[];
  return Promise.all(rows.map(async (r) => {
    const { data: urlData } = await client.storage
      .from("attachments")
      .createSignedUrl(r.storage_path, 3600);
    return {
      id: r.id,
      fileName: r.file_name,
      storagePath: r.storage_path,
      mimeType: r.mime_type ?? null,
      fileSizeBytes: r.file_size_bytes ?? null,
      documentCategory: r.document_category === "photo" ? "photo" : "file",
      createdAt: r.created_at,
      signedUrl: urlData?.signedUrl ?? null,
    } satisfies import("./types").TaskAttachment;
  }));
}

export async function deleteAttachment(id: string, storagePath: string) {
  const client = db();
  await client.storage.from("attachments").remove([storagePath]);
  const { error } = await client.from("attachments").delete().eq("id", id);
  if (error) throw error;
}

// ─── Boat Maintenance Schedule ────────────────────────────────────────────────

function mapScheduleRow(r: any): BoatScheduleEntry {
  const mt = Array.isArray(r.maintenance_templates)
    ? r.maintenance_templates[0]
    : r.maintenance_templates;
  const sc = Array.isArray(mt?.system_catalog)
    ? mt.system_catalog[0]
    : mt?.system_catalog;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonMs = 30 * 24 * 60 * 60 * 1000;
  let state: BoatScheduleEntry["state"] = "ok";
  if (r.next_due_date) {
    const due = new Date(r.next_due_date);
    if (due < today) state = "overdue";
    else if (due.getTime() - today.getTime() <= soonMs) state = "due_soon";
  }
  return {
    id: r.id,
    boatId: r.boat_id,
    templateId: r.template_id,
    intervalDays: r.interval_days,
    intervalHours: r.interval_hours,
    lastDoneAt: r.last_done_at,
    lastDoneEngineHours: r.last_done_engine_hours ?? null,
    lastDoneNotes: r.last_done_notes ?? null,
    nextDueDate: r.next_due_date,
    responsible: r.responsible,
    notes: r.notes,
    state,
    template: {
      id: mt?.id ?? r.template_id,
      boatId: mt?.boat_id ?? null,
      createdBy: mt?.created_by ?? null,
      systemId: mt?.system_id ?? "",
      systemCode: sc?.code ?? "",
      systemNameEs: sc?.name_es ?? "",
      systemNameEn: sc?.name_en ?? "",
      title: mt?.title ?? "",
      titleEs: mt?.title_es ?? null,
      titleEn: mt?.title_en ?? null,
      description: mt?.description ?? null,
      descriptionEs: mt?.description_es ?? null,
      descriptionEn: mt?.description_en ?? null,
      kind: mt?.kind ?? "preventive",
      defaultPriority: mt?.default_priority ?? "medium",
      sortOrder: mt?.sort_order ?? 0,
      intervalDays: mt?.interval_days ?? null,
      intervalHours: mt?.interval_hours ?? null,
    },
  };
}

export async function fetchBoatScheduleTemplateIds(boatId: string): Promise<Set<string>> {
  const { data, error } = await db()
    .from("boat_maintenance_schedule")
    .select("template_id")
    .eq("boat_id", boatId);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.template_id as string));
}

export async function fetchBoatSchedule(boatId: string): Promise<BoatScheduleEntry[]> {
  const { data, error } = await db()
    .from("boat_maintenance_schedule")
    .select(`
      id, boat_id, template_id, interval_days, interval_hours,
      last_done_at, last_done_engine_hours, last_done_notes, next_due_date, responsible, notes,
      maintenance_templates (
        id, boat_id, created_by, system_id, title, title_es, title_en,
        description, description_es, description_en, kind, default_priority, sort_order,
        system_catalog ( code, name_es, name_en )
      )
    `)
    .eq("boat_id", boatId)
    .order("next_due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map(mapScheduleRow);
}

export async function addScheduleEntry(boatId: string, templateId: string, payload: {
  intervalDays?: number | null;
  intervalHours?: number | null;
  lastDoneAt?: string | null;
  responsible?: string | null;
  notes?: string | null;
}) {
  const { error } = await db().from("boat_maintenance_schedule").upsert(
    {
      boat_id: boatId,
      template_id: templateId,
      interval_days: payload.intervalDays ?? null,
      interval_hours: payload.intervalHours ?? null,
      last_done_at: payload.lastDoneAt ?? null,
      responsible: payload.responsible ?? null,
      notes: payload.notes ?? null,
    },
    { onConflict: "boat_id,template_id" }
  );
  if (error) throw error;
}

export async function updateScheduleEntry(id: string, payload: {
  intervalDays?: number | null;
  intervalHours?: number | null;
  lastDoneAt?: string | null;
  lastDoneEngineHours?: number | null;
  lastDoneNotes?: string | null;
  responsible?: string | null;
  notes?: string | null;
}) {
  const update: Record<string, unknown> = {};
  if ("intervalDays" in payload) update.interval_days = payload.intervalDays;
  if ("intervalHours" in payload) update.interval_hours = payload.intervalHours;
  if ("lastDoneAt" in payload) update.last_done_at = payload.lastDoneAt;
  if ("lastDoneEngineHours" in payload) update.last_done_engine_hours = payload.lastDoneEngineHours;
  if ("lastDoneNotes" in payload) update.last_done_notes = payload.lastDoneNotes;
  if ("responsible" in payload) update.responsible = payload.responsible;
  if ("notes" in payload) update.notes = payload.notes;
  const { error } = await db().from("boat_maintenance_schedule").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteScheduleEntry(id: string) {
  const { error } = await db().from("boat_maintenance_schedule").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteBoatSchedule(boatId: string) {
  const { error } = await db().from("boat_maintenance_schedule").delete().eq("boat_id", boatId);
  if (error) throw error;
}

export async function applySchedulePlanToBoat(planId: string, boatId: string): Promise<number> {
  const { data, error } = await db().rpc("apply_schedule_plan_to_boat", {
    p_plan_id: planId,
    p_boat_id: boatId,
  });
  if (error) throw error;
  return data as number;
}

// ─── Haul-outs ────────────────────────────────────────────────────────────────

const HAUL_OUT_BASE_SELECT = `id, boat_id, name, planned_date, start_date, end_date, status,
       shipyard_id, responsible, notes,
       boats ( name ),
       shipyards ( name )`;

const HAUL_OUT_FULL_SELECT = `id, boat_id, name, planned_date, start_date, end_date, status,
       shipyard_id, location, responsible, estimated_cost, paid_to_date, final_cost, notes,
       boats ( name ),
       shipyards ( name )`;

function mapHaulOutRow(r: any): HaulOut {
  return {
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    name: r.name,
    plannedDate: r.planned_date,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    shipyardId: r.shipyard_id,
    shipyardName: r.shipyards?.name ?? null,
    location: r.location ?? null,
    responsible: r.responsible,
    estimatedCost: r.estimated_cost ?? null,
    paidToDate: r.paid_to_date ?? null,
    finalCost: r.final_cost ?? null,
    notes: r.notes,
  };
}

function haulOutInsertPayload(payload: Omit<HaulOut, "id" | "boatName" | "shipyardName">, includeDetails: boolean) {
  return {
    boat_id: payload.boatId,
    name: payload.name,
    planned_date: payload.plannedDate,
    start_date: payload.startDate,
    end_date: payload.endDate,
    status: payload.status,
    shipyard_id: payload.shipyardId,
    ...(includeDetails ? {
      location: payload.location,
      estimated_cost: payload.estimatedCost,
      paid_to_date: payload.paidToDate,
      final_cost: payload.finalCost,
    } : {}),
    responsible: payload.responsible,
    notes: payload.notes,
  };
}

function haulOutUpdatePayload(payload: Partial<Omit<HaulOut, "id" | "boatName" | "shipyardName">>, includeDetails: boolean) {
  return {
    name: payload.name,
    planned_date: payload.plannedDate,
    start_date: payload.startDate,
    end_date: payload.endDate,
    status: payload.status,
    shipyard_id: payload.shipyardId,
    ...(includeDetails ? {
      location: payload.location,
      estimated_cost: payload.estimatedCost,
      paid_to_date: payload.paidToDate,
      final_cost: payload.finalCost,
    } : {}),
    responsible: payload.responsible,
    notes: payload.notes,
  };
}

export async function fetchHaulOuts(boatScope?: string | string[]): Promise<HaulOut[]> {
  let q = db()
    .from("haul_outs")
    .select(HAUL_OUT_FULL_SELECT)
    .order("planned_date", { ascending: false, nullsFirst: true });
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error && isMissingColumnError(error)) {
    let fallback = db()
      .from("haul_outs")
      .select(HAUL_OUT_BASE_SELECT)
      .order("planned_date", { ascending: false, nullsFirst: true });
    fallback = applyBoatScope(fallback, boatScope);
    const fallbackResult = await fallback;
    if (fallbackResult.error) throw fallbackResult.error;
    return ((fallbackResult.data ?? []) as any[]).map(mapHaulOutRow);
  }
  if (error) throw error;
  return ((data ?? []) as any[]).map(mapHaulOutRow);
}

export async function fetchHaulOutTasks(haulOutId: string): Promise<MaintenanceTask[]> {
  return fetchMaintenanceTasks(undefined, haulOutId);
}

export async function createHaulOut(payload: Omit<HaulOut, "id" | "boatName" | "shipyardName">) {
  const fullResult = await db().from("haul_outs").insert(haulOutInsertPayload(payload, true)).select("id").single();
  if (!fullResult.error) return fullResult.data as { id: string };
  if (!isMissingColumnError(fullResult.error)) throw fullResult.error;

  const fallbackResult = await db().from("haul_outs").insert(haulOutInsertPayload(payload, false)).select("id").single();
  if (fallbackResult.error) throw fallbackResult.error;
  return fallbackResult.data as { id: string };
}

export async function updateHaulOut(id: string, payload: Partial<Omit<HaulOut, "id" | "boatName" | "shipyardName">>) {
  const fullResult = await db().from("haul_outs").update(haulOutUpdatePayload(payload, true)).eq("id", id);
  if (!fullResult.error) return;
  if (!isMissingColumnError(fullResult.error)) throw fullResult.error;

  const fallbackResult = await db().from("haul_outs").update(haulOutUpdatePayload(payload, false)).eq("id", id);
  if (fallbackResult.error) throw fallbackResult.error;
}

export async function deleteHaulOut(id: string) {
  const { error } = await db().from("haul_outs").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchHaulOutItems(haulOutId: string): Promise<HaulOutItem[]> {
  const { data, error } = await db()
    .from("haul_out_items")
    .select(
      `id, haul_out_id, boat_id, boat_system_id, title, description, priority, status, was_performed,
       responsible, notes,
       boat_systems ( system_catalog ( name_en ) )`
    )
    .eq("haul_out_id", haulOutId)
    .order("priority");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    haulOutId: r.haul_out_id,
    boatSystemId: r.boat_system_id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    done: r.was_performed ?? false,
    responsible: r.responsible,
    cost: null,
    notes: r.notes,
    systemName: r.boat_systems?.system_catalog?.name_en ?? "Other",
  }));
}

export async function createHaulOutItem(payload: Omit<HaulOutItem, "id" | "systemName">, boatId: string) {
  const { error } = await db().from("haul_out_items").insert({
    haul_out_id: payload.haulOutId,
    boat_id: boatId,
    boat_system_id: payload.boatSystemId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    was_performed: payload.done,
    responsible: payload.responsible,
    notes: payload.notes,
  });
  if (error) throw error;
}

export async function updateHaulOutItem(id: string, payload: Partial<Omit<HaulOutItem, "id" | "systemName">>) {
  const { error } = await db().from("haul_out_items").update({
    boat_system_id: payload.boatSystemId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    was_performed: payload.done,
    responsible: payload.responsible,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteHaulOutItem(id: string) {
  const { error } = await db().from("haul_out_items").delete().eq("id", id);
  if (error) throw error;
}

// ─── Observations ─────────────────────────────────────────────────────────────

export async function fetchObservations(boatScope?: string | string[]): Promise<Observation[]> {
  let q = db()
    .from("observations")
    .select(
      `id, boat_id, boat_system_id, title, description, priority, status,
       observed_at, noted_by, notes,
       boats ( name ),
       boat_systems ( system_catalog ( name_en ) )`
    )
    .order("observed_at", { ascending: false, nullsFirst: true });
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    boatSystemId: r.boat_system_id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    observedAt: r.observed_at,
    reportedBy: r.noted_by,
    notes: r.notes,
    systemName: r.boat_systems?.system_catalog?.name_en ?? "Other",
  }));
}

export async function createObservation(payload: Omit<Observation, "id" | "boatName" | "systemName">) {
  const row: Record<string, unknown> = {
    boat_id: payload.boatId,
    boat_system_id: payload.boatSystemId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    noted_by: null,
    notes: payload.notes,
  };
  if (payload.observedAt) row.observed_at = payload.observedAt;
  const { error } = await db().from("observations").insert(row);
  if (error) throw error;
}

export async function updateObservation(id: string, payload: Partial<Omit<Observation, "id" | "boatName" | "systemName">>) {
  const { error } = await db().from("observations").update({
    boat_system_id: payload.boatSystemId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    observed_at: payload.observedAt,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteObservation(id: string) {
  const { error } = await db().from("observations").delete().eq("id", id);
  if (error) throw error;
}

// ─── Future Actions ───────────────────────────────────────────────────────────

export async function fetchFutureActions(boatScope?: string | string[]): Promise<FutureAction[]> {
  let q = db()
    .from("future_actions")
    .select(
      `id, boat_id, boat_system_id, haul_out_id, source_observation_id, kind, title,
       description, priority, status, target_date, responsible, notes,
       boats ( name ),
       boat_systems ( system_catalog ( name_en ) )`
    )
    .order("target_date", { ascending: true, nullsFirst: false });
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    boatSystemId: r.boat_system_id,
    haulOutId: r.haul_out_id,
    observationId: r.source_observation_id,
    kind: r.kind,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    targetDate: r.target_date,
    responsible: r.responsible,
    notes: r.notes,
    systemName: r.boat_systems?.system_catalog?.name_en ?? "Other",
  }));
}

export async function createFutureAction(payload: Omit<FutureAction, "id" | "boatName" | "systemName">) {
  const { error } = await db().from("future_actions").insert({
    boat_id: payload.boatId,
    boat_system_id: payload.boatSystemId,
    haul_out_id: payload.haulOutId,
    source_observation_id: payload.observationId,
    kind: payload.kind,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    target_date: payload.targetDate,
    responsible: payload.responsible,
    notes: payload.notes,
  });
  if (error) throw error;
}

export async function updateFutureAction(id: string, payload: Partial<Omit<FutureAction, "id" | "boatName" | "systemName">>) {
  const { error } = await db().from("future_actions").update({
    boat_system_id: payload.boatSystemId,
    haul_out_id: payload.haulOutId,
    source_observation_id: payload.observationId,
    kind: payload.kind,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    target_date: payload.targetDate,
    responsible: payload.responsible,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteFutureAction(id: string) {
  const { error } = await db().from("future_actions").delete().eq("id", id);
  if (error) throw error;
}

// ─── Future Purchases ─────────────────────────────────────────────────────────

export async function fetchFuturePurchases(boatScope?: string | string[]): Promise<FuturePurchase[]> {
  let q = db()
    .from("future_purchases")
    .select(
      `id, boat_id, boat_system_id, source_observation_id, item_name, description,
       quantity, unit, priority, status, supplier, estimated_cost, target_date, notes,
       boats ( name ),
       boat_systems ( system_catalog ( name_en ) )`
    )
    .order("priority");
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    boatSystemId: r.boat_system_id,
    observationId: r.source_observation_id,
    articleName: r.item_name,
    description: r.description,
    quantity: r.quantity,
    unit: r.unit,
    priority: r.priority,
    status: r.status,
    supplier: r.supplier,
    estimatedCost: r.estimated_cost,
    targetDate: r.target_date,
    notes: r.notes,
    systemName: r.boat_systems?.system_catalog?.name_en ?? "Other",
  }));
}

export async function createFuturePurchase(payload: Omit<FuturePurchase, "id" | "boatName" | "systemName">) {
  const { error } = await db().from("future_purchases").insert({
    boat_id: payload.boatId,
    boat_system_id: payload.boatSystemId,
    source_observation_id: payload.observationId,
    item_name: payload.articleName,
    description: payload.description,
    quantity: payload.quantity,
    unit: payload.unit,
    priority: payload.priority,
    status: payload.status,
    supplier: payload.supplier,
    estimated_cost: payload.estimatedCost,
    target_date: payload.targetDate,
    notes: payload.notes,
  });
  if (error) throw error;
}

export async function updateFuturePurchase(id: string, payload: Partial<Omit<FuturePurchase, "id" | "boatName" | "systemName">>) {
  const { error } = await db().from("future_purchases").update({
    boat_system_id: payload.boatSystemId,
    source_observation_id: payload.observationId,
    item_name: payload.articleName,
    description: payload.description,
    quantity: payload.quantity,
    unit: payload.unit,
    priority: payload.priority,
    status: payload.status,
    supplier: payload.supplier,
    estimated_cost: payload.estimatedCost,
    target_date: payload.targetDate,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteFuturePurchase(id: string) {
  const { error } = await db().from("future_purchases").delete().eq("id", id);
  if (error) throw error;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function fetchInventoryItems(boatScope?: string | string[]): Promise<InventoryItem[]> {
  let q = db()
    .from("inventory_items")
    .select(
      `id, boat_id, boat_system_id, boat_component_id, name, category, reference, manufacturer, model,
       serial_number, description, quantity, unit, stock, minimum_stock, status,
       location, supplier, purchase_date, acquisition_cost, unit_cost, notes,
       boats ( name ),
       boat_systems ( system_catalog ( name_en ) )`
    )
    .order("name");
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    boatSystemId: r.boat_system_id,
    boatComponentId: r.boat_component_id ?? null,
    name: r.name,
    category: r.category ?? "spare_part",
    reference: r.reference,
    manufacturer: r.manufacturer,
    model: r.model,
    serialNumber: r.serial_number,
    description: r.description,
    quantity: Number(r.quantity ?? 1),
    unit: r.unit,
    stock: Number(r.stock ?? 0),
    minimumStock: r.minimum_stock,
    status: r.status ?? "on_board",
    location: r.location,
    supplier: r.supplier,
    purchaseDate: r.purchase_date,
    acquisitionCost: r.acquisition_cost,
    cost: r.unit_cost,
    notes: r.notes,
    systemName: r.boat_systems?.system_catalog?.name_en ?? "Other",
    system: r.boat_systems?.system_catalog?.name_en ?? "Other",
    minimum: Number(r.minimum_stock ?? 0),
  }));
}

export async function createInventoryItem(payload: Omit<InventoryItem, "id" | "boatName" | "systemName" | "system" | "minimum">) {
  const { error } = await db().from("inventory_items").insert({
    boat_id: payload.boatId,
    boat_system_id: payload.boatSystemId,
    boat_component_id: payload.boatComponentId,
    name: payload.name,
    category: payload.category ?? "spare_part",
    reference: payload.reference,
    manufacturer: payload.manufacturer,
    model: payload.model,
    serial_number: payload.serialNumber,
    description: payload.description,
    quantity: payload.quantity ?? 1,
    unit: payload.unit ?? "unit",
    stock: payload.stock ?? 0,
    minimum_stock: payload.minimumStock,
    status: payload.status ?? "on_board",
    location: payload.location,
    supplier: payload.supplier,
    purchase_date: payload.purchaseDate,
    acquisition_cost: payload.acquisitionCost,
    unit_cost: payload.cost,
    notes: payload.notes,
  });
  if (error) throw error;
}

export async function updateInventoryItem(id: string, payload: Partial<Omit<InventoryItem, "id" | "boatName" | "systemName" | "system" | "minimum">>) {
  const { error } = await db().from("inventory_items").update({
    boat_system_id: payload.boatSystemId,
    boat_component_id: payload.boatComponentId,
    name: payload.name,
    category: payload.category,
    reference: payload.reference,
    manufacturer: payload.manufacturer,
    model: payload.model,
    serial_number: payload.serialNumber,
    description: payload.description,
    quantity: payload.quantity,
    unit: payload.unit,
    stock: payload.stock,
    minimum_stock: payload.minimumStock,
    status: payload.status,
    location: payload.location,
    supplier: payload.supplier,
    purchase_date: payload.purchaseDate,
    acquisition_cost: payload.acquisitionCost,
    unit_cost: payload.cost,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await db().from("inventory_items").delete().eq("id", id);
  if (error) throw error;
}

// ─── Hour Counters & Logs ─────────────────────────────────────────────────────

export async function fetchHourCounters(boatId: string): Promise<HourCounter[]> {
  const { data, error } = await db()
    .from("hour_counters")
    .select(`id, boat_id, boat_component_id, name, notes, boats ( name )`)
    .eq("boat_id", boatId)
    .order("name");
  if (error) throw error;

  const counters = ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    boatComponentId: r.boat_component_id,
    name: r.name,
    currentHours: 0,
    notes: r.notes,
  }));

  if (!counters.length) return counters;

  const { data: logData, error: logError } = await db()
    .from("engine_hour_logs")
    .select("hour_counter_id, value_hours, logged_at")
    .eq("boat_id", boatId)
    .in("hour_counter_id", counters.map((counter) => counter.id))
    .order("logged_at", { ascending: false });
  if (logError) throw logError;

  const latestByCounter = new Map<string, number>();
  for (const log of (logData ?? []) as any[]) {
    if (!latestByCounter.has(log.hour_counter_id)) {
      latestByCounter.set(log.hour_counter_id, Number(log.value_hours ?? 0));
    }
  }

  return counters.map((counter) => ({
    ...counter,
    currentHours: latestByCounter.get(counter.id) ?? 0,
  }));
}

export async function createHourCounter(boatId: string, name: string, notes?: string | null): Promise<HourCounter> {
  const { data, error } = await db()
    .from("hour_counters")
    .insert({ boat_id: boatId, name, notes: notes ?? null })
    .select(`id, boat_id, boat_component_id, name, notes, boats ( name )`)
    .single();
  if (error) throw error;
  const r = data as any;
  return { id: r.id, boatId: r.boat_id, boatName: r.boats?.name ?? "", boatComponentId: r.boat_component_id, name: r.name, currentHours: 0, notes: r.notes };
}

export async function updateHourCounter(id: string, payload: { name?: string; notes?: string | null }): Promise<void> {
  const { error } = await db().from("hour_counters").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteHourCounter(id: string): Promise<void> {
  const { error } = await db().from("hour_counters").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchHourLogs(boatScope?: string | string[]): Promise<HourLog[]> {
  let q = db()
    .from("engine_hour_logs")
    .select(
      `id, boat_id, hour_counter_id, logged_at, value_hours, notes,
       boats ( name ),
       hour_counters ( name )`
    )
    .order("value_hours", { ascending: false });
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    hourCounterId: r.hour_counter_id,
    counterName: r.hour_counters?.name ?? "",
    loggedAt: r.logged_at,
    hours: Number(r.value_hours ?? 0),
    notes: r.notes,
    loggedBy: null,
  }));
}

export async function createHourLog(payload: Omit<HourLog, "id" | "boatName" | "counterName">) {
  const { error } = await db().from("engine_hour_logs").insert({
    boat_id: payload.boatId,
    hour_counter_id: payload.hourCounterId,
    logged_at: payload.loggedAt,
    value_hours: payload.hours,
    notes: payload.notes,
  });
  if (error) throw error;
}

export async function updateHourLog(id: string, payload: Partial<Omit<HourLog, "id" | "boatName" | "counterName">>) {
  const { error } = await db().from("engine_hour_logs").update({
    logged_at: payload.loggedAt,
    value_hours: payload.hours,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteHourLog(id: string) {
  const { error } = await db().from("engine_hour_logs").delete().eq("id", id);
  if (error) throw error;
}

// ─── Fuel Logs ────────────────────────────────────────────────────────────────

export async function fetchFuelLogs(boatScope?: string | string[]): Promise<FuelLog[]> {
  let q = db()
    .from("fuel_logs")
    .select(
      `id, boat_id, logged_at, fuel_type, quantity, unit, cost, supplier, location, engine_hours, notes,
       boats ( name )`
    )
    .order("logged_at", { ascending: false });
  q = applyBoatScope(q, boatScope);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    boatId: r.boat_id,
    boatName: r.boats?.name ?? "",
    fuelledAt: r.logged_at,
    fuelType: r.fuel_type,
    quantity: Number(r.quantity ?? 0),
    unit: r.unit ?? "L",
    pricePerUnit: null,
    totalCost: r.cost,
    supplier: r.supplier,
    location: r.location ?? null,
    engineHoursAtFuelling: r.engine_hours,
    notes: r.notes,
  }));
}

export async function createFuelLog(payload: Omit<FuelLog, "id" | "boatName">) {
  const { error } = await db().from("fuel_logs").insert({
    boat_id: payload.boatId,
    logged_at: payload.fuelledAt,
    fuel_type: payload.fuelType,
    quantity: payload.quantity,
    unit: payload.unit,
    cost: payload.totalCost,
    supplier: payload.supplier,
    location: payload.location,
    engine_hours: payload.engineHoursAtFuelling,
    notes: payload.notes,
  });
  if (error) throw error;
}

export async function updateFuelLog(id: string, payload: Partial<Omit<FuelLog, "id" | "boatName">>) {
  const { error } = await db().from("fuel_logs").update({
    logged_at: payload.fuelledAt,
    fuel_type: payload.fuelType,
    quantity: payload.quantity,
    unit: payload.unit,
    cost: payload.totalCost,
    supplier: payload.supplier,
    location: payload.location,
    engine_hours: payload.engineHoursAtFuelling,
    notes: payload.notes,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteFuelLog(id: string) {
  const { error } = await db().from("fuel_logs").delete().eq("id", id);
  if (error) throw error;
}

// ─── Marinas ──────────────────────────────────────────────────────────────────

export async function fetchMarinas(): Promise<Marina[]> {
  const { data, error } = await db()
    .from("marinas")
    .select("*")
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => {
    const coordinates = parseCoordinates(r.coordinates);
    return {
      id: r.id,
      name: r.name,
      country: r.country,
      region: r.region,
      address: r.address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      website: r.website,
      phone: r.phone,
      email: r.email,
      contactPerson: r.contact_person,
      vhfChannel: r.vhf_channel,
      mooringType: r.berth_type,
      hasWater: r.has_water ?? false,
      hasElectricity: r.has_electricity ?? false,
      hasWifi: r.has_wifi ?? false,
      hasShowers: r.has_showers ?? false,
      hasSecurity: r.has_security ?? false,
      rating: r.rating,
      notes: r.notes,
      infoDate: r.info_date,
      source: r.info_source,
      createdBy: r.created_by,
    };
  });
}

export async function createMarina(payload: Omit<Marina, "id" | "createdBy">) {
  const userId = await currentUserId();
  if (!userId) throw new Error("User not authenticated");

  const { error } = await db().from("marinas").insert({
    name: payload.name,
    country: payload.country,
    region: payload.region,
    address: payload.address,
    coordinates: formatCoordinates(payload.latitude, payload.longitude),
    website: payload.website,
    phone: payload.phone,
    email: payload.email,
    contact_person: payload.contactPerson,
    vhf_channel: payload.vhfChannel,
    berth_type: payload.mooringType,
    has_water: payload.hasWater,
    has_electricity: payload.hasElectricity,
    has_wifi: payload.hasWifi,
    has_showers: payload.hasShowers,
    has_security: payload.hasSecurity,
    rating: payload.rating,
    notes: payload.notes,
    info_date: payload.infoDate,
    info_source: payload.source,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateMarina(id: string, payload: Partial<Omit<Marina, "id" | "createdBy">>) {
  const { error } = await db().from("marinas").update({
    name: payload.name,
    country: payload.country,
    region: payload.region,
    address: payload.address,
    coordinates: formatCoordinates(payload.latitude, payload.longitude),
    website: payload.website,
    phone: payload.phone,
    email: payload.email,
    contact_person: payload.contactPerson,
    vhf_channel: payload.vhfChannel,
    berth_type: payload.mooringType,
    has_water: payload.hasWater,
    has_electricity: payload.hasElectricity,
    has_wifi: payload.hasWifi,
    has_showers: payload.hasShowers,
    has_security: payload.hasSecurity,
    rating: payload.rating,
    notes: payload.notes,
    info_date: payload.infoDate,
    info_source: payload.source,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteMarina(id: string) {
  await deleteMarinas([id]);
}

export async function deleteMarinas(ids: string[]) {
  if (ids.length === 0) return;
  const { data, error } = await db()
    .from("marinas")
    .delete()
    .in("id", ids)
    .select("id");
  if (error) throw error;
  const deleted = data?.length ?? 0;
  if (deleted !== ids.length) {
    throw new Error(`Solo se eliminaron ${deleted} de ${ids.length} marina(s). Revisa permisos: solo puedes borrar marinas creadas por ti o siendo superuser.`);
  }
}

// ─── Shipyards (Varaderos) ────────────────────────────────────────────────────

export async function fetchShipyards(): Promise<Shipyard[]> {
  const { data, error } = await db()
    .from("shipyards")
    .select("*")
    .order("name");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => {
    const coordinates = parseCoordinates(r.gps_coordinates);
    const rates = parseRates(r.standard_rates);
    return {
      id: r.id,
      name: r.name,
      country: r.country,
      region: r.region,
      address: r.address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      website: r.website,
      phone: r.phone,
      email: r.email,
      contactPerson: r.contact_person,
      vhfChannel: r.vhf_channel,
      liftType: r.haul_type,
      liftCapacityTons: r.haul_capacity_tonnes,
      maxLengthM: r.max_length_m,
      maxBeamM: r.max_beam_m,
      maxDraftM: r.max_draft_m,
      hasWater: r.has_water ?? false,
      hasElectricity: r.has_electricity ?? false,
      hasWifi: r.has_wifi ?? false,
      hasShowers: r.has_showers ?? false,
      hasSecurity: r.has_security ?? false,
      services: r.services,
      liftInOutPrice: rates.liftInOutPrice,
      pressureWashPrice: rates.pressureWashPrice,
      dailyStoragePrice: rates.dailyStoragePrice,
      monthlyStoragePrice: rates.monthlyStoragePrice,
      annualStoragePrice: rates.annualStoragePrice,
      currency: rates.currency,
      vatPercent: rates.vatPercent,
      rating: r.rating,
      notes: r.notes,
      infoDate: r.info_date,
      source: r.info_source,
    };
  });
}

export async function createShipyard(payload: Omit<Shipyard, "id">) {
  const userId = await currentUserId();
  if (!userId) throw new Error("User not authenticated");

  const { error } = await db().from("shipyards").insert({
    name: payload.name,
    country: payload.country,
    region: payload.region,
    address: payload.address,
    gps_coordinates: formatCoordinates(payload.latitude, payload.longitude),
    website: payload.website,
    phone: payload.phone,
    email: payload.email,
    contact_person: payload.contactPerson,
    vhf_channel: payload.vhfChannel,
    haul_type: payload.liftType,
    haul_capacity_tonnes: payload.liftCapacityTons,
    max_length_m: payload.maxLengthM,
    max_beam_m: payload.maxBeamM,
    max_draft_m: payload.maxDraftM,
    has_water: payload.hasWater,
    has_electricity: payload.hasElectricity,
    has_wifi: payload.hasWifi,
    has_showers: payload.hasShowers,
    has_security: payload.hasSecurity,
    services: payload.services,
    standard_rates: formatRates(payload),
    rating: payload.rating,
    notes: payload.notes,
    info_date: payload.infoDate,
    info_source: payload.source,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateShipyard(id: string, payload: Partial<Omit<Shipyard, "id">>) {
  const { error } = await db().from("shipyards").update({
    name: payload.name,
    country: payload.country,
    region: payload.region,
    address: payload.address,
    gps_coordinates: formatCoordinates(payload.latitude, payload.longitude),
    website: payload.website,
    phone: payload.phone,
    email: payload.email,
    contact_person: payload.contactPerson,
    vhf_channel: payload.vhfChannel,
    haul_type: payload.liftType,
    haul_capacity_tonnes: payload.liftCapacityTons,
    max_length_m: payload.maxLengthM,
    max_beam_m: payload.maxBeamM,
    max_draft_m: payload.maxDraftM,
    has_water: payload.hasWater,
    has_electricity: payload.hasElectricity,
    has_wifi: payload.hasWifi,
    has_showers: payload.hasShowers,
    has_security: payload.hasSecurity,
    services: payload.services,
    standard_rates: formatRates(payload),
    rating: payload.rating,
    notes: payload.notes,
    info_date: payload.infoDate,
    info_source: payload.source,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteShipyard(id: string) {
  await deleteShipyards([id]);
}

export async function deleteShipyards(ids: string[]) {
  if (ids.length === 0) return;
  const { data, error } = await db()
    .from("shipyards")
    .delete()
    .in("id", ids)
    .select("id");
  if (error) throw error;
  const deleted = data?.length ?? 0;
  if (deleted !== ids.length) {
    throw new Error(`Solo se eliminaron ${deleted} de ${ids.length} varadero(s). Revisa permisos: solo los superusers pueden borrar varaderos.`);
  }
}
