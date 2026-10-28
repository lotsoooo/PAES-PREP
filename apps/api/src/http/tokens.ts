import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';
import type { IdentidadAcceso } from '../services/seguridad.js';
import { crearGestorAcceso } from './tokens-acceso.js';

const gestor = crearGestorAcceso(config.JWT_SECRET, config.ACCESS_TOKEN_TTL_MIN);

export type ReclamosAcceso = IdentidadAcceso;

/** Access token corto (JWT HS256). Vive solo en memoria del cliente. */
export const firmarAcceso = gestor.firmar;
export const verificarAcceso = gestor.verificar;

/** Token opaco aleatorio (refresh, recuperación). Se guarda solo su hash. */
export function tokenAleatorio(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(`${config.REFRESH_SECRET}:${token}`).digest('hex');
}
