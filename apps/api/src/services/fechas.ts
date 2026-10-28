/** Fecha en formato YYYY-MM-DD usando la zona horaria local del servidor. */
export function aFechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Suma días a una fecha ISO sin mutar el original. */
export function sumarDias(iso: string, dias: number): string {
  const f = new Date(`${iso}T12:00:00`);
  f.setDate(f.getDate() + dias);
  return aFechaISO(f);
}

/** Días completos entre dos fechas ISO (b - a). */
export function diasEntre(desde: string, hasta: string): number {
  const a = new Date(`${desde}T12:00:00`);
  const b = new Date(`${hasta}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface EstadoRacha {
  rachaActual: number;
  rachaMaxima: number;
  ultimaActividad: string | null;
  completoHoy: boolean;
}

/**
 * Calcula la racha a partir del último día de actividad.
 * Se incrementa una vez al día al completar cualquier actividad; si pasa un
 * día completo sin actividad, la racha se reinicia a 0.
 *
 * `hoy` se inyecta para que los tests sean deterministas.
 */
export function calcularRacha(
  ultimaActividad: string | null,
  rachaMaxima: number,
  hoy: string,
): EstadoRacha {
  if (ultimaActividad === null) {
    return { rachaActual: 0, rachaMaxima, ultimaActividad: null, completoHoy: false };
  }

  const dias = diasEntre(ultimaActividad, hoy);

  if (dias === 0) {
    return { rachaActual: 0, rachaMaxima, ultimaActividad, completoHoy: true };
  }

  // Actividad ayer: la racha sigue viva y queda pendiente de contar hoy.
  if (dias === 1) {
    return { rachaActual: 1, rachaMaxima, ultimaActividad, completoHoy: false };
  }

  // Más de un día sin actividad: racha perdida.
  return { rachaActual: 0, rachaMaxima, ultimaActividad, completoHoy: false };
}

/**
 * Registra la actividad de hoy y devuelve la racha ya actualizada.
 *
 * Semántica: la racha cuenta días consecutivos con actividad, incluido hoy.
 * `rachaActual` es el valor guardado antes de esta llamada.
 *
 *   - Sin actividad previa  -> racha 1.
 *   - Última actividad hoy  -> no se acumula de nuevo (mismo día).
 *   - Última actividad ayer -> racha + 1.
 *   - Más de un día vacío   -> la racha se reinicia en 1.
 */
export function registrarActividad(
  rachaActual: number,
  rachaMaxima: number,
  ultimaActividad: string | null,
  hoy: string,
): EstadoRacha {
  const dias = ultimaActividad === null ? null : diasEntre(ultimaActividad, hoy);

  if (dias === 0) {
    // Ya se contó hoy: devolver el valor almacenado sin incrementarlo.
    const mantenida = Math.max(1, rachaActual);
    return {
      rachaActual: mantenida,
      rachaMaxima: Math.max(rachaMaxima, mantenida),
      ultimaActividad,
      completoHoy: true,
    };
  }

  // Sin actividad previa, o con al menos un día vacío en medio:
  // la racha comienza de nuevo hoy.
  const nuevaRacha = dias === 1 ? rachaActual + 1 : 1;

  return {
    rachaActual: nuevaRacha,
    rachaMaxima: Math.max(rachaMaxima, nuevaRacha),
    ultimaActividad: hoy,
    completoHoy: true,
  };
}

/** Puntos de racha: 100 por día, tope 500 al llegar a 5 días. */
export function puntosRacha(racha: number): number {
  if (racha <= 0) return 0;
  if (racha >= 5) return 500;
  return racha * 100;
}

/**
 * Recalcula la racha desde el historial completo de días con actividad.
 *
 * `calcularRacha` trabaja con el valor ya guardado y sirve para el camino
 * caliente de una sola actividad; este recalcula desde cero y por eso también
 * obtiene la máxima histórica. Lo usa el seed para materializar `racha_actual`
 * y `racha_maxima` a partir de los intentos demo.
 *
 * Reglas: cuenta días consecutivos, un salto de más de un día corta la
 * corrida, y la racha actual solo sobrevive si el último día fue hoy o ayer.
 */
export function rachaDesdeFechas(
  fechas: (string | null)[],
  hoy: string,
): { rachaActual: number; rachaMaxima: number; ultimaActividad: string | null } {
  const unicas = [...new Set(fechas.filter((f): f is string => f !== null))].sort();
  const ultimaActividad = unicas.at(-1) ?? null;

  if (unicas.length === 0) {
    return { rachaActual: 0, rachaMaxima: 0, ultimaActividad: null };
  }

  let corrida = 0;
  let rachaMaxima = 0;
  let previa: string | null = null;

  for (const f of unicas) {
    corrida = previa !== null && diasEntre(previa, f) === 1 ? corrida + 1 : 1;
    previa = f;
    if (corrida > rachaMaxima) rachaMaxima = corrida;
  }

  const rachaActual = diasEntre(ultimaActividad!, hoy) <= 1 ? corrida : 0;
  return { rachaActual, rachaMaxima, ultimaActividad };
}
