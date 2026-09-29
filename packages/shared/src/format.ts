/**
 * Formateo es-CL compartido para que API y web muestren los mismos números.
 */

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });

/** $14.990 — sin decimales, como corresponde al peso chileno. */
export function formatearCLP(valor: number): string {
  return clp.format(valor);
}

export function formatearNumero(valor: number): string {
  return decimal.format(valor);
}

/** "Hace 10 min", "Hace 2 h", "Hace 3 días" — relativo en español. */
export function tiempoRelativo(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso);
  const segundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);

  if (segundos < 45) return 'Hace instantes';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 30) return `Hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  return `Hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
}

/** "12 de marzo de 2026" */
export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "12 mar" — para ejes de gráficos. */
export function formatearFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/** "01:29:58" — para el temporizador de ensayos. */
export function formatearCronometro(segundosTotales: number): string {
  const s = Math.max(0, Math.floor(segundosTotales));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(seg)}` : `${pad(m)}:${pad(seg)}`;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** 0 = lunes … 6 = domingo (igual que getDay() pero desplazado). */
export function indiceDiaSemana(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

export function nombreDia(indice: number): string {
  return DIAS_SEMANA[indice] ?? '';
}

export function nombreDiaCorto(indice: number): string {
  return DIAS_CORTOS[indice] ?? '';
}

/** Etiqueta qualitative de precisión por eje (Estadísticas). */
export function etiquetaPrecision(precision: number):
  | 'fuerte'
  | 'por_buen_camino'
  | 'promedio'
  | 'necesita_repaso' {
  if (precision >= 80) return 'fuerte';
  if (precision >= 65) return 'por_buen_camino';
  if (precision >= 50) return 'promedio';
  return 'necesita_repaso';
}

export const ETIQUETA_PRECISION: Record<
  'fuerte' | 'por_buen_camino' | 'promedio' | 'necesita_repaso',
  string
> = {
  fuerte: 'Fuerte',
  por_buen_camino: 'Por buen camino',
  promedio: 'Promedio',
  necesita_repaso: 'Necesita repaso',
};
