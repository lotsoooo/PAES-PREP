import { BRAND_NAME } from '@paes-pro/shared';

export { BRAND_NAME };

export const BRAND_TAGLINE = 'Prepárate para la PAES con método';
export const CORREO_SOPORTE = 'hola@paespro.cl';

/** Solo se configura un proceso después de verificar su calendario oficial.
 * Los valores vacíos evitan inventar fechas a partir del mes actual.
 */
export const PROCESO_ADMISION: { anio: number | null; fechaPaes: string | null; fuente: string | null } = {
  anio: null,
  fechaPaes: null,
  fuente: null,
};

export function anioAdmision(): number | string {
  return PROCESO_ADMISION.anio ?? 'por confirmar';
}

export function fechaPaesConfigurada(): string | null {
  return PROCESO_ADMISION.fuente ? PROCESO_ADMISION.fechaPaes : null;
}

/** Días civiles en Chile, sin asumir que todos duran 24 horas (cambio de hora). */
export function diasHasta(fecha: string, hoy: Date = new Date()): number {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(hoy);
  const parte = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const objetivo = Date.UTC(anio!, mes! - 1, dia!);
  const inicio = Date.UTC(parte('year'), parte('month') - 1, parte('day'));
  return Number.isFinite(objetivo) ? Math.max(0, Math.round((objetivo - inicio) / 86_400_000)) : 0;
}
