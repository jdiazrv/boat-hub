-- Migration 0010: boat detail tabs — dimensions, tanks, documents, ORC data

-- ─── Dimensions & ORC data (jsonb on boats) ──────────────────────────────────
alter table public.boats
  add column if not exists dimensions   jsonb null,
  add column if not exists tanks        jsonb null,
  add column if not exists identifiers  jsonb null;

-- ─── Boat documents table ─────────────────────────────────────────────────────
create table if not exists public.boat_documents (
  id            uuid primary key default gen_random_uuid(),
  boat_id       uuid not null references public.boats(id) on delete cascade,
  doc_type      text not null,  -- 'insurance','tepai','seaworthiness','vhf_license','customs','other'
  label         text not null,
  storage_path  text null,
  expiry_date   date null,
  issued_date   date null,
  issuer        text null,
  notes         text null,
  created_by    uuid null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists boat_documents_boat_id_idx on public.boat_documents(boat_id);

-- RLS
alter table public.boat_documents enable row level security;

drop policy if exists "Members can view boat documents" on public.boat_documents;
create policy "Members can view boat documents" on public.boat_documents
  for select using (
    is_superuser()
    or exists (
      select 1 from public.boat_memberships bm
      where bm.boat_id = boat_documents.boat_id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "Members with manage_attachments can insert documents" on public.boat_documents;
create policy "Members with manage_attachments can insert documents" on public.boat_documents
  for insert with check (
    is_superuser()
    or has_boat_permission(boat_id, 'manage_attachments')
  );

drop policy if exists "Members with manage_attachments can update documents" on public.boat_documents;
create policy "Members with manage_attachments can update documents" on public.boat_documents
  for update using (
    is_superuser()
    or has_boat_permission(boat_id, 'manage_attachments')
  );

drop policy if exists "Members with manage_attachments can delete documents" on public.boat_documents;
create policy "Members with manage_attachments can delete documents" on public.boat_documents
  for delete using (
    is_superuser()
    or has_boat_permission(boat_id, 'manage_attachments')
  );
