import type { TipoNotificacion } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { registrarActividad as calcularNuevaRacha } from './fechas.js';
import { hoyChile } from './usuarios.js';

export type TipoActividad = 'ensayo' | 'contenido' | 'tarea_plan' | 'comunidad' | 'repaso';

/**
 * Registra actividad de hoy: suma en `actividad_diaria`, actualiza la racha y
 * entrega los logros de racha que correspondan. Idempotente dentro del día.
 */
export async function registrarActividad(usuarioId: string, tipo: TipoActividad): Promise<{
  rachaActual: number;
  subio: boolean;
}> {
  const hoy = hoyChile();
  const [u] = await sql<{ racha_actual: number; racha_maxima: number; ultima: string | null }[]>`
    select racha_actual, racha_maxima, to_char(ultima_actividad, 'YYYY-MM-DD') as ultima
      from usuarios where id = ${usuarioId}`;
  if (!u) return { rachaActual: 0, subio: false };

  const estado = calcularNuevaRacha(u.racha_actual, u.racha_maxima, u.ultima, hoy);
  const subio = u.ultima !== hoy;

  await sql`
    insert into actividad_diaria (usuario_id, fecha, tipo, cantidad)
    values (${usuarioId}, ${hoy}, ${tipo}, 1)
    on conflict (usuario_id, fecha) do update set cantidad = actividad_diaria.cantidad + 1`;

  if (subio) {
    await sql`
      update usuarios
         set racha_actual = ${estado.rachaActual}, racha_maxima = ${estado.rachaMaxima},
             ultima_actividad = ${hoy}
       where id = ${usuarioId}`;
    if (estado.rachaActual >= 7) await otorgarLogro(usuarioId, 'racha_7');
    if (estado.rachaActual >= 30) await otorgarLogro(usuarioId, 'racha_30');
    if ([3, 7, 14, 30, 60, 100].includes(estado.rachaActual)) {
      await notificar(usuarioId, {
        tipo: 'racha',
        titulo: `Llevas ${estado.rachaActual} días seguidos`,
        cuerpo: 'Tu constancia es lo que más mueve el puntaje. Sigue así.',
        url: '/app',
      });
    }
  }

  return { rachaActual: estado.rachaActual, subio };
}

/** Otorga un logro una sola vez. Devuelve true si es nuevo. */
export async function otorgarLogro(usuarioId: string, codigo: string): Promise<boolean> {
  const filas = await sql`
    insert into logros_usuario (usuario_id, logro_codigo) values (${usuarioId}, ${codigo})
    on conflict do nothing returning logro_codigo`;
  if (filas.length === 0) return false;
  const [logro] = await sql<{ nombre: string }[]>`select nombre from logros where codigo = ${codigo}`;
  if (logro) {
    await notificar(usuarioId, {
      tipo: 'sistema',
      titulo: `Nuevo logro: ${logro.nombre}`,
      cuerpo: 'Lo puedes ver en tu perfil.',
      url: '/app/perfil',
    });
  }
  return true;
}

/** Crea una notificación respetando las preferencias del usuario. */
export async function notificar(
  usuarioId: string,
  n: { tipo: TipoNotificacion | 'recordatorio' | 'material_nuevo'; titulo: string; cuerpo?: string; url?: string; agrupador?: string },
): Promise<void> {
  const [pref] = await sql<{ notif_resultados: boolean; notif_social: boolean; notif_racha: boolean }[]>`
    select notif_resultados, notif_social, notif_racha from preferencias_usuario where usuario_id = ${usuarioId}`;
  if (pref) {
    if (n.tipo === 'resultados_disponibles' && !pref.notif_resultados) return;
    if (['comentario', 'like', 'respuesta'].includes(n.tipo) && !pref.notif_social) return;
    if (n.tipo === 'racha' && !pref.notif_racha) return;
  }
  await sql`
    insert into notificaciones (usuario_id, tipo, titulo, cuerpo, url, agrupador)
    values (${usuarioId}, ${n.tipo}, ${n.titulo}, ${n.cuerpo ?? null}, ${n.url ?? null}, ${n.agrupador ?? null})`;
}
