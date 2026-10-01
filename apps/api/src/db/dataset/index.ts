import type { PreguntaSeed } from './tipos';
import { esPreguntaValida } from './tipos';
import { PREGUNTAS_M1 } from './matematicas';
import { PREGUNTAS_M2 } from './matematicas2';
import { PREGUNTAS_CL } from './lenguaje';
import { PREGUNTAS_BIO } from './biologia';
import { PREGUNTAS_FIS } from './fisica';
import { PREGUNTAS_QUI } from './quimica';
import { PREGUNTAS_HIST } from './historia';

export const PREGUNTAS: PreguntaSeed[] = [
  ...PREGUNTAS_M1,
  ...PREGUNTAS_M2,
  ...PREGUNTAS_CL,
  ...PREGUNTAS_BIO,
  ...PREGUNTAS_FIS,
  ...PREGUNTAS_QUI,
  ...PREGUNTAS_HIST,
];

/** Materias que deben quedar cubiertas por al menos un ítem. */
export const MATERIAS_CUBIERTAS = ['M1', 'M2', 'CL', 'BIO', 'FIS', 'QUI', 'HIST'] as const;

/**
 * Falla temprano si el banco tiene ítems inválidos, claves duplicadas,
 * difficulty fuera de rango o materias sin cobertura.
 * Se invoca desde `db:seed` antes de escribir en la base.
 */
export function validarDataset(preguntas: PreguntaSeed[] = PREGUNTAS): void {
  const errores: string[] = [];
  const claves = new Set<string>();

  for (const p of preguntas) {
    if (!esPreguntaValida(p)) {
      errores.push(`Item invalido: ${String((p as { clave?: unknown })?.clave)}`);
      continue;
    }
    if (claves.has(p.clave)) errores.push(`Clave duplicada: ${p.clave}`);
    claves.add(p.clave);
  }

  for (const materia of MATERIAS_CUBIERTAS) {
    const ejes = new Set(preguntas.filter((p) => p.materia === materia).map((p) => p.eje));
    for (const eje of ['A', 'B', 'C', 'D']) {
      if (!ejes.has(eje)) errores.push(`Sin cobertura: ${materia}-${eje}`);
    }
  }

  if (errores.length > 0) {
    throw new Error(`Dataset de preguntas invalido:\n- ${errores.join('\n- ')}`);
  }
}
