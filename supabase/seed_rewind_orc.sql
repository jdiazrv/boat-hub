-- Seed ORC / dimensions / tanks / polars / sails for REWIND (Dehler 47 SQ)
-- Data source: ORC Certificate BENBEN ESP-10343, issued 21/04/2023
-- Idempotent: safe to re-run.

begin;

update public.boats
set
  dimensions = jsonb_build_object(
    -- ── Hull ────────────────────────────────────────────────────────────────
    'loa',          14.265,
    'maxBeam',       4.168,
    'draft',         2.463,
    'displacement',  14213,
    'wettedArea',    44.48,
    'dlr',           6.5786,
    -- ── Rig (ORC measurement letters) ──────────────────────────────────────
    'P',    18.700,
    'E',     6.120,
    'IG',   19.800,
    'ISP',  19.800,
    'J',     5.450,
    'BAS',   1.810,
    'TPS',   6.800,
    'TL',    1.300,
    'MW',    0.290,
    'GO',    0.320,
    'BD',    0.280,
    'MWT',   387.0,
    'MCG',   6.350,
    -- ── Stability ───────────────────────────────────────────────────────────
    'rmRated',        374.5,
    'stabilityIndex', 134.4,
    'lps',            124.1,
    -- ── Sail areas (m²) ─────────────────────────────────────────────────────
    'mainsailMeasured',    64.60,
    'mainsailRated',       65.40,
    'headsailMeasured',    66.23,
    'headsailRated',       66.23,
    'asymmetricMeasured', 179.41,
    'asymmetricRated',    179.41,
    'trysail',   20.03,
    'stormJib',  19.82,
    'heavyJib',  53.52,
    -- ── ORC ratings ─────────────────────────────────────────────────────────
    'imsClass',       'Cruiser/Racer',
    'orcGph',          560.9,
    'orcAph',          499.9,
    'orcCdl',          11.771,
    'certNo',          '103431',
    'spreadersCount',  3,
    'carbonMast',      true,
    'headsailFurler',  true,
    -- ── VPP Polar (TWA rows, TWS 6/8/10/12/14/16/20 kt) ────────────────────
    'polarWindSpeeds', '[6,8,10,12,14,16,20]'::jsonb,
    'polarBeatAngles', '[43.8,41.8,40.6,39.6,39.0,38.8,38.7]'::jsonb,
    'polarBeatVmg',    '[3.82,4.65,5.22,5.55,5.71,5.81,5.88]'::jsonb,
    'polarRunVmg',     '[4.03,5.11,6.04,6.74,7.17,7.54,8.46]'::jsonb,
    'polarGybeAngles', '[143.3,146.9,148.7,149.6,150.5,170.0,176.3]'::jsonb,
    'polarRows', jsonb_build_array(
      jsonb_build_object('twa', 52,  'speeds', '[5.87,6.96,7.65,8.01,8.17,8.27,8.36]'::jsonb),
      jsonb_build_object('twa', 60,  'speeds', '[6.22,7.28,7.91,8.23,8.41,8.51,8.61]'::jsonb),
      jsonb_build_object('twa', 75,  'speeds', '[6.47,7.50,8.09,8.43,8.65,8.82,9.01]'::jsonb),
      jsonb_build_object('twa', 90,  'speeds', '[6.37,7.44,8.08,8.46,8.74,8.98,9.36]'::jsonb),
      jsonb_build_object('twa', 110, 'speeds', '[6.26,7.55,8.30,8.72,9.06,9.29,9.68]'::jsonb),
      jsonb_build_object('twa', 120, 'speeds', '[6.12,7.43,8.22,8.70,9.11,9.49,10.10]'::jsonb),
      jsonb_build_object('twa', 135, 'speeds', '[5.52,6.85,7.84,8.43,8.87,9.30,10.20]'::jsonb),
      jsonb_build_object('twa', 150, 'speeds', '[4.66,5.91,6.97,7.78,8.28,8.61,9.22]'::jsonb)
    ),
    -- ── Sail inventory ───────────────────────────────────────────────────────
    'sails', jsonb_build_array(
      jsonb_build_object(
        'id', 'main-001',
        'label', 'Mayor',
        'sailType', 'mainsail',
        'material', null,
        'luff', null,
        'foot', null,
        'area', 64.60,
        'condition', 'good',
        'notes', 'ORC medida 20/06/2016 — MHB 0.16 MUW 1.11 MTW 2.07 MHW 3.70 MQW 4.91'
      ),
      jsonb_build_object(
        'id', 'hd-001',
        'label', 'Génova (enrollada)',
        'sailType', 'headsail',
        'material', null,
        'luff', 19.00,
        'area', 66.23,
        'lpPercent', null,
        'condition', 'good',
        'notes', 'HLP 7.26 — Botón No — Flying No. ORC ref 001'
      ),
      jsonb_build_object(
        'id', 'hd-002',
        'label', 'Foque',
        'sailType', 'headsail',
        'material', null,
        'luff', 18.90,
        'area', 50.86,
        'condition', 'good',
        'notes', 'HLP 5.67 — Flying No. ORC ref 002'
      ),
      jsonb_build_object(
        'id', 'asym-001',
        'label', 'Gennaker A4',
        'sailType', 'spinnaker_asym',
        'material', null,
        'slu', 21.67,
        'sle', 17.51,
        'sl',  19.59,
        'shw', 11.02,
        'sfl', 10.87,
        'area', 179.41,
        'condition', 'good',
        'notes', 'ORC ratio 101% — ref 002 A4'
      ),
      jsonb_build_object(
        'id', 'asym-002',
        'label', 'Asimétrico',
        'sailType', 'spinnaker_asym',
        'material', null,
        'slu', 20.10,
        'sle', 18.00,
        'sl',  19.05,
        'shw',  9.55,
        'sfl',  9.60,
        'area', 151.77,
        'condition', 'good',
        'notes', 'ORC ratio 99% — ref 001'
      )
    )
  ),
  tanks = jsonb_build_array(
    jsonb_build_object(
      'id',       'diesel',
      'type',     'diesel',
      'label',    'Gasoil',
      'capacity', 270,
      'unit',     'L',
      'material', 'PVC',
      'notes',    'ORC inv ref 001 — peso específico 0.900'
    ),
    jsonb_build_object(
      'id',       'fresh_water',
      'type',     'fresh_water',
      'label',    'Agua dulce',
      'capacity', 450,
      'unit',     'L',
      'material', 'PVC',
      'notes',    'ORC inv ref 002'
    )
  ),
  identifiers = jsonb_build_object(
    'mmsi',          null,
    'callSign',      null,
    'imoNumber',     null,
    'intNominativo', '108538',
    'winCode',       'DEDEH680391708',
    'atcnRef',       'MN3068DX'
  )
where identifier = 'dehler-47-rewind';

commit;
