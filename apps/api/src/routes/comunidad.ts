import type { DTOBusquedaComunidad, DTODestacadosComunidad, DTOPublicacionCompleta, PaginaCursor, DTOPublicacionFeed } from '@paes-pro/shared';
import {
  buscarComunidadSchema,
  crearComentarioSchema,
  crearPublicacionSchema,
  feedQuerySchema,
  reportarSchema,
} from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { invalido, noEncontrado, prohibido } from '../http/errores.js';
import { codificarCursor, decodificarCursor, leerCuerpo, leerQuery, leerUuid } from '../http/validar.js';
import {
  aPublicacion,
  columnasPublicacion,
  comentariosDe,
  joinsPublicacion,
  publicacionPorId,
  tutoresResumen,
  type FilaPublicacion,
} from '../services/comunidad.js';
import { contarEtiquetas } from '../services/etiquetas.js';
import { notificar, otorgarLogro, registrarActividad } from '../services/actividad.js';
import { guardarImagen } from '../services/archivos.js';
import { limitarIntentos } from '../services/limite.js';
import { bodyLimit } from 'hono/body-limit';
import { HttpError } from '../http/errores.js';
import { z } from 'zod';

export const comunidad = crearRouter();

comunidad.use('*', requiereSesion);
comunidad.use('*', bodyLimit({ maxSize: 4 * 1024 * 1024 + 64 * 1024, onError: () => { throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'La solicitud supera el tamaño permitido.'); } }));
comunidad.use('*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    limitarIntentos(`comunidad:acciones:${usuarioDe(c).id}`, 60, 1);
  }
  await next();
});

/** Marcadores del término resaltado en la búsqueda (el cliente los convierte en <mark>). */
export const MARCA_INICIO = '⟦';
export const MARCA_FIN = '⟧';

/* --------------------------------------------------------------------------
 * Feed
 * -------------------------------------------------------------------------- */

comunidad.get('/publicaciones', async (c) => {
  const { id } = usuarioDe(c);
  const q = leerQuery(c, feedQuerySchema);

  const filtros = sql`
    p.estado = 'visible'
    ${q.materia ? sql`and m.codigo = ${q.materia}` : sql``}
    ${q.tipo ? sql`and p.tipo = ${q.tipo}` : sql``}
    ${q.orden === 'sin_responder' ? sql`and not exists (select 1 from comentarios c2 where c2.publicacion_id = p.id and not c2.borrado)` : sql``}
    ${q.orden === 'siguiendo' ? sql`and exists (select 1 from seguidores s where s.seguidor_id = ${id} and s.seguido_id = p.usuario_id)` : sql``}`;

  let filas: FilaPublicacion[];
  let siguiente: string | null = null;

  if (q.orden === 'populares') {
    // Populares: orden por votos con cursor de desplazamiento.
    const offset = q.cursor ? Number(Buffer.from(q.cursor, 'base64url').toString()) : 0;
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) throw invalido('El cursor de paginación no es válido.');
    filas = await sql<FilaPublicacion[]>`
      select ${columnasPublicacion(id)} ${joinsPublicacion()}
       where ${filtros}
       order by p.votos desc, p.creado_en desc, p.id desc
       limit ${q.limite + 1} offset ${offset}`;
    if (filas.length > q.limite) siguiente = Buffer.from(String(offset + q.limite)).toString('base64url');
  } else {
    const cursor = decodificarCursor(q.cursor);
    filas = await sql<FilaPublicacion[]>`
      select ${columnasPublicacion(id)} ${joinsPublicacion()}
       where ${filtros}
         ${cursor ? sql`and (p.creado_en, p.id) < (${cursor.fecha}::timestamptz, ${cursor.id}::uuid)` : sql``}
       order by p.creado_en desc, p.id desc
       limit ${q.limite + 1}`;
    if (filas.length > q.limite) {
      const ultimo = filas[q.limite - 1]!;
      siguiente = codificarCursor(new Date(ultimo.creado_en as string).toISOString(), ultimo.id);
    }
  }

  const items = filas.slice(0, q.limite).map(aPublicacion);
  const pagina: PaginaCursor<DTOPublicacionFeed> = { items, nextCursor: siguiente, hasMore: siguiente !== null };
  return c.json(pagina);
});

comunidad.post('/publicaciones', async (c) => {
  const { id } = usuarioDe(c);
  limitarIntentos(`publicar:${id}`, 10, 60);
  const datos = await leerCuerpo(c, crearPublicacionSchema);
  if (datos.materiaId) {
    const [m] = await sql`select 1 from materias where id = ${datos.materiaId}`;
    if (!m) throw invalido('La materia elegida no existe.', { materiaId: 'No existe' });
  }
  const [fila] = await sql<{ id: string }[]>`
    insert into publicaciones (usuario_id, materia_id, tipo, titulo, cuerpo)
    values (${id}, ${datos.materiaId ?? null}, ${datos.tipo}, ${datos.titulo}, ${datos.cuerpo})
    returning id`;
  await registrarActividad(id, 'comunidad');
  await otorgarLogro(id, 'primer_aporte');
  return c.json(await publicacionPorId(fila!.id, id), 201);
});

comunidad.get('/publicaciones/:id', async (c) => {
  const { id: usuarioId, rol } = usuarioDe(c);
  const pubId = leerUuid(c);
  const base = await publicacionPorId(pubId, usuarioId);
  if (!base || (base.estado === 'oculta' && base.autor.id !== usuarioId && rol !== 'admin')) {
    throw noEncontrado('Esta publicación ya no está disponible. Vuelve al feed de la comunidad.');
  }
  const { arbol, total } = await comentariosDe(pubId, usuarioId);
  const { comentarios: _n, ...resto } = base;
  const soyAutor = base.autor.id === usuarioId;
  const dto: DTOPublicacionCompleta = {
    ...resto,
    comentarios: arbol,
    totalComentarios: total,
    soyAutor,
    puedeMarcarMejor: soyAutor && base.tipo === 'duda',
    oculto: base.estado === 'oculta',
  };
  return c.json(dto);
});

comunidad.post('/publicaciones/:id/voto', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const pubId = leerUuid(c);
  const [pub] = await sql<{ usuario_id: string; titulo: string }[]>`
    select usuario_id, titulo from publicaciones where id = ${pubId} and estado = 'visible'`;
  if (!pub) throw noEncontrado('Esta publicación ya no está disponible.');

  const borrados = await sql`delete from votos where publicacion_id = ${pubId} and usuario_id = ${usuarioId} returning 1`;
  let meGusta = false;
  if (borrados.length === 0) {
    await sql`insert into votos (publicacion_id, usuario_id) values (${pubId}, ${usuarioId}) on conflict do nothing`;
    meGusta = true;
    if (pub.usuario_id !== usuarioId) {
      const agrupador = `like:${pubId}`;
      const [pendiente] = await sql`
        select 1 from notificaciones where usuario_id = ${pub.usuario_id} and agrupador = ${agrupador} and not leida`;
      if (!pendiente) {
        await notificar(pub.usuario_id, {
          tipo: 'like',
          titulo: 'A alguien le gustó tu publicación',
          cuerpo: pub.titulo,
          url: `/app/comunidad/${pubId}`,
          agrupador,
        });
      }
    }
  }
  const [v] = await sql<{ votos: number }[]>`select votos from publicaciones where id = ${pubId}`;
  return c.json({ meGusta, likes: v?.votos ?? 0 });
});

comunidad.post('/publicaciones/:id/guardar', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const pubId = leerUuid(c);
  const [pub] = await sql`select 1 from publicaciones where id = ${pubId} and estado = 'visible'`;
  if (!pub) throw noEncontrado('Esta publicación ya no está disponible.');
  const borrados = await sql`delete from guardados where publicacion_id = ${pubId} and usuario_id = ${usuarioId} returning 1`;
  if (borrados.length > 0) return c.json({ guardada: false });
  await sql`insert into guardados (usuario_id, publicacion_id) values (${usuarioId}, ${pubId}) on conflict do nothing`;
  return c.json({ guardada: true });
});

/* --------------------------------------------------------------------------
 * Comentarios
 * -------------------------------------------------------------------------- */

comunidad.post('/publicaciones/:id/comentarios', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const pubId = leerUuid(c);
  limitarIntentos(`comentar:${usuarioId}`, 30, 10);
  const datos = await leerCuerpo(c, crearComentarioSchema);

  const [pub] = await sql<{ usuario_id: string; titulo: string }[]>`
    select usuario_id, titulo from publicaciones where id = ${pubId} and estado = 'visible'`;
  if (!pub) throw noEncontrado('Esta publicación ya no está disponible.');

  // Un solo nivel de anidación: responder a una respuesta cuelga del padre.
  let respondeA: string | null = null;
  let autorPadre: string | null = null;
  if (datos.respondeAId) {
    const [padre] = await sql<{ id: string; responde_a_id: string | null; usuario_id: string }[]>`
      select id, responde_a_id, usuario_id from comentarios where id = ${datos.respondeAId} and publicacion_id = ${pubId} and not borrado`;
    if (!padre) throw invalido('El comentario al que respondes ya no existe.');
    respondeA = padre.responde_a_id ?? padre.id;
    autorPadre = padre.usuario_id;
  }

  const [fila] = await sql<{ id: string }[]>`
    insert into comentarios (publicacion_id, usuario_id, responde_a_id, cuerpo)
    values (${pubId}, ${usuarioId}, ${respondeA}, ${datos.cuerpo})
    returning id`;

  if (pub.usuario_id !== usuarioId) {
    await notificar(pub.usuario_id, {
      tipo: 'comentario',
      titulo: 'Nuevo comentario en tu publicación',
      cuerpo: pub.titulo,
      url: `/app/comunidad/${pubId}`,
    });
  }
  if (autorPadre && autorPadre !== usuarioId && autorPadre !== pub.usuario_id) {
    await notificar(autorPadre, {
      tipo: 'respuesta',
      titulo: 'Respondieron tu comentario',
      cuerpo: pub.titulo,
      url: `/app/comunidad/${pubId}`,
    });
  }
  await registrarActividad(usuarioId, 'comunidad');

  const { plano } = await comentariosDe(pubId, usuarioId, fila!.id);
  return c.json(plano.get(fila!.id), 201);
});

comunidad.post('/comentarios/:id/voto', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const comId = leerUuid(c);
  const [com] = await sql`
    select 1 from comentarios c join publicaciones p on p.id = c.publicacion_id
     where c.id = ${comId} and not c.borrado and p.estado = 'visible'`;
  if (!com) throw noEncontrado('Ese comentario ya no existe.');
  const borrados = await sql`delete from votos_comentario where comentario_id = ${comId} and usuario_id = ${usuarioId} returning 1`;
  if (borrados.length === 0) {
    await sql`insert into votos_comentario (comentario_id, usuario_id) values (${comId}, ${usuarioId}) on conflict do nothing`;
  }
  const [n] = await sql<{ n: number }[]>`select count(*)::int as n from votos_comentario where comentario_id = ${comId}`;
  return c.json({ meGusta: borrados.length === 0, likes: n?.n ?? 0 });
});

comunidad.post('/comentarios/:id/mejor', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const comId = leerUuid(c);
  const [com] = await sql<{ publicacion_id: string; autor_pub: string; usuario_id: string }[]>`
    select c.publicacion_id, p.usuario_id as autor_pub, c.usuario_id
      from comentarios c join publicaciones p on p.id = c.publicacion_id
     where c.id = ${comId} and not c.borrado and p.estado = 'visible' and p.tipo = 'duda'`;
  if (!com) throw noEncontrado('Ese comentario ya no existe.');
  if (com.autor_pub !== usuarioId) throw prohibido('Solo quien hizo la pregunta puede elegir la mejor respuesta.');

  await sql.begin(async (tx) => {
    await tx`update comentarios set es_mejor = false where publicacion_id = ${com.publicacion_id} and es_mejor`;
    await tx`update comentarios set es_mejor = true where id = ${comId}`;
  });
  if (com.usuario_id !== usuarioId) {
    await notificar(com.usuario_id, {
      tipo: 'respuesta',
      titulo: 'Tu respuesta fue elegida como la mejor',
      url: `/app/comunidad/${com.publicacion_id}`,
    });
  }
  return c.json({ ok: true });
});

/* --------------------------------------------------------------------------
 * Búsqueda, destacados, reportes, imágenes
 * -------------------------------------------------------------------------- */

comunidad.get('/buscar', async (c) => {
  const { id } = usuarioDe(c);
  const q = leerQuery(c, buscarComunidadSchema);
  const intervalo = q.desde === 'semana' ? '7 days' : q.desde === 'mes' ? '30 days' : q.desde === 'anio' ? '365 days' : null;
  const patron = `%${q.q.replace(/[%_\\]/g, (s) => `\\${s}`)}%`;
  const opciones = `StartSel=${MARCA_INICIO}, StopSel=${MARCA_FIN}, MaxWords=35, MinWords=12, ShortWord=2, HighlightAll=false`;
  const opcionesTitulo = `StartSel=${MARCA_INICIO}, StopSel=${MARCA_FIN}, HighlightAll=true`;

  const filas = await sql<(FilaPublicacion & { rango: number })[]>`
    with consulta as (select websearch_to_tsquery('spanish', ${q.q}) as tq)
    select ${columnasPublicacion(id)},
           ts_headline('spanish', p.titulo, consulta.tq, ${opcionesTitulo}) as titulo_resaltado,
           ts_headline('spanish', p.cuerpo, consulta.tq, ${opciones}) as cuerpo_resaltado,
           ts_rank(p.busqueda, consulta.tq) as rango
      ${joinsPublicacion()}, consulta
     where p.estado = 'visible'
       and (p.busqueda @@ consulta.tq or p.titulo ilike ${patron} or p.cuerpo ilike ${patron})
       ${q.materia ? sql`and m.codigo = ${q.materia}` : sql``}
       ${q.tipo ? sql`and p.tipo = ${q.tipo}` : sql``}
       ${intervalo ? sql`and p.creado_en >= now() - ${intervalo}::interval` : sql``}
     order by rango desc, p.votos desc, p.creado_en desc
     limit 50`;

  // ts_headline no resalta coincidencias parciales (ilike): se marcan aquí.
  const marcar = (texto: string) => {
    if (texto.includes(MARCA_INICIO)) return texto;
    const i = texto.toLocaleLowerCase('es').indexOf(q.q.toLocaleLowerCase('es'));
    return i === -1 ? texto : `${texto.slice(0, i)}${MARCA_INICIO}${texto.slice(i, i + q.q.length)}${MARCA_FIN}${texto.slice(i + q.q.length)}`;
  };
  const items = filas.map((f) => {
    const p = aPublicacion(f);
    return { ...p, resaltado: { titulo: marcar(p.resaltado?.titulo ?? p.titulo), cuerpo: marcar(p.resaltado?.cuerpo ?? '') } };
  });
  const dto: DTOBusquedaComunidad = { items, total: items.length };
  return c.json(dto);
});

comunidad.get('/destacados', async (c) => {
  const { id } = usuarioDe(c);
  const anuncios = await sql<FilaPublicacion[]>`
    select ${columnasPublicacion(id)} ${joinsPublicacion()}
     where p.estado = 'visible' and u.rol = 'admin'
     order by p.creado_en desc limit 3`;
  const tutores = (await tutoresResumen(id)).slice(0, 4);
  const recientes = await sql<{ titulo: string; cuerpo: string }[]>`
    select titulo, cuerpo from publicaciones where estado = 'visible' order by creado_en desc limit 200`;
  const dto: DTODestacadosComunidad = {
    anuncios: anuncios.map(aPublicacion),
    tutores,
    temasPopulares: contarEtiquetas(recientes, 8),
  };
  return c.json(dto);
});

comunidad.post('/reportes', async (c) => {
  const { id } = usuarioDe(c);
  limitarIntentos(`reportar:${id}`, 10, 60);
  const datos = await leerCuerpo(c, reportarSchema);
  const [objetivo] = datos.publicacionId
    ? await sql`select 1 from publicaciones where id = ${datos.publicacionId} and estado = 'visible'`
    : await sql`select 1 from comentarios c join publicaciones p on p.id = c.publicacion_id
        where c.id = ${datos.comentarioId!} and not c.borrado and p.estado = 'visible'`;
  if (!objetivo) throw noEncontrado('El contenido ya no está disponible.');
  await sql.begin(async (tx) => {
    // Un único reporte pendiente por usuario/objeto, también con peticiones simultáneas.
    await tx`select pg_advisory_xact_lock(hashtext(${`reporte:${id}:${datos.publicacionId ?? datos.comentarioId}`}))`;
    await tx`
      insert into reportes (reportante_id, publicacion_id, comentario_id, motivo)
      select ${id}, ${datos.publicacionId ?? null}, ${datos.comentarioId ?? null}, ${datos.motivo}
       where not exists (select 1 from reportes where reportante_id = ${id} and estado = 'pendiente'
         and (publicacion_id = ${datos.publicacionId ?? null} or comentario_id = ${datos.comentarioId ?? null}))`;
  });
  return c.json({ ok: true }, 201);
});

/** Moderación explícita: ser profesor no concede privilegios de administración. */
comunidad.get('/moderacion/reportes', async (c) => {
  if (usuarioDe(c).rol !== 'admin') throw prohibido();
  const filas = await sql`
    select r.id, r.publicacion_id as "publicacionId", r.comentario_id as "comentarioId",
           r.motivo, r.estado, r.creado_en as "creadoEn",
           p.titulo, coalesce(com.cuerpo, p.cuerpo) as cuerpo
      from reportes r left join comentarios com on com.id = r.comentario_id
      left join publicaciones p on p.id = coalesce(r.publicacion_id, com.publicacion_id)
     where r.estado = 'pendiente' order by r.creado_en asc limit 50`;
  return c.json({ items: filas });
});

comunidad.patch('/moderacion/reportes/:id', async (c) => {
  if (usuarioDe(c).rol !== 'admin') throw prohibido();
  const reporteId = leerUuid(c);
  const { accion } = await leerCuerpo(c, z.object({ accion: z.enum(['ocultar', 'descartar']) }).strict());
  await sql.begin(async (tx) => {
    const [reporte] = await tx<{ publicacion_id: string | null; comentario_id: string | null; estado: string }[]>`
      select publicacion_id, comentario_id, estado from reportes where id = ${reporteId} for update`;
    if (!reporte) throw noEncontrado('El reporte ya no existe.');
    if (reporte.estado !== 'pendiente') return;
    if (accion === 'ocultar') {
      if (reporte.publicacion_id) await tx`update publicaciones set estado = 'oculta' where id = ${reporte.publicacion_id} and estado = 'visible'`;
      if (reporte.comentario_id) await tx`update comentarios set borrado = true where id = ${reporte.comentario_id}`;
    }
    await tx`update reportes set estado = ${accion === 'ocultar' ? 'revisado' : 'descartado'} where id = ${reporteId}`;
  });
  return c.json({ ok: true });
});

comunidad.post('/imagenes', async (c) => {
  const { id } = usuarioDe(c);
  limitarIntentos(`imagen:${id}`, 20, 60);
  const form = await c.req.formData().catch(() => null);
  if (!form) throw invalido('Envía la imagen como multipart/form-data en el campo "archivo".');
  const url = await guardarImagen(form.get('archivo'), 4 * 1024 * 1024);
  return c.json({ url }, 201);
});
