# Progreso — PAES Pro

Se actualiza al cerrar cada fase. Si la sesión se corta, se retoma desde aquí.

_Última actualización: 2026-10-28._

## Estado vigente al preparar el commit (2026-10-28)

El usuario pidió pausar el desarrollo y subir los commits a `origin/dev`.
Este apartado prevalece sobre las tablas históricas siguientes. La plataforma
**no está declarada terminada ni lista para producción**.

### Implementado y conservado

- Conservadas las 34 pantallas, el API Hono/Postgres y la auth propia que dejó
  Claude; no se sustituyeron por una demo ni se cambió de framework.
- Endurecimiento de sesiones, privacidad de tutores, validación de archivos,
  recuperación por SMTP y endpoints de moderación. Adaptadores externos aún
  requieren pruebas reales; no se enviaron correos ni archivos a proveedores.
- Ensayos: cola local validada, reintentos, revisión de respuestas, guardado y
  entrega serializados, cierre transaccional y reloj visual monotónico.
  Corregida la recuperación de la pregunta actual, incluido el primer ítem.
  Los intentos expirados se incluyen en estadísticas.
- Pagos: sin formulario PAN/CVV, sandbox explícito fuera de producción,
  confirmación de monto/orden/sesión, activación transaccional, permisos de
  producción separados y consulta del resultado al servidor.
- IA: habilitación de gasto explícita y cuotas; modo demostración rotulado.
- UI: reparado `cn()` que eliminaba colores de texto al combinar tokens,
  contraste de landing en oscuro, foco/teclado, tema tolerante a storage
  bloqueado, recursos locales PWA y metadatos privados no indexables.
- Calendario sin fecha calculada arbitrariamente: falta configurar una fuente
  oficial en `config/marca.ts`; las fechas del estudiante sí se admiten.

### Evidencia ejecutada

- `bun run typecheck`: shared, API y web correctos.
- `bun run lint`: correcto; repetir al cerrar el commit si cambian fuentes.
- `bun test apps/api/tests`: 103 pasan, 0 fallos. Dominio, JWT, validación,
  política de permisos y pasarela con transporte controlado; no prueba Postgres real.
- `bun run --cwd apps/web test`: 76 pasan. Incluye cola, reloj, tokens,
  calendario y 65 preguntas M1 (unicidad, alternativas, explicación y KaTeX).
  Integridad estructural no sustituye revisión pedagógica independiente.
- `bun run --cwd apps/web test:e2e --grep 'pública|visitante|API simulada'`:
  38 pasan en escritorio y móvil. Cuatro páginas públicas, axe en claro/oscuro,
  validación/foco/contraseña, rutas privadas sin sesión, FAQ y ensayo de 65
  preguntas con desconexión, recarga, entrega y expiración.
- El ensayo E2E usa API **simulada en memoria**, aislada de la BD. No prueba
  autorización cruzada, concurrencia SQL ni puntuación real.
- `bun run --cwd apps/web build`: correcto, avisos de chunk principal de
  aproximadamente 525 kB y 404 importada tanto estática como dinámicamente.
- Responsive de login y examen comprobado sin desbordamiento en
  375/390/768/1024/1440 px. Capturas locales en `apps/web/e2e/capturas/`.

### Pendiente y reanudación

1. Preparar Postgres local aislado. Docker Desktop está instalado pero
   `docker desktop status` no encuentra un daemon disponible. No se ejecutaron
   migraciones, seed, reset ni escrituras de pruebas en la BD existente.
2. Probar registro → onboarding → estudio → ensayo → resultados → comunidad
   → sandbox con backend real. Añadir usuarios A/B para acceso cruzado,
   doble submit, sesiones, moderación y pagos repetidos.
3. Capturar y comparar individualmente todas las rutas privadas con Stitch;
   revisar sus estados de carga/vacío/error, ambos temas y accesibilidad.
4. Completar UI de moderación, resolución de conflictos de pestañas y
   mensajería de tutor (actualmente publicación con mención, D-030).
5. Verificar SMTP, OAuth, S3 y Webpay integración en entornos autorizados;
   configurar calendario, políticas legales, límites comerciales y operación.
6. Cerrar auditoría integral, README de operación y rendimiento. Los gates de
   fases 2–10 siguen parciales: existencia de pantalla no significa fase aprobada.

Durante QA se mantuvo el API anterior en 3000; la versión actual se levantó
en 3001 y Vite en 5173 con `API_PROXY_TARGET=http://localhost:3001`.
No hubo despliegue, modificación de credenciales ni habilitación de servicios pagos.

Leer primero este apartado, `PLAN.md`, `INVENTARIO_STITCH.md` y D-033…D-038.
El prompt maestro v2.0 está en la conversación; el archivo local del mismo
nombre no existía al revisar. No rehacer las pantallas ni las pruebas confirmadas.

## Estado por fase

| Fase | Estado | Notas |
| --- | --- | --- |
| 0. Reconocimiento + `docs/PLAN.md` | ✅ Listo | Plan y decisiones D-001…D-022 |
| 1. Tokens + `components/ui` + AppShell | ✅ Listo | Sidebar, topbar, bottom nav, paleta Ctrl+K, notificaciones, gating Premium |
| 2. Capa de datos + migraciones/seed | ✅ Listo | API Hono completo (17 módulos), migración 001, seed con banco M1 de 65 preguntas |
| 3. Públicas + auth + onboarding | 🟡 Construido | Falta verificación visual en navegador |
| 4. Dashboard, plan, contenidos, repaso | 🟡 Construido | Falta verificación visual en navegador |
| 5. Ensayos completos | 🟡 Construido | Flujo crear → responder → entregar probado con curl |
| 6. Estadísticas | 🟡 Construido | Falta verificación visual en navegador |
| 7. Comunidad, tutores, perfil | 🟡 Construido | Falta verificación visual en navegador |
| 8. Notificaciones, configuración, premium, checkout | 🟡 Construido | Checkout corregido (D-031); falta repetir el pago con el API arriba |
| 9. Mejoras sección 7, modo oscuro, pulido | ⏳ Pendiente | Modo oscuro y tokens ya implementados |
| 10. Pasada final + `docs/AUDITORIA_UI.md` | ⏳ Pendiente | |

## Retomado el 2026-10-27 (nueva sesión)

La sesión anterior se cortó con el API completo y el frontend en el shell:
todas las pantallas de `/app/*`, auth y onboarding eran stubs de 3 líneas.

Arreglado al retomar:

- `node_modules` corrupto por la sincronización de OneDrive (paquetes con
  carpetas vacías): reinstalación limpia. **Recomendación:** excluir
  `node_modules` de OneDrive o mover el repo fuera de OneDrive.
- `seed.ts` no usaba `ENSAYOS_SEED`: el ensayo M1 completo tenía 7 preguntas.
  Ahora cada ensayo recibe exactamente sus preguntas (D-024).
- `vite.config.ts`: el destino del proxy se puede cambiar con
  `API_PROXY_TARGET`.
- Componentes compartidos nuevos: `TextoMat` (Markdown + KaTeX) y
  `Pagina`/`EncabezadoPagina`.

## Estado al cierre de la construcción (2026-10-27)

- Las 27 pantallas que eran stubs están construidas y conectadas al API.
- `bun run lint`: 0 errores, 0 advertencias. `typecheck` limpio en web y API.
  `bun run build` del web: correcto (aviso: chunk principal de 524 kB).
- Seed corregido: ensayos con sus preguntas exactas (D-024), ofertas
  carrera × universidad (D-025) e historial demo realista (D-026).
- Playwright listo: `apps/web/playwright.config.ts` y `e2e/capturas.spec.ts`
  (1440 y 390 px, falla con errores de consola). Chromium instalado.
- Decisiones D-025 a D-032 registradas.

## Siguiente paso

1. Levantar API + web y correr `bun run test:e2e` para las capturas.
2. Comparar con cada `screen.png` y corregir.
3. Recorrer el flujo principal de punta a punta (registro → onboarding →
   ensayo → resultados → errores → comunidad → Premium sandbox).
4. Auditoría web-design-guidelines → `docs/AUDITORIA_UI.md`.
5. Reducir el chunk principal, README final.

## Revisión de continuidad — Codex (2026-10-27)

La tabla de fases y el siguiente paso anteriores corresponden a un estado
previo. La revisión del árbol de trabajo encontró implementaciones posteriores:
no se deben recrear las pantallas suponiendo que todavía son stubs.
Su existencia y la comprobación de tipos no demuestran que todos los flujos
estén terminados o funcionen de punta a punta.

### Trabajo encontrado

- 34 archivos de pantalla en `apps/web/src/pages`: públicas, autenticación,
  recuperación de contraseña, onboarding, dashboard, plan, contenidos,
  ensayos, repaso, estadísticas, comunidad, tutores, perfil, notificaciones,
  configuración, premium, checkout y páginas de error.
- Router con carga diferida, guards de sesión y onboarding, AppShell,
  componentes compartidos y hooks de datos en `lib/data`.
- API con rutas por módulo, servicios de estudio, pagos y tutor IA.
  Hay implementaciones simuladas y adaptadores externos; no se verificó
  cuál está activo ni su funcionamiento con servicios reales.
- 44 carpetas de diseño en `design/stitch` y el sistema Academic Velocity.
- Suite de capturas Playwright para escritorio (1440 px) y móvil (390 px).
- Numerosos cambios y archivos nuevos todavía sin commit. Son parte del
  trabajo previo y deben conservarse al continuar.

### Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `bun run typecheck` | Correcto en shared, API y web |
| `bun run lint` | 0 errores y 4 advertencias de React Fast Refresh |
| `bun test apps/api/tests` | 63 pruebas correctas, 0 fallos |

Las advertencias de lint están en `ItemNotificacion.tsx` (1), `Premium.tsx`
(2) y `PaletaComandos.tsx` (1), por combinar exportaciones de componentes
con otras exportaciones.

### Pendientes de comprobar antes de cerrar fases

- Compilación de producción y funcionamiento conjunto de web, API y base.
- Flujos reales de autenticación, estudio, autoguardado y entrega de ensayos,
  comunidad y pagos de prueba.
- Capturas y comparación con Stitch, en ambos tamaños y temas.
- Pruebas unitarias del frontend: `vitest.config.ts` referencia
  `tests/setup.ts` y `tests/**/*.test.{ts,tsx}`, pero `apps/web/tests` no existe.
- Auditoría final: `docs/AUDITORIA_UI.md` todavía no existe.

Para continuar, contrastar el próximo brief del usuario con estas
implementaciones y validar lo existente antes de completar los huecos.
Se mantienen el stack, la identidad de Stitch/Academic Velocity y las
decisiones D-001 a D-024. Esta revisión no ejecutó migraciones, seed,
operaciones sobre la base ni pruebas de navegador.
