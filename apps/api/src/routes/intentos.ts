import type { DTOExplicacion } from '@paes-pro/shared';
import { crearIntentoSchema, guardarRespuestaSchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { conflicto, limitePlan, noEncontrado, premiumRequerido } from '../http/errores.js';
import { leerCuerpo, leerUuid } from '../http/validar.js';
import { esPremium } from '../services/usuarios.js';
import {
  entregarIntento,
  guardarRespuestaIntento,
  estaExpirado,
  filaIntento,
  intentoCompleto,
  intentosDeUsuario,
  preguntasResueltas,
  resultadosIntento,
  type FilaIntento,
} from '../services/intentos.js';
import { dividirPasos } from '../services/etiquetas.js';

export const intentos = crearRouter();

intentos.use('*', requiereSesion);

intentos.get('/', async (c) => c.json(await intentosDeUsuario(usuarioDe(c).id)));

/** Crea un intento o retoma el que está en curso para ese ensayo. */
intentos.post('/', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const { ensayoSlug } = await leerCuerpo(c, crearIntentoSchema);

  const [ensayo] = await sql<{ id: string; premium: boolean; duracion_min: number; preguntas_count: number; es_diagnostico: boolean; titulo: string }[]>`
    select id, premium, duracion_min, preguntas_count, es_diagnostico, titulo
      from ensayos where slug = ${ensayoSlug} and activo`;
  if (!ensayo) throw noEncontrado('Ese ensayo no existe o ya no está disponible. Elige otro de la biblioteca.');

  const premium = await esPremium(usuarioId);
  if (ensayo.premium && !premium) {
    throw premiumRequerido('Este ensayo es parte de Premium. Mejora tu plan para rendirlo.');
  }

  const { intento, creado } = await sql.begin(async (tx) => {
    // Serialize creations per user, including the monthly free-plan quota.
    await tx`select pg_advisory_xact_lock(hashtextextended(${usuarioId}, 0))`;
    // ¿Hay uno en curso? Se retoma, salvo que ya haya expirado.
    const [enCurso] = await tx<FilaIntento[]>`
      select id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en, duracion_min
        from intentos where usuario_id = ${usuarioId} and ensayo_id = ${ensayo.id} and estado = 'en_curso'`;
    if (enCurso) {
      if (!estaExpirado(enCurso)) return { intento: enCurso, creado: false };
      return { intento: enCurso, creado: false };
    }
  
    if (ensayo.preguntas_count === 0) {
      throw conflicto('Este ensayo todavía no tiene preguntas cargadas. Prueba con otro.');
    }
  
    // Límite mensual del plan gratis (el diagnóstico no cuenta).
    if (!premium && !ensayo.es_diagnostico) {
      const [plan] = await tx<{ ensayos_mes: number }[]>`
        select ensayos_mes from planes_suscripcion where codigo = 'basico'`;
      const limite = plan?.ensayos_mes ?? 1;
      const [uso] = await tx<{ n: number }[]>`
        select count(*)::int as n from intentos i join ensayos e on e.id = i.ensayo_id
         where i.usuario_id = ${usuarioId} and not e.es_diagnostico
           and i.estado <> 'abandonado'
           and i.iniciado_en >= date_trunc('month', now() at time zone 'America/Santiago') at time zone 'America/Santiago'`;
      if ((uso?.n ?? 0) >= limite) {
        throw limitePlan(
          `El plan gratis incluye ${limite} ${limite === 1 ? 'ensayo' : 'ensayos'} al mes y ya lo usaste. Mejora a Premium para ensayar sin límite.`,
          { limite, usados: uso?.n ?? 0 },
        );
      }
    }
  
    const [nuevo] = await tx<FilaIntento[]>`
      insert into intentos (usuario_id, ensayo_id, expira_en, duracion_min)
      values (${usuarioId}, ${ensayo.id}, clock_timestamp() + ${ensayo.duracion_min} * interval '1 minute', ${ensayo.duracion_min})
      returning id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en, duracion_min`;
    return { intento: nuevo!, creado: true };
  });
  if (estaExpirado(intento)) {
    await entregarIntento(intento);
    return c.json(await intentoCompleto(await filaIntento(intento.id, usuarioId), premium));
  }
  return c.json(await intentoCompleto(intento, premium), creado ? 201 : 200);
});

intentos.get('/:id', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  let f = await filaIntento(leerUuid(c), usuarioId);
  if (estaExpirado(f)) {
    await entregarIntento(f);
    f = await filaIntento(f.id, usuarioId);
  }
  return c.json(await intentoCompleto(f, await esPremium(usuarioId)));
});

/** Autoguardado idempotente de una respuesta. */
intentos.put('/:id/respuestas/:preguntaId', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const intentoId = leerUuid(c);
  const preguntaId = leerUuid(c, 'preguntaId');
  const datos = await leerCuerpo(c, guardarRespuestaSchema);
  return c.json(await guardarRespuestaIntento(intentoId, usuarioId, preguntaId, datos));
});

intentos.post('/:id/entregar', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const f = await filaIntento(leerUuid(c), usuarioId);
  if (f.estado === 'abandonado') throw conflicto('Este intento fue abandonado. Comienza uno nuevo.');
  const logros = await entregarIntento(f);
  const final = await filaIntento(f.id, usuarioId);
  return c.json(await resultadosIntento(final, logros));
});

intentos.get('/:id/resultados', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  let f = await filaIntento(leerUuid(c), usuarioId);
  if (estaExpirado(f)) {
    await entregarIntento(f);
    f = await filaIntento(f.id, usuarioId);
  }
  if (f.estado !== 'entregado' && f.estado !== 'expirado') {
    throw conflicto('Todavía no entregas este ensayo. Termínalo para ver tus resultados.', { estado: 'en_curso' });
  }
  return c.json(await resultadosIntento(f));
});

intentos.get('/:id/pregunta/:n', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const f = await filaIntento(leerUuid(c), usuarioId);
  if (f.estado !== 'entregado' && f.estado !== 'expirado') {
    throw conflicto('La explicación estará disponible cuando entregues el ensayo.', { estado: 'en_curso' });
  }
  const n = Number(c.req.param('n'));
  const preguntas = await preguntasResueltas(f);
  if (!Number.isInteger(n) || n < 1 || n > preguntas.length) {
    throw noEncontrado(`La pregunta ${c.req.param('n')} no existe en este ensayo.`);
  }

  const premium = await esPremium(usuarioId);
  const p = preguntas[n - 1]!;
  const errores = preguntas.map((q, i) => (q.esCorrecta ? null : i + 1)).filter((x): x is number => x !== null);
  const [enCuaderno] = await sql`
    select 1 from cuaderno_errores where usuario_id = ${usuarioId} and pregunta_id = ${p.id} and not dominada`;

  const { errorComun, videoUrl, ...base } = p;
  const dto: DTOExplicacion = {
    intentoId: f.id,
    numero: n,
    total: preguntas.length,
    pregunta: {
      ...base,
      errorComun,
      videoUrl: premium ? videoUrl : null,
      tieneVideo: Boolean(videoUrl),
      pasos: dividirPasos(p.explicacion),
    },
    anteriorError: [...errores].reverse().find((x) => x < n) ?? null,
    siguienteError: errores.find((x) => x > n) ?? null,
    enCuaderno: Boolean(enCuaderno),
  };
  return c.json(dto);
});
