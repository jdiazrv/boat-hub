-- Un solo catálogo de sistemas.
--
-- La importación del ENJOY creó 34 sistemas propios ("enjoy_*", solo en inglés)
-- que repetían los 28 del catálogo ("Electrical", "Electrical System",
-- "Eléctrico y baterías"...). Cada uno pasa a su sistema del catálogo.
--
-- Ojo: borrar un boat_system borra en cascada sus tareas, observaciones e
-- inventario. Por eso primero se mueve todo lo que cuelga de él al sistema
-- que queda, y solo entonces se borra.

begin;

create temporary table system_merge (from_code text primary key, to_code text not null) on commit drop;

insert into system_merge (from_code, to_code) values
  ('enjoy_sails_and_rigging', 'sails'),
  ('enjoy_deck_gear_and_cockpit', 'winches-deck-gear'),
  ('enjoy_hull_underwater_and_steering', 'hull-deck'),
  ('enjoy_engine_and_propulsion', 'engine-propulsion'),
  ('enjoy_electronics_and_navigation', 'electronics-nav'),
  ('enjoy_communications', 'communication'),
  ('enjoy_electrical_system', 'electrical'),
  ('enjoy_solar_charging_and_energy_generation', 'electrical'),
  ('enjoy_ac_220v_system', 'electrical'),
  ('enjoy_plumbing_and_water_systems', 'plumbing-pumps'),
  ('enjoy_heating_and_comfort', 'ventilation'),
  ('enjoy_galley_and_gas', 'galley'),
  ('enjoy_heads_and_waste', 'plumbing-pumps'),
  ('enjoy_safety', 'safety-equipment'),
  ('enjoy_tender', 'dinghy-outboard'),
  ('enjoy_interior_and_accommodation', 'interior'),
  ('enjoy_openings_hatches_and_portlights', 'hatches-ports'),
  ('enjoy_tools', 'tools-spares'),
  ('enjoy_spares', 'tools-spares'),
  ('enjoy_steering_systems', 'autopilot-steering'),
  ('enjoy_hull_zincs_and_deck', 'hull-deck'),
  ('enjoy_plumbing_and_pumps', 'plumbing-pumps'),
  ('enjoy_rigging_and_winches', 'standing-rigging'),
  ('enjoy_hatches_and_portlghts', 'hatches-ports'),
  ('enjoy_electronics_and_radar', 'electronics-nav'),
  ('enjoy_safety_equipment', 'safety-equipment'),
  ('enjoy_electrical', 'electrical'),
  ('enjoy_fresh_water', 'fresh-water'),
  ('enjoy_other_and_miscellaneous', 'other'),
  ('enjoy_interior_furniture', 'interior'),
  ('enjoy_sails', 'sails'),
  ('enjoy_ground_tackle_and_anchoring', 'anchoring-mooring'),
  ('enjoy_galley_equipment', 'galley'),
  ('enjoy_dinghy_and_motor', 'dinghy-outboard');

do $$
declare
  r record;
  v_to_system uuid;
  v_keep uuid;
begin
  for r in
    select bs.id, bs.boat_id, m.to_code
    from public.boat_systems bs
    join public.system_catalog c on c.id = bs.system_id
    join system_merge m on m.from_code = c.code
    order by bs.created_at
  loop
    select id into strict v_to_system from public.system_catalog where code = r.to_code;
    select id into v_keep from public.boat_systems
      where boat_id = r.boat_id and system_id = v_to_system;

    if v_keep is null then
      update public.boat_systems set system_id = v_to_system where id = r.id;
    else
      update public.boat_components  set boat_system_id = v_keep where boat_system_id = r.id;
      update public.preventive_plans set boat_system_id = v_keep where boat_system_id = r.id;
      update public.observations     set boat_system_id = v_keep where boat_system_id = r.id;
      update public.future_actions   set boat_system_id = v_keep where boat_system_id = r.id;
      update public.inventory_items  set boat_system_id = v_keep where boat_system_id = r.id;
      update public.future_purchases set boat_system_id = v_keep where boat_system_id = r.id;
      update public.maintenance_tasks set boat_system_id = v_keep where boat_system_id = r.id;
      update public.haul_out_items   set boat_system_id = v_keep where boat_system_id = r.id;
      delete from public.boat_systems where id = r.id;
    end if;
  end loop;
end $$;

-- Ya no los usa nadie.
delete from public.system_catalog c
using system_merge m
where c.code = m.from_code;

-- La calefacción del ENJOY entra aquí.
update public.system_catalog
set name_es = 'Ventilación y calefacción', name_en = 'Ventilation and Heating'
where code = 'ventilation';

commit;
