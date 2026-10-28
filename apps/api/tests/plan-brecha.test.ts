import { describe, expect, test } from 'bun:test';
import {
  calcularDistribucionPorBrecha,
  distribucionBaseDeArea,
  factorBrecha,
  DISTRIBUCIONES_POR_AREA,
} from '../src/services/plan-generator.js';
import { estadosLecciones, semanaDe } from '../src/services/calendario.js';

const TODAS = ['M1', 'M2', 'CL', 'BIO', 'FIS', 'QUI', 'HIST'];

describe('distribucionBaseDeArea', () => {
  test('encuentra el área aunque el catálogo la escriba con tilde', () => {
    expect(distribucionBaseDeArea('Economía')).toEqual(DISTRIBUCIONES_POR_AREA['Economia']!);
    expect(distribucionBaseDeArea('Tecnología')).toEqual(DISTRIBUCIONES_POR_AREA['Tecnologia']!);
  });
});

describe('factorBrecha', () => {
  test('sin datos asume la brecha completa', () => {
    expect(factorBrecha(null)).toBe(1.5);
  });
  test('meta alcanzada baja la prioridad a la mitad', () => {
    expect(factorBrecha(0)).toBe(0.5);
    expect(factorBrecha(-50)).toBe(0.5);
  });
  test('crece con la brecha hasta el tope', () => {
    expect(factorBrecha(200)).toBe(1);
    expect(factorBrecha(1000)).toBe(1.5);
  });
});

describe('calcularDistribucionPorBrecha', () => {
  test('sin intentos respeta el peso de la carrera', () => {
    const dist = calcularDistribucionPorBrecha({
      areaCarrera: 'Salud',
      codigosDisponibles: TODAS,
      pruebasObjetivo: [],
      brechaPorMateria: {},
    });
    const por = Object.fromEntries(dist.map((d) => [d.materiaCodigo, d.porcentaje]));
    expect(por).toEqual({ M1: 40, BIO: 35, CL: 25 });
  });

  test('la prueba con más brecha recibe más horas que con el peso solo', () => {
    const dist = calcularDistribucionPorBrecha({
      areaCarrera: 'Salud',
      codigosDisponibles: TODAS,
      pruebasObjetivo: [],
      // CL lejos de la meta, M1 y BIO ya la alcanzaron.
      brechaPorMateria: { M1: -20, BIO: 0, CL: 300 },
    });
    const por = Object.fromEntries(dist.map((d) => [d.materiaCodigo, d.porcentaje]));
    expect(por['CL']!).toBeGreaterThan(25);
    expect(por['CL']!).toBeGreaterThan(por['M1']!);
  });

  test('usa las pruebas elegidas y mapea Ciencias a la materia que pondera la carrera', () => {
    const dist = calcularDistribucionPorBrecha({
      areaCarrera: 'Salud',
      codigosDisponibles: TODAS,
      pruebasObjetivo: ['M1', 'CL', 'CIENCIAS', 'M2'],
      brechaPorMateria: {},
    });
    expect(dist.map((d) => d.materiaCodigo).sort()).toEqual(['BIO', 'CL', 'M1', 'M2']);
  });

  test('siempre suma 100', () => {
    for (const area of [...Object.keys(DISTRIBUCIONES_POR_AREA), null, 'Inexistente']) {
      const dist = calcularDistribucionPorBrecha({
        areaCarrera: area,
        codigosDisponibles: TODAS,
        pruebasObjetivo: ['M1', 'CL', 'HISTORIA'],
        brechaPorMateria: { M1: 120, CL: 37, HIST: null },
      });
      const suma = dist.reduce((a, d) => a + d.porcentaje, 0);
      expect(Math.round(suma * 100) / 100).toBe(100);
    }
  });
});

describe('estadosLecciones', () => {
  test('la lección siguiente queda bloqueada hasta completar la anterior', () => {
    const estados = estadosLecciones(
      [
        { slug: 'a', completado: true },
        { slug: 'b', completado: false },
        { slug: 'c', completado: false },
      ],
      'b',
    );
    expect(estados).toEqual(['completada', 'actual', 'bloqueada']);
  });

  test('la primera lección siempre está disponible', () => {
    expect(estadosLecciones([{ slug: 'a', completado: null }], 'x')).toEqual(['disponible']);
  });
});

describe('semanaDe', () => {
  test('devuelve lunes a domingo', () => {
    expect(semanaDe('2026-10-24')).toEqual({ desde: '2026-10-19', hasta: '2026-10-25' });
    expect(semanaDe('2026-10-19')).toEqual({ desde: '2026-10-19', hasta: '2026-10-25' });
  });
});
