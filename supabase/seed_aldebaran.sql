-- =============================================================================
-- Seed: Aldebaran - Systems, Components and Maintenance Tasks
-- Boat ID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- =============================================================================

do $$
declare
  v_boat_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  -- system_catalog IDs
  c_dinghy        uuid := 'dc59f1d4-b2a7-436a-bd5d-3cf8fe53d30e';
  c_electrical    uuid := '3288d8bc-a2fb-4f17-9d54-fbab46b2c6f0';
  c_electronics   uuid := '3f805ba7-bf47-467e-8ce6-05e87e763fbf';
  c_engine        uuid := '8cc91433-4c8c-487e-bb7c-86d9f93ee0e8';
  c_freshwater    uuid := '37c44663-f4ee-4dde-9395-ee6a88bc596a';
  c_galley        uuid := '560278bf-dc10-4e18-8ee3-776f85f4ccbb';
  c_groundtackle  uuid := 'cfdc55a5-77c9-4000-b603-59cfb0348e0e';
  c_hatches       uuid := '49374044-4413-4c30-9e49-4821f34095ab';
  c_hull          uuid := '11d73ba9-5f3f-4b8f-8e9f-cbd6e0a04db4';
  c_interior      uuid := 'f39c2c9e-9da1-4abe-9d95-cab1d8d224b5';
  c_other         uuid := '4e7d6056-83a4-4c86-b1d9-d727f75fa4c5';
  c_outboard      uuid := '730d5a8e-71c3-49b0-a905-f16975ae7453';
  c_plumbing      uuid := '2de2bdf4-b865-4af3-895b-0d35522eebfd';
  c_propane       uuid := '6fa60084-cc34-490a-ae34-9df7e621c47f';
  c_radio         uuid := 'b076961c-bba1-48e0-96f6-59165ab6183a';
  c_rigging       uuid := 'a1ab4015-21de-471c-a576-0604bc2be037';
  c_safety        uuid := '289d8792-1065-4151-9dae-95e7a73623d3';
  c_sails         uuid := '2d55415e-4445-492f-afc4-bb238fcc1077';
  c_steering      uuid := 'cabe22b2-5bfd-4823-88d4-a03410858a3e';
  c_winches       uuid := 'c43b76bf-a53f-49ea-9ebd-771f25d60282';

  -- boat_systems IDs (generated)
  bs_dinghy       uuid;
  bs_electrical   uuid;
  bs_electronics  uuid;
  bs_engine       uuid;
  bs_freshwater   uuid;
  bs_galley       uuid;
  bs_groundtackle uuid;
  bs_hatches      uuid;
  bs_hull         uuid;
  bs_interior     uuid;
  bs_other        uuid;
  bs_outboard     uuid;
  bs_plumbing     uuid;
  bs_propane      uuid;
  bs_radio        uuid;
  bs_rigging      uuid;
  bs_safety       uuid;
  bs_sails        uuid;
  bs_steering     uuid;
  bs_winches      uuid;

begin

-- =============================================================================
-- 1. BOAT SYSTEMS (one per system_catalog entry for Aldebaran)
-- =============================================================================

insert into public.boat_systems (boat_id, system_id) values
  (v_boat_id, c_dinghy),
  (v_boat_id, c_electrical),
  (v_boat_id, c_electronics),
  (v_boat_id, c_engine),
  (v_boat_id, c_freshwater),
  (v_boat_id, c_galley),
  (v_boat_id, c_groundtackle),
  (v_boat_id, c_hatches),
  (v_boat_id, c_hull),
  (v_boat_id, c_interior),
  (v_boat_id, c_other),
  (v_boat_id, c_outboard),
  (v_boat_id, c_plumbing),
  (v_boat_id, c_propane),
  (v_boat_id, c_radio),
  (v_boat_id, c_rigging),
  (v_boat_id, c_safety),
  (v_boat_id, c_sails),
  (v_boat_id, c_steering),
  (v_boat_id, c_winches)
on conflict (boat_id, system_id) do nothing;

-- Fetch boat_system IDs
select id into bs_dinghy       from public.boat_systems where boat_id = v_boat_id and system_id = c_dinghy;
select id into bs_electrical   from public.boat_systems where boat_id = v_boat_id and system_id = c_electrical;
select id into bs_electronics  from public.boat_systems where boat_id = v_boat_id and system_id = c_electronics;
select id into bs_engine       from public.boat_systems where boat_id = v_boat_id and system_id = c_engine;
select id into bs_freshwater   from public.boat_systems where boat_id = v_boat_id and system_id = c_freshwater;
select id into bs_galley       from public.boat_systems where boat_id = v_boat_id and system_id = c_galley;
select id into bs_groundtackle from public.boat_systems where boat_id = v_boat_id and system_id = c_groundtackle;
select id into bs_hatches      from public.boat_systems where boat_id = v_boat_id and system_id = c_hatches;
select id into bs_hull         from public.boat_systems where boat_id = v_boat_id and system_id = c_hull;
select id into bs_interior     from public.boat_systems where boat_id = v_boat_id and system_id = c_interior;
select id into bs_other        from public.boat_systems where boat_id = v_boat_id and system_id = c_other;
select id into bs_outboard     from public.boat_systems where boat_id = v_boat_id and system_id = c_outboard;
select id into bs_plumbing     from public.boat_systems where boat_id = v_boat_id and system_id = c_plumbing;
select id into bs_propane      from public.boat_systems where boat_id = v_boat_id and system_id = c_propane;
select id into bs_radio        from public.boat_systems where boat_id = v_boat_id and system_id = c_radio;
select id into bs_rigging      from public.boat_systems where boat_id = v_boat_id and system_id = c_rigging;
select id into bs_safety       from public.boat_systems where boat_id = v_boat_id and system_id = c_safety;
select id into bs_sails        from public.boat_systems where boat_id = v_boat_id and system_id = c_sails;
select id into bs_steering     from public.boat_systems where boat_id = v_boat_id and system_id = c_steering;
select id into bs_winches      from public.boat_systems where boat_id = v_boat_id and system_id = c_winches;

-- =============================================================================
-- 2. BOAT COMPONENTS (from Boat details.csv)
-- =============================================================================

insert into public.boat_components (boat_id, boat_system_id, name, manufacturer, model, notes) values

-- Dinghy
(v_boat_id, bs_dinghy, 'Dinghy', null, 'Nautilus Semirigid', 'Length: 2.70m'),
(v_boat_id, bs_dinghy, 'Outboard Motor Dinghy', 'Mariner', '8cv 2T', 'Serial: 6775-0556110'),
(v_boat_id, bs_dinghy, 'Handheld VHF', null, null, null),

-- Electrical
(v_boat_id, bs_electrical, 'Alternator', 'Balmar', '170xt', null),
(v_boat_id, bs_electrical, 'Batteries', null, null, 'Lithium 300AH + 2 lead (200) + 1 lead starter'),
(v_boat_id, bs_electrical, 'Inverter', 'Victron', 'Phoenix 800VA', null),
(v_boat_id, bs_electrical, 'Inverter 2', 'Victron', 'Multiplus', null),
(v_boat_id, bs_electrical, 'Shore Power', null, null, '1 x 35A'),
(v_boat_id, bs_electrical, 'Solar Panels', null, null, '300W bimini + 160W deck + 200W removable'),
(v_boat_id, bs_electrical, 'Solar Regulator', 'Victron', 'MPPT', null),

-- Electronics
(v_boat_id, bs_electronics, 'Chartplotter', 'Raymarine', 'Axiom 9', '9 inch MFD with Navionics+ Small'),
(v_boat_id, bs_electronics, 'Radar', 'Raymarine', 'Quantum 2 Q24D', 'Wireless CHIRP Radar, installed 2019'),
(v_boat_id, bs_electronics, 'Wind Speed', 'Raymarine', 'i70', null),
(v_boat_id, bs_electronics, 'Speed Log', 'Airmar', 'ST800', null),

-- Engine
(v_boat_id, bs_engine, 'Main Engine', 'Yanmar', '4JH4AE', null),
(v_boat_id, bs_engine, 'Propeller', 'Brunton', 'Autoprop H5', null),
(v_boat_id, bs_engine, 'Fuel Tank', null, null, '275 litres'),
(v_boat_id, bs_engine, 'Exhaust', 'Yanmar', null, null),

-- Fresh Water
(v_boat_id, bs_freshwater, 'Fresh Water Tank', null, null, '400 litres'),
(v_boat_id, bs_freshwater, 'Fresh Water Pump', null, null, null),
(v_boat_id, bs_freshwater, 'Flow Water Meter', 'Topargee', 'H2F-FM', null),

-- Galley
(v_boat_id, bs_galley, 'BBQ', 'Magma', null, null),
(v_boat_id, bs_galley, 'Refrigeration', null, null, null),
(v_boat_id, bs_galley, 'Stove', null, null, null),

-- Ground Tackle
(v_boat_id, bs_groundtackle, 'Windlass', 'Lofrans', 'Cayman 1000W', 'New in 2021'),
(v_boat_id, bs_groundtackle, 'Anchor', null, null, null),
(v_boat_id, bs_groundtackle, 'Chain', null, null, null),

-- Hull
(v_boat_id, bs_hull, 'Bottom Paint', 'HEMPEL', null, null),
(v_boat_id, bs_hull, 'Bow Thruster', 'Vetus', null, null),
(v_boat_id, bs_hull, 'Bimini', null, null, 'New in 2018'),
(v_boat_id, bs_hull, 'Dodger', null, null, 'New in 2021'),
(v_boat_id, bs_hull, 'Stanchions', null, null, 'Replaced original aluminium for stainless steel in 2017'),

-- Interior
(v_boat_id, bs_interior, 'Berths', null, null, null),
(v_boat_id, bs_interior, 'Upholstery', null, null, null),

-- Plumbing
(v_boat_id, bs_plumbing, 'Toilet', 'Jabsco', 'New Style', null),
(v_boat_id, bs_plumbing, 'Diesel Heater', 'Autoterm', '4D', 'Installed 2021'),
(v_boat_id, bs_plumbing, 'Water Heater', 'Volvo', '41103500', null),
(v_boat_id, bs_plumbing, 'Bilge Pumps', null, null, null),
(v_boat_id, bs_plumbing, 'Seacocks', null, null, null),

-- Rigging
(v_boat_id, bs_rigging, 'Standing Rigging', null, null, 'All standing rigging replaced in 2019'),
(v_boat_id, bs_rigging, 'Boom', null, null, null),
(v_boat_id, bs_rigging, 'Furler', null, null, null),

-- Safety
(v_boat_id, bs_safety, 'EPIRB', null, 'Kannad 406', null),
(v_boat_id, bs_safety, 'Life Jackets', null, null, null),
(v_boat_id, bs_safety, 'Life Raft', null, null, null),
(v_boat_id, bs_safety, 'Fire Extinguishers', null, null, null),

-- Sails
(v_boat_id, bs_sails, 'Main Sail', null, null, '32.88 m2'),
(v_boat_id, bs_sails, 'Genoa', null, null, '39.60 m2'),
(v_boat_id, bs_sails, 'Storm Jib', null, null, null),

-- Steering
(v_boat_id, bs_steering, 'Steering System', null, null, null),
(v_boat_id, bs_steering, 'Autopilot', null, null, null),

-- Winches
(v_boat_id, bs_winches, 'Winches', 'Lewmar', 'Wavegrip', null);

-- =============================================================================
-- 3. MAINTENANCE TASKS (from maintenance tasks.csv)
-- CSV systems mapped: Deck Gear→rigging, Navigation & Comms→electronics+radio,
--   Safety Gear→safety, Gas System→propane, Steering→steering, Winches→winches
-- =============================================================================

insert into public.maintenance_tasks (boat_id, boat_system_id, kind, status, priority, title) values

-- DECK GEAR → rigging-winches
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Ensure stanchions are secure'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Check grab handles'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Inspect blocks for damage'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Check life lines'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'low', 'Ensure deck grip is clean'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Clutches: spray with silicone (not WD40)'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Wash blocks with detergent to remove salt & dirt'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Check all blocks and shackles are tight'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Inspect shackles for cracks, corrosion or elongation'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Apply Tef-Gel between stainless fittings and aluminium components'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Tape over cotter pins to prevent snagging'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Check cleats - ensure back plates and nuts are secure'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Check jammers'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Look for signs of water ingress or corrosion'),
(v_boat_id, bs_rigging, 'corrective', 'pending', 'medium', 'Replace any bent or corroded fastenings'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Polish stainless'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'low', 'Check winch handles'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Use only dry lubricants on deck gear'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Repairs should be sealed with Sikaflex'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Remove dirt and salt buildup from fittings'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Service winches'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Ensure sheaves are spinning freely'),
(v_boat_id, bs_rigging, 'inspection', 'pending', 'medium', 'Check sheets'),
(v_boat_id, bs_rigging, 'preventive', 'pending', 'low', 'Remove fibre fluff from inside clutches/jammers'),

-- ELECTRICAL
(v_boat_id, bs_electrical, 'corrective', 'pending', 'high', 'Replace service batteries'),
(v_boat_id, bs_electrical, 'preventive', 'pending', 'low', 'Use cable ties to tidy loose wires'),
(v_boat_id, bs_electrical, 'inspection', 'pending', 'medium', 'Check all electrical connections are clean & secure'),
(v_boat_id, bs_electrical, 'inspection', 'pending', 'medium', 'Check shore power connections'),
(v_boat_id, bs_electrical, 'inspection', 'pending', 'medium', 'Check navigation lights'),
(v_boat_id, bs_electrical, 'preventive', 'pending', 'low', 'Clean battery tops and terminals'),
(v_boat_id, bs_electrical, 'preventive', 'pending', 'low', 'Lubricate terminals with petroleum jelly'),
(v_boat_id, bs_electrical, 'inspection', 'pending', 'medium', 'Ensure batteries are securely fastened'),
(v_boat_id, bs_electrical, 'inspection', 'pending', 'medium', 'Ensure battery terminals are tight'),

-- ENGINE AND PROPULSION
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check coupling connecting gearbox to propeller shaft'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'high', 'Check fuel filters'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'low', 'Clean engine bay'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'high', 'Check coolant/antifreeze levels'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Bleed diesel system'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check hose clips are tight'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check insulation'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'high', 'Check engine oil levels'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check gear lever'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Change Delphi filter'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check engine for corrosion'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'high', 'Replace fuel filters'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Add fuel treatment, check for contamination'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'low', 'Grease exposed parts of gear shift mechanism'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'high', 'Change oil & oil filter'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Inspect injection pump and injectors'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'high', 'Check water hoses for leaks'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'high', 'Change impeller'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Clean water strainer'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'low', 'Grease control cable joints and end fittings'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check drive belt alignment, tension & bearings'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Change oil filter'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Refuel - keep tanks full to avoid condensation & diesel bug'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check transmission oil'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Drain water off fuel filter'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Change primary fuel filter'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check exhaust system'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'high', 'Check for leaks in fuel system'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Ensure all bolts are tight'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check engine mounts'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Check fuel lines'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Clean air filter'),
(v_boat_id, bs_engine, 'inspection', 'pending', 'medium', 'Ensure fuel lift pump works'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Drain and refill coolant'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Clean fuel tank'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Replace raw water hoses'),
(v_boat_id, bs_engine, 'preventive', 'pending', 'medium', 'Replace pencil anode (exhaust cooling)'),

-- GALLEY
(v_boat_id, bs_galley, 'preventive', 'pending', 'medium', 'Check & clean fridge'),
(v_boat_id, bs_galley, 'inspection', 'pending', 'medium', 'Check gimbal on stove works'),
(v_boat_id, bs_galley, 'preventive', 'pending', 'low', 'Clean stove'),
(v_boat_id, bs_galley, 'preventive', 'pending', 'low', 'Clean cupboards'),
(v_boat_id, bs_galley, 'inspection', 'pending', 'medium', 'Ensure heavy items are well stowed'),

-- GAS SYSTEM → propane
(v_boat_id, bs_propane, 'inspection', 'pending', 'high', 'Check gas lines'),
(v_boat_id, bs_propane, 'inspection', 'pending', 'high', 'Check CO2 alarm works'),
(v_boat_id, bs_propane, 'preventive', 'pending', 'medium', 'Fill gas bottles'),
(v_boat_id, bs_propane, 'inspection', 'pending', 'medium', 'Check hose clips'),

-- GROUND TACKLE AND ANCHORING
(v_boat_id, bs_groundtackle, 'preventive', 'pending', 'medium', 'Clean & inspect anchor chain'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'medium', 'Check mooring lines'),
(v_boat_id, bs_groundtackle, 'preventive', 'pending', 'medium', 'Clean & inspect anchor'),
(v_boat_id, bs_groundtackle, 'preventive', 'pending', 'low', 'Check & clean fenders'),
(v_boat_id, bs_groundtackle, 'preventive', 'pending', 'low', 'Lubricate bow roller'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'high', 'Check line and buoy for emergency ditching'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'medium', 'Check anchor shackles'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'medium', 'Check knife'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'high', 'Check bitter end tied securely'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'medium', 'Check spare anchor & rode'),
(v_boat_id, bs_groundtackle, 'inspection', 'pending', 'medium', 'Check chafing gear'),

-- HULL, ZINCS AND DECK
(v_boat_id, bs_hull, 'inspection', 'pending', 'medium', 'Check cockpit drains are clear'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'medium', 'Check hull-deck joint'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'medium', 'Check bulkheads for any sign of movement'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'high', 'Inspect hull for any dents or signs of osmosis'),
(v_boat_id, bs_hull, 'preventive', 'pending', 'high', 'Waterblast antifoul'),
(v_boat_id, bs_hull, 'preventive', 'pending', 'high', 'Re-paint antifoul'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'high', 'Check all windows and ports are watertight'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'high', 'Check keel bolts'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'medium', 'Check grab rails are securely fastened'),
(v_boat_id, bs_hull, 'inspection', 'pending', 'low', 'Check all doors and lockers open and close'),

-- NAVIGATION & COMMS → electronics
(v_boat_id, bs_electronics, 'inspection', 'pending', 'medium', 'Check GPS works'),
(v_boat_id, bs_electronics, 'inspection', 'pending', 'medium', 'Ensure appropriate charts & guides are on board'),
(v_boat_id, bs_electronics, 'inspection', 'pending', 'medium', 'Do VHF Radio Check'),
(v_boat_id, bs_electronics, 'preventive', 'pending', 'medium', 'Swing compass'),
(v_boat_id, bs_electronics, 'inspection', 'pending', 'low', 'Check compass light'),
(v_boat_id, bs_electronics, 'inspection', 'pending', 'low', 'Check spare batteries'),

-- OUTBOARD MOTOR
(v_boat_id, bs_outboard, 'preventive', 'pending', 'high', 'Flush outboard with fresh water as often as possible'),
(v_boat_id, bs_outboard, 'corrective', 'pending', 'medium', 'Replace sheer pin'),
(v_boat_id, bs_outboard, 'preventive', 'pending', 'medium', 'Mix fuel and oil'),
(v_boat_id, bs_outboard, 'inspection', 'pending', 'medium', 'Check fuel tank air vent opens & closes'),
(v_boat_id, bs_outboard, 'preventive', 'pending', 'medium', 'Replace fuel filter'),
(v_boat_id, bs_outboard, 'inspection', 'pending', 'medium', 'Check fuel lines'),
(v_boat_id, bs_outboard, 'inspection', 'pending', 'medium', 'Check for external corrosion'),
(v_boat_id, bs_outboard, 'inspection', 'pending', 'low', 'Check for wear on pull cord'),
(v_boat_id, bs_outboard, 'preventive', 'pending', 'medium', 'Spray electrical connections'),
(v_boat_id, bs_outboard, 'preventive', 'pending', 'medium', 'Replace spark plug'),

-- PLUMBING
(v_boat_id, bs_plumbing, 'preventive', 'pending', 'medium', 'Clean bilge'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Ensure all hose clamps are tight'),
(v_boat_id, bs_plumbing, 'preventive', 'pending', 'medium', 'Check and clean water tanks'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Check sea cocks'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Check water pumps'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'medium', 'Check toilet is bolted down firmly'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Ensure thru-hulls all have wooden plugs'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'medium', 'Check shower sump and drain'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'medium', 'Check toilet seat is secure'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'medium', 'Is toilet working correctly'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Check emergency pumps'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'medium', 'Check all taps working correctly'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Inspect & squeeze all hoses for leaks & kinks'),
(v_boat_id, bs_plumbing, 'inspection', 'pending', 'high', 'Check bilge pumps'),

-- SAFETY GEAR
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check Life Rings'),
(v_boat_id, bs_safety, 'preventive', 'pending', 'critical', 'Service EPIRB'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Inflate Life Jackets'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check Harnesses'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check wire cutters'),
(v_boat_id, bs_safety, 'preventive', 'pending', 'medium', 'Replace batteries in grab bag'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check first aid kit'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check life lines'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'critical', 'Check flares & replace as necessary'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check grab bag'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'medium', 'Check fog horn'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check Fire Extinguishers'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Test bilge pumps & alarm'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check life jacket cylinders'),
(v_boat_id, bs_safety, 'inspection', 'pending', 'high', 'Check jack lines and pad eyes'),
(v_boat_id, bs_safety, 'preventive', 'pending', 'critical', 'Life Raft Service'),

-- SAILS
(v_boat_id, bs_sails, 'preventive', 'pending', 'medium', 'Wash sheets and halyards'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'End for end & examine all halyards'),
(v_boat_id, bs_sails, 'preventive', 'pending', 'low', 'Lubricate sail track'),
(v_boat_id, bs_sails, 'preventive', 'pending', 'medium', 'Wash sails in fresh water'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'Check for any tears & patch'),
(v_boat_id, bs_sails, 'preventive', 'pending', 'low', 'Remove sails if leaving for a long period'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'Check seam stitching'),
(v_boat_id, bs_sails, 'corrective', 'pending', 'low', 'Replace tell tails if required'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'Check for signs of chafing and apply preventative patches'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'Check battens & pockets'),
(v_boat_id, bs_sails, 'preventive', 'pending', 'low', 'Cover sails to prevent UV damage'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'Inspect head, tack & reef points'),
(v_boat_id, bs_sails, 'inspection', 'pending', 'medium', 'Check condition of eyes & cringles'),

-- STEERING
(v_boat_id, bs_steering, 'inspection', 'pending', 'medium', 'Sheave supports firmly mounted'),
(v_boat_id, bs_steering, 'inspection', 'pending', 'high', 'Check steering cables'),
(v_boat_id, bs_steering, 'inspection', 'pending', 'high', 'Examine rudder shaft'),
(v_boat_id, bs_steering, 'inspection', 'pending', 'medium', 'Ensure steering area is free from gear & tangles'),
(v_boat_id, bs_steering, 'inspection', 'pending', 'medium', 'Adjustment nuts should be tight'),
(v_boat_id, bs_steering, 'preventive', 'pending', 'medium', 'Lubricate steering cables'),
(v_boat_id, bs_steering, 'inspection', 'pending', 'high', 'Test emergency steering'),
(v_boat_id, bs_steering, 'preventive', 'pending', 'medium', 'Clean & grease steering quadrant'),

-- WINCHES
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Grease winch gear teeth and roller bearing cages'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'low', 'Inspect and remove pawls and springs'),
(v_boat_id, bs_winches, 'inspection', 'pending', 'medium', 'Check roller bearings inside drum'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Rinse winches in fresh water'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Service gearbox - remove, clean and reassemble'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Use SAE30 oil to lubricate pawls in their seats'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'low', 'Reassemble winch and test operation'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Grease all winch bearing surfaces and gears'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Clean all winch components with degreaser'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'medium', 'Wash all winch components in warm soapy water'),
(v_boat_id, bs_winches, 'inspection', 'pending', 'medium', 'Ensure ratchet pawls engage squarely in ratchet teeth'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'low', 'Wipe away excess grease and oil from winches'),
(v_boat_id, bs_winches, 'preventive', 'pending', 'low', 'Use toothbrush to remove caked grease & grime'),
(v_boat_id, bs_winches, 'inspection', 'pending', 'medium', 'Test winch to ensure it is working correctly'),
(v_boat_id, bs_winches, 'inspection', 'pending', 'medium', 'Check all winch components for wear and replace if necessary');

end $$;
