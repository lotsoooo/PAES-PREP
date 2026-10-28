import { PRUEBA_DE_MATERIA } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { calcularDistribucionPorBrecha, generarTareas, repartirHoras } from './plan-generator.js';
import { sumarDias } from './fechas.js';
import { esPremium, hoyChile } from './usuarios.js';

export const SEMANAS_POR_DEFECTO = 4;
export const HORAS_POR_DEFECTO = 8;
/** Lunes, miércoles y viernes (convención getDay: 0 = domingo). */
export const DIAS_POR_DEFECTO = [1, 3, 5];

export interface ResultadoGeneracion {
  planId: string;
  horasSemana: number;
  semanas: number;
  sesionesSemana: number;
  puntajeActual: number | null;
}

/**
 * Puntaje actual estimado por materia: promedio de los últimos 3 intentos
 * entregados de ensayos de esa materia.
 */
export async function puntajePorMateria(usuarioId: string): Promise<Record<string, number>> {
  const filas = await sql<{ codigo: string; promedio: string }[]>`
    select codigo, avg(puntaje) as promedio from (
      select m.codigo, i.puntaje,
             row_number() over (partition by m.codigo order by i.entregado_en desc) as n
        from intentos i
        join ensayos en on en.id = i.ensayo_id
        join materias m on m.id = en.materia_id
       where i.usuario_id = ${usuarioId} and i.estado in ('entregado', 'expirado') and i.puntaje is not null
    ) t where n <= 3 group by codigo`;
  return Object.fromEntries(filas.map((f) => [f.codigo, Math.round(Number(f.promedio))]));
}

/**
 * Genera (o regenera) el plan activo del usuario a partir de su meta,
 * disponibilidad y pruebas elegidas.
 *
 * - Si ya hay un plan activo se reutiliza: se borran solo las tareas futuras
 *   pendientes y se conservan las completadas y en curso.
 * - Las tareas parten hoy, salvo que hoy ya tenga tareas trabajadas (entonces
 *   parten mañana para no duplicar el día).
 */
export async function generarPlanUsuario(
  usuarioId: string,
  opciones: { horasSemana?: number; semanas?: number } = {},
): Promise<ResultadoGeneracion> {
  const [u] = await sql<{
    carrera_id: string | null;
    area: string | null;
    puntaje_meta: number | null;
    horas_semana: number | null;
    dias_disponibles: number[];
    pruebas_objetivo: string[];
    fecha_examen: string | null;
  }[]>`
    select u.carrera_id, ca.area, u.puntaje_meta, u.horas_semana, u.dias_disponibles,
           u.pruebas_objetivo, to_char(u.fecha_examen, 'YYYY-MM-DD') as fecha_examen
      from usuarios u left join carreras ca on ca.id = u.carrera_id
     where u.id = ${usuarioId}`;
  if (!u) throw new Error('generarPlanUsuario: usuario inexistente');

  const horasSemana = opciones.horasSemana ?? u.horas_semana ?? HORAS_POR_DEFECTO;
  const semanas = opciones.semanas ?? SEMANAS_POR_DEFECTO;
  const dias = u.dias_disponibles.length > 0 ? u.dias_disponibles : DIAS_POR_DEFECTO;
  const premium = await esPremium(usuarioId);

  const [contenidos, ensayos, materias, actuales] = await Promise.all([
    sql<{ id: string; materiaCodigo: string; titulo: string }[]>`
      select c.id, m.codigo as "materiaCodigo", c.titulo
        from contenidos c join materias m on m.id = c.materia_id
       where c.activo and (${premium} or not c.premium)
       order by coalesce(c.unidad, ''), c.orden, c.titulo`,
    sql<{ id: string; materiaCodigo: string; titulo: string; premium: boolean }[]>`
      select en.id, m.codigo as "materiaCodigo", en.titulo, en.premium
        from ensayos en join materias m on m.id = en.materia_id
       where en.activo and (${premium} or not en.premium)
       order by en.es_diagnostico desc, en.titulo`,
    sql<{ id: string; codigo: string }[]>`select id, codigo from materias where activo`,
    puntajePorMateria(usuarioId),
  ]);

  const codigos = materias.map((m) => m.codigo);
  const brechaPorMateria: Record<string, number | null> = {};
  for (const codigo of codigos) {
    const actual = actuales[codigo];
    brechaPorMateria[codigo] = u.puntaje_meta !== null && actual !== undefined ? u.puntaje_meta - actual : null;
  }

  const distribucion = repartirHoras(
    calcularDistribucionPorBrecha({
      areaCarrera: u.area,
      codigosDisponibles: codigos,
      pruebasObjetivo: u.pruebas_objetivo,
      brechaPorMateria,
    }),
    horasSemana,
  );

  const hoy = hoyChile();
  const [trabajadasHoy] = await sql<{ n: number }[]>`
    select count(*)::int as n from tareas_plan
     where usuario_id = ${usuarioId} and fecha_planificada = ${hoy} and estado <> 'pendiente'`;
  const inicio = (trabajadasHoy?.n ?? 0) > 0 ? sumarDias(hoy, 1) : hoy;

  const tareas = generarTareas({
    hoy: inicio,
    semanas,
    diasDisponibles: dias,
    distribucion,
    restricciones: { contenidosDisponibles: contenidos, ensayosDisponibles: ensayos },
  });

  const idMateria = new Map(materias.map((m) => [m.codigo, m.id]));

  const planId = await sql.begin(async (tx) => {
    const [existente] = await tx<{ id: string }[]>`
      select id from planes_estudio where usuario_id = ${usuarioId} and activo
       order by creado_en desc limit 1`;

    let id: string;
    if (existente) {
      id = existente.id;
      await tx`
        update planes_estudio
           set horas_semana = ${horasSemana}, semanas = ${semanas}, fecha_examen = ${u.fecha_examen},
               carrera_id = ${u.carrera_id}, generado_por = 'generador'
         where id = ${id}`;
      await tx`
        delete from tareas_plan
         where plan_id = ${id} and estado = 'pendiente' and fecha_planificada >= ${inicio}`;
      await tx`delete from plan_distribucion where plan_id = ${id}`;
    } else {
      const [nuevo] = await tx<{ id: string }[]>`
        insert into planes_estudio (usuario_id, carrera_id, horas_semana, fecha_inicio, fecha_examen, semanas)
        values (${usuarioId}, ${u.carrera_id}, ${horasSemana}, ${hoy}, ${u.fecha_examen}, ${semanas})
        returning id`;
      id = nuevo!.id;
    }

    for (const d of distribucion) {
      const materiaId = idMateria.get(d.materiaCodigo);
      if (!materiaId) continue;
      await tx`
        insert into plan_distribucion (plan_id, materia_id, porcentaje, horas_semana)
        values (${id}, ${materiaId}, ${d.porcentaje}, ${d.horasSemana})`;
    }

    for (const t of tareas) {
      await tx`
        insert into tareas_plan (plan_id, usuario_id, titulo, descripcion, tipo, contenido_id, ensayo_id,
                                 materia_id, fecha_planificada, duracion_min)
        values (${id}, ${usuarioId}, ${t.titulo}, ${t.descripcion}, ${t.tipo}, ${t.contenidoId},
                ${t.ensayoId}, ${t.materiaCodigo ? (idMateria.get(t.materiaCodigo) ?? null) : null},
                ${t.fechaPlanificada}, ${t.duracionMin})`;
    }
    return id;
  });

  // Puntaje actual global: promedio de las pruebas que rinde (o de todas las que tiene).
  const pruebasUsuario = new Set(u.pruebas_objetivo);
  const relevantes = Object.entries(actuales)
    .filter(([codigo]) => pruebasUsuario.size === 0 || pruebasUsuario.has(PRUEBA_DE_MATERIA[codigo] ?? ''))
    .map(([, p]) => p);
  const puntajeActual = relevantes.length
    ? Math.round(relevantes.reduce((a, b) => a + b, 0) / relevantes.length)
    : null;

  return {
    planId,
    horasSemana,
    semanas,
    sesionesSemana: dias.length,
    puntajeActual,
  };
}
