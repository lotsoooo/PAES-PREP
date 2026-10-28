import { describe, expect, test } from 'bun:test';
import {
  calcularDistribucion,
  DISTRIBUCIONES_POR_AREA,
  generarTareas,
  repartirHoras,
} from '../src/services/plan-generator.js';
import { sumarDias } from '../src/services/fechas.js';

const HOY = '2026-03-16'; // lunes

describe('calcularDistribucion', () => {
  test('Medicina reparte 40/35/25 entre M1, Biología y Lenguaje', () => {
    const dist = calcularDistribucion('Salud', ['M1', 'BIO', 'CL', 'HIST']);
    const por = Object.fromEntries(dist.map((d) => [d.materiaCodigo, d.porcentaje]));
    expect(por['M1']).toBe(40);
    expect(por['BIO']).toBe(35);
    expect(por['CL']).toBe(25);
  });

  test('la distribución siempre suma 100', () => {
    for (const area of Object.keys(DISTRIBUCIONES_POR_AREA)) {
      const suma = calcularDistribucion(area, ['M1', 'M2', 'CL', 'BIO', 'HIST']).reduce(
        (a, d) => a + d.porcentaje,
        0,
      );
      expect(Math.round(suma)).toBe(100);
    }
  });

  test('filtra las materias que no existen en la plataforma', () => {
    // Sin HIST, la distribución de Salud debe renormalizar 40/35/25 -> 100.
    const dist = calcularDistribucion('Salud', ['M1', 'BIO', 'CL']);
    const suma = dist.reduce((a, d) => a + d.porcentaje, 0);
    expect(Math.round(suma)).toBe(100);
    expect(dist.map((d) => d.materiaCodigo).sort()).toEqual(['BIO', 'CL', 'M1']);
  });

  test('usa la distribución por defecto sin carrera', () => {
    const dist = calcularDistribucion(null, ['M1', 'CL', 'BIO']);
    expect(Math.round(dist.reduce((a, d) => a + d.porcentaje, 0))).toBe(100);
  });

  test('cae a un reparto equitativo si el área no existe', () => {
    const dist = calcularDistribucion('Area Inventada', ['M1', 'CL']);
    const suma = dist.reduce((a, d) => a + d.porcentaje, 0);
    expect(Math.round(suma)).toBe(100);
  });
});

describe('repartirHoras', () => {
  test('las horas cuadran exactamente con las semanales', () => {
    const dist = calcularDistribucion('Salud', ['M1', 'BIO', 'CL']);
    const horas = repartirHoras(dist, 12);
    const suma = horas.reduce((a, d) => a + d.horasSemana, 0);
    expect(suma).toBe(12);
  });

  test('10 horas semanales de Medicina: 4/3.5/2.5', () => {
    const dist = repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10);
    const por = Object.fromEntries(dist.map((d) => [d.materiaCodigo, d.horasSemana]));
    expect(por['M1']).toBe(4);
    expect(por['BIO']).toBe(3.5);
    expect(por['CL']).toBe(2.5);
  });
});

describe('generarTareas', () => {
  const restricciones = {
    contenidosDisponibles: [
      { id: 'c1', titulo: 'Factorización por agrupación', materiaCodigo: 'M1' },
      { id: 'c2', titulo: 'Genética mendeliana', materiaCodigo: 'BIO' },
      { id: 'c3', titulo: 'Comprensión lectora', materiaCodigo: 'CL' },
    ],
    ensayosDisponibles: [
      { id: 'e1', titulo: 'Ensayo M1', materiaCodigo: 'M1', premium: false },
      { id: 'e2', titulo: 'Ensayo Ciencias', materiaCodigo: 'BIO', premium: true },
    ],
  };

  test('crea una tarea por día disponible en las semanas pedidas', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 2,
      diasDisponibles: [0, 2, 4], // lunes, miércoles, viernes
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });
    expect(tareas).toHaveLength(6);
  });

  test('las fechas respetan el calendario y solo usan los días elegidos', () => {
    // Lunes 16 de marzo de 2026, 2 semanas de lunes a viernes.
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 2,
      diasDisponibles: [1, 2, 3, 4, 5],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });

    expect(tareas).toHaveLength(10);
    expect(tareas[0]?.fechaPlanificada).toBe(HOY);
    // Último día hábil de la segunda semana: viernes 27.
    expect(tareas[tareas.length - 1]?.fechaPlanificada).toBe(sumarDias(HOY, 11));

    // Ninguna tarea puede caer en sábado o domingo.
    for (const t of tareas) {
      const dia = new Date(`${t.fechaPlanificada}T12:00:00`).getDay();
      expect(dia).toBeGreaterThan(0);
      expect(dia).toBeLessThan(6);
    }
  });

  test('no genera tareas en días que el usuario no marcó', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 1,
      diasDisponibles: [1, 6], // lunes y sábado
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });

    const dias = tareas.map((t) => new Date(`${t.fechaPlanificada}T12:00:00`).getDay());
    expect(dias.sort()).toEqual([1, 6]);
  });

  test('el reparto de sesiones sigue la distribución por prueba', () => {
    // 10 sesiones con 40/35/25 -> 4 de M1, 3–4 de BIO y 3 de CL.
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 2,
      diasDisponibles: [1, 3, 5],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });

    const conteo = new Map<string, number>();
    for (const t of tareas) {
      conteo.set(t.materiaCodigo ?? '', (conteo.get(t.materiaCodigo ?? '') ?? 0) + 1);
    }

    expect(tareas).toHaveLength(6);
    expect(conteo.get('M1')).toBe(2); // 40 % de 6 = 2.4 -> 2
    expect(conteo.get('BIO')).toBe(2); // 35 % de 6 = 2.1 -> 2
    expect(conteo.get('CL')).toBe(2); // 25 % de 6 = 1.5 -> 2
  });

  test('enlaza las tareas con contenidos y ensayos reales', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 4,
      diasDisponibles: [0, 2, 4],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });

    const conContenido = tareas.filter((t) => t.contenidoId !== null);
    const conEnsayo = tareas.filter((t) => t.ensayoId !== null);

    expect(conContenido.length).toBeGreaterThan(0);
    expect(conEnsayo.length).toBeGreaterThan(0);

    // Los IDs deben pertenecer a las restricciones entregadas.
    for (const t of conContenido) {
      expect(restricciones.contenidosDisponibles.map((c) => c.id)).toContain(t.contenidoId!);
    }
    for (const t of conEnsayo) {
      expect(restricciones.ensayosDisponibles.map((e) => e.id)).toContain(t.ensayoId!);
    }
  });

  test('la duración de cada tarea queda en un rango usable (25–90 min)', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 4,
      diasDisponibles: [0, 1, 2, 3, 4, 5, 6],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 20),
      restricciones,
    });

    for (const t of tareas) {
      expect(t.duracionMin).toBeGreaterThanOrEqual(25);
      expect(t.duracionMin).toBeLessThanOrEqual(90);
    }
  });

  test('reparte las materias en vez de repetir siempre la primera', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 2,
      diasDisponibles: [0, 1, 2, 3, 4],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });

    const materias = new Set(tareas.map((t) => t.materiaCodigo));
    expect(materias.size).toBeGreaterThan(1);
  });

  test('sin días indicados usa lunes, miércoles y viernes', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 1,
      diasDisponibles: [],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });
    expect(tareas).toHaveLength(3);
  });

  test('cero semanas no genera tareas', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 0,
      diasDisponibles: [0, 2, 4],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones,
    });
    expect(tareas).toHaveLength(0);
  });

  test('sin contenidos ni ensayos disponibles genera tareas de teoría', () => {
    const tareas = generarTareas({
      hoy: HOY,
      semanas: 1,
      diasDisponibles: [0, 1],
      distribucion: repartirHoras(calcularDistribucion('Salud', ['M1', 'BIO', 'CL']), 10),
      restricciones: { contenidosDisponibles: [], ensayosDisponibles: [] },
    });

    expect(tareas.length).toBeGreaterThan(0);
    for (const t of tareas) {
      expect(t.tipo).toBe('teoria');
      expect(t.contenidoId).toBeNull();
      expect(t.ensayoId).toBeNull();
    }
  });
});
