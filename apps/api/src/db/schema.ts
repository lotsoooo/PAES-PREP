/**
 * Esquema Drizzle: espejo tipado de database/schema.sql.
 *
 * La fuente de verdad es el SQL (para mantener compatibilidad con Supabase y
 * Neon). Este archivo se genera con `bun run db:pull` y, mientras tanto, se
 * mantiene en sync a mano para que el API compile con tipos estrictos.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  char,
  date,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ===========================================================================
// ENUMS
// ===========================================================================

export const rolUsuario = pgEnum('rol_usuario', ['estudiante', 'profesor', 'admin']);
export const temaApp = pgEnum('tema_app', ['claro', 'oscuro', 'sistema']);
export const estadoIntento = pgEnum('estado_intento', [
  'en_curso',
  'entregado',
  'expirado',
  'abandonado',
]);
export const tipoMaterial = pgEnum('tipo_material', ['video', 'pdf', 'mixto']);
export const tipoPublicacion = pgEnum('tipo_publicacion', ['duda', 'tip', 'material', 'debate']);
export const estadoPago = pgEnum('estado_pago', ['pendiente', 'aprobado', 'rechazado', 'reembolsado']);
export const metodoPago = pgEnum('metodo_pago', ['tarjeta', 'webpay']);
export const estadoSuscripcion = pgEnum('estado_suscripcion', ['activa', 'cancelada', 'vencida']);
export const proveedorPago = pgEnum('proveedor_pago', ['mock', 'webpay']);
export const tipoActividad = pgEnum('tipo_actividad', [
  'ensayo',
  'contenido',
  'tarea_plan',
  'comunidad',
]);
export const estadoTarea = pgEnum('estado_tarea', ['pendiente', 'en_curso', 'completada', 'omitida']);
export const tipoNotificacion = pgEnum('tipo_notificacion', [
  'resultados_disponibles',
  'nuevo_plan',
  'plan_actualizado',
  'racha',
  'comentario',
  'like',
  'respuesta',
  'pago',
  'sistema',
]);
export const estadoPublicacion = pgEnum('estado_publicacion', ['visible', 'oculta', 'eliminada']);

// ===========================================================================
// 2. IDENTIDAD Y SESIONES
// ===========================================================================

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  nombre: text('nombre').notNull(),
  apellido: text('apellido'),
  passwordHash: text('password_hash'),
  emailVerificado: boolean('email_verificado').notNull().default(false),
  rol: rolUsuario('rol').notNull().default('estudiante'),
  onboardingCompletado: boolean('onboarding_completado').notNull().default(false),
  avatarUrl: text('avatar_url'),
  curso: text('curso'),
  colegioId: uuid('colegio_id'),
  carreraId: uuid('carrera_id'),
  universidadId: uuid('universidad_id'),
  puntajeMeta: integer('puntaje_meta'),
  fechaExamen: date('fecha_examen'),
  horasSemana: integer('horas_semana'),
  diasDisponibles: smallint('dias_disponibles').array().notNull().default(sql`'{}'::smallint[]`),
  rachaActual: integer('racha_actual').notNull().default(0),
  rachaMaxima: integer('racha_maxima').notNull().default(0),
  ultimaActividad: date('ultima_actividad'),
  eliminadoEn: timestamp('eliminado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
});

export const cuentasOauth = pgTable(
  'cuentas_oauth',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    proveedor: text('proveedor').notNull(),
    proveedorUsuarioId: text('proveedor_usuario_id').notNull(),
    email: text('email').notNull(),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('cuentas_oauth_proveedor_usuario_key').on(t.proveedor, t.proveedorUsuarioId),
    unique('cuentas_oauth_usuario_proveedor_key').on(t.usuarioId, t.proveedor),
  ],
);

export const sesiones = pgTable('sesiones', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  familiaId: uuid('familia_id').notNull(),
  userAgent: text('user_agent'),
  ip: inet('ip'),
  expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
  revocadoEn: timestamp('revocado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  ultimoUsoEn: timestamp('ultimo_uso_en', { withTimezone: true }).notNull().defaultNow(),
});

export const tokensRecuperacion = pgTable('tokens_recuperacion', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
  usadoEn: timestamp('usado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

export const preferenciasUsuario = pgTable('preferencias_usuario', {
  usuarioId: uuid('usuario_id')
    .primaryKey()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tema: temaApp('tema').notNull().default('sistema'),
  notifEmail: boolean('notif_email').notNull().default(true),
  notifPush: boolean('notif_push').notNull().default(true),
  notifResultados: boolean('notif_resultados').notNull().default(true),
  notifSocial: boolean('notif_social').notNull().default(true),
  notifRacha: boolean('notif_racha').notNull().default(true),
  notifMarketing: boolean('notif_marketing').notNull().default(false),
  idioma: text('idioma').notNull().default('es-CL'),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================================================
// 3. CATÁLOGOS ACADÉMICOS
// ===========================================================================

export const colegios = pgTable('colegios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  comuna: text('comuna'),
  region: text('region'),
  dominioEmail: text('dominio_email'),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

export const materias = pgTable('materias', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  area: text('area').notNull(),
  peso: numeric('peso', { precision: 5, scale: 2 }).notNull().default('1'),
  activo: boolean('activo').notNull().default(true),
});

export const ejes = pgTable(
  'ejes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    materiaId: uuid('materia_id')
      .notNull()
      .references(() => materias.id, { onDelete: 'cascade' }),
    codigo: text('codigo').notNull(),
    nombre: text('nombre').notNull(),
    descripcion: text('descripcion'),
  },
  (t) => [unique('ejes_materia_codigo_key').on(t.materiaId, t.codigo)],
);

export const carreras = pgTable('carreras', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull().unique(),
  area: text('area').notNull(),
  duracionAnios: integer('duracion_anios'),
  puntajeReferencia: integer('puntaje_referencia'),
  popular: boolean('popular').notNull().default(false),
});

export const universidades = pgTable('universidades', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull().unique(),
  tipo: text('tipo').notNull().default('privada'),
  region: text('region'),
  puntajeCorte: integer('puntaje_corte'),
});

export const conversionPuntaje = pgTable(
  'conversion_puntaje',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prueba: text('prueba').notNull(),
    version: text('version').notNull().default('2026'),
    pctLogroMin: integer('pct_logro_min').notNull(),
    pctLogroMax: integer('pct_logro_max').notNull(),
    puntajeMin: integer('puntaje_min').notNull(),
    puntajeMax: integer('puntaje_max').notNull(),
  },
  (t) => [
    unique('conversion_puntaje_prueba_version_min_key').on(
      t.prueba,
      t.version,
      t.pctLogroMin,
    ),
  ],
);

export const planesSuscripcion = pgTable('planes_suscripcion', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  precioClp: integer('precio_clp').notNull(),
  ensayosMes: integer('ensayos_mes').notNull().default(0),
  analyticsAvanzados: boolean('analytics_avanzados').notNull().default(false),
  videoPremium: boolean('video_premium').notNull().default(false),
  destacado: boolean('destacado').notNull().default(false),
  activo: boolean('activo').notNull().default(true),
});

// ===========================================================================
// 4. ENSAYOS Y PREGUNTAS
// ===========================================================================

export const ensayos = pgTable('ensayos', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  materiaId: uuid('materia_id')
    .notNull()
    .references(() => materias.id, { onDelete: 'restrict' }),
  prueba: text('prueba').notNull(),
  nivel: text('nivel').notNull().default('medio'),
  duracionMin: integer('duracion_min').notNull().default(60),
  preguntasCount: integer('preguntas_count').notNull().default(0),
  premium: boolean('premium').notNull().default(false),
  esDiagnostico: boolean('es_diagnostico').notNull().default(false),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

export const ensayoEjes = pgTable(
  'ensayo_ejes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ensayoId: uuid('ensayo_id')
      .notNull()
      .references(() => ensayos.id, { onDelete: 'cascade' }),
    ejeId: uuid('eje_id')
      .notNull()
      .references(() => ejes.id, { onDelete: 'cascade' }),
    peso: numeric('peso', { precision: 5, scale: 2 }).notNull().default('25'),
  },
  (t) => [unique('ensayo_ejes_ensayo_eje_key').on(t.ensayoId, t.ejeId)],
);

export const preguntas = pgTable('preguntas', {
  id: uuid('id').primaryKey().defaultRandom(),
  materiaId: uuid('materia_id')
    .notNull()
    .references(() => materias.id, { onDelete: 'restrict' }),
  ejeId: uuid('eje_id').references(() => ejes.id, { onDelete: 'set null' }),
  tipo: text('tipo').notNull().default('multiple'),
  enunciado: text('enunciado').notNull(),
  textoBase: text('texto_base'),
  explicacion: text('explicacion'),
  difficulty: integer('difficulty').notNull().default(2),
  activo: boolean('activo').notNull().default(true),
});

export const alternativas = pgTable(
  'alternativas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    preguntaId: uuid('pregunta_id')
      .notNull()
      .references(() => preguntas.id, { onDelete: 'cascade' }),
    texto: text('texto').notNull(),
    esCorrecta: boolean('es_correcta').notNull().default(false),
    posicion: smallint('posicion').notNull(),
  },
  (t) => [uniqueIndex('alternativas_pregunta_posicion_key').on(t.preguntaId, t.posicion)],
);

export const ensayoPreguntas = pgTable(
  'ensayo_preguntas',
  {
    ensayoId: uuid('ensayo_id')
      .notNull()
      .references(() => ensayos.id, { onDelete: 'cascade' }),
    preguntaId: uuid('pregunta_id')
      .notNull()
      .references(() => preguntas.id, { onDelete: 'cascade' }),
    posicion: smallint('posicion').notNull(),
    puntaje: numeric('puntaje', { precision: 6, scale: 2 }).notNull().default('10'),
  },
  (t) => [
    primaryKey({ columns: [t.ensayoId, t.preguntaId] }),
    unique('ensayo_preguntas_ensayo_posicion_key').on(t.ensayoId, t.posicion),
  ],
);

// ===========================================================================
// 5. INTENTOS Y RESPUESTAS
// ===========================================================================

export const intentos = pgTable(
  'intentos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    ensayoId: uuid('ensayo_id')
      .notNull()
      .references(() => ensayos.id, { onDelete: 'restrict' }),
    estado: estadoIntento('estado').notNull().default('en_curso'),
    iniciadoEn: timestamp('iniciado_en', { withTimezone: true }).notNull().defaultNow(),
    expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
    entregadoEn: timestamp('entregado_en', { withTimezone: true }),
    duracionMin: integer('duracion_min').notNull(),
    correctas: integer('correctas').notNull().default(0),
    incorrectas: integer('incorrectas').notNull().default(0),
    omitidas: integer('omitidas').notNull().default(0),
    pctLogro: numeric('pct_logro', { precision: 5, scale: 2 }).notNull().default('0'),
    puntaje: integer('puntaje'),
    percentil: numeric('percentil', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('intentos_usuario_fecha_idx').on(t.usuarioId, t.iniciadoEn.desc()),
    index('intentos_ensayo_estado_idx').on(t.ensayoId, t.estado),
    uniqueIndex('intentos_en_curso_unico')
      .on(t.usuarioId, t.ensayoId)
      .where(sql`estado = 'en_curso'`),
  ],
);

export const respuestas = pgTable(
  'respuestas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    intentoId: uuid('intento_id')
      .notNull()
      .references(() => intentos.id, { onDelete: 'cascade' }),
    preguntaId: uuid('pregunta_id')
      .notNull()
      .references(() => preguntas.id, { onDelete: 'cascade' }),
    alternativaId: uuid('alternativa_id').references(() => alternativas.id, { onDelete: 'set null' }),
    esMarcada: boolean('es_marcada').notNull().default(false),
    tiempoSegundos: integer('tiempo_segundos').notNull().default(0),
    respondidaEn: timestamp('respondida_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('respuestas_intento_pregunta_key').on(t.intentoId, t.preguntaId),
    index('respuestas_intento_idx').on(t.intentoId),
  ],
);

export const resultadosEje = pgTable(
  'resultados_eje',
  {
    intentoId: uuid('intento_id')
      .notNull()
      .references(() => intentos.id, { onDelete: 'cascade' }),
    ejeId: uuid('eje_id')
      .notNull()
      .references(() => ejes.id, { onDelete: 'cascade' }),
    total: integer('total').notNull().default(0),
    correctas: integer('correctas').notNull().default(0),
    pctLogro: numeric('pct_logro', { precision: 5, scale: 2 }).notNull().default('0'),
  },
  (t) => [primaryKey({ columns: [t.intentoId, t.ejeId] })],
);

// ===========================================================================
// 6. CONTENIDOS
// ===========================================================================

export const contenidos = pgTable(
  'contenidos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    titulo: text('titulo').notNull(),
    descripcion: text('descripcion'),
    materiaId: uuid('materia_id')
      .notNull()
      .references(() => materias.id, { onDelete: 'restrict' }),
    ejeId: uuid('eje_id').references(() => ejes.id, { onDelete: 'set null' }),
    tipo: tipoMaterial('tipo').notNull().default('video'),
    duracionMin: integer('duracion_min').notNull().default(10),
    videoUrl: text('video_url'),
    cuerpoMd: text('cuerpo_md'),
    puntosClave: text('puntos_clave').array().notNull().default(sql`'{}'::text[]`),
    premium: boolean('premium').notNull().default(false),
    materialUrls: text('material_urls').array().notNull().default(sql`'{}'::text[]`),
    orden: integer('orden').notNull().default(0),
    activo: boolean('activo').notNull().default(true),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contenidos_materia_idx').on(t.materiaId)],
);

export const progresoContenido = pgTable(
  'progreso_contenido',
  {
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    contenidoId: uuid('contenido_id')
      .notNull()
      .references(() => contenidos.id, { onDelete: 'cascade' }),
    completado: boolean('completado').notNull().default(false),
    porcentaje: integer('porcentaje').notNull().default(0),
    iniciadoEn: timestamp('iniciado_en', { withTimezone: true }).notNull().defaultNow(),
    completadoEn: timestamp('completado_en', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.usuarioId, t.contenidoId] })],
);

// ===========================================================================
// 7. PLAN DE ESTUDIO
// ===========================================================================

export const planesEstudio = pgTable(
  'planes_estudio',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    carreraId: uuid('carrera_id').references(() => carreras.id, { onDelete: 'set null' }),
    horasSemana: integer('horas_semana').notNull().default(10),
    fechaInicio: date('fecha_inicio').notNull().defaultNow(),
    fechaExamen: date('fecha_examen'),
    semanas: integer('semanas').notNull().default(4),
    activo: boolean('activo').notNull().default(true),
    generadoPor: text('generado_por').notNull().default('generador'),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('planes_estudio_usuario_idx').on(t.usuarioId, t.activo)],
);

export const planDistribucion = pgTable(
  'plan_distribucion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => planesEstudio.id, { onDelete: 'cascade' }),
    materiaId: uuid('materia_id')
      .notNull()
      .references(() => materias.id, { onDelete: 'cascade' }),
    porcentaje: numeric('porcentaje', { precision: 5, scale: 2 }).notNull(),
    horasSemana: numeric('horas_semana', { precision: 5, scale: 2 }).notNull().default('0'),
  },
  (t) => [unique('plan_distribucion_plan_materia_key').on(t.planId, t.materiaId)],
);

export const tareasPlan = pgTable(
  'tareas_plan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => planesEstudio.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    descripcion: text('descripcion'),
    tipo: text('tipo').notNull().default('contenido'),
    contenidoId: uuid('contenido_id').references(() => contenidos.id, { onDelete: 'set null' }),
    ensayoId: uuid('ensayo_id').references(() => ensayos.id, { onDelete: 'set null' }),
    materiaId: uuid('materia_id').references(() => materias.id, { onDelete: 'set null' }),
    fechaPlanificada: date('fecha_planificada').notNull().defaultNow(),
    duracionMin: integer('duracion_min').notNull().default(30),
    estado: estadoTarea('estado').notNull().default('pendiente'),
    completadaEn: timestamp('completada_en', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('tareas_plan_usuario_fecha_idx').on(t.usuarioId, t.fechaPlanificada),
    index('tareas_plan_plan_idx').on(t.planId),
  ],
);

// ===========================================================================
// 8. PREMIUM Y PAGOS
// ===========================================================================

export const suscripciones = pgTable('suscripciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => planesSuscripcion.id, { onDelete: 'restrict' }),
  estado: estadoSuscripcion('estado').notNull().default('activa'),
  proveedor: proveedorPago('proveedor').notNull().default('mock'),
  iniciaEn: timestamp('inicia_en', { withTimezone: true }).notNull().defaultNow(),
  terminaEn: timestamp('termina_en', { withTimezone: true }),
  canceladaEn: timestamp('cancelada_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

export const pagos = pgTable(
  'pagos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => planesSuscripcion.id, { onDelete: 'restrict' }),
    estado: estadoPago('estado').notNull().default('pendiente'),
    metodo: metodoPago('metodo').notNull().default('tarjeta'),
    proveedor: proveedorPago('proveedor').notNull().default('mock'),
    montoClp: integer('monto_clp').notNull(),
    tokenPago: text('token_pago'),
    ultimos4: char('ultimos4', { length: 4 }),
    referencia: text('referencia').unique(),
    payloadRespuesta: jsonb('payload_respuesta'),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    confirmadoEn: timestamp('confirmado_en', { withTimezone: true }),
  },
  (t) => [index('pagos_usuario_fecha_idx').on(t.usuarioId, t.creadoEn.desc())],
);

// ===========================================================================
// 9. COMUNIDAD
// ===========================================================================

export const perfilesPublicos = pgTable('perfiles_publicos', {
  usuarioId: uuid('usuario_id')
    .primaryKey()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: text('titulo'),
  especialidad: text('especialidad'),
  bio: text('bio'),
  verificado: boolean('verificado').notNull().default(false),
  ratingPromedio: numeric('rating_promedio', { precision: 3, scale: 2 }).notNull().default('0'),
  ratingCantidad: integer('rating_cantidad').notNull().default(0),
  seguidores: integer('seguidores').notNull().default(0),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

export const publicaciones = pgTable(
  'publicaciones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    materiaId: uuid('materia_id').references(() => materias.id, { onDelete: 'set null' }),
    tipo: tipoPublicacion('tipo').notNull().default('duda'),
    titulo: text('titulo').notNull(),
    cuerpo: text('cuerpo').notNull(),
    estado: estadoPublicacion('estado').notNull().default('visible'),
    resuelta: boolean('resuelta').notNull().default(false),
    mejorRespuestaId: uuid('mejor_respuesta_id'),
    votos: integer('votos').notNull().default(0),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('publicaciones_feed_idx').on(t.estado, t.creadoEn.desc()),
  ],
);

export const votos = pgTable(
  'votos',
  {
    publicacionId: uuid('publicacion_id')
      .notNull()
      .references(() => publicaciones.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.publicacionId, t.usuarioId] })],
);

export const comentarios = pgTable(
  'comentarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicacionId: uuid('publicacion_id')
      .notNull()
      .references(() => publicaciones.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    respondeAId: uuid('responde_a_id'),
    cuerpo: text('cuerpo').notNull(),
    esMejor: boolean('es_mejor').notNull().default(false),
    borrado: boolean('borrado').notNull().default(false),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comentarios_publicacion_idx').on(t.publicacionId, t.creadoEn)],
);

export const seguidores = pgTable(
  'seguidores',
  {
    seguidorId: uuid('seguidor_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    seguidoId: uuid('seguido_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.seguidorId, t.seguidoId] })],
);

export const resenasTutor = pgTable(
  'resenas_tutor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tutorId: uuid('tutor_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    autorId: uuid('autor_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    calificacion: integer('calificacion').notNull(),
    comentario: text('comentario'),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('resenas_tutor_tutor_autor_key').on(t.tutorId, t.autorId)],
);

export const reportes = pgTable('reportes', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportanteId: uuid('reportante_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  publicacionId: uuid('publicacion_id').references(() => publicaciones.id, { onDelete: 'cascade' }),
  comentarioId: uuid('comentario_id').references(() => comentarios.id, { onDelete: 'cascade' }),
  motivo: text('motivo').notNull(),
  estado: text('estado').notNull().default('pendiente'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================================================
// 10. NOTIFICACIONES
// ===========================================================================

export const notificaciones = pgTable(
  'notificaciones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    tipo: tipoNotificacion('tipo').notNull().default('sistema'),
    titulo: text('titulo').notNull(),
    cuerpo: text('cuerpo'),
    url: text('url'),
    agrupador: text('agrupador'),
    leida: boolean('leida').notNull().default(false),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notificaciones_usuario_idx').on(t.usuarioId, t.creadoEn.desc()),
    index('notificaciones_no_leidas_idx')
      .on(t.usuarioId)
      .where(sql`leida = false`),
  ],
);

// ===========================================================================
// 11. ACTIVIDAD DIARIA
// ===========================================================================

export const actividadDiaria = pgTable(
  'actividad_diaria',
  {
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    fecha: date('fecha').notNull().defaultNow(),
    tipo: tipoActividad('tipo').notNull(),
    cantidad: integer('cantidad').notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.usuarioId, t.fecha] })],
);

// ===========================================================================
// RELACIONES
// ===========================================================================

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  colegio: one(colegios, { fields: [usuarios.colegioId], references: [colegios.id] }),
  carrera: one(carreras, { fields: [usuarios.carreraId], references: [carreras.id] }),
  universidad: one(universidades, { fields: [usuarios.universidadId], references: [universidades.id] }),
  preferencias: one(preferenciasUsuario, { fields: [usuarios.id], references: [preferenciasUsuario.usuarioId] }),
  perfil: one(perfilesPublicos, { fields: [usuarios.id], references: [perfilesPublicos.usuarioId] }),
  intentos: many(intentos),
  progreso: many(progresoContenido),
  tareas: many(tareasPlan),
  publicaciones: many(publicaciones),
}));

export const materiasRelations = relations(materias, ({ many }) => ({
  ejes: many(ejes),
  ensayos: many(ensayos),
  contenidos: many(contenidos),
  preguntas: many(preguntas),
}));

export const ejesRelations = relations(ejes, ({ one, many }) => ({
  materia: one(materias, { fields: [ejes.materiaId], references: [materias.id] }),
  preguntas: many(preguntas),
}));

export const ensayosRelations = relations(ensayos, ({ one, many }) => ({
  materia: one(materias, { fields: [ensayos.materiaId], references: [materias.id] }),
  preguntas: many(ensayoPreguntas),
  ejes: many(ensayoEjes),
  intentos: many(intentos),
}));

export const preguntasRelations = relations(preguntas, ({ one, many }) => ({
  materia: one(materias, { fields: [preguntas.materiaId], references: [materias.id] }),
  eje: one(ejes, { fields: [preguntas.ejeId], references: [ejes.id] }),
  alternativas: many(alternativas),
}));

export const alternativasRelations = relations(alternativas, ({ one }) => ({
  pregunta: one(preguntas, { fields: [alternativas.preguntaId], references: [preguntas.id] }),
}));

export const intentosRelations = relations(intentos, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [intentos.usuarioId], references: [usuarios.id] }),
  ensayo: one(ensayos, { fields: [intentos.ensayoId], references: [ensayos.id] }),
  respuestas: many(respuestas),
  resultadosEje: many(resultadosEje),
}));

export const resultadosEjeRelations = relations(resultadosEje, ({ one }) => ({
  intento: one(intentos, { fields: [resultadosEje.intentoId], references: [intentos.id] }),
  eje: one(ejes, { fields: [resultadosEje.ejeId], references: [ejes.id] }),
}));

export const contenidosRelations = relations(contenidos, ({ one, many }) => ({
  materia: one(materias, { fields: [contenidos.materiaId], references: [materias.id] }),
  eje: one(ejes, { fields: [contenidos.ejeId], references: [ejes.id] }),
  progreso: many(progresoContenido),
}));

export const tareasPlanRelations = relations(tareasPlan, ({ one }) => ({
  plan: one(planesEstudio, { fields: [tareasPlan.planId], references: [planesEstudio.id] }),
  contenido: one(contenidos, { fields: [tareasPlan.contenidoId], references: [contenidos.id] }),
  ensayo: one(ensayos, { fields: [tareasPlan.ensayoId], references: [ensayos.id] }),
  materia: one(materias, { fields: [tareasPlan.materiaId], references: [materias.id] }),
}));

// ===========================================================================
// TIPOS INFERIDOS
// ===========================================================================

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Materia = typeof materias.$inferSelect;
export type Eje = typeof ejes.$inferSelect;
export type Ensayo = typeof ensayos.$inferSelect;
export type Pregunta = typeof preguntas.$inferSelect;
export type Alternativa = typeof alternativas.$inferSelect;
export type Intento = typeof intentos.$inferSelect;
export type Contenido = typeof contenidos.$inferSelect;
export type TareaPlan = typeof tareasPlan.$inferSelect;
export type Publicacion = typeof publicaciones.$inferSelect;
export type Comentario = typeof comentarios.$inferSelect;
export type Suscripcion = typeof suscripciones.$inferSelect;
export type PlanSuscripcion = typeof planesSuscripcion.$inferSelect;
export type TramoConversion = typeof conversionPuntaje.$inferSelect;
