import { convertirPuntaje, type TramoConversion } from './puntaje.js';

export interface RespuestaEvaluada {
  preguntaId: string;
  alternativaElegida: string | null;
  alternativaCorrecta: string;
  esCorrecta: boolean;
  /** Puntaje otorgado (permite puntaje parcial). */
  puntajeObtenido: number;
  /** Puntaje máximo posible de la pregunta. */
  puntajeTotal: number;
  /** Segundos que el usuario tardó en responder. */
  segundos: number;
}

export interface ResultadoEje {
  ejeId: string;
  total: number;
  correctas: number;
  pctLogro: number;
}

export interface ResultadoCalificado {
  correctas: number;
  incorrectas: number;
  omitidas: number;
  total: number;
  pctLogro: number;
  puntaje: number;
  /** Por eje, para el gráfico de barras de la pantalla de resultados. */
  porEje: ResultadoEje[];
  /** Segundos usados y promedio por pregunta. */
  segundosTotales: number;
  segundosPromedioPregunta: number;
  puntosObtenidos: number;
  puntosTotales: number;
  /** Eje con menor precisión: alimenta "Recomendado para ti". */
  ejeDebil: { ejeId: string; precision: number } | null;
}

/** Criterio de aprobado por defecto: 60 % de logro. */
export const UMBRAL_APROBADO = 60;

export function aprobo(resultado: Pick<ResultadoCalificado, 'pctLogro'>): boolean {
  return resultado.pctLogro >= UMBRAL_APROBADO;
}

export interface PreguntaParaCorregir extends RespuestaEvaluada {
  ejeId: string | null;
}

/**
 * Corrige un intento. Todo el cálculo ocurre en el servidor: el cliente nunca
 * recibe las alternativas correctas antes de entregar.
 */
export function calificarIntento(
  preguntas: PreguntaParaCorregir[],
  tramos: TramoConversion[],
): ResultadoCalificado {
  const total = preguntas.length;

  let correctas = 0;
  let incorrectas = 0;
  let omitidas = 0;
  let segundosTotales = 0;
  let puntosObtenidos = 0;
  let puntosTotales = 0;

  const porEjeMap = new Map<string, { total: number; correctas: number; puntos: number; totalPuntos: number }>();

  for (const p of preguntas) {
    segundosTotales += p.segundos;
    puntosTotales += p.puntajeTotal;

    if (p.alternativaElegida === null) {
      omitidas++;
    } else {
      puntosObtenidos += p.puntajeObtenido;
      if (p.esCorrecta) correctas++;
      else incorrectas++;
    }

    if (p.ejeId) {
      const actual = porEjeMap.get(p.ejeId) ?? { total: 0, correctas: 0, puntos: 0, totalPuntos: 0 };
      actual.total += 1;
      actual.totalPuntos += p.puntajeTotal;
      actual.puntos += p.puntajeObtenido;
      if (p.esCorrecta) actual.correctas += 1;
      porEjeMap.set(p.ejeId, actual);
    }
  }

  const pctLogro = total === 0 ? 0 : redondear((correctas / total) * 100);
  const puntaje = convertirPuntaje(tramos, pctLogro);

  const porEje: ResultadoEje[] = [...porEjeMap.entries()].map(([ejeId, v]) => ({
    ejeId,
    total: v.total,
    correctas: v.correctas,
    pctLogro: v.totalPuntos === 0 ? 0 : redondear((v.puntos / v.totalPuntos) * 100),
  }));

  // El punto débil es el eje con menor precisión entre los que tienen datos.
  const conDatos = porEje.filter((e) => e.total > 0);
  const masBajo = conDatos.length > 0
    ? conDatos.reduce((min, e) => (e.pctLogro < min.pctLogro ? e : min))
    : null;

  return {
    correctas,
    incorrectas,
    omitidas,
    total,
    pctLogro,
    puntaje,
    porEje,
    segundosTotales,
    segundosPromedioPregunta: total === 0 ? 0 : Math.round(segundosTotales / total),
    ejeDebil: masBajo ? { ejeId: masBajo.ejeId, precision: masBajo.pctLogro } : null,
    puntosObtenidos: redondear(puntosObtenidos),
    puntosTotales: redondear(puntosTotales),
  };
}

export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
