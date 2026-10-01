import { describe, expect, test } from 'bun:test';
import { acotar, convertirPuntaje } from '../src/services/scoring/puntaje.js';
import type { TramoConversion } from '../src/services/scoring/puntaje.js';
import { aprobo, calificarIntento } from '../src/services/scoring/calificar.js';
import type { PreguntaParaCorregir } from '../src/services/scoring/calificar.js';

const TRAMOS: TramoConversion[] = [
  { pctLogroMin: 0, pctLogroMax: 50, puntajeMin: 100, puntajeMax: 400 },
  { pctLogroMin: 50, pctLogroMax: 70, puntajeMin: 400, puntajeMax: 600 },
  { pctLogroMin: 70, pctLogroMax: 85, puntajeMin: 600, puntajeMax: 800 },
  { pctLogroMin: 85, pctLogroMax: 100, puntajeMin: 800, puntajeMax: 1000 },
];

describe('convertirPuntaje', () => {
  test('devuelve el mínimo de un tramo en su borde exacto', () => {
    expect(convertirPuntaje(TRAMOS, 50)).toBe(400);
    expect(convertirPuntaje(TRAMOS, 70)).toBe(600);
  });

  test('interpola linealmente dentro de un tramo', () => {
    // Mitad de 50–70 => mitad de 400–600 => 500
    expect(convertirPuntaje(TRAMOS, 60)).toBe(500);
    // 25 % del tramo 0–50 => 100 + 0.25 * 300 = 175
    expect(convertirPuntaje(TRAMOS, 12.5)).toBe(175);
  });

  test('devuelve los extremos fuera de rango', () => {
    expect(convertirPuntaje(TRAMOS, 0)).toBe(100);
    expect(convertirPuntaje(TRAMOS, 100)).toBe(1000);
    expect(convertirPuntaje(TRAMOS, -20)).toBe(100);
    expect(convertirPuntaje(TRAMOS, 150)).toBe(1000);
  });

  test('nunca devuelve un puntaje fuera de 100–1000', () => {
    for (let pct = 0; pct <= 100; pct += 1) {
      const puntaje = convertirPuntaje(TRAMOS, pct);
      expect(puntaje).toBeGreaterThanOrEqual(100);
      expect(puntaje).toBeLessThanOrEqual(1000);
    }
  });

  test('es monótona: más logro nunca resta puntaje', () => {
    let anterior = 0;
    for (let pct = 0; pct <= 100; pct += 1) {
      const actual = convertirPuntaje(TRAMOS, pct);
      expect(actual).toBeGreaterThanOrEqual(anterior);
      anterior = actual;
    }
  });

  test('falla explícitamente si la prueba no tiene tramos', () => {
    expect(() => convertirPuntaje([], 50)).toThrow(/no tiene tramos/);
  });

  test('tolera tramos desordenados', () => {
    const desordenados = [...TRAMOS].reverse();
    expect(convertirPuntaje(desordenados, 60)).toBe(500);
  });
});

describe('acotar', () => {
  test('acota a la escala PAES', () => {
    expect(acotar(50)).toBe(100);
    expect(acotar(1200)).toBe(1000);
    expect(acotar(750)).toBe(750);
  });
});

describe('calificarIntento', () => {
  function pregunta(
    n: number,
    correcta: string,
    elegida: string | null,
    eje = 'eje-a',
  ): PreguntaParaCorregir {
    return {
      preguntaId: `p${n}`,
      alternativaCorrecta: correcta,
      alternativaElegida: elegida,
      esCorrecta: elegida !== null && elegida === correcta,
      puntajeObtenido: elegida !== null && elegida === correcta ? 10 : 0,
      puntajeTotal: 10,
      segundos: 60,
      ejeId: eje,
    };
  }

  test('cuenta correctas, incorrectas y omitidas', () => {
    const resultado = calificarIntento(
      [
        pregunta(1, 'a', 'a'), // correcta
        pregunta(2, 'a', 'b'), // incorrecta
        pregunta(3, 'a', null), // omitida
        pregunta(4, 'a', 'a'), // correcta
      ],
      TRAMOS,
    );

    expect(resultado.correctas).toBe(2);
    expect(resultado.incorrectas).toBe(1);
    expect(resultado.omitidas).toBe(1);
    expect(resultado.total).toBe(4);
    expect(resultado.pctLogro).toBe(50);
  });

  test('el % de logro se calcula sobre el total de preguntas', () => {
    const resultado = calificarIntento([pregunta(1, 'a', 'a')], TRAMOS);
    expect(resultado.pctLogro).toBe(100);
    expect(aprobo(resultado)).toBe(true);
  });

  test('un intento sin preguntas no revienta', () => {
    const resultado = calificarIntento([], TRAMOS);
    expect(resultado.total).toBe(0);
    expect(resultado.pctLogro).toBe(0);
    expect(resultado.puntaje).toBe(100);
    expect(resultado.segundosPromedioPregunta).toBe(0);
    expect(resultado.ejeDebil).toBeNull();
  });

  test('desglosa por eje', () => {
    const resultado = calificarIntento(
      [
        pregunta(1, 'a', 'a', 'eje-a'),
        pregunta(2, 'a', 'b', 'eje-a'),
        pregunta(3, 'a', 'a', 'eje-b'),
      ],
      TRAMOS,
    );

    const ejeA = resultado.porEje.find((e) => e.ejeId === 'eje-a');
    const ejeB = resultado.porEje.find((e) => e.ejeId === 'eje-b');

    expect(ejeA?.total).toBe(2);
    expect(ejeA?.correctas).toBe(1);
    expect(ejeA?.pctLogro).toBe(50);
    expect(ejeB?.pctLogro).toBe(100);
  });

  test('identifica el eje más débil (alimenta "Recomendado para ti")', () => {
    const resultado = calificarIntento(
      [
        pregunta(1, 'a', 'a', 'eje-fuerte'),
        pregunta(2, 'a', 'b', 'eje-debil'),
        pregunta(3, 'a', 'b', 'eje-debil'),
      ],
      TRAMOS,
    );

    expect(resultado.ejeDebil?.ejeId).toBe('eje-debil');
    expect(resultado.ejeDebil?.precision).toBe(0);
  });

  test('calcula el tiempo promedio por pregunta', () => {
    const preguntas = [
      { ...pregunta(1, 'a', 'a'), segundos: 60 },
      { ...pregunta(2, 'a', 'a'), segundos: 120 },
    ];
    const resultado = calificarIntento(preguntas, TRAMOS);
    expect(resultado.segundosTotales).toBe(180);
    expect(resultado.segundosPromedioPregunta).toBe(90);
  });

  test('las omitidas no suman puntos', () => {
    const resultado = calificarIntento(
      [pregunta(1, 'a', null), pregunta(2, 'a', 'a')],
      TRAMOS,
    );
    expect(resultado.puntosObtenidos).toBe(10);
    expect(resultado.puntosTotales).toBe(20);
  });
});
