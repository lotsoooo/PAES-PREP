import { z } from 'zod';
import { ROLES, TEMAS, TIPOS_CONTENIDO, TIPOS_PUBLICACION } from '../constants.js';

/* ==========================================================================
 * Formato de error de la API: { error: { code, message, details? } }
 * ========================================================================== */

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PLAN_LIMIT_REACHED',
  'PREMIUM_REQUIRED',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/* ==========================================================================
 * Paginación por cursor
 * ========================================================================== */

export const cursorPaginacionSchema = z.object({
  limite: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});

export type CursorPaginacion = z.infer<typeof cursorPaginacionSchema>;

export interface PaginaCursor<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/* ==========================================================================
 * Auth
 * ========================================================================== */

export const MIN_PASSWORD_LENGTH = 8;

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
  .max(128, 'La contraseña es demasiado larga');

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Ingresa tu nombre').max(80),
    email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
    password: passwordSchema,
    colegioId: z.string().uuid().optional(),
    curso: z.string().trim().max(40).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
    password: z.string().min(1, 'Ingresa tu contraseña'),
    mantenerSesion: z.boolean().default(false),
    colegioId: z.string().uuid().optional(),
  })
  .strict();

export const loginColegioSchema = loginSchema.extend({
  colegioId: z.string().uuid('Selecciona tu colegio'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token inválido'),
    password: passwordSchema,
  })
  .strict();

export const googleCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'Ingresa tu contraseña actual'),
    passwordNuevo: passwordSchema,
  })
  .strict();

export const cambiarEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

/* ==========================================================================
 * Perfil y preferencias
 * ========================================================================== */

export const actualizarPerfilSchema = z
  .object({
    nombre: z.string().trim().min(2).max(80).optional(),
    apellido: z.string().trim().max(80).optional(),
    curso: z.string().trim().max(40).nullable().optional(),
    colegioId: z.string().uuid().nullable().optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
  })
  .strict();

export const actualizarPreferenciasSchema = z
  .object({
    tema: z.enum(TEMAS).optional(),
    notifEmail: z.boolean().optional(),
    notifPush: z.boolean().optional(),
    notifResultados: z.boolean().optional(),
    notifSocial: z.boolean().optional(),
    notifRacha: z.boolean().optional(),
    notifMarketing: z.boolean().optional(),
  })
  .strict();

export const eliminarCuentaSchema = z.object({
  confirmacion: z.literal('ELIMINAR', 'Debes escribir ELIMINAR para confirmar'),
});

/* ==========================================================================
 * Onboarding
 * ========================================================================== */

export const metaOnboardingSchema = z
  .object({
    carreraId: z.string().uuid().optional(),
    universidadId: z.string().uuid().optional(),
    puntajeMeta: z.number().int().min(100).max(1000).optional(),
    fechaExamen: z.string().date().optional(),
  })
  .strict();

export const disponibilidadSchema = z
  .object({
    horasSemana: z.number().int().min(1).max(80),
    diasDisponibles: z.array(z.number().int().min(0).max(6)).min(1, 'Elige al menos un día'),
  })
  .strict();

/* ==========================================================================
 * Catálogos
 * ========================================================================== */

export const catalogoQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(10),
});

export const slugParamSchema = z.object({ slug: z.string().min(1).max(180) });
export const uuidParamSchema = z.object({ id: z.string().uuid() });

/* ==========================================================================
 * Contenidos
 * ========================================================================== */

export const contenidosQuerySchema = z.object({
  materia: z.string().trim().max(20).optional(),
  tipo: z.enum(TIPOS_CONTENIDO).optional(),
  q: z.string().trim().max(80).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});

export const completarContenidoSchema = z.object({
  porcentaje: z.number().int().min(0).max(100).default(100),
});

/* ==========================================================================
 * Plan de estudio
 * ========================================================================== */

export const planQuerySchema = z.object({
  vista: z.enum(['calendario', 'lista']).default('calendario'),
  semana: z.coerce.number().int().min(1).max(60).default(1),
  desde: z.string().date().optional(),
  hasta: z.string().date().optional(),
});

export const actualizarTareaSchema = z
  .object({
    estado: z.enum(['pendiente', 'en_curso', 'completada', 'omitida']).optional(),
    fechaPlanificada: z.string().date().optional(),
    titulo: z.string().trim().min(1).max(180).optional(),
  })
  .strict();

export const crearTareaSchema = z
  .object({
    titulo: z.string().trim().min(1, 'Escribe un título').max(180),
    descripcion: z.string().trim().max(2000).optional(),
    tipo: z.enum(['contenido', 'ensayo', 'repaso', 'teoria']).default('repaso'),
    contenidoId: z.string().uuid().optional(),
    ensayoId: z.string().uuid().optional(),
    materiaId: z.string().uuid().optional(),
    fechaPlanificada: z.string().date(),
    duracionMin: z.number().int().min(5).max(300).default(30),
  })
  .strict();

export const regenerarPlanSchema = z
  .object({
    horasSemana: z.number().int().min(1).max(80).optional(),
    semanas: z.number().int().min(1).max(52).default(4),
  })
  .strict();

/* ==========================================================================
 * Comunidad
 * ========================================================================== */

export const publicacionesQuerySchema = z.object({
  materia: z.string().trim().max(20).optional(),
  tipo: z.enum(TIPOS_PUBLICACION).optional(),
  orden: z.enum(['recientes', 'votados', 'sin_responder']).default('recientes'),
  limite: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});

export const buscarPublicacionesSchema = publicacionesQuerySchema.extend({
  q: z.string().trim().min(2, 'Ingresa al menos 2 caracteres').max(120),
  desde: z.string().date().optional(),
  hasta: z.string().date().optional(),
});

export const crearPublicacionSchema = z
  .object({
    titulo: z.string().trim().min(4, 'El título es demasiado corto').max(180),
    cuerpo: z.string().trim().min(1, 'Escribe el contenido').max(8000),
    materiaId: z.string().uuid().nullable().optional(),
    tipo: z.enum(TIPOS_PUBLICACION).default('duda'),
    borrador: z.boolean().default(false),
  })
  .strict();

export const crearComentarioSchema = z
  .object({
    cuerpo: z.string().trim().min(1, 'Escribe un comentario').max(4000),
    respondeAId: z.string().uuid().nullable().optional(),
  })
  .strict();

export const reportarSchema = z
  .object({
    publicacionId: z.string().uuid().optional(),
    comentarioId: z.string().uuid().optional(),
    motivo: z.string().trim().min(5, 'Describe el motivo').max(500),
  })
  .strict()
  .refine((v) => Boolean(v.publicacionId) !== Boolean(v.comentarioId), {
    message: 'Indica una publicación o un comentario',
  });

export const perfilTutorSchema = z.object({
  verificado: z.literal(true),
  especialidad: z.string().trim().min(2, 'Ingresa tu especialidad').max(80),
  titulo: z.string().trim().min(2, 'Ingresa un título').max(120),
  bio: z.string().trim().max(500).optional(),
});

/* ==========================================================================
 * Reseñas de tutor
 * ========================================================================== */

export const crearResenaSchema = z
  .object({
    calificacion: z.number().int().min(1).max(5),
    comentario: z.string().trim().max(1000).optional(),
  })
  .strict();

/* ==========================================================================
 * Premium y pagos
 * ========================================================================== */

export const checkoutSchema = z
  .object({
    plan: z.enum(['premium', 'anual']),
    metodo: z.enum(['tarjeta', 'webpay']),
    // Solo para el MockProvider en desarrollo. Nunca se persiste.
    tarjeta: z
      .object({
        numero: z.string().regex(/^\d{16}$/, 'Número de tarjeta inválido'),
        expiracion: z.string().regex(/^\d{2}\/\d{2}$/, 'Formato MM/AA'),
        cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
        nombre: z.string().trim().min(3, 'Ingresa el nombre del titular').max(80),
      })
      .optional(),
  })
  .strict();

/** Tarjetas de prueba del MockProvider. */
export const TARJETAS_PRUEBA = {
  aprobada: '4242424242424242',
  rechazada: '4000000000000002',
  requiereAccion: '4000000000009995',
} as const;

export const confirmarPagoSchema = z.object({
  token: z.string().min(1),
});

/* ==========================================================================
 * Notificaciones
 * ========================================================================== */

export const notificacionesQuerySchema = z.object({
  limite: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
  soloNoLeidas: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

/* ==========================================================================
 * Estadísticas
 * ========================================================================== */

export const estadisticasQuerySchema = z.object({
  periodo: z.enum(['semanal', 'mensual']).default('mensual'),
  prueba: z.enum(['M1', 'M2', 'CL', 'CIENCIAS', 'HISTORIA']).optional(),
});

/* ==========================================================================
 * Tipos de rol reutilizados en DTO
 * ========================================================================== */

export const rolSchema = z.enum(ROLES);
export type RolDto = z.infer<typeof rolSchema>;
