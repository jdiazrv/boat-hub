import type {
  Boat,
  MaintenanceTask, HaulOut, Observation, FutureAction, FuturePurchase,
  InventoryItem, HourLog, FuelLog, Marina, Shipyard,
} from "./types";
import templateUrl from "../assets/template.xlsx?url";

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
type Column<T> = { label: string; value: (row: T) => string | number | null | undefined };
type ZipEntry = {
  name: string;
  data: Uint8Array;
  compression: number;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  modTime: number;
  modDate: number;
};

const TEMPLATE_URL = templateUrl;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const WORKSHEET_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet";
const WORKSHEET_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";
const BASE_WORKBOOK_XML =
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><workbookPr/><workbookProtection/><bookViews><workbookView visibility="visible" minimized="0" showHorizontalScroll="1" showVerticalScroll="1" showSheetTabs="1" tabRatio="600" firstSheet="0" activeTab="0" autoFilterDateGrouping="1"/></bookViews><sheets><sheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" name="ALDEBARAN" sheetId="1" state="visible" r:id="rId1"/></sheets><definedNames/><calcPr calcId="124519" fullCalcOnLoad="1"/></workbook>';
const BASE_RELS_XML =
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet1.xml" Id="rId1"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml" Id="rId2"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml" Id="rId3"/></Relationships>';
const BASE_CONTENT_TYPES_XML =
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>';

const SECTIONS = [
  {
    key: "maintenanceTasks",
    sheetName: "Mantenimiento",
    rows: (data: ExportExcelData) => data.maintenanceTasks,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Sistema", value: (r) => r.systemName },
      { label: "Título", value: (r) => r.title },
      { label: "Tipo", value: (r) => r.kind },
      { label: "Estado", value: (r) => r.status },
      { label: "Prioridad", value: (r) => r.priority },
      { label: "Fecha prevista", value: (r) => r.dueDate },
      { label: "Fecha realizada", value: (r) => r.doneDate },
      { label: "Responsable", value: (r) => r.responsible },
      { label: "Realizado por", value: (r) => r.performedBy },
      { label: "Coste (€)", value: (r) => r.cost },
      { label: "Horas motor", value: (r) => r.engineHours },
      { label: "Descripción", value: (r) => r.description },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<MaintenanceTask>[],
  },
  {
    key: "haulOuts",
    sheetName: "Varadas",
    rows: (data: ExportExcelData) => data.haulOuts,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Nombre", value: (r) => r.name },
      { label: "Estado", value: (r) => r.status },
      { label: "Varadero", value: (r) => r.shipyardName },
      { label: "Ubicación", value: (r) => r.location },
      { label: "Inicio", value: (r) => r.startDate },
      { label: "Fin", value: (r) => r.endDate },
      { label: "Presupuesto (€)", value: (r) => r.estimatedCost },
      { label: "Pagado (€)", value: (r) => r.paidToDate },
      { label: "Coste final (€)", value: (r) => r.finalCost },
      { label: "Responsable", value: (r) => r.responsible },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<HaulOut>[],
  },
  {
    key: "observations",
    sheetName: "Observaciones",
    rows: (data: ExportExcelData) => data.observations,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Sistema", value: (r) => r.systemName },
      { label: "Título", value: (r) => r.title },
      { label: "Prioridad", value: (r) => r.priority },
      { label: "Estado", value: (r) => r.status },
      { label: "Fecha", value: (r) => r.observedAt },
      { label: "Reportado por", value: (r) => r.reportedBy },
      { label: "Descripción", value: (r) => r.description },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<Observation>[],
  },
  {
    key: "futureActions",
    sheetName: "Acciones futuras",
    rows: (data: ExportExcelData) => data.futureActions,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Sistema", value: (r) => r.systemName },
      { label: "Título", value: (r) => r.title },
      { label: "Tipo", value: (r) => r.kind },
      { label: "Prioridad", value: (r) => r.priority },
      { label: "Estado", value: (r) => r.status },
      { label: "Fecha objetivo", value: (r) => r.targetDate },
      { label: "Responsable", value: (r) => r.responsible },
      { label: "Descripción", value: (r) => r.description },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<FutureAction>[],
  },
  {
    key: "futurePurchases",
    sheetName: "Compras",
    rows: (data: ExportExcelData) => data.futurePurchases,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Sistema", value: (r) => r.systemName },
      { label: "Artículo", value: (r) => r.articleName },
      { label: "Prioridad", value: (r) => r.priority },
      { label: "Estado", value: (r) => r.status },
      { label: "Cantidad", value: (r) => r.quantity },
      { label: "Unidad", value: (r) => r.unit },
      { label: "Coste estimado (€)", value: (r) => r.estimatedCost },
      { label: "Proveedor", value: (r) => r.supplier },
      { label: "Fecha objetivo", value: (r) => r.targetDate },
      { label: "Descripción", value: (r) => r.description },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<FuturePurchase>[],
  },
  {
    key: "inventoryItems",
    sheetName: "Inventario",
    rows: (data: ExportExcelData) => data.inventoryItems,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Sistema", value: (r) => r.systemName },
      { label: "Elemento", value: (r) => r.name },
      { label: "Categoría", value: (r) => r.category },
      { label: "Fabricante", value: (r) => r.manufacturer },
      { label: "Modelo", value: (r) => r.model },
      { label: "Referencia", value: (r) => r.reference },
      { label: "Nº serie", value: (r) => r.serialNumber },
      { label: "Cantidad", value: (r) => r.quantity },
      { label: "Stock", value: (r) => r.stock },
      { label: "Stock mínimo", value: (r) => r.minimumStock },
      { label: "Unidad", value: (r) => r.unit },
      { label: "Estado", value: (r) => r.status },
      { label: "Ubicación", value: (r) => r.location },
      { label: "Proveedor", value: (r) => r.supplier },
      { label: "F. compra", value: (r) => r.purchaseDate },
      { label: "Coste adquisición (€)", value: (r) => r.acquisitionCost },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<InventoryItem>[],
  },
  {
    key: "hourLogs",
    sheetName: "Horas motor",
    rows: (data: ExportExcelData) => data.hourLogs,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Contador", value: (r) => r.counterName },
      { label: "Fecha", value: (r) => r.loggedAt },
      { label: "Horas", value: (r) => r.hours },
      { label: "Registrado por", value: (r) => r.loggedBy },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<HourLog>[],
  },
  {
    key: "fuelLogs",
    sheetName: "Combustible",
    rows: (data: ExportExcelData) => data.fuelLogs,
    columns: [
      { label: "Barco", value: (r) => r.boatName },
      { label: "Fecha", value: (r) => r.fuelledAt },
      { label: "Tipo combustible", value: (r) => r.fuelType },
      { label: "Cantidad", value: (r) => r.quantity },
      { label: "Unidad", value: (r) => r.unit },
      { label: "€/unidad", value: (r) => r.pricePerUnit },
      { label: "Coste total (€)", value: (r) => r.totalCost },
      { label: "Proveedor", value: (r) => r.supplier },
      { label: "Horas motor", value: (r) => r.engineHoursAtFuelling },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<FuelLog>[],
  },
  {
    key: "marinas",
    sheetName: "Marinas",
    rows: (data: ExportExcelData) => data.marinas,
    columns: [
      { label: "Nombre", value: (r) => r.name },
      { label: "País", value: (r) => r.country },
      { label: "Región", value: (r) => r.region },
      { label: "Dirección", value: (r) => r.address },
      { label: "Teléfono", value: (r) => r.phone },
      { label: "Email", value: (r) => r.email },
      { label: "Web", value: (r) => r.website },
      { label: "VHF", value: (r) => r.vhfChannel },
      { label: "Tipo amarre", value: (r) => r.mooringType },
      { label: "Valoración", value: (r) => r.rating },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<Marina>[],
  },
  {
    key: "shipyards",
    sheetName: "Varaderos",
    rows: (data: ExportExcelData) => data.shipyards,
    columns: [
      { label: "Nombre", value: (r) => r.name },
      { label: "País", value: (r) => r.country },
      { label: "Región", value: (r) => r.region },
      { label: "Dirección", value: (r) => r.address },
      { label: "Teléfono", value: (r) => r.phone },
      { label: "Email", value: (r) => r.email },
      { label: "Tipo elevación", value: (r) => r.liftType },
      { label: "Capacidad (t)", value: (r) => r.liftCapacityTons },
      { label: "Eslora máx (m)", value: (r) => r.maxLengthM },
      { label: "Izada/botadura", value: (r) => r.liftInOutPrice },
      { label: "Almacenaje día", value: (r) => r.dailyStoragePrice },
      { label: "Almacenaje mes", value: (r) => r.monthlyStoragePrice },
      { label: "Moneda", value: (r) => r.currency },
      { label: "Valoración", value: (r) => r.rating },
      { label: "Notas", value: (r) => r.notes },
    ] satisfies Column<Shipyard>[],
  },
] as const;

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const mod = (value - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    value = Math.floor((value - mod) / 26);
  }
  return name;
}

function worksheetXml<T>(rows: T[], columns: Column<T>[]) {
  const allRows = [columns.map((column) => column.label), ...rows.map((row) => columns.map((column) => column.value(row)))];
  const sheetRows = allRows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const ref = `${colName(colIndex)}${rowIndex + 1}`;
      if (typeof cell === "number" && Number.isFinite(cell)) return `<c r="${ref}"><v>${cell}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const widths = columns.map((column, index) => {
    const max = Math.max(column.label.length, ...rows.map((row) => String(column.value(row) ?? "").length));
    return `<col min="${index + 1}" max="${index + 1}" width="${Math.min(60, Math.max(10, max + 2))}" customWidth="1"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <cols>${widths}</cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

function coverWorksheetXml(boat: Boat | null, exportDate: string, includeDrawing: boolean) {
  const boatName = boat?.name ?? "Todos los barcos";
  const boatType = boat?.boatType ?? "";
  const brandModel = boat?.brandModel ?? "";
  const buildYear = boat?.buildYear != null ? String(boat.buildYear) : "";
  const propulsion = boat?.propulsion ?? "";
  const regNumber = boat?.registrationNumber ?? "";

  const cell = (ref: string, style: number, value?: string | number) => {
    if (value == null || value === "") return `<c r="${ref}" s="${style}" t="n"></c>`;
    if (typeof value === "number") return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  };
  const emptyRow = (row: number) => `<row r="${row}">${["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((col) => cell(`${col}${row}`, 1)).join("")}</row>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><outlinePr summaryBelow="1" summaryRight="1"/><pageSetUpPr/></sheetPr>
  <dimension ref="A1:I35"/>
  <sheetViews><sheetView workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews>
  <sheetFormatPr baseColWidth="8" defaultRowHeight="15"/>
  <cols>
    <col width="4" customWidth="1" min="1" max="1"/>
    <col width="20" customWidth="1" min="2" max="2"/>
    <col width="20" customWidth="1" min="3" max="3"/>
    <col width="20" customWidth="1" min="4" max="4"/>
    <col width="20" customWidth="1" min="5" max="5"/>
    <col width="20" customWidth="1" min="6" max="6"/>
    <col width="20" customWidth="1" min="7" max="7"/>
    <col width="20" customWidth="1" min="8" max="8"/>
    <col width="4" customWidth="1" min="9" max="9"/>
  </cols>
  <sheetData>
    ${emptyRow(1)}
    <row r="2">${cell("A2", 1)}${cell("B2", 2, boatName.toUpperCase())}${cell("I2", 1)}</row>
    <row r="3">${cell("A3", 1)}${cell("I3", 1)}</row>
    <row r="4">${cell("A4", 1)}${cell("B4", 3, "INFORME DE GESTIÓN NAVAL")}${cell("I4", 1)}</row>
    ${emptyRow(5)}
    <row r="6">${cell("A6", 1)}${cell("B6", 1)}${cell("C6", 1)}${cell("D6", 4, `Exportado el ${exportDate}`)}${cell("G6", 1)}${cell("H6", 1)}${cell("I6", 1)}</row>
    ${emptyRow(7)}
    <row r="8">${cell("A8", 1)}${cell("B8", 5, "INFORMACIÓN GENERAL")}${cell("F8", 5, "PROPULSIÓN")}${cell("I8", 1)}</row>
    ${emptyRow(9)}
    <row r="10">${cell("A10", 1)}${cell("B10", 6, "Tipo")}${cell("C10", 1, boatType)}${cell("F10", 6, "Motor")}${cell("G10", 1, propulsion)}${cell("I10", 1)}</row>
    ${emptyRow(11)}
    <row r="12">${cell("A12", 1)}${cell("B12", 6, "Marca / Modelo")}${cell("C12", 1, brandModel)}${cell("F12", 6, "Matrícula")}${cell("G12", 1, regNumber)}${cell("I12", 1)}</row>
    ${emptyRow(13)}
    <row r="14">${cell("A14", 1)}${cell("B14", 6, "Año")}${cell("C14", 1, buildYear)}${cell("F14", 1)}${cell("G14", 1)}${cell("H14", 1)}${cell("I14", 1)}</row>
    ${emptyRow(15)}
    <row r="16">${cell("A16", 1)}${cell("B16", 6)}${cell("C16", 1)}${cell("F16", 1)}${cell("G16", 1)}${cell("H16", 1)}${cell("I16", 1)}</row>
    ${emptyRow(17)}
    <row r="18">${cell("A18", 1)}${cell("B18", 7)}${cell("I18", 1)}</row>
    ${emptyRow(19)}
    <row r="20">${cell("A20", 1)}${cell("B20", 8)}${cell("I20", 1)}</row>
    <row r="21">${cell("A21", 1)}${cell("I21", 1)}</row>
    <row r="22">${cell("A22", 1)}${cell("I22", 1)}</row>
    ${Array.from({ length: 13 }, (_, index) => emptyRow(index + 23)).join("")}
  </sheetData>
  <mergeCells count="13">
    <mergeCell ref="C16:E16"/><mergeCell ref="G12:H12"/><mergeCell ref="B8:E8"/><mergeCell ref="C14:E14"/>
    <mergeCell ref="B18:H18"/><mergeCell ref="B4:H4"/><mergeCell ref="G10:H10"/><mergeCell ref="F8:H8"/>
    <mergeCell ref="B20:H22"/><mergeCell ref="B2:H3"/><mergeCell ref="D6:F6"/><mergeCell ref="C12:E12"/><mergeCell ref="C10:E10"/>
  </mergeCells>
  <pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/>
  ${includeDrawing ? '<drawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>' : ""}
</worksheet>`;
}

function sanitizeSheetName(name: string) {
  return name.replace(/[\[\]:*?/\\]/g, " ").slice(0, 31) || "Hoja";
}

function u16(data: Uint8Array, offset: number) {
  return data[offset] | (data[offset + 1] << 8);
}

function u32(data: Uint8Array, offset: number) {
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}

function writeU16(out: number[], value: number) {
  out.push(value & 255, (value >>> 8) & 255);
}

function writeU32(out: number[], value: number) {
  out.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function parseZip(data: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;
  while (offset + 30 < data.length && u32(data, offset) === 0x04034b50) {
    const compression = u16(data, offset + 8);
    const modTime = u16(data, offset + 10);
    const modDate = u16(data, offset + 12);
    const crc = u32(data, offset + 14);
    const compressedSize = u32(data, offset + 18);
    const uncompressedSize = u32(data, offset + 22);
    const nameLength = u16(data, offset + 26);
    const extraLength = u16(data, offset + 28);
    const nameStart = offset + 30;
    const name = decoder.decode(data.slice(nameStart, nameStart + nameLength));
    const dataStart = nameStart + nameLength + extraLength;
    entries.push({
      name,
      data: data.slice(dataStart, dataStart + compressedSize),
      compression,
      crc,
      compressedSize,
      uncompressedSize,
      modTime,
      modDate,
    });
    offset = dataStart + compressedSize;
  }
  return entries;
}

function textEntry(name: string, value: string): ZipEntry {
  const data = encoder.encode(value);
  return {
    name,
    data,
    compression: 0,
    crc: crc32(data),
    compressedSize: data.length,
    uncompressedSize: data.length,
    modTime: 0,
    modDate: 0,
  };
}

function writeZip(entries: ZipEntry[]) {
  const out: number[] = [];
  const central: number[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const localOffset = offset;
    writeU32(out, 0x04034b50);
    writeU16(out, 20);
    writeU16(out, 0);
    writeU16(out, entry.compression);
    writeU16(out, entry.modTime);
    writeU16(out, entry.modDate);
    writeU32(out, entry.crc);
    writeU32(out, entry.compressedSize);
    writeU32(out, entry.uncompressedSize);
    writeU16(out, name.length);
    writeU16(out, 0);
    out.push(...name, ...entry.data);
    offset = out.length;

    writeU32(central, 0x02014b50);
    writeU16(central, 20);
    writeU16(central, 20);
    writeU16(central, 0);
    writeU16(central, entry.compression);
    writeU16(central, entry.modTime);
    writeU16(central, entry.modDate);
    writeU32(central, entry.crc);
    writeU32(central, entry.compressedSize);
    writeU32(central, entry.uncompressedSize);
    writeU16(central, name.length);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU32(central, 0);
    writeU32(central, localOffset);
    central.push(...name);
  }
  const centralOffset = out.length;
  out.push(...central);
  writeU32(out, 0x06054b50);
  writeU16(out, 0);
  writeU16(out, 0);
  writeU16(out, entries.length);
  writeU16(out, entries.length);
  writeU32(out, central.length);
  writeU32(out, centralOffset);
  writeU16(out, 0);
  return new Uint8Array(out);
}

function hasCoverDrawing(entries: ZipEntry[]) {
  return entries.some((entry) => entry.name === "xl/worksheets/_rels/sheet1.xml.rels")
    && entries.some((entry) => entry.name === "xl/drawings/drawing1.xml");
}

function contentTypesXml(includeDrawing: boolean, includeSharedStrings: boolean) {
  let xml = includeDrawing
    ? BASE_CONTENT_TYPES_XML
    : BASE_CONTENT_TYPES_XML
    .replace('<Default Extension="jpeg" ContentType="image/jpeg"/>', "")
    .replace('<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>', "");
  if (includeSharedStrings) {
    xml = xml.replace(
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>',
    );
  }
  return xml;
}

function withAddedSheets(entries: ZipEntry[], sections: { sheetName: string; xml: string }[], coverXml: string, coverSheetName: string, includeDrawing: boolean) {
  const skipped = new Set(["xl/workbook.xml", "xl/_rels/workbook.xml.rels", "[Content_Types].xml", "xl/worksheets/sheet1.xml"]);
  const nextEntries = entries.filter((entry) => !skipped.has(entry.name));
  let workbook = BASE_WORKBOOK_XML.replace('name="ALDEBARAN"', `name="${escapeXml(sanitizeSheetName(coverSheetName))}"`);
  let rels = BASE_RELS_XML;
  let contentTypes = contentTypesXml(includeDrawing, entries.some((entry) => entry.name === "xl/sharedStrings.xml"));
  const sheetIdStart = 2;
  const relIdStart = 4;

  sections.forEach((section, index) => {
    const sheetNumber = sheetIdStart + index;
    const relId = `rId${relIdStart + index}`;
    const sheetPath = `xl/worksheets/sheet${sheetNumber}.xml`;
    workbook = workbook.replace("</sheets>", `<sheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" name="${escapeXml(sanitizeSheetName(section.sheetName))}" sheetId="${sheetNumber}" state="visible" r:id="${relId}"/></sheets>`);
    rels = rels.replace("</Relationships>", `<Relationship Type="${WORKSHEET_REL}" Target="/${sheetPath}" Id="${relId}"/></Relationships>`);
    contentTypes = contentTypes.replace("</Types>", `<Override PartName="/${sheetPath}" ContentType="${WORKSHEET_CONTENT_TYPE}"/></Types>`);
    nextEntries.push(textEntry(sheetPath, section.xml));
  });

  nextEntries.push(textEntry("xl/worksheets/sheet1.xml", coverXml));
  nextEntries.push(textEntry("xl/workbook.xml", workbook));
  nextEntries.push(textEntry("xl/_rels/workbook.xml.rels", rels));
  nextEntries.push(textEntry("[Content_Types].xml", contentTypes));
  return nextEntries;
}

export async function exportAllToExcel(
  boatName: string,
  data: ExportExcelData,
  boat: Boat | null = null,
  selection?: ExportSectionSelection,
) {
  const includes = (key: ExportSectionKey) => selection?.[key] ?? true;
  const sections = SECTIONS
    .filter((section) => includes(section.key))
    .map((section) => ({
      sheetName: section.sheetName,
      xml: worksheetXml(section.rows(data) as any[], section.columns as Column<any>[]),
    }));
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error("No se pudo cargar la plantilla Excel");
  const templateBytes = new Uint8Array(await response.arrayBuffer());
  const entries = parseZip(templateBytes);
  const exportDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const includeDrawing = hasCoverDrawing(entries);
  const output = writeZip(withAddedSheets(
    entries,
    sections,
    coverWorksheetXml(boat, exportDate, includeDrawing),
    boat?.name ?? boatName,
    includeDrawing,
  ));
  const blob = new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const date = new Date().toISOString().slice(0, 10);
  const safeName = boatName.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}_${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
