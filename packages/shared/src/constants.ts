/**
 * Constantes compartidas entre el API y el frontend.
 * Fuente única de verdad para catálogos que no cambian entre despliegues.
 */

export const AREAS = ['matematicas', 'lenguaje', 'ciencias', 'historia'] as const;
export type Area = (typeof AREAS)[number];

/** Etiquetas visibles de las áreas (filtros de la biblioteca de ensayos). */
export const AREAS_LABEL: Record<Area, string> = {
  matematicas: 'Matemáticas',
  lenguaje: 'Lenguaje',
  ciencias: 'Ciencias',
  historia: 'Historia',
};

export const PRUEBAS = ['M1', 'M2', 'CL', 'CIENCIAS', 'HISTORIA'] as const;
export type Prueba = (typeof PRUEBAS)[number];

export const PRUEBAS_LABEL: Record<Prueba, string> = {
  M1: 'Matemáticas 1',
  M2: 'Matemáticas 2',
  CL: 'Lenguaje y Comunicación',
  CIENCIAS: 'Ciencias',
  HISTORIA: 'Historia y Ciencias Sociales',
};

/** Etiquetas cortas para chips y ejes de gráficos. */
export const PRUEBAS_CORTA: Record<Prueba, string> = {
  M1: 'M1',
  M2: 'M2',
  CL: 'CL',
  CIENCIAS: 'Ciencias',
  HISTORIA: 'Historia',
};

export const ROLES = ['estudiante', 'profesor', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

export const TEMAS = ['claro', 'oscuro', 'sistema'] as const;
export type Tema = (typeof TEMAS)[number];

export const ESTADOS_INTENTO = ['en_curso', 'entregado', 'expirado', 'abandonado'] as const;
export type EstadoIntento = (typeof ESTADOS_INTENTO)[number];

export const TIPOS_PUBLICACION = ['duda', 'tip', 'material', 'debate'] as const;
export type TipoPublicacion = (typeof TIPOS_PUBLICACION)[number];

export const TIPOS_PUBLICACION_LABEL: Record<TipoPublicacion, string> = {
  duda: 'Duda',
  tip: 'Tip',
  material: 'Material',
  debate: 'Debate',
};

export const TIPOS_CONTENIDO = ['video', 'pdf', 'mixto'] as const;
export type TipoContenido = (typeof TIPOS_CONTENIDO)[number];

export const TIPOS_NOTIFICACION = [
  'resultados_disponibles',
  'nuevo_plan',
  'plan_actualizado',
  'racha',
  'comentario',
  'like',
  'respuesta',
  'pago',
  'sistema',
] as const;
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

/** Ícono de Material Symbols Outlined por tipo de notificación. */
export const NOTIFICACION_ICONO: Record<TipoNotificacion, string> = {
  resultados_disponibles: 'workspace_premium',
  nuevo_plan: 'calendar_month',
  plan_actualizado: 'event_repeat',
  racha: 'local_fire_department',
  comentario: 'chat_bubble',
  like: 'thumb_up',
  respuesta: 'forum',
  pago: 'credit_card',
  sistema: 'info',
};

export const ESTADOS_SUSCRIPCION = ['activa', 'cancelada', 'vencida'] as const;
export type EstadoSuscripcion = (typeof ESTADOS_SUSCRIPCION)[number];

export const METODOS_PAGO = ['tarjeta', 'webpay'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const NIVELES_DIFICULTAD = [1, 2, 3, 4, 5] as const;
export type NivelDificultad = (typeof NIVELES_DIFICULTAD)[number];

/** Segundos recomendados por pregunta en M1 (usado en Estadísticas). */
export const TIEMPO_RECOMENDADO_SEGUNDOS = 90;

export const PAGINA_POR_DEFECTO = 20;
export const MAX_POR_PAGINA = 50;

/** Regla de racha: se incrementa una vez al día; se reinicia tras un día sin actividad. */
export const DIAS_PARA_REINICIAR_RACHA = 1;

/** Minutos de vigencia del enlace de recuperación de contraseña. */
export const MINUTOS_TOKEN_RECUPERACION = 30;
