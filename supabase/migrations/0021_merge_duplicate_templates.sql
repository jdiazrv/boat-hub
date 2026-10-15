-- Una sola plantilla por trabajo.
--
-- Había pares repetidos: la plantilla general del catálogo y una copia propia
-- de un barco con otro intervalo ("Freshwater coolant replacement" y "Replace
-- engine coolant"), y alguna general repetida. Al registrar una tarea con la
-- copia, el plan del barco no se enteraba si usaba la otra (el filtro de
-- gasoil de REWIND de 2025 no contaba en su plan).
--
-- Se queda la general, que ven todos los barcos. Si la que se quita era propia
-- de un barco, su intervalo pasa a ser el ajuste de ese barco
-- (boat_catalog_overrides), que es para lo que existe.

begin;

create or replace function pg_temp.merge_template(p_from uuid, p_to uuid) returns void
language plpgsql as $$
declare
  v_from public.maintenance_templates%rowtype;
begin
  select * into strict v_from from public.maintenance_templates where id = p_from;

  -- Intervalo propio del barco -> ajuste del barco sobre la general.
  if v_from.boat_id is not null and (v_from.interval_days is not null or v_from.interval_hours is not null) then
    insert into public.boat_catalog_overrides (boat_id, template_id, interval_days, interval_hours)
    values (v_from.boat_id, p_to, v_from.interval_days, v_from.interval_hours)
    on conflict (boat_id, template_id) do update
      set interval_days = excluded.interval_days, interval_hours = excluded.interval_hours;
  end if;
  -- Ajustes que hubiera sobre la que se quita (y sus repuestos).
  update public.boat_catalog_overrides o set template_id = p_to
    where o.template_id = p_from
      and not exists (select 1 from public.boat_catalog_overrides x where x.boat_id = o.boat_id and x.template_id = p_to);

  -- Plan de cada barco: si ya tenía la general, se queda esa.
  delete from public.boat_maintenance_schedule s
    where s.template_id = p_from
      and exists (select 1 from public.boat_maintenance_schedule x where x.boat_id = s.boat_id and x.template_id = p_to);
  update public.boat_maintenance_schedule set template_id = p_to where template_id = p_from;

  delete from public.maintenance_schedule_plan_items i
    where i.template_id = p_from
      and exists (select 1 from public.maintenance_schedule_plan_items x where x.plan_id = i.plan_id and x.template_id = p_to);
  update public.maintenance_schedule_plan_items set template_id = p_to where template_id = p_from;

  update public.system_spare_references set template_id = p_to where template_id = p_from;

  -- El historial: dispara la sincronización con el plan.
  update public.maintenance_tasks set template_id = p_to where template_id = p_from;

  delete from public.maintenance_templates where id = p_from;
end $$;

-- Copias propias de REWIND -> general
select pg_temp.merge_template('8bd5db9b-6aa5-48c6-bb9f-5ec2b21a2d47', '55ebfea1-eb79-42d1-bac3-18646db0b763'); -- coolant
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like '78c361cf%'), (select id from public.maintenance_templates where id::text like '407c2532%')); -- heat exchanger
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like '59b328f8%'), (select id from public.maintenance_templates where id::text like 'af98d99d%')); -- impeller
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like 'bc2ee511%'), (select id from public.maintenance_templates where id::text like '39bb6af5%')); -- seawater strainer
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like 'c7f343ee%'), (select id from public.maintenance_templates where id::text like '8dd775b8%')); -- exhaust elbow
-- Copias propias de ENJOY -> general
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like 'd990a6fb%'), (select id from public.maintenance_templates where id::text like '2c913557%')); -- life raft
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like '9bf34f7b%'), (select id from public.maintenance_templates where id::text like 'b50d2147%')); -- EPIRB
-- Generales repetidas
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like '52a33b86%'), (select id from public.maintenance_templates where id::text like 'a9842660%')); -- fuel filter
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like 'bca77caa%'), (select id from public.maintenance_templates where id::text like 'bce597cf%')); -- rudder shaft
select pg_temp.merge_template((select id from public.maintenance_templates where id::text like 'bf097fb2%'), (select id from public.maintenance_templates where id::text like 'ebbbf970%')); -- water tanks

commit;
