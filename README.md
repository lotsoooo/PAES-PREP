# PAES-PREP

Plataforma de preparación para la PAES (ensayos, contenidos, planes y estadísticas).
Monorepo con Bun workspaces: `apps/api` (Hono + Drizzle + Postgres) y
`apps/web` (React 19 + Vite + Tailwind v4).

## Requisitos

- [Bun](https://bun.sh) >= 1.2
- Un Postgres accesible. Dos caminos:
  - **Remoto (recomendado si Docker no arranca):** Supabase/Neon. Solo necesitas el
    `DATABASE_URL`.
  - **Local:** Docker Desktop + `bun run db:up`.

## Puesta en marcha

```bash
# 1. Dependencias
bun install

# 2. Variables de entorno (el .env vive en la raíz y NO se sube al repo)
cp .env.example .env
#   - genera secretos:  openssl rand -base64 48
#   - define DATABASE_URL con tu Postgres
```

`DATABASE_URL` según proveedor:

```bash
# Supabase — Session pooler (recomendado: la conexión directa db.<ref>.supabase.co
# suele ser IPv6-only y no resuelve en muchas redes IPv4).
# El shape del host es aws-0-<region> o aws-1-<region>; cópialo de
# Dashboard → Connect → Session pooler.
DATABASE_URL=postgresql://postgres.<ref>:TU_PASSWORD@aws-1-<region>.pooler.supabase.com:5432/postgres?sslmode=require

# Supabase — conexión directa (solo si tu red tiene IPv4/IPv6 que resuelve)
DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.<ref>.supabase.co:5432/postgres

# Docker local
DATABASE_URL=postgres://paes:paes_local_dev@localhost:5432/paes_pro
```

Si la contraseña tiene caracteres especiales, codifícalos en la URL (`@`→`%40`,
espacio→`%20`, etc.).

```bash
# 3. Aplicar esquema + catálogos, y luego los datos demo
bun run db:reset   # database/schema.sql + database/seed.sql (idempotente)
bun run db:seed    # usuarios demo e intentos históricos (usa Bun.password)

# 4. Levantar API (3000) y web (5173) a la vez
bun run dev
```

- Web: http://localhost:5173
- API health: http://localhost:3000/api/v1/health  (`{"status":"ok","database":true}`)

## Scripts útiles

| Script | Qué hace |
| ------ | -------- |
| `bun run dev` | API + web en watch |
| `bun run build` | Build de producción |
| `bun run typecheck` | `tsc` en todos los workspaces |
| `bun run lint` / `lint:fix` | ESLint |
| `bun run test` | Tests (bun test / vitest) |
| `bun run db:reset` | Aplica `schema.sql` + `seed.sql` |
| `bun run db:seed` | Datos demo |
| `bun run db:pull` | Regenera `apps/api/src/db/schema.ts` desde la DB |
| `bun run db:up` / `db:down` | Postgres local con Docker |

## Notas de arquitectura

- La **fuente de verdad del modelo** es `database/schema.sql`; Drizzle solo tipa y
  consulta. Ver `docs/DECISIONES.md` (D-001).
- El `.env` de la raíz se carga explícitamente con `--env-file=../../.env` en los
  scripts de `apps/api` (Bun no hereda el `.env` del directorio padre).
- El web consume el API por el proxy de Vite (`/api` → `http://localhost:3000`),
  configurado en `apps/web/vite.config.ts`.

## Estado del bootstrap

Archivos de entrada creados para que el proyecto arranque:

- `apps/api/src/index.ts` — Hono + `Bun.serve`, CORS y `GET /api/v1/health`.
- `apps/web/src/main.tsx` — monta `ThemeProvider` + React Query + Router.
- `apps/web/src/app/router.tsx` y `apps/web/src/app/pages/HomePage.tsx` — home mínima
  que consulta `/health` para verificar el proxy.

Verificado con Supabase (pooler `aws-1-us-west-2`):

- `bun run db:reset` → esquema + catálogos OK.
- `bun run db:seed` → 5 usuarios, 55 preguntas, 22 intentos, planes y comunidad.
- `GET /api/v1/health` → `{"status":"ok","database":true}` (directo y por el proxy).
- `bun run typecheck`, `bun run lint` y `bun run test` (52 tests) limpios.

Cuentas demo (password `Demo1234!`): `valentina.perez@demo.cl`, `martina@demo.cl`,
`carlos.mendoza@demo.cl`, más un profesor y un admin.
