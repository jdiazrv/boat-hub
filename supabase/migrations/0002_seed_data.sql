-- =============================================================================
-- 0002_seed_data.sql — Consolidated reference/demo data
-- System catalog, maintenance catalog, schedule plans, and demo data.
-- =============================================================================

-- =============================================================================
-- 0002_system_catalog.sql — Sailing-boat system catalog (27 systems)
-- Consolidated from: 20260425100000
-- =============================================================================

-- Clear all dependent data in FK order, then repopulate system_catalog.
-- (Safe for a fresh install; in production this is idempotent via delete+insert.)

delete from public.maintenance_schedule_plan_items;
delete from public.maintenance_schedule_plans;
delete from public.boat_maintenance_schedule;
delete from public.maintenance_templates;
delete from public.preventive_templates;
delete from public.boat_systems;
delete from public.system_catalog;

insert into public.system_catalog (code, name_es, name_en, sort_order) values
  ('hull-deck',          'Casco y cubierta',               'Hull and Deck',                   10),
  ('keel-rudder',        'Quilla y timón',                 'Keel and Rudder',                 20),
  ('rig-mast',           'Arboladura y mástil',            'Rig and Mast',                    30),
  ('standing-rigging',   'Jarcia firme',                   'Standing Rigging',                40),
  ('running-rigging',    'Jarcia de labor',                'Running Rigging',                 50),
  ('sails',              'Velas',                          'Sails',                           60),
  ('winches-deck-gear',  'Winches y aparejos de cubierta', 'Winches and Deck Gear',           70),
  ('engine-propulsion',  'Motor y propulsión',             'Engine and Propulsion',           80),
  ('fuel-system',        'Sistema de combustible',         'Fuel System',                     90),
  ('electrical',         'Eléctrico y baterías',           'Electrical and Batteries',       100),
  ('electronics-nav',    'Electrónica y navegación',       'Electronics and Navigation',     110),
  ('autopilot-steering', 'Piloto automático y dirección',  'Autopilot and Steering',         120),
  ('fresh-water',        'Agua dulce',                     'Fresh Water System',             130),
  ('plumbing-pumps',     'Fontanería y bombas',            'Plumbing and Pumps',             140),
  ('bilge-system',       'Sistema de achique',             'Bilge System',                   150),
  ('safety-equipment',   'Equipos de seguridad',           'Safety Equipment',               160),
  ('anchoring-mooring',  'Fondeo y amarre',                'Anchoring and Mooring',          170),
  ('dinghy-outboard',    'Auxiliar y fueraborda',          'Dinghy and Outboard Motor',      180),
  ('galley',             'Cocina y gas',                   'Galley and Gas',                 190),
  ('interior',           'Interior y tapicería',           'Interior and Upholstery',        200),
  ('canvas-covers',      'Toldos y fundas',                'Canvas and Covers',              210),
  ('hatches-ports',      'Escotillas y portillos',         'Hatches and Portlights',         220),
  ('ventilation',        'Ventilación',                    'Ventilation',                    230),
  ('communication',      'Comunicaciones',                 'Communications',                 240),
  ('tools-spares',       'Herramientas y repuestos',       'Tools and Spare Parts',          250),
  ('documentation',      'Documentación',                  'Documentation',                  260),
  ('other',              'Otros',                          'Other and Miscellaneous',        270);


-- =============================================================================
-- 0003_maintenance_templates.sql — Generic sailing maintenance templates
-- Both title_es and title_en populated from the start (no backfill needed).
-- Consolidated from: 20260425100001 · 20260425220000
-- sort_order 10–250 per system; engine-specific plans use 300+
-- =============================================================================

do $$
declare
  c_hull        uuid;
  c_keel        uuid;
  c_rig         uuid;
  c_standing    uuid;
  c_running     uuid;
  c_sails       uuid;
  c_winches     uuid;
  c_engine      uuid;
  c_fuel        uuid;
  c_electrical  uuid;
  c_electronics uuid;
  c_steering    uuid;
  c_freshwater  uuid;
  c_plumbing    uuid;
  c_bilge       uuid;
  c_safety      uuid;
  c_anchoring   uuid;
  c_dinghy      uuid;
  c_galley      uuid;
  c_interior    uuid;
  c_canvas      uuid;
  c_hatches     uuid;
begin
  select id into c_hull        from public.system_catalog where code = 'hull-deck';
  select id into c_keel        from public.system_catalog where code = 'keel-rudder';
  select id into c_rig         from public.system_catalog where code = 'rig-mast';
  select id into c_standing    from public.system_catalog where code = 'standing-rigging';
  select id into c_running     from public.system_catalog where code = 'running-rigging';
  select id into c_sails       from public.system_catalog where code = 'sails';
  select id into c_winches     from public.system_catalog where code = 'winches-deck-gear';
  select id into c_engine      from public.system_catalog where code = 'engine-propulsion';
  select id into c_fuel        from public.system_catalog where code = 'fuel-system';
  select id into c_electrical  from public.system_catalog where code = 'electrical';
  select id into c_electronics from public.system_catalog where code = 'electronics-nav';
  select id into c_steering    from public.system_catalog where code = 'autopilot-steering';
  select id into c_freshwater  from public.system_catalog where code = 'fresh-water';
  select id into c_plumbing    from public.system_catalog where code = 'plumbing-pumps';
  select id into c_bilge       from public.system_catalog where code = 'bilge-system';
  select id into c_safety      from public.system_catalog where code = 'safety-equipment';
  select id into c_anchoring   from public.system_catalog where code = 'anchoring-mooring';
  select id into c_dinghy      from public.system_catalog where code = 'dinghy-outboard';
  select id into c_galley      from public.system_catalog where code = 'galley';
  select id into c_interior    from public.system_catalog where code = 'interior';
  select id into c_canvas      from public.system_catalog where code = 'canvas-covers';
  select id into c_hatches     from public.system_catalog where code = 'hatches-ports';

insert into public.maintenance_templates
  (system_id, kind, default_priority, sort_order, title, title_es, title_en)
values

-- ── HULL AND DECK ─────────────────────────────────────────────────────────────
(c_hull,'inspection','medium', 10,'Check cockpit drains are clear','Verificar que los imbornales de la bañera están despejados','Check cockpit drains are clear'),
(c_hull,'inspection','medium', 20,'Check hull-deck joint','Verificar la unión casco-cubierta','Check hull-deck joint'),
(c_hull,'inspection','medium', 30,'Check bulkheads for any sign of movement','Verificar mamparos por cualquier signo de movimiento','Check bulkheads for any sign of movement'),
(c_hull,'inspection','high',   40,'Inspect hull for dents or signs of osmosis','Inspeccionar el casco por abolladuras o signos de ósmosis','Inspect hull for dents or signs of osmosis'),
(c_hull,'preventive','high',   50,'Waterblast antifoul','Chorrear el antifouling con agua a presión','Waterblast antifoul'),
(c_hull,'preventive','high',   60,'Re-paint antifoul','Repintar la antifouling','Re-paint antifoul'),
(c_hull,'inspection','high',   70,'Check all windows and ports are watertight','Verificar que todas las ventanas y portillos son estancos','Check all windows and ports are watertight'),
(c_hull,'inspection','medium', 80,'Check grab rails are securely fastened','Verificar que los pasamanos están bien sujetos','Check grab rails are securely fastened'),
(c_hull,'inspection','low',    90,'Check all doors and lockers open and close','Verificar que todas las puertas y armarios abren y cierran','Check all doors and lockers open and close'),

-- ── KEEL AND RUDDER ───────────────────────────────────────────────────────────
(c_keel,'inspection','critical', 10,'Check keel bolts','Verificar los pernos de quilla','Check keel bolts'),
(c_keel,'inspection','high',     20,'Inspect keel-hull joint for cracking or movement','Inspeccionar la unión quilla-casco por grietas o movimiento','Inspect keel-hull joint for cracking or movement'),
(c_keel,'inspection','high',     30,'Examine rudder shaft for play or corrosion','Examinar el eje del timón por holgura o corrosión','Examine rudder shaft for play or corrosion'),
(c_keel,'inspection','high',     40,'Check rudder pintles and gudgeons','Verificar machos y hembras del timón','Check rudder pintles and gudgeons'),
(c_keel,'preventive','high',     50,'Replace keel and rudder anodes','Reemplazar ánodos de quilla y timón','Replace keel and rudder anodes'),

-- ── RIG AND MAST ──────────────────────────────────────────────────────────────
(c_rig,'inspection','high',   10,'Inspect mast at deck level: corrosion, cracks, fasteners','Inspeccionar el mástil a nivel de cubierta: corrosión, grietas y sujeciones','Inspect mast at deck level: corrosion, cracks, fasteners'),
(c_rig,'inspection','high',   20,'Inspect masthead: sheaves, lights, windex, aerial','Inspeccionar la cabeza del mástil: roldanas, luces, windex y antena','Inspect masthead: sheaves, lights, windex, aerial'),
(c_rig,'inspection','medium', 30,'Check spreaders: tips, compression, angle','Verificar crucetas: puntas, compresión y ángulo','Check spreaders: tips, compression, angle'),
(c_rig,'inspection','medium', 40,'Inspect mast track and slides','Inspeccionar la ranura del mástil y los carros','Inspect mast track and slides'),
(c_rig,'preventive','medium', 50,'Lubricate mast sheaves and blocks','Lubricar roldanas del mástil y motones','Lubricate mast sheaves and blocks'),
(c_rig,'preventive','low',    60,'Apply Tef-Gel to all mast fittings','Aplicar Tef-Gel a todos los herrajes del mástil','Apply Tef-Gel to all mast fittings'),
(c_rig,'inspection','medium', 70,'Check boom: vang, kicker, end fittings','Verificar botavara: cunningham, kicker y herrajes de extremo','Check boom: vang, kicker, end fittings'),
(c_rig,'inspection','medium', 80,'Inspect all cotter pins and split rings','Inspeccionar todos los pasadores y anillas de seguridad','Inspect all cotter pins and split rings'),
(c_rig,'preventive','low',    90,'Tape over all cotter pins to prevent snagging','Cubrir todos los pasadores con cinta para evitar enganches','Tape over all cotter pins to prevent snagging'),

-- ── STANDING RIGGING ─────────────────────────────────────────────────────────
(c_standing,'inspection','critical', 10,'Inspect shroud terminals for cracking or fatigue','Inspeccionar terminales de obenques por grietas o fatiga','Inspect shroud terminals for cracking or fatigue'),
(c_standing,'inspection','critical', 20,'Inspect forestay and backstay terminals','Inspeccionar terminales del estay de proa y del backstay','Inspect forestay and backstay terminals'),
(c_standing,'inspection','high',     30,'Check rigging tension and tune','Verificar tensión y afinado del aparejo','Check rigging tension and tune'),
(c_standing,'inspection','high',     40,'Inspect toggles and chainplates','Inspeccionar los toggles y cadenotes','Inspect toggles and chainplates'),
(c_standing,'inspection','high',     50,'Check turnbuckle threads and locking pins','Verificar roscas y pasadores de seguridad de los tensores','Check turnbuckle threads and locking pins'),
(c_standing,'preventive','high',     60,'Replace standing rigging (service life exceeded)','Reemplazar el aparejo fijo (vida útil superada)','Replace standing rigging (service life exceeded)'),
(c_standing,'inspection','medium',   70,'Check stanchion bases and lifeline terminals','Verificar bases de candeleros y terminales de guardamancebos','Check stanchion bases and lifeline terminals'),
(c_standing,'inspection','medium',   80,'Check life lines for wear, kinks or corrosion','Verificar guardamancebos por desgaste, torceduras o corrosión','Check life lines for wear, kinks or corrosion'),

-- ── RUNNING RIGGING ──────────────────────────────────────────────────────────
(c_running,'inspection','medium', 10,'End-for-end halyards and inspect for wear','Invertir drizas y revisar el desgaste','End-for-end halyards and inspect for wear'),
(c_running,'inspection','medium', 20,'Inspect all sheets for chafe and wear','Inspeccionar todas las escotas por rozaduras y desgaste','Inspect all sheets for chafe and wear'),
(c_running,'inspection','medium', 30,'Check reefing lines and pennants','Verificar cabos de rizo y retenidas','Check reefing lines and pennants'),
(c_running,'inspection','medium', 40,'Inspect spinnaker halyards and sheets','Inspeccionar drizas y escotas del spinnaker','Inspect spinnaker halyards and sheets'),
(c_running,'preventive','medium', 50,'Wash all lines in fresh water','Lavar todos los cabos en agua dulce','Wash all lines in fresh water'),
(c_running,'preventive','low',    60,'Replace worn or damaged sheets and halyards','Reemplazar escotas y drizas desgastadas o dañadas','Replace worn or damaged sheets and halyards'),
(c_running,'inspection','medium', 70,'Check all clutches: engage and release correctly','Verificar todos los cams: enganchan y sueltan correctamente','Check all clutches: engage and release correctly'),
(c_running,'preventive','low',    80,'Spray clutches with silicone (not WD40)','Pulverizar los cams con silicona (no WD40)','Spray clutches with silicone (not WD40)'),
(c_running,'preventive','low',    90,'Remove fibre fluff from inside clutches and jammers','Retirar pelusa del interior de los cams y stopers','Remove fibre fluff from inside clutches and jammers'),

-- ── SAILS ─────────────────────────────────────────────────────────────────────
(c_sails,'inspection','medium',  10,'Inspect mainsail: seams, stitching, battens and pockets','Inspeccionar la mayor: costuras, pespuntes, sables y bolsillos','Inspect mainsail: seams, stitching, battens and pockets'),
(c_sails,'inspection','medium',  20,'Inspect headsail: seams, hanks or furling, UV strip','Inspeccionar el foque: costuras, hanks o enrollador, banda UV','Inspect headsail: seams, hanks or furling, UV strip'),
(c_sails,'inspection','medium',  30,'Inspect spinnaker or gennaker: seams and patches','Inspeccionar spinnaker o gennaker: costuras y parches','Inspect spinnaker or gennaker: seams and patches'),
(c_sails,'inspection','medium',  40,'Check head, tack and clew reinforcements on all sails','Verificar refuerzos de puño de driza, amura y escota en todas las velas','Check head, tack and clew reinforcements on all sails'),
(c_sails,'inspection','medium',  50,'Check reef points and cringles','Verificar rizos y ollados','Check reef points and cringles'),
(c_sails,'inspection','medium',  60,'Inspect for chafe and apply preventive patches','Inspeccionar rozaduras y aplicar parches preventivos','Inspect for chafe and apply preventive patches'),
(c_sails,'preventive','medium',  70,'Wash sails in fresh water','Lavar las velas en agua dulce','Wash sails in fresh water'),
(c_sails,'preventive','low',     80,'Replace tell-tales','Reemplazar los telltales','Replace tell-tales'),
(c_sails,'preventive','low',     90,'Cover sails to prevent UV damage','Cubrir las velas para evitar daños por UV','Cover sails to prevent UV damage'),
(c_sails,'preventive','low',    100,'Remove sails for winter storage','Retirar las velas para almacenamiento en invierno','Remove sails for winter storage'),
(c_sails,'preventive','low',    110,'Lubricate sail track','Lubricar la ranura de la vela','Lubricate sail track'),
(c_sails,'inspection','medium', 120,'Check furling drum and foil: rotate freely, no play','Verificar tambor y perfil del enrollador: gira libremente, sin huelgo','Check furling drum and foil: rotate freely, no play'),

-- ── WINCHES AND DECK GEAR ────────────────────────────────────────────────────
(c_winches,'preventive','medium',  10,'Rinse winches in fresh water','Enjuagar los wínches con agua dulce','Rinse winches in fresh water'),
(c_winches,'preventive','medium',  20,'Clean all winch components with degreaser','Limpiar todos los componentes del wínche con desengrasante','Clean all winch components with degreaser'),
(c_winches,'preventive','medium',  30,'Inspect and remove pawls and springs','Inspeccionar y retirar los trinquetes y muelles','Inspect and remove pawls and springs'),
(c_winches,'preventive','medium',  40,'Grease winch gear teeth and roller bearing cages','Engrasar los dientes del engranaje y las jaulas de rodamientos del wínche','Grease winch gear teeth and roller bearing cages'),
(c_winches,'preventive','low',     50,'Use SAE30 oil to lubricate pawls in their seats','Usar aceite SAE30 para lubricar los trinquetes en sus asientos','Use SAE30 oil to lubricate pawls in their seats'),
(c_winches,'preventive','medium',  60,'Reassemble winch and test operation','Remontar el wínche y probar su funcionamiento','Reassemble winch and test operation'),
(c_winches,'inspection','medium',  70,'Ensure ratchet pawls engage squarely','Verificar que los trinquetes del wínche enganchan correctamente','Ensure ratchet pawls engage squarely'),
(c_winches,'inspection','medium',  80,'Check roller bearings inside drum','Verificar los rodamientos del tambor del enrollador','Check roller bearings inside drum'),
(c_winches,'inspection','medium',  90,'Test winch to ensure correct operation','Probar el wínche para verificar su correcto funcionamiento','Test winch to ensure correct operation'),
(c_winches,'inspection','medium', 100,'Check cleats: back plates and nuts secure','Verificar cornamusas: contrachapas y tuercas apretadas','Check cleats: back plates and nuts secure'),
(c_winches,'inspection','medium', 110,'Check all blocks and shackles are tight','Verificar que todos los motones y grilletes están apretados','Check all blocks and shackles are tight'),
(c_winches,'inspection','medium', 120,'Inspect shackles for cracks, corrosion or elongation','Inspeccionar grilletes por grietas, corrosión o elongación','Inspect shackles for cracks, corrosion or elongation'),
(c_winches,'inspection','medium', 130,'Inspect sheaves are spinning freely','Verificar que las roldanas giran libremente','Inspect sheaves are spinning freely'),
(c_winches,'preventive','low',    140,'Use only dry lubricants on deck hardware','Usar solo lubricantes secos en los herrajes de cubierta','Use only dry lubricants on deck hardware'),
(c_winches,'preventive','low',    150,'Polish stainless deck fittings','Pulir los herrajes de acero inoxidable de cubierta','Polish stainless deck fittings'),
(c_winches,'inspection','low',    160,'Check winch handles','Verificar las manivelas de los wínches','Check winch handles'),

-- ── ENGINE AND PROPULSION ────────────────────────────────────────────────────
(c_engine,'preventive','high',    10,'Change oil and oil filter','Cambiar aceite y filtro de aceite','Change oil and oil filter'),
(c_engine,'preventive','high',    20,'Replace impeller','Reemplazar el impeller','Replace impeller'),
(c_engine,'preventive','medium',  30,'Clean water strainer','Limpiar el filtro de agua','Clean water strainer'),
(c_engine,'preventive','medium',  40,'Clean air filter','Limpiar el filtro de aire','Clean air filter'),
(c_engine,'preventive','medium',  50,'Drain and refill coolant','Vaciar y rellenar el refrigerante','Drain and refill coolant'),
(c_engine,'preventive','medium',  60,'Change gearbox oil','Cambiar aceite de la caja de cambios','Change gearbox oil'),
(c_engine,'preventive','medium',  70,'Replace raw water hoses','Reemplazar las mangueras de agua salada','Replace raw water hoses'),
(c_engine,'preventive','medium',  80,'Replace pencil anode (exhaust cooling)','Reemplazar el ánodo de lápiz (refrigeración del escape)','Replace pencil anode (exhaust cooling)'),
(c_engine,'inspection','high',    90,'Check coolant/antifreeze levels','Comprobar nivel de refrigerante/anticongelante','Check coolant/antifreeze levels'),
(c_engine,'inspection','high',   100,'Check engine oil levels','Comprobar nivel de aceite del motor','Check engine oil levels'),
(c_engine,'inspection','high',   110,'Check water hoses for leaks','Verificar mangueras de agua por fugas','Check water hoses for leaks'),
(c_engine,'inspection','high',   120,'Check for leaks in fuel system','Comprobar fugas en el sistema de combustible','Check for leaks in fuel system'),
(c_engine,'inspection','medium', 130,'Check drive belt alignment, tension and bearings','Verificar alineación, tensión y rodamientos de la correa de transmisión','Check drive belt alignment, tension and bearings'),
(c_engine,'inspection','medium', 140,'Check coupling connecting gearbox to propeller shaft','Verificar acoplamiento entre caja de cambios y eje de la hélice','Check coupling connecting gearbox to propeller shaft'),
(c_engine,'inspection','medium', 150,'Check engine mounts','Verificar los soportes del motor','Check engine mounts'),
(c_engine,'inspection','medium', 160,'Check hose clips are tight','Verificar que las abrazaderas están apretadas','Check hose clips are tight'),
(c_engine,'inspection','medium', 170,'Check gear lever and throttle cable','Verificar palanca de cambios y cable del acelerador','Check gear lever and throttle cable'),
(c_engine,'inspection','medium', 180,'Check exhaust system','Revisar el sistema de escape','Check exhaust system'),
(c_engine,'inspection','medium', 190,'Inspect injection pump and injectors','Inspeccionar la bomba de inyección y los inyectores','Inspect injection pump and injectors'),
(c_engine,'inspection','medium', 200,'Check engine for corrosion','Revisar el motor en busca de corrosión','Check engine for corrosion'),
(c_engine,'inspection','medium', 210,'Check transmission oil level','Comprobar nivel de aceite de la transmisión','Check transmission oil level'),
(c_engine,'inspection','medium', 220,'Ensure all bolts are tight','Verificar que todos los pernos están apretados','Ensure all bolts are tight'),
(c_engine,'preventive','medium', 230,'Grease exposed parts of gear shift mechanism','Engrasar las partes expuestas del mecanismo de cambio de marchas','Grease exposed parts of gear shift mechanism'),
(c_engine,'preventive','medium', 240,'Grease control cable joints and end fittings','Engrasar juntas y extremos de los cables de control','Grease control cable joints and end fittings'),
(c_engine,'preventive','low',    250,'Clean engine bay','Limpiar el compartimento del motor','Clean engine bay'),

-- ── FUEL SYSTEM ──────────────────────────────────────────────────────────────
(c_fuel,'preventive','medium',  10,'Replace primary fuel filter','Reemplazar el filtro de combustible primario','Replace primary fuel filter'),
(c_fuel,'preventive','medium',  20,'Replace secondary fuel filter','Reemplazar el filtro de combustible secundario','Replace secondary fuel filter'),
(c_fuel,'preventive','medium',  30,'Drain water off fuel filter/separator','Drenar el agua del filtro/separador de combustible','Drain water off fuel filter/separator'),
(c_fuel,'preventive','medium',  40,'Add fuel treatment, check for contamination','Añadir aditivo al combustible, verificar contaminación','Add fuel treatment, check for contamination'),
(c_fuel,'inspection','high',    50,'Check fuel tank for water or diesel bug','Verificar el depósito de combustible por agua o microorganismos','Check fuel tank for water or diesel bug'),
(c_fuel,'inspection','high',    60,'Check fuel lines for leaks or chafe','Verificar líneas de combustible por fugas o rozaduras','Check fuel lines for leaks or chafe'),
(c_fuel,'inspection','high',    70,'Check fuel tank fittings and vent','Verificar herrajes y venteo del depósito de combustible','Check fuel tank fittings and vent'),
(c_fuel,'preventive','medium',  80,'Keep tanks full to avoid condensation and diesel bug','Mantener los depósitos llenos para evitar condensación y microorganismos','Keep tanks full to avoid condensation and diesel bug'),
(c_fuel,'preventive','medium',  90,'Bleed diesel system','Purgar el sistema de gasoil','Bleed diesel system'),
(c_fuel,'preventive','medium', 100,'Clean fuel tank','Limpiar el depósito de combustible','Clean fuel tank'),

-- ── ELECTRICAL AND BATTERIES ─────────────────────────────────────────────────
(c_electrical,'inspection','medium',  10,'Check all electrical connections are clean and secure','Verificar que las conexiones eléctricas están limpias y seguras','Check all electrical connections are clean and secure'),
(c_electrical,'inspection','medium',  20,'Check navigation lights (port, starboard, stern, masthead)','Verificar luces de navegación (babor, estribor, popa, tope)','Check navigation lights (port, starboard, stern, masthead)'),
(c_electrical,'inspection','medium',  30,'Check shore power connections and inlet','Verificar conexiones de corriente de tierra y toma','Check shore power connections and inlet'),
(c_electrical,'inspection','medium',  40,'Ensure batteries are securely fastened','Verificar que las baterías están bien sujetas','Ensure batteries are securely fastened'),
(c_electrical,'inspection','medium',  50,'Ensure battery terminals are tight','Verificar que los terminales de las baterías están apretados','Ensure battery terminals are tight'),
(c_electrical,'preventive','medium',  60,'Clean battery tops and terminals','Limpiar la parte superior y los terminales de las baterías','Clean battery tops and terminals'),
(c_electrical,'preventive','medium',  70,'Lubricate terminals with petroleum jelly','Lubricar terminales con vaselina','Lubricate terminals with petroleum jelly'),
(c_electrical,'inspection','medium',  80,'Check battery voltage and charge state','Comprobar voltaje y estado de carga de las baterías','Check battery voltage and charge state'),
(c_electrical,'corrective','high',    90,'Replace service batteries','Reemplazar las baterías de servicio','Replace service batteries'),
(c_electrical,'inspection','medium', 100,'Check alternator output','Comprobar la salida del alternador','Check alternator output'),
(c_electrical,'preventive','low',    110,'Use cable ties to tidy loose wiring runs','Usar bridas para ordenar los cables sueltos','Use cable ties to tidy loose wiring runs'),

-- ── ELECTRONICS AND NAVIGATION ───────────────────────────────────────────────
(c_electronics,'inspection','medium',  10,'Check chartplotter and GPS work correctly','Verificar que el plóter y el GPS funcionan correctamente','Check chartplotter and GPS work correctly'),
(c_electronics,'inspection','medium',  20,'Do VHF radio check','Realizar prueba de radio VHF','Do VHF radio check'),
(c_electronics,'inspection','medium',  30,'Check AIS transponder is transmitting and receiving','Verificar que el transpondedor AIS transmite y recibe','Check AIS transponder is transmitting and receiving'),
(c_electronics,'inspection','medium',  40,'Check depth sounder and wind instruments','Verificar sonda de profundidad e instrumentos de viento','Check depth sounder and wind instruments'),
(c_electronics,'inspection','medium',  50,'Check radar: operation and mount','Verificar el radar: funcionamiento y soporte','Check radar: operation and mount'),
(c_electronics,'inspection','medium',  60,'Swing compass and update deviation card','Corregir la brújula y actualizar la tabla de desvíos','Swing compass and update deviation card'),
(c_electronics,'inspection','low',     70,'Check compass light','Verificar luz de la brújula','Check compass light'),
(c_electronics,'preventive','medium',  80,'Update charts and plotter software','Actualizar las cartas y el software del plóter','Update charts and plotter software'),
(c_electronics,'inspection','medium',  90,'Ensure appropriate charts and guides are on board','Verificar que hay cartas y guías adecuadas a bordo','Ensure appropriate charts and guides are on board'),
(c_electronics,'inspection','low',    100,'Check spare batteries for handheld devices','Verificar baterías de repuesto para dispositivos portátiles','Check spare batteries for handheld devices'),

-- ── AUTOPILOT AND STEERING ───────────────────────────────────────────────────
(c_steering,'inspection','high',    10,'Check steering cables, sheaves and quadrant','Verificar cables, roldanas y sector de gobierno','Check steering cables, sheaves and quadrant'),
(c_steering,'inspection','high',    20,'Examine rudder shaft for play','Examinar el eje del timón por holgura','Examine rudder shaft for play'),
(c_steering,'inspection','medium',  30,'Sheave supports firmly mounted','Verificar que los soportes de roldanas están bien montados','Sheave supports firmly mounted'),
(c_steering,'inspection','medium',  40,'Adjustment nuts and lock nuts tight','Tuercas de ajuste y contratuercas apretadas','Adjustment nuts and lock nuts tight'),
(c_steering,'preventive','medium',  50,'Lubricate steering cables','Lubricar los cables de gobierno','Lubricate steering cables'),
(c_steering,'preventive','medium',  60,'Clean and grease steering quadrant','Limpiar y engrasar el sector de gobierno','Clean and grease steering quadrant'),
(c_steering,'inspection','high',    70,'Test emergency tiller and stowage','Probar el pinzote de emergencia y su estiba','Test emergency tiller and stowage'),
(c_steering,'inspection','medium',  80,'Ensure steering area is free from gear and tangles','Verificar que la zona de gobierno está libre de cabos y enredos','Ensure steering area is free from gear and tangles'),
(c_steering,'inspection','medium',  90,'Calibrate autopilot compass','Calibrar la brújula del piloto automático','Calibrate autopilot compass'),
(c_steering,'preventive','medium', 100,'Check autopilot drive belt and ram','Verificar correa de transmisión y pistón del piloto automático','Check autopilot drive belt and ram'),

-- ── FRESH WATER SYSTEM ───────────────────────────────────────────────────────
(c_freshwater,'preventive','medium', 10,'Clean and disinfect fresh water tank','Limpiar y desinfectar el depósito de agua dulce','Clean and disinfect fresh water tank'),
(c_freshwater,'inspection','medium', 20,'Check and clean water pump','Revisar y limpiar la bomba de agua','Check and clean water pump'),
(c_freshwater,'inspection','medium', 30,'Check all taps working correctly','Verificar que todos los grifos funcionan correctamente','Check all taps working correctly'),
(c_freshwater,'inspection','medium', 40,'Check fresh water hoses for kinks or leaks','Verificar mangueras de agua dulce por torceduras o fugas','Check fresh water hoses for kinks or leaks'),
(c_freshwater,'inspection','medium', 50,'Check water filter cartridge','Verificar el cartucho del filtro de agua','Check water filter cartridge'),
(c_freshwater,'preventive','medium', 60,'Replace water filter cartridge','Reemplazar el cartucho del filtro de agua','Replace water filter cartridge'),

-- ── PLUMBING AND PUMPS ───────────────────────────────────────────────────────
(c_plumbing,'inspection','high',   10,'Check all seacocks: operate and lubricate','Verificar todas las válvulas de fondo: operar y lubricar','Check all seacocks: operate and lubricate'),
(c_plumbing,'inspection','high',   20,'Ensure all through-hulls have wooden plugs nearby','Verificar que todos los pasamanos tienen tapones de madera cerca','Ensure all through-hulls have wooden plugs nearby'),
(c_plumbing,'inspection','high',   30,'Inspect and squeeze all hoses for leaks and kinks','Inspeccionar y apretar todas las mangueras por fugas y torceduras','Inspect and squeeze all hoses for leaks and kinks'),
(c_plumbing,'inspection','high',   40,'Ensure all hose clamps are tight','Verificar que todas las abrazaderas están apretadas','Ensure all hose clamps are tight'),
(c_plumbing,'inspection','medium', 50,'Check toilet is bolted down firmly','Verificar que el WC está bien atornillado','Check toilet is bolted down firmly'),
(c_plumbing,'inspection','medium', 60,'Check toilet operation: intake, outlet, holding tank','Verificar funcionamiento del WC: admisión, salida y depósito de aguas negras','Check toilet operation: intake, outlet, holding tank'),
(c_plumbing,'inspection','medium', 70,'Check shower sump and drain','Verificar el sumidero y desagüe de la ducha','Check shower sump and drain'),
(c_plumbing,'preventive','medium', 80,'Clean water tanks','Limpiar los depósitos de agua','Clean water tanks'),

-- ── BILGE SYSTEM ─────────────────────────────────────────────────────────────
(c_bilge,'inspection','high',   10,'Check bilge pumps (manual and electric)','Verificar bombas de achique (manual y eléctrica)','Check bilge pumps (manual and electric)'),
(c_bilge,'inspection','high',   20,'Test bilge pump float switches and alarms','Probar los interruptores de nivel y alarmas de las bombas de achique','Test bilge pump float switches and alarms'),
(c_bilge,'inspection','high',   30,'Check emergency pump','Verificar la bomba de emergencia','Check emergency pump'),
(c_bilge,'preventive','medium', 40,'Clean bilge','Limpiar la sentina','Clean bilge'),
(c_bilge,'inspection','medium', 50,'Check bilge water level and origin','Comprobar nivel y origen del agua en la sentina','Check bilge water level and origin'),

-- ── SAFETY EQUIPMENT ─────────────────────────────────────────────────────────
(c_safety,'inspection','critical', 10,'Check flares and replace as necessary','Verificar bengalas y reemplazar según sea necesario','Check flares and replace as necessary'),
(c_safety,'preventive','critical', 20,'Life raft service','Revisión de la balsa salvavidas','Life raft service'),
(c_safety,'preventive','critical', 30,'Service EPIRB','Revisión de la EPIRB','Service EPIRB'),
(c_safety,'inspection','high',     40,'Inflate and inspect life jackets and cylinders','Inflar e inspeccionar chalecos salvavidas y cartuchos','Inflate and inspect life jackets and cylinders'),
(c_safety,'inspection','high',     50,'Check harnesses, tethers and jack lines','Verificar arneses, tiras de seguridad y líneas de vida','Check harnesses, tethers and jack lines'),
(c_safety,'inspection','high',     60,'Check fire extinguishers','Verificar los extintores','Check fire extinguishers'),
(c_safety,'inspection','high',     70,'Check life rings (dan buoy, horseshoe)','Verificar aros salvavidas (boya dan, herradura)','Check life rings (dan buoy, horseshoe)'),
(c_safety,'inspection','high',     80,'Check wire cutters (rigging knife)','Verificar el cortacables (navaja de aparejo)','Check wire cutters (rigging knife)'),
(c_safety,'inspection','high',     90,'Check first aid kit','Revisar el botiquín de primeros auxilios','Check first aid kit'),
(c_safety,'inspection','high',    100,'Check grab bag contents','Verificar el contenido de la bolsa de emergencia','Check grab bag contents'),
(c_safety,'preventive','medium',  110,'Replace batteries in grab bag devices','Reemplazar baterías en los dispositivos de la bolsa de emergencia','Replace batteries in grab bag devices'),
(c_safety,'inspection','medium',  120,'Check fog horn','Verificar la bocina de niebla','Check fog horn'),
(c_safety,'inspection','high',    130,'Check pad eyes for jacklines and harnesses','Verificar cáncamos para líneas de vida y arneses','Check pad eyes for jacklines and harnesses'),

-- ── ANCHORING AND MOORING ────────────────────────────────────────────────────
(c_anchoring,'inspection','high',   10,'Clean and inspect anchor chain','Limpiar e inspeccionar la cadena del ancla','Clean and inspect anchor chain'),
(c_anchoring,'inspection','high',   20,'Check bitter end is tied securely','Verificar que el chicote del ancla está asegurado','Check bitter end is tied securely'),
(c_anchoring,'inspection','high',   30,'Check anchor shackles and mousing wire','Verificar grilletes del ancla y alambre de seguridad','Check anchor shackles and mousing wire'),
(c_anchoring,'inspection','medium', 40,'Inspect spare anchor and rode','Inspeccionar el ancla de respeto y el fondeo','Inspect spare anchor and rode'),
(c_anchoring,'inspection','medium', 50,'Check mooring lines for chafe and wear','Verificar cabos de amarre por rozaduras y desgaste','Check mooring lines for chafe and wear'),
(c_anchoring,'inspection','medium', 60,'Check chafing gear','Revisar protectores antirozadura','Check chafing gear'),
(c_anchoring,'preventive','medium', 70,'Lubricate bow roller and windlass','Lubricar el rodillo de proa y el molinete','Lubricate bow roller and windlass'),
(c_anchoring,'inspection','medium', 80,'Check line and buoy for emergency anchoring','Verificar cabo y boya para fondeo de emergencia','Check line and buoy for emergency anchoring'),
(c_anchoring,'preventive','low',    90,'Clean and inspect fenders','Limpiar e inspeccionar los defensas','Clean and inspect fenders'),

-- ── DINGHY AND OUTBOARD ──────────────────────────────────────────────────────
(c_dinghy,'preventive','high',    10,'Flush outboard with fresh water after each use','Limpiar el fuera borda con agua dulce después de cada uso','Flush outboard with fresh water after each use'),
(c_dinghy,'preventive','medium',  20,'Change outboard oil','Cambiar aceite del fuera borda','Change outboard oil'),
(c_dinghy,'preventive','medium',  30,'Replace outboard spark plug','Reemplazar la bujía del fuera borda','Replace outboard spark plug'),
(c_dinghy,'preventive','medium',  40,'Replace outboard fuel filter','Reemplazar el filtro de combustible del fuera borda','Replace outboard fuel filter'),
(c_dinghy,'inspection','medium',  50,'Check outboard fuel lines','Verificar las líneas de combustible del fuera borda','Check outboard fuel lines'),
(c_dinghy,'inspection','medium',  60,'Check outboard fuel tank air vent','Verificar el venteo del depósito de combustible del fuera borda','Check outboard fuel tank air vent'),
(c_dinghy,'inspection','medium',  70,'Check outboard for external corrosion','Revisar el fuera borda por corrosión externa','Check outboard for external corrosion'),
(c_dinghy,'preventive','medium',  80,'Spray outboard electrical connections with protector','Pulverizar las conexiones eléctricas del fuera borda con protector','Spray outboard electrical connections with protector'),
(c_dinghy,'inspection','medium',  90,'Inspect inflatable dinghy: seams, valves, pressure','Inspeccionar el neumático: costuras, válvulas y presión','Inspect inflatable dinghy: seams, valves, pressure'),
(c_dinghy,'preventive','medium', 100,'Clean and UV-protect inflatable tubes','Limpiar y proteger con UV los tubos inflables','Clean and UV-protect inflatable tubes'),
(c_dinghy,'corrective','medium', 110,'Replace outboard shear pin','Reemplazar el pasador de cizallamiento del fuera borda','Replace outboard shear pin'),

-- ── GALLEY AND GAS ───────────────────────────────────────────────────────────
(c_galley,'inspection','critical', 10,'Check gas lines, hoses and regulator','Verificar líneas de gas, mangueras y regulador','Check gas lines, hoses and regulator'),
(c_galley,'inspection','high',     20,'Test gas/CO detector alarm','Probar la alarma del detector de gas/CO','Test gas/CO detector alarm'),
(c_galley,'inspection','medium',   30,'Check gimbal on stove works','Verificar que el cardán de la cocina funciona','Check gimbal on stove works'),
(c_galley,'preventive','medium',   40,'Clean stove burners and ignition','Limpiar quemadores e ignición de la cocina','Clean stove burners and ignition'),
(c_galley,'preventive','medium',   50,'Fill gas bottles','Rellenar las bombonas de gas','Fill gas bottles'),
(c_galley,'preventive','medium',   60,'Check and clean fridge / icebox','Revisar y limpiar el frigorífico / nevera','Check and clean fridge / icebox'),
(c_galley,'preventive','low',      70,'Clean all galley cupboards and lockers','Limpiar todos los armarios y compartimentos de la cocina','Clean all galley cupboards and lockers'),

-- ── HATCHES AND PORTLIGHTS ───────────────────────────────────────────────────
(c_hatches,'inspection','medium', 10,'Inspect hatch seals and gaskets','Inspeccionar juntas y sellos de escotillas','Inspect hatch seals and gaskets'),
(c_hatches,'inspection','medium', 20,'Check opening portlights for leaks','Verificar portillos abatibles por fugas','Check opening portlights for leaks'),
(c_hatches,'inspection','medium', 30,'Check hatch hinges, arms and locking mechanisms','Verificar bisagras, brazos y mecanismos de cierre de escotillas','Check hatch hinges, arms and locking mechanisms'),
(c_hatches,'preventive','medium', 40,'Replace hatch and portlight seals if hardened or cracked','Reemplazar juntas de escotillas y portillos si están endurecidas o agrietadas','Replace hatch and portlight seals if hardened or cracked'),
(c_hatches,'inspection','medium', 50,'Check companionway washboards and closure','Verificar tablillas y cierre de la escotilla principal','Check companionway washboards and closure'),

-- ── CANVAS AND COVERS ────────────────────────────────────────────────────────
(c_canvas,'inspection','medium', 10,'Inspect bimini and dodger: seams, zips and fittings','Inspeccionar bimini y sprayhood: costuras, cremalleras y herrajes','Inspect bimini and dodger: seams, zips and fittings'),
(c_canvas,'inspection','medium', 20,'Inspect sail cover: seams and UV exposure','Inspeccionar la funda de vela: costuras y exposición UV','Inspect sail cover: seams and UV exposure'),
(c_canvas,'inspection','low',    30,'Inspect cockpit cushion covers and bunk covers','Inspeccionar fundas de cojines de bañera y literas','Inspect cockpit cushion covers and bunk covers'),
(c_canvas,'preventive','low',    40,'Clean all canvas with mild soap and water','Limpiar todas las lonas con jabón suave y agua','Clean all canvas with mild soap and water'),
(c_canvas,'preventive','low',    50,'Apply UV protector to canvas and vinyl','Aplicar protector UV a lonas y vinilo','Apply UV protector to canvas and vinyl'),

-- ── INTERIOR AND UPHOLSTERY ──────────────────────────────────────────────────
(c_interior,'preventive','low',    10,'Clean and inspect all interior cushions and upholstery','Limpiar e inspeccionar todos los cojines y tapicería interior','Clean and inspect all interior cushions and upholstery'),
(c_interior,'inspection','medium', 20,'Check all interior hatches and locker catches','Verificar escotillas interiores y cierres de armarios','Check all interior hatches and locker catches'),
(c_interior,'inspection','medium', 30,'Ensure heavy items are well secured','Verificar que los objetos pesados están bien asegurados','Ensure heavy items are well secured'),
(c_interior,'preventive','low',    40,'Inspect and treat all teak and wood surfaces','Inspeccionar y tratar todas las superficies de teca y madera','Inspect and treat all teak and wood surfaces'),
(c_interior,'preventive','low',    50,'Check for mould or mildew and treat if found','Revisar si hay moho o humedad y tratar si se encuentra','Check for mould or mildew and treat if found');

end $$;


-- =============================================================================
-- 0007_rebuild_engine_templates_and_plans.sql
-- Nuclear fix: delete all engine-specific templates (sort_order >= 300),
-- delete all schedule plans and items, then reinsert everything cleanly.
-- This guarantees the title_es values match exactly what the plan items need.
-- =============================================================================

-- 1. Clear plans and items first (FK cascade handles items)
delete from public.maintenance_schedule_plans;

-- 2. Clear engine-specific templates (sort_order >= 300, boat_id is null)
delete from public.maintenance_templates where sort_order >= 300 and boat_id is null;

-- 3. Reinsert Yanmar JH4 + Volvo D2 templates
do $$
declare
  c_engine uuid;
  c_fuel   uuid;
begin
  select id into c_engine from public.system_catalog where code = 'engine-propulsion';
  select id into c_fuel   from public.system_catalog where code = 'fuel-system';

insert into public.maintenance_templates
  (system_id, kind, default_priority, sort_order, title, title_es, title_en, description_es, description_en)
values

-- ── YANMAR JH4 ───────────────────────────────────────────────────────────────
(c_engine,'preventive','high',300,
 'Cambio aceite inicial (Yanmar JH4)',
 'Cambio de aceite y filtro inicial — primeras 50 h (Yanmar JH4)',
 'Initial oil and filter change — first 50 h (Yanmar JH4)',
 'Cambiar aceite de motor y filtro tras las primeras 50 horas. También el aceite de la reductora.',
 'Change engine oil and filter after the first 50 hours. Also change gearbox oil.'),

(c_fuel,'preventive','medium',305,
 'Drenaje filtro combustible/agua (Yanmar JH4)',
 'Drenaje filtro combustible y separador de agua — cada 50 h (Yanmar JH4)',
 'Drain fuel filter and water separator — every 50 h (Yanmar JH4)',
 'Drenar el agua del filtro de combustible y separador. Intervalo: cada 50 h.',
 'Drain water from the fuel filter and water separator. Interval: every 50 h.'),

(c_engine,'preventive','high',310,
 'Cambio de aceite y filtro (Yanmar JH4)',
 'Cambio de aceite de motor y filtro — 250 h o 1 año (Yanmar JH4)',
 'Engine oil and filter change — 250 h or 1 year (Yanmar JH4)',
 'Cambiar aceite SAE 15W-40 y filtro. 3JH4E: 4,3 L; 4JH4AE: 5,5 L. Cada 250 h o 1 año.',
 'Change SAE 15W-40 oil and filter. 3JH4E: 4.3 L; 4JH4AE: 5.5 L. Every 250 h or 1 year.'),

(c_fuel,'preventive','high',315,
 'Cambio filtro combustible (Yanmar JH4)',
 'Sustitución del elemento del filtro de combustible — 250 h o 1 año (Yanmar JH4)',
 'Fuel filter element replacement — 250 h or 1 year (Yanmar JH4)',
 'Sustituir el cartucho del filtro de combustible. Purgar tras el cambio. Cada 250 h o 1 año.',
 'Replace the fuel filter cartridge. Bleed the system after replacement. Every 250 h or 1 year.'),

(c_engine,'preventive','medium',320,
 'Cambio aceite reductora (Yanmar JH4)',
 'Cambio de aceite de la reductora — 250 h o 1 año (Yanmar JH4)',
 'Gearbox oil change — 250 h or 1 year (Yanmar JH4)',
 'Cambiar aceite ATF Dexron II de la reductora Yanmar/KM. Aprox. 0,6–0,9 L. Cada 250 h o 1 año.',
 'Change ATF Dexron II gearbox oil. Approx. 0.6–0.9 L. Every 250 h or 1 year.'),

(c_engine,'preventive','high',325,
 'Impeller bomba agua de mar (Yanmar JH4)',
 'Inspección/sustitución impeller bomba agua de mar — 250 h o 1 año (Yanmar JH4)',
 'Seawater pump impeller check/replacement — 250 h or 1 year (Yanmar JH4)',
 'Inspeccionar impeller; sustituir si hay grietas. Sustitución obligatoria cada 1000 h.',
 'Inspect impeller; replace if cracked. Mandatory replacement every 1000 h.'),

(c_engine,'preventive','medium',330,
 'Cambio de refrigerante (Yanmar JH4)',
 'Cambio de refrigerante del motor — 250 h o 1 año (Yanmar JH4)',
 'Engine coolant replacement — 250 h or 1 year (Yanmar JH4)',
 'Vaciar y rellenar el circuito de agua dulce con anticongelante al 30-50%. Con Long Life: cada 2 años.',
 'Drain and refill with antifreeze at 30-50%. With Long Life coolant: every 2 years.'),

(c_engine,'preventive','low',335,
 'Limpieza filtro de aire (Yanmar JH4)',
 'Limpieza del filtro de aire (silenciador de admisión) — 250 h o 1 año (Yanmar JH4)',
 'Air cleaner (intake silencer) cleaning — 250 h or 1 year (Yanmar JH4)',
 'Desmontar el silenciador de admisión, limpiar con detergente neutro y secar. Cada 250 h o 1 año.',
 'Disassemble intake silencer, clean with neutral detergent and dry. Every 250 h or 1 year.'),

(c_engine,'preventive','medium',340,
 'Limpieza codo escape-agua (Yanmar JH4)',
 'Limpieza del codo mezclador de escape y agua — 250 h o 1 año (Yanmar JH4)',
 'Exhaust/water mixing elbow cleaning — 250 h or 1 year (Yanmar JH4)',
 'Limpiar conductos del codo mezclador eliminando incrustaciones. Sustitución cada 500 h o 2 años.',
 'Clean elbow passages removing scale. Replacement every 500 h or 2 years.'),

(c_engine,'preventive','medium',345,
 'Ajuste tensión correa alternador (Yanmar JH4)',
 'Ajuste de tensión de la correa del alternador — 250 h o 1 año (Yanmar JH4)',
 'Alternator V-belt tension adjustment — 250 h or 1 year (Yanmar JH4)',
 'Comprobar tensión de la correa: deflexión 10 mm. Sustituir cada 1000 h o 4 años.',
 'Check belt tension: 10 mm deflection. Replace every 1000 h or 4 years.'),

(c_engine,'preventive','medium',350,
 'Sustitución codo escape-agua (Yanmar JH4)',
 'Sustitución del codo mezclador de escape y agua — 500 h o 2 años (Yanmar JH4)',
 'Exhaust/water mixing elbow replacement — 500 h or 2 years (Yanmar JH4)',
 'Sustituir el codo mezclador aunque no haya daños visibles. Cada 500 h o 2 años.',
 'Replace the mixing elbow even if no visible damage. Every 500 h or 2 years.'),

(c_engine,'preventive','medium',355,
 'Sustitución mangueras de goma (Yanmar JH4)',
 'Sustitución de mangueras de goma — 500 h o 2 años (Yanmar JH4)',
 'Rubber hose replacement — 500 h or 2 years (Yanmar JH4)',
 'Sustituir todas las mangueras de goma del motor. Cada 500 h o 2 años.',
 'Replace all engine rubber hoses. Every 500 h or 2 years.'),

(c_engine,'inspection','medium',360,
 'Verificación puesta a punto inyección (Yanmar JH4)',
 'Verificación del punto de inyección de combustible — 1000 h o 4 años (Yanmar JH4)',
 'Fuel injection timing check — 1000 h or 4 years (Yanmar JH4)',
 'Verificar punto de inyección. Requiere taller Yanmar autorizado. Cada 1000 h o 4 años.',
 'Check injection timing. Requires authorized Yanmar dealer. Every 1000 h or 4 years.'),

(c_engine,'inspection','medium',365,
 'Revisión patrón atomización inyectores (Yanmar JH4)',
 'Revisión del patrón de atomización de inyectores — 1000 h o 4 años (Yanmar JH4)',
 'Fuel injector spray pattern check — 1000 h or 4 years (Yanmar JH4)',
 'Verificar patrón de pulverización. Requiere taller Yanmar autorizado. Cada 1000 h o 4 años.',
 'Check spray pattern. Requires authorized Yanmar dealer. Every 1000 h or 4 years.'),

(c_engine,'preventive','high',370,
 'Limpieza circuitos agua salada (Yanmar JH4)',
 'Limpieza de los circuitos de agua salada del motor — 1000 h o 4 años (Yanmar JH4)',
 'Engine seawater passages cleaning — 1000 h or 4 years (Yanmar JH4)',
 'Limpiar circuitos de agua salada eliminando incrustaciones. Requiere taller Yanmar. Cada 1000 h o 4 años.',
 'Clean seawater passages removing scale. Requires authorized Yanmar dealer. Every 1000 h or 4 years.'),

(c_engine,'preventive','high',375,
 'Ajuste de válvulas (Yanmar JH4)',
 'Ajuste de holgura de válvulas de admisión y escape — 1000 h o 4 años (Yanmar JH4)',
 'Intake/exhaust valve clearance adjustment — 1000 h or 4 years (Yanmar JH4)',
 'Ajustar holgura de válvulas con motor frío. Requiere taller Yanmar. Cada 1000 h o 4 años.',
 'Adjust valve clearances with cold engine. Requires authorized Yanmar dealer. Every 1000 h or 4 years.'),

-- ── VOLVO PENTA D2 ────────────────────────────────────────────────────────────
(c_engine,'inspection','low',400,
 'Revisión correa transmisión (Volvo D2)',
 'Revisión de la correa de transmisión — cada 14 días (Volvo Penta D2)',
 'Drive belt check — every 14 days (Volvo Penta D2)',
 'Comprobar tensión y estado de la correa del alternador y bomba. Deflexión: 10 mm. Manual D2 p.30.',
 'Check belt tension and condition. Correct deflection: 10 mm. Volvo D2 manual p.30.'),

(c_engine,'preventive','medium',405,
 'Limpieza filtro agua de mar (Volvo D2)',
 'Limpieza del filtro de agua de mar — cada 14 días (Volvo Penta D2)',
 'Seawater filter cleaning — every 14 days (Volvo Penta D2)',
 'Limpiar el strainer de agua de mar: retirar, enjuagar y reinstalar. Manual D2 p.37.',
 'Clean the seawater strainer: remove, rinse and reinstall. Volvo D2 manual p.37.'),

(c_fuel,'preventive','low',408,
 'Drenaje prefiltro combustible (Volvo D2)',
 'Drenaje de agua del prefiltro de combustible — cada 14 días (Volvo Penta D2)',
 'Fuel pre-filter water drain — every 14 days (Volvo Penta D2)',
 'Drenar el agua del bowl del prefiltro de combustible. Manual D2 p.41.',
 'Drain accumulated water from the fuel pre-filter bowl. Volvo D2 manual p.41.'),

(c_engine,'preventive','medium',415,
 'Cambio aceite reductora (Volvo D2)',
 'Cambio de aceite de la reductora/S-drive — 200 h o 1 año (Volvo Penta D2)',
 'Reverse gear / S-drive oil change — 200 h or 1 year (Volvo Penta D2)',
 'Cambiar aceite reductora MS25/HS25 o S-drive. Manual D2 p.49: cada 200 h o 1 año.',
 'Change reverse gear MS25/HS25 or S-drive oil. Volvo D2 manual p.49: every 200 h or 1 year.'),

(c_engine,'preventive','high',420,
 'Cambio de aceite y filtro motor (Volvo D2)',
 'Cambio de aceite de motor y filtro — 500 h o 1 año (Volvo Penta D2)',
 'Engine oil and filter change — 500 h or 1 year (Volvo Penta D2)',
 'Cambiar aceite y filtro. D2-55: 5 L; D2-75: 8,5 L. Usar VDS-4 15W-40. Manual D2 p.32.',
 'Change oil and filter. D2-55: 5 L; D2-75: 8.5 L. Use VDS-4 15W-40. Volvo D2 manual p.32.'),

(c_fuel,'preventive','high',425,
 'Cambio filtro combustible (Volvo D2)',
 'Sustitución del filtro de combustible — 500 h o 1 año (Volvo Penta D2)',
 'Fuel filter replacement — 500 h or 1 year (Volvo Penta D2)',
 'Sustituir filtro de combustible y prefiltro. Purgar tras el cambio. Manual D2 p.41.',
 'Replace fuel filter and pre-filter. Bleed the system after replacement. Volvo D2 manual p.41.'),

(c_engine,'preventive','high',430,
 'Revisión impeller bomba agua de mar (Volvo D2)',
 'Revisión del impeller de la bomba de agua de mar — 500 h o 1 año (Volvo Penta D2)',
 'Seawater pump impeller check — 500 h or 1 year (Volvo Penta D2)',
 'Inspeccionar impeller; sustituir si hay grietas o desgaste. Manual D2 p.36.',
 'Inspect impeller; replace if cracked or worn. Volvo D2 manual p.36.'),

(c_engine,'preventive','medium',435,
 'Cambio de refrigerante (Volvo D2)',
 'Cambio de refrigerante del sistema de agua dulce — 500 h o 1/2 años (Volvo Penta D2)',
 'Freshwater coolant replacement — 500 h or 1/2 years (Volvo Penta D2)',
 'Vaciar y rellenar circuito de agua dulce. Anticorrosión: anual. Anticongelante: cada 2 años. Manual D2 p.35.',
 'Drain and refill freshwater circuit. Anti-corrosion: annually. Antifreeze: every 2 years. Volvo D2 manual p.35.'),

(c_engine,'preventive','low',440,
 'Limpieza filtro de aire (Volvo D2)',
 'Limpieza del filtro de aire — 500 h o 2 años (Volvo Penta D2)',
 'Air cleaner cleaning — 500 h or 2 years (Volvo Penta D2)',
 'Limpiar el elemento ACL del filtro de aire. Manual D2 p.31.',
 'Clean the ACL air cleaner element. Volvo D2 manual p.31.'),

(c_engine,'preventive','medium',445,
 'Limpieza intercambiador de calor (Volvo D2)',
 'Limpieza del intercambiador de calor — 500 h o 2 años (Volvo Penta D2)',
 'Heat exchanger cleaning — 500 h or 2 years (Volvo Penta D2)',
 'Limpiar el intercambiador eliminando incrustaciones. Requiere taller Volvo Penta. Manual D2 p.35.',
 'Clean heat exchanger removing scale. Requires authorised Volvo Penta workshop. Volvo D2 manual p.35.'),

(c_engine,'inspection','medium',450,
 'Revisión inyectores (Volvo D2)',
 'Prueba de presión de inyectores — 500 h o 2 años (Volvo Penta D2)',
 'Injector pressure test — 500 h or 2 years (Volvo Penta D2)',
 'Verificar presión de apertura de inyectores. Requiere taller Volvo Penta. Manual D2 p.27.',
 'Test injector opening pressure. Requires authorised Volvo Penta workshop. Volvo D2 manual p.27.'),

(c_engine,'preventive','high',455,
 'Ajuste de válvulas (Volvo D2)',
 'Ajuste de holgura de válvulas — 500 h o 2 años (Volvo Penta D2)',
 'Valve clearance adjustment — 500 h or 2 years (Volvo Penta D2)',
 'Ajustar holgura de válvulas con motor frío. Requiere taller Volvo Penta. Manual D2 p.27.',
 'Adjust valve clearances with cold engine. Requires authorised Volvo Penta workshop. Volvo D2 manual p.27.');

end $$;

-- 4. Create plans and link items by sort_order (no text join, no ambiguity)
do $$
declare
  p_yanmar uuid;
  p_volvo  uuid;
begin

insert into public.maintenance_schedule_plans (name_es, name_en, description_es, description_en, sort_order)
values (
  'Yanmar 4JH4AE — Plan de mantenimiento',
  'Yanmar 4JH4AE — Maintenance plan',
  'Plan de mantenimiento preventivo según manual Yanmar 4JH4AE.',
  'Preventive maintenance plan based on the Yanmar 4JH4AE service manual.',
  10
) returning id into p_yanmar;

insert into public.maintenance_schedule_plans (name_es, name_en, description_es, description_en, sort_order)
values (
  'Volvo Penta D2 — Plan de mantenimiento',
  'Volvo Penta D2 — Maintenance plan',
  'Plan de mantenimiento preventivo para motores Volvo Penta D2-40, D2-50, D2-60 y D2-75.',
  'Preventive maintenance plan for Volvo Penta D2-40, D2-50, D2-60 and D2-75 engines.',
  20
) returning id into p_volvo;

-- Yanmar items — join by sort_order (unique per engine series)
insert into public.maintenance_schedule_plan_items (plan_id, template_id, interval_days, interval_hours, sort_order)
select p_yanmar, mt.id, v.interval_days, v.interval_hours, v.pos
from (values
  (300, null,  50,   5),
  (305, null,  50,  10),
  (310,  365, 250,  20),
  (315,  365, 250,  30),
  (320,  365, 250,  40),
  (325,  365, 250,  50),
  (330,  365, 250,  60),
  (335,  365, 250,  70),
  (340,  365, 250,  80),
  (345,  365, 250,  90),
  (350,  730, 500, 100),
  (355,  730, 500, 110),
  (360, 1460, 1000, 120),
  (365, 1460, 1000, 130),
  (370, 1460, 1000, 140),
  (375, 1460, 1000, 150)
) as v(sort_order, interval_days, interval_hours, pos)
join public.maintenance_templates mt on mt.sort_order = v.sort_order and mt.boat_id is null;

-- Volvo items — join by sort_order
insert into public.maintenance_schedule_plan_items (plan_id, template_id, interval_days, interval_hours, sort_order)
select p_volvo, mt.id, v.interval_days, v.interval_hours, v.pos
from (values
  (400,  14, null,  10),
  (405,  14, null,  20),
  (408,  14, null,  30),
  (415, 365,  200,  40),
  (420, 365,  500,  50),
  (425, 365,  500,  60),
  (430, 365,  500,  70),
  (435, 365,  500,  80),
  (440, 730,  500,  90),
  (445, 730,  500, 100),
  (450, 730,  500, 110),
  (455, 730,  500, 120)
) as v(sort_order, interval_days, interval_hours, pos)
join public.maintenance_templates mt on mt.sort_order = v.sort_order and mt.boat_id is null;

end $$;


begin;

insert into public.owner_companies (id, name, notes)
values
  ('11111111-1111-1111-1111-111111111111', 'MOODY Charters', 'Owner seed for the demo sailboat'),
  ('22222222-2222-2222-2222-222222222222', 'Northwind Holdings', 'Owner seed for the demo motor yacht')
on conflict (id) do nothing;

insert into public.boats (
  id,
  name,
  identifier,
  registration_number,
  brand_model,
  build_year,
  shipyard,
  propulsion,
  boat_type,
  engine_notes,
  notes
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Aldebaran',
    'aldebaran-46',
    'ESP-PMI-2024-01',
    'Hallberg-Rassy 46',
    2017,
    'Hallberg-Rassy',
    'Yanmar 110hp',
    'Sailboat 46ft',
    'Single inboard diesel',
    'Primary demo sailboat'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Northwind',
    'northwind-38',
    'GR-ATH-2024-11',
    'Princess V39',
    2019,
    'Princess Yachts',
    'Twin Volvo Penta D6',
    'Motor yacht 38ft',
    'Twin inboard diesel',
    'Primary demo motor yacht'
  )
on conflict (id) do nothing;

insert into public.owner_boats (owner_id, boat_id, is_primary)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true)
on conflict (owner_id, boat_id) do nothing;

insert into public.boat_systems (id, boat_id, system_id, notes)
select
  seed.id,
  seed.boat_id,
  system_catalog.id,
  seed.notes
from (
  values
    ('aaaa1000-0000-0000-0000-000000000001'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'engine-propulsion', 'Main propulsion system'),
    ('aaaa1000-0000-0000-0000-000000000002'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'ground-tackle', 'Anchor and windlass'),
    ('aaaa1000-0000-0000-0000-000000000003'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'electrical', 'House batteries and chargers'),
    ('bbbb1000-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'engine-propulsion', 'Main engines'),
    ('bbbb1000-0000-0000-0000-000000000002'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'hull-deck', 'Hull and topsides'),
    ('bbbb1000-0000-0000-0000-000000000003'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'safety-equipment', 'Safety pack')
) as seed(id, boat_id, system_code, notes)
join public.system_catalog system_catalog
  on system_catalog.code = seed.system_code
on conflict (boat_id, system_id) do nothing;

insert into public.boat_components (
  id,
  boat_id,
  boat_system_id,
  name,
  manufacturer,
  model,
  serial_number,
  notes
)
values
  (
    'aaaa2000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000001',
    'Main Engine',
    'Yanmar',
    '4JH110',
    'YAN-ALD-001',
    'Primary propulsion engine'
  ),
  (
    'aaaa2000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000002',
    'Windlass',
    'Quick',
    'Prince DP3',
    'WND-ALD-002',
    'Bow windlass'
  ),
  (
    'bbbb2000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbb1000-0000-0000-0000-000000000001',
    'Port Engine',
    'Volvo Penta',
    'D6',
    'VOL-NWD-PORT',
    'Port-side main engine'
  )
on conflict (id) do nothing;

insert into public.hour_counters (
  id,
  boat_id,
  boat_component_id,
  name,
  unit,
  notes
)
values
  (
    'aaaa3000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa2000-0000-0000-0000-000000000001',
    'Main engine hours',
    'hours',
    'Primary counter for preventive maintenance'
  ),
  (
    'bbbb3000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbb2000-0000-0000-0000-000000000001',
    'Port engine hours',
    'hours',
    'Port engine counter'
  )
on conflict (id) do nothing;

insert into public.shipyards (
  id,
  name,
  country,
  region,
  address,
  gps_coordinates,
  website,
  phone,
  email,
  contact_person,
  haul_type,
  has_water,
  has_electricity,
  has_wifi,
  has_showers,
  has_security,
  services,
  standard_rates,
  notes
)
values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'STP Shipyard',
    'Spain',
    'Palma de Mallorca',
    'Muelle Viejo s/n',
    '39.5640, 2.6502',
    'https://www.stp-palma.com',
    '+34 971 214 444',
    'service@stp.example',
    'Service Desk',
    'Travel lift',
    true,
    true,
    true,
    true,
    true,
    'Travel lift, workshops, storage, pressure wash',
    '{"lift_in_out": 850, "pressure_wash": 95, "monthly_stay": 650}'::jsonb,
    'Seed shipyard'
  )
on conflict (id) do nothing;

insert into public.haul_outs (
  id,
  boat_id,
  shipyard_id,
  name,
  planned_date,
  start_date,
  end_date,
  status,
  responsible,
  notes
)
values
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Autumn 2026 haul-out',
    '2026-10-15',
    null,
    null,
    'planned',
    'Service manager',
    'Season closing haul-out'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Pre-season polish',
    '2026-04-28',
    '2026-04-27',
    null,
    'in_progress',
    'Shipyard team',
    'Hull polish and antifouling touch-up'
  )
on conflict (id) do nothing;

insert into public.preventive_plans (
  id,
  boat_id,
  boat_system_id,
  boat_component_id,
  template_id,
  title,
  description,
  interval_days,
  interval_hours,
  last_done_at,
  last_done_hours,
  next_due_date,
  next_due_hours,
  status,
  priority
)
select
  seed.id,
  seed.boat_id,
  seed.boat_system_id,
  seed.boat_component_id,
  preventive_templates.id,
  seed.template_title,
  seed.description,
  seed.interval_days,
  seed.interval_hours,
  seed.last_done_at,
  seed.last_done_hours,
  seed.next_due_date,
  seed.next_due_hours,
  seed.status,
  seed.priority
from (
  values
    (
      'f1000000-0000-0000-0000-000000000001'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'aaaa1000-0000-0000-0000-000000000001'::uuid,
      'aaaa2000-0000-0000-0000-000000000001'::uuid,
      'Oil change',
      'Engine oil and filter replacement',
      null::integer,
      200::numeric,
      '2026-01-18T09:00:00Z'::timestamptz,
      840::numeric,
      '2026-05-02'::date,
      1040::numeric,
      'planned'::public.task_status,
      'high'::public.priority_level
    ),
    (
      'f1000000-0000-0000-0000-000000000002'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'aaaa1000-0000-0000-0000-000000000002'::uuid,
      'aaaa2000-0000-0000-0000-000000000002'::uuid,
      'Winch service',
      'Gearbox inspection and lubrication',
      365::integer,
      null::numeric,
      '2025-04-16T09:00:00Z'::timestamptz,
      null::numeric,
      '2026-04-18'::date,
      null::numeric,
      'planned'::public.task_status,
      'high'::public.priority_level
    ),
    (
      'f1000000-0000-0000-0000-000000000003'::uuid,
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      'bbbb1000-0000-0000-0000-000000000003'::uuid,
      null::uuid,
      'Battery check',
      'Quarterly battery bank health check',
      90::integer,
      null::numeric,
      '2026-03-02T09:00:00Z'::timestamptz,
      null::numeric,
      '2026-06-01'::date,
      null::numeric,
      'done'::public.task_status,
      'medium'::public.priority_level
    )
) as seed(
  id,
  boat_id,
  boat_system_id,
  boat_component_id,
  template_title,
  description,
  interval_days,
  interval_hours,
  last_done_at,
  last_done_hours,
  next_due_date,
  next_due_hours,
  status,
  priority
)
join public.preventive_templates
  on preventive_templates.title = seed.template_title
on conflict (id) do nothing;

insert into public.observations (
  id,
  boat_id,
  boat_system_id,
  boat_component_id,
  title,
  description,
  priority,
  status,
  observed_at,
  notes
)
values
  (
    'f2000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000002',
    'aaaa2000-0000-0000-0000-000000000002',
    'Windlass noise under load',
    'Grinding noise heard during anchor retrieval',
    'high',
    'open',
    '2026-04-12T10:30:00Z',
    'Needs inspection before next passage'
  )
on conflict (id) do nothing;

insert into public.future_actions (
  id,
  boat_id,
  boat_system_id,
  boat_component_id,
  haul_out_id,
  source_observation_id,
  kind,
  title,
  description,
  priority,
  status,
  target_date,
  responsible,
  notes
)
values
  (
    'f3000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000002',
    'aaaa2000-0000-0000-0000-000000000002',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'f2000000-0000-0000-0000-000000000001',
    'next_haul_out',
    'Inspect windlass gearbox',
    'Open and inspect windlass gearbox during haul-out',
    'high',
    'pending',
    '2026-10-16',
    'Service manager',
    'Created from onboard observation'
  )
on conflict (id) do nothing;

insert into public.inventory_items (
  id,
  boat_id,
  boat_system_id,
  boat_component_id,
  name,
  reference,
  manufacturer,
  description,
  compatibility,
  unit,
  stock,
  minimum_stock,
  location,
  supplier,
  unit_cost,
  notes
)
values
  (
    'f4000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000001',
    'aaaa2000-0000-0000-0000-000000000001',
    'Fuel filter Racor',
    'RACOR-500FG',
    'Parker Racor',
    'Primary fuel filter element',
    'Yanmar 4JH110',
    'unit',
    2,
    4,
    'Engine room locker',
    'Marina Supply',
    34.90,
    'Low stock on purpose for dashboard alert'
  ),
  (
    'f4000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000002',
    'aaaa2000-0000-0000-0000-000000000002',
    'Anchor swivel 12 mm',
    'SWIV-12',
    'Rigging Pro',
    'Stainless steel swivel',
    'Bow anchor setup',
    'unit',
    1,
    1,
    'Bow locker',
    'Rigging Pro',
    119.00,
    null
  ),
  (
    'f4000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbb1000-0000-0000-0000-000000000003',
    null,
    'Flares pack',
    'SAFE-FLR-2026',
    'Ocean Safety',
    'SOLAS flare pack',
    'General safety kit',
    'pack',
    0,
    2,
    'Cockpit locker',
    'Safety Marine',
    159.00,
    'Out of stock for alert testing'
  )
on conflict (id) do nothing;

insert into public.future_purchases (
  id,
  boat_id,
  boat_system_id,
  inventory_item_id,
  haul_out_id,
  source_observation_id,
  source_future_action_id,
  item_name,
  description,
  quantity,
  unit,
  priority,
  status,
  supplier,
  estimated_cost,
  target_date,
  notes
)
values
  (
    'f5000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000001',
    'f4000000-0000-0000-0000-000000000001',
    null,
    null,
    null,
    'Fuel filter Racor',
    'Replenish filters before next passage',
    4,
    'unit',
    'high',
    'pending',
    'Marina Supply',
    139.60,
    '2026-05-01',
    'Triggered by low stock'
  )
on conflict (id) do nothing;

insert into public.maintenance_tasks (
  id,
  boat_id,
  boat_system_id,
  boat_component_id,
  preventive_plan_id,
  haul_out_id,
  source_observation_id,
  kind,
  status,
  priority,
  title,
  description,
  due_date,
  scheduled_at,
  responsible,
  performed_by,
  hour_counter_id,
  engine_hours,
  estimated_cost,
  notes
)
values
  (
    'f6000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000001',
    'aaaa2000-0000-0000-0000-000000000001',
    null,
    null,
    null,
    'corrective',
    'planned',
    'high',
    'Port engine belt replacement',
    'Replace worn alternator belt',
    '2026-04-30',
    '2026-04-29T09:00:00Z',
    'Service partner',
    null,
    'aaaa3000-0000-0000-0000-000000000001',
    1010,
    180,
    'Spare belt already on board'
  ),
  (
    'f6000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000002',
    'aaaa2000-0000-0000-0000-000000000002',
    null,
    null,
    'f2000000-0000-0000-0000-000000000001',
    'inspection',
    'pending',
    'critical',
    'Windlass annual inspection',
    'Inspect clutch, gearbox and motor wiring',
    '2026-05-04',
    null,
    'Crew',
    null,
    null,
    null,
    0,
    'Observation converted into maintenance'
  ),
  (
    'f6000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbb1000-0000-0000-0000-000000000002',
    null,
    null,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    null,
    'preventive',
    'in_progress',
    'medium',
    'Hull polish before season',
    'Polish and inspection while in yard',
    '2026-04-28',
    '2026-04-27T08:00:00Z',
    'Shipyard',
    null,
    null,
    null,
    420,
    'Linked to pre-season haul-out'
  )
on conflict (id) do nothing;

insert into public.haul_out_items (
  id,
  haul_out_id,
  boat_id,
  boat_system_id,
  boat_component_id,
  source_observation_id,
  linked_maintenance_task_id,
  title,
  description,
  priority,
  origin_summary,
  status,
  was_performed,
  responsible,
  notes
)
values
  (
    'f7000000-0000-0000-0000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa1000-0000-0000-0000-000000000002',
    'aaaa2000-0000-0000-0000-000000000002',
    'f2000000-0000-0000-0000-000000000001',
    'f6000000-0000-0000-0000-000000000002',
    'Open windlass gearbox',
    'Inspect gearbox during haul-out and replace grease',
    'high',
    'Season observation',
    'pending',
    false,
    'Service manager',
    'To be reviewed during next haul-out'
  )
on conflict (id) do nothing;

insert into public.engine_hour_logs (
  id,
  boat_id,
  hour_counter_id,
  logged_at,
  value_hours,
  notes
)
values
  (
    'f8000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaa3000-0000-0000-0000-000000000001',
    '2026-04-20T12:00:00Z',
    1008,
    'Last reading before maintenance planning'
  ),
  (
    'f8000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbb3000-0000-0000-0000-000000000001',
    '2026-04-17T12:00:00Z',
    612,
    'Routine weekly check'
  )
on conflict (id) do nothing;

insert into public.fuel_logs (
  id,
  boat_id,
  logged_at,
  fuel_type,
  quantity,
  unit,
  cost,
  supplier,
  hour_counter_id,
  engine_hours,
  notes
)
values
  (
    'f9000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-04-20T12:15:00Z',
    'Diesel',
    120,
    'L',
    228,
    'Club de Mar fuel dock',
    'aaaa3000-0000-0000-0000-000000000001',
    1008,
    'Filled after coastal trip'
  )
on conflict (id) do nothing;

commit;

-- After creating a user in Supabase Authentication, run only the following block
-- replacing YOUR_AUTH_USER_ID with the real auth.users.id so RLS lets that user see the seed data.
-- The public.user_profiles row is created automatically by the trigger in schema.sql.
--
-- insert into public.boat_memberships (id, boat_id, user_id, role)
-- values
--   ('fa000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YOUR_AUTH_USER_ID', 'superuser'),
--   ('fa000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'YOUR_AUTH_USER_ID', 'owner_admin')
-- on conflict (boat_id, user_id) do nothing;
--
-- insert into public.boat_membership_permissions (membership_id, permission)
-- values
--   ('fa000000-0000-0000-0000-000000000001', 'view'),
--   ('fa000000-0000-0000-0000-000000000001', 'create'),
--   ('fa000000-0000-0000-0000-000000000001', 'edit'),
--   ('fa000000-0000-0000-0000-000000000001', 'delete'),
--   ('fa000000-0000-0000-0000-000000000001', 'close'),
--   ('fa000000-0000-0000-0000-000000000001', 'approve'),
--   ('fa000000-0000-0000-0000-000000000001', 'manage_users'),
--   ('fa000000-0000-0000-0000-000000000001', 'manage_attachments'),
--   ('fa000000-0000-0000-0000-000000000001', 'manage_shared_searches'),
--   ('fa000000-0000-0000-0000-000000000002', 'view'),
--   ('fa000000-0000-0000-0000-000000000002', 'create'),
--   ('fa000000-0000-0000-0000-000000000002', 'edit'),
--   ('fa000000-0000-0000-0000-000000000002', 'delete'),
--   ('fa000000-0000-0000-0000-000000000002', 'close'),
--   ('fa000000-0000-0000-0000-000000000002', 'approve'),
--   ('fa000000-0000-0000-0000-000000000002', 'manage_users'),
--   ('fa000000-0000-0000-0000-000000000002', 'manage_attachments'),
--   ('fa000000-0000-0000-0000-000000000002', 'manage_shared_searches')
-- on conflict do nothing;
