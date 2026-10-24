import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Rol } from '@paes-pro/shared';
import { verificarAcceso } from './tokens.js';
import { noAutorizado, prohibido } from './errores.js';

export interface UsuarioSesion {
  id: string;
  rol: Rol;
}

export interface Entorno {
  Variables: {
    usuario: UsuarioSesion | null;
  };
}

/** Crea un router de módulo con el tipo de entorno compartido. */
export const crearRouter = () => new Hono<Entorno>();

/**
 * Lee el Bearer token si viene. No exige sesión: las rutas que la necesitan
 * llaman a `requiereSesion` o usan `usuarioDe(c)`.
 */
export const leerSesion = createMiddleware<Entorno>(async (c, next) => {
  const cabecera = c.req.header('Authorization');
  let usuario: UsuarioSesion | null = null;
  if (cabecera?.startsWith('Bearer ')) {
    const reclamos = await verificarAcceso(cabecera.slice(7));
    if (reclamos) usuario = { id: reclamos.sub, rol: reclamos.rol };
  }
  c.set('usuario', usuario);
  await next();
});

export const requiereSesion = createMiddleware<Entorno>(async (c, next) => {
  if (!c.get('usuario')) throw noAutorizado();
  await next();
});

export const requiereRol = (...roles: Rol[]) =>
  createMiddleware<Entorno>(async (c, next) => {
    const u = c.get('usuario');
    if (!u) throw noAutorizado();
    if (!roles.includes(u.rol)) throw prohibido();
    await next();
  });

/** Usuario de la sesión; lanza 401 si no hay. */
export function usuarioDe(c: { get: (k: 'usuario') => UsuarioSesion | null }): UsuarioSesion {
  const u = c.get('usuario');
  if (!u) throw noAutorizado();
  return u;
}
