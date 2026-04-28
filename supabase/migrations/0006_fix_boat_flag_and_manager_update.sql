-- Make boat flag storage and manager updates robust on existing databases.

alter table public.boats
  add column if not exists flag char(2) null;

alter table public.boats enable row level security;

drop policy if exists "Boat managers can update boats" on public.boats;
create policy "Boat managers can update boats"
on public.boats
for update
using (
  public.has_boat_permission(id, 'edit')
  or exists (
    select 1
    from public.boat_memberships membership
    where membership.boat_id = boats.id
      and membership.user_id = auth.uid()
      and membership.role in ('owner_admin', 'superuser')
  )
)
with check (
  public.has_boat_permission(id, 'edit')
  or exists (
    select 1
    from public.boat_memberships membership
    where membership.boat_id = boats.id
      and membership.user_id = auth.uid()
      and membership.role in ('owner_admin', 'superuser')
  )
);
