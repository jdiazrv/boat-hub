-- Keep periodic tracking aligned when a tracked catalog-based task is completed.
-- Important: completing a task must not enable periodic tracking by itself.

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

drop trigger if exists trg_sync_completed_maintenance_task_to_schedule on public.maintenance_tasks;
create trigger trg_sync_completed_maintenance_task_to_schedule
after insert or update of template_id, status, completed_at, engine_hours, notes
on public.maintenance_tasks
for each row
execute function public.sync_completed_maintenance_task_to_schedule();
