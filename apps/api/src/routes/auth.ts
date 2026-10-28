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
import { ipValida, rutaRetornoSegura } from '../services/seguridad.js';
import { correoConfigurado, enviarRecuperacion } from '../services/correo.js';
import { bodyLimit } from 'hono/body-limit';

const COOKIE_REFRESH = 'paes_rt';
const DIAS_SESION_LARGA = 30;
const HORAS_SESION_CORTA = 24;

export const auth = crearRouter();
auth.use('*', bodyLimit({ maxSize: 16 * 1024, onError: () => { throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'La solicitud es demasiado grande.'); } }));

/* --------------------------------------------------------------------------
 * Sesiones
 * -------------------------------------------------------------------------- */

async function crearSesion(
  c: Context<Entorno>,
  usuarioId: string,
  mantener: boolean,
  familiaId: string | null = null,
): Promise<string> {
  const token = tokenAleatorio();
  const familia = familiaId ?? crypto.randomUUID();
  const expira = new Date(
    Date.now() + (mantener ? DIAS_SESION_LARGA * 86_400_000 : HORAS_SESION_CORTA * 3_600_000),
  );
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  await sql`
    insert into sesiones (usuario_id, token_hash, familia_id, user_agent, ip, expira_en)
    values (${usuarioId}, ${hashToken(token)}, ${familia},
            ${c.req.header('user-agent')?.slice(0, 300) ?? null}, ${ipValida(ip)},
            ${expira.toISOString()})`;

  setCookie(c, COOKIE_REFRESH, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/api/v1/auth',
    // Sin "mantener sesión" la cookie muere al cerrar el navegador.
    ...(mantener ? { expires: expira } : {}),
  });
  return familia;
}

async function respuestaSesion(usuarioId: string, rol: 'estudiante' | 'profesor' | 'admin', familiaId: string) {
  const [usuario, accessToken] = await Promise.all([
    obtenerUsuario(usuarioId),
    firmarAcceso({ sub: usuarioId, rol, sid: familiaId }),
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

  const familia = await crearSesion(c, u!.id, true);
  return c.json(await respuestaSesion(u!.id, 'estudiante', familia), 201);
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

  const familia = await crearSesion(c, u.id, datos.mantenerSesion);
  return c.json(await respuestaSesion(u.id, u.rol, familia));
});

/**
 * Rota el refresh token. Si llega un token ya revocado, alguien lo reutilizó:
 * se revoca toda la familia y se obliga a iniciar sesión.
 */
auth.post('/refresh', async (c) => {
  const token = getCookie(c, COOKIE_REFRESH);
  // Sin cookie es un invitado, no un error: 204 evita un 401 en cada visita pública.
  if (!token) return c.body(null, 204);

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

  // Solo una petición puede consumir este refresh token.
  const consumidas = await sql`
    update sesiones set revocado_en = now(), ultimo_uso_en = now()
     where id = ${s.id} and revocado_en is null and expira_en > now() returning id`;
  if (consumidas.length === 0) throw noAutorizado('La sesión se actualizó en otra pestaña. Vuelve a iniciar sesión.');
  const larga = aMs(s.expira_en) - Date.now() > 2 * 86_400_000;
  await crearSesion(c, s.usuario_id, larga, s.familia_id);
  return c.json(await respuestaSesion(s.usuario_id, s.rol, s.familia_id));
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
  // La disponibilidad se comprueba antes de buscar la cuenta, con la misma
  // respuesta para direcciones registradas y desconocidas.
  if (!correoConfigurado()) throw new HttpError(503, 'INTERNAL_ERROR', 'La recuperación por correo no está disponible por ahora. Intenta más tarde.');
  const [u] = await sql<{ id: string }[]>`select id from usuarios where email = ${email} and eliminado_en is null`;
  if (u) {
    const token = tokenAleatorio();
    await sql`
      insert into tokens_recuperacion (usuario_id, token_hash, expira_en)
      values (${u.id}, ${hashToken(token)}, now() + make_interval(mins => ${MINUTOS_TOKEN_RECUPERACION}))`;
    await enviarRecuperacion(email, token);
  }
  // Respuesta idéntica exista o no la cuenta: no revela qué emails están registrados.
  return c.json({ ok: true });
});

auth.post('/recuperar/:token', async (c) => {
  const datos = await leerCuerpo(c, resetPasswordSchema.omit({ token: true }));
  const token = c.req.param('token');
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) throw invalido('El enlace de recuperación no es válido.');
  limitarIntentos(`restablecer:${hashToken(token)}`, 5, 15);

  const hash = await Bun.password.hash(datos.password, { algorithm: 'argon2id' });
  await sql.begin(async (tx) => {
    const [t] = await tx<{ usuario_id: string }[]>`
      update tokens_recuperacion set usado_en = now()
       where token_hash = ${hashToken(token)} and usado_en is null and expira_en > now()
       returning usuario_id`;
    if (!t) throw invalido('El enlace expiró o ya se usó. Pide uno nuevo desde "¿Olvidaste tu contraseña?".');
    await tx`update usuarios set password_hash = ${hash} where id = ${t.usuario_id}`;
    await tx`update tokens_recuperacion set usado_en = now() where usuario_id = ${t.usuario_id} and usado_en is null`;
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

/* --------------------------------------------------------------------------
 * Login con Google (OAuth 2.0 + PKCE). Solo se activa si hay credenciales.
 * -------------------------------------------------------------------------- */

const COOKIE_OAUTH = 'paes_oauth';
const googleConfigurado = () =>
  Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI);

auth.get('/proveedores', (c) => c.json({ google: googleConfigurado(), recuperacion: correoConfigurado() }));

auth.get('/google', async (c) => {
  if (!googleConfigurado()) throw new HttpError(404, 'NOT_FOUND', 'El inicio con Google no está habilitado.');
  const state = tokenAleatorio(16);
  const verificador = tokenAleatorio(32);
  const reto = Buffer.from(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador)),
  ).toString('base64url');
  const volver = c.req.query('volver');
  setCookie(c, COOKIE_OAUTH, JSON.stringify({ state, verificador, volver: rutaRetornoSegura(volver) }), {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/api/v1/auth',
    maxAge: 600,
  });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID!,
    redirect_uri: config.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: reto,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return c.redirect(url.toString());
});

auth.get('/google/callback', async (c) => {
  const fallo = (motivo: string) => c.redirect(`${config.APP_URL}/login?error=${encodeURIComponent(motivo)}`);
  if (!googleConfigurado()) return fallo('google_deshabilitado');

  let guardado: { state: string; verificador: string; volver: string | null } | null = null;
  try {
    guardado = JSON.parse(getCookie(c, COOKIE_OAUTH) ?? 'null');
  } catch {
    guardado = null;
  }
  deleteCookie(c, COOKIE_OAUTH, { path: '/api/v1/auth' });
  const code = c.req.query('code');
  if (!guardado || !code || c.req.query('state') !== guardado.state) return fallo('estado_invalido');

  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID!,
      client_secret: config.GOOGLE_CLIENT_SECRET!,
      redirect_uri: config.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
      code_verifier: guardado.verificador,
    }),
  });
  if (!respuesta.ok) return fallo('google_rechazo');
  const { id_token } = (await respuesta.json()) as { id_token?: string };
  if (!id_token) return fallo('google_rechazo');

  const { jwtVerify, createRemoteJWKSet } = await import('jose');
  let perfil: { sub: string; email: string; email_verified?: boolean; given_name?: string; family_name?: string; name?: string; picture?: string };
  try {
    const { payload } = await jwtVerify(id_token, createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')), {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: config.GOOGLE_CLIENT_ID!,
    });
    perfil = payload as typeof perfil;
  } catch {
    return fallo('token_invalido');
  }
  if (!perfil.sub || !perfil.email || perfil.email_verified !== true) return fallo('email_no_verificado');

  const [vinculada] = await sql<{ usuario_id: string }[]>`
    select o.usuario_id from cuentas_oauth o join usuarios u on u.id = o.usuario_id
     where o.proveedor = 'google' and o.proveedor_usuario_id = ${perfil.sub} and u.eliminado_en is null`;
  let usuarioId = vinculada?.usuario_id ?? null;

  if (!usuarioId) {
    const [existente] = await sql<{ id: string }[]>`
      select id from usuarios where email = ${perfil.email.toLowerCase()} and eliminado_en is null`;
    if (existente) {
      usuarioId = existente.id;
    } else {
      const nombre = (perfil.given_name ?? perfil.name ?? 'Estudiante').slice(0, 80);
      const [nuevo] = await sql<{ id: string }[]>`
        insert into usuarios (email, nombre, apellido, email_verificado, avatar_url)
        values (${perfil.email.toLowerCase()}, ${nombre}, ${perfil.family_name?.slice(0, 80) ?? null}, true, ${perfil.picture ?? null})
        returning id`;
      usuarioId = nuevo!.id;
    }
    await sql`
      insert into cuentas_oauth (usuario_id, proveedor, proveedor_usuario_id, email)
      values (${usuarioId}, 'google', ${perfil.sub}, ${perfil.email.toLowerCase()})
      on conflict do nothing`;
  }

  await crearSesion(c, usuarioId, true);
  return c.redirect(`${config.APP_URL}${rutaRetornoSegura(guardado.volver) ?? '/app'}`);
});
