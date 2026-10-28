import { servicios } from './servicios';

/** Error normalizado del API: { error: { code, message, details? } }. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get esNoAutorizado(): boolean {
    return this.status === 401;
  }

  get esPlanLimite(): boolean {
    return this.code === 'PLAN_LIMIT_REACHED';
  }

  get esPremiumRequerido(): boolean {
    return this.code === 'PREMIUM_REQUIRED';
  }
}

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

/**
 * Cliente HTTP tipado. Adjunta el access token (en memoria) y, ante un 401,
 * refresca una sola vez de forma transparente: varios 401 simultáneos
 * comparten el mismo refresh.
 */
interface ConfigAuth {
  token: () => string | null;
  refrescar: () => Promise<string | null>;
  alPerderSesion: () => void;
}

let auth: ConfigAuth = {
  token: () => null,
  refrescar: async () => null,
  alPerderSesion: () => {},
};

export function configurarAuth(config: ConfigAuth): void {
  auth = config;
}

interface OpcionesPeticion extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Evita bucles: tras un refresh se reintenta una sola vez. */
  _reintento?: boolean;
  /** No intentar refrescar (usado por el propio refresh y el login). */
  sinRefresh?: boolean;
}

let refreshEnVuelo: Promise<string | null> | null = null;

async function refrescarToken(): Promise<string | null> {
  if (!refreshEnVuelo) {
    refreshEnVuelo = auth.refrescar().finally(() => {
      refreshEnVuelo = null;
    });
  }
  return refreshEnVuelo;
}

export async function peticion<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const { body, headers, _reintento, sinRefresh, ...resto } = opciones;

  const cabeceras = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    cabeceras.set('Content-Type', 'application/json');
  }

  const token = auth.token();
  if (token) cabeceras.set('Authorization', `Bearer ${token}`);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
    ...resto,
    headers: cabeceras,
    credentials: 'include',
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.');
  }

  if (respuesta.status === 401 && !_reintento && !sinRefresh) {
    const nuevo = await refrescarToken();
    if (nuevo) {
      return peticion<T>(ruta, { ...opciones, _reintento: true });
    }
    auth.alPerderSesion();
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = texto;
    }
  }

  if (!respuesta.ok) {
    const envoltura = datos as { error?: { code?: string; message?: string; details?: unknown } };
    throw new ApiError(
      respuesta.status,
      envoltura?.error?.code ?? 'INTERNAL_ERROR',
      envoltura?.error?.message ?? 'Ocurrió un error inesperado',
      envoltura?.error?.details,
    );
  }

  return datos as T;
}

export const get = <T>(ruta: string, opciones?: OpcionesPeticion) =>
  peticion<T>(ruta, { ...opciones, method: 'GET' });

export const post = <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
  peticion<T>(ruta, { ...opciones, method: 'POST', body });

export const put = <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
  peticion<T>(ruta, { ...opciones, method: 'PUT', body });

export const patch = <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
  peticion<T>(ruta, { ...opciones, method: 'PATCH', body });

export const del = <T>(ruta: string, opciones?: OpcionesPeticion) =>
  peticion<T>(ruta, { ...opciones, method: 'DELETE' });

/** Construye un query string omitiendo valores vacíos. */
export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue;
    usp.set(clave, String(valor));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export { servicios };

/** URL absoluta de un archivo servido por el API (avatares, imágenes). */
export function urlArchivo(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return url.startsWith('/api/') ? url.replace(/^\/api\/v1/, BASE_URL) : url;
}
