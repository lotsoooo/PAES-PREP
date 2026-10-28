/** Intervalos de las cajas de Leitner (iguales a apps/api/src/services/leitner.ts). */
export const INTERVALOS_CAJA = [1, 3, 7, 14, 30] as const;

/** "Hoy", "Mañana", "En 3 días", "Atrasada 2 días". */
export function cuandoRepasar(iso: string, hoy = new Date()): string {
  const objetivo = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((objetivo.getTime() - inicio.getTime()) / 86_400_000);
  if (dias < 0) return dias === -1 ? 'Atrasada 1 día' : `Atrasada ${-dias} días`;
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}
