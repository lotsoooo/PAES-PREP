import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Rol } from '@paes-pro/shared';
import { verificarAcceso } from './tokens.js';
import { noAutorizado, prohibido } from './errores.js';
import { sql } from '../db/client.js';

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
    if (reclamos) {
      // La firma no basta: logout, eliminación y revocación de sesiones deben
      // invalidar el acceso inmediatamente. El rol actual proviene de la BD.
      const [activa] = await sql<{ id: string; rol: Rol }[]>`
        select u.id, u.rol from usuarios u
         where u.id = ${reclamos.sub} and u.eliminado_en is null
           and exists (select 1 from sesiones s where s.usuario_id = u.id
             and s.familia_id = ${reclamos.sid} and s.revocado_en is null and s.expira_en > now())`;
      if (activa) usuario = { id: activa.id, rol: activa.rol };
    }
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
