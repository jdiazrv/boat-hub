-- Productos del barco (caja de mantenimiento), 2026-10-12.
--
-- Lo que hay a bordo para mantener el barco (grasas, limpiadores, pinturas,
-- masillas…) con su número en la caja, para qué sirve, dónde está, qué hacer
-- cuando se acabe y lo que falta comprar. Distinto del inventario de equipos
-- y repuestos (inventory_items), que va por sistema.
--
-- Las fotos van en public.attachments con target_type = 'boat_product':
-- document_category 'photo' = foto propia, 'catalog' = foto de catálogo.
-- Notas generales de la caja (guías como «Limpiar los winches») en
-- boat_product_notes.
--
-- Idempotente. Aplicar con `supabase db push` o en el SQL editor.

alter type public.attachment_target_type add value if not exists 'boat_product';

create table if not exists public.boat_products (
  id                  uuid primary key default gen_random_uuid(),
  boat_id             uuid not null references public.boats(id) on delete cascade,
  number              integer,
  name                text not null,
  product_type        text,
  usage               text,
  group_name          text,
  location            text,
  status              text not null default 'ok'
                        check (status in ('ok', 'low', 'dont_restock', 'missing')),
  on_finish           text,
  link_url            text,
  winterizing         boolean not null default false,
  notes               text,
  cover_attachment_id uuid references public.attachments(id) on delete set null,
  created_by          uuid references auth.users(id) on delete set null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_boat_products_boat on public.boat_products(boat_id, number);

drop trigger if exists trg_boat_products_updated_at on public.boat_products;
create trigger trg_boat_products_updated_at
before update on public.boat_products
for each row execute function public.set_updated_at();

create table if not exists public.boat_product_notes (
  id          uuid primary key default gen_random_uuid(),
  boat_id     uuid not null references public.boats(id) on delete cascade,
  title       text not null,
  body        text,
  sort_order  integer not null default 0,
  created_by  uuid references auth.users(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_boat_product_notes_boat on public.boat_product_notes(boat_id, sort_order);

drop trigger if exists trg_boat_product_notes_updated_at on public.boat_product_notes;
create trigger trg_boat_product_notes_updated_at
before update on public.boat_product_notes
for each row execute function public.set_updated_at();

-- Mismo criterio que inventory_items: leer los miembros, cambiar quien edita.
alter table public.boat_products enable row level security;
alter table public.boat_product_notes enable row level security;

drop policy if exists "Boat members can read products" on public.boat_products;
create policy "Boat members can read products"
  on public.boat_products for select
  using (public.is_boat_member(boat_id) or public.is_superuser());

drop policy if exists "Boat contributors can manage products" on public.boat_products;
create policy "Boat contributors can manage products"
  on public.boat_products for all
  using (public.has_boat_permission(boat_id, 'edit') or public.is_superuser())
  with check (public.has_boat_permission(boat_id, 'edit') or public.is_superuser());

drop policy if exists "Boat members can read product notes" on public.boat_product_notes;
create policy "Boat members can read product notes"
  on public.boat_product_notes for select
  using (public.is_boat_member(boat_id) or public.is_superuser());

drop policy if exists "Boat contributors can manage product notes" on public.boat_product_notes;
create policy "Boat contributors can manage product notes"
  on public.boat_product_notes for all
  using (public.has_boat_permission(boat_id, 'edit') or public.is_superuser())
  with check (public.has_boat_permission(boat_id, 'edit') or public.is_superuser());
