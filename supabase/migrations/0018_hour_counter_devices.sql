-- Horas de motor automáticas desde el barco (REWIND, 2026-09-25).
--
-- Un aparato del barco (el plugin de Signal K de REWIND) manda la lectura
-- del contador de horas cada vez que se apaga el motor. No inicia sesión:
-- lleva un token propio, ligado a UN contador, que solo sirve para añadir
-- lecturas a ese contador (lo comprueba la edge function
-- ingest-engine-hours, que escribe con service role). Aquí solo se guarda
-- el hash del token: el token en claro se enseña una vez, al crearlo.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.hour_counter_devices (
  id               uuid primary key default gen_random_uuid(),
  boat_id          uuid not null references public.boats(id) on delete cascade,
  hour_counter_id  uuid not null references public.hour_counters(id) on delete cascade,
  name             text not null,
  token_hash       text not null unique,
  created_by       uuid references auth.users(id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  last_used_at     timestamptz,
  last_value_hours numeric(10,2),
  revoked_at       timestamptz
);

create index if not exists idx_hcd_boat on public.hour_counter_devices(boat_id);
create index if not exists idx_hcd_counter on public.hour_counter_devices(hour_counter_id);

alter table public.hour_counter_devices enable row level security;

-- Ver, revocar y borrar: quien puede editar el barco. Crear, solo por la
-- función de abajo (no hay política de insert).
drop policy if exists "Editors read their boat devices" on public.hour_counter_devices;
create policy "Editors read their boat devices"
  on public.hour_counter_devices for select
  using (public.has_boat_permission(boat_id, 'edit') or public.is_superuser());

drop policy if exists "Editors revoke their boat devices" on public.hour_counter_devices;
create policy "Editors revoke their boat devices"
  on public.hour_counter_devices for update
  using (public.has_boat_permission(boat_id, 'edit') or public.is_superuser())
  with check (public.has_boat_permission(boat_id, 'edit') or public.is_superuser());

drop policy if exists "Editors delete their boat devices" on public.hour_counter_devices;
create policy "Editors delete their boat devices"
  on public.hour_counter_devices for delete
  using (public.has_boat_permission(boat_id, 'edit') or public.is_superuser());

-- Crea un aparato para un contador y devuelve su token EN CLARO (la única
-- vez que existe fuera del aparato).
create or replace function public.create_hour_counter_device(
  p_hour_counter_id uuid,
  p_name text
) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_boat  uuid;
  v_token text;
begin
  select boat_id into v_boat from public.hour_counters where id = p_hour_counter_id;
  if v_boat is null then
    raise exception 'Contador no encontrado';
  end if;
  if not (public.has_boat_permission(v_boat, 'edit') or public.is_superuser()) then
    raise exception 'Sin permiso para este barco';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'El nombre es obligatorio';
  end if;
  v_token := 'blg_' || encode(gen_random_bytes(24), 'hex');
  insert into public.hour_counter_devices (boat_id, hour_counter_id, name, token_hash)
  values (v_boat, p_hour_counter_id, trim(p_name), encode(digest(v_token, 'sha256'), 'hex'));
  return v_token;
end;
$$;

revoke all on function public.create_hour_counter_device(uuid, text) from public;
grant execute on function public.create_hour_counter_device(uuid, text) to authenticated;

-- De qué contador son las horas de cada tarea del plan. Opcional: sin él,
-- la web usa el contador del barco si solo hay uno, o el del motor.
alter table public.boat_maintenance_schedule
  add column if not exists hour_counter_id uuid
  references public.hour_counters(id) on delete set null;
