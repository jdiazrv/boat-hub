-- Allow boat managers to edit the boats they manage.
-- Creation and deletion remain limited to superusers.

alter table public.boats enable row level security;

drop policy if exists "Boat managers can update boats" on public.boats;
create policy "Boat managers can update boats"
on public.boats
for update
using (public.has_boat_permission(id, 'edit'))
with check (public.has_boat_permission(id, 'edit'));
