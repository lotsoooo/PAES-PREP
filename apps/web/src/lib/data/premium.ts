import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DTOEstadoSuscripcion, DTOResultadoCheckout } from '@paes-pro/shared';
import { get, post } from '@/lib/api';
import { recargarUsuario } from '@/app/sesion';

export type CodigoPlanPago = 'premium' | 'anual';

export function useResultadoPago(id: string | null) {
  return useQuery({
    queryKey: ['premium', 'pago', id],
    enabled: Boolean(id),
    queryFn: () => get<{ pagoId: string; estado: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado'; modoPago: string }>(`/premium/pagos/${encodeURIComponent(id!)}`),
    refetchInterval: (q) => q.state.data?.estado === 'pendiente' ? 5000 : false,
  });
}

/** Solo Webpay: los datos de la tarjeta se ingresan en la página de Transbank. */
export interface DatosCheckout {
  plan: CodigoPlanPago;
  metodo: 'webpay';
}

/** Tras activar Premium: la sesión y todo lo que depende del plan se recargan. */
async function alActivarPremium(qc: ReturnType<typeof useQueryClient>) {
  await recargarUsuario().catch(() => undefined);
  void qc.invalidateQueries();
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: DatosCheckout) => post<DTOResultadoCheckout>('/premium/checkout', d),
    onSuccess: async (r) => {
      if (r.estado === 'aprobado') await alActivarPremium(qc);
    },
  });
}

export function useConfirmarWebpay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { token: string; aprobar?: boolean }) => post<DTOResultadoCheckout>('/premium/webpay/confirmar', d),
    onSuccess: async (r) => {
      if (r.estado === 'aprobado') await alActivarPremium(qc);
    },
  });
}

export function useProbarPremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<DTOEstadoSuscripcion>('/premium/prueba'),
    onSuccess: async (e) => {
      qc.setQueryData(['premium', 'estado'], e);
      await alActivarPremium(qc);
    },
  });
}
