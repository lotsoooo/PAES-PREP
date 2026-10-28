/**
 * Repaso espaciado con cajas de Leitner. Lógica pura (sin BD) para testear.
 *
 * Caja 1 → repasa en 1 día; 2 → 3; 3 → 7; 4 → 14; 5 → 30 días.
 * Un acierto sube una caja; acertar estando en la 5 marca la pregunta como
 * dominada. Un error devuelve la pregunta a la caja 1.
 */

export const INTERVALOS_DIAS = [1, 3, 7, 14, 30] as const;
export const CAJA_MAXIMA = 5;

export interface EstadoLeitner {
  caja: number;
  dominada: boolean;
  /** Días a sumar a hoy para el próximo repaso. */
  diasHastaRepaso: number;
}

export function intervaloDeCaja(caja: number): number {
  const i = Math.min(Math.max(caja, 1), CAJA_MAXIMA) - 1;
  return INTERVALOS_DIAS[i]!;
}

export function siguienteEstado(cajaActual: number, acierto: boolean): EstadoLeitner {
  if (!acierto) return { caja: 1, dominada: false, diasHastaRepaso: intervaloDeCaja(1) };
  if (cajaActual >= CAJA_MAXIMA) {
    return { caja: CAJA_MAXIMA, dominada: true, diasHastaRepaso: intervaloDeCaja(CAJA_MAXIMA) };
  }
  const caja = cajaActual + 1;
  return { caja, dominada: false, diasHastaRepaso: intervaloDeCaja(caja) };
}
