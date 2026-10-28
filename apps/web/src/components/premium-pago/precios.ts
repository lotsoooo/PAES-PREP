import type { DTOPlanSuscripcion } from '@paes-pro/shared';
import { PRECIO_PREMIUM_CLP } from '@paes-pro/shared';

export type Periodo = 'mensual' | 'anual';

/** Precios de los planes de pago desde el catálogo, con respaldo si aún no carga. */
export function preciosPremium(planes: DTOPlanSuscripcion[] | undefined) {
  const mensual = planes?.find((p) => p.codigo === 'premium')?.precioClp ?? PRECIO_PREMIUM_CLP;
  const precioAnual = planes?.find((p) => p.codigo === 'anual')?.precioClp;
  const anual = precioAnual ?? mensual * 12;
  const ahorro = precioAnual === undefined ? 0 : Math.max(0, mensual * 12 - anual);
  return {
    mensual,
    anualDisponible: precioAnual !== undefined,
    anual,
    anualPorMes: Math.round(anual / 12),
    ahorro,
    porcentajeAhorro: mensual > 0 ? Math.round((ahorro / (mensual * 12)) * 100) : 0,
  };
}

export const codigoDePeriodo = (p: Periodo) => (p === 'anual' ? 'anual' : 'premium') as 'anual' | 'premium';
