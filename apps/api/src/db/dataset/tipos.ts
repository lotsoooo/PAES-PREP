/**
 * Tipos del banco de preguntas demo.
 *
 * Cada pregunta declara una `clave` estable; el seed deriva de ella el UUID,
 * de modo que `db:seed` sea idempotente sin agregar columnas al esquema.
 */

export interface AlternativaSeed {
  texto: string;
  esCorrecta: boolean;
}

export interface PreguntaSeed {
  /** Clave lógica del ítem. No se persiste. */
  clave: string;
  /** Código de materia: M1, M2, CL, BIO, FIS, QUI, HIST. */
  materia: string;
  /** Código de eje dentro de la materia: A, B, C o D. */
  eje: string;
  tipo: 'multiple' | 'comprension_lectora';
  enunciado: string;
  /** Solo en comprensión lectora. */
  textoBase?: string;
  explicacion: string;
  dificultad: 1 | 2 | 3 | 4 | 5;
  alternativas: [AlternativaSeed, AlternativaSeed, AlternativaSeed, AlternativaSeed];
}

/** Valida el shape de una pregunta en tiempo de desarrollo. */
export function esPreguntaValida(p: unknown): p is PreguntaSeed {
  if (typeof p !== 'object' || p === null) return false;
  const q = p as Record<string, unknown>;
  if (typeof q.clave !== 'string' || q.clave.length === 0) return false;
  if (typeof q.materia !== 'string' || typeof q.eje !== 'string') return false;
  if (q.tipo !== 'multiple' && q.tipo !== 'comprension_lectora') return false;
  if (typeof q.enunciado !== 'string' || q.enunciado.length === 0) return false;
  if (typeof q.explicacion !== 'string' || q.explicacion.length === 0) return false;
  if (q.tipo === 'comprension_lectora' && typeof q.textoBase !== 'string') return false;
  if (typeof q.dificultad !== 'number' || q.dificultad < 1 || q.dificultad > 5) return false;
  if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4) return false;

  const alts = q.alternativas as AlternativaSeed[];
  if (alts.some((a) => typeof a.texto !== 'string' || a.texto.length === 0)) return false;
  return alts.filter((a) => a.esCorrecta === true).length === 1;
}
