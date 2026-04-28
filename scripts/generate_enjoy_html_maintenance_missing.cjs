const fs = require("fs");
const vm = require("vm");
const XLSX = require("xlsx");

const htmlPath = "/Users/juandiaz/Downloads/moody425_boat_record_2.html";
const csvPath = "/Users/juandiaz/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Maintenance Log.csv";
const output = "supabase/seed_enjoy_maintenance_from_html_missing.sql";

const html = fs.readFileSync(htmlPath, "utf8");
const match = html.match(/const maintData = (\[[\s\S]*?\]);/);
if (!match) throw new Error("maintData not found in HTML");

const context = {};
vm.createContext(context);
vm.runInContext(`data = ${match[1]}`, context);
const htmlRows = context.data;
const csvRows = XLSX.utils.sheet_to_json(XLSX.readFile(csvPath).Sheets.Sheet1, { defval: null });

function clean(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function excelYear(value) {
  if (value == null || value === "") return 0;
  const date = new Date(Date.UTC(1899, 11, 30 + Math.floor(Number(value))));
  return date.getUTCFullYear();
}

function sqlString(value) {
  if (value == null || String(value).trim() === "") return "null";
  return `'${String(value).trim().replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value == null || String(value).trim() === "") return "null";
  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? String(number) : "null";
}

function parseDate(value, year) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  const monthMap = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const match = text.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (match) {
    const month = monthMap[match[1].toLowerCase()];
    if (month) return `${match[2]}-${month}-01`;
  }
  return year ? `${year}-01-01` : null;
}

const systemCode = new Map([
  ["Steering", "enjoy_steering_systems"],
  ["Engine & Propulsion", "enjoy_engine_and_propulsion"],
  ["Hull, Zincs & Deck", "enjoy_hull_zincs_and_deck"],
  ["Plumbing & Pumps", "enjoy_plumbing_and_pumps"],
  ["Rigging & Winches", "enjoy_rigging_and_winches"],
  ["Fresh Water", "enjoy_fresh_water"],
  ["Dinghy & Motor", "enjoy_dinghy_and_motor"],
  ["Electronics", "enjoy_electronics_and_radar"],
]);

const csvKeys = new Set(csvRows.map((row) => `${clean(row["Description<text>"])}|${excelYear(row["Date<date>"])}`));
const missing = htmlRows.filter((row) => !csvKeys.has(`${clean(row[1])}|${Number(row[6] || 0)}`));
const systems = [...new Set(missing.map((row) => row[0]))];

const sql = [];
sql.push("-- Missing ENJOY maintenance rows found in moody425_boat_record_2.html but not in Maintenance Log.csv");
sql.push("-- Idempotent: avoids duplicate title/date/system rows.");
sql.push("begin;");

systems.forEach((system, index) => {
  const code = systemCode.get(system) ?? `enjoy_${clean(system).replace(/ /g, "_") || "other"}`;
  sql.push(`
insert into public.system_catalog (code, name_es, name_en, sort_order)
values (${sqlString(code)}, ${sqlString(system)}, ${sqlString(system)}, ${1400 + index})
on conflict (code) do nothing;
`.trim());
  sql.push(`
insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = ${sqlString(code)}
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;
`.trim());
});

sql.push("create temp table enjoy_html_maintenance_missing (system_code text, title text, is_upgrade boolean, completed_date date, cost numeric, done_by text) on commit drop;");
sql.push("insert into enjoy_html_maintenance_missing (system_code, title, is_upgrade, completed_date, cost, done_by) values");
sql.push(
  missing.map((row) => {
    const code = systemCode.get(row[0]) ?? `enjoy_${clean(row[0]).replace(/ /g, "_") || "other"}`;
    return `  (${sqlString(code)}, ${sqlString(row[1])}, ${row[5] ? "true" : "false"}, ${sqlString(parseDate(row[2], row[6]))}, ${sqlNumber(row[3])}, ${sqlString(row[4])})`;
  }).join(",\n") + ";"
);

sql.push(`
insert into public.maintenance_tasks (
  boat_id,
  boat_system_id,
  kind,
  status,
  priority,
  title,
  completed_at,
  performed_by,
  estimated_cost,
  notes
)
select
  b.id,
  bs.id,
  case when i.is_upgrade then 'upgrade'::public.maintenance_kind else 'corrective'::public.maintenance_kind end,
  case when i.completed_date is not null then 'done'::public.task_status else 'pending'::public.task_status end,
  'medium'::public.priority_level,
  i.title,
  i.completed_date::timestamptz,
  i.done_by,
  i.cost,
  concat_ws(' | ',
    case when i.is_upgrade then 'Upgrade: yes' else 'Upgrade: no' end,
    'Source: moody425_boat_record_2.html'
  )
from enjoy_html_maintenance_missing i
join public.boats b on b.identifier = 'moody-425-enjoy'
join public.system_catalog s on s.code = i.system_code
join public.boat_systems bs on bs.boat_id = b.id and bs.system_id = s.id
where not exists (
  select 1
  from public.maintenance_tasks existing
  where existing.boat_id = b.id
    and lower(existing.title) = lower(i.title)
    and coalesce(extract(year from existing.completed_at)::int, 0) = coalesce(extract(year from i.completed_date)::int, 0)
);
`.trim());

sql.push("commit;");

fs.writeFileSync(output, `${sql.join("\n\n")}\n`);
console.log(`${output}: ${missing.length} missing rows`);
