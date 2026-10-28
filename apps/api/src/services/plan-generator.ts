import { sumarDias } from './fechas.js';

export interface RestriccionesGenerador {
  /** Contenidos disponibles para enlazar tareas de tipo lección. */
  contenidosDisponibles: { materiaCodigo: string; titulo: string; id: string }[];
  ensayosDisponibles: { materiaCodigo: string; titulo: string; id: string; premium: boolean }[];
}

export interface DistribucionCalculada {
  materiaCodigo: string;
  porcentaje: number;
  horasSemana: number;
}

export interface TareaGenerada {
  titulo: string;
  descripcion: string;
  tipo: 'contenido' | 'ensayo' | 'repaso' | 'teoria';
  contenidoId: string | null;
  ensayoId: string | null;
  materiaCodigo: string | null;
  fechaPlanificada: string;
  duracionMin: number;
}

/**
 * Distribuciones por carrera, en la forma { materia: porcentaje }.
 * De ahí sale el reparto semanal: horasSemana * porcentaje.
 */
export const DISTRIBUCIONES_POR_AREA: Record<string, Record<string, number>> = {
  Salud: { M1: 40, BIO: 35, CL: 25 },
  Humanidades: { CL: 45, HIST: 35, M1: 20 },
  Economia: { M1: 45, CL: 30, HIST: 25 },
  Tecnologia: { M1: 55, CL: 25, BIO: 20 },
  Diseño: { HIST: 40, CL: 40, M1: 20 },
};

export const DISTRIBUCION_POR_DEFECTO: Record<string, number> = {
  M1: 40,
  CL: 35,
  BIO: 25,
};

/**
 * Calcula la distribución por prueba a partir del área de la carrera.
 * Filtra a las materias realmente disponibles y renormaliza para que sume 100.
 */
export function calcularDistribucion(
  areaCarrera: string | null,
  codigosDisponibles: string[],
): DistribucionCalculada[] {
  const disponibles = new Set(codigosDisponibles);
  const base = distribucionBaseDeArea(areaCarrera);

  const filtrada = Object.entries(base).filter(([codigo]) => disponibles.has(codigo));

  // Si el filtro dejó nada (materias inesperadas), reparto equitativo.
  const efectiva: [string, number][] =
    filtrada.length > 0
      ? filtrada
      : [...disponibles].map((c) => [c, 1] as [string, number]);

  const suma = efectiva.reduce((acc, [, p]) => acc + p, 0);
  if (suma === 0) return [];

  return efectiva.map(([materiaCodigo, p]) => ({
    materiaCodigo,
    porcentaje: redondear((p / suma) * 100),
    horasSemana: 0,
  }));
}

/** Quita tildes y pasa a minúsculas para comparar nombres de área. */
function normalizarArea(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Distribución base por área de la carrera. El catálogo guarda las áreas con
 * tilde ("Economía", "Tecnología") y la tabla sin ella: se comparan normalizadas.
 */
export function distribucionBaseDeArea(areaCarrera: string | null): Record<string, number> {
  if (!areaCarrera) return DISTRIBUCION_POR_DEFECTO;
  const buscada = normalizarArea(areaCarrera);
  const clave = Object.keys(DISTRIBUCIONES_POR_AREA).find((k) => normalizarArea(k) === buscada);
  return clave ? DISTRIBUCIONES_POR_AREA[clave]! : DISTRIBUCION_POR_DEFECTO;
}

/** Materia que representa a cada prueba PAES en el plan. */
const MATERIAS_DE_PRUEBA: Record<string, string[]> = {
  M1: ['M1'],
  M2: ['M2'],
  CL: ['CL'],
  HISTORIA: ['HIST'],
  CIENCIAS: ['BIO', 'FIS', 'QUI'],
};

/** Peso que recibe una prueba elegida que la carrera no pondera. */
const PESO_MINIMO_PRUEBA = 15;

/** Brecha (puntos PAES) desde la que el factor deja de crecer. */
const BRECHA_TOPE = 400;

/**
 * Factor de prioridad según la brecha meta − puntaje actual de una prueba:
 * 0,5 si ya alcanzó la meta, 1,5 con la brecha tope o sin datos (se asume la
 * brecha completa), lineal entre medio.
 */
export function factorBrecha(brecha: number | null): number {
  if (brecha === null) return 1.5;
  if (brecha <= 0) return 0.5;
  return 0.5 + Math.min(brecha, BRECHA_TOPE) / BRECHA_TOPE;
}

/**
 * Distribución por prueba: peso de la prueba para la carrera × brecha entre la
 * meta y el puntaje actual estimado de esa prueba. Las pruebas que el usuario
 * eligió entran aunque la carrera no las pondere (con un peso mínimo); sin
 * pruebas elegidas se usan las de la carrera.
 *
 * @param brechaPorMateria meta − puntaje actual por código de materia; null o
 *   ausente = sin intentos (se asume la brecha completa).
 */
export function calcularDistribucionPorBrecha(opciones: {
  areaCarrera: string | null;
  codigosDisponibles: string[];
  pruebasObjetivo: string[];
  brechaPorMateria: Record<string, number | null>;
}): DistribucionCalculada[] {
  const disponibles = new Set(opciones.codigosDisponibles);
  const base = distribucionBaseDeArea(opciones.areaCarrera);

  const pesos = new Map<string, number>();
  if (opciones.pruebasObjetivo.length > 0) {
    for (const prueba of opciones.pruebasObjetivo) {
      const candidatas = (MATERIAS_DE_PRUEBA[prueba] ?? []).filter((c) => disponibles.has(c));
      if (candidatas.length === 0) continue;
      // Ciencias: la materia que pondera la carrera; si ninguna, la primera disponible.
      const elegida = candidatas.find((c) => base[c] !== undefined) ?? candidatas[0]!;
      pesos.set(elegida, base[elegida] ?? PESO_MINIMO_PRUEBA);
    }
  }
  if (pesos.size === 0) {
    for (const [codigo, peso] of Object.entries(base)) {
      if (disponibles.has(codigo)) pesos.set(codigo, peso);
    }
  }
  if (pesos.size === 0) {
    return calcularDistribucion(opciones.areaCarrera, opciones.codigosDisponibles);
  }

  const ponderados = [...pesos.entries()].map(
    ([codigo, peso]) => [codigo, peso * factorBrecha(opciones.brechaPorMateria[codigo] ?? null)] as const,
  );
  const suma = ponderados.reduce((acc, [, p]) => acc + p, 0);

  const resultado = ponderados.map(([materiaCodigo, p]) => ({
    materiaCodigo,
    porcentaje: redondear((p / suma) * 100),
    horasSemana: 0,
  }));
  // Ajuste de redondeo para que sume exactamente 100.
  const diferencia = redondear(100 - resultado.reduce((a, d) => a + d.porcentaje, 0));
  if (diferencia !== 0 && resultado.length > 0) {
    const mayor = resultado.reduce((m, d) => (d.porcentaje > m.porcentaje ? d : m));
    mayor.porcentaje = redondear(mayor.porcentaje + diferencia);
  }
  return resultado.sort((a, b) => b.porcentaje - a.porcentaje);
}

/** Reparte las horas semanales; la suma cuadra exactamente con horasSemana. */
export function repartirHoras(
  distribucion: DistribucionCalculada[],
  horasSemana: number,
): DistribucionCalculada[] {
  let acumulado = 0;
  return distribucion.map((d, i) => {
    const esUltimo = i === distribucion.length - 1;
    const horas = esUltimo
      ? Number((horasSemana - acumulado).toFixed(2))
      : Number(((d.porcentaje / 100) * horasSemana).toFixed(2));
    acumulado = Number((acumulado + horas).toFixed(2));
    return { ...d, horasSemana: horas };
  });
}

function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/** Día de la semana (0 = domingo) de una fecha ISO. */
function diaSemanaDe(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay();
}

/**
 * Reparte `total` sesiones entre las materias según su porcentaje.
 *
 * Usa el método de los mayores residuos: cada materia recibe su parte entera
 * y los sobrantes van a las de mayor parte decimal, de modo que el reparto real
 * se aproxima al teórico sin acumular error. Luego intercala las sesiones para
 * no agrupar todas las de una misma materia en días consecutivos.
 */
export function repartirPorPorcentaje(
  distribucion: DistribucionCalculada[],
  total: number,
): (DistribucionCalculada | null)[] {
  if (total === 0) return [];
  if (distribucion.length === 0) return new Array<null>(total).fill(null);

  const base = distribucion.map((d) => Math.floor((d.porcentaje / 100) * total));
  const asignadas = base.reduce((a, b) => a + b, 0);

  const porResiduo = distribucion
    .map((d, i) => ({ i, residuo: (d.porcentaje / 100) * total - base[i]! }))
    .sort((a, b) => b.residuo - a.residuo);

  const sobrantes = total - asignadas;
  for (let n = 0; n < sobrantes; n++) {
    base[porResiduo[n % porResiduo.length]!.i]! += 1;
  }

  // Bolsa de sesiones, luego intercalado de dos en dos.
  const bolsa: DistribucionCalculada[] = [];
  distribucion.forEach((d, i) => {
    for (let n = 0; n < base[i]!; n++) bolsa.push(d);
  });

  const intercalada: DistribucionCalculada[] = [];
  while (bolsa.length > 0) {
    intercalada.push(bolsa.shift()!);
    if (bolsa.length > 0) bolsa.push(bolsa.shift()!);
  }

  return intercalada;
}

/**
 * Genera las tareas de las próximas `semanas`.
 *
 * - Solo crea tareas en los días realmente disponibles (`diasDisponibles`),
 *   respetando el calendario: no inventa sesiones los días no marcados.
 * - Reparte las sesiones según la distribución por prueba, en proporción real
 *   al porcentaje configurado, e intercalando materias.
 * - Alterna lecciones y ensayos: el ensayo aparece aproximadamente cada 4
 *   sesiones de la misma prueba, y solo si existe uno para ella.
 * - El fin de semana se usa para repasos cuando ya hubo varias sesiones.
 */
export function generarTareas(opciones: {
  hoy: string;
  semanas: number;
  diasDisponibles: number[];
  distribucion: DistribucionCalculada[];
  restricciones: RestriccionesGenerador;
}): TareaGenerada[] {
  const { hoy, semanas, distribucion, restricciones } = opciones;

  if (semanas <= 0) return [];

  const dias = [...new Set(opciones.diasDisponibles)].filter((d) => d >= 0 && d <= 6);
  const diasEfectivos = dias.length > 0 ? dias : [1, 3, 5];

  // Fechas reales dentro del horizonte, en orden cronológico.
  const slots: { fecha: string; diaSemana: number }[] = [];
  for (let offset = 0; offset < semanas * 7; offset++) {
    const fecha = sumarDias(hoy, offset);
    const diaSemana = diaSemanaDe(fecha);
    if (diasEfectivos.includes(diaSemana)) slots.push({ fecha, diaSemana });
  }

  if (slots.length === 0) return [];

  const secuencia = repartirPorPorcentaje(distribucion, slots.length);
  const usadosPorMateria = new Map<string, number>();
  const indiceContenido = new Map<string, number>();

  return slots.map((slot, i) => {
    const materia = secuencia[i] ?? null;
    const codigo = materia?.materiaCodigo ?? null;
    const etiqueta = codigo ?? 'la materia';

    const usados = usadosPorMateria.get(codigo ?? '') ?? 0;
    usadosPorMateria.set(codigo ?? '', usados + 1);

    // Duración: horas semanales de la materia divididas entre sus sesiones
    // semanales, acotadas a un rango usable de 25 a 90 minutos.
    const sesionesPorDia = Math.max(
      1,
      slots.filter((s) => s.diaSemana === slot.diaSemana).length,
    );
    const horasPorSesion = ((materia?.horasSemana ?? 0) * 60) / sesionesPorDia;
    const duracion = Math.max(25, Math.min(90, Math.round(horasPorSesion) || 45));

    // Fin de semana: carga liviana, y repaso si ya hubo varias sesiones.
    if (slot.diaSemana >= 5 && usados >= 2) {
      return {
        titulo: `Repaso de ${etiqueta}`,
        descripcion:
          'Repasa los errores del ensayo de la semana y vuelve a intentar las preguntas falladas.',
        tipo: 'repaso' as const,
        contenidoId: null,
        ensayoId: null,
        materiaCodigo: codigo,
        fechaPlanificada: slot.fecha,
        duracionMin: Math.min(duracion, 45),
      };
    }

    // Un ensayo por cada ~4 sesiones de la misma prueba, si existe.
    const ensayos = restricciones.ensayosDisponibles.filter((e) => e.materiaCodigo === codigo);
    if (ensayos.length > 0 && usados % 4 === 3) {
      const ensayo = ensayos[usados % ensayos.length]!;
      return {
        titulo: ensayo.titulo,
        descripcion: `Ensayo cronometrado de ${etiqueta}.`,
        tipo: 'ensayo' as const,
        contenidoId: null,
        ensayoId: ensayo.id,
        materiaCodigo: codigo,
        fechaPlanificada: slot.fecha,
        duracionMin: Math.min(duracion, 90),
      };
    }

    // Lecciones de esa prueba, avançando una por sesión para no repetir siempre
    // la primera.
    const contenidos = restricciones.contenidosDisponibles.filter(
      (c) => c.materiaCodigo === codigo,
    );
    if (contenidos.length > 0) {
      const cursor = indiceContenido.get(codigo ?? '') ?? 0;
      indiceContenido.set(codigo ?? '', cursor + 1);
      const contenido = contenidos[cursor % contenidos.length]!;
      return {
        titulo: contenido.titulo,
        descripcion: `Lección de ${etiqueta}.`,
        tipo: 'contenido' as const,
        contenidoId: contenido.id,
        ensayoId: null,
        materiaCodigo: codigo,
        fechaPlanificada: slot.fecha,
        duracionMin: duracion,
      };
    }

    return {
      titulo: `Refuerzo de ${etiqueta}`,
      descripcion: 'Sesión de práctica enfocada en los puntos débiles.',
      tipo: 'teoria' as const,
      contenidoId: null,
      ensayoId: null,
      materiaCodigo: codigo,
      fechaPlanificada: slot.fecha,
      duracionMin: duracion,
    };
  });
}
