import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from './config.js';
import { verificarConexion, cerrarConexion } from './db/client.js';

const app = new Hono();

app.use(
  '/api/*',
  cors({
    origin: config.WEB_ORIGIN,
    credentials: true,
  }),
);

app.get('/api/v1/health', async (c) => {
  const dbOk = await verificarConexion();
  return c.json(
    { status: dbOk ? 'ok' : 'degraded', database: dbOk },
    dbOk ? 200 : 503,
  );
});

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, 500);
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
