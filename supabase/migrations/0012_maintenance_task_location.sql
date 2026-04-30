alter table public.maintenance_tasks
  add column if not exists location text;
