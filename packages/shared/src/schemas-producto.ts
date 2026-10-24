import { z } from 'zod';
import { PRUEBAS } from './constants.js';

/** Pruebas que el estudiante puede marcar en el onboarding. */
export const PRUEBAS_OBJETIVO = ['M1', 'M2', 'CL', 'CIENCIAS', 'HISTORIA'] as const;

export const disponibilidadOnboardingSchema = z
  .object({
    horasSemana: z.number().int().min(1, 'Elige al menos 1 hora').max(40, 'Máximo 40 horas'),
    diasDisponibles: z.array(z.number().int().min(0).max(6)).min(1, 'Elige al menos un día'),
    pruebasObjetivo: z.array(z.enum(PRUEBAS_OBJETIVO)).min(1, 'Elige al menos una prueba'),
  })
  .strict();

export const metaOnboardingCompletaSchema = z
  .object({
    carreraId: z.string().uuid().nullable().optional(),
    universidadId: z.string().uuid().nullable().optional(),
    puntajeMeta: z.number().int().min(100).max(1000).nullable().optional(),
    fechaExamen: z.string().date().nullable().optional(),
  })
  .strict();

export const actualizarPerfilCompletoSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Ingresa tu nombre').max(80),
    apellido: z.string().trim().max(80).nullable().optional(),
    curso: z.string().trim().max(40).nullable().optional(),
    colegioId: z.string().uuid().nullable().optional(),
    puntajeMeta: z.number().int().min(100).max(1000).nullable().optional(),
  })
  .partial()
  .strict();

export const progresoContenidoSchema = z.object({
  porcentaje: z.number().int().min(0).max(100),
});

export const respuestasMiniTestSchema = z.object({
  respuestas: z
    .array(z.object({ preguntaId: z.string().uuid(), alternativaId: z.string().uuid().nullable() }))
    .min(1)
    .max(10),
});

export const guardarRespuestaSchema = z
  .object({
    alternativaId: z.string().uuid().nullable().optional(),
    esMarcada: z.boolean().optional(),
    tiempoSegundos: z.number().int().min(0).max(36_000).optional(),
  })
  .strict();

export const crearIntentoSchema = z.object({ ensayoSlug: z.string().min(1).max(180) }).strict();

export const agregarCuadernoSchema = z
  .object({ preguntaId: z.string().uuid(), intentoId: z.string().uuid().optional() })
  .strict();

export const responderRepasoSchema = z.object({ alternativaId: z.string().uuid() }).strict();

export const ensayosQuerySchema = z.object({
  prueba: z.enum(PRUEBAS).optional(),
  q: z.string().trim().max(80).optional(),
});

export const contenidosQueryCompletaSchema = z.object({
  materia: z.string().trim().max(20).optional(),
  tipo: z.enum(['video', 'pdf', 'mixto', 'practica']).optional(),
  estado: z.enum(['pendiente', 'en_curso', 'completado']).optional(),
  q: z.string().trim().max(80).optional(),
});

export const planSemanaQuerySchema = z.object({
  desde: z.string().date().optional(),
  hasta: z.string().date().optional(),
});

/**
 * Checkout. Los datos de la tarjeta NUNCA llegan al API: en sandbox el
 * navegador entrega un token de prueba y los últimos 4 dígitos; con Webpay el
 * pago ocurre en la página de Transbank.
 */
export const checkoutSandboxSchema = z
  .object({
    plan: z.enum(['premium', 'anual']),
    metodo: z.enum(['tarjeta', 'webpay']),
    tokenTarjeta: z.string().min(1).max(80).optional(),
    ultimos4: z.string().regex(/^\d{4}$/).optional(),
  })
  .strict();

export const confirmarWebpaySchema = z
  .object({ token: z.string().min(1), aprobar: z.boolean().optional() })
  .strict();

/** Tokens que entrega el formulario sandbox según la tarjeta de prueba. */
export const TOKENS_SANDBOX = {
  aprobada: 'tok_sandbox_aprobada',
  rechazada: 'tok_sandbox_rechazada',
} as const;

export const chatIASchema = z
  .object({
    mensajes: z
      .array(z.object({ rol: z.enum(['usuario', 'asistente']), texto: z.string().trim().min(1).max(4000) }))
      .min(1)
      .max(20),
    contexto: z
      .object({
        tipo: z.enum(['leccion', 'explicacion', 'estadisticas', 'general']),
        id: z.string().max(200).optional(),
      })
      .optional(),
  })
  .strict();

export const busquedaGlobalSchema = z.object({ q: z.string().trim().min(2).max(80) });

export const buscarComunidadSchema = z.object({
  q: z.string().trim().min(2, 'Escribe al menos 2 letras').max(120),
  materia: z.string().trim().max(20).optional(),
  tipo: z.enum(['duda', 'tip', 'material', 'debate']).optional(),
  desde: z.enum(['semana', 'mes', 'anio']).optional(),
});

export const feedQuerySchema = z.object({
  materia: z.string().trim().max(20).optional(),
  tipo: z.enum(['duda', 'tip', 'material', 'debate']).optional(),
  orden: z.enum(['recientes', 'populares', 'sin_responder', 'siguiendo']).default('recientes'),
  limite: z.coerce.number().int().min(1).max(30).default(10),
  cursor: z.string().min(1).optional(),
});
