# Integraciones y límites — 2026-10-28

| Servicio | Implementación | Evidencia / activación pendiente |
| --- | --- | --- |
| Postgres | Cliente existente postgres.js; API Hono | Health y catálogos públicos responden. Sin migraciones ni seed en esta sesión; falta prueba aislada de flujos |
| Autenticación | JWT en memoria, refresh httpOnly rotado, familia de sesión y rol de BD | Pruebas de tokens y rechazo anónimo. Falta registro/login/revocación E2E contra BD aislada |
| Recuperación | Nodemailer SMTP real, sin logs de tokens | Configurar SMTP_HOST/PORT/USER/PASSWORD y MAIL_FROM en entorno privado; probar entrega. Sin SMTP devuelve indisponibilidad |
| Google | OAuth con PKCE y email verificado | Requiere credenciales y redirect configurados. No se contactó Google |
| Archivos | Local o S3, validación de tamaño/tipo/cabecera | S3 requiere variables STORAGE_*; sin prueba de subida externa; revisar eliminación EXIF |
| Pagos | Mock segregado o adaptador Webpay | Sandbox exige PAYMENT_SANDBOX_ENABLED fuera de producción; pruebas con transporte controlado, no Webpay externo |
| Premium | Comprobación backend y transición transaccional | En producción exige pago real aprobado; falta integración concurrente y matriz de acceso cruzado |
| IA | Servicio simulado o Anthropic backend | AI_PAID_ENABLED=false por defecto. Real requiere habilitación, modelo y clave; cuotas/tokens configurables. Sin llamadas pagadas |
| Notificaciones | API/persistencia interna | No equivale a push/correo entregados. Proveedor push no verificado |

Nunca colocar secretos en variables VITE_* ni en commits. `.env.example`
contiene solo nombres y valores locales de ejemplo. D-033…D-038 describen los
límites de sandbox, producción y decisiones pendientes.

No hay evidencia de backups, monitoreo, restauración ensayada o despliegue de
producción activos. Prepararlos y probarlos antes de anunciar disponibilidad pública.
