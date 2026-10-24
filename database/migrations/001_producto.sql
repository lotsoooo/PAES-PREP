-- ============================================================================
-- 001_producto — tablas y columnas que pide el producto completo
-- ----------------------------------------------------------------------------
-- Aditiva e idempotente: no borra ni reescribe datos existentes. Se aplica con
-- `bun run db:migrate` y su contenido también vive en database/schema.sql para
-- que una base nueva nazca completa.
-- ============================================================================

set search_path to public, extensions;

-- ---------------------------------------------------------------------------
-- Enums: valores nuevos
-- ---------------------------------------------------------------------------
alter type tipo_material add value if not exists 'practica';
alter type tipo_notificacion add value if not exists 'recordatorio';
alter type tipo_notificacion add value if not exists 'material_nuevo';
alter type tipo_actividad add value if not exists 'repaso';

-- ---------------------------------------------------------------------------
-- Columnas nuevas
-- ---------------------------------------------------------------------------
alter table public.usuarios
  add column if not exists pruebas_objetivo text[] not null default '{}';

alter table public.preguntas
  add column if not exists error_comun text,
  add column if not exists video_url  text;

-- El trigger contenidos_ts escribe actualizado_en, pero la columna no existía:
-- cualquier UPDATE sobre contenidos fallaba (D-014).
alter table public.contenidos
  add column if not exists unidad text,
  add column if not exists actualizado_en timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Oferta académica: puntaje de corte por carrera y universidad
-- ---------------------------------------------------------------------------
create table if not exists public.carreras_universidades (
  carrera_id      uuid not null references public.carreras(id) on delete cascade,
  universidad_id  uuid not null references public.universidades(id) on delete cascade,
  puntaje_corte   integer not null check (puntaje_corte between 100 and 1000),
  vacantes        integer check (vacantes > 0),
  primary key (carrera_id, universidad_id)
);

-- ---------------------------------------------------------------------------
-- Comunidad: guardados y likes de comentarios
-- ---------------------------------------------------------------------------
create table if not exists public.guardados (
  usuario_id      uuid not null references public.usuarios(id) on delete cascade,
  publicacion_id  uuid not null references public.publicaciones(id) on delete cascade,
  creado_en       timestamptz not null default now(),
  primary key (usuario_id, publicacion_id)
);

create table if not exists public.votos_comentario (
  comentario_id   uuid not null references public.comentarios(id) on delete cascade,
  usuario_id      uuid not null references public.usuarios(id) on delete cascade,
  creado_en       timestamptz not null default now(),
  primary key (comentario_id, usuario_id)
);

-- ---------------------------------------------------------------------------
-- Cuaderno de errores con repaso espaciado (cajas de Leitner)
-- caja 1 → repasa mañana; 2 → en 3 días; 3 → 7; 4 → 14; 5 → 30 (dominada).
-- ---------------------------------------------------------------------------
create table if not exists public.cuaderno_errores (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references public.usuarios(id) on delete cascade,
  pregunta_id      uuid not null references public.preguntas(id) on delete cascade,
  intento_id       uuid references public.intentos(id) on delete set null,
  origen           text not null default 'ensayo' check (origen in ('ensayo', 'manual', 'mini_test')),
  caja             smallint not null default 1 check (caja between 1 and 5),
  proximo_repaso   date not null default (current_date + 1),
  repasos          integer not null default 0,
  aciertos         integer not null default 0,
  dominada         boolean not null default false,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  unique (usuario_id, pregunta_id)
);

create index if not exists cuaderno_errores_pendientes_idx
  on public.cuaderno_errores (usuario_id, proximo_repaso) where dominada = false;

-- ---------------------------------------------------------------------------
-- Logros
-- ---------------------------------------------------------------------------
create table if not exists public.logros (
  codigo          text primary key,
  nombre          text not null,
  descripcion     text not null,
  icono           text not null,
  orden           integer not null default 0
);

create table if not exists public.logros_usuario (
  usuario_id      uuid not null references public.usuarios(id) on delete cascade,
  logro_codigo    text not null references public.logros(codigo) on delete cascade,
  obtenido_en     timestamptz not null default now(),
  primary key (usuario_id, logro_codigo)
);

insert into public.logros (codigo, nombre, descripcion, icono, orden) values
  ('primer_ensayo',   'Primer ensayo',        'Entregaste tu primer ensayo completo.',                 'flag',                  1),
  ('racha_7',         'Una semana seguida',   'Estudiaste 7 días seguidos.',                            'local_fire_department', 2),
  ('racha_30',        'Constancia',           'Estudiaste 30 días seguidos.',                           'whatshot',              3),
  ('meta_superada',   'Meta superada',        'Un ensayo alcanzó o superó tu puntaje meta.',            'emoji_events',          4),
  ('diez_ensayos',    'Diez ensayos',         'Entregaste 10 ensayos.',                                 'library_books',         5),
  ('repaso_20',       'Errores corregidos',   'Dominaste 20 preguntas de tu cuaderno de errores.',      'task_alt',              6),
  ('primer_aporte',   'Primer aporte',        'Publicaste tu primera pregunta o tip en la comunidad.',  'forum',                 7),
  ('plan_semana',     'Semana completa',      'Completaste todas las tareas de una semana del plan.',  'event_available',       8)
on conflict (codigo) do update
  set nombre = excluded.nombre, descripcion = excluded.descripcion,
      icono = excluded.icono, orden = excluded.orden;

-- ---------------------------------------------------------------------------
-- Correcciones de catálogo (texto con errores de tipeo en seed.sql)
-- Los ejes de M1 usan los nombres del temario PAES vigente.
-- ---------------------------------------------------------------------------
update public.ejes e set nombre = v.nombre, descripcion = v.descripcion
from (values
  ('M1', 'A', 'Números',                       'Conjuntos numéricos, porcentajes, potencias y raíces'),
  ('M1', 'B', 'Álgebra y funciones',           'Expresiones algebraicas, ecuaciones, inecuaciones y funciones'),
  ('M1', 'C', 'Geometría',                     'Figuras planas y cuerpos, semejanza, transformaciones isométricas'),
  ('M1', 'D', 'Probabilidad y estadística',    'Datos, medidas de tendencia central y probabilidades'),
  ('M2', 'A', 'Álgebra y funciones',           'Funciones exponenciales, logarítmicas y sistemas de ecuaciones'),
  ('M2', 'B', 'Geometría',                     'Geometría analítica, vectores y homotecia'),
  ('M2', 'C', 'Probabilidad y estadística',    'Variables aleatorias, binomial y normal'),
  ('M2', 'D', 'Números',                       'Números reales, logaritmos y matemática financiera'),
  ('CL', 'A', 'Localizar',                     'Extraer información explícita del texto'),
  ('CL', 'B', 'Interpretar',                   'Inferir el sentido global y local del texto'),
  ('CL', 'C', 'Evaluar',                       'Juzgar la forma y el contenido del texto'),
  ('CL', 'D', 'Vocabulario contextual',        'Precisar el sentido de palabras según el contexto'),
  ('BIO', 'B', 'Genética',                     'Herencia mendeliana y ADN'),
  ('HIST', 'A', 'Historia de Chile',           'Formación de la República y siglo XIX'),
  ('HIST', 'B', 'Historia universal',          'Revoluciones, guerras mundiales y Guerra Fría'),
  ('HIST', 'C', 'Formación ciudadana',         'Democracia, Estado de derecho y participación'),
  ('HIST', 'D', 'Sistema económico',           'Mercado, rol del Estado y economía chilena')
) as v(materia, codigo, nombre, descripcion)
join public.materias m on m.codigo = v.materia
where e.materia_id = m.id and e.codigo = v.codigo;

update public.contenidos
   set descripcion = 'Resuelve $e^{x}=k$ y modela crecimiento poblacional y financiero.'
 where slug = 'teoria-exponenciales';

-- Los videos de ejemplo apuntaban a un enlace de relleno. Sin un video real,
-- la lección se muestra como lectura (ver DECISIONES D-016).
update public.contenidos set video_url = null
 where video_url like '%dQw4w9WgXcQ%';

-- ---------------------------------------------------------------------------
-- Seguridad: RLS en todas las tablas públicas.
-- En Supabase el rol `anon` puede leer cualquier tabla con grant a `public`
-- vía la API REST. El API propio se conecta como dueño de las tablas y no se
-- ve afectado (el dueño ignora RLS salvo `force row level security`).
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
