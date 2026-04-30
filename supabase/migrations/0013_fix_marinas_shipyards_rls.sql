-- Fix RLS: allow creators to update/delete their own marinas and shipyards

-- Marinas
drop policy if exists "Users can update their marinas" on public.marinas;
drop policy if exists "Users can delete their marinas" on public.marinas;

create policy "Users can update their marinas"
  on public.marinas for update
  using (auth.uid() is not null and (created_by = auth.uid() or is_superuser()))
  with check (auth.uid() is not null and (created_by = auth.uid() or is_superuser()));

create policy "Users can delete their marinas"
  on public.marinas for delete
  using (auth.uid() is not null and (created_by = auth.uid() or is_superuser()));

-- Shipyards
drop policy if exists "Superusers can update shipyards" on public.shipyards;
drop policy if exists "Superusers can delete shipyards" on public.shipyards;

create policy "Users can update their shipyards"
  on public.shipyards for update
  using (auth.uid() is not null and (created_by = auth.uid() or is_superuser()))
  with check (auth.uid() is not null and (created_by = auth.uid() or is_superuser()));

create policy "Users can delete their shipyards"
  on public.shipyards for delete
  using (auth.uid() is not null and (created_by = auth.uid() or is_superuser()));
