import type { DTOCuaderno, DTOItemCuaderno, DTOPreguntaRepaso, DTORespuestaRepaso, NivelDificultad } from '@paes-pro/shared';
import { agregarCuadernoSchema, responderRepasoSchema } from '@paes-pro/shared';
import { sql, aIso } from '../db/client.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { invalido, noEncontrado } from '../http/errores.js';
import { leerCuerpo, leerUuid } from '../http/validar.js';
import { hoyChile } from '../services/usuarios.js';
import { siguienteEstado } from '../services/leitner.js';
import { sumarDiasISO } from '../services/intentos.js';
import { otorgarLogro, registrarActividad } from '../services/actividad.js';

export const cuaderno = crearRouter();

cuaderno.use('*', requiereSesion);

interface FilaItem {
  id: string;
  pregunta_id: string;
  enunciado: string;
  materia_codigo: string;
  eje_nombre: string | null;
  caja: number;
  proximo_repaso: string;
  repasos: number;
  dominada: boolean;
  origen: 'ensayo' | 'manual' | 'mini_test';
  creado_en: unknown;
}

function aItem(f: FilaItem): DTOItemCuaderno {
  return {
    id: f.id,
    preguntaId: f.pregunta_id,
    enunciado: f.enunciado,
    materiaCodigo: f.materia_codigo,
    ejeNombre: f.eje_nombre,
    caja: f.caja,
    proximoRepaso: f.proximo_repaso,
    repasos: f.repasos,
    dominada: f.dominada,
    origen: f.origen,
    creadoEn: aIso(f.creado_en),
  };
}

async function itemsDe(usuarioId: string, id?: string): Promise<FilaItem[]> {
  return sql<FilaItem[]>`
    select ce.id, ce.pregunta_id, p.enunciado, m.codigo as materia_codigo, ej.nombre as eje_nombre,
           ce.caja, to_char(ce.proximo_repaso, 'YYYY-MM-DD') as proximo_repaso, ce.repasos,
           ce.dominada, ce.origen, ce.creado_en
      from cuaderno_errores ce
      join preguntas p on p.id = ce.pregunta_id
      join materias m on m.id = p.materia_id
      left join ejes ej on ej.id = p.eje_id
     where ce.usuario_id = ${usuarioId} ${id ? sql`and ce.id = ${id}` : sql``}
     order by ce.dominada asc, ce.proximo_repaso asc, ce.creado_en desc`;
}

cuaderno.get('/', async (c) => {
  const { id } = usuarioDe(c);
  const hoy = hoyChile();
  const filas = await itemsDe(id);
  const dto: DTOCuaderno = {
    pendientesHoy: filas.filter((f) => !f.dominada && f.proximo_repaso <= hoy).length,
    total: filas.length,
    dominadas: filas.filter((f) => f.dominada).length,
    items: filas.map(aItem),
  };
  return c.json(dto);
});

/** Preguntas vencidas hoy, sin la alternativa correcta (D-004). */
cuaderno.get('/repaso', async (c) => {
  const { id } = usuarioDe(c);
  const hoy = hoyChile();
  const filas = await sql<{
    cuaderno_id: string; caja: number; id: string; tipo: 'multiple' | 'comprension_lectora'; enunciado: string;
    texto_base: string | null; difficulty: number; eje_id: string | null; eje_nombre: string | null; materia_codigo: string;
  }[]>`
    select ce.id as cuaderno_id, ce.caja, p.id, p.tipo, p.enunciado, p.texto_base, p.difficulty,
           p.eje_id, ej.nombre as eje_nombre, m.codigo as materia_codigo
      from cuaderno_errores ce
      join preguntas p on p.id = ce.pregunta_id
      join materias m on m.id = p.materia_id
      left join ejes ej on ej.id = p.eje_id
     where ce.usuario_id = ${id} and not ce.dominada and ce.proximo_repaso <= ${hoy}
     order by ce.proximo_repaso, ce.caja
     limit 10`;
  const alternativas = filas.length
    ? await sql<{ id: string; pregunta_id: string; texto: string; posicion: number }[]>`
        select id, pregunta_id, texto, posicion from alternativas
         where pregunta_id = any(${filas.map((f) => f.id)}) order by posicion`
    : [];
  const dto: DTOPreguntaRepaso[] = filas.map((f, i) => ({
    id: f.id,
    posicion: i + 1,
    tipo: f.tipo,
    enunciado: f.enunciado,
    textoBase: f.texto_base,
    dificultad: Math.min(5, Math.max(1, f.difficulty)) as NivelDificultad,
    ejeId: f.eje_id,
    ejeNombre: f.eje_nombre,
    materiaCodigo: f.materia_codigo,
    alternativas: alternativas
      .filter((a) => a.pregunta_id === f.id)
      .map((a) => ({ id: a.id, texto: a.texto, posicion: a.posicion })),
    respuestaActual: null,
    cuadernoId: f.cuaderno_id,
    caja: f.caja,
  }));
  return c.json(dto);
});

cuaderno.post('/', async (c) => {
  const { id } = usuarioDe(c);
  const datos = await leerCuerpo(c, agregarCuadernoSchema);
  const [existe] = await sql`select 1 from preguntas where id = ${datos.preguntaId}`;
  if (!existe) throw noEncontrado('Esa pregunta no existe.');
  const manana = sumarDiasISO(hoyChile(), 1);
  const [fila] = await sql<{ id: string }[]>`
    insert into cuaderno_errores (usuario_id, pregunta_id, intento_id, origen, caja, proximo_repaso)
    values (${id}, ${datos.preguntaId}, ${datos.intentoId ?? null}, 'manual', 1, ${manana})
    on conflict (usuario_id, pregunta_id) do update
      set dominada = false, caja = 1, proximo_repaso = ${manana}, actualizado_en = now()
    returning id`;
  const [item] = await itemsDe(id, fila!.id);
  return c.json(aItem(item!), 201);
});

cuaderno.post('/:id/responder', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const itemId = leerUuid(c);
  const { alternativaId } = await leerCuerpo(c, responderRepasoSchema);

  const [item] = await sql<{ id: string; pregunta_id: string; caja: number }[]>`
    select id, pregunta_id, caja from cuaderno_errores where id = ${itemId} and usuario_id = ${usuarioId}`;
  if (!item) throw noEncontrado('Esa pregunta ya no está en tu cuaderno.');

  const alts = await sql<{ id: string; es_correcta: boolean }[]>`
    select id, es_correcta from alternativas where pregunta_id = ${item.pregunta_id}`;
  if (!alts.some((a) => a.id === alternativaId)) throw invalido('Esa alternativa no corresponde a la pregunta.');
  const correcta = alts.find((a) => a.es_correcta)!;
  const esCorrecta = correcta.id === alternativaId;

  const estado = siguienteEstado(item.caja, esCorrecta);
  const proximo = sumarDiasISO(hoyChile(), estado.diasHastaRepaso);
  await sql`
    update cuaderno_errores
       set caja = ${estado.caja}, dominada = ${estado.dominada}, proximo_repaso = ${proximo},
           repasos = repasos + 1, aciertos = aciertos + ${esCorrecta ? 1 : 0}, actualizado_en = now()
     where id = ${item.id}`;

  const [p] = await sql<{ explicacion: string | null }[]>`select explicacion from preguntas where id = ${item.pregunta_id}`;
  await registrarActividad(usuarioId, 'repaso');
  if (estado.dominada) {
    const [n] = await sql<{ n: number }[]>`
      select count(*)::int as n from cuaderno_errores where usuario_id = ${usuarioId} and dominada`;
    if ((n?.n ?? 0) >= 20) await otorgarLogro(usuarioId, 'repaso_20');
  }

  const dto: DTORespuestaRepaso = {
    esCorrecta,
    alternativaCorrectaId: correcta.id,
    explicacion: p?.explicacion ?? '',
    caja: estado.caja,
    proximoRepaso: proximo,
    dominada: estado.dominada,
  };
  return c.json(dto);
});

cuaderno.delete('/:id', async (c) => {
  const { id } = usuarioDe(c);
  await sql`delete from cuaderno_errores where id = ${leerUuid(c)} and usuario_id = ${id}`;
  return c.body(null, 204);
});
