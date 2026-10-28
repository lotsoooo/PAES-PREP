# Auditoría UI parcial — 2026-10-28

No es la auditoría final de toda la plataforma. Se aplicaron las
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
y axe (WCAG A/AA 2.0/2.1/2.2) en las páginas públicas en ambos temas, y en la
pantalla de examen con fixture en claro. Axe no certifica conformidad completa.

| Hallazgo | Archivo / referencia | Corrección y verificación |
| --- | --- | --- |
| Alta: color del texto de botones eliminado por merge | `apps/web/src/lib/cn.ts:1` | Declarados tamaños Academic Velocity; pruebas unitarias y contraste real ≥4,5:1 |
| Alta: contraste 1,41:1 en estadísticas de landing oscura | `apps/web/src/pages/publico/Landing.tsx`, Cifra | Par primary/on-primary; axe vuelve a pasar |
| Media: storage bloqueado impedía montar la app | `apps/web/src/app/providers/ThemeProvider.tsx:9` | Lectura/escritura tolerantes a fallo; E2E sin pageerror |
| Media: recuperación saltaba desde el primer ítem | `apps/web/src/pages/app/ensayos/Rendir.tsx`, estado de índice | Persistencia inicial y validación de entero; E2E de recarga pasa |
| Media: auth sin salto al contenido | `apps/web/src/components/auth/MarcoAuth.tsx:31` | Enlace de salto a main |
| Media: control de contraseña de 40 px | `apps/web/src/components/ui/Input.tsx`, botón mostrar | Área de 44 px y disabled coherente; interacción E2E |
| Media: cifras ausentes se presentaban como cero | `apps/web/src/pages/publico/Landing.tsx`, BandaDatos | Estado de carga y error recuperable explícitos |
| Baja: assets declarados inexistentes | `apps/web/public/`, `scripts/generar-assets.ts` | Marca vectorial e iconos PNG locales, imagen social y robots |

## Cobertura pendiente

- Auditoría y comparación individual de todas las rutas privadas y estados.
- Pruebas con lector de pantalla, zoom y contraste de gráficos/contenido completo.
- Flujos de estudiante/tutor/admin con permisos reales y mensajes de error.
- Revisión de rendimiento; quedan advertencias de tamaño de bundle.
- Términos y privacidad aprobados y accesibles desde registro antes de publicar.

Las capturas revisadas se guardan en `apps/web/e2e/capturas/`; las referencias
están inventariadas en `INVENTARIO_STITCH.md`. No se marca el gate final como cerrado.
