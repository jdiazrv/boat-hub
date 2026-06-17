-- Add tank_id to fuel_logs to track which tank was filled
alter table public.fuel_logs
  add column if not exists tank_id text;
