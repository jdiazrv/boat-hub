-- Create the boat-documents storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('boat-documents', 'boat-documents', false)
on conflict (id) do nothing;

-- Drop existing policies to recreate them cleanly
drop policy if exists "Members can read boat documents" on storage.objects;
drop policy if exists "Members can upload boat documents" on storage.objects;
drop policy if exists "Members can delete boat documents" on storage.objects;

-- Allow any authenticated user who is a member of the boat to read (download / signed URL)
create policy "Members can read boat documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'boat-documents'
  and (
    is_superuser()
    or exists (
      select 1
      from public.boat_memberships bm
      where bm.user_id = auth.uid()
        and bm.boat_id::text = (string_to_array(name, '/'))[2]
    )
  )
);

-- Allow members with upload permission (owner_admin or higher) to insert
create policy "Members can upload boat documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'boat-documents'
  and (
    is_superuser()
    or exists (
      select 1
      from public.boat_memberships bm
      where bm.user_id = auth.uid()
        and bm.boat_id::text = (string_to_array(name, '/'))[2]
        and bm.role in ('owner_admin', 'superuser')
    )
  )
);

-- Allow members to delete their own uploads
create policy "Members can delete boat documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'boat-documents'
  and (
    is_superuser()
    or exists (
      select 1
      from public.boat_memberships bm
      where bm.user_id = auth.uid()
        and bm.boat_id::text = (string_to_array(name, '/'))[2]
        and bm.role in ('owner_admin', 'superuser')
    )
  )
);
