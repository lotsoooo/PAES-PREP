import type { DTOAreaMejorar, DTODashboardCompleto, DTORecomendacionCard } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { historialDe, intentosEntregados, obtenerRacha, promedioUltimos, tareasEntre } from '../services/consultas.js';
import { hoyChile, obtenerUsuario } from '../services/usuarios.js';

export const dashboard = crearRouter();

dashboard.use('*', requiereSesion);

/** Umbral bajo el cual un eje entra en "Áreas a mejorar". */
const UMBRAL_MEJORAR = 70;
/** Bajo este porcentaje la prioridad es alta. */
const UMBRAL_ALTA = 50;

const ETIQUETA_TIPO: Record<string, string> = {
  video: 'Video',
  pdf: 'Guía PDF',
  mixto: 'Lección',
  practica: 'Práctica',
};

/** Precisión por eje en los últimos `n` intentos entregados. */
async function areasAMejorar(usuarioId: string, n = 3): Promise<{ areas: DTOAreaMejorar[]; analizados: number }> {
  const ultimos = await sql<{ id: string }[]>`
    select id from intentos where usuario_id = ${usuarioId} and estado in ('entregado', 'expirado')
     order by entregado_en desc limit ${n}`;
  if (ultimos.length === 0) return { areas: [], analizados: 0 };

  const ids = ultimos.map((u) => u.id);
  const filas = await sql<{ eje_id: string; eje_nombre: string; materia_codigo: string; precision: string; contenido_slug: string | null }[]>`
    select re.eje_id, e.nombre as eje_nombre, m.codigo as materia_codigo,
           round(sum(re.correctas)::numeric * 100 / nullif(sum(re.total), 0), 1) as precision,
           (select c.slug from contenidos c
              left join progreso_contenido pc on pc.contenido_id = c.id and pc.usuario_id = ${usuarioId}
             where c.eje_id = re.eje_id and c.activo
             order by coalesce(pc.completado, false), c.premium, c.orden limit 1) as contenido_slug
      from resultados_eje re
      join ejes e on e.id = re.eje_id
      join materias m on m.id = e.materia_id
     where re.intento_id = any(${ids}::uuid[]) and re.total > 0
     group by re.eje_id, e.nombre, m.codigo
     having sum(re.correctas)::numeric * 100 / nullif(sum(re.total), 0) < ${UMBRAL_MEJORAR}
     order by precision asc
     limit 3`;

  return {
    analizados: ultimos.length,
    areas: filas.map((f) => {
      const precision = Number(f.precision);
      return {
        ejeId: f.eje_id,
        ejeNombre: f.eje_nombre,
        materiaCodigo: f.materia_codigo,
        precision,
        prioridad: precision < UMBRAL_ALTA ? 'alta' : 'en_proceso',
        contenidoSlug: f.contenido_slug,
      };
    }),
  };
}

async function recomendar(
  usuarioId: string,
  esPremium: boolean,
  repasoHoy: number,
  areas: DTOAreaMejorar[],
  tieneIntentos: boolean,
): Promise<DTORecomendacionCard | null> {
  if (repasoHoy > 0) {
    return {
      tipo: 'repaso',
      titulo: 'Repasa tus errores de hoy',
      descripcion: 'Vuelve a responder las preguntas que fallaste, justo cuando toca repasarlas para no olvidarlas.',
      url: '/app/repaso',
      detalle: `${repasoHoy} ${repasoHoy === 1 ? 'pregunta' : 'preguntas'} por repasar`,
      motivo: 'El repaso espaciado fija lo aprendido mejor que estudiar todo de nuevo.',
      materiaCodigo: null,
    };
  }

  for (const area of areas) {
    const [c] = await sql<{ slug: string; titulo: string; descripcion: string | null; duracion_min: number; tipo: string }[]>`
      select c.slug, c.titulo, c.descripcion, c.duracion_min, c.tipo
        from contenidos c
        left join progreso_contenido pc on pc.contenido_id = c.id and pc.usuario_id = ${usuarioId}
       where c.eje_id = ${area.ejeId} and c.activo and not coalesce(pc.completado, false)
         and (${esPremium} or not c.premium)
       order by c.orden limit 1`;
    if (c) {
      return {
        tipo: 'contenido',
        titulo: c.titulo,
        descripcion: c.descripcion ?? `Lección de ${area.ejeNombre}.`,
        url: `/app/contenidos/${c.slug}`,
        detalle: `${ETIQUETA_TIPO[c.tipo] ?? 'Lección'} · ${c.duracion_min} min`,
        motivo: `Tu precisión en ${area.ejeNombre} es de ${Math.round(area.precision)} % en tus últimos ensayos.`,
        materiaCodigo: area.materiaCodigo,
      };
    }
  }

  // Sin intentos: el diagnóstico. Con intentos: el ensayo accesible menos rendido.
  const [e] = await sql<{ slug: string; titulo: string; descripcion: string | null; preguntas_count: number; duracion_min: number; materia_codigo: string; es_diagnostico: boolean }[]>`
    select en.slug, en.titulo, en.descripcion, en.preguntas_count, en.duracion_min,
           m.codigo as materia_codigo, en.es_diagnostico
      from ensayos en
      join materias m on m.id = en.materia_id
     where en.activo and en.preguntas_count > 0 and (${esPremium} or not en.premium)
     order by (case when ${tieneIntentos} then 0 else (case when en.es_diagnostico then 0 else 1 end) end),
              (select count(*) from intentos i where i.ensayo_id = en.id and i.usuario_id = ${usuarioId}),
              en.es_diagnostico desc, en.titulo
     limit 1`;
  if (!e) return null;
  return {
    tipo: 'ensayo',
    titulo: e.titulo,
    descripcion: e.descripcion ?? 'Ensayo cronometrado con el formato de la PAES.',
    url: `/app/ensayos/${e.slug}`,
    detalle: `${e.preguntas_count} preguntas · ${e.duracion_min} min`,
    motivo: tieneIntentos
      ? 'Es el ensayo que menos has practicado.'
      : 'Parte por medir tu nivel: con este resultado ajustamos tu plan.',
    materiaCodigo: e.materia_codigo,
  };
}

dashboard.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const hoy = hoyChile();
  const inicioMes = `${hoy.slice(0, 7)}-01`;

  const [usuario, racha, intentos, mejorar, tareasHoy, conteos] = await Promise.all([
    obtenerUsuario(id),
    obtenerRacha(id),
    intentosEntregados(id, 20),
    areasAMejorar(id),
    tareasEntre(id, hoy, hoy),
    sql<{ ensayos_mes: number; repaso_hoy: number; limite: number | null }[]>`
      select (select count(*)::int from intentos
               where usuario_id = ${id} and estado in ('entregado', 'expirado')
                 and (entregado_en at time zone 'America/Santiago')::date >= ${inicioMes}::date) as ensayos_mes,
             (select count(*)::int from cuaderno_errores
               where usuario_id = ${id} and not dominada and proximo_repaso <= ${hoy}::date) as repaso_hoy,
             (select ensayos_mes from planes_suscripcion where codigo = 'basico') as limite`,
  ]);

  const k = conteos[0]!;
  const actual = promedioUltimos(intentos, 3);
  const meta = usuario.puntajeMeta;

  const respuesta: DTODashboardCompleto = {
    usuario: {
      nombre: usuario.nombre,
      rachaActual: racha.actual,
      puntajeMeta: meta,
      esPremium: usuario.esPremium,
      fechaExamen: usuario.fechaExamen,
      carrera: usuario.carrera?.nombre ?? null,
    },
    racha,
    recomendado: await recomendar(id, usuario.esPremium, k.repaso_hoy, mejorar.areas, intentos.length > 0),
    objetivo: {
      actual,
      meta,
      brecha: actual !== null && meta !== null ? meta - actual : null,
    },
    ensayosMes: k.ensayos_mes,
    limiteEnsayosMes: usuario.esPremium ? null : k.limite,
    areasMejorar: mejorar.areas,
    intentosAnalizados: mejorar.analizados,
    tareasHoy,
    historial: historialDe(intentos.slice(0, 10)),
    repasoHoy: k.repaso_hoy,
    ultimoIntento: intentos[0] ?? null,
  };
  return c.json(respuesta);
});
