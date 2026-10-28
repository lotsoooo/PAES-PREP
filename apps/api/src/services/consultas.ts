/**
 * Consultas y mapeos compartidos por dashboard, plan, contenidos y onboarding.
 * Devuelven exactamente las formas de los DTOs de @paes-pro/shared.
 */
import type {
  Area,
  DTOContenido,
  DTOIntentoResumen,
  DTOPlan,
  DTOPuntoHistorial,
  DTORacha,
  DTOTareaPlan,
  EstadoIntento,
  Prueba,
  TipoContenido,
} from '@paes-pro/shared';
import { sql, aIso, aIsoONull } from '../db/client.js';
import { hoyChile, rachaVigente } from './usuarios.js';

/* --------------------------------------------------------------------------
 * Racha
 * -------------------------------------------------------------------------- */

export async function obtenerRacha(usuarioId: string): Promise<DTORacha> {
  const [u] = await sql<{ racha_actual: number; racha_maxima: number; ultima: string | null }[]>`
    select racha_actual, racha_maxima, to_char(ultima_actividad, 'YYYY-MM-DD') as ultima
      from usuarios where id = ${usuarioId}`;
  if (!u) return { actual: 0, maxima: 0, ultimaActividad: null, completoHoy: false };
  return {
    actual: rachaVigente(u.racha_actual, u.ultima),
    maxima: u.racha_maxima,
    ultimaActividad: u.ultima,
    completoHoy: u.ultima === hoyChile(),
  };
}

/* --------------------------------------------------------------------------
 * Tareas del plan
 * -------------------------------------------------------------------------- */

export interface FilaTarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: DTOTareaPlan['tipo'];
  estado: DTOTareaPlan['estado'];
  fecha: string;
  duracion_min: number;
  materia_codigo: string | null;
  contenido_slug: string | null;
  contenido_titulo: string | null;
  ensayo_slug: string | null;
  ensayo_titulo: string | null;
  completada_en: string | null;
}

export function mapearTarea(f: FilaTarea): DTOTareaPlan {
  return {
    id: f.id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    tipo: f.tipo,
    estado: f.estado,
    fechaPlanificada: f.fecha,
    duracionMin: f.duracion_min,
    materiaCodigo: f.materia_codigo,
    contenido: f.contenido_slug ? { slug: f.contenido_slug, titulo: f.contenido_titulo ?? f.titulo } : null,
    ensayo: f.ensayo_slug ? { slug: f.ensayo_slug, titulo: f.ensayo_titulo ?? f.titulo } : null,
    completadaEn: aIsoONull(f.completada_en),
  };
}

/** Tareas del usuario entre dos fechas (inclusive), de su plan activo. */
export async function tareasEntre(usuarioId: string, desde: string, hasta: string): Promise<DTOTareaPlan[]> {
  const filas = await sql<FilaTarea[]>`
    select t.id, t.titulo, t.descripcion, t.tipo, t.estado,
           to_char(t.fecha_planificada, 'YYYY-MM-DD') as fecha, t.duracion_min,
           m.codigo as materia_codigo, c.slug as contenido_slug, c.titulo as contenido_titulo,
           en.slug as ensayo_slug, en.titulo as ensayo_titulo, t.completada_en
      from tareas_plan t
      join planes_estudio p on p.id = t.plan_id and p.activo
      left join materias m on m.id = t.materia_id
      left join contenidos c on c.id = t.contenido_id
      left join ensayos en on en.id = t.ensayo_id
     where t.usuario_id = ${usuarioId}
       and t.fecha_planificada between ${desde} and ${hasta}
     order by t.fecha_planificada, t.created_at, t.id`;
  return filas.map(mapearTarea);
}

export async function tareaPorId(usuarioId: string, tareaId: string): Promise<DTOTareaPlan | null> {
  const [f] = await sql<FilaTarea[]>`
    select t.id, t.titulo, t.descripcion, t.tipo, t.estado,
           to_char(t.fecha_planificada, 'YYYY-MM-DD') as fecha, t.duracion_min,
           m.codigo as materia_codigo, c.slug as contenido_slug, c.titulo as contenido_titulo,
           en.slug as ensayo_slug, en.titulo as ensayo_titulo, t.completada_en
      from tareas_plan t
      left join materias m on m.id = t.materia_id
      left join contenidos c on c.id = t.contenido_id
      left join ensayos en on en.id = t.ensayo_id
     where t.usuario_id = ${usuarioId} and t.id = ${tareaId}`;
  return f ? mapearTarea(f) : null;
}

/* --------------------------------------------------------------------------
 * Plan activo
 * -------------------------------------------------------------------------- */

interface FilaPlan {
  id: string;
  horas_semana: number;
  semanas: number;
  fecha_inicio: string;
  fecha_examen: string | null;
  creado_en: string;
}

/** Plan activo con distribución; las tareas se piden aparte por rango. */
export async function planActivo(
  usuarioId: string,
): Promise<Omit<DTOPlan, 'tareas'> | null> {
  const [p] = await sql<FilaPlan[]>`
    select id, horas_semana, semanas, to_char(fecha_inicio, 'YYYY-MM-DD') as fecha_inicio,
           to_char(fecha_examen, 'YYYY-MM-DD') as fecha_examen, creado_en
      from planes_estudio
     where usuario_id = ${usuarioId} and activo
     order by creado_en desc limit 1`;
  if (!p) return null;

  const distribucion = await sql<{ codigo: string; nombre: string; area: Area; porcentaje: string; horas: string }[]>`
    select m.codigo, m.nombre, m.area, d.porcentaje, d.horas_semana as horas
      from plan_distribucion d join materias m on m.id = d.materia_id
     where d.plan_id = ${p.id}
     order by d.porcentaje desc`;

  return {
    id: p.id,
    horasSemana: p.horas_semana,
    semanas: p.semanas,
    fechaInicio: p.fecha_inicio,
    fechaExamen: p.fecha_examen,
    creadoEn: aIso(p.creado_en),
    distribucion: distribucion.map((d) => ({
      materiaCodigo: d.codigo,
      materiaNombre: d.nombre,
      area: d.area,
      porcentaje: Number(d.porcentaje),
      horasSemana: Number(d.horas),
    })),
  };
}

/* --------------------------------------------------------------------------
 * Contenidos
 * -------------------------------------------------------------------------- */

export interface FilaContenido {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoContenido | 'practica';
  duracion_min: number;
  premium: boolean;
  materia_id: string;
  materia_codigo: string;
  materia_nombre: string;
  materia_area: Area;
  eje_id: string | null;
  eje_codigo: string | null;
  eje_nombre: string | null;
  eje_descripcion: string | null;
  porcentaje: number | null;
  completado: boolean | null;
}

/** Columnas de contenido + progreso del usuario. Requiere alias c, m, e, pc. */
export function mapearContenido(f: FilaContenido): DTOContenido {
  return {
    id: f.id,
    slug: f.slug,
    titulo: f.titulo,
    descripcion: f.descripcion,
    // 'practica' es un valor nuevo del enum (migración 001); el DTO original
    // solo conocía video/pdf/mixto.
    tipo: f.tipo as TipoContenido,
    duracionMin: f.duracion_min,
    premium: f.premium,
    materia: { id: f.materia_id, codigo: f.materia_codigo, nombre: f.materia_nombre, area: f.materia_area },
    eje: f.eje_id
      ? { id: f.eje_id, codigo: f.eje_codigo!, nombre: f.eje_nombre!, descripcion: f.eje_descripcion }
      : null,
    porcentajeProgreso: f.porcentaje ?? 0,
    completado: Boolean(f.completado),
  };
}

/* --------------------------------------------------------------------------
 * Intentos
 * -------------------------------------------------------------------------- */

interface FilaIntentoResumen {
  id: string;
  slug: string;
  titulo: string;
  prueba: Prueba;
  estado: EstadoIntento;
  iniciado_en: string;
  entregado_en: string | null;
  correctas: number;
  incorrectas: number;
  omitidas: number;
  pct_logro: string;
  puntaje: number | null;
  percentil: string | null;
}

function mapearIntento(f: FilaIntentoResumen): DTOIntentoResumen {
  return {
    id: f.id,
    slug: f.slug,
    titulo: f.titulo,
    prueba: f.prueba,
    estado: f.estado,
    iniciadoEn: aIso(f.iniciado_en),
    entregadoEn: aIsoONull(f.entregado_en),
    correctas: f.correctas,
    incorrectas: f.incorrectas,
    omitidas: f.omitidas,
    pctLogro: Number(f.pct_logro),
    puntaje: f.puntaje,
    percentil: f.percentil === null ? null : Number(f.percentil),
  };
}

/** Intentos entregados del usuario, más recientes primero. */
export async function intentosEntregados(usuarioId: string, limite = 50): Promise<DTOIntentoResumen[]> {
  const filas = await sql<FilaIntentoResumen[]>`
    select id, slug, titulo, prueba, estado, iniciado_en, entregado_en, correctas, incorrectas,
           omitidas, pct_logro, puntaje, percentil
      from v_intentos_resumen
     where usuario_id = ${usuarioId} and estado in ('entregado', 'expirado')
     order by entregado_en desc nulls last
     limit ${limite}`;
  return filas.map(mapearIntento);
}

export function historialDe(intentos: DTOIntentoResumen[]): DTOPuntoHistorial[] {
  return intentos
    .filter((i) => i.puntaje !== null && i.entregadoEn)
    .map((i) => ({
      fecha: i.entregadoEn!,
      puntaje: i.puntaje!,
      pctLogro: i.pctLogro,
      prueba: i.prueba,
      intentoId: i.id,
    }))
    .reverse();
}

/** Promedio de los últimos `n` puntajes (null sin intentos). */
export function promedioUltimos(intentos: DTOIntentoResumen[], n = 3): number | null {
  const puntajes = intentos.filter((i) => i.puntaje !== null).slice(0, n).map((i) => i.puntaje!);
  if (puntajes.length === 0) return null;
  return Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);
}

export { semanaDe } from './calendario.js';
