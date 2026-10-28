# Registro de decisiones

Cada decisión relevante, con su motivo. Si algo cambia, se agrega una entrada
nueva en vez de reescribir la anterior.

## Revisión 2026-10-28 · decisiones vigentes de continuidad

Estas entradas prevalecen sobre las decisiones históricas incompatibles.

### D-033 · Pagos simulados segregados (sustituye D-020 y D-031)

Se elimina la captura de número, vencimiento y CVV, incluso en el simulador.
El proveedor simulado exige habilitación explícita fuera de producción. No
hay fallback silencioso si Webpay carece de configuración. En producción los
beneficios dependen de pagos reales aprobados; los resultados del navegador
no conceden permisos. Confirmación, monto/orden/sesión y transición de plan
se validan en servidor. El resultado consulta al API; un fallo de red queda
pendiente de conciliación y no se anuncia como «rechazado sin cobro».
Pruebas unitarias con transporte controlado; pasarela externa sin verificar.

### D-034 · Ensayos: revisión de respuesta y entrega atómica

Se serializa creación/cuota por usuario y guardado/entrega por intento. El
guardado compara la revisión previa y conserva reintentos idénticos. Cierre,
puntaje, actividad, repaso y notificaciones se agrupan en una transacción.
Los intentos expirados cuentan en los agregados. El navegador conserva una
cola de cambios por intento y espera a vaciarla antes de la entrega manual.
La expiración se decide en servidor y el reloj visual usa tiempo monotónico.
Conflictos entre pestañas se muestran, sin sobrescribir silenciosamente.
Pendiente: prueba concurrente real en Postgres y mejor UI para resolver el conflicto.

### D-035 · Calendario sin fechas inventadas

Se retira el cálculo del «primer lunes de diciembre». `PROCESO_ADMISION` en
`apps/web/src/config/marca.ts` debe completarse con año, fecha y fuente oficial
verificados. Hasta entonces se muestra «por confirmar»; una fecha elegida por
el estudiante sí habilita su cuenta regresiva. Días civiles calculados para
America/Santiago, sin compensación UTC fija. Revisar la configuración antes de publicar.

### D-036 · Costos e integraciones externas

Tener una clave de IA no habilita gasto por sí solo. Se requieren
`AI_PAID_ENABLED`, modelo y clave; cuotas y tokens se limitan en servidor.
Sin habilitación se usa demostración rotulada en PAES-Bot. SMTP debe enviar
realmente o devolver indisponibilidad; nunca se imprime un token de recuperación.
No se cambiaron credenciales ni se habilitaron cargos, correos, IA paga o despliegues.

### D-037 · Fidelidad, accesibilidad y evidencia

Se conserva Inter/Academic Velocity. Se declara la escala tipográfica al
combinador de clases para impedir que elimine los colores accesibles de texto.
La banda de estadísticas usa el par primary/on-primary en ambos temas. Los
iconos PWA derivan del SVG local de marca. El navegador de 65 preguntas amplía
la maqueta de examen y exige más altura en escritorio; es una mejora funcional
del prompt. Capturas con sufijo `fixture` usan API simulada y no prueban la BD.

### D-038 · Aislamiento y cierre de fases

El API antiguo en 3000 se conserva. Para revisar el código actual se usa 3001
y `API_PROXY_TARGET`. Docker Desktop está instalado pero el daemon no está
disponible. No se ejecutan pruebas que creen usuarios, seed o migraciones
contra la BD existente. Los gates de fases privadas permanecen abiertos.
No se hace un commit masivo del trabajo previo mezclado y sin revisar.

Pendientes de decisión humana antes de lanzamiento: calendario oficial,
precio/descuento anual y límites comerciales definitivos, políticas de
privacidad/términos, verificación de tutores, proveedor de video, mensajería
directa y operación/backups. El botón «Mensaje» de tutor mantiene el alcance
parcial D-030: publicación con mención, no chat privado.

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

---

## D-023 · Un solo AppShell

**Decisión.** Escritorio (≥1024 px): sidebar fijo de 256 px + topbar con
buscador (Ctrl/⌘ K), notificaciones, configuración y avatar. Móvil y tablet:
topbar compacta + barra inferior Inicio · Ensayos · Estudio · Comunidad · Perfil.
El modo examen y la sesión de repaso usan un layout de foco sin navegación.

**Motivo.** Stitch mezclaba sidebar y barra superior, a veces en la misma
pantalla. "Estudio" agrupa plan, contenidos, repaso y estadísticas en móvil
para no pasar de cinco destinos.

---

## D-024 · El seed reemplaza la lista de preguntas de cada ensayo

**Decisión.** `sembrarEnsayoPreguntas` aplica `ENSAYOS_SEED`: actualiza los
datos del ensayo y reemplaza sus filas de `ensayo_preguntas` en una
transacción.

**Motivo.** La versión anterior asignaba a cada ensayo todas las preguntas de
su materia, por lo que el "ensayo M1 completo" no tenía las 65 preguntas del
banco y los ensayos temáticos mezclaban ejes. `ensayo_preguntas` es solo la
tabla puente: las respuestas de los intentos referencian `preguntas`, así que
reemplazarla no borra el historial de nadie.

---

## D-025 · Ofertas académicas con puntajes de corte aproximados

**Decisión.** Migración `002_ofertas_academicas.sql` con 70 combinaciones
carrera × universidad reales y un puntaje de corte aproximado.

**Motivo.** La tabla estaba vacía y el onboarding no podía mostrar
universidades. Los cortes son una referencia para fijar la meta, no la tabla
oficial del DEMRE: así se indica en el archivo y en la interfaz.

---

## D-026 · Historial demo realista y con la conversión del API

**Decisión.** Los intentos demo responden el ensayo completo, usan la tabla
`conversion_puntaje` (la misma que el API) y siguen una curva de mejora por
perfil. Al volver a sembrar se reemplazan solo los intentos con ids del seed.

**Motivo.** Antes cada intento respondía 5–8 preguntas fáciles con una
conversión lineal propia: casi todos daban 1000 y los gráficos quedaban planos.
También mezclaba preguntas de varios ensayos en un mismo intento y acumulaba
`resultados_eje` en cada ejecución.

---

## D-027 · Contraste de la meta naranja en gráficos

**Decisión.** La línea de meta naranja (`secondary-container`) siempre lleva
etiqueta de texto "Meta N" y los gráficos tienen vista de tabla.

**Motivo.** El naranjo sobre blanco tiene 2,63:1 (bajo 3:1 para elementos
gráficos). Se conserva por ser el color de marca de DESIGN.md para la meta,
pero nunca es la única forma de leer el dato.

---

## D-028 · Color por función en casos que Stitch pintaba distinto

- **Dificultad** usa punto verde / ámbar-azul / rojo con texto; el dorado queda
  solo para Premium.
- **Marcar para revisar** (modo examen) es azul con ícono de marcador; el
  naranjo se usa para el cronómetro bajo 10 min y ejes débiles.
- **Tarjeta Premium** en Planes es dorada, no azul como en Stitch.
- **Colores por materia** en el plan generado son tintes de azul.
- **Banner Premium y portadas de contenido** usan color plano e ícono, sin
  degradados ni fotos de stock (no hay imágenes con licencia en `/public`).

---

## D-029 · Modo examen: 4 alternativas y atajos

Las preguntas PAES vigentes tienen 4 alternativas (D-019). Atajos A–D / 1–4
para responder, ←/→ navegar, M marcar, G abrir el navegador de preguntas. La
E solo aparece si un ítem trae 5 alternativas. Avisos a 10 y 5 minutos y envío
automático al llegar a 0, con `expira_en` del servidor como autoridad (D-004).

---

## D-030 · Comunidad: editor y alcance

- Subrayado con `++texto++` (Markdown no lo tiene y no se acepta HTML crudo).
- "Mensaje" en el perfil de tutor abre Crear publicación con la mención: no hay
  mensajería directa en el API (pendiente de producto).
- Los filtros de Búsqueda son de selección única porque el API acepta una
  materia; Stitch mostraba checkboxes.
- Borrador de publicación solo en `localStorage` del navegador.

---

## D-031 · Pagos sandbox sin datos de tarjeta

La tarjeta se valida en el navegador (Luhn, vencimiento, CVV) y al API solo
viajan un token de prueba (`TOKENS_SANDBOX`) y los últimos 4 dígitos. Webpay
pasa por una pantalla de Transbank simulada (`/app/premium/webpay`) y vuelve a
`/app/premium/resultado`, que entiende `token_ws` y `TBK_TOKEN` como el Webpay
real. Corrección en `routes/premium.ts`: los `sql.json(x)` sobre columnas
`jsonb` fallaban con el pooler (`prepare: false`) y se cambiaron por
`${JSON.stringify(x)}::jsonb`.

---

## D-032 · Otras decisiones de interfaz

- Login: colegio opcional como combobox (variante "con colegio"); el banner
  muestra el error real del servidor; se quitaron los links de debug.
- El botón de Google usa los colores oficiales de Google en un SVG (única
  excepción a "sin hex"); solo aparece si `/auth/proveedores` lo habilita.
- Onboarding con tres pasos (meta, disponibilidad, pruebas). M1 y CL vienen
  marcadas por ser obligatorias.
- Configuración: navegación lateral en escritorio y pestañas desplazables en
  móvil; los switches se guardan con "Guardar cambios" y toast.
- Lecciones sin video (D-016) se leen con avance por scroll en tramos de 25 %.
- Arrastrar y soltar tareas del plan solo en escritorio y hacia hoy en
  adelante; en móvil se reprograma con el menú.
- Detrás de los candados Premium de Estadísticas hay datos de ejemplo
  borrosos y ocultos a lectores de pantalla, nunca los datos reales.
