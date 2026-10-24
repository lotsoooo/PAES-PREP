import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
  cambiarPasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registroSchema,
  resetPasswordSchema,
  MINUTOS_TOKEN_RECUPERACION,
} from '@paes-pro/shared';
import { z } from 'zod';
import { sql, aIso, aMs } from '../db/client.js';
import { config } from '../config.js';
import { crearRouter, requiereSesion, usuarioDe, type Entorno } from '../http/app.js';
import { HttpError, conflicto, invalido, noAutorizado } from '../http/errores.js';
import { leerCuerpo, leerUuid } from '../http/validar.js';
import { firmarAcceso, hashToken, tokenAleatorio } from '../http/tokens.js';
import { obtenerUsuario } from '../services/usuarios.js';
import { limitarIntentos } from '../services/limite.js';

const COOKIE_REFRESH = 'paes_rt';
const DIAS_SESION_LARGA = 30;
const HORAS_SESION_CORTA = 24;

export const auth = crearRouter();

/* --------------------------------------------------------------------------
 * Sesiones
 * -------------------------------------------------------------------------- */

async function crearSesion(
  c: Context<Entorno>,
  usuarioId: string,
  mantener: boolean,
  familiaId: string | null = null,
): Promise<void> {
  const token = tokenAleatorio();
  const expira = new Date(
    Date.now() + (mantener ? DIAS_SESION_LARGA * 86_400_000 : HORAS_SESION_CORTA * 3_600_000),
  );
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  await sql`
    insert into sesiones (usuario_id, token_hash, familia_id, user_agent, ip, expira_en)
    values (${usuarioId}, ${hashToken(token)}, ${familiaId ?? crypto.randomUUID()},
            ${c.req.header('user-agent')?.slice(0, 300) ?? null}, ${esIpValida(ip) ? ip : null},
            ${expira.toISOString()})`;

  setCookie(c, COOKIE_REFRESH, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/api/v1/auth',
    // Sin "mantener sesión" la cookie muere al cerrar el navegador.
    ...(mantener ? { expires: expira } : {}),
  });
}

function esIpValida(ip: string | null): ip is string {
  return Boolean(ip && /^[0-9a-f.:]+$/i.test(ip));
}

async function respuestaSesion(usuarioId: string, rol: 'estudiante' | 'profesor' | 'admin') {
  const [usuario, accessToken] = await Promise.all([
    obtenerUsuario(usuarioId),
    firmarAcceso({ sub: usuarioId, rol }),
  ]);
  return { usuario, accessToken };
}

/* --------------------------------------------------------------------------
 * Registro y login
 * -------------------------------------------------------------------------- */

auth.post('/registro', async (c) => {
  limitarIntentos(`registro:${c.req.header('x-forwarded-for') ?? 'local'}`, 10, 10);
  const datos = await leerCuerpo(c, registroSchema);

  const [existe] = await sql`select 1 from usuarios where email = ${datos.email}`;
  if (existe) throw conflicto('Ya existe una cuenta con ese email. Inicia sesión o recupera tu contraseña.', { email: 'Ya registrado' });

  const hash = await Bun.password.hash(datos.password, { algorithm: 'argon2id' });
  const [u] = await sql<{ id: string }[]>`
    insert into usuarios (email, nombre, password_hash, colegio_id, curso)
    values (${datos.email}, ${datos.nombre}, ${hash}, ${datos.colegioId ?? null}, ${datos.curso ?? null})
    returning id`;

  await sql`
    insert into notificaciones (usuario_id, tipo, titulo, cuerpo, url)
    values (${u!.id}, 'sistema', 'Bienvenido a PAES Pro',
            'Define tu meta y te armamos un plan de estudio a tu medida.', '/onboarding/meta')`;

  await crearSesion(c, u!.id, true);
  return c.json(await respuestaSesion(u!.id, 'estudiante'), 201);
});

auth.post('/login', async (c) => {
  const datos = await leerCuerpo(c, loginSchema);
  limitarIntentos(`login:${datos.email}`, config.RATE_LIMIT_LOGIN, config.RATE_LIMIT_VENTANA_MIN);

  const [u] = await sql<{ id: string; password_hash: string | null; rol: 'estudiante' | 'profesor' | 'admin'; colegio_id: string | null }[]>`
    select id, password_hash, rol, colegio_id from usuarios
     where email = ${datos.email} and eliminado_en is null`;

  // Mismo mensaje para email inexistente y contraseña errónea.
  const ok = u?.password_hash ? await Bun.password.verify(datos.password, u.password_hash) : false;
  if (!u || !ok) {
    throw new HttpError(401, 'UNAUTHORIZED', 'El email o la contraseña no coinciden. Revisa e intenta de nuevo.');
  }

  if (datos.colegioId && u.colegio_id && u.colegio_id !== datos.colegioId) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Tu cuenta no pertenece al colegio seleccionado. Elige tu colegio o entra sin él.');
  }
  if (datos.colegioId && !u.colegio_id) {
    await sql`update usuarios set colegio_id = ${datos.colegioId} where id = ${u.id}`;
  }

  await crearSesion(c, u.id, datos.mantenerSesion);
  return c.json(await respuestaSesion(u.id, u.rol));
});

/**
 * Rota el refresh token. Si llega un token ya revocado, alguien lo reutilizó:
 * se revoca toda la familia y se obliga a iniciar sesión.
 */
auth.post('/refresh', async (c) => {
  const token = getCookie(c, COOKIE_REFRESH);
  if (!token) throw noAutorizado('No hay una sesión activa.');

  const [s] = await sql<{ id: string; usuario_id: string; familia_id: string; revocado_en: string | null; expira_en: string; rol: 'estudiante' | 'profesor' | 'admin' }[]>`
    select s.id, s.usuario_id, s.familia_id, s.revocado_en, s.expira_en, u.rol
      from sesiones s join usuarios u on u.id = s.usuario_id
     where s.token_hash = ${hashToken(token)} and u.eliminado_en is null`;

  if (!s) {
    deleteCookie(c, COOKIE_REFRESH, { path: '/api/v1/auth' });
    throw noAutorizado('Tu sesión expiró. Inicia sesión otra vez.');
  }
  if (s.revocado_en) {
    await sql`update sesiones set revocado_en = now() where familia_id = ${s.familia_id} and revocado_en is null`;
    deleteCookie(c, COOKIE_REFRESH, { path: '/api/v1/auth' });
    throw noAutorizado('Por seguridad cerramos tu sesión. Vuelve a iniciarla.');
  }
  if (aMs(s.expira_en) < Date.now()) {
    deleteCookie(c, COOKIE_REFRESH, { path: '/api/v1/auth' });
    throw noAutorizado('Tu sesión expiró. Inicia sesión otra vez.');
  }

  await sql`update sesiones set revocado_en = now(), ultimo_uso_en = now() where id = ${s.id}`;
  const larga = aMs(s.expira_en) - Date.now() > 2 * 86_400_000;
  await crearSesion(c, s.usuario_id, larga, s.familia_id);
  return c.json(await respuestaSesion(s.usuario_id, s.rol));
});

auth.post('/logout', async (c) => {
  const token = getCookie(c, COOKIE_REFRESH);
  if (token) {
    await sql`update sesiones set revocado_en = now() where token_hash = ${hashToken(token)} and revocado_en is null`;
  }
  deleteCookie(c, COOKIE_REFRESH, { path: '/api/v1/auth' });
  return c.body(null, 204);
});

auth.get('/yo', requiereSesion, async (c) => c.json(await obtenerUsuario(usuarioDe(c).id)));

/* --------------------------------------------------------------------------
 * Recuperación de contraseña
 * -------------------------------------------------------------------------- */

auth.post('/recuperar', async (c) => {
  const { email } = await leerCuerpo(c, forgotPasswordSchema);
  limitarIntentos(`recuperar:${email}`, 3, 15);
  const [u] = await sql<{ id: string }[]>`select id from usuarios where email = ${email} and eliminado_en is null`;
  if (u) {
    const token = tokenAleatorio();
    await sql`
      insert into tokens_recuperacion (usuario_id, token_hash, expira_en)
      values (${u.id}, ${hashToken(token)}, now() + make_interval(mins => ${MINUTOS_TOKEN_RECUPERACION}))`;
    // Sin SMTP configurado el enlace queda en la consola del API (ver README).
    const enlace = `${config.APP_URL}/recuperar/${token}`;
    if (config.SMTP_HOST) {
      console.log(`[mailer] Enviar recuperación a ${email}`);
    }
    console.log(`[recuperar] Enlace para ${email}: ${enlace}`);
  }
  // Respuesta idéntica exista o no la cuenta: no revela qué emails están registrados.
  return c.json({ ok: true });
});

auth.post('/recuperar/:token', async (c) => {
  const datos = await leerCuerpo(c, resetPasswordSchema.omit({ token: true }));
  const token = c.req.param('token');
  const [t] = await sql<{ id: string; usuario_id: string }[]>`
    select id, usuario_id from tokens_recuperacion
     where token_hash = ${hashToken(token)} and usado_en is null and expira_en > now()`;
  if (!t) throw invalido('El enlace expiró o ya se usó. Pide uno nuevo desde "¿Olvidaste tu contraseña?".');

  const hash = await Bun.password.hash(datos.password, { algorithm: 'argon2id' });
  await sql.begin(async (tx) => {
    await tx`update usuarios set password_hash = ${hash} where id = ${t.usuario_id}`;
    await tx`update tokens_recuperacion set usado_en = now() where id = ${t.id}`;
    await tx`update sesiones set revocado_en = now() where usuario_id = ${t.usuario_id} and revocado_en is null`;
  });
  return c.json({ ok: true });
});

/* --------------------------------------------------------------------------
 * Seguridad de la cuenta
 * -------------------------------------------------------------------------- */

auth.post('/password', requiereSesion, async (c) => {
  const { id } = usuarioDe(c);
  const datos = await leerCuerpo(c, cambiarPasswordSchema);
  const [u] = await sql<{ password_hash: string | null }[]>`select password_hash from usuarios where id = ${id}`;
  const ok = u?.password_hash ? await Bun.password.verify(datos.passwordActual, u.password_hash) : false;
  if (!ok) throw invalido('La contraseña actual no es correcta.', { passwordActual: 'No coincide' });

  const hash = await Bun.password.hash(datos.passwordNuevo, { algorithm: 'argon2id' });
  await sql`update usuarios set password_hash = ${hash} where id = ${id}`;
  // Cierra las demás sesiones; la actual se conserva.
  const actual = getCookie(c, COOKIE_REFRESH);
  await sql`
    update sesiones set revocado_en = now()
     where usuario_id = ${id} and revocado_en is null
       and token_hash <> ${actual ? hashToken(actual) : ''}`;
  return c.json({ ok: true });
});

auth.get('/sesiones', requiereSesion, async (c) => {
  const { id } = usuarioDe(c);
  const actual = getCookie(c, COOKIE_REFRESH);
  const filas = await sql<{ id: string; user_agent: string | null; ip: string | null; creado_en: string; ultimo_uso_en: string; actual: boolean }[]>`
    select id, user_agent, host(ip) as ip, creado_en, ultimo_uso_en,
           token_hash = ${actual ? hashToken(actual) : ''} as actual
      from sesiones
     where usuario_id = ${id} and revocado_en is null and expira_en > now()
     order by ultimo_uso_en desc`;
  return c.json(
    filas.map((s) => ({
      id: s.id,
      dispositivo: describirAgente(s.user_agent),
      ip: s.ip,
      creadoEn: aIso(s.creado_en),
      ultimoUsoEn: aIso(s.ultimo_uso_en),
      actual: s.actual,
    })),
  );
});

auth.delete('/sesiones/:id', requiereSesion, async (c) => {
  const { id } = usuarioDe(c);
  const sesionId = leerUuid(c);
  await sql`update sesiones set revocado_en = now() where id = ${sesionId} and usuario_id = ${id}`;
  return c.body(null, 204);
});

auth.delete('/sesiones', requiereSesion, async (c) => {
  const { id } = usuarioDe(c);
  const actual = getCookie(c, COOKIE_REFRESH);
  await sql`
    update sesiones set revocado_en = now()
     where usuario_id = ${id} and revocado_en is null
       and token_hash <> ${actual ? hashToken(actual) : ''}`;
  return c.body(null, 204);
});

auth.delete('/cuenta', requiereSesion, async (c) => {
  const { id } = usuarioDe(c);
  await leerCuerpo(c, z.object({ confirmacion: z.literal('ELIMINAR') }));
  // Baja lógica: se anonimiza el email para liberar la dirección.
  await sql`
    update usuarios set eliminado_en = now(), email = ${`eliminado+${id}@paespro.cl`}, password_hash = null
     where id = ${id}`;
  await sql`update sesiones set revocado_en = now() where usuario_id = ${id}`;
  deleteCookie(c, COOKIE_REFRESH, { path: '/api/v1/auth' });
  return c.body(null, 204);
});

/** "Chrome en Windows" a partir del user-agent. */
function describirAgente(ua: string | null): string {
  if (!ua) return 'Dispositivo desconocido';
  const navegador = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Navegador';
  const sistema = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac OS/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'otro sistema';
  return `${navegador} en ${sistema}`;
}
