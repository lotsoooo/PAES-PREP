/** Utilidades de formato y constantes de los ensayos (sin componentes). */

/** La PAES vigente usa 4 alternativas (D-019); E queda por si un ensayo trae 5. */
export const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;

/** 140 → "2 h 20 min"; 45 → "45 min". */
export function formatoDuracion(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** 135 → "2 min 15 s"; 40 → "40 s". */
export function formatoSegundos(s: number): string {
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const seg = total % 60;
  if (m === 0) return `${seg} s`;
  return seg === 0 ? `${m} min` : `${m} min ${seg} s`;
}

/** 8130 → "2 h 15 min 30 s" para el tiempo total. */
export function formatoTiempoLargo(s: number): string {
  const h = Math.floor(s / 3600);
  const resto = s - h * 3600;
  return h > 0 ? `${h} h ${formatoSegundos(resto)}` : formatoSegundos(resto);
}

export const ATAJOS_EXAMEN = [
  { teclas: ['A', 'B', 'C', 'D'], texto: 'Elegir alternativa (también 1–4)' },
  { teclas: ['←', '→'], texto: 'Pregunta anterior o siguiente' },
  { teclas: ['M'], texto: 'Marcar para revisar' },
  { teclas: ['G'], texto: 'Abrir el navegador de preguntas' },
];
