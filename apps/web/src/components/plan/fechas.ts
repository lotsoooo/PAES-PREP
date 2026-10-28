/** Fechas del plan en hora local (YYYY-MM-DD), semana de lunes a domingo. */

export function aISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function desdeISO(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function hoyISO(): string {
  return aISO(new Date());
}

export function sumarDias(iso: string, dias: number): string {
  const d = desdeISO(iso);
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

/** Lunes de la semana de `iso`. */
export function lunesDe(iso: string): string {
  const d = desdeISO(iso);
  const dia = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dia);
  return aISO(d);
}

export function diasDeSemana(lunes: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** "27 oct – 2 nov" */
export function rangoSemana(lunes: string): string {
  const f = (iso: string) => desdeISO(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  return `${f(lunes)} – ${f(sumarDias(lunes, 6))}`;
}

/** "martes 28 de octubre" */
export function fechaLarga(iso: string): string {
  return desdeISO(iso).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatearDuracion(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
