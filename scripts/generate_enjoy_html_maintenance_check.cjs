const fs = require("fs");
const vm = require("vm");

const htmlPath = "/Users/juandiaz/Downloads/moody425_boat_record_2.html";
const output = "supabase/check_enjoy_maintenance_html_missing.sql";
const html = fs.readFileSync(htmlPath, "utf8");
const match = html.match(/const maintData = (\[[\s\S]*?\]);/);
if (!match) throw new Error("maintData not found");

const context = {};
vm.createContext(context);
vm.runInContext(`data = ${match[1]}`, context);

function sqlString(value) {
  if (value == null || String(value).trim() === "") return "null";
  return `'${String(value).trim().replace(/'/g, "''")}'`;
}

const rows = context.data;
const sql = [];
sql.push("create temp table html_maintenance_expected (title text, item_year int) on commit drop;");
sql.push("insert into html_maintenance_expected (title, item_year) values");
sql.push(rows.map((row) => `  (${sqlString(row[1])}, ${Number(row[6] || 0)})`).join(",\n") + ";");
sql.push(`
with normalized_expected as (
  select
    regexp_replace(lower(replace(replace(title, '”', '"'), '“', '"')), '[^a-z0-9]+', ' ', 'g') as title_key,
    item_year
  from html_maintenance_expected
),
normalized_existing as (
  select
    regexp_replace(lower(replace(replace(t.title, '”', '"'), '“', '"')), '[^a-z0-9]+', ' ', 'g') as title_key,
    coalesce(extract(year from t.completed_at)::int, 0) as item_year
  from public.maintenance_tasks t
  join public.boats b on b.id = t.boat_id
  where b.identifier = 'moody-425-enjoy'
)
select e.item_year, e.title_key
from normalized_expected e
where not exists (
  select 1
  from normalized_existing x
  where x.title_key = e.title_key
    and x.item_year = e.item_year
)
order by e.item_year, e.title_key;
`.trim());

fs.writeFileSync(output, `${sql.join("\n\n")}\n`);
console.log(`${output}: ${rows.length} expected HTML maintenance rows`);
