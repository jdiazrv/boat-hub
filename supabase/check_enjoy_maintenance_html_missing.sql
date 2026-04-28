create temp table html_maintenance_expected (title text, item_year int) on commit drop;

insert into html_maintenance_expected (title, item_year) values

  ('Anti Osmosis treatment', 2004),
  ('Replace all thru-hulls', 2004),
  ('Replace water heater', 2004),
  ('Replace Boon Vang', 2012),
  ('Clean Fuel Tank', 2016),
  ('Replace Auto Pilot with EVO-200', 2018),
  ('Change impeller', 2018),
  ('Change oil & Oil filter', 2018),
  ('Change Opening Portlight Lenses', 2018),
  ('Clean & grease steering quadrant', 2018),
  ('Rpelace steering will with Lewmar Folding Wheel 36” Dual HUB', 2018),
  ('Install new digital Radar', 2019),
  ('replace keel studs and bolts', 2019),
  ('Replace Standing Rigging', 2019),
  ('Change impeller', 2019),
  ('Change primary fuel filter', 2019),
  ('Replace starter motor', 2019),
  ('Change oil & Oil Filter', 2019),
  ('Service  EPIRB', 2020),
  ('Replace cutless bearing', 2020),
  ('Service winches', 2020),
  ('Heat exchange cleaning. Replace exhaust elbow', 2020),
  ('Replace raw water hoses', 2020),
  ('Replace pencil anode (exhaust cooling)', 2020),
  ('Replace strainer', 2020),
  ('Replace sea water hoses and valves', 2020),
  ('Replace shaft seal PSS', 2020),
  ('Replace 2 batteries. forward bank', 2020),
  ('replace service batteries', 2020),
  ('Change impeller', 2020),
  ('Change oil & Oil filter', 2020),
  ('Change primary fuel filter', 2020),
  ('Replace toilets pumps with electrical', 2020),
  ('Install  Balmar 175 XT y MC614 regulator', 2021),
  ('MAB Water maker', 2021),
  ('Install MAB Watermaker', 2021),
  ('Service raw water pump', 2021),
  ('All Anodes and Ground Plate', 2021),
  ('install Galvanic Isolator', 2021),
  ('Valve Clearance adjustment', 2021),
  ('Replace pencil anode (exhaust cooling)', 2021),
  ('Diesel Heater Autoterm 4d', 2021),
  ('Anti Osmosis treatment', 2021),
  ('Antiskid paint on deck', 2021),
  ('Replace upholstery', 2021),
  ('Replace instrument panel lighting with LEDs + new engine hours LCD screen', 2021),
  ('New solar panels on deck', 2021),
  ('Repair alternator', 2021),
  ('New solar panels on bimini. ECOFLEX 160-36MF', 2021),
  ('new Genoa from Quantum', 2021),
  ('New dodger', 2021),
  ('Replace windlass with Lofrans cayman', 2021),
  ('Change oil & Oil filter', 2021),
  ('Change primary fuel filter', 2021),
  ('New Bimini', 2021),
  ('Change impeller', 2022),
  ('Removable Solar Panels', 2022),
  ('Replacement of solar panel. Bimini port side.', 2022),
  ('Replace cutless bearing', 2022),
  ('Replace toilet + cockpit drain seacocks (bronze thruhull, plastic valves)', 2022),
  ('Replace pencil anode (exhaust cooling)', 2022),
  ('Replace Service Battery with Lithium', 2022),
  ('Change impeller', 2022),
  ('Change oil & Oil filter', 2022),
  ('Replace float switch of the bilge pump', 2022),
  ('Propeller rebuilt', 2022),
  ('Replace fwd toilette intake pipe', 2023),
  ('Replace', 2023),
  ('Replace cutless bearing', 2023),
  ('Replace engine mounts', 2023),
  ('replace both toilette discharge hoses', 2023),
  ('Replace lifeline solar panels', 2023),
  ('Change oil & Oil filter', 2023),
  ('replace lifeline solar panel', 2023),
  ('replace Bimini solar panel', 2024),
  ('add 2 x 80 rigid panels to rails', 2024),
  ('add a rigid rail   on top of the guard wire in both sides', 2024),
  ('add two 140w rigid solar panels bimini', 2024),
  ('Change oil & Oil filter', 2024),
  ('Replace pencil anode (exhaust cooling)', 2024),
  ('Change impeller', 2024),
  ('Change oil & Oil filter', 2024),
  ('Change transmission oil', 2024),
  ('Drain and refill coolant', 2025),
  ('Change primary fuel filter', 2025),
  ('Change Delphi filter', 2025),
  ('New FURLEX 304s. New stay.', 2025),
  ('Comet pump (watermaker) Change oil', 2025),
  ('Install new toilett in rear bath', 2025),
  ('New pump in aft toilette', 2025),
  ('Change oil & Oil filter', 2025),
  ('Change shaft and hull anodes', 2025),
  ('Clean Fuel Tank', 2025),
  ('Replace pencil anode (exhaust cooling)', 2025),
  ('clean heat exchanger. check themostat. change raw water pipes. flush cooling system', 2026),
  ('Replace upper rudder bearing (Vesconite) + O-rings. Sand and paint quadrant', 2026),
  ('Clean exhaust elbow', 2026),
  ('Change impeller', 2026),
  ('Add fuel treatment check for contamination', 0),
  ('Add fuel treatment check for contamination', 0),
  ('Change raw water and refrigerant hoses', 0),
  ('Change Themrostat', 0),
  ('Clean exhaust elbow', 0),
  ('Clean Heat Exchanger', 0),
  ('Replace pencil anode (exhaust cooling)', 0);

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
