import type { DTOEstadisticasCompletas, DTOPuntoHistorial, DTOPrecisionEje } from '@paes-pro/shared';
import { estadisticasQuerySchema, etiquetaPrecision, TIEMPO_RECOMENDADO_SEGUNDOS } from '@paes-pro/shared';
import { sql, aIso } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { leerQuery } from '../http/validar.js';
import { esPremium } from '../services/usuarios.js';

export const estadisticas = crearRouter();

estadisticas.use('*', requiereSesion);

const promedio = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

estadisticas.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const { periodo, prueba } = leerQuery(c, estadisticasQuerySchema);
  const premium = await esPremium(id);
  const filtroPrueba = prueba ? sql`and e.prueba = ${prueba}` : sql``;

  // Todos los intentos entregados (más recientes primero).
  const intentos = await sql<{ id: string; prueba: string; puntaje: number; pct_logro: string; entregado_en: unknown }[]>`
    select i.id, e.prueba, i.puntaje, i.pct_logro, i.entregado_en
      from intentos i join ensayos e on e.id = i.ensayo_id
     where i.usuario_id = ${id} and i.estado in ('entregado', 'expirado') and i.puntaje is not null ${filtroPrueba}
     order by i.entregado_en desc`;

  const recientes = intentos.slice(0, 3).map((i) => i.puntaje);
  const previos = intentos.slice(3, 6).map((i) => i.puntaje);
  const actual = promedio(recientes);
  const tendencia = actual !== null && previos.length > 0 ? actual - promedio(previos)! : null;

  const [u] = await sql<{ puntaje_meta: number | null }[]>`select puntaje_meta from usuarios where id = ${id}`;
  const meta = u?.puntaje_meta ?? null;

  // Último puntaje por prueba.
  const porPrueba: Record<string, number> = {};
  for (const i of intentos) if (!(i.prueba in porPrueba)) porPrueba[i.prueba] = i.puntaje;

  // Historial agrupado por semana (12 semanas) o por mes (12 meses).
  const unidad = periodo === 'semanal' ? 'week' : 'month';
  const ventana = periodo === 'semanal' ? '84 days' : '365 days';
  const grupos = await sql<{ grupo: unknown; puntaje: string; pct: string; ultimo: string; prueba: string }[]>`
    select date_trunc(${unidad}, i.entregado_en at time zone 'America/Santiago') as grupo,
           avg(i.puntaje) as puntaje, avg(i.pct_logro) as pct,
           (array_agg(i.id order by i.entregado_en desc))[1] as ultimo,
           case when count(distinct e.prueba) = 1 then min(e.prueba) else 'VARIAS' end as prueba
      from intentos i join ensayos e on e.id = i.ensayo_id
     where i.usuario_id = ${id} and i.estado in ('entregado', 'expirado') and i.puntaje is not null
       and i.entregado_en >= now() - ${ventana}::interval ${filtroPrueba}
     group by 1 order by 1`;
  const historial: DTOPuntoHistorial[] = grupos.map((g) => ({
    fecha: aIso(g.grupo),
    puntaje: Math.round(Number(g.puntaje)),
    pctLogro: Math.round(Number(g.pct) * 10) / 10,
    prueba: g.prueba,
    intentoId: g.ultimo,
  }));

  // Tiempo promedio por pregunta respondida en la ventana.
  const [tiempo] = await sql<{ prom: string | null }[]>`
    select avg(r.tiempo_segundos) as prom
      from respuestas r join intentos i on i.id = r.intento_id join ensayos e on e.id = i.ensayo_id
     where i.usuario_id = ${id} and i.estado in ('entregado', 'expirado') and r.alternativa_id is not null
       and r.tiempo_segundos > 0 and i.entregado_en >= now() - ${ventana}::interval ${filtroPrueba}`;
  let tiempoPromedio = tiempo?.prom ? Math.round(Number(tiempo.prom)) : 0;
  if (!tiempoPromedio && intentos.length) {
    const [alt] = await sql<{ prom: string | null }[]>`
      select avg(extract(epoch from (i.entregado_en - i.iniciado_en)) / nullif(e.preguntas_count, 0)) as prom
        from intentos i join ensayos e on e.id = i.ensayo_id
       where i.usuario_id = ${id} and i.estado in ('entregado', 'expirado') ${filtroPrueba}`;
    tiempoPromedio = alt?.prom ? Math.round(Number(alt.prom)) : 0;
  }

  // Precisión por eje con todos los intentos entregados.
  const ejes = await sql<{ eje_id: string; nombre: string; materia_codigo: string; total: number; correctas: number }[]>`
    select re.eje_id, ej.nombre, m.codigo as materia_codigo,
           sum(re.total)::int as total, sum(re.correctas)::int as correctas
      from resultados_eje re
      join intentos i on i.id = re.intento_id and i.estado in ('entregado', 'expirado')
      join ensayos e on e.id = i.ensayo_id
      join ejes ej on ej.id = re.eje_id
      join materias m on m.id = ej.materia_id
     where i.usuario_id = ${id} and re.total > 0 ${filtroPrueba}
     group by re.eje_id, ej.nombre, m.codigo
     order by m.codigo, ej.nombre`;
  const precisionPorEje: DTOPrecisionEje[] = ejes.map((e) => {
    const precision = e.total ? Math.round((e.correctas / e.total) * 1000) / 10 : 0;
    return {
      ejeId: e.eje_id,
      ejeNombre: e.nombre,
      materiaCodigo: e.materia_codigo,
      total: e.total,
      correctas: e.correctas,
      precision,
      etiqueta: etiquetaPrecision(precision),
    };
  });

  let actividad: DTOEstadisticasCompletas['actividad'] = null;
  let erroresPorEje: DTOEstadisticasCompletas['erroresPorEje'] = null;
  if (premium) {
    const dias = await sql<{ fecha: string; cantidad: number }[]>`
      select to_char(fecha, 'YYYY-MM-DD') as fecha, sum(cantidad)::int as cantidad from (
        select fecha, cantidad from actividad_diaria
         where usuario_id = ${id} and fecha >= current_date - 90
        union all
        select (entregado_en at time zone 'America/Santiago')::date as fecha, 1 as cantidad
          from intentos where usuario_id = ${id} and estado in ('entregado', 'expirado')
           and entregado_en >= now() - interval '90 days'
      ) a group by fecha order by fecha`;
    actividad = dias;

    const errores = await sql<{ nombre: string; materia_codigo: string; dificultad: number; errores: number }[]>`
      select ej.nombre, m.codigo as materia_codigo, p.difficulty as dificultad, count(*)::int as errores
        from respuestas r
        join intentos i on i.id = r.intento_id and i.estado in ('entregado', 'expirado')
        join ensayos e on e.id = i.ensayo_id
        join preguntas p on p.id = r.pregunta_id
        join materias m on m.id = p.materia_id
        join ejes ej on ej.id = p.eje_id
        join alternativas a on a.id = r.alternativa_id and not a.es_correcta
       where i.usuario_id = ${id} ${filtroPrueba}
       group by ej.nombre, m.codigo, p.difficulty
       order by errores desc`;
    erroresPorEje = errores.map((e) => ({
      ejeNombre: e.nombre,
      materiaCodigo: e.materia_codigo,
      dificultad: e.dificultad,
      errores: e.errores,
    }));
  }

  const dto: DTOEstadisticasCompletas = {
    puntajeActual: actual ?? 0,
    puntajeMeta: meta,
    distanciaMeta: meta !== null && actual !== null ? meta - actual : null,
    porPrueba,
    tiempoPromedioPregunta: tiempoPromedio,
    tiempoRecomendado: TIEMPO_RECOMENDADO_SEGUNDOS,
    historial,
    precisionPorEje,
    totalIntentos: intentos.length,
    periodo,
    prediccion: {
      puntaje: actual,
      meta,
      porcentajeMeta: actual !== null && meta ? Math.min(100, Math.round((actual / meta) * 100)) : null,
    },
    tendencia,
    esPremium: premium,
    actividad,
    erroresPorEje,
  };
  return c.json(dto);
});
