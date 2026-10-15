-- Al registrar una tarea hecha, el plan del barco se actualizaba solo si la
-- plantilla (o el ajuste del barco) tenía intervalo. Las plantillas de Volvo
-- ("Fuel filter replacement — 500 h or 1 year") no lo tienen: el intervalo
-- está en el propio plan. Resultado: el filtro de gasoil de REWIND de 2025
-- nunca contó. Ahora el intervalo es el del ajuste del barco, si no el de la
-- plantilla, y si no el que ya tenía el plan.

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

  select
    coalesce(o.interval_days, t.interval_days),
    coalesce(o.interval_hours, t.interval_hours)
  into v_interval_days, v_interval_hours
  from public.maintenance_templates t
  left join public.boat_catalog_overrides o
    on o.boat_id = new.boat_id
   and o.template_id = t.id
  where t.id = new.template_id;

  update public.boat_maintenance_schedule schedule
  set
    interval_days = coalesce(v_interval_days, schedule.interval_days),
    interval_hours = coalesce(v_interval_hours, schedule.interval_hours),
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

-- Las tareas ya hechas que no llegaron a su plan por esto.
update public.maintenance_tasks m
set template_id = m.template_id
from public.boat_maintenance_schedule s
where s.boat_id = m.boat_id
  and s.template_id = m.template_id
  and m.status = 'done'
  and m.completed_at is not null
  and (s.last_done_at is null or m.completed_at::date > s.last_done_at);
