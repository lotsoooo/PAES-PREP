import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DTOCuaderno, DTOPreguntaRepaso, DTORespuestaRepaso } from '@paes-pro/shared';
import { ApiError, del, get, post } from '@/lib/api';

export function useCuaderno() {
  return useQuery({
    queryKey: ['cuaderno', 'resumen'],
    queryFn: () => get<DTOCuaderno>('/cuaderno'),
  });
}

/** Preguntas que toca repasar hoy. No se refresca solo: la sesión la fija al abrir. */
export function useSesionRepaso() {
  return useQuery({
    queryKey: ['cuaderno', 'sesion'],
    queryFn: () => get<DTOPreguntaRepaso[]>('/cuaderno/repaso'),
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useResponderRepaso() {
  return useMutation({
    mutationFn: ({ cuadernoId, alternativaId }: { cuadernoId: string; alternativaId: string }) =>
      post<DTORespuestaRepaso>(`/cuaderno/${cuadernoId}/responder`, { alternativaId }),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'No pudimos guardar tu respuesta.'),
  });
}

export function useQuitarDelCuaderno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/cuaderno/${id}`),
    onSuccess: () => {
      toast.success('Pregunta quitada del cuaderno.');
      void qc.invalidateQueries({ queryKey: ['cuaderno'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'No pudimos quitarla.'),
  });
}
