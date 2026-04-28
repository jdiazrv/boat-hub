-- Seed engine hour logs for Moody 425 ENJOY from Engine Hours.csv
-- Idempotent: upserts the hour counter and inserts logs skipping duplicates.

begin;

-- Ensure the boat exists
insert into public.boats (name, identifier, brand_model, boat_type)
values ('ENJOY', 'moody-425-enjoy', 'Moody 425', 'Sailboat')
on conflict (identifier) do update set name = excluded.name;

-- Ensure the "Motor principal" hour counter exists (upsert so we always get the id back)
insert into public.hour_counters (boat_id, name, unit, notes)
select b.id, 'Motor principal', 'hours', 'Motor Yanmar'
from public.boats b
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, name) do update set unit = excluded.unit;

-- Insert engine hour log entries (skip exact duplicates by value + counter)
insert into public.engine_hour_logs (boat_id, hour_counter_id, value_hours, logged_at, notes)
select
  b.id,
  hc.id,
  entry.value_hours,
  coalesce(entry.logged_at, now()),
  entry.notes
from public.boats b
join public.hour_counters hc on hc.boat_id = b.id and hc.name = 'Motor principal'
cross join (values
  (1957::numeric, '2019-07-11'::timestamptz, 'Cartagena'),
  (2003::numeric, null,                      'Mahon'),
  (2052::numeric, null,                      'San Vito Lo Capo, Italy'),
  (2087::numeric, null,                      'Rocella Ionica, Italy'),
  (2146::numeric, null,                      'Athens, Pireo'),
  (2183::numeric, null,                      'Porto Carras, Greece'),
  (2200::numeric, '2019-08-20'::timestamptz, 'Thesaloniki, Greece'),
  (2685::numeric, '2023-05-13'::timestamptz, 'Poros'),
  (2698::numeric, '2023-05-26'::timestamptz, 'Porto Rafti'),
  (2844::numeric, '2023-08-24'::timestamptz, 'Laconian Gulf'),
  (2930::numeric, '2024-10-15'::timestamptz, 'Eretria')
) as entry(value_hours, logged_at, notes)
where b.identifier = 'moody-425-enjoy'
  and not exists (
    select 1 from public.engine_hour_logs x
    where x.hour_counter_id = hc.id
      and x.value_hours = entry.value_hours
  );

commit;
