-- Seed Dehler 47 REWIND
-- Propietario: jdiazrv@me.com
-- Matrícula: MN3068DX — ATCN Italia
-- Idempotent: upsert en boats, no duplica sistemas ni memberships.

begin;

-- ─── Barco ───────────────────────────────────────────────────────────────────

insert into public.boats (
  name, identifier, brand_model, boat_type,
  year_built, flag, registration_number, notes
)
values (
  'REWIND',
  'dehler-47-rewind',
  'Dehler 47',
  'Sailboat',
  2007,
  'IT',
  'MN3068DX',
  E'Denominazione: REWIND\n'
  'Iscrizione ATCN: MN3068DX\n'
  'Nominativo internazionale: 108538\n'
  'Codice WIN: DEDEH680391708\n'
  'Cantiere: Dehler 47\n'
  'Materiale scafo: P.R.F.V.\n'
  'Lunghezza f.t.: 14.28 m\n'
  'Larghezza f.f.: 4.20 m\n'
  'Motore: Volvo Penta D2-75 (55 kW / 75 HP)\n'
  'Matrícula motor: 5103916758P'
)
on conflict (identifier) do update set
  name              = excluded.name,
  brand_model       = excluded.brand_model,
  year_built        = excluded.year_built,
  flag              = excluded.flag,
  registration_number = excluded.registration_number,
  notes             = excluded.notes;

-- ─── Sistemas ────────────────────────────────────────────────────────────────

insert into public.boat_systems (boat_id, system_id, notes)
select b.id, s.id, null
from public.boats b
cross join public.system_catalog s
where b.identifier = 'dehler-47-rewind'
  and s.code in (
    'engine-propulsion',
    'electrical',
    'rigging-winches',
    'sails',
    'hull-deck',
    'plumbing-pumps',
    'electronics-radar',
    'safety-equipment',
    'fresh-water',
    'steering-systems',
    'ground-tackle',
    'other'
  )
on conflict (boat_id, system_id) do nothing;

-- ─── Contador de horas — Motor Volvo D2-75 ───────────────────────────────────

insert into public.hour_counters (boat_id, name, unit, notes)
select b.id, 'Motor Volvo D2-75', 'hours', 'Volvo Penta D2-75 · 55 kW · matrícula 5103916758P'
from public.boats b
where b.identifier = 'dehler-47-rewind'
on conflict (boat_id, name) do nothing;

-- ─── Acceso del propietario ───────────────────────────────────────────────────
-- Asigna rol owner_admin a jdiazrv@me.com si el usuario ya existe en auth.

insert into public.boat_memberships (boat_id, user_id, role)
select b.id, p.id, 'owner_admin'::public.app_role
from public.boats b
join public.user_profiles p on p.email = 'jdiazrv@me.com'
where b.identifier = 'dehler-47-rewind'
on conflict (boat_id, user_id) do nothing;

-- ─── Plan de mantenimiento periódico — Volvo D2-75 ───────────────────────────

insert into public.maintenance_templates (boat_id, system_id, title, title_es, title_en, description, interval_days, interval_hours, default_priority)
select
  b.id,
  s.id,
  entry.title,
  entry.title_es,
  entry.title_en,
  entry.description,
  entry.interval_days,
  entry.interval_hours,
  entry.priority::public.priority_level
from public.boats b
cross join public.system_catalog s
cross join (values
  ('Cambio de aceite y filtro',        'Cambio de aceite y filtro',         'Oil and filter change',          'Volvo D2-75 — aceite motor y filtro',              null, 200::numeric, 'high'),
  ('Cambio de impeller',               'Cambio de impeller',                'Impeller replacement',           'Bomba de agua de mar — impeller',                  365,  150::numeric, 'high'),
  ('Filtros de combustible',           'Filtros de combustible',            'Fuel filters',                   'Filtro primario y secundario de gasoil',            365,  150::numeric, 'medium'),
  ('Correas y tensores',               'Correas y tensores',                'Belts and tensioners',           'Inspección y sustitución de correas',               365,  200::numeric, 'medium'),
  ('Aceite de transmisión',            'Aceite de transmisión',             'Gearbox oil',                   'Cambio de aceite de la caja reductora',             365,  250::numeric, 'medium'),
  ('Refrigerante',                     'Refrigerante',                      'Coolant',                        'Revisión y renovación del líquido refrigerante',   730,  null,          'medium'),
  ('Ánodo de sacrificio del eje',      'Ánodo de sacrificio del eje',       'Shaft anode',                   'Inspección y cambio de ánodo de eje',               365,  null,          'high')
) as entry(title, title_es, title_en, description, interval_days, interval_hours, priority)
where b.identifier = 'dehler-47-rewind'
  and s.code = 'engine-propulsion'
  and not exists (
    select 1 from public.maintenance_templates t
    where t.boat_id = b.id and lower(t.title) = lower(entry.title)
  );

-- ─── Seguridad ────────────────────────────────────────────────────────────────

insert into public.maintenance_templates (boat_id, system_id, title, title_es, title_en, description, interval_days, default_priority)
select
  b.id,
  s.id,
  entry.title,
  entry.title_es,
  entry.title_en,
  entry.description,
  entry.interval_days,
  entry.priority::public.priority_level
from public.boats b
cross join public.system_catalog s
cross join (values
  ('EPIRB — revisión y batería',       'EPIRB — revisión y batería',        'EPIRB — service and battery',    'Revisión periódica del EPIRB y sustitución de batería',               1825),
  ('Bengalas — renovación',            'Bengalas — renovación',             'Flares — renewal',               'Sustitución de bengalas caducadas',                                   1095),
  ('Balsa salvavidas — revisión',      'Balsa salvavidas — revisión',       'Life raft — service',            'Revisión anual de la balsa salvavidas en taller homologado',           365)
) as entry(title, title_es, title_en, description, interval_days, priority)
where b.identifier = 'dehler-47-rewind'
  and s.code = 'safety-equipment'
  and not exists (
    select 1 from public.maintenance_templates t
    where t.boat_id = b.id and lower(t.title) = lower(entry.title)
  );

commit;
