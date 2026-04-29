-- Seed Dehler 47 REWIND
-- Propietario: jdiazrv@me.com
-- Matrícula: MN3068DX — ATCN Italia
-- Idempotent: upsert en boats, no duplica sistemas ni memberships.

begin;

-- ─── Barco ───────────────────────────────────────────────────────────────────

insert into public.boats (
  name, identifier, brand_model, boat_type,
  build_year, shipyard, registration_number,
  engine_notes, notes, flag
)
values (
  'REWIND',
  'dehler-47-rewind',
  'Dehler 47',
  'Sailboat',
  2007,
  'Dehler',
  'MN3068DX',
  'Volvo Penta D2-75 · 55 kW / 75 HP · matrícula 5103916758P',
  E'Iscrizione ATCN: MN3068DX\n'
  'Nominativo internazionale: 108538\n'
  'Codice WIN: DEDEH680391708\n'
  'Materiale scafo: P.R.F.V.\n'
  'Lunghezza f.t.: 14.28 m · Larghezza f.f.: 4.20 m',
  'IT'
)
on conflict (identifier) do update set
  name                = excluded.name,
  brand_model         = excluded.brand_model,
  build_year          = excluded.build_year,
  shipyard            = excluded.shipyard,
  registration_number = excluded.registration_number,
  engine_notes        = excluded.engine_notes,
  notes               = excluded.notes,
  flag                = excluded.flag;

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
-- Asigna rol owner_admin a jdiazrv@me.com con todos los permisos.

insert into public.boat_memberships (boat_id, user_id, role)
select b.id, p.id, 'owner_admin'::public.app_role
from public.boats b
join public.user_profiles p on p.email = 'jdiazrv@me.com'
where b.identifier = 'dehler-47-rewind'
on conflict (boat_id, user_id) do nothing;

insert into public.boat_membership_permissions (membership_id, permission)
select bm.id, perm.permission::public.app_permission
from public.boat_memberships bm
join public.boats b on b.id = bm.boat_id
join public.user_profiles p on p.id = bm.user_id
cross join (values
  ('view'), ('create'), ('edit'), ('delete'), ('close'), ('approve'), ('manage_attachments'), ('manage_shared_searches')
) as perm(permission)
where b.identifier = 'dehler-47-rewind'
  and p.email = 'jdiazrv@me.com'
  and not exists (
    select 1 from public.boat_membership_permissions x
    where x.membership_id = bm.id and x.permission = perm.permission::public.app_permission
  );

commit;
