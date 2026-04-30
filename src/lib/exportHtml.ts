import type {
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
  Shipyard,
  SailInventoryItem,
} from "./types";

type ExportHtmlData = {
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

type ExportSectionKey = keyof ExportHtmlData;
type ExportSectionSelection = Partial<Record<ExportSectionKey, boolean>>;

type Column<T> = {
  key: keyof T;
  label: string;
  className?: string;
  render?: (row: T) => string | number | null | undefined;
};

const CATEGORY_COLORS = [
  ["#e6edf5", "#0d2137"],
  ["#e8f5ed", "#3d6b4f"],
  ["#f0ebf5", "#5a3d6b"],
  ["#f5ece3", "#7a4a1e"],
  ["#e3eff7", "#1a5276"],
  ["#e3f5f0", "#1a6b5a"],
  ["#f5f0e3", "#7a6b1a"],
  ["#fde8e6", "#c0392b"],
];

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function attr(value: unknown) {
  return escapeHtml(value).replace(/\n/g, " ");
}

function display(value: unknown, fallback = "-") {
  if (value == null || value === "") return fallback;
  return escapeHtml(value);
}

function money(value: number | null | undefined, currency = "EUR") {
  if (value == null) return "";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
}

function date(value: string | null | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function categoryStyle(category: string) {
  let hash = 0;
  for (const char of category) hash = (hash + char.charCodeAt(0)) % CATEGORY_COLORS.length;
  const [bg, text] = CATEGORY_COLORS[hash];
  return `background:${bg};color:${text}`;
}

function badge(value: unknown) {
  const text = display(value, "");
  if (!text) return "";
  return `<span class="cat-badge" style="${categoryStyle(String(value))}">${text}</span>`;
}

function table<T extends object>(id: string, rows: T[], columns: Column<T>[], emptyLabel: string) {
  const body = rows.map((row) => {
    const search = columns
      .map((column) => column.render ? column.render(row) : row[column.key])
      .join(" ")
      .toLowerCase();
    const category = columns[0]?.render ? columns[0].render(row) : row[columns[0]?.key];
    return `<tr data-search="${attr(search)}" data-category="${attr(category)}">${columns.map((column, index) => {
      const raw = column.render ? column.render(row) : row[column.key];
      const content = index === 0 ? badge(raw) : display(raw);
      return `<td class="${column.className ?? ""}">${content}</td>`;
    }).join("")}</tr>`;
  }).join("");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
        <tbody id="${id}-body">${body || `<tr><td colspan="${columns.length}" class="no-results">${escapeHtml(emptyLabel)}</td></tr>`}</tbody>
      </table>
    </div>
    <div class="footer"><span id="${id}-count">0 registros</span><span>Boat Hub export</span></div>
  `;
}

function panel<T extends object>(
  id: string,
  title: string,
  rows: T[],
  columns: Column<T>[],
  emptyLabel: string,
) {
  const categories = Array.from(new Set(rows.map((row) => {
    const first = columns[0];
    return String(first.render ? first.render(row) : row[first.key] ?? "Otros");
  }))).sort();

  return `
    <section class="tab-panel${id === "inventory" ? " active" : ""}" id="tab-${id}">
      <div class="controls">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#888" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input type="text" data-search-for="${id}" placeholder="Buscar en ${escapeHtml(title).toLowerCase()}...">
        </div>
        <div class="filters" data-filter-for="${id}">
          <button class="filter-btn active" data-category="">Todos</button>
          ${categories.map((category) => `<button class="filter-btn" data-category="${attr(category)}">${escapeHtml(category)}</button>`).join("")}
        </div>
      </div>
      ${table(id, rows, columns, emptyLabel)}
    </section>
  `;
}

function styles() {
  return `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',Arial,sans-serif;background:#f4f2ee;color:#1a1a1a;min-height:100vh;padding:2rem 1rem}
    .page{max-width:1120px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.13)}
    .header{background:#0d2137;color:#fff;padding:2.5rem 2.5rem 2rem;position:relative;overflow:hidden}
    .header:before{content:'';position:absolute;right:-50px;top:-80px;width:260px;height:260px;border-radius:50%;border:1px solid rgba(184,144,58,.18)}
    .header:after{content:'';position:absolute;right:40px;top:20px;width:140px;height:140px;border-radius:50%;border:1px solid rgba(184,144,58,.10)}
    .boat-name{font-family:'Playfair Display',Georgia,serif;font-size:34px;font-weight:600;letter-spacing:.02em}
    .boat-sub{font-size:12px;color:rgba(184,144,58,.9);letter-spacing:.14em;text-transform:uppercase;margin-top:5px;font-weight:500}
    .stats-row{display:flex;gap:2rem;margin-top:1.8rem;flex-wrap:wrap}
    .stat{display:flex;flex-direction:column;gap:3px}
    .stat-label{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:.1em;text-transform:uppercase}
    .stat-val{font-size:15px;font-weight:500;color:#fff}
    .gold-line{height:2px;background:linear-gradient(90deg,#b8903a,transparent);margin-top:1.8rem;opacity:.55}
    .tabs{display:flex;background:#0a1c2e;border-bottom:1px solid rgba(184,144,58,.2);overflow:auto}
    .tab-btn{padding:14px 22px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,.45);border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;letter-spacing:.04em;white-space:nowrap}
    .tab-btn:hover{color:rgba(255,255,255,.75)}
    .tab-btn.active{color:#fff;border-bottom-color:#b8903a}
    .tab-panel{display:none}
    .tab-panel.active{display:block}
    .controls{display:flex;gap:10px;padding:1.25rem 2.5rem;background:#f9f8f5;border-left:1px solid #e0ddd6;border-right:1px solid #e0ddd6;flex-wrap:wrap;align-items:center}
    .search-wrap{position:relative;flex:1;min-width:220px}
    .search-wrap input{width:100%;padding:9px 14px 9px 36px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#1a1a1a;font-family:'DM Sans',Arial,sans-serif;font-size:13px;outline:none}
    .search-wrap input:focus{border-color:#b8903a;box-shadow:0 0 0 3px rgba(184,144,58,.1)}
    .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);width:14px;height:14px;opacity:.4;pointer-events:none}
    .filters{display:flex;gap:6px;flex-wrap:wrap}
    .filter-btn{padding:6px 13px;border-radius:20px;border:1px solid #ddd;background:transparent;color:#666;font-size:12px;font-family:'DM Sans',Arial,sans-serif;cursor:pointer;transition:all .15s;white-space:nowrap}
    .filter-btn:hover{border-color:#aaa;color:#1a1a1a;background:#f0ede8}
    .filter-btn.active{background:#0d2137;color:#fff;border-color:#0d2137}
    .table-wrap{border:1px solid #e0ddd6;border-top:none;overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
    thead th{background:#f9f8f5;padding:10px 16px;text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#888;font-weight:500;border-bottom:1px solid #e5e2db;white-space:nowrap}
    tbody tr{border-bottom:1px solid #f0ede8;transition:background .1s}
    tbody tr:last-child{border-bottom:none}
    tbody tr:hover{background:#faf9f7}
    td{padding:10px 16px;vertical-align:middle;line-height:1.45}
    .cat-badge{font-size:11px;padding:3px 9px;border-radius:10px;font-weight:400;white-space:nowrap;display:inline-block}
    .item-name{font-weight:500;color:#1a1a1a}
    .muted{color:#888;font-size:12px}
    .cost-cell{font-weight:500;color:#1a1a1a;white-space:nowrap}
    .notes{color:#888;font-size:12px;max-width:260px}
    .no-results{padding:3rem;text-align:center;color:#aaa;background:#fff}
    .footer{padding:1rem 2.5rem;background:#f9f8f5;border:1px solid #e0ddd6;border-top:none;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#888}
    .count-pill{background:#0d2137;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px}
    @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}.controls,.tabs{display:none}.tab-panel{display:block!important}}
  `;
}

function script() {
  return `
    function updatePanel(id) {
      const input = document.querySelector('[data-search-for="' + id + '"]');
      const active = document.querySelector('[data-filter-for="' + id + '"] .filter-btn.active');
      const search = (input && input.value || '').toLowerCase();
      const category = active && active.dataset.category || '';
      const rows = Array.from(document.querySelectorAll('#' + id + '-body tr[data-search]'));
      let shown = 0;
      rows.forEach(row => {
        const okSearch = !search || row.dataset.search.includes(search);
        const okCategory = !category || row.dataset.category === category;
        const visible = okSearch && okCategory;
        row.style.display = visible ? '' : 'none';
        if (visible) shown += 1;
      });
      const count = document.getElementById(id + '-count');
      if (count) count.innerHTML = 'Mostrando <span class="count-pill">' + shown + '</span> de ' + rows.length + ' registros';
    }
    function switchTab(name, btn) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      btn.classList.add('active');
      updatePanel(name);
    }
    document.querySelectorAll('[data-search-for]').forEach(input => {
      input.addEventListener('input', () => updatePanel(input.dataset.searchFor));
    });
    document.querySelectorAll('[data-filter-for]').forEach(group => {
      group.addEventListener('click', event => {
        const btn = event.target.closest('.filter-btn');
        if (!btn) return;
        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updatePanel(group.dataset.filterFor);
      });
    });
    document.querySelectorAll('.tab-panel').forEach(panel => updatePanel(panel.id.replace('tab-', '')));
  `;
}

export function exportAllToHtml(
  boatName: string,
  data: ExportHtmlData,
  boat: Boat | null = null,
  selection?: ExportSectionSelection,
) {
  const includes = (key: ExportSectionKey) => selection?.[key] ?? true;
  const exportDate = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  const fullBoatName = boat?.name ?? boatName;
  const subtitle = [
    boat?.boatType,
    boat?.brandModel,
    boat?.buildYear,
  ].filter(Boolean).join(" · ") || "Boat record";

  const stats = [
    ["Matricula", boat?.registrationNumber],
    ["Identificador", boat?.identifier],
    ["Astillero", boat?.shipyard],
    ["Propulsion", boat?.propulsion],
    ["Exportado", exportDate],
  ].filter(([, value]) => value);

  const allPanels = [
    {
      id: "inventory",
      sectionKey: "inventoryItems",
      title: "Inventario",
      rows: data.inventoryItems,
      columns: [
        { key: "category", label: "Categoria" },
        { key: "name", label: "Elemento", className: "item-name" },
        { key: "systemName", label: "Sistema", className: "muted" },
        { key: "manufacturer", label: "Fabricante" },
        { key: "model", label: "Modelo" },
        { key: "stock", label: "Stock" },
        { key: "location", label: "Ubicacion" },
        { key: "notes", label: "Notas", className: "notes" },
      ] satisfies Column<InventoryItem>[],
      empty: "No hay inventario registrado.",
    },
    {
      id: "maintenance",
      sectionKey: "maintenanceTasks",
      title: "Mantenimiento",
      rows: data.maintenanceTasks,
      columns: [
        { key: "systemName", label: "Sistema" },
        { key: "title", label: "Tarea", className: "item-name" },
        { key: "status", label: "Estado" },
        { key: "priority", label: "Prioridad" },
        { key: "dueDate", label: "Prevista", render: (row) => date(row.dueDate) },
        { key: "doneDate", label: "Realizada", render: (row) => date(row.doneDate) },
        { key: "cost", label: "Coste", className: "cost-cell", render: (row) => money(row.cost) },
        { key: "notes", label: "Notas", className: "notes" },
      ] satisfies Column<MaintenanceTask>[],
      empty: "No hay tareas de mantenimiento.",
    },
    {
      id: "haulouts",
      sectionKey: "haulOuts",
      title: "Varadas",
      rows: data.haulOuts,
      columns: [
        { key: "status", label: "Estado" },
        { key: "name", label: "Nombre", className: "item-name" },
        { key: "shipyardName", label: "Varadero" },
        { key: "startDate", label: "Inicio", render: (row) => date(row.startDate) },
        { key: "endDate", label: "Fin", render: (row) => date(row.endDate) },
        { key: "estimatedCost", label: "Presupuesto", className: "cost-cell", render: (row) => money(row.estimatedCost) },
        { key: "notes", label: "Notas", className: "notes" },
      ] satisfies Column<HaulOut>[],
      empty: "No hay varadas registradas.",
    },
    {
      id: "observations",
      sectionKey: "observations",
      title: "Observaciones",
      rows: data.observations,
      columns: [
        { key: "systemName", label: "Sistema" },
        { key: "title", label: "Observacion", className: "item-name" },
        { key: "priority", label: "Prioridad" },
        { key: "status", label: "Estado" },
        { key: "observedAt", label: "Fecha", render: (row) => date(row.observedAt) },
        { key: "description", label: "Descripcion", className: "notes" },
      ] satisfies Column<Observation>[],
      empty: "No hay observaciones registradas.",
    },
    {
      id: "actions",
      sectionKey: "futureActions",
      title: "Acciones",
      rows: data.futureActions,
      columns: [
        { key: "systemName", label: "Sistema" },
        { key: "title", label: "Accion", className: "item-name" },
        { key: "kind", label: "Tipo" },
        { key: "priority", label: "Prioridad" },
        { key: "targetDate", label: "Objetivo", render: (row) => date(row.targetDate) },
        { key: "responsible", label: "Responsable" },
      ] satisfies Column<FutureAction>[],
      empty: "No hay acciones futuras.",
    },
    {
      id: "purchases",
      sectionKey: "futurePurchases",
      title: "Compras",
      rows: data.futurePurchases,
      columns: [
        { key: "systemName", label: "Sistema" },
        { key: "articleName", label: "Articulo", className: "item-name" },
        { key: "priority", label: "Prioridad" },
        { key: "quantity", label: "Cantidad" },
        { key: "estimatedCost", label: "Estimado", className: "cost-cell", render: (row) => money(row.estimatedCost) },
        { key: "supplier", label: "Proveedor" },
      ] satisfies Column<FuturePurchase>[],
      empty: "No hay compras futuras.",
    },
    {
      id: "hours",
      sectionKey: "hourLogs",
      title: "Horas",
      rows: data.hourLogs,
      columns: [
        { key: "counterName", label: "Contador" },
        { key: "loggedAt", label: "Fecha", render: (row) => date(row.loggedAt) },
        { key: "hours", label: "Horas", className: "item-name" },
        { key: "loggedBy", label: "Registrado por" },
        { key: "notes", label: "Notas", className: "notes" },
      ] satisfies Column<HourLog>[],
      empty: "No hay registros de horas.",
    },
    {
      id: "fuel",
      sectionKey: "fuelLogs",
      title: "Combustible",
      rows: data.fuelLogs,
      columns: [
        { key: "fuelType", label: "Combustible" },
        { key: "fuelledAt", label: "Fecha", render: (row) => date(row.fuelledAt) },
        { key: "quantity", label: "Cantidad", render: (row) => `${row.quantity} ${row.unit}` },
        { key: "totalCost", label: "Coste", className: "cost-cell", render: (row) => money(row.totalCost) },
        { key: "supplier", label: "Proveedor" },
        { key: "notes", label: "Notas", className: "notes" },
      ] satisfies Column<FuelLog>[],
      empty: "No hay repostajes.",
    },
    {
      id: "directories",
      sectionKey: "marinas",
      title: "Directorios",
      rows: [
        ...(includes("marinas") ? data.marinas.map((item) => ({ type: "Marina", name: item.name, region: [item.region, item.country].filter(Boolean).join(", "), phone: item.phone, email: item.email, notes: item.notes })) : []),
        ...(includes("shipyards") ? data.shipyards.map((item) => ({ type: "Varadero", name: item.name, region: [item.region, item.country].filter(Boolean).join(", "), phone: item.phone, email: item.email, notes: item.notes })) : []),
      ],
      columns: [
        { key: "type", label: "Tipo" },
        { key: "name", label: "Nombre", className: "item-name" },
        { key: "region", label: "Zona" },
        { key: "phone", label: "Telefono" },
        { key: "email", label: "Email" },
        { key: "notes", label: "Notas", className: "notes" },
      ] satisfies Column<{ type: string; name: string; region: string; phone: string | null; email: string | null; notes: string | null }>[],
      empty: "No hay marinas ni varaderos.",
    },
  ];
  const filteredPanels = allPanels.filter((item) => {
    if (item.id === "directories") return includes("marinas") || includes("shipyards");
    return includes(item.sectionKey as ExportSectionKey);
  });

  const sails = boat?.dimensions?.sails ?? [];
  const sailsPanel = sails.length > 0 ? {
    id: "sails",
    title: "Velas",
    rows: sails,
    columns: [
      { key: "label" as keyof SailInventoryItem, label: "Nombre", className: "item-name" },
      { key: "sailType" as keyof SailInventoryItem, label: "Tipo" },
      { key: "condition" as keyof SailInventoryItem, label: "Estado" },
      { key: "area" as keyof SailInventoryItem, label: "Área (m²)" },
      { key: "luff" as keyof SailInventoryItem, label: "Grátil (m)" },
      { key: "foot" as keyof SailInventoryItem, label: "Pujamen (m)" },
      { key: "leech" as keyof SailInventoryItem, label: "Baluma (m)" },
      { key: "material" as keyof SailInventoryItem, label: "Material" },
      { key: "year" as keyof SailInventoryItem, label: "Año" },
      { key: "notes" as keyof SailInventoryItem, label: "Notas", className: "notes" },
    ] satisfies Column<SailInventoryItem>[],
    empty: "No hay inventario de velas.",
  } : null;

  const panels = sailsPanel ? [sailsPanel, ...filteredPanels] : filteredPanels;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(fullBoatName)} - Boat Record</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>${styles()}</style>
</head>
<body>
<div class="page">
  <header class="header">
    <div class="boat-name">${escapeHtml(fullBoatName)}</div>
    <div class="boat-sub">Boat Record · ${escapeHtml(subtitle)}</div>
    <div class="stats-row">
      ${stats.map(([label, value]) => `<div class="stat"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-val">${display(value)}</span></div>`).join("")}
    </div>
    <div class="gold-line"></div>
  </header>
  <nav class="tabs">
    ${panels.map((item, index) => `<button class="tab-btn${index === 0 ? " active" : ""}" onclick="switchTab('${item.id}',this)">${escapeHtml(item.title)}</button>`).join("")}
  </nav>
  ${panels.map((item, index) => panel(item.id, item.title, item.rows as object[], item.columns as Column<object>[], item.empty).replace(`tab-panel${item.id === "inventory" ? " active" : ""}`, `tab-panel${index === 0 ? " active" : ""}`)).join("")}
</div>
<script>${script()}</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(boatName)}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
