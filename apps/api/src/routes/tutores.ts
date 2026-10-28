import type { DTOResena, DTOUsuario } from '@paes-pro/shared';
import { crearResenaSchema } from '@paes-pro/shared';
import { sql, aIso } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { conflicto, invalido, noEncontrado } from '../http/errores.js';
import { leerCuerpo, leerUuid } from '../http/validar.js';
import { obtenerUsuario } from '../services/usuarios.js';
import { aPublicacion, columnasPublicacion, joinsPublicacion, tutoresResumen, type FilaPublicacion } from '../services/comunidad.js';
import { notificar } from '../services/actividad.js';
import { identidadPublica } from '../services/seguridad.js';
import { limitarIntentos } from '../services/limite.js';

export const tutores = crearRouter();

tutores.use('*', requiereSesion);

tutores.get('/', async (c) => c.json(await tutoresResumen(usuarioDe(c).id)));

async function resenasDe(tutorId: string): Promise<DTOResena[]> {
  const filas = await sql<{ id: string; calificacion: number; comentario: string | null; autor: string; creado_en: unknown }[]>`
    select r.id, r.calificacion, r.comentario, u.nombre as autor, r.creado_en
      from resenas_tutor r join usuarios u on u.id = r.autor_id
     where r.tutor_id = ${tutorId} order by r.creado_en desc limit 20`;
  return filas.map((f) => ({
    id: f.id,
    calificacion: f.calificacion,
    comentario: f.comentario,
    autorNombre: f.autor,
    creadoEn: aIso(f.creado_en),
  }));
}

tutores.get('/:id', async (c) => {
  const { id: yo } = usuarioDe(c);
  const tutorId = leerUuid(c);
  const [tutor] = await tutoresResumen(yo, tutorId);
  if (!tutor) throw noEncontrado('Este perfil no existe o no es público.');

  const completo = await obtenerUsuario(tutorId);
  // De otra persona solo sale la identidad pública (lista blanca): nunca su
  // email, colegio, metas, horario ni suscripción.
  const usuario: DTOUsuario =
    tutorId === yo
      ? completo
      : {
          ...identidadPublica(completo),
          email: '',
          onboardingCompletado: true,
          esPremium: false,
          planActual: null,
          curso: null,
          colegio: null,
          carrera: null,
          universidad: null,
          puntajeMeta: null,
          fechaExamen: null,
          horasSemana: null,
          diasDisponibles: [],
          rachaActual: 0,
          rachaMaxima: 0,
          creadoEn: completo.creadoEn,
        };

  const [pp] = await sql<{ titulo: string | null; especialidad: string | null; bio: string | null; verificado: boolean; es_demo: boolean; rating_promedio: string; rating_cantidad: number; seguidores: number }[]>`
    select titulo, especialidad, bio, verificado, es_demo, rating_promedio, rating_cantidad, seguidores
      from perfiles_publicos where usuario_id = ${tutorId}`;
  const [impacto] = await sql<{ respuestas: number; likes: number; publicaciones: number }[]>`
    select
      (select count(*)::int from comentarios where usuario_id = ${tutorId} and not borrado) as respuestas,
      ((select coalesce(sum(votos), 0)::int from publicaciones where usuario_id = ${tutorId} and estado = 'visible')
       + (select count(*)::int from votos_comentario vc join comentarios c on c.id = vc.comentario_id
           where c.usuario_id = ${tutorId})) as likes,
      (select count(*)::int from publicaciones where usuario_id = ${tutorId} and estado = 'visible') as publicaciones`;
  const orden = c.req.query('orden') === 'populares' ? 'populares' : 'recientes';
  const publicaciones = await sql<FilaPublicacion[]>`
    select ${columnasPublicacion(yo)} ${joinsPublicacion()}
     where p.usuario_id = ${tutorId} and p.estado = 'visible'
     order by ${orden === 'populares' ? sql`p.votos desc, p.creado_en desc` : sql`p.creado_en desc`}
     limit 20`;

  return c.json({
    usuario,
    perfil: {
      titulo: pp?.titulo ?? null,
      especialidad: pp?.especialidad ?? null,
      bio: pp?.bio ?? null,
      verificado: pp?.verificado ?? false,
      demo: pp?.es_demo ?? false,
      ratingPromedio: Number(pp?.rating_promedio ?? 0),
      ratingCantidad: pp?.rating_cantidad ?? 0,
      seguidores: pp?.seguidores ?? 0,
    },
    impacto: impacto ?? { respuestas: 0, likes: 0, publicaciones: 0 },
    publicaciones: publicaciones.map(aPublicacion),
    loSigo: tutor.loSigo,
    resenas: await resenasDe(tutorId),
    tutor,
  });
});

tutores.post('/:id/seguir', async (c) => {
  const { id: yo } = usuarioDe(c);
  limitarIntentos(`seguir:${yo}`, 30, 1);
  const tutorId = leerUuid(c);
  if (tutorId === yo) throw invalido('No puedes seguirte a ti mismo.');
  const [existe] = await sql<{ nombre: string }[]>`
    select u.nombre from usuarios u join perfiles_publicos p on p.usuario_id = u.id
     where u.id = ${tutorId} and u.eliminado_en is null`;
  if (!existe) throw noEncontrado('Este perfil ya no existe.');

  const borrados = await sql`delete from seguidores where seguidor_id = ${yo} and seguido_id = ${tutorId} returning 1`;
  let loSigo = false;
  if (borrados.length === 0) {
    await sql`insert into seguidores (seguidor_id, seguido_id) values (${yo}, ${tutorId}) on conflict do nothing`;
    loSigo = true;
    const [me] = await sql<{ nombre: string }[]>`select nombre from usuarios where id = ${yo}`;
    await notificar(tutorId, {
      tipo: 'sistema',
      titulo: `${me?.nombre ?? 'Alguien'} comenzó a seguirte`,
      url: `/app/tutores/${tutorId}`,
    });
  }
  const [pp] = await sql<{ seguidores: number }[]>`select seguidores from perfiles_publicos where usuario_id = ${tutorId}`;
  return c.json({ loSigo, seguidores: pp?.seguidores ?? 0 });
});

tutores.post('/:id/resenas', async (c) => {
  const { id: yo } = usuarioDe(c);
  limitarIntentos(`resenar:${yo}`, 5, 60);
  const tutorId = leerUuid(c);
  if (tutorId === yo) throw invalido('No puedes reseñarte a ti mismo.');
  const datos = await leerCuerpo(c, crearResenaSchema);
  const [tutor] = await sql`
    select 1 from perfiles_publicos p join usuarios u on u.id = p.usuario_id
     where u.id = ${tutorId} and u.eliminado_en is null and (p.verificado or u.rol = 'profesor')`;
  if (!tutor) throw noEncontrado('Este perfil no es público.');
  const filas = await sql<{ id: string }[]>`
    insert into resenas_tutor (tutor_id, autor_id, calificacion, comentario)
    values (${tutorId}, ${yo}, ${datos.calificacion}, ${datos.comentario ?? null})
    on conflict (tutor_id, autor_id) do nothing returning id`;
  if (filas.length === 0) throw conflicto('Ya dejaste una reseña para este tutor.');
  const [r] = (await resenasDe(tutorId)).filter((x) => x.id === filas[0]!.id);
  return c.json(r, 201);
});
