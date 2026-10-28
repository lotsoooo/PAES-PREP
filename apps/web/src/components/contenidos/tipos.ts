import type { DTOContenido } from '@paes-pro/shared';

export const TIPO_CONTENIDO: Record<string, { etiqueta: string; icono: string }> = {
  video: { etiqueta: 'Video', icono: 'play_circle' },
  pdf: { etiqueta: 'Guía PDF', icono: 'picture_as_pdf' },
  mixto: { etiqueta: 'Lección', icono: 'auto_stories' },
  practica: { etiqueta: 'Práctica', icono: 'quiz' },
};

/** Estado del avance en palabras: el color de la barra nunca va solo. */
export function estadoAvance(c: Pick<DTOContenido, 'completado' | 'porcentajeProgreso'>): { texto: string; clase: string } {
  if (c.completado) return { texto: 'Completado', clase: 'text-success' };
  if (c.porcentajeProgreso > 0) return { texto: 'En curso', clase: 'text-primary' };
  return { texto: 'Sin empezar', clase: 'text-on-surface-variant' };
}
