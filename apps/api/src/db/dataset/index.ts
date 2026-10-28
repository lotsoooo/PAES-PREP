import type { PreguntaSeed } from './tipos';
import { esPreguntaValida } from './tipos';
import { PREGUNTAS_M1 } from './matematicas';
import { BANCO_M1, clavesBancoM1, verificarBancoM1 } from './m1-banco';
import { PREGUNTAS_M2 } from './matematicas2';
import { PREGUNTAS_CL } from './lenguaje';
import { PREGUNTAS_BIO } from './biologia';
import { PREGUNTAS_FIS } from './fisica';
import { PREGUNTAS_QUI } from './quimica';
import { PREGUNTAS_HIST } from './historia';

export const PREGUNTAS: PreguntaSeed[] = [
  ...PREGUNTAS_M1,
  ...BANCO_M1,
  ...PREGUNTAS_M2,
  ...PREGUNTAS_CL,
  ...PREGUNTAS_BIO,
  ...PREGUNTAS_FIS,
  ...PREGUNTAS_QUI,
  ...PREGUNTAS_HIST,
];

/** Materias que deben quedar cubiertas por al menos un ítem en cada eje. */
export const MATERIAS_CUBIERTAS = ['M1', 'M2', 'CL', 'BIO', 'FIS', 'QUI', 'HIST'] as const;

const claves = (lista: PreguntaSeed[]) => lista.map((p) => p.clave);

/**
 * Configuración de cada ensayo: qué ítems lleva (en orden), su duración y si
 * es Premium. Los ensayos existen en `database/seed.sql`; el seed actualiza
 * estos campos y reemplaza su lista de preguntas.
 */
export interface EnsayoSeed {
  slug: string;
  titulo: string;
  descripcion: string;
  duracionMin: number;
  premium: boolean;
  nivel: 'basico' | 'medio' | 'avanzado';
  esDiagnostico: boolean;
  preguntas: string[];
  /** Peso por código de eje (suman 100). Si falta, se reparte parejo. */
  pesosEje?: Record<string, number>;
}

const PESOS_M1 = { A: 21, B: 34, C: 21, D: 24 };

export const ENSAYOS_SEED: EnsayoSeed[] = [
  {
    slug: 'ensayo-m1-Completo',
    titulo: 'Ensayo M1 — Prueba completa',
    descripcion:
      '65 preguntas con la distribución real de la PAES de Competencia Matemática 1: números, álgebra y funciones, geometría, y probabilidad y estadística.',
    duracionMin: 140,
    premium: true,
    nivel: 'avanzado',
    esDiagnostico: false,
    preguntas: clavesBancoM1(),
    pesosEje: PESOS_M1,
  },
  {
    slug: 'ensayo-diagnostico-m1',
    titulo: 'Ensayo de diagnóstico M1',
    descripcion:
      'Treinta preguntas de los cuatro ejes de M1 para conocer tu punto de partida. Es gratis y tu resultado ajusta tu plan de estudio.',
    duracionMin: 75,
    premium: false,
    nivel: 'medio',
    esDiagnostico: true,
    preguntas: [
      ...clavesBancoM1('A').slice(0, 6),
      ...clavesBancoM1('B').slice(0, 10),
      ...clavesBancoM1('C').slice(0, 7),
      ...clavesBancoM1('D').slice(0, 7),
    ],
    pesosEje: PESOS_M1,
  },
  {
    slug: 'ensayo-m1-algebra',
    titulo: 'Ensayo M1 — Álgebra y funciones',
    descripcion: 'Ecuaciones, sistemas, funciones, inecuaciones y factorización.',
    duracionMin: 40,
    premium: false,
    nivel: 'basico',
    esDiagnostico: false,
    preguntas: ['M1-B-1', 'M1-B-2', ...clavesBancoM1('B').slice(10)],
    pesosEje: { B: 100 },
  },
  {
    slug: 'ensayo-m1-probabilidad',
    titulo: 'Ensayo M1 — Probabilidad y estadística',
    descripcion: 'Medidas de tendencia central, conteo y probabilidades, con preguntas de dificultad creciente.',
    duracionMin: 45,
    premium: true,
    nivel: 'avanzado',
    esDiagnostico: false,
    preguntas: ['M1-D-1', 'M1-D-2', ...clavesBancoM1('D')],
    pesosEje: { D: 100 },
  },
  {
    slug: 'ensayo-m2-completo',
    titulo: 'Ensayo M2 — Prueba completa',
    descripcion: 'Funciones exponenciales y logarítmicas, geometría analítica, probabilidades y matemática financiera.',
    duracionMin: 35,
    premium: true,
    nivel: 'avanzado',
    esDiagnostico: false,
    preguntas: claves(PREGUNTAS_M2),
  },
  {
    slug: 'ensayo-cl-comprension',
    titulo: 'Ensayo de Competencia Lectora',
    descripcion: 'Tres textos (argumentativo, expositivo y literario) con preguntas de localizar, interpretar, evaluar y vocabulario.',
    duracionMin: 35,
    premium: false,
    nivel: 'medio',
    esDiagnostico: false,
    preguntas: claves(PREGUNTAS_CL),
  },
  {
    slug: 'ensayo-ciencias-completo',
    titulo: 'Ensayo de Ciencias — Biología, Física y Química',
    descripcion: 'Veinticuatro preguntas del módulo común de Ciencias: célula, genética, mecánica, ondas, estequiometría y más.',
    duracionMin: 60,
    premium: true,
    nivel: 'avanzado',
    esDiagnostico: false,
    preguntas: [...claves(PREGUNTAS_BIO), ...claves(PREGUNTAS_FIS), ...claves(PREGUNTAS_QUI)],
  },
  {
    slug: 'ensayo-historia-completo',
    titulo: 'Ensayo de Historia y Ciencias Sociales',
    descripcion: 'Historia de Chile, historia universal, formación ciudadana y sistema económico.',
    duracionMin: 35,
    premium: false,
    nivel: 'medio',
    esDiagnostico: false,
    preguntas: claves(PREGUNTAS_HIST),
  },
];

/**
 * Falla temprano si el banco tiene ítems inválidos, claves duplicadas,
 * materias sin cobertura, ensayos con claves inexistentes o con menos de 10
 * preguntas. Se invoca desde `db:seed` antes de escribir en la base.
 */
export function validarDataset(preguntas: PreguntaSeed[] = PREGUNTAS): void {
  const errores: string[] = [];
  const vistas = new Set<string>();

  for (const p of preguntas) {
    if (!esPreguntaValida(p)) {
      errores.push(`Ítem inválido: ${String((p as { clave?: unknown })?.clave)}`);
      continue;
    }
    if (vistas.has(p.clave)) errores.push(`Clave duplicada: ${p.clave}`);
    vistas.add(p.clave);
    if (!p.errorComun) errores.push(`Sin error común: ${p.clave}`);
    if (!/^1\. /.test(p.explicacion)) errores.push(`Explicación sin pasos numerados: ${p.clave}`);
    if (new Set(p.alternativas.map((a) => a.texto)).size !== p.alternativas.length) {
      errores.push(`Alternativas repetidas: ${p.clave}`);
    }
  }

  for (const materia of MATERIAS_CUBIERTAS) {
    const ejes = new Set(preguntas.filter((p) => p.materia === materia).map((p) => p.eje));
    for (const eje of ['A', 'B', 'C', 'D']) {
      if (!ejes.has(eje)) errores.push(`Sin cobertura: ${materia}-${eje}`);
    }
  }

  for (const e of ENSAYOS_SEED) {
    if (e.preguntas.length < 10) errores.push(`El ensayo ${e.slug} tiene menos de 10 preguntas`);
    if (new Set(e.preguntas).size !== e.preguntas.length) errores.push(`Preguntas repetidas en ${e.slug}`);
    for (const c of e.preguntas) if (!vistas.has(c)) errores.push(`${e.slug}: clave inexistente ${c}`);
  }

  try {
    verificarBancoM1();
  } catch (error) {
    errores.push((error as Error).message);
  }

  if (errores.length > 0) {
    throw new Error(`Dataset de preguntas inválido:\n- ${errores.join('\n- ')}`);
  }
}
