-- Completing a maintenance task should update periodic tracking only when that
-- catalog item was already marked for tracking.

create or replace function public.sync_completed_maintenance_task_to_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interval_days integer;
  v_interval_hours integer;
begin
  if new.template_id is null or new.status <> 'done' or new.completed_at is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.boat_maintenance_schedule schedule
    where schedule.boat_id = new.boat_id
      and schedule.template_id = new.template_id
  ) then
    return new;
  end if;

  select
    coalesce(o.interval_days, t.interval_days),
    coalesce(o.interval_hours, t.interval_hours)
  into v_interval_days, v_interval_hours
  from public.maintenance_templates t
  left join public.boat_catalog_overrides o
    on o.boat_id = new.boat_id
   and o.template_id = t.id
  where t.id = new.template_id;

  if v_interval_days is null and v_interval_hours is null then
    return new;
  end if;

  update public.boat_maintenance_schedule schedule
  set
    interval_days = v_interval_days,
    interval_hours = v_interval_hours,
    last_done_at = new.completed_at::date,
    last_done_engine_hours = new.engine_hours::integer,
    last_done_notes = new.notes
  where schedule.boat_id = new.boat_id
    and schedule.template_id = new.template_id
    and (
      schedule.last_done_at is null
      or new.completed_at::date >= schedule.last_done_at
    );

  return new;
end;
$$;

delete from public.boat_maintenance_schedule schedule
using public.boats boat, public.maintenance_templates template
where schedule.boat_id = boat.id
  and schedule.template_id = template.id
  and boat.identifier = 'dehler-47-rewind'
  and template.boat_id = boat.id
  and template.title = 'Cambio de aceite y filtro'
  and schedule.last_done_at = date '2026-04-29';
