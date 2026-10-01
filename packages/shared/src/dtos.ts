/**
 * DTOs compartidos: exactamente las formas que devuelve el API.
 * El frontend importa estos tipos; no inventa formas nuevas.
 */

import type {
  Area,
  EstadoIntento,
  EstadoSuscripcion,
  MetodoPago,
  NivelDificultad,
  Prueba,
  Rol,
  Tema,
  TipoContenido,
  TipoNotificacion,
  TipoPublicacion,
} from './constants.js';

export interface DTOUsuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  avatarUrl: string | null;
  rol: Rol;
  onboardingCompletado: boolean;
  esPremium: boolean;
  planActual: string | null;
  curso: string | null;
  colegio: DTOColegio | null;
  carrera: DTOCarrera | null;
  universidad: DTOUniversidad | null;
  puntajeMeta: number | null;
  fechaExamen: string | null;
  horasSemana: number | null;
  diasDisponibles: number[];
  rachaActual: number;
  rachaMaxima: number;
  creadoEn: string;
}

export interface DTOPreferencias {
  tema: Tema;
  notifEmail: boolean;
  notifPush: boolean;
  notifResultados: boolean;
  notifSocial: boolean;
  notifRacha: boolean;
  notifMarketing: boolean;
}

export interface DTOColegio {
  id: string;
  nombre: string;
  comuna: string | null;
  region: string | null;
}

export interface DTOCarrera {
  id: string;
  nombre: string;
  area: string;
  duracionAnios: number | null;
  puntajeReferencia: number | null;
  popular: boolean;
}

export interface DTOUniversidad {
  id: string;
  nombre: string;
  tipo: string;
  region: string | null;
  puntajeCorte: number | null;
}

export interface DTOMateria {
  id: string;
  codigo: string;
  nombre: string;
  area: Area;
}

export interface DTOEje {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

/** Enviado durante la resolución: nunca incluye esCorrecta. */
export interface DTOPregunta {
  id: string;
  posicion: number;
  tipo: 'multiple' | 'comprension_lectora';
  enunciado: string;
  textoBase: string | null;
  dificultad: NivelDificultad;
  ejeId: string | null;
  ejeNombre: string | null;
  materiaCodigo: string;
  alternativas: DTOAlternativa[];
  respuestaActual: DTORespuestaActual | null;
}

export interface DTOAlternativa {
  id: string;
  texto: string;
  posicion: number;
}

export interface DTORespuestaActual {
  alternativaId: string | null;
  esMarcada: boolean;
  tiempoSegundos: number;
}

/** Solo después de entregar. */
export interface DTOPreguntaResuelta extends DTOPregunta {
  esCorrecta: boolean;
  alternativaCorrectaId: string;
  explicacion: string;
  tuRespuestaId: string | null;
}

export interface DTOEnsayo {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  prueba: Prueba;
  materia: DTOMateria;
  nivel: 'basico' | 'medio' | 'avanzado';
  duracionMin: number;
  preguntasCount: number;
  premium: boolean;
  esDiagnostico: boolean;
  ejes: DTOEje[];
  /** Intento en curso del usuario, si existe. */
  intentoEnCursoId: string | null;
  ultimoIntento: DTOIntentoResumen | null;
  bloqueadoPorPlan: boolean;
}

export interface DTOIntentoResumen {
  id: string;
  slug: string;
  titulo: string;
  prueba: Prueba;
  estado: EstadoIntento;
  iniciadoEn: string;
  entregadoEn: string | null;
  correctas: number;
  incorrectas: number;
  omitidas: number;
  pctLogro: number;
  puntaje: number | null;
  percentil: number | null;
}

export interface DTOIntento extends DTOIntentoResumen {
  ensayoId: string;
  duracionMin: number;
  expiraEn: string;
  preguntas: DTOPregunta[];
  indiceActual: number;
  esPremium: boolean;
}

export interface DTOResultados {
  intento: DTOIntentoResumen;
  duracionMin: number;
  duracionUsadaSegundos: number;
  tiempoPromedioPregunta: number;
  percentil: number | null;
  puntajeMeta: number | null;
  distanciaMeta: number | null;
  ejes: DTOResultadoEje[];
  preguntas: DTOPreguntaResuelta[];
}

export interface DTOResultadoEje {
  ejeId: string;
  ejeNombre: string;
  materiaCodigo: string;
  total: number;
  correctas: number;
  pctLogro: number;
}

export interface DTOContenido {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoContenido;
  duracionMin: number;
  premium: boolean;
  materia: DTOMateria;
  eje: DTOEje | null;
  porcentajeProgreso: number;
  completado: boolean;
}

export interface DTOContenidoDetalle extends DTOContenido {
  cuerpoMd: string;
  puntosClave: string[];
  videoUrl: string | null;
  anterior: DTOContenidoRef | null;
  siguiente: DTOContenidoRef | null;
}

export interface DTOContenidoRef {
  slug: string;
  titulo: string;
}

export interface DTOTareaPlan {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: 'contenido' | 'ensayo' | 'repaso' | 'teoria';
  estado: 'pendiente' | 'en_curso' | 'completada' | 'omitida';
  fechaPlanificada: string;
  duracionMin: number;
  materiaCodigo: string | null;
  contenido: DTOContenidoRef | null;
  ensayo: DTOContenidoRef | null;
  completadaEn: string | null;
}

export interface DTOPlan {
  id: string;
  horasSemana: number;
  semanas: number;
  fechaInicio: string;
  fechaExamen: string | null;
  creadoEn: string;
  distribucion: DTODistribucion[];
  tareas: DTOTareaPlan[];
}

export interface DTODistribucion {
  materiaCodigo: string;
  materiaNombre: string;
  area: Area;
  porcentaje: number;
  horasSemana: number;
}

export interface DTOEstadisticas {
  puntajeActual: number;
  puntajeMeta: number | null;
  distanciaMeta: number | null;
  porPrueba: Record<string, number>;
  tiempoPromedioPregunta: number;
  tiempoRecomendado: number;
  historial: DTOPuntoHistorial[];
  precisionPorEje: DTOPrecisionEje[];
  totalIntentos: number;
}

export interface DTOPuntoHistorial {
  fecha: string;
  puntaje: number;
  pctLogro: number;
  prueba: string;
  intentoId: string;
}

export interface DTOPrecisionEje {
  ejeId: string;
  ejeNombre: string;
  materiaCodigo: string;
  total: number;
  correctas: number;
  precision: number;
  etiqueta: 'fuerte' | 'por_buen_camino' | 'promedio' | 'necesita_repaso';
}

export interface DTODashboard {
  usuario: Pick<DTOUsuario, 'nombre' | 'rachaActual' | 'puntajeMeta' | 'esPremium'>;
  tareasHoy: DTOTareaPlan[];
  recomendado: DTORecomendacion | null;
  ultimoIntento: DTOIntentoResumen | null;
  historial: DTOPuntoHistorial[];
  racha: DTORacha;
}

export interface DTORecomendacion {
  ejeId: string;
  ejeNombre: string;
  materiaCodigo: string;
  precision: number;
  contenidoSlug: string | null;
  ensayoSlug: string | null;
  motivo: string;
}

export interface DTORacha {
  actual: number;
  maxima: number;
  ultimaActividad: string | null;
  completoHoy: boolean;
}

export interface DTOPublicacion {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: TipoPublicacion;
  estado: 'visible' | 'oculta' | 'eliminada';
  resuelta: boolean;
  mejorRespuestaId: string | null;
  creadoEn: string;
  actualizadoEn: string;
  autor: DTOAutor;
  materia: DTOMateria | null;
  likes: number;
  comentarios: number;
  meGusta: boolean;
  /** Fragmentos con el término resaltado (búsqueda). */
  resaltado: { titulo: string; cuerpo: string } | null;
}

export interface DTOAutor {
  id: string;
  nombre: string;
  avatarUrl: string | null;
  rol: Rol;
  esTutorVerificado: boolean;
}

export interface DTOComentario {
  id: string;
  cuerpo: string;
  creadoEn: string;
  esMejor: boolean;
  autor: DTOAutor;
  respuestas: DTOComentario[];
}

/** El detalle reemplaza el contador `comentarios` (number) por la lista real. */
export interface DTOPublicacionDetalle extends Omit<DTOPublicacion, 'comentarios'> {
  comentarios: DTOComentario[];
  soyAutor: boolean;
  puedeMarcarMejor: boolean;
  oculto: boolean;
}

export interface DTOPerfilPublico {
  usuario: DTOUsuario;
  perfil: {
    titulo: string | null;
    especialidad: string | null;
    bio: string | null;
    verificado: boolean;
    ratingPromedio: number;
    ratingCantidad: number;
    seguidores: number;
  };
  impacto: {
    respuestas: number;
    likes: number;
    publicaciones: number;
  };
  publicaciones: DTOPublicacion[];
  loSigo: boolean;
  resenas: DTOResena[];
}

export interface DTOResena {
  id: string;
  calificacion: number;
  comentario: string | null;
  autorNombre: string;
  creadoEn: string;
}

export interface DTOPlanSuscripcion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioClp: number;
  ensayosMes: number;
  analyticsAvanzados: boolean;
  videoPremium: boolean;
  destacado: boolean;
}

export interface DTOSuscripcion {
  id: string;
  estado: EstadoSuscripcion;
  plan: DTOPlanSuscripcion;
  iniciaEn: string;
  terminaEn: string | null;
  canceladaEn: string | null;
}

export interface DTOPago {
  id: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  metodo: MetodoPago;
  montoClp: number;
  ultimos4: string | null;
  planNombre: string;
  creadoEn: string;
  confirmadoEn: string | null;
}

export interface DTONotificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
  leida: boolean;
  creadoEn: string;
}

export interface DTOCentroNotificaciones {
  items: DTONotificacion[];
  nextCursor: string | null;
  hasMore: boolean;
  noLeidas: number;
}
