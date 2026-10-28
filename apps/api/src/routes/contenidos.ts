import type {
  DTOBibliotecaContenidos,
  DTOContenidoLeccion,
  DTOLeccionUnidad,
  DTOMaterial,
  DTOPregunta,
  DTOProgresoContenido,
  DTOResultadoMiniTest,
  NivelDificultad,
} from '@paes-pro/shared';
import { contenidosQueryCompletaSchema, progresoContenidoSchema, respuestasMiniTestSchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { invalido, noEncontrado } from '../http/errores.js';
import { leerCuerpo, leerQuery, leerUuid } from '../http/validar.js';
import { mapearContenido, obtenerRacha, type FilaContenido } from '../services/consultas.js';
import { esPremium } from '../services/usuarios.js';
import { estadosLecciones } from '../services/calendario.js';
import { registrarActividad } from '../services/actividad.js';

export const contenidos = crearRouter();

contenidos.use('*', requiereSesion);

/** Patrón ILIKE escapado. */
function patron(q: string): string {
  return `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
}

contenidos.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const f = leerQuery(c, contenidosQueryCompletaSchema);
  const materia = f.materia ?? null;
  const tipo = f.tipo ?? null;
  const estado = f.estado ?? null;
  const q = f.q ? patron(f.q) : null;

  const filas = await sql<(FilaContenido & { iniciado_en: string | null })[]>`
    select c.id, c.slug, c.titulo, c.descripcion, c.tipo, c.duracion_min, c.premium,
           m.id as materia_id, m.codigo as materia_codigo, m.nombre as materia_nombre, m.area as materia_area,
           e.id as eje_id, e.codigo as eje_codigo, e.nombre as eje_nombre, e.descripcion as eje_descripcion,
           pc.porcentaje, pc.completado, pc.iniciado_en
      from contenidos c
      join materias m on m.id = c.materia_id
      left join ejes e on e.id = c.eje_id
      left join progreso_contenido pc on pc.contenido_id = c.id and pc.usuario_id = ${id}
     where c.activo
       and (${materia}::text is null or m.codigo = ${materia}::text or m.area = ${materia}::text)
       and (${tipo}::text is null or c.tipo::text = ${tipo}::text)
       and (${q}::text is null or unaccent(c.titulo) ilike unaccent(${q}::text)
            or unaccent(coalesce(c.descripcion, '')) ilike unaccent(${q}::text))
       and (${estado}::text is null
            or (${estado}::text = 'completado' and coalesce(pc.completado, false))
            or (${estado}::text = 'en_curso' and not coalesce(pc.completado, false) and coalesce(pc.porcentaje, 0) > 0)
            or (${estado}::text = 'pendiente' and pc.contenido_id is null))
     order by array_position(array['M1','M2','CL','BIO','FIS','QUI','HIST'], m.codigo),
              coalesce(c.unidad, ''), c.orden, c.titulo`;

  // "Continuar donde quedaste": la lección empezada más reciente sin terminar.
  const [continuar] = await sql<FilaContenido[]>`
    select c.id, c.slug, c.titulo, c.descripcion, c.tipo, c.duracion_min, c.premium,
           m.id as materia_id, m.codigo as materia_codigo, m.nombre as materia_nombre, m.area as materia_area,
           e.id as eje_id, e.codigo as eje_codigo, e.nombre as eje_nombre, e.descripcion as eje_descripcion,
           pc.porcentaje, pc.completado
      from progreso_contenido pc
      join contenidos c on c.id = pc.contenido_id and c.activo
      join materias m on m.id = c.materia_id
      left join ejes e on e.id = c.eje_id
     where pc.usuario_id = ${id} and not pc.completado
     order by pc.iniciado_en desc limit 1`;

  const respuesta: DTOBibliotecaContenidos = {
    items: filas.map(mapearContenido),
    continuar: continuar ? mapearContenido(continuar) : null,
  };
  return c.json(respuesta);
});

interface FilaDetalle extends FilaContenido {
  cuerpo_md: string | null;
  puntos_clave: string[];
  video_url: string | null;
  material_urls: string[];
  unidad: string | null;
}

/** Lecciones de la misma unidad (o del mismo eje si no hay unidad), en orden. */
async function leccionesDeUnidad(usuarioId: string, d: FilaDetalle) {
  return sql<{ id: string; slug: string; titulo: string; duracion_min: number; tipo: DTOLeccionUnidad['tipo']; completado: boolean | null }[]>`
    select c.id, c.slug, c.titulo, c.duracion_min, c.tipo, pc.completado
      from contenidos c
      left join progreso_contenido pc on pc.contenido_id = c.id and pc.usuario_id = ${usuarioId}
     where c.activo and c.materia_id = ${d.materia_id}
       and (case when ${d.unidad}::text is not null then c.unidad = ${d.unidad}::text
                 when ${d.eje_id}::uuid is not null then c.unidad is null and c.eje_id = ${d.eje_id}::uuid
                 else c.unidad is null and c.eje_id is null end)
     order by c.orden, c.titulo`;
}

function nombreArchivo(url: string): string {
  const base = decodeURIComponent(url.split('?')[0]!.split('/').pop() ?? 'Material');
  return base.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/^\w/, (l) => l.toUpperCase());
}

contenidos.get('/:slug', async (c) => {
  const { id } = usuarioDe(c);
  const slug = c.req.param('slug');
  const [d] = await sql<FilaDetalle[]>`
    select c.id, c.slug, c.titulo, c.descripcion, c.tipo, c.duracion_min, c.premium,
           m.id as materia_id, m.codigo as materia_codigo, m.nombre as materia_nombre, m.area as materia_area,
           e.id as eje_id, e.codigo as eje_codigo, e.nombre as eje_nombre, e.descripcion as eje_descripcion,
           pc.porcentaje, pc.completado, c.cuerpo_md, c.puntos_clave, c.video_url, c.material_urls, c.unidad
      from contenidos c
      join materias m on m.id = c.materia_id
      left join ejes e on e.id = c.eje_id
      left join progreso_contenido pc on pc.contenido_id = c.id and pc.usuario_id = ${id}
     where c.slug = ${slug} and c.activo`;
  if (!d) throw noEncontrado('Esta lección no existe o fue retirada. Vuelve a la biblioteca.');

  const bloqueadoPorPlan = d.premium && !(await esPremium(id));
  const lecciones = await leccionesDeUnidad(id, d);
  const estados = estadosLecciones(lecciones, d.slug);
  const posicion = lecciones.findIndex((l) => l.slug === d.slug);
  const anterior = posicion > 0 ? lecciones[posicion - 1]! : null;
  const siguiente = posicion >= 0 && posicion < lecciones.length - 1 ? lecciones[posicion + 1]! : null;

  const materiales: DTOMaterial[] = bloqueadoPorPlan
    ? []
    : (d.material_urls ?? []).map((url) => ({
        nombre: nombreArchivo(url),
        url,
        tipo: /\.pdf($|\?)/i.test(url) ? 'pdf' : 'enlace',
      }));

  const respuesta: DTOContenidoLeccion = {
    ...mapearContenido(d),
    cuerpoMd: bloqueadoPorPlan ? '' : (d.cuerpo_md ?? ''),
    puntosClave: d.puntos_clave ?? [],
    videoUrl: bloqueadoPorPlan ? null : d.video_url,
    anterior: anterior ? { slug: anterior.slug, titulo: anterior.titulo } : null,
    siguiente: siguiente ? { slug: siguiente.slug, titulo: siguiente.titulo } : null,
    unidad: {
      nombre: d.unidad ?? d.eje_nombre ?? d.materia_nombre,
      lecciones: lecciones.map((l, i) => ({
        slug: l.slug,
        titulo: l.titulo,
        duracionMin: l.duracion_min,
        tipo: l.tipo,
        estado: estados[i]!,
      })),
    },
    materiales,
    bloqueadoPorPlan,
  };
  return c.json(respuesta);
});

contenidos.put('/:id/progreso', async (c) => {
  const usuario = usuarioDe(c);
  const contenidoId = leerUuid(c);
  const { porcentaje } = await leerCuerpo(c, progresoContenidoSchema);

  const [d] = await sql<FilaDetalle[]>`
    select c.id, c.slug, c.titulo, c.premium, c.materia_id, c.eje_id, c.unidad,
           m.nombre as materia_nombre, e.nombre as eje_nombre
      from contenidos c join materias m on m.id = c.materia_id left join ejes e on e.id = c.eje_id
     where c.id = ${contenidoId} and c.activo`;
  if (!d) throw noEncontrado('Esta lección no existe o fue retirada.');
  if (d.premium && !(await esPremium(usuario.id))) {
    throw invalido('Esta lección es Premium. Mejora tu plan para registrar tu avance.');
  }

  const [previo] = await sql<{ completado: boolean }[]>`
    select completado from progreso_contenido where usuario_id = ${usuario.id} and contenido_id = ${contenidoId}`;

  // El progreso nunca retrocede: si ya vio el 80 %, volver al inicio no lo baja.
  const [p] = await sql<{ porcentaje: number; completado: boolean }[]>`
    insert into progreso_contenido (usuario_id, contenido_id, porcentaje, completado, completado_en)
    values (${usuario.id}, ${contenidoId}, ${porcentaje}, ${porcentaje >= 100},
            ${porcentaje >= 100 ? new Date().toISOString() : null})
    on conflict (usuario_id, contenido_id) do update
       set porcentaje = greatest(progreso_contenido.porcentaje, excluded.porcentaje),
           completado = progreso_contenido.completado or excluded.completado,
           completado_en = coalesce(progreso_contenido.completado_en, excluded.completado_en)
    returning porcentaje, completado`;

  if (p!.completado && !previo?.completado) {
    await registrarActividad(usuario.id, 'contenido');
    // Marca como completada la tarea del plan que apuntaba a esta lección.
    await sql`
      update tareas_plan set estado = 'completada', completada_en = now(), actualizado_en = now()
       where usuario_id = ${usuario.id} and contenido_id = ${contenidoId}
         and estado in ('pendiente', 'en_curso')
         and fecha_planificada <= current_date + 7`;
  }

  const lecciones = await leccionesDeUnidad(usuario.id, d);
  const posicion = lecciones.findIndex((l) => l.id === contenidoId);
  const siguiente = posicion >= 0 && posicion < lecciones.length - 1 ? lecciones[posicion + 1]! : null;

  const respuesta: DTOProgresoContenido = {
    porcentaje: p!.porcentaje,
    completado: p!.completado,
    siguiente: siguiente ? { slug: siguiente.slug, titulo: siguiente.titulo } : null,
    racha: await obtenerRacha(usuario.id),
  };
  return c.json(respuesta);
});

/* --------------------------------------------------------------------------
 * Mini-test: 3 preguntas del mismo eje de la lección
 * -------------------------------------------------------------------------- */

interface FilaPreguntaMini {
  id: string;
  tipo: 'multiple' | 'comprension_lectora';
  enunciado: string;
  texto_base: string | null;
  difficulty: number;
  eje_id: string | null;
  eje_nombre: string | null;
  materia_codigo: string;
}

contenidos.get('/:id/mini-test', async (c) => {
  usuarioDe(c);
  const contenidoId = leerUuid(c);
  const [d] = await sql<{ materia_id: string; eje_id: string | null }[]>`
    select materia_id, eje_id from contenidos where id = ${contenidoId} and activo`;
  if (!d) throw noEncontrado('Esta lección no existe o fue retirada.');

  // Primero del mismo eje; si faltan, se completa con la misma materia.
  const preguntas = await sql<FilaPreguntaMini[]>`
    select p.id, p.tipo, p.enunciado, p.texto_base, p.difficulty, p.eje_id, e.nombre as eje_nombre,
           m.codigo as materia_codigo
      from preguntas p
      join materias m on m.id = p.materia_id
      left join ejes e on e.id = p.eje_id
     where p.activo and p.materia_id = ${d.materia_id} and p.tipo = 'multiple'
     order by (p.eje_id is not distinct from ${d.eje_id}::uuid) desc, random()
     limit 3`;
  if (preguntas.length === 0) {
    throw noEncontrado('Todavía no hay preguntas de práctica para esta lección.');
  }

  const ids = preguntas.map((p) => p.id);
  const alternativas = await sql<{ id: string; pregunta_id: string; texto: string; posicion: number }[]>`
    select id, pregunta_id, texto, posicion from alternativas where pregunta_id = any(${ids}::uuid[])
     order by posicion`;

  const respuesta: DTOPregunta[] = preguntas.map((p, i) => ({
    id: p.id,
    posicion: i + 1,
    tipo: p.tipo,
    enunciado: p.enunciado,
    textoBase: p.texto_base,
    dificultad: Math.min(5, Math.max(1, p.difficulty)) as NivelDificultad,
    ejeId: p.eje_id,
    ejeNombre: p.eje_nombre,
    materiaCodigo: p.materia_codigo,
    alternativas: alternativas
      .filter((a) => a.pregunta_id === p.id)
      .map((a) => ({ id: a.id, texto: a.texto, posicion: a.posicion })),
    respuestaActual: null,
  }));
  return c.json(respuesta);
});

contenidos.post('/:id/mini-test', async (c) => {
  const usuario = usuarioDe(c);
  const contenidoId = leerUuid(c);
  const { respuestas } = await leerCuerpo(c, respuestasMiniTestSchema);
  const [existe] = await sql`select 1 from contenidos where id = ${contenidoId} and activo`;
  if (!existe) throw noEncontrado('Esta lección no existe o fue retirada.');

  const ids = respuestas.map((r) => r.preguntaId);
  const filas = await sql<{ pregunta_id: string; correcta_id: string; explicacion: string | null }[]>`
    select p.id as pregunta_id, a.id as correcta_id, p.explicacion
      from preguntas p join alternativas a on a.pregunta_id = p.id and a.es_correcta
     where p.id = any(${ids}::uuid[])`;
  const porPregunta = new Map(filas.map((f) => [f.pregunta_id, f]));

  const detalle: DTOResultadoMiniTest['detalle'] = [];
  for (const r of respuestas) {
    const f = porPregunta.get(r.preguntaId);
    if (!f) throw invalido('Una de las preguntas ya no existe. Vuelve a abrir el mini-test.');
    const esCorrecta = r.alternativaId === f.correcta_id;
    detalle.push({
      preguntaId: r.preguntaId,
      esCorrecta,
      alternativaCorrectaId: f.correcta_id,
      tuRespuestaId: r.alternativaId,
      explicacion: f.explicacion ?? '',
    });
    if (!esCorrecta) {
      await sql`
        insert into cuaderno_errores (usuario_id, pregunta_id, origen)
        values (${usuario.id}, ${r.preguntaId}, 'mini_test')
        on conflict (usuario_id, pregunta_id) do update
           set caja = 1, proximo_repaso = current_date + 1, dominada = false, actualizado_en = now()`;
    }
  }

  await registrarActividad(usuario.id, 'contenido');
  // Responder el mini-test cuenta como haber trabajado la lección.
  await sql`
    insert into progreso_contenido (usuario_id, contenido_id, porcentaje)
    values (${usuario.id}, ${contenidoId}, 50)
    on conflict (usuario_id, contenido_id) do nothing`;

  const respuesta: DTOResultadoMiniTest = {
    correctas: detalle.filter((d) => d.esCorrecta).length,
    total: detalle.length,
    detalle,
  };
  return c.json(respuesta);
});
