export const servicios = {
  auth: {
    registro: '/auth/registro',
    login: '/auth/login',
    loginColegio: '/auth/login/colegio',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    yo: '/auth/yo',
    googleUrl: '/auth/google',
    googleCallback: '/auth/google/callback',
    forgotPassword: '/auth/recuperar',
    resetPassword: '/auth/recuperar/:token',
    sesiones: '/auth/sesiones',
    revocarSesion: (id: string) => `/auth/sesiones/${id}`,
    cambiarPassword: '/auth/password',
    cambiarEmail: '/auth/email',
    eliminarCuenta: '/auth/cuenta',
  },
  usuario: {
    perfil: '/usuarios/perfil',
    preferencias: '/usuarios/preferencias',
  },
  catalogos: {
    carreras: '/carreras',
    universidades: '/universidades',
    colegios: '/colegios',
    materias: '/materias',
    planesSuscripcion: '/planes-suscripcion',
  },
  onboarding: {
    meta: '/onboarding/meta',
    generarPlan: '/onboarding/plan',
  },
  dashboard: {
    obtener: '/dashboard',
  },
  ensayos: {
    listar: '/ensayos',
    detalle: (slug: string) => `/ensayos/${slug}`,
  },
  intentos: {
    crear: '/intentos',
    obtener: (id: string) => `/intentos/${id}`,
    responder: (id: string, preguntaId: string) => `/intentos/${id}/respuestas/${preguntaId}`,
    marcar: (id: string, preguntaId: string) => `/intentos/${id}/preguntas/${preguntaId}/marcar`,
    entregar: (id: string) => `/intentos/${id}/entregar`,
    resultados: (id: string) => `/intentos/${id}/resultados`,
    explicacion: (id: string, numero: string) => `/intentos/${id}/pregunta/${numero}`,
    guardarPregunta: (id: string, preguntaId: string) =>
      `/intentos/${id}/pregunta/${preguntaId}/guardar`,
  },
  contenidos: {
    listar: '/contenidos',
    detalle: (slug: string) => `/contenidos/${slug}`,
    progreso: (id: string) => `/contenidos/${id}/progreso`,
    material: (contenidoId: string, indice: number) =>
      `/contenidos/${contenidoId}/material/${indice}`,
  },
  plan: {
    obtener: '/plan',
    regenerar: '/plan/regenerar',
    tarea: (id: string) => `/plan/tareas/${id}`,
    crearTarea: '/plan/tareas',
  },
  estadisticas: {
    obtener: '/estadisticas',
  },
  comunidad: {
    publicaciones: '/comunidad/publicaciones',
    crearPublicacion: '/comunidad/publicaciones',
    detalle: (id: string) => `/comunidad/publicaciones/${id}`,
    comentarios: (id: string) => `/comunidad/publicaciones/${id}/comentarios`,
    votos: (id: string) => `/comunidad/publicaciones/${id}/voto`,
    mejorRespuesta: (comentarioId: string) => `/comunidad/comentarios/${comentarioId}/mejor`,
    buscar: '/comunidad/buscar',
    reportar: '/comunidad/reportes',
    ocultar: (id: string) => `/comunidad/publicaciones/${id}/ocultar`,
    tutors: '/comunidad/tutores',
    tutor: (id: string) => `/comunidad/tutores/${id}`,
    resena: (id: string) => `/comunidad/tutores/${id}/resenas`,
    seguir: (id: string) => `/comunidad/tutores/${id}/seguir`,
  },
  notificaciones: {
    listar: '/notificaciones',
    leida: (id: string) => `/notificaciones/${id}/leer`,
    leerTodas: '/notificaciones/leer-todas',
    stream: '/notificaciones/stream',
  },
  premium: {
    planes: '/premium/planes',
    checkout: '/premium/checkout',
    confirmar: '/premium/confirmar',
    suscripcion: '/premium/suscripcion',
    cancelar: '/premium/suscripcion/cancelar',
    pagos: '/premium/pagos',
  },
  storage: {
    subir: '/storage/subir',
  },
} as const;

export type Servicios = typeof servicios;
