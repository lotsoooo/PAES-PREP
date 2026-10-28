import { isIP } from 'node:net';
import type { Rol } from '@paes-pro/shared';

/** Only local application paths may be used after authentication. */
export function rutaRetornoSegura(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.startsWith('/') || valor.startsWith('//')) return null;
  // Los caracteres de control se buscan a propósito: no pueden ir en una ruta de retorno.
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u0020\u007f]/u.test(valor)) return null;
  try {
    const decoded = decodeURIComponent(valor);
    // eslint-disable-next-line no-control-regex
    if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/u.test(decoded)) return null;
    const base = new URL('https://paes.invalid');
    const destino = new URL(valor, base);
    return destino.origin === base.origin ? `${destino.pathname}${destino.search}${destino.hash}` : null;
  } catch {
    return null;
  }
}

export function origenPermitido(origen: string | undefined, permitidos: readonly string[]): boolean {
  if (!origen) return true; // Non-browser clients do not send Origin.
  try {
    return permitidos.some((p) => new URL(p).origin === new URL(origen).origin);
  } catch {
    return false;
  }
}

export function ipValida(valor: string | null): string | null {
  return valor && isIP(valor) !== 0 ? valor : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: readonly string[] = ['estudiante', 'profesor', 'admin'];

export interface IdentidadAcceso { sub: string; rol: Rol; sid: string }

export function reclamosValidos(payload: Record<string, unknown>): payload is Record<string, unknown> & IdentidadAcceso {
  return typeof payload.sub === 'string' && UUID.test(payload.sub)
    && typeof payload.sid === 'string' && UUID.test(payload.sid)
    && typeof payload.rol === 'string' && ROLES.includes(payload.rol);
}

/** Explicit public allowlist: adding private account fields cannot leak them. */
export function identidadPublica<T extends { id: string; nombre: string; apellido: string | null; avatarUrl: string | null; rol: Rol }>(usuario: T) {
  return { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, avatarUrl: usuario.avatarUrl, rol: usuario.rol };
}

/** Reject forged MIME headers and obviously truncated image containers. */
export function firmaImagenValida(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/png') {
    const firma = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= 33 && firma.every((b, i) => bytes[i] === b)
      && String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR';
  }
  if (mime === 'image/jpeg') {
    return bytes.length >= 12 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  }
  if (mime === 'image/webp') {
    return bytes.length >= 20 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
      && ['VP8 ', 'VP8L', 'VP8X'].includes(String.fromCharCode(...bytes.slice(12, 16)))
      && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) + 8 === bytes.length;
  }
  if (mime === 'image/gif') {
    return bytes.length >= 14 && ['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.slice(0, 6)))
      && bytes[bytes.length - 1] === 0x3b;
  }
  return false;
}
