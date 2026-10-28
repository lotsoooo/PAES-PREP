export interface TramoConversion {
  pctLogroMin: number;
  pctLogroMax: number;
  puntajeMin: number;
  puntajeMax: number;
}

/**
 * Convierte % de logro a puntaje PAES interpolando dentro del tramo que
 * contiene el porcentaje. Si está fuera de rango, se extrapola con el tramo
 * extremo (nunca devuelve NaN ni valores fuera de 100–1000).
 *
 * @param tramos tabla conversion_puntaje de la prueba
 * @param pctLogro porcentaje de logro (0–100)
 */
export function convertirPuntaje(tramos: TramoConversion[], pctLogro: number): number {
  if (tramos.length === 0) {
    throw new Error('convertirPuntaje: la prueba no tiene tramos de conversión');
  }

  const pct = Math.max(0, Math.min(100, pctLogro));

  // Orden defensivo: la BD garantiza el orden, pero no confiamos en ella.
  const ordenados = [...tramos].sort((a, b) => a.pctLogroMin - b.pctLogroMin);

  const primero = ordenados[0]!;
  const ultimo = ordenados[ordenados.length - 1]!;

  if (pct < primero.pctLogroMin) {
    return acotar(primero.puntajeMin);
  }
  if (pct > ultimo.pctLogroMax) {
    return acotar(ultimo.puntajeMax);
  }

  const tramo = ordenados.find((t) => pct >= t.pctLogroMin && pct <= t.pctLogroMax);
  if (!tramo) return acotar(ultimo.puntajeMax);

  const anchoPct = tramo.pctLogroMax - tramo.pctLogroMin;
  if (anchoPct === 0) return acotar(tramo.puntajeMin);

  const proporcion = (pct - tramo.pctLogroMin) / anchoPct;
  const puntaje = tramo.puntajeMin + proporcion * (tramo.puntajeMax - tramo.puntajeMin);

  return acotar(Math.round(puntaje));
}

/** El puntaje PAES siempre vive entre 100 y 1000. */
export function acotar(puntaje: number): number {
  return Math.max(100, Math.min(1000, puntaje));
}
