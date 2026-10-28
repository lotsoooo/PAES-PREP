/**
 * Utilidades puras de calendario y desbloqueo (sin acceso a la base de datos,
 * para poder probarlas sin conexión).
 */
import type { DTOLeccionUnidad } from '@paes-pro/shared';

type EstadoLeccion = DTOLeccionUnidad['estado'];

/** Lunes y domingo (YYYY-MM-DD) de la semana de `fecha`. */
export function semanaDe(fecha: string): { desde: string; hasta: string } {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = (d.getUTCDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(d.getTime() - dia * 86_400_000);
  const domingo = new Date(lunes.getTime() + 6 * 86_400_000);
  return { desde: lunes.toISOString().slice(0, 10), hasta: domingo.toISOString().slice(0, 10) };
}

/** Estado de cada lección: la N+1 se desbloquea al completar la N. */
export function estadosLecciones(
  lecciones: { slug: string; completado: boolean | null }[],
  slugActual: string,
): EstadoLeccion[] {
  return lecciones.map((l, i) => {
    if (l.completado) return 'completada';
    const desbloqueada = i === 0 || Boolean(lecciones[i - 1]!.completado);
    if (!desbloqueada) return 'bloqueada';
    return l.slug === slugActual ? 'actual' : 'disponible';
  });
}

