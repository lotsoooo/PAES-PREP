import type { DTOLogro, DTOPerfilPropio, DTOPublicacionFeed, Rol, TipoPublicacion, Area } from '@paes-pro/shared';
import { sql, aIso, aIsoONull } from '../db/client.js';
import { intentosEntregados } from './consultas.js';
import { obtenerUsuario } from './usuarios.js';

interface FilaPublicacion {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: TipoPublicacion;
  estado: 'visible' | 'oculta' | 'eliminada';
  resuelta: boolean;
  mejor_respuesta_id: string | null;
  creado_en: string;
  actualizado_en: string;
  autor_id: string;
  autor_nombre: string;
  autor_apellido: string | null;
  autor_avatar: string | null;
  autor_rol: Rol;
  autor_verificado: boolean | null;
  materia_id: string | null;
  materia_codigo: string | null;
  materia_nombre: string | null;
  materia_area: Area | null;
  likes: number;
  comentarios: number;
  me_gusta: boolean;
  guardada: boolean;
}

/** Hashtags `#palabra` del cuerpo, sin repetir y en minúsculas. */
export function extraerEtiquetas(texto: string): string[] {
  const encontradas = texto.match(/#[\p{L}\p{N}_]{2,40}/gu) ?? [];
  return [...new Set(encontradas.map((e) => e.slice(1).toLowerCase()))].slice(0, 8);
}

function mapearPublicacion(f: FilaPublicacion): DTOPublicacionFeed {
  return {
    id: f.id,
    titulo: f.titulo,
    cuerpo: f.cuerpo,
    tipo: f.tipo,
    estado: f.estado,
    resuelta: f.resuelta,
    mejorRespuestaId: f.mejor_respuesta_id,
    creadoEn: aIso(f.creado_en),
    actualizadoEn: aIso(f.actualizado_en),
    autor: {
      id: f.autor_id,
      nombre: [f.autor_nombre, f.autor_apellido].filter(Boolean).join(' '),
      avatarUrl: f.autor_avatar,
      rol: f.autor_rol,
      esTutorVerificado: Boolean(f.autor_verificado),
    },
    materia: f.materia_id
      ? { id: f.materia_id, codigo: f.materia_codigo!, nombre: f.materia_nombre!, area: f.materia_area! }
      : null,
    likes: f.likes,
    comentarios: f.comentarios,
    meGusta: f.me_gusta,
    resaltado: null,
    guardada: f.guardada,
    etiquetas: extraerEtiquetas(f.cuerpo),
  };
}

/** Publicaciones del autor o guardadas por el usuario (máx. 10). */
async function publicacionesDe(usuarioId: string, modo: 'propias' | 'guardadas'): Promise<DTOPublicacionFeed[]> {
  const filas = await sql<FilaPublicacion[]>`
    select p.id, p.titulo, p.cuerpo, p.tipo, p.estado, p.resuelta, p.mejor_respuesta_id,
           p.creado_en, p.actualizado_en,
           u.id as autor_id, u.nombre as autor_nombre, u.apellido as autor_apellido,
           u.avatar_url as autor_avatar, u.rol as autor_rol, pp.verificado as autor_verificado,
           m.id as materia_id, m.codigo as materia_codigo, m.nombre as materia_nombre, m.area as materia_area,
           p.votos as likes,
           (select count(*)::int from comentarios co where co.publicacion_id = p.id and not co.borrado) as comentarios,
           exists (select 1 from votos v where v.publicacion_id = p.id and v.usuario_id = ${usuarioId}) as me_gusta,
           exists (select 1 from guardados g where g.publicacion_id = p.id and g.usuario_id = ${usuarioId}) as guardada
      from publicaciones p
      join usuarios u on u.id = p.usuario_id
      left join perfiles_publicos pp on pp.usuario_id = u.id
      left join materias m on m.id = p.materia_id
     where p.estado = 'visible'
       and (case when ${modo}::text = 'propias' then p.usuario_id = ${usuarioId}
                 else exists (select 1 from guardados g2 where g2.publicacion_id = p.id and g2.usuario_id = ${usuarioId}) end)
     order by p.creado_en desc
     limit 10`;
  return filas.map(mapearPublicacion);
}

export async function logrosDe(usuarioId: string): Promise<DTOLogro[]> {
  const filas = await sql<{ codigo: string; nombre: string; descripcion: string; icono: string; obtenido_en: string | null }[]>`
    select l.codigo, l.nombre, l.descripcion, l.icono, lu.obtenido_en
      from logros l
      left join logros_usuario lu on lu.logro_codigo = l.codigo and lu.usuario_id = ${usuarioId}
     order by (lu.obtenido_en is null), l.orden`;
  return filas.map((f) => ({
    codigo: f.codigo,
    nombre: f.nombre,
    descripcion: f.descripcion,
    icono: f.icono,
    obtenidoEn: aIsoONull(f.obtenido_en),
  }));
}

export async function perfilPropio(usuarioId: string): Promise<DTOPerfilPropio> {
  const [usuario, intentos, logros, publicaciones, guardados, resumen] = await Promise.all([
    obtenerUsuario(usuarioId),
    intentosEntregados(usuarioId, 50),
    logrosDe(usuarioId),
    publicacionesDe(usuarioId, 'propias'),
    publicacionesDe(usuarioId, 'guardadas'),
    sql<{ preguntas: number; correctas: number; incorrectas: number; minutos_ensayos: string | null; minutos_contenidos: number | null }[]>`
      select (select count(*)::int from respuestas r join intentos i on i.id = r.intento_id
               where i.usuario_id = ${usuarioId} and i.estado in ('entregado', 'expirado') and r.alternativa_id is not null) as preguntas,
             (select coalesce(sum(correctas), 0)::int from intentos where usuario_id = ${usuarioId} and estado in ('entregado', 'expirado')) as correctas,
             (select coalesce(sum(incorrectas), 0)::int from intentos where usuario_id = ${usuarioId} and estado in ('entregado', 'expirado')) as incorrectas,
             (select sum(least(extract(epoch from (entregado_en - iniciado_en)) / 60, duracion_min))
                from intentos where usuario_id = ${usuarioId} and estado in ('entregado', 'expirado') and entregado_en is not null) as minutos_ensayos,
             (select coalesce(sum(c.duracion_min), 0)::int from progreso_contenido pc
                join contenidos c on c.id = pc.contenido_id
               where pc.usuario_id = ${usuarioId} and pc.completado) as minutos_contenidos`,
  ]);

  const r = resumen[0]!;
  const puntajes = intentos.filter((i) => i.puntaje !== null).map((i) => i.puntaje!);
  const respondidas = r.correctas + r.incorrectas;

  return {
    usuario,
    resumen: {
      ensayos: intentos.length,
      mejorPuntaje: puntajes.length ? Math.max(...puntajes) : null,
      promedioPuntaje: puntajes.length ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length) : null,
      preguntasRespondidas: r.preguntas,
      precision: respondidas > 0 ? Math.round((r.correctas / respondidas) * 1000) / 10 : null,
      minutosEstudio: Math.round(Number(r.minutos_ensayos ?? 0)) + (r.minutos_contenidos ?? 0),
    },
    logros,
    ultimosIntentos: intentos.slice(0, 5),
    publicaciones,
    guardados,
  };
}
