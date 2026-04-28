const fs = require("fs");
const XLSX = require("xlsx");

const input = "/Users/juandiaz/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Maintenance Log.csv";
const output = "supabase/seed_enjoy_maintenance.sql";

const workbook = XLSX.readFile(input);
const rows = XLSX.utils
  .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null })
  .filter((row) => row["Description<text>"] != null && String(row["Description<text>"]).trim() !== "")
  .filter((row) => ["System<text>", "Upgrade?<check_mark>", "Date<date>", "Engine Hours<number>", "Cost<number>", "Done by<text>"].some((key) => row[key] != null && String(row[key]).trim() !== ""));

function slug(value) {
  return String(value || "General")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "general";
}

function sqlString(value) {
  if (value == null || String(value).trim() === "") return "null";
  return `'${cleanText(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value == null || String(value).trim() === "") return "null";
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "null";
}

function excelDateToIso(value) {
  if (value == null || String(value).trim() === "") return null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }
  const serial = Math.floor(Number(value));
  if (!Number.isFinite(serial)) return null;
  const date = new Date(Date.UTC(1899, 11, 30 + serial));
  return date.toISOString().slice(0, 10);
}

function isUpgrade(value) {
  const text = cleanText(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return text === "si" || text === "s" || text === "yes" || text === "true";
}

function cleanText(value) {
  if (value == null) return "";
  let text = String(value).trim();
  if (/Ã/.test(text)) {
    try {
      text = Buffer.from(text, "latin1").toString("utf8");
    } catch {
      // Keep original text if transcoding fails.
    }
  }
  return text.replace(/[Â�]/g, "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

const systems = [...new Set(rows.map((row) => cleanText(row["System<text>"] || "General") || "General"))];
const sql = [];

sql.push("-- Seed Moody 425 ENJOY maintenance log from Maintenance Log.csv");
sql.push("-- Idempotent: does not delete existing data and avoids duplicate imported tasks.");
sql.push("begin;");
sql.push(`
insert into public.boats (name, identifier, brand_model, boat_type, notes)
values ('ENJOY', 'moody-425-enjoy', 'Moody 425', 'Sailboat', 'Imported data for Moody 425 ENJOY')
on conflict (identifier) do update set
  name = excluded.name,
  brand_model = coalesce(public.boats.brand_model, excluded.brand_model),
  boat_type = coalesce(public.boats.boat_type, excluded.boat_type);
`.trim());

systems.forEach((system, index) => {
  const code = `enjoy_${slug(system)}`;
  sql.push(`
insert into public.system_catalog (code, name_es, name_en, sort_order)
values (${sqlString(code)}, ${sqlString(system)}, ${sqlString(system)}, ${1200 + index})
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;
`.trim());
  sql.push(`
insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = ${sqlString(code)}
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;
`.trim());
});

sql.push("create temp table enjoy_maintenance_import (system_code text, title text, is_upgrade boolean, completed_date date, engine_hours numeric, cost numeric, done_by text) on commit drop;");
sql.push("insert into enjoy_maintenance_import (system_code, title, is_upgrade, completed_date, engine_hours, cost, done_by) values");
sql.push(
  rows.map((row) => {
    const system = cleanText(row["System<text>"] || "General") || "General";
    return `  (${sqlString(`enjoy_${slug(system)}`)}, ${sqlString(row["Description<text>"])}, ${isUpgrade(row["Upgrade?<check_mark>"])}, ${sqlString(excelDateToIso(row["Date<date>"]))}, ${sqlNumber(row["Engine Hours<number>"])}, ${sqlNumber(row["Cost<number>"])}, ${sqlString(row["Done by<text>"])})`;
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
  engine_hours,
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
  i.engine_hours,
  i.cost,
  concat_ws(' | ',
    case when i.is_upgrade then 'Upgrade: yes' else 'Upgrade: no' end,
    'Source: Maintenance Log.csv'
  )
from enjoy_maintenance_import i
join public.boats b on b.identifier = 'moody-425-enjoy'
join public.system_catalog s on s.code = i.system_code
join public.boat_systems bs on bs.boat_id = b.id and bs.system_id = s.id
where i.title is not null and btrim(i.title) <> ''
  and not exists (
    select 1
    from public.maintenance_tasks existing
    where existing.boat_id = b.id
      and existing.boat_system_id = bs.id
      and lower(existing.title) = lower(i.title)
      and coalesce(existing.completed_at::date, date '0001-01-01') = coalesce(i.completed_date, date '0001-01-01')
      and coalesce(existing.engine_hours, -1) = coalesce(i.engine_hours, -1)
      and coalesce(existing.estimated_cost, -1) = coalesce(i.cost, -1)
  );
`.trim());

sql.push("commit;");

fs.writeFileSync(output, `${sql.join("\n\n")}\n`);
console.log(`${output}: ${rows.length} maintenance rows, ${systems.length} systems`);
