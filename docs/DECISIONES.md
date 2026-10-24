# Registro de decisiones

Cada decisión relevante, con su motivo. Si algo cambia, se agrega una entrada
nueva en vez de reescribir la anterior.

---

## D-001 · Fuente de verdad del modelo de datos: SQL canónico

**Decisión.** `database/schema.sql` es la fuente de verdad del modelo. Drizzle
no genera migraciones: se usa como capa de tipos y consultas sobre un esquema
que ya existe.

**Motivo.** El mismo esquema tiene que servir para Docker local, Supabase y
Neon. Si Drizzle generara el DDL, cada proveedor terminaría con su propia
variante. `bun run db:pull` regenera `apps/api/src/db/schema.ts` desde el SQL
para mantener los tipos sincronizados.

**Consecuencia.** Los cambios de esquema se escriben a mano en el `.sql`, son
idempotentes (`if not exists`, `create or replace`) y se aplican con
`bun run db:reset`.

---

## D-002 · Autenticación propia, no Supabase Auth

**Decisión.** Usuarios, sesiones y refresh tokens viven en tablas propias
(`usuarios`, `sesiones`, `tokens_recuperacion`). Hash argon2id vía
`Bun.password.hash`.

**Motivo.** El proyecto no debe depender de `auth.users`. Mantener el control
del ciclo de vida de sesiones (rotación por familia, revocación) simplifica el
autoguardado de ensayos y el límite de planes.

**Consecuencia.** Nunca se guarda el token en claro: solo su SHA-256 en
`sesiones.token_hash`. Cookies `httpOnly` + `SameSite=Lax` en producción.

---

## D-003 · Radios: equivalencia entre DESIGN.md y Stitch

**Decisión.** Los radios de `design/stitch/academic_velocity/DESIGN.md` y los de los
HTML exportados por Stitch usan los mismos valores con nombres distintos:

| DESIGN.md / Stitch | Valor | Clase Tailwind |
| ------------------- | ----- | -------------- |
| `rounded`           | 4px  | `rounded-sm`   |
| `rounded-lg`        | 8px  | `rounded`      |
| `rounded-xl`        | 12px | `rounded-md`   |
| `rounded-2xl`       | 16px | `rounded-lg`   |
| `rounded-full`      | 100px| `rounded-full` |

**Motivo.** Tailwind reserva `rounded` para 4px, lo que invierte el nombre del
sistema de diseño respecto a Stitch. El mapeo anterior conserva los valores
visuales exactos de las capturas sin cambiar los radios reales.

**Consecuencia.** En `apps/web/src/styles/index.css` el token `--radius-*`
guarda el valor del diseño (no el de Tailwind) y los componentes usan las
clases de la tabla.

---

## D-004 · El temporizador del ensayo lo manda el servidor

**Decisión.** `intentos.expira_en` es la autoridad. El cliente calcula el
tiempo restante solo para mostrarlo.

**Motivo.** Un temporizador controlado por el cliente se puede manipulate
fácilmente desde la consola. Al entregar, el servidor compara `expira_en` con
`now()` y marca el intento como `expirado` si ya pasó.

**Consecuencia.** El autoguardado (`PUT /api/intentos/:id/respuestas/:qid`) es
idempotente y la entrega vuelve a leer las respuestas desde la base.

---

## D-005 · `v_precision_por_eje` agrupa por usuario

**Decisión.** La vista expone `usuario_id` y agrupa por `(usuario_id, eje_id)`.

**Motivo.** "Recomendado para ti" necesita la precisión de *ese* estudiante, no
el promedio de todos. Agrupar solo por eje entregaba una recomendación global
que no correspondía a nadie.

---

## D-006 · Los triggers leen `NEW`/`OLD` según `TG_OP`

**Decisión.** En los triggers de fila se usa
`case when tg_op = 'DELETE' then old.x else new.x end` en vez de
`coalesce(new.x, old.x)`.

**Motivo.** En un `INSERT`, `OLD` no está asignado, y referenciarlo lanza
`record "old" is not assigned yet` aunque se combine con `coalesce`. El
`case` evalúa solo la rama válida.

---

## D-007 · Racha: cuenta días con actividad, máximo 5 días de premio

**Decisión.** `racha_actual` cuenta días consecutivos con actividad. Los
puntos son `100 × días` con tope de `500` a partir del quinto día.

**Motivo.** El diseño muestra un contador de racha con recompensa acotada: sin
tope, un estudiante que estudia seis meses acumularía una cantidad de puntos
sin sentido. La función es pura y recibe `hoy` por parámetro para que los tests
sean deterministas.

---

## D-008 · El generador de plan reparte por días reales del calendario

**Decisión.** `generarTareas` recorre el calendario y solo crea sesiones en los
días de la semana que el usuario marcó. El reparto entre materias usa el método
de los mayores residuos, y las sesiones se intercalan.

**Motivo.** La primera versión asignaba `hoy + n` en orden, lo que generaba
tareas los fines de semana aunque el usuario no los hubiera marcado, y repetía
la misma materia varios días seguidos. Además, `40 %` de 6 sesiones no es un
número entero: el reparto tiene que aproximarlo sin acumular error.

---

## D-009 · El seed SQL y el seed de demo están separados

**Decisión.** `database/seed.sql` carga catálogos y contenido editorial.
`apps/api/src/db/seed.ts` crea los usuarios demo, sus intentos históricos y el
banco de preguntas.

**Motivo.** El seed SQL debe poder aplicarse en un entorno de producción para
poblar catálogos. Los usuarios demo con contraseñas y datos de prueba jamás
deben subirse a un servidor real, y además necesitan `Bun.password` para hashear
contraseñas, algo que no se puede expresar en SQL plano.

**Consecuencia.** `bun run db:reset` carga el SQL; `bun run db:seed` agrega los
datos demo.
