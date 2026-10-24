# Contrato del API — `/api/v1`

Tipos de respuesta en `packages/shared/src/dtos.ts` y `dtos-producto.ts`.
Errores: `{ error: { code, message, details? } }` (`details` = `{ campo: mensaje }`
en validación). Autenticación: `Authorization: Bearer <accessToken>`; el refresh
vive en la cookie `paes_rt` (httpOnly, path `/api/v1/auth`).

Reglas del código (ver DECISIONES): fechas como string ISO al enviar a
postgres.js y `aIso()` al leer (D-015); nunca anidar fragmentos `sql` (D-012);
la alternativa correcta jamás sale antes de entregar (D-004).

## Auth — `routes/auth.ts`

| Método | Ruta | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| POST | `/auth/registro` | `registroSchema` | `DTOSesionAuth` 201 |
| POST | `/auth/login` | `loginSchema` | `DTOSesionAuth` |
| POST | `/auth/refresh` | cookie | `DTOSesionAuth` |
| POST | `/auth/logout` | cookie | 204 |
| GET | `/auth/yo` | — | `DTOUsuarioSesion` |
| POST | `/auth/recuperar` | `{ email }` | `{ ok }` (siempre) |
| POST | `/auth/recuperar/:token` | `{ password }` | `{ ok }` |
| POST | `/auth/password` | `cambiarPasswordSchema` | `{ ok }` |
| GET | `/auth/sesiones` | — | `DTOSesionDispositivo[]` |
| DELETE | `/auth/sesiones/:id`, `/auth/sesiones` | — | 204 |
| DELETE | `/auth/cuenta` | `{ confirmacion: 'ELIMINAR' }` | 204 |

## Catálogos (públicos) — `routes/catalogos.ts`

| GET | Respuesta |
| --- | --- |
| `/carreras?q&limite` | `DTOCarrera[]` (populares primero si no hay `q`) |
| `/carreras/:id/ofertas` | `DTOOferta[]` |
| `/universidades?q&limite` | `DTOUniversidad[]` |
| `/colegios?q&limite` | `DTOColegio[]` |
| `/materias` | `DTOMateriaConEjes[]` |
| `/planes-suscripcion` | `DTOPlanSuscripcion[]` |
| `/datos-plataforma` | `DTODatosPlataforma` |
| `/archivos/:nombre` | archivo subido (avatar, imagen de publicación) |

## Usuario — `routes/usuarios.ts` (sesión)

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/usuarios/perfil` | `DTOPerfilPropio` |
| PATCH | `/usuarios/perfil` (`actualizarPerfilCompletoSchema`) | `DTOUsuarioSesion` |
| POST | `/usuarios/avatar` (multipart `archivo`, ≤2 MB, png/jpg/webp) | `{ avatarUrl }` |
| GET/PATCH | `/usuarios/preferencias` | `DTOPreferencias` |
| GET | `/usuarios/logros` | `DTOLogro[]` (todos, con `obtenidoEn` o null) |

## Onboarding — `routes/onboarding.ts`

| Método | Ruta | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| PUT | `/onboarding/meta` | `metaOnboardingCompletaSchema` | `DTOUsuarioSesion` |
| PUT | `/onboarding/disponibilidad` | `disponibilidadOnboardingSchema` | `DTOUsuarioSesion` |
| POST | `/onboarding/plan` | — | `DTOPlanGenerado` (marca onboarding completo) |
| POST | `/onboarding/omitir` | — | `DTOUsuarioSesion` (plan por defecto, onboarding completo) |

El generador reparte las horas por prueba según **peso de la prueba para la
carrera × brecha** (meta − puntaje actual estimado de esa prueba, desde los
últimos intentos; sin intentos se asume la brecha completa).

## Dashboard — `GET /dashboard` → `DTODashboardCompleto`

- `recomendado`: si hay repasos vencidos → repaso; si el eje más débil (de los
  últimos 3 intentos) tiene contenido sin completar → ese contenido; si no →
  el ensayo no premium (o premium si es Premium) que menos ha rendido.
- `areasMejorar`: ejes con precisión < 70 % en los últimos 3 intentos, máx. 3;
  `alta` si < 50 %.
- `objetivo.actual`: promedio de los últimos 3 puntajes entregados.

## Plan — `routes/plan.ts`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/plan?desde&hasta` (por defecto, semana actual lun–dom) | `DTOPlanSemana` |
| PATCH | `/plan/tareas/:id` (`actualizarTareaSchema`) | `DTOTareaActualizada` (completar registra actividad) |
| POST | `/plan/tareas` (`crearTareaSchema`) | `DTOTareaPlan` |
| POST | `/plan/regenerar` (`regenerarPlanSchema`) | `DTOPlanSemana` (borra solo tareas futuras pendientes) |

## Contenidos — `routes/contenidos.ts`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/contenidos?materia&tipo&estado&q` | `DTOBibliotecaContenidos` |
| GET | `/contenidos/:slug` | `DTOContenidoLeccion` (cuerpo vacío si es premium y no lo eres) |
| PUT | `/contenidos/:id/progreso` (`progresoContenidoSchema`) | `DTOProgresoContenido` |
| GET | `/contenidos/:id/mini-test` | `DTOPregunta[]` (3 del mismo eje) |
| POST | `/contenidos/:id/mini-test` (`respuestasMiniTestSchema`) | `DTOResultadoMiniTest` (registra actividad; errores al cuaderno) |

Desbloqueo: dentro de una `unidad`, la lección N+1 está `bloqueada` hasta
completar la N.

## Ensayos e intentos — `routes/ensayos.ts`, `routes/intentos.ts`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/ensayos?prueba&q` | `DTOEnsayo[]` |
| GET | `/ensayos/:slug` | `DTOEnsayo` |
| GET | `/intentos` | `DTOIntentoResumen[]` (míos, recientes primero) |
| POST | `/intentos` (`crearIntentoSchema`) | `DTOIntento` (retoma el en curso; 402 `PREMIUM_REQUIRED` / `PLAN_LIMIT_REACHED`) |
| GET | `/intentos/:id` | `DTOIntento` (si expiró, se entrega solo) |
| PUT | `/intentos/:id/respuestas/:preguntaId` (`guardarRespuestaSchema`) | `{ ok, guardadoEn }` |
| POST | `/intentos/:id/entregar` | `DTOResultadosCompletos` |
| GET | `/intentos/:id/resultados` | `DTOResultadosCompletos` |
| GET | `/intentos/:id/pregunta/:n` | `DTOExplicacion` |

## Cuaderno de errores — `routes/cuaderno.ts`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/cuaderno` | `DTOCuaderno` |
| GET | `/cuaderno/repaso` | `DTOPreguntaRepaso[]` (vencidas hoy, máx. 10) |
| POST | `/cuaderno` (`agregarCuadernoSchema`) | `DTOItemCuaderno` |
| POST | `/cuaderno/:id/responder` (`responderRepasoSchema`) | `DTORespuestaRepaso` |
| DELETE | `/cuaderno/:id` | 204 |

Cajas: acierto sube una caja (1→2→…→5 = dominada), error vuelve a 1.
Intervalos: 1, 3, 7, 14, 30 días.

## Estadísticas — `GET /estadisticas?periodo&prueba` → `DTOEstadisticasCompletas`

`actividad` y `erroresPorEje` solo para Premium (null si no).

## Comunidad — `routes/comunidad.ts`, `routes/tutores.ts`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/comunidad/publicaciones?materia&tipo&orden&cursor&limite` (`feedQuerySchema`) | `PaginaCursor<DTOPublicacionFeed>` |
| POST | `/comunidad/publicaciones` (`crearPublicacionSchema`) | `DTOPublicacionFeed` 201 |
| GET | `/comunidad/publicaciones/:id` | `DTOPublicacionCompleta` |
| POST | `/comunidad/publicaciones/:id/voto` | `{ meGusta, likes }` (alterna) |
| POST | `/comunidad/publicaciones/:id/guardar` | `{ guardada }` (alterna) |
| POST | `/comunidad/publicaciones/:id/comentarios` (`crearComentarioSchema`) | `DTOComentarioSocial` 201 |
| POST | `/comunidad/comentarios/:id/voto` | `{ meGusta, likes }` |
| POST | `/comunidad/comentarios/:id/mejor` | `{ ok }` (solo el autor de la publicación) |
| GET | `/comunidad/buscar` (`buscarComunidadSchema`) | `DTOBusquedaComunidad` |
| GET | `/comunidad/destacados` | `DTODestacadosComunidad` |
| POST | `/comunidad/reportes` (`reportarSchema`) | `{ ok }` |
| POST | `/comunidad/imagenes` (multipart `archivo`) | `{ url }` |
| GET | `/comunidad/tutores` | `DTOTutorResumen[]` |
| GET | `/comunidad/tutores/:id` | `DTOPerfilPublico` + `tutor: DTOTutorResumen` |
| POST | `/comunidad/tutores/:id/seguir` | `{ loSigo, seguidores }` |
| POST | `/comunidad/tutores/:id/resenas` (`crearResenaSchema`) | `DTOResena` |

Etiquetas = hashtags `#palabra` extraídos del cuerpo.

## Notificaciones — `routes/notificaciones.ts`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/notificaciones?cursor&limite&soloNoLeidas` | `DTOCentroNotificaciones` |
| GET | `/notificaciones/resumen` | `DTOResumenNotificaciones` |
| POST | `/notificaciones/:id/leer` | 204 |
| POST | `/notificaciones/leer-todas` | 204 |

## Premium — `routes/premium.ts` + `services/pagos/`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/premium/estado` | `DTOEstadoSuscripcion` |
| POST | `/premium/checkout` (`checkoutSandboxSchema`) | `DTOResultadoCheckout` |
| POST | `/premium/webpay/confirmar` (`confirmarWebpaySchema`) | `DTOResultadoCheckout` |
| POST | `/premium/prueba` | `DTOEstadoSuscripcion` (7 días, una vez por cuenta) |
| POST | `/premium/cancelar` | `DTOEstadoSuscripcion` (sigue activa hasta `terminaEn`) |
| GET | `/premium/pagos` | `DTOPago[]` |

## IA — `POST /ia/chat` (`chatIASchema`, Premium) → `DTORespuestaIA`

## Búsqueda global — `GET /buscar?q` → `DTOResultadoBusqueda`
