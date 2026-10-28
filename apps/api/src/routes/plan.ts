import type { DTOPlanSemana, DTOProgresoMateria, DTOTareaActualizada, DTOTareaPlan } from '@paes-pro/shared';
import { actualizarTareaSchema, crearTareaSchema, planSemanaQuerySchema, regenerarPlanSchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { invalido, noEncontrado } from '../http/errores.js';
import { leerCuerpo, leerQuery, leerUuid } from '../http/validar.js';
import { obtenerRacha, planActivo, semanaDe, tareaPorId, tareasEntre } from '../services/consultas.js';
import { generarPlanUsuario } from '../services/generar-plan.js';
import { otorgarLogro, registrarActividad } from '../services/actividad.js';
import { hoyChile } from '../services/usuarios.js';
import { diasEntre } from '../services/fechas.js';

export const plan = crearRouter();

plan.use('*', requiereSesion);

const NOMBRES_MATERIA: Record<string, string> = {
  M1: 'Matemática M1',
  M2: 'Matemática M2',
  CL: 'Competencia Lectora',
  BIO: 'Biología',
  FIS: 'Física',
  QUI: 'Química',
  HIST: 'Historia',
};

export function progresoPorMateria(tareas: DTOTareaPlan[]): DTOProgresoMateria[] {
  const mapa = new Map<string, DTOProgresoMateria>();
  for (const t of tareas) {
    if (t.estado === 'omitida') continue;
    const codigo = t.materiaCodigo ?? 'OTRO';
    const actual = mapa.get(codigo) ?? {
      materiaCodigo: codigo,
      materiaNombre: NOMBRES_MATERIA[codigo] ?? 'General',
      completadas: 0,
      total: 0,
      minutosCompletados: 0,
      minutosTotales: 0,
    };
    actual.total += 1;
    actual.minutosTotales += t.duracionMin;
    if (t.estado === 'completada') {
      actual.completadas += 1;
      actual.minutosCompletados += t.duracionMin;
    }
    mapa.set(codigo, actual);
  }
  return [...mapa.values()].sort((a, b) => b.minutosTotales - a.minutosTotales);
}

async function planSemana(usuarioId: string, desde: string, hasta: string): Promise<DTOPlanSemana> {
  const base = await planActivo(usuarioId);
  if (!base) throw noEncontrado('Aún no tienes un plan de estudio. Genera uno para empezar.');
  const [tareas, racha] = await Promise.all([tareasEntre(usuarioId, desde, hasta), obtenerRacha(usuarioId)]);
  return { ...base, tareas, desde, hasta, progresoSemanal: progresoPorMateria(tareas), racha };
}

plan.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const q = leerQuery(c, planSemanaQuerySchema);
  const semana = semanaDe(q.desde ?? hoyChile());
  const desde = q.desde ?? semana.desde;
  const hasta = q.hasta ?? (q.desde ? semanaDe(q.desde).hasta : semana.hasta);
  if (diasEntre(desde, hasta) < 0) throw invalido('La fecha "hasta" debe ser posterior a "desde".');
  if (diasEntre(desde, hasta) > 62) throw invalido('El rango máximo es de dos meses. Acorta las fechas.');
  return c.json(await planSemana(id, desde, hasta));
});

plan.patch('/tareas/:id', async (c) => {
  const usuario = usuarioDe(c);
  const tareaId = leerUuid(c);
  const d = await leerCuerpo(c, actualizarTareaSchema);

  const previa = await tareaPorId(usuario.id, tareaId);
  if (!previa) throw noEncontrado('Esa tarea no existe o no es tuya.');

  const cambios: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
  if (d.titulo !== undefined) cambios.titulo = d.titulo;
  if (d.fechaPlanificada !== undefined) cambios.fecha_planificada = d.fechaPlanificada;
  if (d.estado !== undefined) {
    cambios.estado = d.estado;
    cambios.completada_en = d.estado === 'completada' ? new Date().toISOString() : null;
  }
  await sql`update tareas_plan set ${sql(cambios)} where id = ${tareaId} and usuario_id = ${usuario.id}`;

  if (d.estado === 'completada' && previa.estado !== 'completada') {
    await registrarActividad(usuario.id, 'tarea_plan');
    // Logro: todas las tareas de la semana de esa tarea completadas.
    const { desde, hasta } = semanaDe(previa.fechaPlanificada);
    const [pendientes] = await sql<{ n: number; total: number }[]>`
      select count(*) filter (where estado not in ('completada', 'omitida'))::int as n, count(*)::int as total
        from tareas_plan
       where usuario_id = ${usuario.id} and fecha_planificada between ${desde} and ${hasta}`;
    if (pendientes && pendientes.total >= 3 && pendientes.n === 0) await otorgarLogro(usuario.id, 'plan_semana');
  }

  const respuesta: DTOTareaActualizada = {
    tarea: (await tareaPorId(usuario.id, tareaId))!,
    racha: await obtenerRacha(usuario.id),
  };
  return c.json(respuesta);
});

plan.post('/tareas', async (c) => {
  const { id } = usuarioDe(c);
  const d = await leerCuerpo(c, crearTareaSchema);
  const [p] = await sql<{ id: string }[]>`
    select id from planes_estudio where usuario_id = ${id} and activo order by creado_en desc limit 1`;
  if (!p) throw noEncontrado('Aún no tienes un plan de estudio. Genera uno para agregar tareas.');

  const [nueva] = await sql<{ id: string }[]>`
    insert into tareas_plan (plan_id, usuario_id, titulo, descripcion, tipo, contenido_id, ensayo_id,
                             materia_id, fecha_planificada, duracion_min)
    values (${p.id}, ${id}, ${d.titulo}, ${d.descripcion ?? null}, ${d.tipo}, ${d.contenidoId ?? null},
            ${d.ensayoId ?? null}, ${d.materiaId ?? null}, ${d.fechaPlanificada}, ${d.duracionMin})
    returning id`;
  return c.json(await tareaPorId(id, nueva!.id), 201);
});

plan.post('/regenerar', async (c) => {
  const { id } = usuarioDe(c);
  const d = await leerCuerpo(c, regenerarPlanSchema);
  if (d.horasSemana !== undefined) {
    await sql`update usuarios set horas_semana = ${d.horasSemana} where id = ${id}`;
  }
  await generarPlanUsuario(id, { horasSemana: d.horasSemana, semanas: d.semanas });
  const { desde, hasta } = semanaDe(hoyChile());
  return c.json(await planSemana(id, desde, hasta));
});
