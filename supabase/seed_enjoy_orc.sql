-- Seed ORC / dimensions / polars / sails for ENJOY (Moody 425)
-- Data source: sailboatdata.com, goodoldboat.com, L-36.com, South East Asia Sails
-- Polar data: estimated from comparable cruiser-racer class (SA/D=16.4, D=9625kg)
-- Idempotent: safe to re-run.

begin;

update public.boats
set
  dimensions = (
    jsonb_build_object(
      'designer',         'Bill Dixon',
      'builder',          'Marine Projects Ltd',
      'seriesDate',       '1988',
      'hullConstruction', 'GRP',
      'loa',          12.700,
      'maxBeam',       4.060,
      'draft',         1.830,
      'displacement',  9625,
      'propellerType',     'Fixed 2 blades',
      'propellerDiameter',  0.380
    )
    || jsonb_build_object(
      'P',    13.920,
      'E',     4.720,
      'IG',   15.750,
      'ISP',  15.750,
      'J',     5.030,
      'BAS',   1.050,
      'spreadersCount',  2,
      'carbonMast',      false,
      'headsailFurler',  true,
      'mainsailFurler',  true
    )
    || jsonb_build_object(
      'polarWindSpeeds', '[6,8,10,12,14,16,20]'::jsonb,
      'polarBeatAngles', '[44.0,43.0,43.0,42.0,42.0,42.0,43.0]'::jsonb,
      'polarBeatVmg',    '[3.75,4.70,5.40,5.85,6.15,6.35,6.55]'::jsonb,
      'polarRunVmg',     '[3.00,4.10,4.95,5.55,5.95,6.25,6.70]'::jsonb,
      'polarGybeAngles', '[152.0,150.0,148.0,148.0,150.0,150.0,152.0]'::jsonb,
      'polarRows', jsonb_build_array(
        jsonb_build_object('twa', 52,  'speeds', '[3.90,4.90,5.60,6.10,6.45,6.65,6.90]'::jsonb),
        jsonb_build_object('twa', 60,  'speeds', '[4.10,5.20,5.95,6.45,6.80,7.05,7.30]'::jsonb),
        jsonb_build_object('twa', 75,  'speeds', '[4.35,5.50,6.30,6.85,7.20,7.45,7.70]'::jsonb),
        jsonb_build_object('twa', 90,  'speeds', '[4.25,5.45,6.25,6.80,7.15,7.45,7.75]'::jsonb),
        jsonb_build_object('twa', 110, 'speeds', '[4.00,5.20,6.10,6.70,7.10,7.40,7.75]'::jsonb),
        jsonb_build_object('twa', 120, 'speeds', '[3.80,5.05,5.95,6.60,7.00,7.30,7.70]'::jsonb),
        jsonb_build_object('twa', 135, 'speeds', '[3.50,4.70,5.65,6.30,6.75,7.10,7.55]'::jsonb),
        jsonb_build_object('twa', 150, 'speeds', '[3.15,4.30,5.20,5.85,6.30,6.65,7.20]'::jsonb)
      )
    )
    || jsonb_build_object(
      'sails', jsonb_build_array(
        jsonb_build_object(
          'id', 'main-001', 'label', 'Mayor (enrollada en palo)', 'sailType', 'mainsail',
          'luff', 13.92, 'foot', 4.72, 'leech', 14.60,
          'area', 32.00, 'condition', 'good',
          'notes', 'Enrollable en palo (in-mast furling). Sin bativoques, gratil recto.'
        ),
        jsonb_build_object(
          'id', 'hd-001', 'label', 'Génova 155% (enrollado)', 'sailType', 'headsail',
          'luff', 16.53, 'foot', 8.85, 'leech', 15.20,
          'area', 67.00, 'lpPercent', 155, 'condition', 'good',
          'notes', 'LP aprox 7.80m (155% de J=5.03m). Enrollable en estay.'
        ),
        jsonb_build_object(
          'id', 'asym-001', 'label', 'Asimétrico', 'sailType', 'spinnaker_asym',
          'slu', 15.85, 'sle', 14.94, 'sl', 14.40, 'shw', 8.50, 'sfl', 8.70,
          'area', 107.00, 'condition', 'good',
          'notes', 'Cruising chute / gennaker asimétrico.'
        )
      )
    )
  )
where identifier = 'moody-425-enjoy';

commit;
