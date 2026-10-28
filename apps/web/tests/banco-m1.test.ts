import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { BANCO_M1 } from '../../api/src/db/dataset/m1-banco';

describe('integridad del banco M1 de desarrollo', () => {
  it('incluye 65 claves y enunciados distintos y los cuatro ejes', () => {
    expect(BANCO_M1).toHaveLength(65);
    expect(new Set(BANCO_M1.map((p) => p.clave)).size).toBe(65);
    expect(new Set(BANCO_M1.map((p) => p.enunciado)).size).toBe(65);
    expect([...new Set(BANCO_M1.map((p) => p.eje))].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it.each(BANCO_M1)('$clave: alternativas, solución y matemática legible', (pregunta) => {
    expect(pregunta.alternativas.filter((a) => a.esCorrecta)).toHaveLength(1);
    expect(new Set(pregunta.alternativas.map((a) => a.texto.trim())).size).toBe(pregunta.alternativas.length);
    expect(pregunta.alternativas.every((a) => a.texto.trim().length > 0)).toBe(true);
    expect(pregunta.explicacion.length).toBeGreaterThan(20);
    expect(pregunta.errorComun?.length).toBeGreaterThan(10);
    for (const texto of [pregunta.enunciado, pregunta.explicacion, ...pregunta.alternativas.map((a) => a.texto)]) {
      for (const formula of texto.matchAll(/\$([^$]+)\$/g)) {
        expect(() => katex.renderToString(formula[1]!, { throwOnError: true, trust: false })).not.toThrow();
      }
    }
  });
});
