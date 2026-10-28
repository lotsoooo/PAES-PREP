import type {
  DTOAutor,
  DTOComentarioSocial,
  DTOPublicacionFeed,
  DTOTutorResumen,
  Rol,
  TipoPublicacion,
} from '@paes-pro/shared';
import { sql, aIso } from '../db/client.js';
import { extraerEtiquetas } from './etiquetas.js';

/** Columnas comunes de una publicación con su autor y contadores. */
export const columnasPublicacion = (usuarioId: string) => sql`
  p.id, p.titulo, p.cuerpo, p.tipo, p.estado, p.resuelta, p.mejor_respuesta_id, p.creado_en,
  p.actualizado_en, p.votos,
  u.id as autor_id, trim(u.nombre || ' ' || coalesce(u.apellido, '')) as autor_nombre,
  u.avatar_url as autor_avatar, u.rol as autor_rol, coalesce(pp.verificado, false) as autor_verificado,
  m.id as materia_id, m.codigo as materia_codigo, m.nombre as materia_nombre, m.area as materia_area,
  (select count(*)::int from comentarios c where c.publicacion_id = p.id and not c.borrado) as n_comentarios,
  exists (select 1 from votos v where v.publicacion_id = p.id and v.usuario_id = ${usuarioId}) as me_gusta,
  exists (select 1 from guardados g where g.publicacion_id = p.id and g.usuario_id = ${usuarioId}) as guardada`;

export const joinsPublicacion = () => sql`
  from publicaciones p
  join usuarios u on u.id = p.usuario_id
  left join perfiles_publicos pp on pp.usuario_id = u.id
  left join materias m on m.id = p.materia_id`;

export interface FilaPublicacion {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: TipoPublicacion;
  estado: 'visible' | 'oculta' | 'eliminada';
  resuelta: boolean;
  mejor_respuesta_id: string | null;
  creado_en: unknown;
  actualizado_en: unknown;
  votos: number;
  autor_id: string;
  autor_nombre: string;
  autor_avatar: string | null;
  autor_rol: Rol;
  autor_verificado: boolean;
  materia_id: string | null;
  materia_codigo: string | null;
  materia_nombre: string | null;
  materia_area: 'matematicas' | 'lenguaje' | 'ciencias' | 'historia' | null;
  n_comentarios: number;
  me_gusta: boolean;
  guardada: boolean;
  titulo_resaltado?: string | null;
  cuerpo_resaltado?: string | null;
}

export function aAutor(f: { autor_id: string; autor_nombre: string; autor_avatar: string | null; autor_rol: Rol; autor_verificado: boolean }): DTOAutor {
  return {
    id: f.autor_id,
    nombre: f.autor_nombre,
    avatarUrl: f.autor_avatar,
    rol: f.autor_rol,
    esTutorVerificado: f.autor_verificado,
  };
}

export function aPublicacion(f: FilaPublicacion): DTOPublicacionFeed {
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
    autor: aAutor(f),
    materia:
      f.materia_id && f.materia_codigo && f.materia_nombre && f.materia_area
        ? { id: f.materia_id, codigo: f.materia_codigo, nombre: f.materia_nombre, area: f.materia_area }
        : null,
    likes: f.votos,
    comentarios: f.n_comentarios,
    meGusta: f.me_gusta,
    resaltado:
      f.titulo_resaltado != null || f.cuerpo_resaltado != null
        ? { titulo: f.titulo_resaltado ?? f.titulo, cuerpo: f.cuerpo_resaltado ?? '' }
        : null,
    guardada: f.guardada,
    etiquetas: extraerEtiquetas(f.titulo, f.cuerpo),
  };
}

export async function publicacionPorId(id: string, usuarioId: string): Promise<DTOPublicacionFeed | null> {
  const [f] = await sql<FilaPublicacion[]>`
    select ${columnasPublicacion(usuarioId)} ${joinsPublicacion()}
     where p.id = ${id} and p.estado <> 'eliminada'`;
  return f ? aPublicacion(f) : null;
}

interface FilaComentario {
  id: string;
  cuerpo: string;
  creado_en: unknown;
  es_mejor: boolean;
  borrado: boolean;
  responde_a_id: string | null;
  autor_id: string;
  autor_nombre: string;
  autor_avatar: string | null;
  autor_rol: Rol;
  autor_verificado: boolean;
  likes: number;
  me_gusta: boolean;
}

export async function comentariosDe(publicacionId: string, usuarioId: string, soloId?: string): Promise<{
  arbol: DTOComentarioSocial[];
  total: number;
  plano: Map<string, DTOComentarioSocial>;
}> {
  const filas = await sql<FilaComentario[]>`
    select c.id, c.cuerpo, c.creado_en, c.es_mejor, c.borrado, c.responde_a_id,
           u.id as autor_id, trim(u.nombre || ' ' || coalesce(u.apellido, '')) as autor_nombre,
           u.avatar_url as autor_avatar, u.rol as autor_rol, coalesce(pp.verificado, false) as autor_verificado,
           (select count(*)::int from votos_comentario vc where vc.comentario_id = c.id) as likes,
           exists (select 1 from votos_comentario vc where vc.comentario_id = c.id and vc.usuario_id = ${usuarioId}) as me_gusta
      from comentarios c
      join usuarios u on u.id = c.usuario_id
      left join perfiles_publicos pp on pp.usuario_id = u.id
     where c.publicacion_id = ${publicacionId} ${soloId ? sql`and c.id = ${soloId}` : sql``}
     order by c.es_mejor desc, c.creado_en asc`;

  const plano = new Map<string, DTOComentarioSocial>();
  for (const f of filas) {
    plano.set(f.id, {
      id: f.id,
      cuerpo: f.borrado ? 'Comentario eliminado.' : f.cuerpo,
      creadoEn: aIso(f.creado_en),
      esMejor: f.es_mejor,
      autor: aAutor(f),
      respuestas: [],
      likes: f.likes,
      meGusta: f.me_gusta,
    });
  }
  const arbol: DTOComentarioSocial[] = [];
  for (const f of filas) {
    const nodo = plano.get(f.id)!;
    const padre = f.responde_a_id ? plano.get(f.responde_a_id) : undefined;
    if (padre) padre.respuestas.push(nodo);
    else arbol.push(nodo);
  }
  return { arbol, total: filas.filter((f) => !f.borrado).length, plano };
}

export async function tutoresResumen(usuarioId: string, soloId?: string): Promise<DTOTutorResumen[]> {
  const filas = await sql<{
    id: string; nombre: string; avatar_url: string | null; titulo: string | null; especialidad: string | null;
    verificado: boolean; es_demo: boolean; rating_promedio: string; seguidores: number; lo_sigo: boolean;
  }[]>`
    select u.id, trim(u.nombre || ' ' || coalesce(u.apellido, '')) as nombre, u.avatar_url,
           pp.titulo, pp.especialidad, pp.verificado, pp.es_demo, pp.rating_promedio, pp.seguidores,
           exists (select 1 from seguidores s where s.seguidor_id = ${usuarioId} and s.seguido_id = u.id) as lo_sigo
      from perfiles_publicos pp join usuarios u on u.id = pp.usuario_id
     where u.eliminado_en is null
       ${soloId ? sql`and u.id = ${soloId}` : sql`and (pp.verificado or u.rol = 'profesor')`}
     order by pp.verificado desc, pp.rating_promedio desc, pp.seguidores desc`;
  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    avatarUrl: f.avatar_url,
    titulo: f.titulo,
    especialidad: f.especialidad,
    verificado: f.verificado,
    demo: f.es_demo,
    ratingPromedio: Number(f.rating_promedio),
    seguidores: f.seguidores,
    loSigo: f.lo_sigo,
  }));
}
