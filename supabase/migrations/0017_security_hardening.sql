-- Security hardening found in the audit of 2026-09-20.
-- Review, then apply with `supabase db push` (or paste into the SQL editor).
-- Everything here is idempotent.

-- ── 1. attachments bucket: writes were open to ANY authenticated user ────────
-- The insert/update/delete policies only checked `auth.uid() is not null`, so a
-- logged-in user from one boat could overwrite or delete another boat's files.
-- Object paths are `<boat_id>/<target_type>/<target_id>/<uuid>-<name>`, so the
-- first folder is the boat id. It is compared as text on purpose: casting it to
-- uuid could raise an error while Postgres evaluates the policy on other buckets.

drop policy if exists "Boat contributors can upload attachment objects" on storage.objects;
drop policy if exists "Boat contributors can update attachment objects" on storage.objects;
drop policy if exists "Boat contributors can delete attachment objects" on storage.objects;

create policy "Boat contributors can upload attachment objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'attachments'
  and (
    public.is_superuser()
    or exists (
      select 1 from public.boats b
      where b.id::text = (storage.foldername(name))[1]
        and public.has_boat_permission(b.id, 'manage_attachments')
    )
  )
);

create policy "Boat contributors can update attachment objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'attachments'
  and (
    public.is_superuser()
    or exists (
      select 1 from public.boats b
      where b.id::text = (storage.foldername(name))[1]
        and public.has_boat_permission(b.id, 'manage_attachments')
    )
  )
)
with check (
  bucket_id = 'attachments'
  and (
    public.is_superuser()
    or exists (
      select 1 from public.boats b
      where b.id::text = (storage.foldername(name))[1]
        and public.has_boat_permission(b.id, 'manage_attachments')
    )
  )
);

create policy "Boat contributors can delete attachment objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'attachments'
  and (
    public.is_superuser()
    or exists (
      select 1 from public.boats b
      where b.id::text = (storage.foldername(name))[1]
        and public.has_boat_permission(b.id, 'manage_attachments')
    )
  )
);

-- ── 1b. attachments table: `uploaded_by = auth.uid()` was not scoped to a boat ─
-- A user could insert a row pointing at ANY boat_id as long as uploaded_by was
-- themselves, and that row would then be visible to the other boat's members.
-- Inserting/updating now requires the boat permission (or a boat-less row of
-- their own). Reading and deleting one's own rows is unchanged.

drop policy if exists "Boat contributors can manage attachments" on public.attachments;

create policy "Boat contributors can manage attachments"
on public.attachments for all
using (
  (boat_id is not null and public.has_boat_permission(boat_id, 'manage_attachments'))
  or uploaded_by = auth.uid()
  or public.is_superuser()
)
with check (
  (boat_id is not null and public.has_boat_permission(boat_id, 'manage_attachments'))
  or (boat_id is null and uploaded_by = auth.uid())
  or public.is_superuser()
);

-- ── 2. Upload limits on both buckets ─────────────────────────────────────────
-- Stops oversized files and active content (HTML/SVG/JS) being stored and then
-- served from the Supabase domain. Adjust the list if you need other formats.

update storage.buckets
set file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif',
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
where id in ('attachments', 'boat-documents');

-- ── 3. system_spare_references: global catalog writable by every user ───────
-- Any authenticated user could insert, edit or delete the shared spare-parts
-- catalog. Reads stay open; writes are restricted to superusers.

drop policy if exists "Authenticated users can manage system spare references"
  on public.system_spare_references;

create policy "Superusers can manage system spare references"
  on public.system_spare_references for all
  using (public.is_superuser())
  with check (public.is_superuser());

-- ── 4. Tables created without row level security ─────────────────────────────
-- Without RLS, Supabase's default grants expose these tables to the anon role
-- through PostgREST (including writes).

alter table public.permission_catalog enable row level security;
alter table public.preventive_templates enable row level security;

drop policy if exists "Authenticated users can read permission catalog" on public.permission_catalog;
create policy "Authenticated users can read permission catalog"
  on public.permission_catalog for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read preventive templates" on public.preventive_templates;
create policy "Authenticated users can read preventive templates"
  on public.preventive_templates for select
  using (auth.role() = 'authenticated');

drop policy if exists "Superusers can manage preventive templates" on public.preventive_templates;
create policy "Superusers can manage preventive templates"
  on public.preventive_templates for all
  using (public.is_superuser())
  with check (public.is_superuser());
