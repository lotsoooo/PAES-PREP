import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { config } from './config.js';
import { verificarConexion, cerrarConexion } from './db/client.js';
import { HttpError } from './http/errores.js';
import { leerSesion, type Entorno } from './http/app.js';
import { auth } from './routes/auth.js';
import { catalogos } from './routes/catalogos.js';
import { usuarios } from './routes/usuarios.js';
import { onboarding } from './routes/onboarding.js';
import { dashboard } from './routes/dashboard.js';
import { plan } from './routes/plan.js';
import { contenidos } from './routes/contenidos.js';
import { ensayos } from './routes/ensayos.js';
import { intentos } from './routes/intentos.js';
import { estadisticas } from './routes/estadisticas.js';
import { cuaderno } from './routes/cuaderno.js';
import { comunidad } from './routes/comunidad.js';
import { tutores } from './routes/tutores.js';
import { notificaciones } from './routes/notificaciones.js';
import { premium } from './routes/premium.js';
import { ia } from './routes/ia.js';
import { buscar } from './routes/buscar.js';

const app = new Hono<Entorno>();

app.use('/api/*', secureHeaders());
app.use(
  '/api/*',
  cors({
    origin: config.WEB_ORIGIN,
    credentials: true,
  }),
);
app.use('/api/*', leerSesion);

app.get('/api/v1/health', async (c) => {
  const dbOk = await verificarConexion();
  return c.json({ status: dbOk ? 'ok' : 'degraded', database: dbOk }, dbOk ? 200 : 503);
});

const v1 = new Hono<Entorno>();
v1.route('/auth', auth);
v1.route('/', catalogos);
v1.route('/usuarios', usuarios);
v1.route('/onboarding', onboarding);
v1.route('/dashboard', dashboard);
v1.route('/plan', plan);
v1.route('/contenidos', contenidos);
v1.route('/ensayos', ensayos);
v1.route('/intentos', intentos);
v1.route('/estadisticas', estadisticas);
v1.route('/cuaderno', cuaderno);
v1.route('/comunidad', comunidad);
v1.route('/comunidad/tutores', tutores);
v1.route('/notificaciones', notificaciones);
v1.route('/premium', premium);
v1.route('/ia', ia);
v1.route('/buscar', buscar);
app.route('/api/v1', v1);

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } }, 404));

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      { error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } },
      err.status,
    );
  }
  console.error(err);
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor. Intenta de nuevo en unos segundos.' } }, 500);
});

const servidor = Bun.serve({
  port: config.PORT,
  fetch: app.fetch,
  // El autoguardado de ensayos usa fetch largos; sin timeout se corta.
  idleTimeout: 120,
});

console.log(`API escuchando en http://localhost:${servidor.port}`);

async function apagar() {
  await cerrarConexion();
  servidor.stop();
  process.exit(0);
}

process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
