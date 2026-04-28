-- Missing ENJOY maintenance rows found in moody425_boat_record_2.html but not in Maintenance Log.csv

-- Idempotent: avoids duplicate title/date/system rows.

begin;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_steering_systems', 'Steering', 'Steering', 1400)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_steering_systems'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_fresh_water', 'Fresh Water', 'Fresh Water', 1401)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_fresh_water'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_dinghy_and_motor', 'Dinghy & Motor', 'Dinghy & Motor', 1402)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_dinghy_and_motor'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_hull_zincs_and_deck', 'Hull, Zincs & Deck', 'Hull, Zincs & Deck', 1403)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_hull_zincs_and_deck'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_electronics_and_radar', 'Electronics', 'Electronics', 1404)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_electronics_and_radar'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_rigging_and_winches', 'Rigging & Winches', 'Rigging & Winches', 1405)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_rigging_and_winches'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_engine_and_propulsion', 'Engine & Propulsion', 'Engine & Propulsion', 1406)
on conflict (code) do nothing;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY HTML maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_engine_and_propulsion'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

create temp table enjoy_html_maintenance_missing (system_code text, title text, is_upgrade boolean, completed_date date, cost numeric, done_by text) on commit drop;

insert into enjoy_html_maintenance_missing (system_code, title, is_upgrade, completed_date, cost, done_by) values

  ('enjoy_steering_systems', 'Rpelace steering will with Lewmar Folding Wheel 36” Dual HUB', false, '2018-11-01', null, null),
  ('enjoy_fresh_water', 'Install MAB Watermaker', true, '2021-01-01', 3000, 'Tjoppe'),
  ('enjoy_dinghy_and_motor', 'Valve Clearance adjustment', false, '2021-04-01', null, 'Motorworks'),
  ('enjoy_hull_zincs_and_deck', 'Anti Osmosis treatment', false, '2021-05-01', null, 'Alfa Yacht Care'),
  ('enjoy_hull_zincs_and_deck', 'Antiskid paint on deck', false, '2021-05-01', null, 'Alfa Yacht Care'),
  ('enjoy_electronics_and_radar', 'Replace instrument panel lighting with LEDs + new engine hours LCD screen', true, '2021-01-01', null, 'self'),
  ('enjoy_hull_zincs_and_deck', 'Replace toilet + cockpit drain seacocks (bronze thruhull, plastic valves)', false, '2022-01-01', null, 'self'),
  ('enjoy_rigging_and_winches', 'New FURLEX 304s. New stay.', false, '2025-05-01', 3050, 'self'),
  ('enjoy_hull_zincs_and_deck', 'Change shaft and hull anodes', false, '2025-10-01', null, 'self'),
  ('enjoy_hull_zincs_and_deck', 'Replace pencil anode (exhaust cooling)', false, '2025-10-01', null, 'self'),
  ('enjoy_engine_and_propulsion', 'clean heat exchanger. check themostat. change raw water pipes. flush cooling system', false, '2026-03-01', null, 'lefteris'),
  ('enjoy_steering_systems', 'Replace upper rudder bearing (Vesconite) + O-rings. Sand and paint quadrant', true, '2026-03-01', null, null),
  ('enjoy_engine_and_propulsion', 'Clean exhaust elbow', false, '2026-03-01', null, 'lefeteris'),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2026-04-01', null, 'self'),
  ('enjoy_dinghy_and_motor', 'Change raw water and refrigerant hoses', false, null, null, null),
  ('enjoy_dinghy_and_motor', 'Change Themrostat', false, null, null, null),
  ('enjoy_dinghy_and_motor', 'Clean exhaust elbow', false, null, null, null),
  ('enjoy_dinghy_and_motor', 'Clean Heat Exchanger', false, null, null, null),
  ('enjoy_hull_zincs_and_deck', 'Replace pencil anode (exhaust cooling)', false, null, null, 'self');

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

commit;
