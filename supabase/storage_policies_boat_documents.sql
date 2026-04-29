-- Storage RLS policies for boat-documents bucket
-- Path format: boats/<boat_id>/docs/<filename>
-- Uses storage.policies (Supabase managed table)

create policy "boat members can read their docs"
on storage.objects for select
using (
  bucket_id = 'boat-documents'
  and (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.boat_memberships bm
      where bm.user_id = auth.uid()
        and bm.boat_id::text = (string_to_array(name, '/'))[2]
    )
  )
);

create policy "boat members with manage_attachments can upload"
on storage.objects for insert
with check (
  bucket_id = 'boat-documents'
  and (
    auth.role() = 'service_role'
    or public.has_boat_permission(
      (string_to_array(name, '/'))[2]::uuid,
      'manage_attachments'
    )
  )
);

create policy "boat members with manage_attachments can delete"
on storage.objects for delete
using (
  bucket_id = 'boat-documents'
  and (
    auth.role() = 'service_role'
    or public.has_boat_permission(
      (string_to_array(name, '/'))[2]::uuid,
      'manage_attachments'
    )
  )
);
