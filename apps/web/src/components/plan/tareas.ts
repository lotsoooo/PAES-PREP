import type { DTOTareaPlan } from '@paes-pro/shared';

/** A dónde lleva la tarea: la lección, el ensayo o el cuaderno de errores. */
export function destinoTarea(t: DTOTareaPlan): string | null {
  if (t.contenido) return `/app/contenidos/${t.contenido.slug}`;
  if (t.ensayo) return `/app/ensayos/${t.ensayo.slug}`;
  if (t.tipo === 'repaso') return '/app/repaso';
  if (t.tipo === 'ensayo') return '/app/ensayos';
  return null;
}
