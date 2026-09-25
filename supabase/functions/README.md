# Supabase Edge Functions

## `admin-user-management`

Funcion segura para que un `superuser` pueda:

- invitar o crear usuarios en Supabase Auth
- asignarles barcos
- aplicar permisos por defecto segun rol

### Despliegue

Desde la carpeta del proyecto:

```bash
supabase functions deploy admin-user-management --project-ref baovynyqzjbbzroyoeod
```

### Variables necesarias

En Supabase Edge Functions deben existir:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase suele inyectar `SUPABASE_URL`, pero conviene confirmar las tres.

### Uso desde frontend

El frontend llama:

```ts
supabase.functions.invoke("admin-user-management", { body })
```

La funcion valida `user_profiles.is_superuser` y, por compatibilidad con usuarios antiguos, tambien acepta una membresia legacy con rol `superuser`.

## `ingest-engine-hours`

Recibe la lectura del contador de horas desde el barco (plugin de Signal K
de REWIND), al apagar el motor. El aparato se identifica con un token
propio (`x-device-token: blg_…`), creado en Configuración › Contadores de
horas › Conectar un aparato, que solo sirve para añadir lecturas a ese
contador. Requiere la migración `0018_hour_counter_devices.sql`.

```bash
supabase functions deploy ingest-engine-hours --no-verify-jwt --project-ref baovynyqzjbbzroyoeod
```

`--no-verify-jwt` es necesario: el token del aparato no es un JWT de
Supabase. Usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

Petición: `POST` con `{"hours": 1648.2, "loggedAt": "2026-09-25T10:00:00Z"}`.
Respuestas: 200 `{ok, stored}` (no guarda si es la misma lectura), 401 token
no válido o revocado, 409 lectura menor que la última.
