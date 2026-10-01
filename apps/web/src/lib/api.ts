import { servicios } from './servicios.js';

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
 * Client HTTP tipado. Adjunta el access token desde el store en memoria y
 * refresca de forma transparente ante un 401 (una sola vez, sin carreras).
 */
type Refrescador = () => Promise<string | null>;

let obtenerToken: Refrescador = async () => null;
let alExpirar: (() => void) | null = null;

export function configurarAuth(
  refrescador: Refrescador,
  alPerderSesion: () => void,
): void {
  obtenerToken = refrescador;
  alExpirar = alPerderSesion;
}

interface OpcionesPeticion extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Permite reintentar tras un refresh sin bucles infinitos. */
  _reintento?: boolean;
}

let refreshEnVuelo: Promise<string | null> | null = null;

/** Deduplica los refresh concurrentes: varios 401 generan una sola petición. */
async function refrescarToken(): Promise<string | null> {
  if (!refreshEnVuelo) {
    refreshEnVuelo = obtenerToken().finally(() => {
      refreshEnVuelo = null;
    });
  }
  return refreshEnVuelo;
}

export async function peticion<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const { body, headers, _reintento, ...resto } = opciones;

  const cabeceras = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    cabeceras.set('Content-Type', 'application/json');
  }

  const token = await obtenerToken();
  if (token) cabeceras.set('Authorization', `Bearer ${token}`);

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
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

  if (respuesta.status === 401 && !_reintento) {
    const nuevo = await refrescarToken();
    if (nuevo) {
      return peticion<T>(ruta, { ...opciones, _reintento: true });
    }
    alExpirar?.();
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
