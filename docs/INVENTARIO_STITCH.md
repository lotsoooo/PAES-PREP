# Inventario Stitch y cobertura de rutas

Actualizado: 2026-10-28. Inventario de los archivos reales, no de pantallas supuestas.

40 capturas disponibles en 44 carpetas (incluye Academic Velocity). Los contactos visuales estan en `output/playwright/stitch-contact-{1..4}.png`. Ver `PRUEBAS.md` para limites de la evidencia.

| Carpeta en design/stitch | Ruta | screen.png / code.html | Estado |
| --- | --- | --- | --- |
| `academic_velocity` | `Sistema de diseno` | no / no | Referencia leida |
| `b_squeda_en_comunidad_paes_prep` | `/app/comunidad/buscar` | si / si | Implementada; revision integral pendiente |
| `biblioteca_de_contenidos_conectada_paes_prep_1` | `/app/contenidos` | si / si | Implementada; revision integral pendiente |
| `biblioteca_de_contenidos_conectada_paes_prep_2` | `/app/contenidos` | si / si | Implementada; revision integral pendiente |
| `biblioteca_de_contenidos_paes_prep` | `/app/contenidos` | si / si | Implementada; revision integral pendiente |
| `biblioteca_de_ensayos_conectada_paes_prep_1` | `/app/ensayos` | si / si | Implementada; revision integral pendiente |
| `biblioteca_de_ensayos_conectada_paes_prep_2` | `/app/ensayos` | si / si | Implementada; revision integral pendiente |
| `biblioteca_de_ensayos_paes_prep` | `/app/ensayos` | si / si | Implementada; revision integral pendiente |
| `checkout_premium_paes_prep` | `/app/premium/checkout` | si / si | Implementada; revision integral pendiente |
| `comunidad_conectada_paes_prep_1` | `/app/comunidad` | si / si | Implementada; revision integral pendiente |
| `comunidad_conectada_paes_prep_2` | `/app/comunidad` | si / si | Implementada; revision integral pendiente |
| `comunidad_paes_prep` | `/app/comunidad` | si / si | Implementada; revision integral pendiente |
| `configuraci_n_de_objetivo_paes_prep` | `/onboarding/meta` | si / si | Implementada; revision integral pendiente |
| `configuraci_n_paes_prep` | `/app/configuracion/:seccion` | si / si | Implementada; revision integral pendiente |
| `crear_publicaci_n_paes_prep` | `/app/comunidad/nuevo` | si / si | Implementada; revision integral pendiente |
| `dashboard_conectado_paes_prep` | `/app` | si / si | Implementada; revision integral pendiente |
| `dashboard_paes_prep` | `/app` | si / si | Implementada; revision integral pendiente |
| `detalle_de_contenido_paes_prep` | `/app/contenidos/:slug` | si / si | Implementada; revision integral pendiente |
| `detalle_de_ensayo_conectado_paes_prep` | `/app/ensayos/:slug` | si / si | Implementada; revision integral pendiente |
| `detalle_de_ensayo_paes_prep` | `/app/ensayos/:slug` | si / si | Implementada; revision integral pendiente |
| `detalle_de_publicaci_n_paes_prep` | `/app/comunidad/:postId` | si / si | Implementada; revision integral pendiente |
| `estad_sticas_conectadas_paes_prep_1` | `/app/estadisticas` | si / si | Implementada; revision integral pendiente |
| `estad_sticas_conectadas_paes_prep_2` | `/app/estadisticas` | si / si | Implementada; revision integral pendiente |
| `estad_sticas_de_rendimiento_paes_prep` | `/app/estadisticas` | si / si | Implementada; revision integral pendiente |
| `explicaci_n_de_ejercicio_paes_prep` | `/app/ensayos/intentos/:id/pregunta/:n` | si / si | Implementada; revision integral pendiente |
| `iniciar_sesi_n_con_colegio_paes_prep` | `/login` | si / si | UI publica capturada y probada |
| `iniciar_sesi_n_paes_prep` | `/login` | si / si | UI publica capturada y probada |
| `landing_page_paes_prep` | `/` | si / si | UI publica capturada y probada |
| `mi_perfil_paes_prep` | `/app/perfil` | si / si | Implementada; revision integral pendiente |
| `notificaciones_paes_prep` | `/app/notificaciones` | si / si | Implementada; revision integral pendiente |
| `paes_prep_educational_platform_1` | `/` | no / si | UI publica capturada y probada |
| `paes_prep_educational_platform_2` | `/` | no / si | UI publica capturada y probada |
| `paes_prep_platform` | `/` | no / si | UI publica capturada y probada |
| `perfil_conectado_paes_prep` | `/app/perfil` | si / si | Implementada; revision integral pendiente |
| `perfil_de_tutor_paes_prep` | `/app/tutores/:id` | si / si | Implementada; revision integral pendiente |
| `plan_de_estudio_conectado_paes_prep_1` | `/app/plan` | si / si | Implementada; revision integral pendiente |
| `plan_de_estudio_conectado_paes_prep_2` | `/app/plan` | si / si | Implementada; revision integral pendiente |
| `plan_de_estudio_paes_prep` | `/app/plan` | si / si | Implementada; revision integral pendiente |
| `plan_generado_paes_prep` | `/onboarding/plan` | si / si | Implementada; revision integral pendiente |
| `planes_premium_paes_prep` | `/app/premium` | si / si | Implementada; revision integral pendiente |
| `registro_paes_prep` | `/registro` | si / si | UI publica capturada y probada |
| `resolviendo_ensayo_paes_prep` | `/app/ensayos/:slug/rendir` | si / si | Pruebas de interfaz con API simulada; backend E2E pendiente |
| `resultados_conectados_paes_prep` | `/app/ensayos/intentos/:id` | si / si | Implementada; revision integral pendiente |
| `resultados_de_ensayo_paes_prep` | `/app/ensayos/intentos/:id` | si / si | Implementada; revision integral pendiente |

## Rutas adicionales

- `/recuperar`, `/recuperar/:token`: recuperacion y nueva clave; correo real pendiente de prueba SMTP.
- `/onboarding`: alias del inicio del onboarding.
- `/app/repaso`, `/app/repaso/sesion`: cuaderno y sesion de repaso.
- `/app/premium/webpay`, `/app/premium/resultado`: adaptador de pago y resultado consultado al servidor.
- `/app/ayuda`, rutas 404 y error boundary: existen; revision integral pendiente.

## Componentes y datos compartidos

- Publicas: Marca, Button, Input, Combobox, MarcoAuth, Accordion; catalogos, proveedores auth y planes.
- Privadas: AppShell, tarjetas, skeletons, estados vacios/error, notificaciones, paleta, perfil y permisos.
- Estudio: tareas, disponibilidad, contenidos y progreso; graficos y puntuaciones personales.
- Ensayo: TextoMat, cronometro, alternativas, navegador, modal de entrega y cola persistida por intento.
- Comunidad: editor Markdown, sanitizacion, tarjetas, comentarios, reportes y perfiles publicos.

## Ausencias y fidelidad

Las tres carpetas `paes_prep_platform`, `paes_prep_educational_platform_1/2` no contienen screen.png. No se afirma haber comparado esas capturas. Landing, login y modo examen se revisaron con referencias disponibles; el resto conserva implementacion previa y requiere comparacion individual. La revision por contacto visual no equivale a una auditoria final de cada pantalla.
