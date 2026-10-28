import { ensayosQuerySchema } from '@paes-pro/shared';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { noEncontrado } from '../http/errores.js';
import { leerQuery } from '../http/validar.js';
import { esPremium } from '../services/usuarios.js';
import { listarEnsayos } from '../services/intentos.js';

export const ensayos = crearRouter();

ensayos.use('*', requiereSesion);

ensayos.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const filtros = leerQuery(c, ensayosQuerySchema);
  return c.json(await listarEnsayos(id, await esPremium(id), filtros));
});

ensayos.get('/:slug', async (c) => {
  const { id } = usuarioDe(c);
  const slug = c.req.param('slug');
  const [ensayo] = await listarEnsayos(id, await esPremium(id), { slug });
  if (!ensayo) throw noEncontrado('Ese ensayo no existe o ya no está disponible. Elige otro de la biblioteca.');
  return c.json(ensayo);
});
