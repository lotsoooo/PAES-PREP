import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DTOCuaderno,
  DTOEnsayo,
  DTOEstadisticasCompletas,
  DTOExplicacion,
  DTOIntento,
  DTOIntentoResumen,
  DTOItemCuaderno,
  DTOResultadosCompletos,
  Prueba,
} from '@paes-pro/shared';
import { del, get, post, put, query } from '@/lib/api';

export const claveEnsayos = {
  lista: (prueba?: Prueba, q?: string) => ['ensayos', 'lista', prueba ?? null, q ?? ''] as const,
  detalle: (slug: string) => ['ensayos', 'detalle', slug] as const,
  intentos: ['intentos', 'lista'] as const,
  intento: (id: string) => ['intentos', id] as const,
  resultados: (id: string) => ['intentos', id, 'resultados'] as const,
  explicacion: (id: string, n: number) => ['intentos', id, 'pregunta', n] as const,
  estadisticas: (periodo: 'semanal' | 'mensual') => ['estadisticas', periodo] as const,
};

export function useEnsayos(prueba?: Prueba, q?: string) {
  return useQuery({
    queryKey: claveEnsayos.lista(prueba, q),
    queryFn: () => get<DTOEnsayo[]>(`/ensayos${query({ prueba, q })}`),
    placeholderData: (previo) => previo,
  });
}

export function useEnsayo(slug: string) {
  return useQuery({ queryKey: claveEnsayos.detalle(slug), queryFn: () => get<DTOEnsayo>(`/ensayos/${slug}`) });
}

export function useMisIntentos() {
  return useQuery({ queryKey: claveEnsayos.intentos, queryFn: () => get<DTOIntentoResumen[]>('/intentos') });
}

/** Crea el intento o retoma el que está en curso (el API decide). */
export function useIniciarIntento() {
  return useMutation({
    mutationFn: (ensayoSlug: string) => post<DTOIntento>('/intentos', { ensayoSlug }),
  });
}

export function guardarRespuesta(
  intentoId: string,
  preguntaId: string,
  datos: { alternativaId?: string | null; esMarcada?: boolean; tiempoSegundos?: number; baseGuardadoEn?: string | null },
) {
  return put<{ ok: true; guardadoEn: string }>(`/intentos/${intentoId}/respuestas/${preguntaId}`, datos);
}

export function entregarIntento(intentoId: string) {
  return post<DTOResultadosCompletos>(`/intentos/${intentoId}/entregar`);
}

export function useResultados(id: string) {
  return useQuery({
    queryKey: claveEnsayos.resultados(id),
    queryFn: () => get<DTOResultadosCompletos>(`/intentos/${id}/resultados`),
  });
}

export function useExplicacion(id: string, n: number) {
  return useQuery({
    queryKey: claveEnsayos.explicacion(id, n),
    queryFn: () => get<DTOExplicacion>(`/intentos/${id}/pregunta/${n}`),
    placeholderData: (previo) => previo,
  });
}

/** Agrega o quita la pregunta del cuaderno de errores. */
export function useAlternarCuaderno(intentoId: string, n: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ preguntaId, agregar }: { preguntaId: string; agregar: boolean }) => {
      if (agregar) {
        await post<DTOItemCuaderno>('/cuaderno', { preguntaId, intentoId });
        return true;
      }
      const cuaderno = await get<DTOCuaderno>('/cuaderno');
      const item = cuaderno.items.find((i) => i.preguntaId === preguntaId && !i.dominada);
      if (item) await del<void>(`/cuaderno/${item.id}`);
      return false;
    },
    onSuccess: (enCuaderno) => {
      qc.setQueryData<DTOExplicacion>(claveEnsayos.explicacion(intentoId, n), (d) => (d ? { ...d, enCuaderno } : d));
      void qc.invalidateQueries({ queryKey: ['cuaderno'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useEstadisticas(periodo: 'semanal' | 'mensual') {
  return useQuery({
    queryKey: claveEnsayos.estadisticas(periodo),
    queryFn: () => get<DTOEstadisticasCompletas>(`/estadisticas${query({ periodo })}`),
    placeholderData: (previo) => previo,
  });
}
