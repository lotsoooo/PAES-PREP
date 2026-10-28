import type { DTOAutor } from '@paes-pro/shared';

/** Rol visible del autor: "Tutor verificado", "Profesor", "Equipo PAES Pro", "Estudiante". */
export function rolAutor(autor: DTOAutor): string {
  if (autor.rol === 'admin') return 'Equipo PAES Pro';
  if (autor.esTutorVerificado) return 'Tutor verificado';
  if (autor.rol === 'profesor') return 'Profesor';
  return 'Estudiante';
}

/** Texto plano para el extracto del feed (sin Markdown ni LaTeX crudo). */
export function extracto(cuerpo: string, max = 260): string {
  const limpio = cuerpo
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\$\$?([^$]+)\$\$?/g, '$1')
    .replace(/\+\+/g, '')
    .replace(/[*_#>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return limpio.length > max ? `${limpio.slice(0, max).trimEnd()}…` : limpio;
}
