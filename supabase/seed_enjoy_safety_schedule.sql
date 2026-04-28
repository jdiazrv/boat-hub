-- Seed safety equipment preventive schedule for Moody 425 ENJOY
-- EPIRB, bengalas y balsa — última revisión 2023-06-01
-- Idempotent: no duplica templates ni entradas de schedule.

begin;

-- Ensure the boat exists
insert into public.boats (name, identifier, brand_model, boat_type)
values ('ENJOY', 'moody-425-enjoy', 'Moody 425', 'Sailboat')
on conflict (identifier) do nothing;

-- Ensure the safety-equipment system catalog entry exists
insert into public.system_catalog (code, name_es, name_en, sort_order)
values ('safety-equipment', 'Seguridad', 'Safety Equipment', 170)
on conflict (code) do update set name_es = excluded.name_es, name_en = excluded.name_en;

-- Create maintenance templates for EPIRB, bengalas y balsa
insert into public.maintenance_templates (boat_id, system_id, title, title_es, title_en, description, interval_days, default_priority)
select
  b.id,
  s.id,
  entry.title,
  entry.title_es,
  entry.title_en,
  entry.description,
  entry.interval_days,
  'critical'::public.priority_level
from public.boats b
cross join public.system_catalog s
cross join (values
  (
    'EPIRB — revisión y batería',
    'EPIRB — revisión y batería',
    'EPIRB — service and battery',
    'Revisión periódica del EPIRB y sustitución de batería',
    1825
  ),
  (
    'Bengalas — renovación',
    'Bengalas — renovación',
    'Flares — renewal',
    'Sustitución de bengalas caducadas',
    1095
  ),
  (
    'Balsa salvavidas — revisión',
    'Balsa salvavidas — revisión',
    'Life raft — service',
    'Revisión anual de la balsa salvavidas en taller homologado',
    365
  ),
  (
    'Botella de buceo 1 — prueba hidrostática',
    'Botella de buceo 1 — prueba hidrostática',
    'Diving tank 1 — hydrostatic test',
    'Prueba hidrostática periódica de la botella de buceo nº 1',
    1825
  ),
  (
    'Botella de buceo 2 — prueba hidrostática',
    'Botella de buceo 2 — prueba hidrostática',
    'Diving tank 2 — hydrostatic test',
    'Prueba hidrostática periódica de la botella de buceo nº 2',
    1825
  )
) as entry(title, title_es, title_en, description, interval_days)
where b.identifier = 'moody-425-enjoy'
  and s.code = 'safety-equipment'
  and not exists (
    select 1 from public.maintenance_templates t
    where t.boat_id = b.id and lower(t.title) = lower(entry.title)
  );

-- Add entries to boat_maintenance_schedule with last done 2023-06-01
insert into public.boat_maintenance_schedule (boat_id, template_id, interval_days, last_done_at, notes)
select
  b.id,
  t.id,
  t.interval_days,
  '2023-06-01'::date,
  'Última revisión: 1 junio 2023'
from public.boats b
join public.maintenance_templates t on t.boat_id = b.id
where b.identifier = 'moody-425-enjoy'
  and lower(t.title) in (
    'epirb — revisión y batería',
    'bengalas — renovación',
    'balsa salvavidas — revisión'
  )
  and not exists (
    select 1 from public.boat_maintenance_schedule s
    where s.boat_id = b.id and s.template_id = t.id
  );

-- Add entries for diving tanks with last done 2024-06-01
insert into public.boat_maintenance_schedule (boat_id, template_id, interval_days, last_done_at, notes)
select
  b.id,
  t.id,
  t.interval_days,
  '2024-06-01'::date,
  'Última prueba hidrostática: 1 junio 2024'
from public.boats b
join public.maintenance_templates t on t.boat_id = b.id
where b.identifier = 'moody-425-enjoy'
  and lower(t.title) in (
    'botella de buceo 1 — prueba hidrostática',
    'botella de buceo 2 — prueba hidrostática'
  )
  and not exists (
    select 1 from public.boat_maintenance_schedule s
    where s.boat_id = b.id and s.template_id = t.id
  );

commit;
