-- ============================================================================
-- PAES Pro — ESQUEMA POSTGRESQL CANÓNICO
-- ----------------------------------------------------------------------------
-- Este archivo es la fuente de verdad del modelo de datos. Es idempotente y
-- puede ejecutarse varias veces sin error. Orden: extensiones -> enums ->
-- tablas -> índices -> funciones -> triggers -> vistas.
--
-- Compatible con PostgreSQL 16 (Docker local), Supabase y Neon.
-- NO depende de auth.users: la autenticación es propia (JWT + sesiones).
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONES
-- ============================================================================
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- emails sin distinción de mayúsculas
create extension if not exists pg_trgm;    -- búsqueda full-text difusa (comunidad)
create extension if not exists unaccent;   -- búsqueda sin tildes

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
do $$ begin
  create type rol_usuario as enum ('estudiante', 'profesor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tema_app as enum ('claro', 'oscuro', 'sistema');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_intento as enum ('en_curso', 'entregado', 'expirado', 'abandonado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_material as enum ('video', 'pdf', 'mixto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_publicacion as enum ('duda', 'tip', 'material', 'debate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_pago as enum ('pendiente', 'aprobado', 'rechazado', 'reembolsado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metodo_pago as enum ('tarjeta', 'webpay');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_suscripcion as enum ('activa', 'cancelada', 'vencida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proveedor_pago as enum ('mock', 'webpay');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_actividad as enum ('ensayo', 'contenido', 'tarea_plan', 'comunidad');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_tarea as enum ('pendiente', 'en_curso', 'completada', 'omitida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_notificacion as enum (
    'resultados_disponibles', 'nuevo_plan', 'plan_actualizado', 'racha',
    'comentario', 'like', 'respuesta', 'pago', 'sistema'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_publicacion as enum ('visible', 'oculta', 'eliminada');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. IDENTIDAD Y SESIONES
-- ============================================================================

-- 2.1 USUARIOS — identidad + perfil académico mínimo
create table if not exists usuarios (
  id                    uuid primary key default gen_random_uuid(),
  email                 citext not null unique,
  nombre                text not null check (char_length(nombre) between 1 and 80),
  apellido              text check (char_length(apellido) <= 80),
  password_hash         text,                       -- argon2id; null si solo OAuth
  email_verificado      boolean not null default false,
  rol                   rol_usuario not null default 'estudiante',
  onboarding_completado boolean not null default false,

  avatar_url            text,
  curso                 text,                       -- ej. '4º Medio B'
  colegio_id            uuid,

  -- Objetivo PAES (onboarding)
  carrera_id            uuid,
  universidad_id        uuid,
  puntaje_meta          integer check (puntaje_meta between 100 and 1000),
  fecha_examen          date,
  horas_semana          integer check (horas_semana between 1 and 80),
  dias_disponibles      smallint[] not null default '{}',

  -- Racha (materializada por services/streaks.ts)
  racha_actual          integer not null default 0 check (racha_actual >= 0),
  racha_maxima          integer not null default 0 check (racha_maxima >= 0),
  ultima_actividad      date,

  eliminado_en          timestamptz,               -- baja lógica
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

comment on table public.usuarios is
  'Identidad y perfil del usuario. password_hash es argon2id (Bun.password.hash).';

-- 2.2 CUENTAS OAUTH (Google / PKCE)
create table if not exists cuentas_oauth (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  proveedor         text not null,                   -- 'google'
  proveedor_usuario_id text not null,                -- sub del id token
  email             citext not null,
  creado_en         timestamptz not null default now(),
  unique (proveedor, proveedor_usuario_id),
  unique (usuario_id, proveedor)
);

-- 2.3 SESIONES — refresh tokens rotados (hash, nunca el token en claro)
create table if not exists sesiones (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  token_hash        text not null unique,
  familia_id        uuid not null,                  -- agrupa la rotación
  user_agent        text,
  ip                inet,
  expira_en         timestamptz not null,
  revocado_en       timestamptz,
  creado_en         timestamptz not null default now(),
  ultimo_uso_en     timestamptz not null default now()
);

-- 2.4 TOKENS DE RECUPERACIÓN — un solo uso, 30 min
create table if not exists tokens_recuperacion (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  token_hash        text not null unique,
  expira_en         timestamptz not null,
  usado_en          timestamptz,
  creado_en         timestamptz not null default now()
);

-- 2.5 PREFERENCIAS — tema y switches de notificación (autosave)
create table if not exists preferencias_usuario (
  usuario_id                uuid primary key references public.usuarios(id) on delete cascade,
  tema                      tema_app not null default 'sistema',
  notif_email               boolean not null default true,
  notif_push                boolean not null default true,
  notif_resultados          boolean not null default true,
  notif_social              boolean not null default true,
  notif_racha               boolean not null default true,
  notif_marketing           boolean not null default false,
  idioma                    text not null default 'es-CL',
  actualizado_en            timestamptz not null default now()
);

-- ============================================================================
-- 3. CATÁLOGOS ACADÉMICOS
-- ============================================================================

-- 3.1 COLEGIOS — el login con colegio valida dominio_email
create table if not exists colegios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  comuna         text,
  region        text,
  dominio_email citext,                            -- p.ej. 'liceobicentenario.cl'
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create unique index if not exists colegios_dominio_email_key
  on public.colegios (dominio_email) where dominio_email is not null;

-- 3.2 MATERIAS — M1, M2, CL, CIENCIAS, HISTORIA
create table if not exists materias (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,               -- 'M1', 'M2', 'CL', 'BIO', 'FIS', 'QUI', 'HIST'
  nombre        text not null,
  area          text not null check (area in ('matematicas', 'lenguaje', 'ciencias', 'historia')),
  peso          numeric(5,2) not null default 1,
  activo        boolean not null default true
);

-- 3.3 EJES TEMÁTICOS — 4 ejes por prueba (base de v_precision_por_eje)
create table if not exists ejes (
  id            uuid primary key default gen_random_uuid(),
  materia_id    uuid not null references public.materias(id) on delete cascade,
  codigo        text not null,
  nombre        text not null,
  descripcion   text,
  unique (materia_id, codigo)
);

-- 3.4 CARRERAS Y UNIVERSIDADES — buscador del onboarding con debounce
create table if not exists carreras (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  area          text not null,
  duracion_anios integer check (duracion_anios between 1 and 12),
  puntaje_referencia integer check (puntaje_referencia between 100 and 1000),
  popular       boolean not null default false
);

create table if not exists universidades (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  tipo          text not null default 'privada'
                  check (tipo in ('estado', 'privada', 'tradicional')),
  region        text,
  puntaje_corte integer check (puntaje_corte between 100 and 1000)
);

-- 3.5 CONVERSIÓN DE PUNTAJE — puntaje oficial desde % de logro
create table if not exists conversion_puntaje (
  id                uuid primary key default gen_random_uuid(),
  prueba            text not null check (prueba in ('M1', 'M2', 'CL', 'CIENCIAS', 'HISTORIA')),
  version           text not null default '2026',
  pct_logro_min     integer not null check (pct_logro_min between 0 and 100),
  pct_logro_max     integer not null check (pct_logro_max between 0 and 100),
  puntaje_min       integer not null check (puntaje_min between 100 and 1000),
  puntaje_max       integer not null check (puntaje_max between 100 and 1000),
  check (pct_logro_min < pct_logro_max),
  unique (prueba, version, pct_logro_min)
);

comment on table public.conversion_puntaje is
  'Tramos de conversión % de logro -> puntaje PAES. El scoring interpola dentro del tramo.';

-- 3.6 PLANES DE SUSCRIPCIÓN — ensayos_mes define el límite del plan Básico
create table if not exists planes_suscripcion (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,           -- 'basico', 'premium', 'anual'
  nombre            text not null,
  descripcion       text,
  precio_clp        integer not null check (precio_clp >= 0),
  ensayos_mes       integer not null default 0 check (ensayos_mes >= 0),
  analytics_avanzados boolean not null default false,
  video_premium     boolean not null default false,
  destacado         boolean not null default false,
  activo            boolean not null default true
);

comment on column public.planes_suscripcion.ensayos_mes is
  'Límite de ensayos completos por mes. El API lo valida al crear un intento.';

-- ============================================================================
-- 4. ENSAYOS Y PREGUNTAS
-- ============================================================================

-- 4.1 ENSAYOS
create table if not exists ensayos (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  titulo        text not null,
  descripcion   text,
  materia_id    uuid not null references public.materias(id) on delete restrict,
  prueba        text not null check (prueba in ('M1', 'M2', 'CL', 'CIENCIAS', 'HISTORIA')),
  nivel         text not null default 'medio' check (nivel in ('basico', 'medio', 'avanzado')),
  duracion_min  integer not null default 60 check (duracion_min between 10 and 240),
  preguntas_count integer not null default 0,
  premium       boolean not null default false,
  es_diagnostico boolean not null default false,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

-- 4.2 ENSAYO <-> EJES
create table if not exists ensayo_ejes (
  id            uuid primary key default gen_random_uuid(),
  ensayo_id     uuid not null references public.ensayos(id) on delete cascade,
  eje_id        uuid not null references public.ejes(id) on delete cascade,
  peso          numeric(5,2) not null default 25,
  unique (ensayo_id, eje_id)
);

-- 4.3 PREGUNTAS — enunciado y explicación en LaTeX ($...$)
create table if not exists preguntas (
  id            uuid primary key default gen_random_uuid(),
  materia_id    uuid not null references public.materias(id) on delete restrict,
  eje_id        uuid references public.ejes(id) on delete set null,
  tipo          text not null default 'multiple' check (tipo in ('multiple', 'comprension_lectora')),
  enunciado     text not null,
  texto_base    text,                              -- para comprensión lectora
  explicacion   text,
  difficulty    integer not null default 2 check (difficulty between 1 and 5),
  activo        boolean not null default true
);

comment on column public.preguntas.enunciado is
  'Enunciado con notación LaTeX inline ($...$). Se renderiza con KaTeX en el cliente.';

-- 4.4 ALTERNATIVAS — la correcta NUNCA se envía al cliente antes de finalizar
create table if not exists alternativas (
  id            uuid primary key default gen_random_uuid(),
  pregunta_id   uuid not null references public.preguntas(id) on delete cascade,
  texto         text not null,
  es_correcta   boolean not null default false,
  posicion      smallint not null check (posicion between 0 and 8)
);

create unique index if not exists alternativas_pregunta_posicion_key
  on public.alternativas (pregunta_id, posicion);

-- 4.5 ENSAYO <-> PREGUNTAS (orden, puntaje parcial)
create table if not exists ensayo_preguntas (
  ensayo_id     uuid not null references public.ensayos(id) on delete cascade,
  pregunta_id   uuid not null references public.preguntas(id) on delete cascade,
  posicion      smallint not null,
  puntaje       numeric(6,2) not null default 10,
  primary key (ensayo_id, pregunta_id),
  unique (ensayo_id, posicion)
);

-- ============================================================================
-- 5. INTENTOS Y RESPUESTAS
-- ============================================================================

-- 5.1 INTENTOS — expira_en es la autoridad del temporizador
create table if not exists intentos (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid not null references public.usuarios(id) on delete cascade,
  ensayo_id             uuid not null references public.ensayos(id) on delete restrict,
  estado                estado_intento not null default 'en_curso',
  iniciado_en           timestamptz not null default now(),
  expira_en             timestamptz not null,
  entregado_en          timestamptz,
  duracion_min          integer not null,

  -- Resultado (lo calcula services/scoring.ts)
  correctas             integer not null default 0,
  incorrectas           integer not null default 0,
  omitidas              integer not null default 0,
  pct_logro             numeric(5,2) not null default 0,
  puntaje               integer,
  percentil             numeric(5,2),

  created_at            timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

create index if not exists intentos_usuario_fecha_idx
  on public.intentos (usuario_id, iniciado_en desc);
create index if not exists intentos_ensayo_estado_idx
  on public.intentos (ensayo_id, estado);
create unique index if not exists intentos_en_curso_unico
  on public.intentos (usuario_id, ensayo_id) where estado = 'en_curso';

-- 5.2 RESPUESTAS — autoguardado PUT /api/intentos/:id/respuestas/:preguntaId
create table if not exists respuestas (
  id                uuid primary key default gen_random_uuid(),
  intento_id        uuid not null references public.intentos(id) on delete cascade,
  pregunta_id       uuid not null references public.preguntas(id) on delete cascade,
  alternativa_id    uuid references public.alternativas(id) on delete set null,
  es_marcada        boolean not null default false,
  tiempo_segundos   integer not null default 0 check (tiempo_segundos >= 0),
  respondida_en     timestamptz not null default now(),
  unique (intento_id, pregunta_id)
);

create index if not exists respuestas_intento_idx on public.respuestas (intento_id);

-- 5.3 DESGLOSE POR EJE (materializado al calificar)
create table if not exists resultados_eje (
  intento_id        uuid not null references public.intentos(id) on delete cascade,
  eje_id            uuid not null references public.ejes(id) on delete cascade,
  total             integer not null default 0,
  correctas         integer not null default 0,
  pct_logro         numeric(5,2) not null default 0,
  primary key (intento_id, eje_id)
);

-- ============================================================================
-- 6. CONTENIDOS
-- ============================================================================

create table if not exists contenidos (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  titulo            text not null,
  descripcion       text,
  materia_id        uuid not null references public.materias(id) on delete restrict,
  eje_id            uuid references public.ejes(id) on delete set null,
  tipo              tipo_material not null default 'video',
  duracion_min      integer not null default 10,
  video_url         text,
  cuerpo_md         text,                           -- markdown + LaTeX
  puntos_clave      text[] not null default '{}',
  premium           boolean not null default false,
  material_urls     text[] not null default '{}',    -- rutas en storage
  orden             integer not null default 0,
  activo            boolean not null default true,
  creado_en         timestamptz not null default now()
);

create index if not exists contenidos_materia_idx on public.contenidos (materia_id);

create table if not exists progreso_contenido (
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  contenido_id      uuid not null references public.contenidos(id) on delete cascade,
  completado        boolean not null default false,
  porcentaje        integer not null default 0 check (porcentaje between 0 and 100),
  iniciado_en       timestamptz not null default now(),
  completado_en     timestamptz,
  primary key (usuario_id, contenido_id)
);

-- ============================================================================
-- 7. PLAN DE ESTUDIO (services/plan-generator.ts)
-- ============================================================================

create table if not exists planes_estudio (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  carrera_id        uuid references public.carreras(id) on delete set null,
  horas_semana      integer not null default 10 check (horas_semana between 1 and 80),
  fecha_inicio      date not null default current_date,
  fecha_examen      date,
  semanas           integer not null default 4 check (semanas between 1 and 52),
  activo            boolean not null default true,
  generado_por      text not null default 'generador' check (generado_por in ('generador', 'manual')),
  creado_en         timestamptz not null default now()
);

create index if not exists planes_estudio_usuario_idx on public.planes_estudio (usuario_id, activo);

-- Distribución porcentual por prueba (ej. Medicina: M1 40 %, Biología 35 %, CL 25 %)
create table if not exists plan_distribucion (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references public.planes_estudio(id) on delete cascade,
  materia_id        uuid not null references public.materias(id) on delete cascade,
  porcentaje        numeric(5,2) not null check (porcentaje between 0 and 100),
  horas_semana      numeric(5,2) not null default 0,
  unique (plan_id, materia_id)
);

create table if not exists tareas_plan (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references public.planes_estudio(id) on delete cascade,
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  titulo            text not null,
  descripcion       text,
  tipo              text not null default 'contenido'
                      check (tipo in ('contenido', 'ensayo', 'repaso', 'teoria')),
  contenido_id      uuid references public.contenidos(id) on delete set null,
  ensayo_id         uuid references public.ensayos(id) on delete set null,
  materia_id        uuid references public.materias(id) on delete set null,
  fecha_planificada date not null default current_date,
  duracion_min      integer not null default 30,
  estado            estado_tarea not null default 'pendiente',
  completada_en     timestamptz,
  created_at        timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index if not exists tareas_plan_usuario_fecha_idx
  on public.tareas_plan (usuario_id, fecha_planificada);
create index if not exists tareas_plan_plan_idx on public.tareas_plan (plan_id);

-- ============================================================================
-- 8. PREMIUM Y PAGOS
-- ============================================================================

create table if not exists suscripciones (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  plan_id           uuid not null references public.planes_suscripcion(id) on delete restrict,
  estado            estado_suscripcion not null default 'activa',
  proveedor         proveedor_pago not null default 'mock',
  inicia_en         timestamptz not null default now(),
  termina_en        timestamptz,
  cancelada_en      timestamptz,                    -- sigue activa hasta fin
  creado_en         timestamptz not null default now()
);

create unique index if not exists suscripciones_activa_unica
  on public.suscripciones (usuario_id) where estado = 'activa';

create table if not exists pagos (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  plan_id           uuid not null references public.planes_suscripcion(id) on delete restrict,
  estado            estado_pago not null default 'pendiente',
  metodo            metodo_pago not null default 'tarjeta',
  proveedor         proveedor_pago not null default 'mock',
  monto_clp         integer not null check (monto_clp >= 0),
  token_pago        text,                           -- token del proveedor, NUNCA la tarjeta
  ultimos4          char(4),                       -- solo últimos 4 dígitos
  referencia        text unique,
  payload_respuesta jsonb,                          -- respuesta cruda del proveedor
  creado_en         timestamptz not null default now(),
  confirmado_en     timestamptz
);

create index if not exists pagos_usuario_fecha_idx on public.pagos (usuario_id, creado_en desc);

-- ============================================================================
-- 9. COMUNIDAD
-- ============================================================================

-- 9.1 PERFILES PÚBLICOS (tutores y estudiantes con visibilidad social)
create table if not exists perfiles_publicos (
  usuario_id        uuid primary key references public.usuarios(id) on delete cascade,
  titulo            text,                           -- "Profesor de M1"
  especialidad      text,
  bio               text,
  verificado        boolean not null default false,
  rating_promedio   numeric(3,2) not null default 0 check (rating_promedio between 0 and 5),
  rating_cantidad   integer not null default 0,
  seguidores        integer not null default 0,
  creado_en         timestamptz not null default now()
);

-- 9.2 PUBLICACIONES — `busqueda` generado para full-text español + trigram
create table if not exists publicaciones (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  materia_id        uuid references public.materias(id) on delete set null,
  tipo              tipo_publicacion not null default 'duda',
  titulo            text not null check (char_length(titulo) between 4 and 180),
  cuerpo            text not null check (char_length(cuerpo) between 1 and 8000),
  estado            estado_publicacion not null default 'visible',
  resuelta          boolean not null default false,
  mejor_respuesta_id uuid,                            -- FK agregada tras crear comentarios
  votos             integer not null default 0,
  busqueda          text generated always as (
                      setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
                      setweight(to_tsvector('spanish', coalesce(cuerpo, '')), 'B')
                    ) stored,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index if not exists publicaciones_busqueda_idx
  on public.publicaciones using gin (busqueda);
create index if not exists publicaciones_titulo_trgm_idx
  on public.publicaciones using gin (titulo gin_trgm_ops);
create index if not exists publicaciones_feed_idx
  on public.publicaciones (estado, creado_en desc);

-- 9.3 VOTOS (like) — optimista en el cliente
create table if not exists votos (
  publicacion_id   uuid not null references public.publicaciones(id) on delete cascade,
  usuario_id       uuid not null references public.usuarios(id) on delete cascade,
  creado_en        timestamptz not null default now(),
  primary key (publicacion_id, usuario_id)
);

-- 9.4 COMENTARIOS — anidados 1 nivel vía responde_a_id
create table if not exists comentarios (
  id                uuid primary key default gen_random_uuid(),
  publicacion_id   uuid not null references public.publicaciones(id) on delete cascade,
  usuario_id       uuid not null references public.usuarios(id) on delete cascade,
  responde_a_id    uuid references public.comentarios(id) on delete cascade,
  cuerpo           text not null check (char_length(cuerpo) between 1 and 4000),
  es_mejor         boolean not null default false,
  borrado           boolean not null default false,
  creado_en        timestamptz not null default now()
);

create index if not exists comentarios_publicacion_idx on public.comentarios (publicacion_id, creado_en);

-- La publicación apunta a su mejor respuesta. Se declara acá, y no junto a
-- publicaciones, porque comentarios referencia publicaciones y la relación es
-- circular: la FK necesita que ambas tablas ya existan.
alter table public.publicaciones
  drop constraint if exists publicaciones_mejor_respuesta_fk;
alter table public.publicaciones
  add  constraint publicaciones_mejor_respuesta_fk
  foreign key (mejor_respuesta_id) references public.comentarios(id) on delete set null;

-- 9.5 SEGUIMIENTOS
create table if not exists seguidores (
  seguidor_id     uuid not null references public.usuarios(id) on delete cascade,
  seguido_id      uuid not null references public.usuarios(id) on delete cascade,
  creado_en       timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);

-- 9.6 RESEÑAS DE TUTOR (el trigger calcula el promedio)
create table if not exists resenas_tutor (
  id                uuid primary key default gen_random_uuid(),
  tutor_id          uuid not null references public.usuarios(id) on delete cascade,
  autor_id          uuid not null references public.usuarios(id) on delete cascade,
  calificacion      integer not null check (calificacion between 1 and 5),
  comentario        text,
  creado_en         timestamptz not null default now(),
  unique (tutor_id, autor_id)
);

-- 9.7 REPORTES (moderación)
create table if not exists reportes (
  id                uuid primary key default gen_random_uuid(),
  reportante_id     uuid not null references public.usuarios(id) on delete cascade,
  publicacion_id   uuid references public.publicaciones(id) on delete cascade,
  comentario_id     uuid references public.comentarios(id) on delete cascade,
  motivo            text not null,
  estado            text not null default 'pendiente' check (estado in ('pendiente', 'revisado', 'descartado')),
  creado_en         timestamptz not null default now(),
  check (publicacion_id is not null or comentario_id is not null)
);

-- ============================================================================
-- 10. NOTIFICACIONES
-- ============================================================================

create table if not exists notificaciones (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  tipo              tipo_notificacion not null default 'sistema',
  titulo            text not null,
  cuerpo            text,
  url               text,
  agrupador         text,                           -- agrupa likes/comentarios
  leida             boolean not null default false,
  creado_en         timestamptz not null default now()
);

create index if not exists notificaciones_usuario_idx
  on public.notificaciones (usuario_id, creado_en desc);
create index if not exists notificaciones_no_leidas_idx
  on public.notificaciones (usuario_id) where leida = false;

-- ============================================================================
-- 11. ACTIVIDAD DIARIA (base de las rachas)
-- ============================================================================

create table if not exists actividad_diaria (
  usuario_id        uuid not null references public.usuarios(id) on delete cascade,
  fecha             date not null default current_date,
  tipo              tipo_actividad not null,
  cantidad          integer not null default 1 check (cantidad > 0),
  primary key (usuario_id, fecha)
);

-- ============================================================================
-- 12. ÍNDICES DE BÚSQUEDA FULL-TEXT
-- ============================================================================
create index if not exists carreras_nombre_trgm_idx  on public.carreras using gin (nombre gin_trgm_ops);
create index if not exists universidades_nombre_trgm_idx on public.universidades using gin (nombre gin_trgm_ops);
create index if not exists colegios_nombre_trgm_idx on public.colegios using gin (nombre gin_trgm_ops);
create index if not exists comentarios_cuerpo_trgm_idx on public.comentarios using gin (cuerpo gin_trgm_ops);

-- ============================================================================
-- 13. FUNCIONES Y TRIGGERS
-- ============================================================================

-- 13.1 timestamps automáticos
create or replace function public.tg_timestamps() returns trigger
language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists usuarios_ts on public.usuarios;
create trigger usuarios_ts before update on public.usuarios
  for each row execute function public.tg_timestamps();

drop trigger if exists publicaciones_ts on public.publicaciones;
create trigger publicaciones_ts before update on public.publicaciones
  for each row execute function public.tg_timestamps();

drop trigger if exists contenidos_ts on public.contenidos;
create trigger contenidos_ts before update on public.contenidos
  for each row execute function public.tg_timestamps();

-- 13.2 preference row lazily created
create or replace function public.tg_crear_preferencias() returns trigger
language plpgsql as $$
begin
  insert into public.preferencias_usuario (usuario_id) values (new.id)
  on conflict (usuario_id) do nothing;
  return new;
end $$;

drop trigger if exists usuarios_crear_preferencias on public.usuarios;
create trigger usuarios_crear_preferencias after insert on public.usuarios
  for each row execute function public.tg_crear_preferencias();

-- 13.3 Contadores denormalizados
--
-- Nota: en un trigger de fila, OLD no está asignado en INSERT y NEW no lo
-- está en DELETE. Por eso el id se lee según TG_OP; usar coalesce(new, old)
-- lanzaría "record is not assigned yet".
create or replace function public.tg_contar_votos() returns trigger
language plpgsql as $$
declare v_id uuid;
begin
  v_id := case when tg_op = 'DELETE' then old.publicacion_id else new.publicacion_id end;
  update public.publicaciones
     set votos = greatest(0, votos + (case when tg_op = 'INSERT' then 1 else -1 end))
   where id = v_id;
  return null;
end $$;

drop trigger if exists votos_contador on public.votos;
create trigger votos_contador after insert or delete on public.votos
  for each row execute function public.tg_contar_votos();

create or replace function public.tg_contar_seguidores() returns trigger
language plpgsql as $$
declare v_id uuid;
begin
  v_id := case when tg_op = 'DELETE' then old.seguido_id else new.seguido_id end;
  insert into public.perfiles_publicos (usuario_id, seguidores)
  values (v_id, 0)
  on conflict (usuario_id) do nothing;

  update public.perfiles_publicos
     set seguidores = seguidores + (case when tg_op = 'INSERT' then 1 else -1 end)
   where usuario_id = v_id;
  return null;
end $$;

drop trigger if exists seguidores_contador on public.seguidores;
create trigger seguidores_contador after insert or delete on public.seguidores
  for each row execute function public.tg_contar_seguidores();

-- 13.4 Rating del tutor: el trigger calcula el promedio
create or replace function public.tg_rating_tutor() returns trigger
language plpgsql as $$
declare v_tutor uuid;
begin
  v_tutor := case when tg_op = 'DELETE' then old.tutor_id else new.tutor_id end;
  update public.perfiles_publicos pp
     set rating_promedio = agg.prom,
         rating_cantidad = agg.cnt
    from (select round(avg(r.calificacion)::numeric, 2) as prom,
                 count(*)::int as cnt
            from public.resenas_tutor r
           where r.tutor_id = v_tutor) agg
   where pp.usuario_id = v_tutor;
  return null;
end $$;

drop trigger if exists resenas_rating on public.resenas_tutor;
create trigger resenas_rating after insert or update or delete on public.resenas_tutor
  for each row execute function public.tg_rating_tutor();

-- 13.5 Al marcar "Mejor respuesta" la publicación queda resuelta
create or replace function public.tg_mejor_respuesta() returns trigger
language plpgsql as $$
begin
  update public.publicaciones
     set resuelta = true,
         mejor_respuesta_id = new.id
   where id = new.publicacion_id;
  new.es_mejor := true;
  return new;
end $$;

drop trigger if exists comentarios_mejor on public.comentarios;
create trigger comentarios_mejor before update of es_mejor on public.comentarios
  for each row when (new.es_mejor and not coalesce(old.es_mejor, false))
  execute function public.tg_mejor_respuesta();

-- 13.6 Mantener preguntas_count de ensayos al agregar/quitar preguntas
create or replace function public.tg_contar_preguntas() returns trigger
language plpgsql as $$
declare v_ensayo uuid;
begin
  v_ensayo := case when tg_op = 'DELETE' then old.ensayo_id else new.ensayo_id end;
  update public.ensayos
     set preguntas_count = (
           select count(*) from public.ensayo_preguntas ep where ep.ensayo_id = v_ensayo
         )
   where id = v_ensayo;
  return null;
end $$;

drop trigger if exists ensayo_preguntas_contador on public.ensayo_preguntas;
create trigger ensayo_preguntas_contador after insert or delete on public.ensayo_preguntas
  for each row execute function public.tg_contar_preguntas();

-- ============================================================================
-- 14. VISTAS
-- ============================================================================

-- 14.1 Precisión por eje: alimenta "Recomendado para ti" (menor = punto débil)
create or replace view public.v_precision_por_eje as
select
  i.usuario_id,
  re.eje_id,
  e.materia_id,
  m.codigo       as materia_codigo,
  e.codigo       as eje_codigo,
  e.nombre       as eje_nombre,
  count(*)::int                                        as total,
  sum(re.correctas)::int                              as correctas,
  round(avg(re.pct_logro)::numeric, 2)                 as precision,
  max(i.entregado_en)                                  as ultimo_intento
from public.resultados_eje re
join public.intentos i on i.id = re.intento_id and i.estado = 'entregado'
join public.ejes e   on e.id = re.eje_id
join public.materias m on m.id = e.materia_id
where re.total > 0
group by i.usuario_id, re.eje_id, e.materia_id, m.codigo, e.codigo, e.nombre;

comment on view public.v_precision_por_eje is
  'Precisión (%) por usuario y eje temático. El eje con menor precisión es el punto débil recomendado.';

-- 14.2 Resumen del intento con slug de ensayo y datos de carrera
create or replace view public.v_intentos_resumen as
select
  i.id,
  i.usuario_id,
  i.ensayo_id,
  e.slug,
  e.titulo,
  e.prueba,
  e.duracion_min,
  m.area,
  i.estado,
  i.iniciado_en,
  i.entregado_en,
  i.expira_en,
  i.correctas,
  i.incorrectas,
  i.omitidas,
  i.pct_logro,
  i.puntaje,
  i.percentil
from public.intentos i
join public.ensayos e on e.id = i.ensayo_id
join public.materias m on m.id = e.materia_id;

-- 14.3 Percentil: comparación contra los demás intentos del mismo ensayo
create or replace function public.percentil_ensayo(p_ensayo uuid, p_puntaje integer)
returns numeric language sql stable as $$
  select case
           when count(*) = 0 then null
           else round(
             (select count(*) from (
                select puntaje from public.intentos
                 where ensayo_id = p_ensayo and estado = 'entregado' and puntaje is not null
             ) s2
              where s2.puntaje <= p_puntaje)::numeric
             * 100 / count(*), 2)
         end
  from public.intentos
   where ensayo_id = p_ensayo and estado = 'entregado' and puntaje is not null;
$$;

-- 14.4 Tareas del plan con sus destinos resueltos (dashboard / plan)
create or replace view public.v_tareas_plan_join as
select
  t.*,
  c.titulo as contenido_titulo,
  c.slug   as contenido_slug,
  c.tipo   as contenido_tipo,
  en.slug  as ensayo_slug,
  en.premium as ensayo_premium,
  m.codigo as materia_codigo,
  m.area   as materia_area
from public.tareas_plan t
left join public.contenidos c on c.id = t.contenido_id
left join public.ensayos    en on en.id = t.ensayo_id
left join public.materias    m on m.id = t.materia_id;

-- ============================================================================
-- 15. GRANTS
-- ============================================================================
grant usage on schema public to public;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('grant select, insert, update, delete on public.%I to public', t);
  end loop;
  for t in select sequence_name from information_schema.sequences where sequence_schema = 'public'
  loop
    execute format('grant usage, select on public.%I to public', t);
  end loop;
end $$;
