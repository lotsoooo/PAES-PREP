import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Rol } from '@paes-pro/shared';
import { config } from '../config.js';

const claveAcceso = new TextEncoder().encode(config.JWT_SECRET);

export interface ReclamosAcceso {
  sub: string;
  rol: Rol;
}

/** Access token corto (JWT HS256). Vive solo en memoria del cliente. */
export async function firmarAcceso(reclamos: ReclamosAcceso): Promise<string> {
  return new SignJWT({ rol: reclamos.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(reclamos.sub)
    .setIssuedAt()
    .setIssuer('paes-pro')
    .setExpirationTime(`${config.ACCESS_TOKEN_TTL_MIN}m`)
    .sign(claveAcceso);
}

export async function verificarAcceso(token: string): Promise<ReclamosAcceso | null> {
  try {
    const { payload } = await jwtVerify(token, claveAcceso, { issuer: 'paes-pro' });
    if (typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, rol: (payload.rol as Rol) ?? 'estudiante' };
  } catch {
    return null;
  }
}

/** Token opaco aleatorio (refresh, recuperación). Se guarda solo su hash. */
export function tokenAleatorio(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(`${config.REFRESH_SECRET}:${token}`).digest('hex');
}
