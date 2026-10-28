import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DTOPlanGenerado, DTOPlanSemana, DTOUsuarioSesion } from '@paes-pro/shared';
import { get, post, put } from '@/lib/api';
import { useSesion } from '@/app/sesion';

export const clavePlanGenerado = ['onboarding', 'plan-generado'] as const;

export interface DatosMeta {
  carreraId: string | null;
  universidadId: string | null;
  puntajeMeta?: number | null;
}

export interface DatosDisponibilidad {
  horasSemana: number;
  diasDisponibles: number[];
  pruebasObjetivo: string[];
}

/** Guarda la meta y actualiza el usuario en memoria. */
export function useGuardarMeta() {
  return useMutation({
    mutationFn: (datos: DatosMeta) => put<DTOUsuarioSesion>('/onboarding/meta', datos),
    onSuccess: (u) => useSesion.getState().actualizarUsuario(u),
  });
}

export function useGuardarDisponibilidad() {
  return useMutation({
    mutationFn: (datos: DatosDisponibilidad) => put<DTOUsuarioSesion>('/onboarding/disponibilidad', datos),
    onSuccess: (u) => useSesion.getState().actualizarUsuario(u),
  });
}

/**
 * Genera el plan. El resultado queda en caché para que /onboarding/plan lo
 * muestre sin volver a generarlo. `onboardingCompletado` se actualiza al
 * entrar al dashboard, para no saltarse la pantalla del plan.
 */
export function useGenerarPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<DTOPlanGenerado>('/onboarding/plan'),
    onSuccess: (r) => qc.setQueryData(clavePlanGenerado, r),
  });
}

export function useOmitirOnboarding() {
  return useMutation({
    mutationFn: () => post<DTOUsuarioSesion>('/onboarding/omitir'),
    onSuccess: (u) => useSesion.getState().actualizarUsuario(u),
  });
}

/** Resultado recién generado o, si se recargó la página, el plan activo. */
export function usePlanGenerado() {
  const qc = useQueryClient();
  const generado = qc.getQueryData<DTOPlanGenerado>(clavePlanGenerado);
  const activo = useQuery({
    queryKey: ['plan', 'activo-onboarding'],
    queryFn: () => get<DTOPlanSemana>('/plan'),
    enabled: !generado,
    retry: false,
  });
  return { generado, activo };
}
