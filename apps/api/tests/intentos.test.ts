import { describe, expect, test } from 'bun:test';
import { estadoAlCerrar, resolverRespuesta } from '../src/services/politica-intentos';

const actual = { alternativaId: 'a', esMarcada: true, tiempoSegundos: 30, guardadoEn: '2026-10-28T12:00:00Z' };
describe('consistencia de respuestas', () => {
  test('un reintento idéntico con revisión vieja conserva el resultado', () => {
    expect(resolverRespuesta(actual, { alternativaId: 'a', baseGuardadoEn: null }).repetida).toBe(true);
  });
  test('una pestaña con revisión vieja no sobrescribe una respuesta nueva', () => {
    expect(() => resolverRespuesta(actual, { alternativaId: 'b', baseGuardadoEn: null })).toThrow();
  });
  test('cambiar la marca conserva respuesta y tiempo', () => {
    expect(resolverRespuesta(actual, { esMarcada: false, baseGuardadoEn: actual.guardadoEn })).toEqual({ repetida: false, alternativaId: 'a', esMarcada: false, tiempoSegundos: 30 });
  });
  test('los tiempos no retroceden al reintentar', () => {
    expect(resolverRespuesta(actual, { tiempoSegundos: 2 }).tiempoSegundos).toBe(30);
  });
  test('la hora exacta del límite cierra por expiración', () => {
    expect(estadoAlCerrar('2026-10-28T12:00:00Z', '2026-10-28T12:00:00Z')).toBe('expirado');
    expect(estadoAlCerrar('2026-10-28T12:00:00Z', '2026-10-28T11:59:59Z')).toBe('entregado');
  });
});
