import * as XLSX from "xlsx";
import type {
  Boat,
  MaintenanceTask, HaulOut, Observation, FutureAction, FuturePurchase,
  InventoryItem, HourLog, FuelLog, Marina, Shipyard,
} from "./types";

type ExportExcelData = {
  maintenanceTasks: MaintenanceTask[];
  haulOuts: HaulOut[];
  observations: Observation[];
  futureActions: FutureAction[];
  futurePurchases: FuturePurchase[];
  inventoryItems: InventoryItem[];
  hourLogs: HourLog[];
  fuelLogs: FuelLog[];
  marinas: Marina[];
  shipyards: Shipyard[];
};

type ExportSectionKey = keyof ExportExcelData;
type ExportSectionSelection = Partial<Record<ExportSectionKey, boolean>>;

function autoWidth(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
  const colWidths: number[] = [];
  for (const row of data) {
    row.forEach((cell, i) => {
      const len = String(cell ?? "").length;
      colWidths[i] = Math.min(60, Math.max(colWidths[i] ?? 8, len + 2));
    });
  }
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));
}

function sheet<T extends object>(rows: T[], headers: { key: keyof T; label: string }[]): XLSX.WorkSheet {
  const headerRow = headers.map((h) => h.label);
  const dataRows = rows.map((r) => headers.map((h) => {
    const v = r[h.key];
    return v == null ? "" : v;
  }));
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  autoWidth(ws);
  return ws;
}

// ARGB hex for xlsx — no leading #
const C = {
  navy:      "FF0A1628",
  darkBlue:  "FF0D2137",
  ink:       "FF07111F",
  cream:     "FFFFFCF7",
  ivory:     "FFF7F2EA",
  line:      "FFE5D4BA",
  mutedText: "FF666B73",
  blueText:  "FF081D35",
  bronze:    "FFB48A4A",
  bronze2:   "FFD9BC87",
  teal:      "FF14B8A6",
  accent:    "FF3B82F6",   // --accent
  accentWarm:"FFEC7C3F",   // --accent-warm
  gold:      "FFFBBF24",
  white:     "FFFFFFFF",
  offWhite:  "FFF0F4FF",
  soft:      "FFB0C4DE",
  mid:       "FF4A6480",
  shadow:    "FF1A3450",
};

function rgb(argb: string) {
  return { argb };
}

function coverCell(
  value: string | number,
  opts: {
    bold?: boolean;
    sz?: number;
    color?: string;
    bg?: string;
    align?: "left" | "center" | "right";
    italic?: boolean;
    border?: boolean;
    font?: string;
  } = {}
): XLSX.CellObject {
  const cell: XLSX.CellObject = {
    v: value,
    t: typeof value === "number" ? "n" : "s",
    s: {
      font: {
        name: opts.font ?? "Calibri",
        bold: opts.bold ?? false,
        italic: opts.italic ?? false,
        sz: opts.sz ?? 11,
        color: rgb(opts.color ?? C.white),
      },
      fill: opts.bg ? { patternType: "solid", fgColor: rgb(opts.bg) } : undefined,
      alignment: {
        horizontal: opts.align ?? "left",
        vertical: "center",
        wrapText: true,
      },
      border: opts.border ? {
        bottom: { style: "thin", color: rgb(C.accent) },
      } : undefined,
    },
  };
  return cell;
}

function makeCoverSheet(boat: Boat | null, exportDate: string, selectedLabels: string[]): XLSX.WorkSheet {
  const boatName   = boat?.name ?? "Todos los barcos";
  const owners     = boat?.ownerNames?.join(", ") ?? "—";
  const boatType   = boat?.boatType ?? "—";
  const brandModel = boat?.brandModel ?? "—";
  const buildYear  = boat?.buildYear != null ? String(boat.buildYear) : "—";
  const propulsion = boat?.propulsion ?? "—";
  const regNumber  = boat?.registrationNumber ?? "—";

  const coverCols = 16;
  const blank = (bg = C.cream) => coverCell("", { bg, color: C.blueText });
  const row = (cells: (XLSX.CellObject | string)[] = [], bg = C.cream) => [
    ...cells,
    ...Array.from({ length: Math.max(0, coverCols - cells.length) }, () => blank(bg)),
  ];
  const cream = C.cream;
  const side = C.navy;
  const titleFont = "Didot";
  const label = (value: string) => coverCell(value, { bold: true, sz: 10, color: C.mutedText, bg: cream, align: "left" });
  const value = (text: string) => coverCell(text, { bold: true, sz: 14, color: C.blueText, bg: cream, align: "left" });
  const icon = (text: string) => coverCell(text, { bold: true, sz: 18, color: C.bronze, bg: cream, align: "center" });

  const managementLabels = selectedLabels.length > 0 ? selectedLabels : ["Portada"];

  const aoa: (XLSX.CellObject | string)[][] = [
    row([], cream),
    row([blank(side), blank(side), blank(side), blank(side)], cream),
    row([blank(side), coverCell("⚓", { bold: true, sz: 30, color: C.bronze2, bg: side, align: "center" }), blank(side), blank(side)], cream),
    row([blank(side), coverCell("BOAT HUB", { bold: true, sz: 11, color: C.white, bg: side, align: "center" }), blank(side), blank(side), coverCell(boatName.toUpperCase(), { bold: true, sz: 42, color: C.blueText, bg: cream, align: "center", font: titleFont })], cream),
    row([blank(side), blank(side), blank(side), blank(side), coverCell("INFORME DE GESTION NAVAL", { bold: true, sz: 16, color: C.bronze, bg: cream, align: "center" })], cream),
    row([blank(side), blank(side), blank(side), blank(side), coverCell("────────────────        ✦        ────────────────", { sz: 12, color: C.bronze, bg: cream, align: "center" })], cream),
    row([blank(side), blank(side), blank(side), blank(side), coverCell(`Exportado el ${exportDate}`, { bold: true, sz: 14, color: C.white, bg: C.navy, align: "center" })], cream),
    row([blank(side), blank(side), blank(side), blank(side)], cream),
    row([blank(side), blank(side), blank(side), blank(side), icon("☸"), coverCell("INFORMACIÓN GENERAL", { bold: true, sz: 15, color: C.blueText, bg: cream, align: "left", font: "Georgia" }), blank(cream), blank(cream), blank(cream), blank(cream), icon("⚙"), coverCell("PROPULSIÓN", { bold: true, sz: 15, color: C.blueText, bg: cream, align: "left", font: "Georgia" })], cream),
    row([blank(side), blank(side), blank(side), blank(side)], cream),
    row([blank(side), blank(side), blank(side), blank(side), icon("♙"), label("PROPIETARIO"), value(owners), blank(cream), blank(cream), blank(cream), icon("▣"), label("MOTOR"), value(propulsion)], cream),
    row([blank(side), blank(side), blank(side), blank(side), blank(cream), coverCell("", { bg: C.line }), coverCell("", { bg: C.line }), blank(cream), blank(cream), blank(cream), blank(cream), coverCell("", { bg: C.line }), coverCell("", { bg: C.line })], cream),
    row([blank(side), blank(side), blank(side), blank(side), icon("⛵"), label("TIPO"), value(boatType), blank(cream), blank(cream), blank(cream), icon("▤"), label("MATRÍCULA"), value(regNumber)], cream),
    row([blank(side), blank(side), blank(side), blank(side), blank(cream), coverCell("", { bg: C.line }), coverCell("", { bg: C.line }), blank(cream), blank(cream), blank(cream), blank(cream), coverCell("", { bg: C.line }), coverCell("", { bg: C.line })], cream),
    row([blank(side), blank(side), blank(side), blank(side), icon("◇"), label("MARCA / MODELO"), value(brandModel)], cream),
    row([blank(side), blank(side), blank(side), blank(side), blank(cream), coverCell("", { bg: C.line }), coverCell("", { bg: C.line })], cream),
    row([blank(side), blank(side), blank(side), blank(side), icon("▣"), label("AÑO"), value(buildYear)], cream),
    row([blank(side), blank(side), blank(side), blank(side)], cream),
    row([blank(side), blank(side), blank(side), blank(side), coverCell("GESTIÓN", { bold: true, sz: 15, color: C.blueText, bg: C.ivory, align: "left", font: "Georgia" })], cream),
    row([blank(side), blank(side), blank(side), blank(side), coverCell(managementLabels.join("    |    "), { sz: 12, color: C.mutedText, bg: C.ivory, align: "center" })], cream),
    row([blank(side), blank(side), blank(side), blank(side), coverCell("", { bg: C.ivory })], cream),
    row([], cream),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!cols"] = [
    { wch: 4 }, { wch: 8 }, { wch: 8 }, { wch: 4 },
    { wch: 5 }, { wch: 18 }, { wch: 24 }, { wch: 4 }, { wch: 4 }, { wch: 4 },
    { wch: 5 }, { wch: 18 }, { wch: 24 }, { wch: 4 }, { wch: 4 }, { wch: 4 },
  ];
  ws["!rows"] = [
    { hpt: 10 }, { hpt: 18 }, { hpt: 35 }, { hpt: 64 }, { hpt: 30 }, { hpt: 22 }, { hpt: 38 },
    { hpt: 22 }, { hpt: 34 }, { hpt: 18 }, { hpt: 38 }, { hpt: 3 }, { hpt: 38 }, { hpt: 3 },
    { hpt: 38 }, { hpt: 3 }, { hpt: 38 }, { hpt: 20 }, { hpt: 36 }, { hpt: 44 }, { hpt: 10 }, { hpt: 12 },
  ];

  ws["!merges"] = [
    { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
    { s: { r: 3, c: 4 }, e: { r: 3, c: 14 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 14 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 14 } },
    { s: { r: 6, c: 6 }, e: { r: 6, c: 11 } },
    { s: { r: 8, c: 5 }, e: { r: 8, c: 8 } },
    { s: { r: 8, c: 11 }, e: { r: 8, c: 13 } },
    { s: { r: 10, c: 6 }, e: { r: 10, c: 8 } },
    { s: { r: 10, c: 12 }, e: { r: 10, c: 14 } },
    { s: { r: 12, c: 6 }, e: { r: 12, c: 8 } },
    { s: { r: 12, c: 12 }, e: { r: 12, c: 14 } },
    { s: { r: 14, c: 6 }, e: { r: 14, c: 8 } },
    { s: { r: 16, c: 6 }, e: { r: 16, c: 8 } },
    { s: { r: 18, c: 4 }, e: { r: 18, c: 14 } },
    { s: { r: 19, c: 4 }, e: { r: 19, c: 14 } },
    { s: { r: 20, c: 4 }, e: { r: 20, c: 14 } },
  ];
  ws["!margins"] = { left: 0.25, right: 0.25, top: 0.25, bottom: 0.25, header: 0.1, footer: 0.1 };
  (ws as any)["!sheetViews"] = [{ showGridLines: false }];

  return ws;
}

export function exportAllToExcel(
  boatName: string,
  data: ExportExcelData,
  boat: Boat | null = null,
  selection?: ExportSectionSelection,
) {
  const includes = (key: ExportSectionKey) => selection?.[key] ?? true;
  const selectedLabels = [
    includes("maintenanceTasks") ? "MANTENIMIENTO" : null,
    includes("haulOuts") ? "VARADAS" : null,
    includes("observations") ? "OBSERVACIONES" : null,
    includes("futureActions") ? "ACCIONES" : null,
    includes("futurePurchases") ? "COMPRAS" : null,
    includes("inventoryItems") ? "INVENTARIO" : null,
    includes("hourLogs") ? "HORAS" : null,
    includes("fuelLogs") ? "COMBUSTIBLE" : null,
    includes("marinas") ? "MARINAS" : null,
    includes("shipyards") ? "VARADEROS" : null,
  ].filter((label): label is string => Boolean(label));
  const exportDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, makeCoverSheet(boat, exportDate, selectedLabels), "Portada");

  if (includes("maintenanceTasks")) XLSX.utils.book_append_sheet(wb, sheet(data.maintenanceTasks, [
    { key: "boatName",    label: "Barco" },
    { key: "systemName",  label: "Sistema" },
    { key: "title",       label: "Título" },
    { key: "kind",        label: "Tipo" },
    { key: "status",      label: "Estado" },
    { key: "priority",    label: "Prioridad" },
    { key: "dueDate",     label: "Fecha prevista" },
    { key: "doneDate",    label: "Fecha realizada" },
    { key: "responsible", label: "Responsable" },
    { key: "performedBy", label: "Realizado por" },
    { key: "cost",        label: "Coste (€)" },
    { key: "engineHours", label: "Horas motor" },
    { key: "description", label: "Descripción" },
    { key: "notes",       label: "Notas" },
  ]), "Mantenimiento");

  if (includes("haulOuts")) XLSX.utils.book_append_sheet(wb, sheet(data.haulOuts, [
    { key: "boatName",      label: "Barco" },
    { key: "name",          label: "Nombre" },
    { key: "status",        label: "Estado" },
    { key: "shipyardName",  label: "Varadero" },
    { key: "location",      label: "Ubicación" },
    { key: "startDate",     label: "Inicio" },
    { key: "endDate",       label: "Fin" },
    { key: "estimatedCost", label: "Presupuesto (€)" },
    { key: "paidToDate",    label: "Pagado (€)" },
    { key: "finalCost",     label: "Coste final (€)" },
    { key: "responsible",   label: "Responsable" },
    { key: "notes",         label: "Notas" },
  ]), "Varadas");

  if (includes("observations")) XLSX.utils.book_append_sheet(wb, sheet(data.observations, [
    { key: "boatName",   label: "Barco" },
    { key: "systemName", label: "Sistema" },
    { key: "title",      label: "Título" },
    { key: "priority",   label: "Prioridad" },
    { key: "status",     label: "Estado" },
    { key: "observedAt", label: "Fecha" },
    { key: "reportedBy", label: "Reportado por" },
    { key: "description",label: "Descripción" },
    { key: "notes",      label: "Notas" },
  ]), "Observaciones");

  if (includes("futureActions")) XLSX.utils.book_append_sheet(wb, sheet(data.futureActions, [
    { key: "boatName",   label: "Barco" },
    { key: "systemName", label: "Sistema" },
    { key: "title",      label: "Título" },
    { key: "kind",       label: "Tipo" },
    { key: "priority",   label: "Prioridad" },
    { key: "status",     label: "Estado" },
    { key: "targetDate", label: "Fecha objetivo" },
    { key: "responsible",label: "Responsable" },
    { key: "description",label: "Descripción" },
    { key: "notes",      label: "Notas" },
  ]), "Acciones futuras");

  if (includes("futurePurchases")) XLSX.utils.book_append_sheet(wb, sheet(data.futurePurchases, [
    { key: "boatName",     label: "Barco" },
    { key: "systemName",   label: "Sistema" },
    { key: "articleName",  label: "Artículo" },
    { key: "priority",     label: "Prioridad" },
    { key: "status",       label: "Estado" },
    { key: "quantity",     label: "Cantidad" },
    { key: "unit",         label: "Unidad" },
    { key: "estimatedCost",label: "Coste estimado (€)" },
    { key: "supplier",     label: "Proveedor" },
    { key: "targetDate",   label: "Fecha objetivo" },
    { key: "description",  label: "Descripción" },
    { key: "notes",        label: "Notas" },
  ]), "Compras");

  if (includes("inventoryItems")) XLSX.utils.book_append_sheet(wb, sheet(data.inventoryItems, [
    { key: "boatName",       label: "Barco" },
    { key: "systemName",     label: "Sistema" },
    { key: "name",           label: "Elemento" },
    { key: "category",       label: "Categoría" },
    { key: "manufacturer",   label: "Fabricante" },
    { key: "model",          label: "Modelo" },
    { key: "reference",      label: "Referencia" },
    { key: "serialNumber",   label: "Nº serie" },
    { key: "quantity",       label: "Cantidad" },
    { key: "stock",          label: "Stock" },
    { key: "minimumStock",   label: "Stock mínimo" },
    { key: "unit",           label: "Unidad" },
    { key: "status",         label: "Estado" },
    { key: "location",       label: "Ubicación" },
    { key: "supplier",       label: "Proveedor" },
    { key: "purchaseDate",   label: "F. compra" },
    { key: "acquisitionCost",label: "Coste adquisición (€)" },
    { key: "notes",          label: "Notas" },
  ]), "Inventario");

  if (includes("hourLogs")) XLSX.utils.book_append_sheet(wb, sheet(data.hourLogs, [
    { key: "boatName",    label: "Barco" },
    { key: "counterName", label: "Contador" },
    { key: "loggedAt",    label: "Fecha" },
    { key: "hours",       label: "Horas" },
    { key: "loggedBy",    label: "Registrado por" },
    { key: "notes",       label: "Notas" },
  ]), "Horas motor");

  if (includes("fuelLogs")) XLSX.utils.book_append_sheet(wb, sheet(data.fuelLogs, [
    { key: "boatName",             label: "Barco" },
    { key: "fuelledAt",            label: "Fecha" },
    { key: "fuelType",             label: "Tipo combustible" },
    { key: "quantity",             label: "Cantidad" },
    { key: "unit",                 label: "Unidad" },
    { key: "pricePerUnit",         label: "€/unidad" },
    { key: "totalCost",            label: "Coste total (€)" },
    { key: "supplier",             label: "Proveedor" },
    { key: "engineHoursAtFuelling",label: "Horas motor" },
    { key: "notes",                label: "Notas" },
  ]), "Combustible");

  if (includes("marinas")) XLSX.utils.book_append_sheet(wb, sheet(data.marinas, [
    { key: "name",          label: "Nombre" },
    { key: "country",       label: "País" },
    { key: "region",        label: "Región" },
    { key: "address",       label: "Dirección" },
    { key: "phone",         label: "Teléfono" },
    { key: "email",         label: "Email" },
    { key: "website",       label: "Web" },
    { key: "vhfChannel",    label: "VHF" },
    { key: "mooringType",   label: "Tipo amarre" },
    { key: "rating",        label: "Valoración" },
    { key: "notes",         label: "Notas" },
  ]), "Marinas");

  if (includes("shipyards")) XLSX.utils.book_append_sheet(wb, sheet(data.shipyards, [
    { key: "name",                 label: "Nombre" },
    { key: "country",              label: "País" },
    { key: "region",               label: "Región" },
    { key: "address",              label: "Dirección" },
    { key: "phone",                label: "Teléfono" },
    { key: "email",                label: "Email" },
    { key: "liftType",             label: "Tipo elevación" },
    { key: "liftCapacityTons",     label: "Capacidad (t)" },
    { key: "maxLengthM",           label: "Eslora máx (m)" },
    { key: "liftInOutPrice",       label: "Izada/botadura" },
    { key: "dailyStoragePrice",    label: "Almacenaje día" },
    { key: "monthlyStoragePrice",  label: "Almacenaje mes" },
    { key: "currency",             label: "Moneda" },
    { key: "rating",               label: "Valoración" },
    { key: "notes",                label: "Notas" },
  ]), "Varaderos");

  const date = new Date().toISOString().slice(0, 10);
  const safeName = boatName.replace(/[^a-zA-Z0-9_\-]/g, "_");
  XLSX.writeFile(wb, `${safeName}_${date}.xlsx`, { cellStyles: true });
}
