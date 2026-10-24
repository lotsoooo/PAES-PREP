import type { ApiErrorCode } from '@paes-pro/shared';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Error de dominio con forma de respuesta HTTP. Cualquier ruta puede lanzarlo;
 * `index.ts` lo convierte en `{ error: { code, message, details? } }`.
 */
export class HttpError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor(status: ContentfulStatusCode, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const noAutorizado = (mensaje = 'Tu sesión expiró. Inicia sesión otra vez.') =>
  new HttpError(401, 'UNAUTHORIZED', mensaje);

export const prohibido = (mensaje = 'No tienes permiso para hacer esto.') =>
  new HttpError(403, 'FORBIDDEN', mensaje);

export const noEncontrado = (mensaje = 'No encontramos lo que buscas.') =>
  new HttpError(404, 'NOT_FOUND', mensaje);

export const conflicto = (mensaje: string, details?: unknown) =>
  new HttpError(409, 'CONFLICT', mensaje, details);

export const invalido = (mensaje: string, details?: unknown) =>
  new HttpError(400, 'VALIDATION_ERROR', mensaje, details);

export const premiumRequerido = (mensaje = 'Esta función es parte de Premium.') =>
  new HttpError(402, 'PREMIUM_REQUIRED', mensaje);

export const limitePlan = (mensaje: string, details?: unknown) =>
  new HttpError(402, 'PLAN_LIMIT_REACHED', mensaje, details);
