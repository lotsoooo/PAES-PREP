/**
 * Utilidades de texto para la interfaz.
 * Viven fuera de los componentes para no romper el fast refresh de Vite.
 */

/** Genera iniciales a partir de un nombre completo: "Valentina Pérez" -> "VP". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primera + segunda).toUpperCase();
}

/** Pluraliza en español: pluralizar(1, 'ensayo', 'ensayos') -> "1 ensayo". */
export function pluralizar(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** Primera letra en mayúscula, sin tocar el resto. */
export function capitalizar(texto: string): string {
  return texto.length === 0 ? texto : texto[0]!.toUpperCase() + texto.slice(1);
}
