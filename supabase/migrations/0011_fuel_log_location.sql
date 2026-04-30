-- Add location column to fuel_logs for geocoded place name
alter table public.fuel_logs
  add column if not exists location text;
