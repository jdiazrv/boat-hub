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
