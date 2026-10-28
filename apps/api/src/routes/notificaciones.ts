import type { DTOCentroNotificaciones, DTONotificacion, DTOResumenNotificaciones, TipoNotificacion } from '@paes-pro/shared';
import { notificacionesQuerySchema } from '@paes-pro/shared';
import { sql, aIso } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { codificarCursor, decodificarCursor, leerQuery, leerUuid } from '../http/validar.js';

export const notificaciones = crearRouter();

notificaciones.use('*', requiereSesion);

interface FilaNotificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
  leida: boolean;
  creado_en: unknown;
}

const aDTO = (f: FilaNotificacion): DTONotificacion => ({
  id: f.id,
  tipo: f.tipo,
  titulo: f.titulo,
  cuerpo: f.cuerpo,
  url: f.url,
  leida: f.leida,
  creadoEn: aIso(f.creado_en),
});

async function noLeidas(usuarioId: string): Promise<number> {
  const [n] = await sql<{ n: number }[]>`
    select count(*)::int as n from notificaciones where usuario_id = ${usuarioId} and not leida`;
  return n?.n ?? 0;
}

notificaciones.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const q = leerQuery(c, notificacionesQuerySchema);
  const cursor = decodificarCursor(q.cursor);
  const filas = await sql<FilaNotificacion[]>`
    select id, tipo, titulo, cuerpo, url, leida, creado_en from notificaciones
     where usuario_id = ${id}
       ${q.soloNoLeidas ? sql`and not leida` : sql``}
       ${cursor ? sql`and (creado_en, id) < (${cursor.fecha}::timestamptz, ${cursor.id}::uuid)` : sql``}
     order by creado_en desc, id desc
     limit ${q.limite + 1}`;
  const hasMore = filas.length > q.limite;
  const items = filas.slice(0, q.limite);
  const ultimo = items.at(-1);
  const dto: DTOCentroNotificaciones = {
    items: items.map(aDTO),
    nextCursor: hasMore && ultimo ? codificarCursor(aIso(ultimo.creado_en), ultimo.id) : null,
    hasMore,
    noLeidas: await noLeidas(id),
  };
  return c.json(dto);
});

notificaciones.get('/resumen', async (c) => {
  const { id } = usuarioDe(c);
  const filas = await sql<FilaNotificacion[]>`
    select id, tipo, titulo, cuerpo, url, leida, creado_en from notificaciones
     where usuario_id = ${id} order by creado_en desc limit 5`;
  const dto: DTOResumenNotificaciones = { noLeidas: await noLeidas(id), recientes: filas.map(aDTO) };
  return c.json(dto);
});

notificaciones.post('/leer-todas', async (c) => {
  const { id } = usuarioDe(c);
  await sql`update notificaciones set leida = true where usuario_id = ${id} and not leida`;
  return c.body(null, 204);
});

notificaciones.post('/:id/leer', async (c) => {
  const { id } = usuarioDe(c);
  await sql`update notificaciones set leida = true where id = ${leerUuid(c)} and usuario_id = ${id}`;
  return c.body(null, 204);
});
