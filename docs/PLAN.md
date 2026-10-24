# Plan de construcción — PAES Pro

Documento vivo. El avance real está en `docs/PROGRESO.md`; las decisiones, en
`docs/DECISIONES.md`.

## 1. Lo que ya existe (Fase 0)

| Pieza | Estado al empezar |
| --- | --- |
| Monorepo Bun (`apps/api`, `apps/web`, `packages/shared`) | Listo |
| Base de datos | Supabase (pooler), 39 tablas, esquema canónico en `database/schema.sql`, datos demo |
| API (Hono + postgres.js) | Solo `GET /api/v1/health`. Servicios puros con tests: scoring, plan, fechas |
| Contratos | `packages/shared`: DTOs, esquemas Zod, constantes y formateo es-CL |
| Web (React 19 + Vite 6 + Tailwind v4) | Tokens de Academic Velocity en `styles/index.css`, 11 componentes base, tema claro/oscuro, cliente HTTP con refresh |
| Diseño | 44 carpetas de Stitch en `design/stitch/` + `academic_velocity/DESIGN.md` |
| Auth | Diseñada en el esquema (sesiones, refresh rotado, recuperación). Sin endpoints |

**Conclusión:** la base de datos y los contratos están; faltan el API completo
y toda la interfaz. No se cambia de stack.

## 2. Arquitectura

### API (`apps/api/src`)

```
index.ts               Hono: CORS, cookies, montaje de módulos, errores
http/                  errores tipados, validación Zod, auth middleware, paginación
services/              lógica pura (scoring, plan, rachas, repaso espaciado, pagos, IA)
routes/                un archivo por módulo: auth, catalogos, usuarios, onboarding,
                       dashboard, plan, contenidos, ensayos, intentos, estadisticas,
                       cuaderno, comunidad, tutores, notificaciones, premium, ia, buscar
db/                    cliente, seed, dataset
```

- Auth propia (D-002): access token JWT (15 min, en memoria del cliente) +
  refresh token opaco en cookie `httpOnly` rotado por familia.
- La correcta de una pregunta nunca sale del servidor antes de entregar.
- `intentos.expira_en` manda sobre el cronómetro (D-004).
- Pagos detrás de `services/pagos` con proveedor `mock` (sandbox) y `webpay`
  (stub listo para credenciales). Nunca se guardan datos de tarjeta.
- IA detrás de `services/ia` con proveedor simulado y uno real si hay
  `ANTHROPIC_API_KEY`.

### Web (`apps/web/src`)

```
app/router.tsx         rutas con lazy() por pantalla (code splitting)
app/guards/            RequiereSesion, RequiereOnboarding, SoloInvitado
app/layouts/           AppShell (sidebar + topbar + bottom nav), PublicLayout, FocusLayout
pages/                 una carpeta por área (publico, auth, onboarding, app/...)
components/ui/         design system
components/<feature>/  piezas de cada área
lib/data/              hooks de TanStack Query por recurso (la capa de repositorio)
lib/                   api, auth, formato, katex
config/                marca, navegación, textos
hooks/                 usePlan, useAtajos, useCuentaRegresiva, useTitulo…
```

## 3. Rutas

| Ruta | Pantalla Stitch |
| --- | --- |
| `/` | landing_page_paes_prep (+3 variantes) |
| `/login` | iniciar_sesi_n_paes_prep, …_con_colegio |
| `/registro` | registro_paes_prep |
| `/recuperar`, `/recuperar/:token` | (nueva, estilo de login) |
| `/onboarding/meta` | configuraci_n_de_objetivo_paes_prep (+ disponibilidad y pruebas) |
| `/onboarding/plan` | plan_generado_paes_prep |
| `/app` | dashboard_conectado_paes_prep |
| `/app/plan` | plan_de_estudio_conectado_paes_prep_1/2 |
| `/app/contenidos`, `/app/contenidos/:slug` | biblioteca_de_contenidos…, detalle_de_contenido |
| `/app/ensayos`, `/app/ensayos/:slug` | biblioteca_de_ensayos…, detalle_de_ensayo_conectado |
| `/app/ensayos/:slug/rendir` | resolviendo_ensayo (modo foco) |
| `/app/ensayos/intentos/:id` | resultados_conectados |
| `/app/ensayos/intentos/:id/pregunta/:n` | explicaci_n_de_ejercicio |
| `/app/repaso` | cuaderno de errores (nueva) |
| `/app/estadisticas` | estad_sticas_conectadas_1/2 |
| `/app/comunidad`, `/:postId`, `/nuevo`, `/buscar` | comunidad…, detalle_de_publicaci_n, crear_publicaci_n, b_squeda_en_comunidad |
| `/app/tutores/:id` | perfil_de_tutor |
| `/app/perfil` | perfil_conectado |
| `/app/notificaciones` | notificaciones |
| `/app/configuracion/:seccion` | configuraci_n |
| `/app/premium`, `/app/premium/checkout`, `/app/premium/resultado` | planes_premium, checkout_premium |
| `*` | 404 de marca; error boundary = 500 |

## 4. Modelo de datos: lo que se agrega

Migración aditiva `database/migrations/001_producto.sql` (idempotente, sin
borrar nada) y luego copiada al esquema canónico:

- `usuarios.pruebas_objetivo text[]`
- `preguntas.error_comun`, `preguntas.video_url`
- `contenidos.unidad`, tipo de material `practica`
- `carreras_universidades` (oferta con puntaje de corte por universidad)
- `guardados` (publicaciones guardadas), `votos_comentario`
- `cuaderno_errores` (repaso espaciado, cajas de Leitner)
- `logros`, `logros_usuario`
- valores de notificación `recordatorio`, `material_nuevo`
- RLS activado en todas las tablas (cierra la API REST de Supabase; el API
  propio entra como dueño)

## 5. Orden de trabajo

1. Plan y decisiones ← aquí
2. Migración + núcleo del API (errores, auth, validación) + módulos
3. Tokens revisados + `components/ui` + AppShell + router + guards
4. Públicas, auth y onboarding
5. Dashboard, plan, contenidos
6. Ensayos de punta a punta
7. Estadísticas
8. Comunidad, tutores, perfil
9. Notificaciones, configuración, premium, checkout
10. Tutor IA, cuaderno de errores, logros, modo oscuro, pulido
11. Pasada final con las dos skills y `docs/AUDITORIA_UI.md`

Cada fase cierra con: typecheck + lint + build → capturas Playwright 1440/390
vs `screen.png` → auditoría web-design-guidelines → correcciones → `PROGRESO.md`.
