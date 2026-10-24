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

---

## D-010 · Extensions de Postgres resueltas en `extensions` o `public`

**Decisión.** El esquema crea las extensiones (`pg_trgm`, `unaccent`, `citext`,
`pgcrypto`) dentro de `extensions` y, si el rol no puede, cae al esquema por
defecto. Los índices GIN sobre columnas de texto se crean con
`execute format(... %I.gin_trgm_ops ...)` resolviendo el esquema real de
`pg_trgm` en tiempo de ejecución.

**Motivo.** En Supabase las extensiones viven en `extensions`, no en `public`, y
la opclass `gin_trgm_ops` no se encuentra si se referencia sin calificar. En
Docker local (Postgres 16) viven en `public`. Un `create index ... using gin
(col gin_trgm_ops)` sin calificar fallaba con `data type text has no default
operator class for access method "gin"`.

**Consecuencia.** El mismo `database/schema.sql` aplica idéntico en Supabase,
Neon y Docker sin variantes por proveedor.

---

## D-011 · `publicaciones.busqueda` es `tsvector`, no `text`

**Decisión.** La columna generada `busqueda` se declara `tsvector`.

**Motivo.** Estaba declarada `text` aunque la expresión `to_tsvector(...)` es de
tipo `tsvector`, lo que forzaba un cast implícito a texto y dejaba el índice GIN
`publicaciones_busqueda_idx` sin operator class válida.

---

## D-012 · El seed resuelve FKs con `await` en vez de subqueries anidadas

**Decisión.** `sembrarUsuarios` obtiene `carrera_id` y `colegio_id` con una
consulta previa y pasa el valor escalar al `insert`.

**Motivo.** Con postgres.js 3.4.x, anidar un fragmento `sql` dentro de otro
(`values (${sql\`select ...\`})`) se serializa como texto y produce
`syntax error at or near "select"`. Se reprodujo con y sin `prepare: false`.

**Consecuencia.** Regla del proyecto: no anidar fragmentos `sql`; resolver el
valor antes con `await`.

---

## D-013 · `uuidEstable` produce UUID v5 de 32 hex

**Decisión.** `uuidEstable` toma 32 hex del SHA-1, fuerza versión 5 (dígito 13)
y variante RFC 4122 (dígito 17), y formatea 8-4-4-4-12.

**Motivo.** La versión anterior encadenaba slices que daban 28 hex totales
(`2caa4e1a-54cf-59de-bc80-e7893bb00`), un UUID inválido que Postgres rechazaba
con `invalid input syntax for type uuid`.

---

## D-014 · `contenidos.actualizado_en` faltaba

**Decisión.** La migración `001_producto.sql` agrega la columna.
**Motivo.** El trigger `contenidos_ts` escribía `new.actualizado_en` sobre una
tabla que no la tenía: cualquier `UPDATE contenidos` fallaba con
`record "new" has no field "actualizado_en"`.

## D-015 · Fechas como texto ISO hacia y desde postgres.js

**Decisión.** Todo parámetro de fecha se envía como string ISO
(`fecha.toISOString()` o `'YYYY-MM-DD'`) y los `timestamptz` leídos se
normalizan con `aIso()` / `aMs()` de `db/client.ts`.
**Motivo.** Con Bun + pooler + `prepare: false`, postgres.js devuelve los
`timestamptz` como texto y rechaza objetos `Date` como parámetro
(`The "string" argument must be of type string… Received an instance of Date`).

## D-016 · Videos de relleno eliminados

**Decisión.** Los `video_url` que apuntaban a un enlace de relleno quedan en
`null`. La lección sin video se presenta como lectura con su índice, puntos
clave y mini-test; el reproductor aparece solo cuando hay un video real.
**Motivo.** Un video que no corresponde al contenido es peor que no tener
video. Se cargan URL reales desde el panel o el seed cuando existan.

## D-017 · Migraciones aditivas en `database/migrations/`

**Decisión.** Lo nuevo del producto entra como migración idempotente
(`bun run db:migrate`) y se copia al esquema canónico.
**Motivo.** La base de Supabase ya tiene datos: no se puede recrear con
`db:reset`. La migración nunca borra ni reescribe datos de usuarios.

## D-018 · RLS activado en todas las tablas públicas

**Decisión.** `001_producto.sql` activa Row Level Security en todas las tablas
de `public`, sin políticas.
**Motivo.** El esquema concede permisos a `public`, y en Supabase eso incluye
al rol `anon` de la API REST: cualquiera con la clave anónima podía leer
`usuarios.password_hash`. El API propio entra como `postgres` (BYPASSRLS), así
que no cambia nada para la aplicación; la API REST queda cerrada.

## D-019 · Alternativas: 4 (A–D), como la PAES vigente

**Decisión.** Las preguntas tienen 4 alternativas y el modo examen acepta A–D
y 1–4 como atajos. El componente soporta hasta 5 si una pregunta las trae.
**Motivo.** El prototipo y el brief hablan de A–E, pero desde la PAES de
invierno 2023 el DEMRE usa 4 alternativas en todas las pruebas. Ensayar con
el formato real es lo que le sirve al estudiante.

## D-020 · Tarjetas: el número nunca llega al API

**Decisión.** El checkout sandbox convierte la tarjeta de prueba en un token
(`tok_sandbox_aprobada` / `tok_sandbox_rechazada`) en el navegador y envía solo
ese token y los últimos 4 dígitos. Con Webpay Plus el pago ocurre en la página
de Transbank y no hay formulario de tarjeta propio.
**Motivo.** Es el mismo modelo de tokenización de las pasarelas reales: el
servidor jamás ve el número, la fecha ni el CVV. El esquema original
(`checkoutSchema`) los recibía; queda sin uso.

## D-021 · Jerarquía entre Stitch, DESIGN.md y la skill de gusto

**Decisión.** La skill `design-taste-frontend` trae reglas de casa que chocan
con Academic Velocity (sin sombras en reposo, sin etiquetas en mayúsculas, sin
íconos en contenedores). Por el orden pedido en el brief, mandan Stitch y
DESIGN.md en identidad: se mantienen la sombra nivel 1 de las cards, las
etiquetas de categoría en mayúsculas (`label-md`) y los íconos en contenedor
donde Stitch los pone. De la skill se toman: datos honestos (ceros como cero,
sin cifras inventadas), estados de carga con el layout final y sin shimmer,
errores dentro del bloque que falló con "Reintentar", sin gradientes
decorativos en botones ni fondos, números tabulares alineados, un hallazgo
por pantalla junto a su acción, y gráficos con poca tinta.
**Consecuencia.** El banner Premium del dashboard pierde el gradiente de Stitch
y pasa a un relleno plano `primary-container`; el resto de la composición se
conserva.

## D-022 · Mayúsculas de títulos: oración, no Title Case

**Decisión.** Títulos y botones van en mayúscula inicial de oración
("Comenzar ensayo", "Plan de estudio").
**Motivo.** La guía de Vercel pide Title Case, pero esa es una convención del
inglés; en español la norma (RAE) es mayúscula solo al inicio y en nombres
propios.
