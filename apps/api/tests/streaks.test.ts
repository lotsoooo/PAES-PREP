import { describe, expect, test } from 'bun:test';
import {
  calcularRacha,
  diasEntre,
  puntosRacha,
  rachaDesdeFechas,
  registrarActividad,
  sumarDias,
} from '../src/services/fechas.js';

const HOY = '2026-03-15';

describe('fechas', () => {
  test('sumarDias cambia de mes correctamente', () => {
    expect(sumarDias('2026-01-30', 2)).toBe('2026-02-01');
  });

  test('sumarDias maneja el año bisiesto', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
  });

  test('diasEntre cuenta días completos', () => {
    expect(diasEntre('2026-03-15', '2026-03-16')).toBe(1);
    expect(diasEntre('2026-03-15', '2026-03-15')).toBe(0);
  });
});

describe('calcularRacha', () => {
  test('sin actividad previa la racha es 0', () => {
    const racha = calcularRacha(null, 12, HOY);
    expect(racha.rachaActual).toBe(0);
    expect(racha.completoHoy).toBe(false);
  });

  test('actividad hoy: marca completadoHoy sin incrementar', () => {
    const racha = calcularRacha(HOY, 5, HOY);
    expect(racha.completoHoy).toBe(true);
  });

  test('actividad ayer: la racha sigue viva', () => {
    const racha = calcularRacha('2026-03-14', 5, HOY);
    expect(racha.completoHoy).toBe(false);
    expect(racha.rachaActual).toBe(1);
  });

  test('dos o más días sin actividad reinicia la racha', () => {
    expect(calcularRacha('2026-03-13', 9, HOY).rachaActual).toBe(0);
    expect(calcularRacha('2026-01-01', 9, HOY).rachaActual).toBe(0);
  });

  test('nunca reduce el récord histórico', () => {
    expect(calcularRacha('2026-01-01', 9, HOY).rachaMaxima).toBe(9);
  });
});

describe('registrarActividad', () => {
  test('primer actividad del día crea la racha', () => {
    const racha = registrarActividad(0, 0, null, HOY);
    expect(racha.rachaActual).toBe(1);
    expect(racha.rachaMaxima).toBe(1);
    expect(racha.ultimaActividad).toBe(HOY);
  });

  test('contaba el día siguiente y mantiene el récord', () => {
    const manana = sumarDias(HOY, 1);
    const racha = registrarActividad(1, 1, HOY, manana);
    expect(racha.rachaActual).toBe(2);
    expect(racha.rachaMaxima).toBe(2);
  });

  test('no se acumula dos veces el mismo día', () => {
    // Tres actividades distintas el mismo día no deben triplicar la racha.
    let racha = registrarActividad(0, 0, null, HOY);
    racha = registrarActividad(racha.rachaActual, racha.rachaMaxima, racha.ultimaActividad, HOY);
    racha = registrarActividad(racha.rachaActual, racha.rachaMaxima, racha.ultimaActividad, HOY);
    expect(racha.rachaActual).toBe(1);
  });

  test('rearranca en 1 tras perder la racha, sin bajar el récord', () => {
    const racha = registrarActividad(0, 14, '2026-02-01', HOY);
    expect(racha.rachaActual).toBe(1);
    expect(racha.rachaMaxima).toBe(14);
  });

  test('una cadena larga acumula correctamente', () => {
    let rachaActual = 0;
    let ultima: string | null = null;
    for (let d = 0; d < 10; d++) {
      const fecha = sumarDias('2026-03-01', d);
      const r = registrarActividad(rachaActual, rachaActual, ultima, fecha);
      rachaActual = r.rachaActual;
      ultima = r.ultimaActividad;
    }
    expect(rachaActual).toBe(10);
  });
});

describe('puntosRacha', () => {
  test('100 por día con tope de 500', () => {
    expect(puntosRacha(0)).toBe(0);
    expect(puntosRacha(1)).toBe(100);
    expect(puntosRacha(4)).toBe(400);
    expect(puntosRacha(5)).toBe(500);
    expect(puntosRacha(30)).toBe(500);
  });
});

describe('rachaDesdeFechas', () => {
  test('sin historial la racha es 0', () => {
    const r = rachaDesdeFechas([], HOY);
    expect(r).toEqual({ rachaActual: 0, rachaMaxima: 0, ultimaActividad: null });
  });

  test('cuenta días consecutivos y devuelve la máxima', () => {
    const fechas = [
      sumarDias(HOY, -6),
      sumarDias(HOY, -5),
      sumarDias(HOY, -4),
      sumarDias(HOY, -3),
      sumarDias(HOY, -2),
      sumarDias(HOY, -1),
    ];
    const r = rachaDesdeFechas(fechas, HOY);
    expect(r.rachaActual).toBe(6);
    expect(r.rachaMaxima).toBe(6);
  });

  test('un hueco corta la corrida pero la máxima se conserva', () => {
    const fechas = [
      sumarDias(HOY, -10),
      sumarDias(HOY, -9),
      sumarDias(HOY, -8),
      sumarDias(HOY, -4),
      sumarDias(HOY, -3),
      sumarDias(HOY, -2),
      sumarDias(HOY, -1),
    ];
    const r = rachaDesdeFechas(fechas, HOY);
    expect(r.rachaActual).toBe(4);
    expect(r.rachaMaxima).toBe(4);
  });

  test('la racha máxima sobrevive aunque la actual esté rota', () => {
    const fechas = [sumarDias(HOY, -30), sumarDias(HOY, -1)];
    const r = rachaDesdeFechas(fechas, HOY);
    expect(r.rachaActual).toBe(1);
    expect(r.rachaMaxima).toBe(1);
  });

  test('más de un día sin actividad deja la racha actual en 0', () => {
    const fechas = [sumarDias(HOY, -5), sumarDias(HOY, -4), sumarDias(HOY, -3)];
    const r = rachaDesdeFechas(fechas, HOY);
    expect(r.rachaActual).toBe(0);
    expect(r.rachaMaxima).toBe(3);
    expect(r.ultimaActividad).toBe(sumarDias(HOY, -3));
  });

  test('ignora fechas duplicadas y desordenadas', () => {
    const fechas = [sumarDias(HOY, -1), sumarDias(HOY, -1), sumarDias(HOY, -2), HOY];
    const r = rachaDesdeFechas(fechas, HOY);
    expect(r.rachaActual).toBe(3);
  });
});
