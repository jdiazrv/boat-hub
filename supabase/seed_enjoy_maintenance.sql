-- Seed Moody 425 ENJOY maintenance log from Maintenance Log.csv

-- Idempotent: does not delete existing data and avoids duplicate imported tasks.

begin;

insert into public.boats (name, identifier, brand_model, boat_type, notes)
values ('ENJOY', 'moody-425-enjoy', 'Moody 425', 'Sailboat', 'Imported data for Moody 425 ENJOY')
on conflict (identifier) do update set
  name = excluded.name,
  brand_model = coalesce(public.boats.brand_model, excluded.brand_model),
  boat_type = coalesce(public.boats.boat_type, excluded.boat_type);

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_steering_systems', 'Steering Systems', 'Steering Systems', 1200)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_steering_systems'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_engine_and_propulsion', 'Engine and Propulsion', 'Engine and Propulsion', 1201)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_engine_and_propulsion'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_hull_zincs_and_deck', 'Hull, Zincs and Deck', 'Hull, Zincs and Deck', 1202)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_hull_zincs_and_deck'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_plumbing_and_pumps', 'Plumbing and Pumps', 'Plumbing and Pumps', 1203)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_plumbing_and_pumps'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_rigging_and_winches', 'Rigging and Winches', 'Rigging and Winches', 1204)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_rigging_and_winches'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_hatches_and_portlghts', 'Hatches and portlghts', 'Hatches and portlghts', 1205)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_hatches_and_portlghts'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_electronics_and_radar', 'Electronics and Radar', 'Electronics and Radar', 1206)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_electronics_and_radar'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_safety_equipment', 'Safety Equipment', 'Safety Equipment', 1207)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_safety_equipment'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_electrical', 'Electrical', 'Electrical', 1208)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_electrical'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_fresh_water', 'Fresh Water', 'Fresh Water', 1209)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_fresh_water'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_other_and_miscellaneous', 'Other and Miscellaneous', 'Other and Miscellaneous', 1210)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_other_and_miscellaneous'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_interior_furniture', 'Interior furniture', 'Interior furniture', 1211)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_interior_furniture'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_sails', 'Sails', 'Sails', 1212)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_sails'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_ground_tackle_and_anchoring', 'Ground Tackle and Anchoring', 'Ground Tackle and Anchoring', 1213)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_ground_tackle_and_anchoring'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_galley_equipment', 'Galley Equipment', 'Galley Equipment', 1214)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY maintenance system'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_galley_equipment'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

create temp table enjoy_maintenance_import (system_code text, title text, is_upgrade boolean, completed_date date, engine_hours numeric, cost numeric, done_by text) on commit drop;

insert into enjoy_maintenance_import (system_code, title, is_upgrade, completed_date, engine_hours, cost, done_by) values

  ('enjoy_steering_systems', 'Add fuel treatment check for contamination', false, null, null, null, null),
  ('enjoy_engine_and_propulsion', 'Add fuel treatment check for contamination', false, null, null, null, null),
  ('enjoy_hull_zincs_and_deck', 'Anti Osmosis treatment', false, '2004-03-23', null, 2300, null),
  ('enjoy_hull_zincs_and_deck', 'Replace all thru-hulls', false, '2004-03-23', null, 1420, null),
  ('enjoy_plumbing_and_pumps', 'Replace water heater', true, '2004-03-23', null, 1000, 'Benlliure'),
  ('enjoy_rigging_and_winches', 'Replace Boon Vang', false, '2012-05-01', null, null, null),
  ('enjoy_engine_and_propulsion', 'Clean Fuel Tank', false, '2016-04-30', null, null, null),
  ('enjoy_steering_systems', 'Replace Auto Pilot with EVO-200', true, '2018-07-20', null, 2000, 'self'),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2018-11-17', null, null, null),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2018-11-17', 1398.7, null, null),
  ('enjoy_hatches_and_portlghts', 'Change Opening Portlight Lenses', true, '2018-11-17', null, null, null),
  ('enjoy_steering_systems', 'Clean & grease steering quadrant', false, '2018-11-17', null, null, null),
  ('enjoy_steering_systems', 'Rpelace steering will with Lewmar Folding Wheel 36â Dual HUB', false, '2018-11-17', null, null, null),
  ('enjoy_electronics_and_radar', 'Install new digital Radar', false, '2019-03-03', null, 3000, 'self'),
  ('enjoy_hull_zincs_and_deck', 'replace keel studs and bolts', false, '2019-04-16', null, null, 'Zapata'),
  ('enjoy_rigging_and_winches', 'Replace Standing Rigging', true, '2019-05-01', 1592.7, 3818, 'Astilleros LG'),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2019-07-10', 1749.7, null, null),
  ('enjoy_engine_and_propulsion', 'Change primary fuel filter', false, '2019-07-10', 1749.7, null, null),
  ('enjoy_engine_and_propulsion', 'Replace starter motor', false, '2019-07-31', 1927.7, null, 'MarineTech'),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil Filter', false, '2019-08-26', 2042.7, null, 'self'),
  ('enjoy_safety_equipment', 'Service EPIRB', false, '2020-02-01', 2060, null, null),
  ('enjoy_engine_and_propulsion', 'Replace cutless bearing', false, '2020-04-30', 2060, 200, 'Motorworks'),
  ('enjoy_rigging_and_winches', 'Service winches', false, '2020-05-01', null, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Heat exchange cleaning. Replace exhaust elbow', false, '2020-05-07', 2060, 500, 'Motorworks'),
  ('enjoy_engine_and_propulsion', 'Replace pencil anode (exhaust cooling)', false, '2020-05-20', 2060, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Replace raw water hoses', false, '2020-05-20', 2060, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Replace strainer', true, '2020-05-25', 2060, null, 'Motorworks'),
  ('enjoy_engine_and_propulsion', 'Replace sea water hoses and valves', false, '2020-05-25', 2060, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Replace shaft seal PSS', true, '2020-05-25', 2060, null, 'Motorworks'),
  ('enjoy_electrical', 'Replace 2 batteries. forward bank', true, '2020-06-13', 2070, null, 'self'),
  ('enjoy_electrical', 'replace service batteries', false, '2020-08-24', null, 550, null),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2020-10-01', 2093, null, null),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2020-10-01', 2092.7, null, null),
  ('enjoy_engine_and_propulsion', 'Change primary fuel filter', false, '2020-10-01', 2093, null, null),
  ('enjoy_plumbing_and_pumps', 'Replace toilets pumps with electrical', true, '2020-10-08', 2092.7, 900, 'self'),
  ('enjoy_fresh_water', 'Install MAB Watermaker', true, '2020-12-31', 2150.7, 3000, 'Tjoppe'),
  ('enjoy_electrical', 'Install Balmar 175 XT y MC614 regulator', true, '2021-01-07', 2150.7, 1500, 'Motorworks'),
  ('enjoy_fresh_water', 'MAB Water maker', true, '2021-01-10', null, 3712, 'Tjoppe Norberg'),
  ('enjoy_engine_and_propulsion', 'Service raw water pump', false, '2021-01-27', 2150.7, 300, 'Motorworks'),
  ('enjoy_hull_zincs_and_deck', 'All Anodes and Ground Plate', false, '2021-03-31', 2151, null, 'Alfa Yacht Care'),
  ('enjoy_electrical', 'install Galvanic Isolator', true, '2021-03-31', 2151, 150, 'self'),
  ('enjoy_engine_and_propulsion', 'Replace pencil anode (exhaust cooling)', false, '2021-04-20', 2158, null, null),
  ('enjoy_other_and_miscellaneous', 'Diesel Heater Autoterm 4d', true, '2021-04-23', null, 850, null),
  ('enjoy_interior_furniture', 'Replace upholstery', false, '2021-06-30', null, 1000, 'Delli Textile'),
  ('enjoy_electrical', 'New solar panels on bimini. ECOFLEX 160-36MF', true, '2021-07-11', null, 390, null),
  ('enjoy_electrical', 'New solar panels on deck', true, '2021-07-11', null, 913, 'sunbeam'),
  ('enjoy_engine_and_propulsion', 'Repair alternator', false, '2021-07-11', null, 50, null),
  ('enjoy_sails', 'new Genoa from Quantum', true, '2021-07-24', null, 2500, 'Patroklos at Quantum GR'),
  ('enjoy_other_and_miscellaneous', 'New dodger', false, '2021-09-08', null, 1000, 'DLsails'),
  ('enjoy_ground_tackle_and_anchoring', 'Replace windlass with Lofrans cayman', true, '2021-09-09', 2330, 1200, 'self'),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2021-10-01', 2329.7, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Change primary fuel filter', false, '2021-10-01', 2329.7, null, 'self'),
  ('enjoy_other_and_miscellaneous', 'New Bimini', true, '2021-10-20', 2330, 900, 'DL sails'),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2022-01-13', 2340, null, null),
  ('enjoy_electrical', 'Removable Solar Panels', true, '2022-02-12', null, 200, null),
  ('enjoy_electrical', 'Replacement of solar panel. Bimini port side.', false, '2022-03-17', null, 206, 'self'),
  ('enjoy_engine_and_propulsion', 'Propeller rebuilt', false, '2022-04-30', 2370, 300, null),
  ('enjoy_engine_and_propulsion', 'Replace cutless bearing', false, '2022-04-30', 2370, 200, 'Motorworks'),
  ('enjoy_engine_and_propulsion', 'Replace pencil anode (exhaust cooling)', false, '2022-06-07', 2380, null, null),
  ('enjoy_electrical', 'Replace Service Battery with Lithium', false, '2022-06-12', null, 8000, 'self'),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2022-10-19', 2442.7, null, null),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2022-10-19', 2442.7, null, null),
  ('enjoy_safety_equipment', 'Replace float switch of the bilge pump', false, '2022-10-19', 2442.7, 55, 'self'),
  ('enjoy_engine_and_propulsion', 'Propeller rebuilt', false, '2022-11-11', 2444, 627, 'Bruntons factory'),
  ('enjoy_plumbing_and_pumps', 'Replace fwd toilette intake pipe', false, '2023-04-28', 2444, 60, 'self'),
  ('enjoy_hull_zincs_and_deck', 'Replace', false, '2023-04-30', 2444, null, null),
  ('enjoy_engine_and_propulsion', 'Replace cutless bearing', false, '2023-04-30', 2444, null, null),
  ('enjoy_engine_and_propulsion', 'Replace engine mounts', false, '2023-04-30', 2444, null, null),
  ('enjoy_plumbing_and_pumps', 'replace both toilette discharge hoses', false, '2023-06-23', null, 200, 'self'),
  ('enjoy_electrical', 'Replace lifeline solar panels', false, '2023-06-29', 2552.7, 200, null),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2023-07-06', 2552.7, null, 'self'),
  ('enjoy_electrical', 'replace lifeline solar panel', false, '2023-09-04', 2662.7, 250, 'self'),
  ('enjoy_electrical', 'replace Bimini solar panel', false, '2024-04-22', null, 171, 'Skafatos'),
  ('enjoy_electrical', 'add 2 x 80 rigid panels to rails', true, '2024-06-12', 2822.7, 220, null),
  ('enjoy_rigging_and_winches', 'add a rigid rail on top of the guard wire in both sides', false, '2024-07-02', 2853.7, 125, 'self and menos (vagelis)'),
  ('enjoy_electrical', 'add two 140w rigid solar panels bimini', true, '2024-07-02', 2853.7, 270, 'self'),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2024-07-02', 2853.7, 37, 'self'),
  ('enjoy_engine_and_propulsion', 'Replace pencil anode (exhaust cooling)', false, '2024-07-02', 2853.7, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Change impeller', false, '2024-10-17', 2933.7, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2024-10-17', 2933.7, 66, 'self'),
  ('enjoy_engine_and_propulsion', 'Change transmission oil', false, '2024-10-17', 2933.7, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Change Delphi filter', false, '2025-05-03', 2945.7, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Change primary fuel filter', false, '2025-05-03', 2945.7, null, 'self'),
  ('enjoy_engine_and_propulsion', 'Drain and refill coolant', false, '2025-05-03', 2945.7, null, 'self'),
  ('enjoy_rigging_and_winches', 'New FURLEX 304s', false, '2025-05-13', 2955, 3050, 'self'),
  ('enjoy_galley_equipment', 'Comet pump (watermaker) Change oil', false, '2025-05-20', 2966, null, 'self'),
  ('enjoy_plumbing_and_pumps', 'Install new toilett in rear bath', false, '2025-05-25', null, 280, null),
  ('enjoy_plumbing_and_pumps', 'New pump in aft toilette', false, '2025-05-25', null, 170, 'self'),
  ('enjoy_engine_and_propulsion', 'Change oil & Oil filter', false, '2025-09-14', 3091, 66, 'self'),
  ('enjoy_engine_and_propulsion', 'Clean Fuel Tank', false, '2025-10-04', null, null, null);

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

commit;
