# Supabase database

Esquema principal: [`schema.sql`](/Users/juandiaz/Library/CloudStorage/Dropbox/MOODY/Proyectos/Projects/chain%20counter%20ESP32%20mejorado/mantenimiento-barcos-web/supabase/schema.sql)

## Que cubre

- Usuarios, perfiles y alta automatica desde `auth.users`.
- Barcos, armadores y relacion muchos a muchos.
- Membresias por barco con permisos por accion.
- Catalogo maestro de sistemas y sistemas activados por barco.
- Componentes o equipos.
- Preventivos tipo y preventivos planificados por barco.
- Mantenimientos, observaciones, varadas, operaciones de varada.
- Acciones futuras y compras futuras.
- Inventario y consumo de repuestos.
- Contadores de horas y repostajes.
- Marinas y varaderos.
- Adjuntos en Storage.
- Busquedas guardadas e historial tecnico.

## Como aplicarlo

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor.
3. Ejecuta todo el contenido de `schema.sql`.
4. Crea un usuario de prueba en Authentication.
5. Inserta una fila en `boat_memberships` para ese usuario y el barco que quieras administrar.
6. Asigna permisos en `boat_membership_permissions`.

## Permisos recomendados para un administrador de barco

- `view`
- `create`
- `edit`
- `delete`
- `close`
- `approve`
- `manage_users`
- `manage_attachments`
- `manage_shared_searches`

## Siguiente paso natural

Conectar el frontend para que lea:

- `boats`
- `preventive_plans`
- `maintenance_tasks`
- `inventory_items`
- `future_actions`
- `future_purchases`
