/**
 * DTOs del producto completo (onboarding, cuaderno de errores, comunidad social,
 * pagos sandbox, IA, búsqueda). Complementan `dtos.ts`; las pantallas importan
 * de aquí lo que no existía en el contrato original.
 */

import type {
  DTOAlternativa,
  DTOCarrera,
  DTOColegio,
  DTOComentario,
  DTOContenido,
  DTOContenidoDetalle,
  DTOEje,
  DTOIntentoResumen,
  DTOMateria,
  DTOPlan,
  DTOPlanSuscripcion,
  DTOPrecisionEje,
  DTOPregunta,
  DTOPreguntaResuelta,
  DTOPublicacion,
  DTOPublicacionDetalle,
  DTOPuntoHistorial,
  DTORacha,
  DTOResultados,
  DTOTareaPlan,
  DTOUniversidad,
  DTOUsuario,
  DTOEstadisticas,
} from './dtos.js';

/* ==========================================================================
 * Sesión
 * ========================================================================== */

export type DTOUsuarioSesion = DTOUsuario & {
  pruebasObjetivo: string[];
  ultimaActividad: string | null;
};

export interface DTOSesionAuth {
  usuario: DTOUsuarioSesion;
  accessToken: string;
}

export interface DTOSesionDispositivo {
  id: string;
  dispositivo: string;
  ip: string | null;
  creadoEn: string;
  ultimoUsoEn: string;
  actual: boolean;
}

/* ==========================================================================
 * Catálogos
 * ========================================================================== */

export interface DTOMateriaConEjes extends DTOMateria {
  ejes: DTOEje[];
}

/** Una carrera en una universidad concreta, con su puntaje de corte. */
export interface DTOOferta {
  carrera: DTOCarrera;
  universidad: DTOUniversidad;
  puntajeCorte: number;
}

/** Datos reales del producto para la landing (no cifras de marketing). */
export interface DTODatosPlataforma {
  preguntas: number;
  ensayos: number;
  contenidos: number;
  pruebas: number;
  carreras: number;
}

export type DTOColegioOpcion = DTOColegio;

/* ==========================================================================
 * Onboarding
 * ========================================================================== */

export interface DTOPlanGenerado {
  plan: DTOPlan;
  resumen: {
    carrera: string | null;
    universidad: string | null;
    puntajeMeta: number | null;
    puntajeActual: number | null;
    horasSemana: number;
    semanas: number;
    fechaExamen: string | null;
    sesionesSemana: number;
  };
}

/* ==========================================================================
 * Dashboard
 * ========================================================================== */

export interface DTORecomendacionCard {
  tipo: 'ensayo' | 'contenido' | 'repaso';
  titulo: string;
  descripcion: string;
  /** Ruta interna de la app a la que lleva el botón. */
  url: string;
  /** "65 preguntas", "18 min", "6 preguntas por repasar". */
  detalle: string;
  /** Por qué se recomienda, en una frase. */
  motivo: string;
  materiaCodigo: string | null;
}

export interface DTOAreaMejorar {
  ejeId: string;
  ejeNombre: string;
  materiaCodigo: string;
  precision: number;
  prioridad: 'alta' | 'en_proceso';
  contenidoSlug: string | null;
}

export interface DTODashboardCompleto {
  usuario: Pick<DTOUsuario, 'nombre' | 'rachaActual' | 'puntajeMeta' | 'esPremium' | 'fechaExamen'> & {
    carrera: string | null;
  };
  racha: DTORacha;
  recomendado: DTORecomendacionCard | null;
  objetivo: { actual: number | null; meta: number | null; brecha: number | null };
  ensayosMes: number;
  /** Límite de ensayos del plan gratis (null = ilimitado). */
  limiteEnsayosMes: number | null;
  areasMejorar: DTOAreaMejorar[];
  intentosAnalizados: number;
  tareasHoy: DTOTareaPlan[];
  historial: DTOPuntoHistorial[];
  repasoHoy: number;
  ultimoIntento: DTOIntentoResumen | null;
}

/* ==========================================================================
 * Plan de estudio
 * ========================================================================== */

export interface DTOProgresoMateria {
  materiaCodigo: string;
  materiaNombre: string;
  completadas: number;
  total: number;
  minutosCompletados: number;
  minutosTotales: number;
}

export interface DTOPlanSemana extends DTOPlan {
  desde: string;
  hasta: string;
  progresoSemanal: DTOProgresoMateria[];
  racha: DTORacha;
}

export interface DTOTareaActualizada {
  tarea: DTOTareaPlan;
  racha: DTORacha;
}

/* ==========================================================================
 * Contenidos
 * ========================================================================== */

export interface DTOLeccionUnidad {
  slug: string;
  titulo: string;
  duracionMin: number;
  tipo: DTOContenido['tipo'];
  estado: 'completada' | 'actual' | 'disponible' | 'bloqueada';
}

export interface DTOMaterial {
  nombre: string;
  url: string;
  tipo: 'pdf' | 'enlace';
}

export interface DTOContenidoLeccion extends DTOContenidoDetalle {
  unidad: { nombre: string; lecciones: DTOLeccionUnidad[] };
  materiales: DTOMaterial[];
  bloqueadoPorPlan: boolean;
}

export interface DTOBibliotecaContenidos {
  items: DTOContenido[];
  continuar: DTOContenido | null;
}

export interface DTOProgresoContenido {
  porcentaje: number;
  completado: boolean;
  siguiente: { slug: string; titulo: string } | null;
  racha: DTORacha;
}

export interface DTOResultadoMiniTest {
  correctas: number;
  total: number;
  detalle: {
    preguntaId: string;
    esCorrecta: boolean;
    alternativaCorrectaId: string;
    tuRespuestaId: string | null;
    explicacion: string;
  }[];
}

/* ==========================================================================
 * Ensayos
 * ========================================================================== */

export interface DTOResultadosCompletos extends DTOResultados {
  anterior: { intentoId: string; puntaje: number; diferencia: number } | null;
  superaMeta: boolean;
  ensayoSlug: string;
  /** Logros obtenidos al entregar (solo en la respuesta de entrega). */
  logrosNuevos: DTOLogro[];
}

export interface DTOExplicacion {
  intentoId: string;
  numero: number;
  total: number;
  pregunta: DTOPreguntaResuelta & {
    errorComun: string | null;
    /** null si no hay video o si el usuario no es Premium. */
    videoUrl: string | null;
    tieneVideo: boolean;
    pasos: string[];
  };
  anteriorError: number | null;
  siguienteError: number | null;
  enCuaderno: boolean;
}

/* ==========================================================================
 * Cuaderno de errores (repaso espaciado)
 * ========================================================================== */

export interface DTOItemCuaderno {
  id: string;
  preguntaId: string;
  enunciado: string;
  materiaCodigo: string;
  ejeNombre: string | null;
  caja: number;
  proximoRepaso: string;
  repasos: number;
  dominada: boolean;
  origen: 'ensayo' | 'manual' | 'mini_test';
  creadoEn: string;
}

export interface DTOCuaderno {
  pendientesHoy: number;
  total: number;
  dominadas: number;
  items: DTOItemCuaderno[];
}

export interface DTOPreguntaRepaso extends DTOPregunta {
  cuadernoId: string;
  caja: number;
}

export interface DTORespuestaRepaso {
  esCorrecta: boolean;
  alternativaCorrectaId: string;
  explicacion: string;
  caja: number;
  proximoRepaso: string;
  dominada: boolean;
}

/* ==========================================================================
 * Estadísticas
 * ========================================================================== */

export interface DTOEstadisticasCompletas extends DTOEstadisticas {
  periodo: 'semanal' | 'mensual';
  prediccion: { puntaje: number | null; meta: number | null; porcentajeMeta: number | null };
  tendencia: number | null;
  esPremium: boolean;
  /** Solo Premium: días con actividad del último trimestre. */
  actividad: { fecha: string; cantidad: number }[] | null;
  /** Solo Premium: errores por eje y dificultad. */
  erroresPorEje: { ejeNombre: string; materiaCodigo: string; dificultad: number; errores: number }[] | null;
  precisionPorEje: DTOPrecisionEje[];
}

/* ==========================================================================
 * Perfil y logros
 * ========================================================================== */

export interface DTOLogro {
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  obtenidoEn: string | null;
}

export interface DTOPerfilPropio {
  usuario: DTOUsuarioSesion;
  resumen: {
    ensayos: number;
    mejorPuntaje: number | null;
    promedioPuntaje: number | null;
    preguntasRespondidas: number;
    precision: number | null;
    minutosEstudio: number;
  };
  logros: DTOLogro[];
  ultimosIntentos: DTOIntentoResumen[];
  publicaciones: DTOPublicacionFeed[];
  guardados: DTOPublicacionFeed[];
}

/* ==========================================================================
 * Comunidad
 * ========================================================================== */

export interface DTOPublicacionFeed extends DTOPublicacion {
  guardada: boolean;
  etiquetas: string[];
}

export interface DTOComentarioSocial extends DTOComentario {
  likes: number;
  meGusta: boolean;
  respuestas: DTOComentarioSocial[];
}

export interface DTOPublicacionCompleta extends Omit<DTOPublicacionDetalle, 'comentarios'> {
  comentarios: DTOComentarioSocial[];
  totalComentarios: number;
  guardada: boolean;
  etiquetas: string[];
}

export interface DTOTutorResumen {
  id: string;
  nombre: string;
  avatarUrl: string | null;
  titulo: string | null;
  especialidad: string | null;
  verificado: boolean;
  ratingPromedio: number;
  seguidores: number;
  loSigo: boolean;
}

export interface DTODestacadosComunidad {
  anuncios: DTOPublicacionFeed[];
  tutores: DTOTutorResumen[];
  temasPopulares: { etiqueta: string; cantidad: number }[];
}

export interface DTOBusquedaComunidad {
  items: DTOPublicacionFeed[];
  total: number;
}

/* ==========================================================================
 * Notificaciones
 * ========================================================================== */

export interface DTOResumenNotificaciones {
  noLeidas: number;
  recientes: import('./dtos.js').DTONotificacion[];
}

/* ==========================================================================
 * Premium y pagos (sandbox)
 * ========================================================================== */

export interface DTOEstadoSuscripcion {
  esPremium: boolean;
  planActual: DTOPlanSuscripcion;
  suscripcion: import('./dtos.js').DTOSuscripcion | null;
  pruebaDisponible: boolean;
  proveedor: 'mock' | 'webpay';
}

export interface DTOResultadoCheckout {
  estado: 'aprobado' | 'rechazado' | 'redireccion';
  pagoId: string;
  mensaje: string;
  /** Webpay: URL a la que se redirige para pagar. */
  redirectUrl: string | null;
}

/* ==========================================================================
 * Tutor IA y búsqueda global
 * ========================================================================== */

export interface DTOMensajeIA {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export interface DTORespuestaIA {
  respuesta: string;
  proveedor: 'simulado' | 'anthropic';
}

export interface DTOResultadoBusqueda {
  ensayos: { slug: string; titulo: string; prueba: string; premium: boolean }[];
  contenidos: { slug: string; titulo: string; materiaCodigo: string; tipo: string }[];
  publicaciones: { id: string; titulo: string }[];
}

/* Reexport práctico para pantallas que solo importan de aquí. */
export type { DTOAlternativa };
