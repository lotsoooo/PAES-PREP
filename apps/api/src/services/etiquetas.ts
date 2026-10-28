/**
 * Hashtags de publicaciones: `#palabra` en el cuerpo o el título.
 * Admite tildes y ñ; se normalizan a minúsculas y sin duplicados.
 */
const PATRON = /(?:^|[^\p{L}\p{N}_])#([\p{L}\p{N}_]{2,40})/gu;

export function extraerEtiquetas(...textos: (string | null | undefined)[]): string[] {
  const vistas = new Set<string>();
  const resultado: string[] = [];
  for (const texto of textos) {
    if (!texto) continue;
    for (const m of texto.matchAll(PATRON)) {
      const etiqueta = m[1]!.toLowerCase();
      if (!vistas.has(etiqueta)) {
        vistas.add(etiqueta);
        resultado.push(etiqueta);
      }
    }
  }
  return resultado;
}

/** Cuenta etiquetas en varias publicaciones, de mayor a menor. */
export function contarEtiquetas(
  publicaciones: { titulo: string; cuerpo: string }[],
  limite = 8,
): { etiqueta: string; cantidad: number }[] {
  const conteo = new Map<string, number>();
  for (const p of publicaciones) {
    for (const e of extraerEtiquetas(p.titulo, p.cuerpo)) {
      conteo.set(e, (conteo.get(e) ?? 0) + 1);
    }
  }
  return [...conteo.entries()]
    .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'))
    .slice(0, limite);
}

/**
 * Pasos de una explicación: divide por líneas; si viene en un solo párrafo,
 * divide por oraciones. Quita numeraciones previas ("1.", "Paso 2:").
 */
export function dividirPasos(explicacion: string | null | undefined): string[] {
  if (!explicacion) return [];
  const limpiar = (s: string) =>
    s
      .replace(/^\s*(?:paso\s*)?\d+\s*[.):-]\s*/i, '')
      .replace(/^\s*[-•*]\s+/, '')
      .trim();
  const lineas = explicacion
    .split(/\r?\n+/)
    .map(limpiar)
    .filter(Boolean);
  if (lineas.length > 1) return lineas;
  // Un solo párrafo: separar por oraciones sin romper decimales ni LaTeX.
  const texto = lineas[0] ?? '';
  const partes: string[] = [];
  let actual = '';
  let enMath = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    actual += ch;
    if (ch === '$') enMath = !enMath;
    if (!enMath && (ch === '.' || ch === '!' || ch === '?') && (texto[i + 1] === ' ' || i === texto.length - 1)) {
      const siguiente = texto[i + 2];
      if (i === texto.length - 1 || (siguiente && /[\p{Lu}¿¡$]/u.test(siguiente))) {
        partes.push(actual.trim());
        actual = '';
      }
    }
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes.filter(Boolean);
}
