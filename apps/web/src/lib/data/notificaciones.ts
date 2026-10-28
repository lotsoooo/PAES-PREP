import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DTOCentroNotificaciones, DTOResumenNotificaciones } from '@paes-pro/shared';
import { get, post, query } from '@/lib/api';

export const claveNotif = {
  resumen: ['notificaciones', 'resumen'] as const,
  lista: (soloNoLeidas: boolean) => ['notificaciones', 'lista', soloNoLeidas] as const,
};

export function useResumenNotificaciones(activo = true) {
  return useQuery({
    queryKey: claveNotif.resumen,
    queryFn: () => get<DTOResumenNotificaciones>('/notificaciones/resumen'),
    enabled: activo,
    refetchInterval: 60_000,
  });
}

export function useNotificaciones(soloNoLeidas: boolean) {
  return useInfiniteQuery({
    queryKey: claveNotif.lista(soloNoLeidas),
    queryFn: ({ pageParam }) =>
      get<DTOCentroNotificaciones>(
        `/notificaciones${query({ cursor: pageParam, limite: 15, soloNoLeidas: soloNoLeidas ? 'true' : undefined })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima) => (ultima.hasMore ? (ultima.nextCursor ?? undefined) : undefined),
  });
}

export function useMarcarLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<void>(`/notificaciones/${id}/leer`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<void>('/notificaciones/leer-todas'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });
}
