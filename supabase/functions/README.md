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
