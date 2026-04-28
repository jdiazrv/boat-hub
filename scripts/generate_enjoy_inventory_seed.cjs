const fs = require("fs");
const XLSX = require("xlsx");

const input = "/Users/juandiaz/Downloads/moody_425_enjoy_inventory.csv";
const output = "supabase/seed_enjoy_inventory.sql";

const workbook = XLSX.readFile(input);
const rows = XLSX.utils
  .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null })
  .filter((row) => ["Brand/Model", "Year", "Notes"].some((key) => row[key] != null && String(row[key]).trim() !== ""));

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
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value == null || String(value).trim() === "") return "null";
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.trunc(number)) : "null";
}

const categories = [...new Set(rows.map((row) => String(row.Category || "General").trim() || "General"))];
const sql = [];

sql.push("-- Seed Moody 425 ENJOY inventory from moody_425_enjoy_inventory.csv");
sql.push("-- Idempotent: does not delete existing data and avoids duplicate imported items.");
sql.push("begin;");
sql.push(`
insert into public.boats (name, identifier, brand_model, boat_type, notes)
values ('ENJOY', 'moody-425-enjoy', 'Moody 425', 'Sailboat', 'Imported inventory from moody_425_enjoy_inventory.csv')
on conflict (identifier) do update set
  name = excluded.name,
  brand_model = coalesce(public.boats.brand_model, excluded.brand_model),
  boat_type = coalesce(public.boats.boat_type, excluded.boat_type);
`.trim());

categories.forEach((category, index) => {
  const code = `enjoy_${slug(category)}`;
  sql.push(`
insert into public.system_catalog (code, name_es, name_en, sort_order)
values (${sqlString(code)}, ${sqlString(category)}, ${sqlString(category)}, ${1000 + index})
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;
`.trim());
  sql.push(`
insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = ${sqlString(code)}
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;
`.trim());
});

sql.push("create temp table enjoy_inventory_import (category_code text, item text, brand_model text, item_year integer, notes text) on commit drop;");
sql.push("insert into enjoy_inventory_import (category_code, item, brand_model, item_year, notes) values");
sql.push(
  rows.map((row) => {
    const category = String(row.Category || "General").trim() || "General";
    return `  (${sqlString(`enjoy_${slug(category)}`)}, ${sqlString(row.Item)}, ${sqlString(row["Brand/Model"])}, ${sqlNumber(row.Year)}, ${sqlString(row.Notes)})`;
  }).join(",\n") + ";"
);

sql.push(`
insert into public.inventory_items (boat_id, boat_system_id, name, description, unit, stock, notes)
select
  b.id,
  bs.id,
  i.item,
  i.brand_model,
  'unit',
  1,
  concat_ws(' | ',
    case when i.item_year is not null then 'Year: ' || i.item_year::text end,
    nullif(i.notes, ''),
    'Source: moody_425_enjoy_inventory.csv'
  )
from enjoy_inventory_import i
join public.boats b on b.identifier = 'moody-425-enjoy'
join public.system_catalog s on s.code = i.category_code
join public.boat_systems bs on bs.boat_id = b.id and bs.system_id = s.id
where i.item is not null and btrim(i.item) <> ''
  and not exists (
    select 1
    from public.inventory_items existing
    where existing.boat_id = b.id
      and existing.boat_system_id = bs.id
      and lower(existing.name) = lower(i.item)
      and coalesce(existing.description, '') = coalesce(i.brand_model, '')
  );
`.trim());

sql.push("commit;");

fs.writeFileSync(output, `${sql.join("\n\n")}\n`);
console.log(`${output}: ${rows.length} inventory rows, ${categories.length} categories`);
