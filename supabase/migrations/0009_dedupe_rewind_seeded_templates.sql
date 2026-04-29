begin;

-- REWIND imported a handful of boat-specific templates before the global
-- maintenance catalog and engine plans existed. Keep the real task history,
-- but point it at the matching global template so the catalog does not show
-- near-duplicates such as "Cambio de aceite y filtro" beside the global
-- "Cambio de aceite de motor y filtro".
with rewind as (
  select id
  from public.boats
  where identifier = 'dehler-47-rewind'
),
source_template as (
  select t.id
  from public.maintenance_templates t
  join rewind b on b.id = t.boat_id
  where t.title = 'Cambio de aceite y filtro'
  limit 1
),
target_template as (
  select t.id
  from public.maintenance_templates t
  join public.system_catalog s on s.id = t.system_id
  where t.boat_id is null
    and s.code = 'engine-propulsion'
    and lower(coalesce(t.title_es, t.title)) = lower('Cambio de aceite de motor y filtro')
  limit 1
)
update public.maintenance_tasks task
set template_id = target_template.id
from source_template, target_template
where task.template_id = source_template.id;

-- Remove only the exact REWIND templates created by the old seed, and only
-- when they are no longer referenced anywhere.
with rewind as (
  select id
  from public.boats
  where identifier = 'dehler-47-rewind'
),
old_templates as (
  select t.id
  from public.maintenance_templates t
  join rewind b on b.id = t.boat_id
  where t.title in (
    'Cambio de aceite y filtro',
    'Cambio de impeller',
    'Filtros de combustible',
    'Correas y tensores',
    'Aceite de transmisión',
    'Refrigerante',
    'Ánodo de sacrificio del eje',
    'EPIRB — revisión y batería',
    'Bengalas — renovación',
    'Balsa salvavidas — revisión'
  )
)
delete from public.maintenance_templates t
using old_templates old
where t.id = old.id
  and not exists (
    select 1
    from public.maintenance_tasks task
    where task.template_id = t.id
  )
  and not exists (
    select 1
    from public.boat_maintenance_schedule schedule
    where schedule.template_id = t.id
  )
  and not exists (
    select 1
    from public.maintenance_schedule_plan_items item
    where item.template_id = t.id
  );

commit;
