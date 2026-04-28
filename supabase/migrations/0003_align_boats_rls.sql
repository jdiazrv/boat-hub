-- Align boat write permissions with the current UI.
-- The app only exposes boat create/edit/delete actions to superusers.

alter table public.boats enable row level security;

drop policy if exists "Boat managers can create boats" on public.boats;
create policy "Boat managers can create boats"
on public.boats
for insert
with check (public.is_superuser());

drop policy if exists "Boat managers can update boats" on public.boats;
create policy "Boat managers can update boats"
on public.boats
for update
using (public.is_superuser())
with check (public.is_superuser());

drop policy if exists "Superusers can delete boats" on public.boats;
create policy "Superusers can delete boats"
on public.boats
for delete
using (public.is_superuser());
