import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DTODashboardCompleto, DTOPlanSemana, DTOTareaActualizada, DTOTareaPlan } from '@paes-pro/shared';
import { ApiError, get, patch, post, query } from '@/lib/api';
import { useSesion } from '@/app/sesion';
import { claveDashboard } from './dashboard';

export const clavePlan = (desde: string) => ['plan', desde] as const;

/** Plan de la semana que parte el lunes `desde` (YYYY-MM-DD). */
export function usePlanSemana(desde: string) {
  return useQuery({
    queryKey: clavePlan(desde),
    queryFn: () => get<DTOPlanSemana>(`/plan${query({ desde })}`),
    placeholderData: keepPreviousData,
  });
}

type CambioTarea = { id: string; estado?: DTOTareaPlan['estado']; fechaPlanificada?: string };

/**
 * Actualiza una tarea con respuesta optimista: la tarjeta cambia al instante y
 * se revierte si el API falla. La racha que devuelve el API se refleja en la
 * sesión (topbar) y en el resto de la app.
 */
export function useActualizarTarea(desde: string) {
  const qc = useQueryClient();
  const clave = clavePlan(desde);
  return useMutation({
    mutationFn: ({ id, ...cambios }: CambioTarea) => patch<DTOTareaActualizada>(`/plan/tareas/${id}`, cambios),
    onMutate: async (cambio) => {
      await qc.cancelQueries({ queryKey: clave });
      await qc.cancelQueries({ queryKey: claveDashboard });
      const aplicar = (t: DTOTareaPlan) => (t.id === cambio.id ? { ...t, ...cambio } : t);
      const previo = qc.getQueryData<DTOPlanSemana>(clave);
      if (previo) qc.setQueryData<DTOPlanSemana>(clave, { ...previo, tareas: previo.tareas.map(aplicar) });
      const previoDash = qc.getQueryData<DTODashboardCompleto>(claveDashboard);
      if (previoDash) qc.setQueryData<DTODashboardCompleto>(claveDashboard, { ...previoDash, tareasHoy: previoDash.tareasHoy.map(aplicar) });
      return { previo, previoDash };
    },
    onError: (error, _c, ctx) => {
      if (ctx?.previo) qc.setQueryData(clave, ctx.previo);
      if (ctx?.previoDash) qc.setQueryData(claveDashboard, ctx.previoDash);
      toast.error(error instanceof ApiError ? error.message : 'No pudimos guardar el cambio.');
    },
    onSuccess: (r) => {
      useSesion.getState().actualizarUsuario({ rachaActual: r.racha.actual, rachaMaxima: r.racha.maxima });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['plan'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRegenerarPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { horasSemana?: number; semanas?: number }) => post<DTOPlanSemana>('/plan/regenerar', datos),
    onSuccess: () => {
      toast.success('Tu plan se recalculó con tu avance actual.');
      void qc.invalidateQueries({ queryKey: ['plan'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'No pudimos recalcular el plan.'),
  });
}
