import { create } from 'zustand';
import type { DTOSesionAuth, DTOUsuarioSesion } from '@paes-pro/shared';
import { configurarAuth, peticion, post } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

/**
 * Sesión del usuario. El access token vive solo en memoria; el refresh token
 * está en una cookie httpOnly que el navegador envía a /api/v1/auth.
 */
type Estado = 'iniciando' | 'invitado' | 'autenticado';

interface EstadoSesion {
  estado: Estado;
  usuario: DTOUsuarioSesion | null;
  acceso: string | null;
  setSesion: (sesion: DTOSesionAuth) => void;
  actualizarUsuario: (parcial: Partial<DTOUsuarioSesion>) => void;
  limpiar: () => void;
}

export const useSesion = create<EstadoSesion>((set) => ({
  estado: 'iniciando',
  usuario: null,
  acceso: null,
  setSesion: ({ usuario, accessToken }) => set({ usuario, acceso: accessToken, estado: 'autenticado' }),
  actualizarUsuario: (parcial) =>
    set((s) => ({ usuario: s.usuario ? { ...s.usuario, ...parcial } : null })),
  limpiar: () => set({ usuario: null, acceso: null, estado: 'invitado' }),
}));

/** Pide un access token nuevo usando la cookie de refresh. */
async function refrescar(): Promise<string | null> {
  try {
    // 204 = invitado sin sesión.
    const sesion = await peticion<DTOSesionAuth | undefined>('/auth/refresh', { method: 'POST', sinRefresh: true });
    if (!sesion) return null;
    useSesion.getState().setSesion(sesion);
    return sesion.accessToken;
  } catch {
    return null;
  }
}

configurarAuth({
  token: () => useSesion.getState().acceso,
  refrescar,
  alPerderSesion: () => {
    useSesion.getState().limpiar();
    queryClient.clear();
  },
});

let arranque: Promise<void> | null = null;

/** Restaura la sesión al cargar la app (una sola vez). */
export function restaurarSesion(): Promise<void> {
  if (!arranque) {
    arranque = refrescar().then((token) => {
      if (!token) useSesion.getState().limpiar();
    });
  }
  return arranque;
}

export async function iniciarSesion(datos: {
  email: string;
  password: string;
  mantenerSesion: boolean;
  colegioId?: string;
}): Promise<DTOUsuarioSesion> {
  const sesion = await peticion<DTOSesionAuth>('/auth/login', { method: 'POST', body: datos, sinRefresh: true });
  queryClient.clear();
  useSesion.getState().setSesion(sesion);
  return sesion.usuario;
}

export async function registrarse(datos: { nombre: string; email: string; password: string }): Promise<DTOUsuarioSesion> {
  const sesion = await peticion<DTOSesionAuth>('/auth/registro', { method: 'POST', body: datos, sinRefresh: true });
  queryClient.clear();
  useSesion.getState().setSesion(sesion);
  return sesion.usuario;
}

export async function cerrarSesion(): Promise<void> {
  try {
    await post('/auth/logout', undefined, { sinRefresh: true });
  } finally {
    useSesion.getState().limpiar();
    queryClient.clear();
  }
}

/** Recarga los datos del usuario (tras pagar, editar perfil, onboarding…). */
export async function recargarUsuario(): Promise<void> {
  const usuario = await peticion<DTOUsuarioSesion>('/auth/yo');
  useSesion.getState().actualizarUsuario(usuario);
}
