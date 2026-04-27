# Boat Hub

**Plataforma de gestión naval** — mantenimiento, inventario, varadas, bitácora de horas y combustible para flotas privadas.

Construida con React 18 + TypeScript + Vite en el frontend y Supabase (PostgreSQL + Auth + Edge Functions) como backend. Funciona también en **modo demo** sin ninguna credencial.

---

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen de la flota: tareas pendientes, próximas varadas, alertas |
| **Mantenimiento** | Registro completo de tareas correctivas, preventivas, inspecciones y mejoras con historial |
| **Varadas** | Planificación y seguimiento de varadas con coste, varadero y estado |
| **Observaciones** | Registro de incidencias observadas, convertibles a tarea de mantenimiento |
| **Acciones futuras** | Lista de intenciones pendientes de planificar (mejoras, revisiones, ideas) |
| **Compras** | Seguimiento de material pendiente de adquirir |
| **Inventario** | Equipos y repuestos a bordo con stock, ubicación y ficha técnica |
| **Horas motor** | Bitácora de horas por contador con historial |
| **Combustible** | Registro de repostajes con coste, tipo y horas de motor |
| **Marinas** | Directorio de puertos con servicios, contacto y valoración |
| **Varaderos** | Directorio de astilleros con capacidad técnica y tarifas |
| **Exportación** | Descarga de todos los datos a Excel (con portada) o HTML imprimible |
| **Multi-barco** | Soporte para flotas con selector de barco activo |
| **Multi-idioma** | Español / English |
| **Roles** | `superuser`, `owner_admin`, `limited_user`, `read_only` |

---

## Stack técnico

- **Frontend**: React 18, TypeScript, Vite, React Router v6
- **Backend**: Supabase (PostgreSQL 15, Row Level Security, Auth, Edge Functions)
- **Export**: `xlsx` para Excel, HTML estático para impresión
- **Tests**: Playwright

---

## Requisitos previos

- Node.js ≥ 18
- Una cuenta en [supabase.com](https://supabase.com) (gratuita) — o usa el modo demo sin credenciales

---

## Instalación rápida

```bash
git clone https://github.com/TU_USUARIO/boat-hub.git
cd boat-hub
npm install
```

Copia el fichero de entorno:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Arranca en desarrollo:

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173). Sin credenciales la app arranca en modo demo con datos de ejemplo.

---

## Configuración de Supabase

### 1. Esquema de base de datos

En el **SQL Editor** de tu proyecto Supabase ejecuta en orden:

```
supabase/schema.sql   ← tablas, tipos, RLS, permisos
supabase/seed.sql     ← datos iniciales y usuario superuser
```

Opcionalmente, para datos de ejemplo reales:

```
supabase/seed_aldebaran.sql
```

### 2. Edge Function — gestión de usuarios

```bash
supabase functions deploy admin-user-management
```

La función se usa desde el panel Admin → Usuarios para invitar usuarios y asignarles barcos.

### 3. Primer usuario superuser

Crea un usuario en **Authentication → Users** de Supabase, copia su UUID y añádelo al bloque final de `seed.sql` antes de ejecutarlo, o ejecútalo manualmente:

```sql
insert into public.user_roles (user_id, role)
values ('<UUID-del-usuario>', 'superuser');
```

---

## Estructura del proyecto

```
src/
├── components/       # Componentes reutilizables (Modal, FormField, LoadingOverlay…)
├── layouts/          # AppShell con navegación lateral y selector de barco
├── lib/              # Lógica de negocio: db.ts, types.ts, i18n, exportExcel, exportHtml
├── pages/            # Una página por módulo
├── providers/        # Context providers: AppData, Auth, ActiveBoat
└── router.tsx        # Rutas de la aplicación

supabase/
├── schema.sql        # DDL completo con RLS
├── seed.sql          # Datos iniciales
└── functions/        # Edge Functions (Deno)
```

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualización del build |

---

## Roles y permisos

| Rol | Capacidades |
|-----|-------------|
| `superuser` | Acceso total, gestión de propietarios y usuarios |
| `owner_admin` | CRUD completo sobre sus barcos |
| `limited_user` | Crear y editar, sin borrar |
| `read_only` | Solo lectura |

Los permisos se aplican tanto en RLS (PostgreSQL) como en la interfaz.

---

## Modo demo

Si las variables de entorno no están configuradas, la app carga datos de ejemplo locales (`src/data/`) y deshabilita las operaciones de escritura. Útil para explorar la interfaz sin base de datos.

---

## Licencia

MIT
