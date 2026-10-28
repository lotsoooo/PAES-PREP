import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DTOCarrera, DTOColegio, DTOOferta, DTOPlanSuscripcion } from '@paes-pro/shared';
import { get, query } from '@/lib/api';

/** Carreras con búsqueda sin tildes; sin texto devuelve las populares primero. */
export function useCarreras(q: string, limite = 8) {
  return useQuery({
    queryKey: ['catalogos', 'carreras', q, limite],
    queryFn: () => get<DTOCarrera[]>(`/carreras${query({ q: q || undefined, limite })}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

/** Universidades que imparten una carrera, con su puntaje de corte. */
export function useOfertas(carreraId: string | null) {
  return useQuery({
    queryKey: ['catalogos', 'ofertas', carreraId],
    queryFn: () => get<DTOOferta[]>(`/carreras/${carreraId}/ofertas`),
    enabled: Boolean(carreraId),
    staleTime: 5 * 60_000,
  });
}

export function useColegios(q: string) {
  return useQuery({
    queryKey: ['catalogos', 'colegios', q],
    queryFn: () => get<DTOColegio[]>(`/colegios${query({ q: q || undefined, limite: 8 })}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

/** Proveedores de login externos activos en el API (Google solo con credenciales). */
export function useProveedoresAuth() {
  return useQuery({
    queryKey: ['auth', 'proveedores'],
    queryFn: () => get<{ google: boolean }>('/auth/proveedores'),
    staleTime: Infinity,
    retry: false,
  });
}

export function usePlanesSuscripcion() {
  return useQuery({
    queryKey: ['catalogos', 'planes-suscripcion'],
    queryFn: () => get<DTOPlanSuscripcion[]>('/planes-suscripcion'),
    staleTime: 10 * 60_000,
  });
}

/** Etiqueta del colegio para combobox: "Liceo X · Providencia". */
export function etiquetaColegio(c: DTOColegio): { id: string; etiqueta: string; detalle?: string } {
  return { id: c.id, etiqueta: c.nombre, detalle: [c.comuna, c.region].filter(Boolean).join(', ') || undefined };
}
