import { chatIASchema } from '@paes-pro/shared';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { premiumRequerido } from '../http/errores.js';
import { leerCuerpo } from '../http/validar.js';
import { esPremium } from '../services/usuarios.js';
import { limitarIntentos } from '../services/limite.js';
import { responderTutor } from '../services/ia/index.js';
import { config } from '../config.js';

export const ia = crearRouter();

ia.use('*', requiereSesion);

ia.post('/chat', async (c) => {
  const { id } = usuarioDe(c);
  if (!(await esPremium(id))) {
    throw premiumRequerido('PAES-Bot es parte de Premium. Mejora tu plan para conversar con el tutor.');
  }
  limitarIntentos(`ia:${id}`, 30, 10);
  limitarIntentos(`ia-diaria:${id}`, config.AI_REQUESTS_PER_DAY, 1440);
  const datos = await leerCuerpo(c, chatIASchema);
  return c.json(await responderTutor(id, datos.mensajes, datos.contexto));
});
