-- Seed Moody 425 ENJOY inventory from moody_425_enjoy_inventory.csv

-- Idempotent: does not delete existing data and avoids duplicate imported items.

begin;

insert into public.boats (name, identifier, brand_model, boat_type, notes)
values ('ENJOY', 'moody-425-enjoy', 'Moody 425', 'Sailboat', 'Imported inventory from moody_425_enjoy_inventory.csv')
on conflict (identifier) do update set
  name = excluded.name,
  brand_model = coalesce(public.boats.brand_model, excluded.brand_model),
  boat_type = coalesce(public.boats.boat_type, excluded.boat_type);

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_sails_and_rigging', 'Sails and Rigging', 'Sails and Rigging', 1000)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_sails_and_rigging'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_deck_gear_and_cockpit', 'Deck Gear and Cockpit', 'Deck Gear and Cockpit', 1001)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_deck_gear_and_cockpit'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_hull_underwater_and_steering', 'Hull, Underwater and Steering', 'Hull, Underwater and Steering', 1002)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_hull_underwater_and_steering'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_engine_and_propulsion', 'Engine and Propulsion', 'Engine and Propulsion', 1003)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_engine_and_propulsion'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_electronics_and_navigation', 'Electronics and Navigation', 'Electronics and Navigation', 1004)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_electronics_and_navigation'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_communications', 'Communications', 'Communications', 1005)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_communications'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_electrical_system', 'Electrical System', 'Electrical System', 1006)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_electrical_system'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_solar_charging_and_energy_generation', 'Solar, Charging and Energy Generation', 'Solar, Charging and Energy Generation', 1007)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_solar_charging_and_energy_generation'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_ac_220v_system', 'AC / 220V System', 'AC / 220V System', 1008)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_ac_220v_system'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_plumbing_and_water_systems', 'Plumbing and Water Systems', 'Plumbing and Water Systems', 1009)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_plumbing_and_water_systems'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_heating_and_comfort', 'Heating and Comfort', 'Heating and Comfort', 1010)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_heating_and_comfort'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_galley_and_gas', 'Galley and Gas', 'Galley and Gas', 1011)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_galley_and_gas'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_heads_and_waste', 'Heads and Waste', 'Heads and Waste', 1012)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_heads_and_waste'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_safety', 'Safety', 'Safety', 1013)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_safety'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_tender', 'Tender', 'Tender', 1014)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_tender'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_interior_and_accommodation', 'Interior and Accommodation', 'Interior and Accommodation', 1015)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_interior_and_accommodation'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_openings_hatches_and_portlights', 'Openings, Hatches and Portlights', 'Openings, Hatches and Portlights', 1016)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_openings_hatches_and_portlights'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_tools', 'Tools', 'Tools', 1017)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_tools'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('enjoy_spares', 'Spares', 'Spares', 1018)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, 'Imported ENJOY inventory category'
from public.boats b
join public.system_catalog s on s.code = 'enjoy_spares'
where b.identifier = 'moody-425-enjoy'
on conflict (boat_id, system_id) do nothing;

create temp table enjoy_inventory_import (category_code text, item text, brand_model text, item_year integer, notes text) on commit drop;

insert into enjoy_inventory_import (category_code, item, brand_model, item_year, notes) values

  ('enjoy_sails_and_rigging', 'Mainsail', 'In-mast furling mainsail', 2025, 'Replaced'),
  ('enjoy_sails_and_rigging', 'Genoa / headsail', 'Furling genoa with UV cover', 2021, 'Replaced'),
  ('enjoy_sails_and_rigging', 'Standing rigging', 'Complete', 2019, 'Replaced'),
  ('enjoy_sails_and_rigging', 'Furler', 'Furlex 304s', 2025, 'New'),
  ('enjoy_sails_and_rigging', 'Mast', 'Kemp aluminium mast', null, 'Original spar'),
  ('enjoy_sails_and_rigging', 'Boom', 'Kemp aluminium boom', null, 'Original spar'),
  ('enjoy_sails_and_rigging', 'Running rigging', 'Complete set', null, 'Onboard'),
  ('enjoy_sails_and_rigging', 'Mainsail furling system', 'In-mast', null, 'Operational'),
  ('enjoy_sails_and_rigging', 'Headsail furling system', 'Roller furling', 2025, 'Furlex 304s'),
  ('enjoy_sails_and_rigging', 'Boom vang / kicker', null, 2012, 'Replaced per maintenance log'),
  ('enjoy_deck_gear_and_cockpit', 'Genoa sheet winch', 'Lewmar L52ST', null, 'Installed'),
  ('enjoy_deck_gear_and_cockpit', 'Main halyard winch', 'Lewmar L30C', null, 'Installed'),
  ('enjoy_deck_gear_and_cockpit', 'Genoa halyard winch', 'Lewmar L40C', null, 'Installed'),
  ('enjoy_deck_gear_and_cockpit', 'Genoa furling line winch', 'Lewmar L8C', null, 'Installed'),
  ('enjoy_deck_gear_and_cockpit', 'Furling mainsail control winches', '2 x Lewmar L16C', null, 'Installed'),
  ('enjoy_deck_gear_and_cockpit', 'Windlass', 'Lofrans Cayman for 10 mm chain', 2021, 'New'),
  ('enjoy_deck_gear_and_cockpit', 'Steering wheel', 'Lewmar Folding Wheel 36â Dual Hub', 2018, 'Replaced'),
  ('enjoy_deck_gear_and_cockpit', 'Steering system', 'Whitlock Constellation 400', null, 'Mechanical steering system'),
  ('enjoy_deck_gear_and_cockpit', 'Emergency tiller', 'Stainless steel custom replacement', 2019, 'Replaced from original mild steel unit'),
  ('enjoy_deck_gear_and_cockpit', 'Bimini', 'Custom', 2021, 'New'),
  ('enjoy_deck_gear_and_cockpit', 'Dodger / sprayhood', 'Custom', 2021, 'New'),
  ('enjoy_deck_gear_and_cockpit', 'Davits', 'Stern davits', null, 'Tender handling/storage'),
  ('enjoy_deck_gear_and_cockpit', 'Cockpit table', null, null, 'Assumed included if still fitted'),
  ('enjoy_deck_gear_and_cockpit', 'Deck finish', 'Polyurethane non-skid deck paint', 2021, 'Deck repainted'),
  ('enjoy_hull_underwater_and_steering', 'Keel', 'Shoal draft keel', null, 'Approx. 1.42 m draft'),
  ('enjoy_hull_underwater_and_steering', 'Anti-osmosis treatment', 'Epoxy barrier after hull stripped to gelcoat', 2021, 'Major structural hull work'),
  ('enjoy_hull_underwater_and_steering', 'Through-hulls', 'Complete replacement', 2004, 'Per log'),
  ('enjoy_hull_underwater_and_steering', 'Seawater hoses and valves', 'Renewed', 2020, 'Per log'),
  ('enjoy_hull_underwater_and_steering', 'Toilet seacocks', 'Replaced', 2022, 'Per manual'),
  ('enjoy_hull_underwater_and_steering', 'Cockpit drain seacocks', 'Replaced', 2022, 'Per manual'),
  ('enjoy_hull_underwater_and_steering', 'Most valves updated again', 'Mixed metal / Randex plastic', 2023, 'Per manual'),
  ('enjoy_hull_underwater_and_steering', 'Bonding cables to seacocks', 'Renewed', 2004, 'Per manual'),
  ('enjoy_hull_underwater_and_steering', 'Raw water strainer', null, 2020, 'Replaced'),
  ('enjoy_hull_underwater_and_steering', 'Shaft seal', 'PSS dripless stuffing box', 2020, 'Replaced per log'),
  ('enjoy_hull_underwater_and_steering', 'Cutlass bearing', null, 2023, 'Most recent replacement in log'),
  ('enjoy_hull_underwater_and_steering', 'Propeller', 'Bruntons Autoprop H5, 3-blade', null, 'Serial AP6384'),
  ('enjoy_hull_underwater_and_steering', 'Propeller rebuild', 'Factory rebuild', 2022, 'Major service'),
  ('enjoy_hull_underwater_and_steering', 'Bow thruster', 'Rheinstrom BR-11', null, 'Installed'),
  ('enjoy_hull_underwater_and_steering', 'Rudder upper bearing', 'Custom Vesconite bearing', 2026, 'Preventive replacement'),
  ('enjoy_hull_underwater_and_steering', 'Rudder upper bearing O-rings', 'NBR-70 set', 2026, 'Replaced'),
  ('enjoy_hull_underwater_and_steering', 'Keel studs and bolts', 'Replaced', 2019, 'Per maintenance log'),
  ('enjoy_engine_and_propulsion', 'Engine', 'Yanmar 4JH4AE', 2004, 'Current engine installed'),
  ('enjoy_engine_and_propulsion', 'Gearbox', 'KM35P', 2004, 'Current gearbox installed'),
  ('enjoy_engine_and_propulsion', 'Engine mounts', 'Replaced', 2023, 'Most recent date from log'),
  ('enjoy_engine_and_propulsion', 'Starter motor', 'Replaced', 2019, 'Per log'),
  ('enjoy_engine_and_propulsion', 'Engine panel illumination', 'LED conversion', 2021, 'Updated'),
  ('enjoy_engine_and_propulsion', 'Engine hours display', 'LCD replaced', 2021, 'Display renewed'),
  ('enjoy_engine_and_propulsion', 'Fuel tank', 'Original steel tank', null, 'Overhauled 2008, cleaned 2025'),
  ('enjoy_engine_and_propulsion', 'Fuel stopcock', null, null, 'Operational'),
  ('enjoy_engine_and_propulsion', 'Water-diesel separator', null, null, 'Part of fuel filtration'),
  ('enjoy_engine_and_propulsion', 'Magnetic particles filter', null, null, 'Part of fuel filtration'),
  ('enjoy_engine_and_propulsion', 'Fuel prefilter', null, null, 'Part of fuel filtration'),
  ('enjoy_engine_and_propulsion', 'Engine fuel filter', null, null, 'Standard service item'),
  ('enjoy_engine_and_propulsion', 'Heat exchanger', 'Cleaned', 2020, 'Serviced'),
  ('enjoy_engine_and_propulsion', 'Exhaust elbow', 'Replaced', 2020, 'Renewed'),
  ('enjoy_engine_and_propulsion', 'Raw water hoses', 'Replaced', 2020, 'Renewed'),
  ('enjoy_engine_and_propulsion', 'Raw water pump', 'Serviced', 2021, 'Maintenance log'),
  ('enjoy_engine_and_propulsion', 'Control lever', 'Single lever throttle/gear', null, 'Installed'),
  ('enjoy_electronics_and_navigation', 'Cockpit plotter', 'Raymarine Axiom 9.9â MFD', null, 'Installed in cockpit'),
  ('enjoy_electronics_and_navigation', 'Navigation station plotter', 'Raymarine E-Series MFD', null, 'Installed at chart table'),
  ('enjoy_electronics_and_navigation', 'Radar', 'Raymarine Quantum Q24D Doppler 18"', 2019, 'Installed'),
  ('enjoy_electronics_and_navigation', 'AIS', 'Raymarine AIS 650 with dedicated antenna', null, 'Installed'),
  ('enjoy_electronics_and_navigation', 'Autopilot', 'Raymarine Evolution EVO-200', 2018, 'Replaced / upgraded'),
  ('enjoy_electronics_and_navigation', 'Wind display', 'Raymarine i60', null, 'Cockpit'),
  ('enjoy_electronics_and_navigation', 'Multifunction display', 'Raymarine i70', null, 'Cockpit'),
  ('enjoy_electronics_and_navigation', 'Multifunction display', 'Raymarine i70', null, 'Nav station'),
  ('enjoy_electronics_and_navigation', 'Depth display', null, null, 'Cockpit instrument'),
  ('enjoy_electronics_and_navigation', 'NAVTEX', 'NX-300', null, 'Installed'),
  ('enjoy_electronics_and_navigation', 'Compass', 'Pedestal compass', null, 'Assumed installed with steering pedestal'),
  ('enjoy_electronics_and_navigation', 'Radar MARPA / Doppler functions', 'Integrated with radar', 2019, 'Modern radar capability'),
  ('enjoy_communications', 'VHF radio', 'B&G V50', null, 'Main VHF at nav station'),
  ('enjoy_communications', 'Wireless handset', 'B&G H50', null, 'Bluetooth / inductive charging'),
  ('enjoy_communications', 'Satellite phone', 'Thuraya SG2520', null, 'Emergency communications'),
  ('enjoy_communications', 'Walkie-talkies', 'Handheld radios', null, 'Included in manual'),
  ('enjoy_electrical_system', 'Start battery bank', '1 dedicated lead-acid battery', null, 'Isolated start bank'),
  ('enjoy_electrical_system', 'Bow thruster battery bank', '2 lead-acid batteries 90â110 Ah each', 2020, 'Renewed forward bank'),
  ('enjoy_electrical_system', 'Service battery bank', 'Winston LiFePO4 300 Ah', 2022, 'Lithium upgrade'),
  ('enjoy_electrical_system', 'BMS', '123BMS by 123electric', null, 'Battery management'),
  ('enjoy_electrical_system', 'Battery protect devices', '2 x Victron Battery Protect 220A', null, 'Protection relays'),
  ('enjoy_electrical_system', 'Battery monitors', '2 x Victron BMV-712', null, 'System monitoring'),
  ('enjoy_electrical_system', 'DC-DC charger', 'Victron Orion TR for start bank', null, 'Charging'),
  ('enjoy_electrical_system', 'DC-DC charger', 'Victron Orion TR for bow thruster bank', null, 'Charging'),
  ('enjoy_electrical_system', 'Alternator', 'Balmar XT 170A', 2021, 'Major upgrade'),
  ('enjoy_electrical_system', 'Alternator regulator', 'Balmar MC-614', 2021, 'External regulator'),
  ('enjoy_electrical_system', 'Alternator protection strategy', 'Custom BMS-aware setup', 2021, 'Described in manual'),
  ('enjoy_electrical_system', 'Manual alternator override', 'Installed', 2021, 'Under ladder'),
  ('enjoy_electrical_system', 'Alternator output reduction switch', 'Installed', 2021, '50% option'),
  ('enjoy_electrical_system', 'Battery selector switch', '1-2 switch', null, 'Bow thruster / reserve logic'),
  ('enjoy_electrical_system', 'Victron Connect monitoring', 'Enabled', null, 'App monitoring'),
  ('enjoy_electrical_system', '123BMS monitoring', 'Enabled', null, 'App monitoring'),
  ('enjoy_electrical_system', 'Galvanic isolator', 'Installed', 2021, 'Per log'),
  ('enjoy_solar_charging_and_energy_generation', 'Bimini solar panels', 'Solar array', 2021, 'New panels'),
  ('enjoy_solar_charging_and_energy_generation', 'Deck solar panels', 'Solar array', 2021, 'New panels'),
  ('enjoy_solar_charging_and_energy_generation', 'Removable solar panels', 'Lifeline-mounted', 2022, 'Installed'),
  ('enjoy_solar_charging_and_energy_generation', 'Lifeline solar panels', 'Replaced', 2023, 'Updated'),
  ('enjoy_solar_charging_and_energy_generation', 'Rigid rail-mounted panels', '2 x 80 W', 2024, 'Added on rails'),
  ('enjoy_solar_charging_and_energy_generation', 'Additional rigid bimini panels', '2 x 140 W', 2024, 'Added'),
  ('enjoy_solar_charging_and_energy_generation', 'Flush solar panels', 'Tough+ 82W', null, 'Listed in manual'),
  ('enjoy_solar_charging_and_energy_generation', 'Solar charge controllers', 'Victron MPPT units', null, 'Multiple controllers'),
  ('enjoy_solar_charging_and_energy_generation', 'Wind generator', null, null, 'Charging source'),
  ('enjoy_solar_charging_and_energy_generation', 'Wind controller', 'HRSI', null, 'Controller for wind gen'),
  ('enjoy_solar_charging_and_energy_generation', 'Shore charging', 'Via AC system and Multiplus', null, 'Charging source'),
  ('enjoy_solar_charging_and_energy_generation', 'Alternator charging', 'Balmar XT 170A', 2021, 'Charging source'),
  ('enjoy_ac_220v_system', 'Shore power inlet', '220/240V input socket', null, 'Cockpit area'),
  ('enjoy_ac_220v_system', 'RCCB', '30 mA residual current breaker', null, 'Installed'),
  ('enjoy_ac_220v_system', 'Main AC breaker', 'Double pole main breaker', null, 'Installed'),
  ('enjoy_ac_220v_system', 'Polarity test system', 'LED polarity indicators', null, 'Installed'),
  ('enjoy_ac_220v_system', 'Voltmeter', 'AC system voltmeter', null, 'Installed'),
  ('enjoy_ac_220v_system', 'Inverter / charger', 'Victron Multiplus 1600W', null, 'Powers sockets and charges'),
  ('enjoy_ac_220v_system', 'Secondary inverter', 'Victron 1200W inverter', null, 'Dedicated white socket under panel'),
  ('enjoy_ac_220v_system', 'Water heater / calorifier', null, 2004, 'Hot water system, replaced'),
  ('enjoy_ac_220v_system', 'AC sockets / ring main', null, null, 'Installed'),
  ('enjoy_plumbing_and_water_systems', 'Freshwater system', 'Pressurized hot and cold', null, 'Installed'),
  ('enjoy_plumbing_and_water_systems', 'Water tanks', 'Twin tanks, connected', null, 'Total approx. 409 L'),
  ('enjoy_plumbing_and_water_systems', 'Pressure pump', null, null, 'Freshwater pressure'),
  ('enjoy_plumbing_and_water_systems', 'Water level indicators', 'LED panel indicators', null, 'Installed'),
  ('enjoy_plumbing_and_water_systems', 'Water monitor', 'Topargee consumption / level counter', null, 'Installed'),
  ('enjoy_plumbing_and_water_systems', 'Watermaker', 'MAB', null, 'Installed'),
  ('enjoy_plumbing_and_water_systems', 'Watermaker production', 'Up to 60 L/h', null, 'Optimum conditions'),
  ('enjoy_plumbing_and_water_systems', 'Watermaker control panel', null, null, 'System control'),
  ('enjoy_plumbing_and_water_systems', 'TDS meter', null, null, 'Water quality control'),
  ('enjoy_plumbing_and_water_systems', 'Freshwater flush / pickling functions', null, null, 'Maintenance functions'),
  ('enjoy_plumbing_and_water_systems', 'Watermaker pump oil change', 'Completed', 2025, 'Maintenance log'),
  ('enjoy_heating_and_comfort', 'Diesel heater', 'Autoterm 4D, 4 kW', 2021, 'Installed'),
  ('enjoy_heating_and_comfort', 'Heater control panel', 'PU-27', 2021, 'Installed'),
  ('enjoy_heating_and_comfort', 'Heater built-in sensor', null, 2021, 'System monitoring'),
  ('enjoy_heating_and_comfort', 'External cabin sensor', null, 2021, 'Master cabin'),
  ('enjoy_heating_and_comfort', 'Rotatable air outlets', '2 x Webasto 360Â° closable outlets', 2021, 'Installed'),
  ('enjoy_heating_and_comfort', 'Interior upholstery', 'Renewed in grey', 2021, 'Full upholstery replacement'),
  ('enjoy_heating_and_comfort', 'Curtains', 'Renewed', 2012, 'Installed'),
  ('enjoy_galley_and_gas', 'Gas locker', 'Self-draining', null, 'Installed'),
  ('enjoy_galley_and_gas', 'Gas regulator', null, null, 'System component'),
  ('enjoy_galley_and_gas', 'Copper gas line', 'Protected', null, 'Fixed installation'),
  ('enjoy_galley_and_gas', 'Electromagnetic gas shutoff', null, null, 'Controlled from galley/panel'),
  ('enjoy_galley_and_gas', 'Cooker / oven', 'Gimballed gas cooker', null, 'Installed'),
  ('enjoy_galley_and_gas', 'Galley controls', 'Remote gas control switches', null, 'Installed'),
  ('enjoy_heads_and_waste', 'Forward head', 'Marine toilet', null, 'Installed'),
  ('enjoy_heads_and_waste', 'Aft head', 'Marine toilet', null, 'Installed'),
  ('enjoy_heads_and_waste', 'Aft head toilet', 'Replaced', 2025, 'New toilet'),
  ('enjoy_heads_and_waste', 'Aft head pump', 'Replaced', 2025, 'New pump'),
  ('enjoy_heads_and_waste', 'Electric toilet pumps', 'Installed', 2020, 'Upgrade'),
  ('enjoy_heads_and_waste', 'Forward toilet intake pipe', 'Replaced', 2023, 'Maintenance log'),
  ('enjoy_heads_and_waste', 'Toilet discharge hoses', 'Both replaced', 2023, 'Maintenance log'),
  ('enjoy_heads_and_waste', 'Holding tank', 'Aft toilet holding tank', null, 'Installed'),
  ('enjoy_heads_and_waste', '3-way discharge valve', 'Aft head', null, 'Installed'),
  ('enjoy_heads_and_waste', 'Macerator pump', null, null, 'Holding tank discharge'),
  ('enjoy_heads_and_waste', 'Waste panel control', '"WASTE" switch', null, 'Macerator control'),
  ('enjoy_safety', 'Liferaft', 'ARIMAR Oceanus PG, 6 person, container', null, 'With grab bag'),
  ('enjoy_safety', 'EPIRB', 'Kannad Safe 406 / 121.5', null, 'Installed under companionway stairs'),
  ('enjoy_safety', 'Fire extinguishers', '6 total', null, '4 x 1 kg, 1 x 3 kg, 1 x 6 kg'),
  ('enjoy_safety', 'Lifebuoy', null, null, 'With automatic light'),
  ('enjoy_safety', 'Radar reflector', 'Masthead', null, 'Installed'),
  ('enjoy_safety', 'Flares', 'Offshore set', null, 'Per Italian requirements'),
  ('enjoy_safety', 'Smoke signals', 'Offshore set', null, 'Per Italian requirements'),
  ('enjoy_safety', 'Italian safety compliance', 'Offshore equipment standard', null, 'Manual notes compliance'),
  ('enjoy_tender', 'Dinghy', 'Nautilus 2.70 m semi-rigid', 2020, 'Acquired new'),
  ('enjoy_tender', 'Outboard', 'Yamaha 8 hp 2-stroke', null, 'Included'),
  ('enjoy_tender', 'Davits', 'Stern davits', null, 'Tender handling/storage'),
  ('enjoy_interior_and_accommodation', 'Renewed upholstery', 'Grey fabric', 2021, 'Full set'),
  ('enjoy_interior_and_accommodation', 'Curtains', 'Renewed', 2012, 'Installed'),
  ('enjoy_interior_and_accommodation', 'Navigation station', 'Fully equipped', null, 'Plotter, VHF, instruments'),
  ('enjoy_interior_and_accommodation', 'Hot and cold pressurized water', null, null, 'Liveaboard-friendly'),
  ('enjoy_interior_and_accommodation', 'Heater ducting', 'Distributed through interior', 2021, 'Useful for extended cruising'),
  ('enjoy_openings_hatches_and_portlights', 'Portlights', '4 x Lewmar Old Standard 4', null, 'Fitted'),
  ('enjoy_openings_hatches_and_portlights', 'Portlights', '2 x Vetus PQ51', 2020, 'Replaced'),
  ('enjoy_openings_hatches_and_portlights', 'Hatch', 'Lewmar Ocean Size 20', null, 'Fitted'),
  ('enjoy_openings_hatches_and_portlights', 'Hatch', 'Lewmar Ocean Size 30', null, 'Fitted'),
  ('enjoy_openings_hatches_and_portlights', 'Hatches', '2 x Lewmar Ocean Size 60', null, 'Fitted'),
  ('enjoy_openings_hatches_and_portlights', 'Hatch', 'Lewmar Ocean Size 70', null, 'Fitted'),
  ('enjoy_openings_hatches_and_portlights', 'Portlight acrylics', 'All replaced', 2018, 'Renewed'),
  ('enjoy_openings_hatches_and_portlights', 'Hatch acrylics', 'Sizes 20 and 30 replaced', 2023, 'Renewed'),
  ('enjoy_tools', 'General onboard maintenance tools', null, null, 'Implied by owner-maintained boat; not itemized'),
  ('enjoy_tools', 'Strainer service tool', null, null, 'Supplied with strainer; mentioned in manual'),
  ('enjoy_tools', 'Engine service tools', null, null, 'Likely onboard; not itemized'),
  ('enjoy_tools', 'Steering greasing / service access', null, null, 'Maintenance points accessible'),
  ('enjoy_tools', 'General sail and deck maintenance tools', null, null, 'Likely onboard; not itemized'),
  ('enjoy_spares', 'Propeller service parts', 'Autoprop rebuild kit parts renewed', 2022, 'Internal parts replaced during rebuild'),
  ('enjoy_spares', 'Propeller anodes', null, null, 'Service consumable'),
  ('enjoy_spares', 'Rudder upper bearing O-rings', 'Dimensions documented', 2026, 'Useful reference spare data'),
  ('enjoy_spares', 'Engine filters', null, null, 'Service spares likely onboard'),
  ('enjoy_spares', 'Impellers', null, null, 'Service spares likely onboard'),
  ('enjoy_spares', 'Anodes', null, null, 'Service consumables'),
  ('enjoy_spares', 'Heater fuses', '25A fuses referenced', null, 'System spares implied'),
  ('enjoy_spares', 'Watermaker service consumables', null, null, 'Likely onboard'),
  ('enjoy_spares', 'Toilet pumps / sanitation spares', null, null, 'Some replaced over time; not fully itemized');

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

commit;
