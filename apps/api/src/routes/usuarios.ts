import type { DTOPreferencias, Tema } from '@paes-pro/shared';
import { actualizarPerfilCompletoSchema, actualizarPreferenciasSchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { invalido } from '../http/errores.js';
import { leerCuerpo } from '../http/validar.js';
import { obtenerUsuario } from '../services/usuarios.js';
import { logrosDe, perfilPropio } from '../services/perfil.js';
import { guardarImagen } from '../services/archivos.js';
import { HttpError } from '../http/errores.js';
import { bodyLimit } from 'hono/body-limit';
import { limitarIntentos } from '../services/limite.js';

export const usuarios = crearRouter();

usuarios.use('*', requiereSesion);
usuarios.use('*', bodyLimit({ maxSize: 2 * 1024 * 1024 + 64 * 1024, onError: () => { throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'La solicitud supera el tamaño permitido.'); } }));

usuarios.get('/perfil', async (c) => c.json(await perfilPropio(usuarioDe(c).id)));

usuarios.patch('/perfil', async (c) => {
  const { id } = usuarioDe(c);
  const d = await leerCuerpo(c, actualizarPerfilCompletoSchema);

  if (d.colegioId) {
    const [existe] = await sql`select 1 from colegios where id = ${d.colegioId} and activo`;
    if (!existe) throw invalido('Ese colegio no está en el listado. Búscalo de nuevo.', { colegioId: 'No existe' });
  }

  // Solo se actualizan las claves presentes; null borra el valor.
  const cambios: Record<string, unknown> = {};
  if (d.nombre !== undefined) cambios.nombre = d.nombre;
  if (d.apellido !== undefined) cambios.apellido = d.apellido || null;
  if (d.curso !== undefined) cambios.curso = d.curso || null;
  if (d.colegioId !== undefined) cambios.colegio_id = d.colegioId;
  if (d.puntajeMeta !== undefined) cambios.puntaje_meta = d.puntajeMeta;

  if (Object.keys(cambios).length > 0) {
    await sql`update usuarios set ${sql(cambios)} where id = ${id}`;
  }
  return c.json(await obtenerUsuario(id));
});

usuarios.post('/avatar', async (c) => {
  const { id } = usuarioDe(c);
  limitarIntentos(`avatar:${id}`, 10, 60);
  const formulario = await c.req.formData().catch(() => null);
  if (!formulario) throw invalido('Envía la imagen como formulario (multipart/form-data).');
  const avatarUrl = await guardarImagen(formulario.get('archivo'));
  await sql`update usuarios set avatar_url = ${avatarUrl} where id = ${id}`;
  return c.json({ avatarUrl });
});

interface FilaPreferencias {
  tema: Tema;
  notif_email: boolean;
  notif_push: boolean;
  notif_resultados: boolean;
  notif_social: boolean;
  notif_racha: boolean;
  notif_marketing: boolean;
}

function mapearPreferencias(f: FilaPreferencias): DTOPreferencias {
  return {
    tema: f.tema,
    notifEmail: f.notif_email,
    notifPush: f.notif_push,
    notifResultados: f.notif_resultados,
    notifSocial: f.notif_social,
    notifRacha: f.notif_racha,
    notifMarketing: f.notif_marketing,
  };
}

async function leerPreferencias(usuarioId: string): Promise<DTOPreferencias> {
  // La fila nace con el usuario (trigger); por si una cuenta antigua no la tiene.
  await sql`insert into preferencias_usuario (usuario_id) values (${usuarioId}) on conflict do nothing`;
  const [f] = await sql<FilaPreferencias[]>`
    select tema, notif_email, notif_push, notif_resultados, notif_social, notif_racha, notif_marketing
      from preferencias_usuario where usuario_id = ${usuarioId}`;
  return mapearPreferencias(f!);
}

usuarios.get('/preferencias', async (c) => c.json(await leerPreferencias(usuarioDe(c).id)));

usuarios.patch('/preferencias', async (c) => {
  const { id } = usuarioDe(c);
  const d = await leerCuerpo(c, actualizarPreferenciasSchema);
  const columnas: Record<keyof typeof d, string> = {
    tema: 'tema',
    notifEmail: 'notif_email',
    notifPush: 'notif_push',
    notifResultados: 'notif_resultados',
    notifSocial: 'notif_social',
    notifRacha: 'notif_racha',
    notifMarketing: 'notif_marketing',
  };
  const cambios: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(d)) {
    if (valor !== undefined) cambios[columnas[clave as keyof typeof d]] = valor;
  }
  await leerPreferencias(id);
  if (Object.keys(cambios).length > 0) {
    cambios.actualizado_en = new Date().toISOString();
    await sql`update preferencias_usuario set ${sql(cambios)} where usuario_id = ${id}`;
  }
  return c.json(await leerPreferencias(id));
});

usuarios.get('/logros', async (c) => c.json(await logrosDe(usuarioDe(c).id)));
