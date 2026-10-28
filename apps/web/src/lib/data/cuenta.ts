import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DTOEstadoSuscripcion,
  DTOPago,
  DTOPreferencias,
  DTOSesionDispositivo,
  DTOUsuarioSesion,
} from '@paes-pro/shared';
import { del, get, patch, peticion, post } from '@/lib/api';
import { useSesion } from '@/app/sesion';

const clave = {
  preferencias: ['cuenta', 'preferencias'] as const,
  sesiones: ['cuenta', 'sesiones'] as const,
  suscripcion: ['premium', 'estado'] as const,
  pagos: ['premium', 'pagos'] as const,
};

export function usePreferencias() {
  return useQuery({ queryKey: clave.preferencias, queryFn: () => get<DTOPreferencias>('/usuarios/preferencias') });
}

export function useActualizarPreferencias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cambios: Partial<DTOPreferencias>) => patch<DTOPreferencias>('/usuarios/preferencias', cambios),
    onSuccess: (p) => qc.setQueryData(clave.preferencias, p),
  });
}

export interface CambiosPerfil {
  nombre?: string;
  apellido?: string | null;
  curso?: string | null;
  colegioId?: string | null;
  puntajeMeta?: number | null;
}

export function useActualizarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cambios: CambiosPerfil) => patch<DTOUsuarioSesion>('/usuarios/perfil', cambios),
    onSuccess: (u) => {
      useSesion.getState().actualizarUsuario(u);
      void qc.invalidateQueries({ queryKey: ['perfil'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSubirAvatar() {
  return useMutation({
    mutationFn: (archivo: File) => {
      const fd = new FormData();
      fd.append('archivo', archivo);
      return peticion<{ avatarUrl: string }>('/usuarios/avatar', { method: 'POST', body: fd });
    },
    onSuccess: ({ avatarUrl }) => useSesion.getState().actualizarUsuario({ avatarUrl }),
  });
}

export function useSesionesActivas() {
  return useQuery({ queryKey: clave.sesiones, queryFn: () => get<DTOSesionDispositivo[]>('/auth/sesiones') });
}

export function useCerrarSesionDispositivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/auth/sesiones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: clave.sesiones }),
  });
}

export function useCerrarOtrasSesiones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => del<void>('/auth/sesiones'),
    onSuccess: () => qc.invalidateQueries({ queryKey: clave.sesiones }),
  });
}

export function useCambiarPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { passwordActual: string; passwordNuevo: string }) => post<{ ok: true }>('/auth/password', datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: clave.sesiones }),
  });
}

export function useEliminarCuenta() {
  return useMutation({
    mutationFn: () => del<void>('/auth/cuenta', { body: { confirmacion: 'ELIMINAR' } }),
  });
}

export function useEstadoSuscripcion() {
  return useQuery({ queryKey: clave.suscripcion, queryFn: () => get<DTOEstadoSuscripcion>('/premium/estado') });
}

export function useCancelarSuscripcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<DTOEstadoSuscripcion>('/premium/cancelar'),
    onSuccess: (e) => qc.setQueryData(clave.suscripcion, e),
  });
}

export function usePagos() {
  return useQuery({ queryKey: clave.pagos, queryFn: () => get<DTOPago[]>('/premium/pagos') });
}
