# Pruebas — 2026-10-28

Resultados y límites completos: apartado vigente de [PROGRESO.md](PROGRESO.md).

| Comando | Resultado observado |
| --- | --- |
| `bun run typecheck` | shared, API y web correctos |
| `bun run lint` | correcto |
| `bun test apps/api/tests` | 103 pasan |
| `bun run --cwd apps/web test` | 76 pasan |
| `bun run --cwd apps/web build` | correcto; avisos de chunk y 404 compartida |
| `bun run --cwd apps/web test:e2e --grep 'pública\|visitante\|API simulada'` | 38 pasan |

Para repetir E2E, levantar API actual y Vite. Si el puerto 3000 contiene una
versión anterior, usar `PORT=3001` para el API y `API_PROXY_TARGET` para Vite.
Las variables se establecen en el proceso, sin modificar credenciales.

`publico-funcional.spec.ts` lee catálogos y verifica rechazos anónimos; no crea
cuentas. `ensayo-interfaz.spec.ts` intercepta todas las peticiones API: prueba
solo la interfaz con el banco M1, sin acceso a Postgres. No usar sus resultados
como evidencia de seguridad entre usuarios o persistencia del backend.

Las capturas y trazas se generan localmente y se excluyen del repositorio.
La suite privada de `capturas.spec.ts` requiere cuentas demo en una base
aislada; no se ejecutó en esta revisión. No están verificadas las integraciones
SMTP, Google, S3, Webpay externo ni el proveedor IA real.
