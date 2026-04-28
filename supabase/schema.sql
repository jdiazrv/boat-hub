create extension if not exists pgcrypto;

create type public.app_role as enum (
  'superuser',
  'owner_admin',
  'limited_user',
  'read_only'
);

create type public.app_permission as enum (
  'view',
  'create',
  'edit',
  'delete',
  'close',
  'approve',
  'manage_users',
  'manage_attachments',
  'manage_shared_searches'
);

create type public.priority_level as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.maintenance_kind as enum (
  'preventive',
  'corrective',
  'inspection',
  'review',
  'upgrade'
);

create type public.task_status as enum (
  'pending',
  'planned',
  'in_progress',
  'done',
  'cancelled',
  'postponed'
);

create type public.observation_status as enum (
  'open',
  'converted',
  'closed',
  'cancelled'
);

create type public.haul_out_status as enum (
  'planned',
  'preparing',
  'in_progress',
  'closed',
  'cancelled'
);

create type public.purchase_status as enum (
  'pending',
  'planned',
  'ordered',
  'received',
  'cancelled'
);

create type public.saved_search_scope as enum (
  'personal',
  'shared'
);

create type public.future_action_kind as enum (
  'future_maintenance',
  'upgrade',
  'review',
  'administrative',
  'preparation',
  'next_haul_out'
);

create type public.attachment_target_type as enum (
  'boat',
  'boat_system',
  'boat_component',
  'maintenance_task',
  'preventive_plan',
  'observation',
  'haul_out',
  'haul_out_item',
  'future_action',
  'future_purchase',
  'inventory_item',
  'fuel_log',
  'hour_log',
  'marina',
  'shipyard'
);

create type public.audit_entity_type as enum (
  'boat',
  'maintenance_task',
  'preventive_plan',
  'observation',
  'haul_out',
  'future_action',
  'future_purchase',
  'inventory_item',
  'fuel_log',
  'hour_log',
  'attachment',
  'membership'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create table public.owner_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  preferred_language text not null default 'es' check (preferred_language in ('es', 'en')),
  is_superuser boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.boats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  identifier text not null unique,
  registration_number text,
  brand_model text,
  build_year integer,
  shipyard text,
  propulsion text,
  boat_type text,
  engine_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_boats (
  owner_id uuid not null references public.owner_companies(id) on delete cascade,
  boat_id uuid not null references public.boats(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (owner_id, boat_id)
);

create table public.permission_catalog (
  permission public.app_permission primary key,
  name_es text not null,
  name_en text not null
);

create table public.boat_memberships (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (boat_id, user_id)
);

create table public.boat_membership_permissions (
  membership_id uuid not null references public.boat_memberships(id) on delete cascade,
  permission public.app_permission not null references public.permission_catalog(permission),
  granted_at timestamptz not null default now(),
  primary key (membership_id, permission)
);

create table public.system_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_es text not null,
  name_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.boat_systems (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  system_id uuid not null references public.system_catalog(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (boat_id, system_id)
);

create table public.boat_components (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  name text not null,
  manufacturer text,
  model text,
  serial_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.preventive_templates (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references public.system_catalog(id),
  title text not null,
  description text,
  interval_days integer,
  interval_hours numeric(10,2),
  default_priority public.priority_level not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (interval_days is not null or interval_hours is not null)
);

create table public.preventive_plans (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  template_id uuid references public.preventive_templates(id) on delete set null,
  title text not null,
  description text,
  interval_days integer,
  interval_hours numeric(10,2),
  last_done_at timestamptz,
  last_done_hours numeric(10,2),
  next_due_date date,
  next_due_hours numeric(10,2),
  status public.task_status not null default 'planned',
  priority public.priority_level not null default 'medium',
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (interval_days is not null or interval_hours is not null)
);

create table public.shipyards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  region text,
  address text,
  gps_coordinates text,
  website text,
  phone text,
  email text,
  contact_person text,
  vhf_channel text,
  haul_type text,
  haul_capacity_tonnes numeric(10,2),
  max_length_m numeric(10,2),
  max_beam_m numeric(10,2),
  max_draft_m numeric(10,2),
  has_water boolean not null default false,
  has_electricity boolean not null default false,
  has_wifi boolean not null default false,
  has_showers boolean not null default false,
  has_security boolean not null default false,
  services text,
  standard_rates jsonb not null default '{}'::jsonb,
  notes text,
  info_date date,
  info_source text,
  rating numeric(3,2),
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marinas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  region text,
  address text,
  coordinates text,
  website text,
  phone text,
  email text,
  contact_person text,
  vhf_channel text,
  berth_type text,
  available_services text,
  has_water boolean not null default false,
  has_electricity boolean not null default false,
  has_wifi boolean not null default false,
  has_showers boolean not null default false,
  has_security boolean not null default false,
  notes text,
  info_date date,
  info_source text,
  rating numeric(3,2),
  created_by uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.haul_outs (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  shipyard_id uuid references public.shipyards(id) on delete set null,
  name text not null,
  planned_date date,
  start_date date,
  end_date date,
  status public.haul_out_status not null default 'planned',
  location text,
  responsible text,
  estimated_cost numeric(12,2),
  paid_to_date numeric(12,2),
  final_cost numeric(12,2),
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  title text not null,
  description text,
  priority public.priority_level not null default 'medium',
  status public.observation_status not null default 'open',
  observed_at timestamptz not null default now(),
  noted_by uuid references public.user_profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.future_actions (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  haul_out_id uuid references public.haul_outs(id) on delete set null,
  source_observation_id uuid references public.observations(id) on delete set null,
  kind public.future_action_kind not null,
  title text not null,
  description text,
  priority public.priority_level not null default 'medium',
  status public.task_status not null default 'pending',
  target_date date,
  responsible text,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  name text not null,
  reference text,
  manufacturer text,
  description text,
  compatibility text,
  unit text not null default 'unit',
  stock numeric(10,2) not null default 0,
  minimum_stock numeric(10,2),
  location text,
  supplier text,
  unit_cost numeric(12,2),
  alternative_part text,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.future_purchases (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid references public.boat_systems(id) on delete set null,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  haul_out_id uuid references public.haul_outs(id) on delete set null,
  source_observation_id uuid references public.observations(id) on delete set null,
  source_future_action_id uuid references public.future_actions(id) on delete set null,
  item_name text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'unit',
  priority public.priority_level not null default 'medium',
  status public.purchase_status not null default 'pending',
  supplier text,
  estimated_cost numeric(12,2),
  target_date date,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hour_counters (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  name text not null,
  unit text not null default 'hours',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (boat_id, name)
);

create table public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  preventive_plan_id uuid references public.preventive_plans(id) on delete set null,
  haul_out_id uuid references public.haul_outs(id) on delete set null,
  source_observation_id uuid references public.observations(id) on delete set null,
  kind public.maintenance_kind not null,
  status public.task_status not null default 'pending',
  priority public.priority_level not null default 'medium',
  title text not null,
  description text,
  due_date date,
  scheduled_at timestamptz,
  completed_at timestamptz,
  responsible text,
  performed_by text,
  hour_counter_id uuid references public.hour_counters(id) on delete set null,
  engine_hours numeric(10,2),
  estimated_cost numeric(12,2),
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.haul_out_items (
  id uuid primary key default gen_random_uuid(),
  haul_out_id uuid not null references public.haul_outs(id) on delete cascade,
  boat_id uuid not null references public.boats(id) on delete cascade,
  boat_system_id uuid not null references public.boat_systems(id) on delete cascade,
  boat_component_id uuid references public.boat_components(id) on delete set null,
  source_observation_id uuid references public.observations(id) on delete set null,
  linked_maintenance_task_id uuid references public.maintenance_tasks(id) on delete set null,
  title text not null,
  description text,
  priority public.priority_level not null default 'medium',
  origin_summary text,
  status public.task_status not null default 'pending',
  was_performed boolean not null default false,
  not_performed_reason text,
  responsible text,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_usage (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  maintenance_task_id uuid references public.maintenance_tasks(id) on delete cascade,
  haul_out_item_id uuid references public.haul_out_items(id) on delete cascade,
  quantity_used numeric(10,2) not null check (quantity_used > 0),
  unit_cost numeric(12,2),
  notes text,
  recorded_by uuid references public.user_profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  check (
    maintenance_task_id is not null
    or haul_out_item_id is not null
  )
);

create table public.engine_hour_logs (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  hour_counter_id uuid not null references public.hour_counters(id) on delete cascade,
  logged_at timestamptz not null default now(),
  value_hours numeric(10,2) not null,
  notes text,
  maintenance_task_id uuid references public.maintenance_tasks(id) on delete set null,
  fuel_log_id uuid,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  logged_at timestamptz not null default now(),
  fuel_type text not null,
  quantity numeric(10,2) not null,
  unit text not null default 'L',
  cost numeric(12,2),
  supplier text,
  hour_counter_id uuid references public.hour_counters(id) on delete set null,
  engine_hours numeric(10,2),
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.engine_hour_logs
add constraint engine_hour_logs_fuel_log_id_fkey
foreign key (fuel_log_id) references public.fuel_logs(id) on delete set null;

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid references public.boats(id) on delete cascade,
  target_type public.attachment_target_type not null,
  target_id uuid not null,
  file_name text not null,
  storage_bucket text not null default 'attachments',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  document_category text,
  uploaded_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid references public.boats(id) on delete cascade,
  owner_user_id uuid not null references public.user_profiles(id) on delete cascade,
  scope public.saved_search_scope not null default 'personal',
  module_key text not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid references public.boats(id) on delete cascade,
  entity_type public.audit_entity_type not null,
  entity_id uuid not null,
  action text not null,
  title text not null,
  detail text,
  performed_by uuid references public.user_profiles(id) on delete set null,
  performed_at timestamptz not null default now()
);

create index idx_owner_boats_boat on public.owner_boats(boat_id);
create index idx_boat_memberships_user on public.boat_memberships(user_id);
create index idx_boat_systems_boat on public.boat_systems(boat_id);
create index idx_components_boat_system on public.boat_components(boat_system_id);
create index idx_preventive_plans_boat_due on public.preventive_plans(boat_id, next_due_date);
create index idx_maintenance_tasks_boat_due on public.maintenance_tasks(boat_id, due_date);
create index idx_observations_boat_status on public.observations(boat_id, status);
create index idx_future_actions_boat_status on public.future_actions(boat_id, status);
create index idx_future_purchases_boat_status on public.future_purchases(boat_id, status);
create index idx_inventory_items_boat on public.inventory_items(boat_id);
create index idx_hault_outs_boat on public.haul_outs(boat_id);
create index idx_hault_out_items_haul on public.haul_out_items(haul_out_id);
create index idx_hour_logs_counter_date on public.engine_hour_logs(hour_counter_id, logged_at desc);
create index idx_fuel_logs_boat_date on public.fuel_logs(boat_id, logged_at desc);
create index idx_attachments_boat on public.attachments(boat_id);
create index idx_saved_searches_owner on public.saved_searches(owner_user_id, scope);
create index idx_audit_log_boat_date on public.audit_log(boat_id, performed_at desc);

create trigger trg_owner_companies_updated_at
before update on public.owner_companies
for each row execute function public.set_updated_at();

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger trg_boats_updated_at
before update on public.boats
for each row execute function public.set_updated_at();

create trigger trg_boat_memberships_updated_at
before update on public.boat_memberships
for each row execute function public.set_updated_at();

create trigger trg_boat_systems_updated_at
before update on public.boat_systems
for each row execute function public.set_updated_at();

create trigger trg_boat_components_updated_at
before update on public.boat_components
for each row execute function public.set_updated_at();

create trigger trg_preventive_templates_updated_at
before update on public.preventive_templates
for each row execute function public.set_updated_at();

create trigger trg_preventive_plans_updated_at
before update on public.preventive_plans
for each row execute function public.set_updated_at();

create trigger trg_shipyards_updated_at
before update on public.shipyards
for each row execute function public.set_updated_at();

create trigger trg_marinas_updated_at
before update on public.marinas
for each row execute function public.set_updated_at();

create trigger trg_haul_outs_updated_at
before update on public.haul_outs
for each row execute function public.set_updated_at();

create trigger trg_observations_updated_at
before update on public.observations
for each row execute function public.set_updated_at();

create trigger trg_future_actions_updated_at
before update on public.future_actions
for each row execute function public.set_updated_at();

create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

create trigger trg_future_purchases_updated_at
before update on public.future_purchases
for each row execute function public.set_updated_at();

create trigger trg_hour_counters_updated_at
before update on public.hour_counters
for each row execute function public.set_updated_at();

create trigger trg_maintenance_tasks_updated_at
before update on public.maintenance_tasks
for each row execute function public.set_updated_at();

create trigger trg_haul_out_items_updated_at
before update on public.haul_out_items
for each row execute function public.set_updated_at();

create trigger trg_attachments_updated_at
before update on public.attachments
for each row execute function public.set_updated_at();

create trigger trg_saved_searches_updated_at
before update on public.saved_searches
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.permission_catalog (permission, name_es, name_en)
values
  ('view', 'Ver', 'View'),
  ('create', 'Crear', 'Create'),
  ('edit', 'Editar', 'Edit'),
  ('delete', 'Borrar', 'Delete'),
  ('close', 'Cerrar', 'Close'),
  ('approve', 'Aprobar', 'Approve'),
  ('manage_users', 'Gestionar usuarios', 'Manage users'),
  ('manage_attachments', 'Gestionar adjuntos', 'Manage attachments'),
  ('manage_shared_searches', 'Gestionar busquedas compartidas', 'Manage shared searches');

insert into public.system_catalog (code, name_es, name_en, sort_order)
values
  ('dinghy-motor', 'Auxiliar y motor auxiliar', 'Dinghy and Motor', 10),
  ('electrical', 'Electrico', 'Electrical', 20),
  ('electronics-radar', 'Electronica y radar', 'Electronics and Radar', 30),
  ('engine-propulsion', 'Motor y propulsion', 'Engine and Propulsion', 40),
  ('fresh-water', 'Agua dulce', 'Fresh Water', 50),
  ('galley-equipment', 'Equipamiento de cocina', 'Galley Equipment', 60),
  ('ground-tackle', 'Fondeo y anclas', 'Ground Tackle and Anchoring', 70),
  ('hatches-portlights', 'Escotillas y portillos', 'Hatches and Portlights', 80),
  ('hull-deck', 'Casco, zincs y cubierta', 'Hull, Zincs and Deck', 90),
  ('interior-furniture', 'Interior y mobiliario', 'Interior Furniture', 100),
  ('other', 'Otros', 'Other and Miscellaneous', 110),
  ('outboard-motor', 'Motor fuera borda', 'Outboard Motor', 120),
  ('plumbing-pumps', 'Fontaneria y bombas', 'Plumbing and Pumps', 130),
  ('propane', 'Gas propano', 'Propane', 140),
  ('radio', 'Radio', 'Radio', 150),
  ('rigging-winches', 'Jarcia y winches', 'Rigging and Winches', 160),
  ('safety-equipment', 'Seguridad', 'Safety Equipment', 170),
  ('sails', 'Velas', 'Sails', 180),
  ('steering-systems', 'Direccion', 'Steering Systems', 190),
  ('winches', 'Winches', 'Winches', 200);

insert into public.preventive_templates (
  system_id,
  title,
  description,
  interval_days,
  interval_hours,
  default_priority
)
select
  system_catalog.id,
  template_title,
  template_description,
  interval_days,
  interval_hours,
  priority
from (
  values
    ('engine-propulsion', 'Oil change', 'Periodic engine oil replacement', null, 200::numeric, 'high'::public.priority_level),
    ('engine-propulsion', 'Impeller', 'Inspect and replace seawater impeller', 365, null, 'high'::public.priority_level),
    ('engine-propulsion', 'Fuel filters', 'Replace primary and secondary fuel filters', 180, 150::numeric, 'medium'::public.priority_level),
    ('engine-propulsion', 'Belts', 'Inspect and replace worn belts', 180, 150::numeric, 'medium'::public.priority_level),
    ('hull-deck', 'Zincs', 'Inspect and replace sacrificial anodes', 180, null, 'high'::public.priority_level),
    ('engine-propulsion', 'Coolant', 'Check and renew coolant as required', 365, null, 'medium'::public.priority_level),
    ('engine-propulsion', 'Gearbox oil', 'Replace gearbox oil', 365, 250::numeric, 'medium'::public.priority_level),
    ('electrical', 'Battery check', 'Voltage and health check for battery bank', 90, null, 'medium'::public.priority_level),
    ('rigging-winches', 'Winch service', 'Clean, grease and inspect winches', 365, null, 'medium'::public.priority_level),
    ('rigging-winches', 'Rig inspection', 'Inspect standing rigging and terminals', 365, null, 'high'::public.priority_level),
    ('safety-equipment', 'Safety inspection', 'Review mandatory safety equipment', 180, null, 'critical'::public.priority_level),
    ('plumbing-pumps', 'Revision de seacocks', 'Inspect and lubricate seacocks', 365, null, 'high'::public.priority_level),
    ('hull-deck', 'Cambio de anodos', 'Replace anodes during haul-out if needed', 365, null, 'high'::public.priority_level)
) as seed(system_code, template_title, template_description, interval_days, interval_hours, priority)
join public.system_catalog
  on system_catalog.code = seed.system_code;

create or replace function public.is_superuser()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.is_superuser
  ) or exists (
    select 1
    from public.boat_memberships membership
    where membership.user_id = auth.uid()
      and membership.role = 'superuser'
  );
$$;

create or replace function public.is_boat_member(target_boat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_superuser()
    or exists (
      select 1
      from public.boat_memberships membership
      where membership.boat_id = target_boat_id
        and membership.user_id = auth.uid()
    );
$$;

create or replace function public.has_boat_permission(
  target_boat_id uuid,
  required_permission public.app_permission
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_superuser()
    or exists (
      select 1
      from public.boat_memberships membership
      join public.boat_membership_permissions permission
        on permission.membership_id = membership.id
      where membership.boat_id = target_boat_id
        and membership.user_id = auth.uid()
        and permission.permission = required_permission
    );
$$;

alter table public.owner_companies enable row level security;
alter table public.user_profiles enable row level security;
alter table public.system_catalog enable row level security;
alter table public.boats enable row level security;
alter table public.owner_boats enable row level security;
alter table public.boat_memberships enable row level security;
alter table public.boat_membership_permissions enable row level security;
alter table public.boat_systems enable row level security;
alter table public.boat_components enable row level security;
alter table public.preventive_plans enable row level security;
alter table public.shipyards enable row level security;
alter table public.marinas enable row level security;
alter table public.haul_outs enable row level security;
alter table public.observations enable row level security;
alter table public.future_actions enable row level security;
alter table public.inventory_items enable row level security;
alter table public.future_purchases enable row level security;
alter table public.hour_counters enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.haul_out_items enable row level security;
alter table public.inventory_usage enable row level security;
alter table public.engine_hour_logs enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.attachments enable row level security;
alter table public.saved_searches enable row level security;
alter table public.audit_log enable row level security;

create policy "Users can read their own profile"
on public.user_profiles
for select
using (id = auth.uid() or public.is_superuser());

create policy "Users can update their own profile"
on public.user_profiles
for update
using (id = auth.uid() or public.is_superuser())
with check (id = auth.uid() or public.is_superuser());

create policy "Boat members can read owners linked to their boats"
on public.owner_companies
for select
using (
  public.is_superuser()
  or exists (
    select 1
    from public.owner_boats owner_boat
    where owner_boat.owner_id = owner_companies.id
      and public.is_boat_member(owner_boat.boat_id)
  )
);

create policy "Authenticated users can read system catalog"
on public.system_catalog
for select
using (auth.role() = 'authenticated');

create policy "Boat managers can manage owners"
on public.owner_companies
for all
using (public.is_superuser())
with check (public.is_superuser());

create policy "Boat members can read boats"
on public.boats
for select
using (public.is_boat_member(id));

create policy "Boat managers can create boats"
on public.boats
for insert
with check (public.is_superuser());

create policy "Boat managers can update boats"
on public.boats
for update
using (public.has_boat_permission(id, 'edit'))
with check (public.has_boat_permission(id, 'edit'));

create policy "Superusers can delete boats"
on public.boats
for delete
using (public.is_superuser());

create policy "Boat managers can read owner links"
on public.owner_boats
for select
using (public.is_boat_member(boat_id));

create policy "Boat managers can manage owner links"
on public.owner_boats
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read memberships"
on public.boat_memberships
for select
using (public.is_boat_member(boat_id));

create policy "User managers can manage memberships"
on public.boat_memberships
for all
using (public.has_boat_permission(boat_id, 'manage_users'))
with check (public.has_boat_permission(boat_id, 'manage_users'));

create policy "Boat members can read membership permissions"
on public.boat_membership_permissions
for select
using (
  exists (
    select 1
    from public.boat_memberships membership
    where membership.id = boat_membership_permissions.membership_id
      and public.is_boat_member(membership.boat_id)
  )
);

create policy "User managers can manage membership permissions"
on public.boat_membership_permissions
for all
using (
  exists (
    select 1
    from public.boat_memberships membership
    where membership.id = boat_membership_permissions.membership_id
      and public.has_boat_permission(membership.boat_id, 'manage_users')
  )
)
with check (
  exists (
    select 1
    from public.boat_memberships membership
    where membership.id = boat_membership_permissions.membership_id
      and public.has_boat_permission(membership.boat_id, 'manage_users')
  )
);

create policy "Boat members can read boat systems"
on public.boat_systems
for select
using (public.is_boat_member(boat_id));

create policy "Editors can manage boat systems"
on public.boat_systems
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read components"
on public.boat_components
for select
using (public.is_boat_member(boat_id));

create policy "Editors can manage components"
on public.boat_components
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read preventive plans"
on public.preventive_plans
for select
using (public.is_boat_member(boat_id));

create policy "Creators can insert preventive plans"
on public.preventive_plans
for insert
with check (public.has_boat_permission(boat_id, 'create'));

create policy "Editors can update preventive plans"
on public.preventive_plans
for update
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Editors can delete preventive plans"
on public.preventive_plans
for delete
using (public.has_boat_permission(boat_id, 'delete'));

create policy "Authenticated users can read shipyards"
on public.shipyards
for select
using (auth.uid() is not null);

create policy "Authenticated users can create shipyards"
on public.shipyards
for insert
with check (auth.uid() is not null);

create policy "Superusers can update shipyards"
on public.shipyards
for update
using (public.is_superuser())
with check (public.is_superuser());

create policy "Superusers can delete shipyards"
on public.shipyards
for delete
using (public.is_superuser());

create policy "Users can read their marinas"
on public.marinas
for select
using (created_by = auth.uid() or public.is_superuser());

create policy "Users can create their marinas"
on public.marinas
for insert
with check (created_by = auth.uid() or public.is_superuser());

create policy "Users can update their marinas"
on public.marinas
for update
using (created_by = auth.uid() or public.is_superuser())
with check (created_by = auth.uid() or public.is_superuser());

create policy "Users can delete their marinas"
on public.marinas
for delete
using (created_by = auth.uid() or public.is_superuser());

create policy "Boat members can read haul outs"
on public.haul_outs
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage haul outs"
on public.haul_outs
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read observations"
on public.observations
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage observations"
on public.observations
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read future actions"
on public.future_actions
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage future actions"
on public.future_actions
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read inventory"
on public.inventory_items
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage inventory"
on public.inventory_items
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read future purchases"
on public.future_purchases
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage future purchases"
on public.future_purchases
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read hour counters"
on public.hour_counters
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage hour counters"
on public.hour_counters
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read maintenance tasks"
on public.maintenance_tasks
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can insert maintenance tasks"
on public.maintenance_tasks
for insert
with check (public.has_boat_permission(boat_id, 'create'));

create policy "Boat contributors can update maintenance tasks"
on public.maintenance_tasks
for update
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat contributors can delete maintenance tasks"
on public.maintenance_tasks
for delete
using (public.has_boat_permission(boat_id, 'delete'));

create policy "Boat members can read haul out items"
on public.haul_out_items
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage haul out items"
on public.haul_out_items
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read inventory usage"
on public.inventory_usage
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage inventory usage"
on public.inventory_usage
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read engine hour logs"
on public.engine_hour_logs
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage engine hour logs"
on public.engine_hour_logs
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read fuel logs"
on public.fuel_logs
for select
using (public.is_boat_member(boat_id));

create policy "Boat contributors can manage fuel logs"
on public.fuel_logs
for all
using (public.has_boat_permission(boat_id, 'edit'))
with check (public.has_boat_permission(boat_id, 'edit'));

create policy "Boat members can read attachments"
on public.attachments
for select
using (
  (boat_id is not null and public.is_boat_member(boat_id))
  or uploaded_by = auth.uid()
  or public.is_superuser()
);

create policy "Boat contributors can manage attachments"
on public.attachments
for all
using (
  (
    boat_id is not null
    and public.has_boat_permission(boat_id, 'manage_attachments')
  )
  or uploaded_by = auth.uid()
  or public.is_superuser()
)
with check (
  (
    boat_id is not null
    and public.has_boat_permission(boat_id, 'manage_attachments')
  )
  or uploaded_by = auth.uid()
  or public.is_superuser()
);

create policy "Users can read their personal searches and allowed shared searches"
on public.saved_searches
for select
using (
  owner_user_id = auth.uid()
  or (
    scope = 'shared'
    and boat_id is not null
    and public.has_boat_permission(boat_id, 'manage_shared_searches')
  )
  or public.is_superuser()
);

create policy "Users can create searches"
on public.saved_searches
for insert
with check (
  owner_user_id = auth.uid()
  and (
    scope = 'personal'
    or (
      scope = 'shared'
      and boat_id is not null
      and public.has_boat_permission(boat_id, 'manage_shared_searches')
    )
  )
);

create policy "Users can update their searches"
on public.saved_searches
for update
using (
  owner_user_id = auth.uid()
  or (
    scope = 'shared'
    and boat_id is not null
    and public.has_boat_permission(boat_id, 'manage_shared_searches')
  )
  or public.is_superuser()
)
with check (
  owner_user_id = auth.uid()
  or (
    scope = 'shared'
    and boat_id is not null
    and public.has_boat_permission(boat_id, 'manage_shared_searches')
  )
  or public.is_superuser()
);

create policy "Users can delete their searches"
on public.saved_searches
for delete
using (
  owner_user_id = auth.uid()
  or (
    scope = 'shared'
    and boat_id is not null
    and public.has_boat_permission(boat_id, 'manage_shared_searches')
  )
  or public.is_superuser()
);

create policy "Boat members can read audit log"
on public.audit_log
for select
using (boat_id is not null and public.is_boat_member(boat_id));

create policy "Boat contributors can write audit log"
on public.audit_log
for insert
with check (
  boat_id is not null
  and public.has_boat_permission(boat_id, 'edit')
);

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "Boat members can read attachment objects"
on storage.objects
for select
using (
  bucket_id = 'attachments'
  and exists (
    select 1
    from public.attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_path = storage.objects.name
      and (
        (attachment.boat_id is not null and public.is_boat_member(attachment.boat_id))
        or attachment.uploaded_by = auth.uid()
        or public.is_superuser()
      )
  )
);

create policy "Boat contributors can upload attachment objects"
on storage.objects
for insert
with check (
  bucket_id = 'attachments'
  and auth.uid() is not null
);

create policy "Boat contributors can update attachment objects"
on storage.objects
for update
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
)
with check (
  bucket_id = 'attachments'
  and auth.uid() is not null
);

create policy "Boat contributors can delete attachment objects"
on storage.objects
for delete
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
);
