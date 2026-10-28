import type { DTOPlanGenerado } from '@paes-pro/shared';
import { disponibilidadOnboardingSchema, metaOnboardingCompletaSchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { invalido } from '../http/errores.js';
import { leerCuerpo } from '../http/validar.js';
import { obtenerUsuario } from '../services/usuarios.js';
import { generarPlanUsuario } from '../services/generar-plan.js';
import { planActivo, tareasEntre } from '../services/consultas.js';
import { sumarDias } from '../services/fechas.js';
import { notificar } from '../services/actividad.js';
import { hoyChile } from '../services/usuarios.js';

export const onboarding = crearRouter();

onboarding.use('*', requiereSesion);

onboarding.put('/meta', async (c) => {
  const { id } = usuarioDe(c);
  const d = await leerCuerpo(c, metaOnboardingCompletaSchema);

  let puntajeMeta = d.puntajeMeta;
  if (d.carreraId) {
    const [carrera] = await sql<{ puntaje_referencia: number | null }[]>`
      select puntaje_referencia from carreras where id = ${d.carreraId}`;
    if (!carrera) throw invalido('No encontramos esa carrera. Búscala de nuevo.', { carreraId: 'No existe' });

    // Sin puntaje explícito, la meta es el corte de esa carrera en esa universidad.
    if (puntajeMeta === undefined) {
      if (d.universidadId) {
        const [oferta] = await sql<{ puntaje_corte: number }[]>`
          select puntaje_corte from carreras_universidades
           where carrera_id = ${d.carreraId} and universidad_id = ${d.universidadId}`;
        puntajeMeta = oferta?.puntaje_corte ?? carrera.puntaje_referencia;
      } else {
        puntajeMeta = carrera.puntaje_referencia;
      }
    }
  }
  if (d.universidadId) {
    const [u] = await sql`select 1 from universidades where id = ${d.universidadId}`;
    if (!u) throw invalido('No encontramos esa universidad. Elígela de nuevo.', { universidadId: 'No existe' });
  }

  const cambios: Record<string, unknown> = {};
  if (d.carreraId !== undefined) cambios.carrera_id = d.carreraId;
  if (d.universidadId !== undefined) cambios.universidad_id = d.universidadId;
  if (puntajeMeta !== undefined) cambios.puntaje_meta = puntajeMeta;
  if (d.fechaExamen !== undefined) cambios.fecha_examen = d.fechaExamen;
  if (Object.keys(cambios).length > 0) {
    await sql`update usuarios set ${sql(cambios)} where id = ${id}`;
  }
  return c.json(await obtenerUsuario(id));
});

onboarding.put('/disponibilidad', async (c) => {
  const { id } = usuarioDe(c);
  const d = await leerCuerpo(c, disponibilidadOnboardingSchema);
  const dias = [...new Set(d.diasDisponibles)].sort((a, b) => a - b);
  await sql`
    update usuarios
       set horas_semana = ${d.horasSemana}, dias_disponibles = ${dias},
           pruebas_objetivo = ${[...new Set(d.pruebasObjetivo)]}
     where id = ${id}`;
  return c.json(await obtenerUsuario(id));
});

onboarding.post('/plan', async (c) => {
  const { id } = usuarioDe(c);
  const resultado = await generarPlanUsuario(id);
  await sql`update usuarios set onboarding_completado = true where id = ${id}`;

  const [usuario, plan] = await Promise.all([obtenerUsuario(id), planActivo(id)]);
  const hoy = hoyChile();
  const tareas = await tareasEntre(id, hoy, sumarDias(hoy, resultado.semanas * 7));

  await notificar(id, {
    tipo: 'nuevo_plan',
    titulo: 'Tu plan de estudio está listo',
    cuerpo: `${resultado.sesionesSemana} sesiones por semana, ${resultado.horasSemana} horas en total.`,
    url: '/app/plan',
  });

  const respuesta: DTOPlanGenerado = {
    plan: { ...plan!, tareas },
    resumen: {
      carrera: usuario.carrera?.nombre ?? null,
      universidad: usuario.universidad?.nombre ?? null,
      puntajeMeta: usuario.puntajeMeta,
      puntajeActual: resultado.puntajeActual,
      horasSemana: resultado.horasSemana,
      semanas: resultado.semanas,
      fechaExamen: usuario.fechaExamen,
      sesionesSemana: resultado.sesionesSemana,
    },
  };
  return c.json(respuesta);
});

onboarding.post('/omitir', async (c) => {
  const { id } = usuarioDe(c);
  // Plan por defecto: se generará con lo que haya (o con 8 h y lun/mié/vie).
  const [plan] = await sql`select 1 from planes_estudio where usuario_id = ${id} and activo`;
  if (!plan) await generarPlanUsuario(id);
  await sql`update usuarios set onboarding_completado = true where id = ${id}`;
  return c.json(await obtenerUsuario(id));
});
