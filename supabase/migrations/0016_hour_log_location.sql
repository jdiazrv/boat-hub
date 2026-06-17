-- Add location to engine_hour_logs
alter table public.engine_hour_logs
  add column if not exists location text;
