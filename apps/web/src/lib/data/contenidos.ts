import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DTOBibliotecaContenidos,
  DTOContenidoLeccion,
  DTOMateriaConEjes,
  DTOPregunta,
  DTOProgresoContenido,
  DTOResultadoMiniTest,
} from '@paes-pro/shared';
import { get, post, put, query } from '@/lib/api';
import { useSesion } from '@/app/sesion';

export interface FiltrosContenidos {
  materia?: string;
  tipo?: 'video' | 'pdf' | 'mixto' | 'practica';
  estado?: 'pendiente' | 'en_curso' | 'completado';
  q?: string;
}

export function useMaterias() {
  return useQuery({
    queryKey: ['materias'],
    queryFn: () => get<DTOMateriaConEjes[]>('/materias'),
    staleTime: 10 * 60_000,
  });
}

export function useBibliotecaContenidos(filtros: FiltrosContenidos) {
  return useQuery({
    queryKey: ['contenidos', 'lista', filtros],
    queryFn: () => get<DTOBibliotecaContenidos>(`/contenidos${query({ ...filtros })}`),
    placeholderData: keepPreviousData,
  });
}

export function useLeccion(slug: string | undefined) {
  return useQuery({
    queryKey: ['contenidos', 'detalle', slug],
    queryFn: () => get<DTOContenidoLeccion>(`/contenidos/${slug}`),
    enabled: Boolean(slug),
  });
}

/** Guarda el avance de una lección (0–100). Completar = 100. */
export function useProgresoContenido(contenidoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (porcentaje: number) => put<DTOProgresoContenido>(`/contenidos/${contenidoId}/progreso`, { porcentaje }),
    onSuccess: (r) => {
      useSesion.getState().actualizarUsuario({ rachaActual: r.racha.actual, rachaMaxima: r.racha.maxima });
      if (r.completado) {
        void qc.invalidateQueries({ queryKey: ['contenidos'] });
        void qc.invalidateQueries({ queryKey: ['dashboard'] });
        void qc.invalidateQueries({ queryKey: ['plan'] });
      }
    },
  });
}

export function useMiniTest(contenidoId: string | undefined, activo: boolean) {
  return useQuery({
    queryKey: ['contenidos', 'mini-test', contenidoId],
    queryFn: () => get<DTOPregunta[]>(`/contenidos/${contenidoId}/mini-test`),
    enabled: Boolean(contenidoId) && activo,
    staleTime: Infinity,
  });
}

export function useResponderMiniTest(contenidoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (respuestas: { preguntaId: string; alternativaId: string | null }[]) =>
      post<DTOResultadoMiniTest>(`/contenidos/${contenidoId}/mini-test`, { respuestas }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cuaderno'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
