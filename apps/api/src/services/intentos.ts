import type postgres from 'postgres';
import type {
  DTOEje,
  DTOEnsayo,
  DTOIntento,
  DTOIntentoResumen,
  DTOLogro,
  DTOPregunta,
  DTOPreguntaResuelta,
  DTOResultadoEje,
  DTOResultadosCompletos,
  EstadoIntento,
  NivelDificultad,
  Prueba,
} from '@paes-pro/shared';
import { sql, aIso, aIsoONull, aMs } from '../db/client.js';
import { conflicto, invalido, noEncontrado } from '../http/errores.js';
import { calificarIntento, type PreguntaParaCorregir } from './scoring/calificar.js';
import type { TramoConversion } from './scoring/puntaje.js';
import { notificar, otorgarLogro, registrarActividad } from './actividad.js';
import { hoyChile } from './usuarios.js';
import { estadoAlCerrar, resolverRespuesta, type CambioRespuesta } from './politica-intentos.js';

type Conexion = typeof sql | postgres.TransactionSql;

/* --------------------------------------------------------------------------
 * Mapeos
 * -------------------------------------------------------------------------- */

export interface FilaResumen {
  id: string;
  slug: string;
  titulo: string;
  prueba: Prueba;
  estado: EstadoIntento;
  iniciado_en: unknown;
  entregado_en: unknown;
  correctas: number;
  incorrectas: number;
  omitidas: number;
  pct_logro: string | number;
  puntaje: number | null;
  percentil: string | number | null;
}

export function aResumen(f: FilaResumen): DTOIntentoResumen {
  return {
    id: f.id,
    slug: f.slug,
    titulo: f.titulo,
    prueba: f.prueba,
    estado: f.estado,
    iniciadoEn: aIso(f.iniciado_en),
    entregadoEn: aIsoONull(f.entregado_en),
    correctas: f.correctas,
    incorrectas: f.incorrectas,
    omitidas: f.omitidas,
    pctLogro: Number(f.pct_logro),
    puntaje: f.puntaje,
    percentil: f.percentil == null ? null : Number(f.percentil),
  };
}

const columnasResumen = () => sql`
  id, slug, titulo, prueba, estado, iniciado_en, entregado_en, correctas, incorrectas,
  omitidas, pct_logro, puntaje, percentil`;

export async function resumenIntento(intentoId: string): Promise<DTOIntentoResumen | null> {
  const [f] = await sql<FilaResumen[]>`select ${columnasResumen()} from v_intentos_resumen where id = ${intentoId}`;
  return f ? aResumen(f) : null;
}

export async function intentosDeUsuario(usuarioId: string, limite = 50): Promise<DTOIntentoResumen[]> {
  const filas = await sql<FilaResumen[]>`
    select ${columnasResumen()} from v_intentos_resumen
     where usuario_id = ${usuarioId}
     order by iniciado_en desc limit ${limite}`;
  return filas.map(aResumen);
}

/* --------------------------------------------------------------------------
 * Ensayos
 * -------------------------------------------------------------------------- */

interface FilaEnsayo {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  prueba: Prueba;
  nivel: 'basico' | 'medio' | 'avanzado';
  duracion_min: number;
  preguntas_count: number;
  premium: boolean;
  es_diagnostico: boolean;
  materia_id: string;
  materia_codigo: string;
  materia_nombre: string;
  materia_area: 'matematicas' | 'lenguaje' | 'ciencias' | 'historia';
}

export async function listarEnsayos(
  usuarioId: string,
  esPremium: boolean,
  filtros: { prueba?: string; q?: string; slug?: string },
): Promise<DTOEnsayo[]> {
  const filas = await sql<FilaEnsayo[]>`
    select e.id, e.slug, e.titulo, e.descripcion, e.prueba, e.nivel, e.duracion_min,
           e.preguntas_count, e.premium, e.es_diagnostico,
           m.id as materia_id, m.codigo as materia_codigo, m.nombre as materia_nombre, m.area as materia_area
      from ensayos e join materias m on m.id = e.materia_id
     where e.activo
       ${filtros.prueba ? sql`and e.prueba = ${filtros.prueba}` : sql``}
       ${filtros.slug ? sql`and e.slug = ${filtros.slug}` : sql``}
       ${filtros.q ? sql`and (e.titulo ilike ${'%' + filtros.q + '%'} or e.descripcion ilike ${'%' + filtros.q + '%'})` : sql``}
     order by e.es_diagnostico desc, e.premium asc, e.prueba, e.titulo`;
  if (filas.length === 0) return [];

  const ids = filas.map((f) => f.id);
  const ejes = await sql<(DTOEje & { ensayo_id: string })[]>`
    select ee.ensayo_id, ej.id, ej.codigo, ej.nombre, ej.descripcion
      from ensayo_ejes ee join ejes ej on ej.id = ee.eje_id
     where ee.ensayo_id = any(${ids}) order by ej.codigo`;
  const enCurso = await sql<{ id: string; ensayo_id: string }[]>`
    select id, ensayo_id from intentos
     where usuario_id = ${usuarioId} and estado = 'en_curso' and ensayo_id = any(${ids})`;
  const ultimos = await sql<(FilaResumen & { ensayo_id: string })[]>`
    select distinct on (ensayo_id) ensayo_id, ${columnasResumen()}
      from v_intentos_resumen
     where usuario_id = ${usuarioId} and estado in ('entregado', 'expirado') and ensayo_id = any(${ids})
     order by ensayo_id, entregado_en desc nulls last`;

  return filas.map((f) => {
    const ultimo = ultimos.find((u) => u.ensayo_id === f.id);
    return {
      id: f.id,
      slug: f.slug,
      titulo: f.titulo,
      descripcion: f.descripcion,
      prueba: f.prueba,
      materia: { id: f.materia_id, codigo: f.materia_codigo, nombre: f.materia_nombre, area: f.materia_area },
      nivel: f.nivel,
      duracionMin: f.duracion_min,
      preguntasCount: f.preguntas_count,
      premium: f.premium,
      esDiagnostico: f.es_diagnostico,
      ejes: ejes
        .filter((e) => e.ensayo_id === f.id)
        .map((e) => ({ id: e.id, codigo: e.codigo, nombre: e.nombre, descripcion: e.descripcion })),
      intentoEnCursoId: enCurso.find((i) => i.ensayo_id === f.id)?.id ?? null,
      ultimoIntento: ultimo ? aResumen(ultimo) : null,
      bloqueadoPorPlan: f.premium && !esPremium,
    };
  });
}

/* --------------------------------------------------------------------------
 * Preguntas de un intento
 * -------------------------------------------------------------------------- */

interface FilaPreguntaIntento {
  id: string;
  posicion: number;
  tipo: 'multiple' | 'comprension_lectora';
  enunciado: string;
  texto_base: string | null;
  difficulty: number;
  eje_id: string | null;
  eje_nombre: string | null;
  materia_codigo: string;
  explicacion: string | null;
  error_comun: string | null;
  video_url: string | null;
  puntaje: string | number;
  alternativa_id: string | null;
  es_marcada: boolean | null;
  tiempo_segundos: number | null;
  respondida_en: unknown;
  tiene_respuesta: boolean;
}

interface FilaAlternativa {
  id: string;
  pregunta_id: string;
  texto: string;
  posicion: number;
  es_correcta: boolean;
}

async function filasPreguntas(intentoId: string, ensayoId: string, conexion: Conexion = sql) {
  const preguntas = await conexion<FilaPreguntaIntento[]>`
    select p.id, ep.posicion, p.tipo, p.enunciado, p.texto_base, p.difficulty, p.eje_id,
           ej.nombre as eje_nombre, m.codigo as materia_codigo, p.explicacion, p.error_comun,
           p.video_url, ep.puntaje,
           r.alternativa_id, r.es_marcada, r.tiempo_segundos, r.respondida_en, (r.id is not null) as tiene_respuesta
      from ensayo_preguntas ep
      join preguntas p on p.id = ep.pregunta_id
      join materias m on m.id = p.materia_id
      left join ejes ej on ej.id = p.eje_id
      left join respuestas r on r.intento_id = ${intentoId} and r.pregunta_id = p.id
     where ep.ensayo_id = ${ensayoId}
     order by ep.posicion`;
  const alternativas = preguntas.length
    ? await conexion<FilaAlternativa[]>`
        select id, pregunta_id, texto, posicion, es_correcta from alternativas
         where pregunta_id = any(${preguntas.map((p) => p.id)}) order by posicion`
    : [];
  return { preguntas, alternativas };
}

function aPregunta(p: FilaPreguntaIntento, alts: FilaAlternativa[], indice: number): DTOPregunta {
  return {
    id: p.id,
    // La posición visible es 1..N aunque ensayo_preguntas use otra numeración.
    posicion: indice + 1,
    tipo: p.tipo,
    enunciado: p.enunciado,
    textoBase: p.texto_base,
    dificultad: Math.min(5, Math.max(1, p.difficulty)) as NivelDificultad,
    ejeId: p.eje_id,
    ejeNombre: p.eje_nombre,
    materiaCodigo: p.materia_codigo,
    // D-004: nunca se envía es_correcta durante la resolución.
    alternativas: alts.map((a) => ({ id: a.id, texto: a.texto, posicion: a.posicion })),
    respuestaActual: p.tiene_respuesta
      ? { alternativaId: p.alternativa_id, esMarcada: Boolean(p.es_marcada), tiempoSegundos: p.tiempo_segundos ?? 0, guardadoEn: aIso(p.respondida_en) }
      : null,
  };
}

/* --------------------------------------------------------------------------
 * Intento
 * -------------------------------------------------------------------------- */

export interface FilaIntento {
  id: string;
  usuario_id: string;
  ensayo_id: string;
  estado: EstadoIntento;
  iniciado_en: unknown;
  expira_en: unknown;
  entregado_en: unknown;
  duracion_min: number;
}

export async function filaIntento(intentoId: string, usuarioId: string): Promise<FilaIntento> {
  const [f] = await sql<FilaIntento[]>`
    select id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en, duracion_min
      from intentos where id = ${intentoId} and usuario_id = ${usuarioId}`;
  if (!f) throw noEncontrado('No encontramos ese intento. Vuelve a la biblioteca de ensayos.');
  return f;
}

export function estaExpirado(f: Pick<FilaIntento, 'estado' | 'expira_en'>, ahora = Date.now()): boolean {
  return f.estado === 'en_curso' && aMs(f.expira_en) <= ahora;
}

export async function intentoCompleto(f: FilaIntento, esPremium: boolean): Promise<DTOIntento> {
  const resumen = await resumenIntento(f.id);
  const { preguntas, alternativas } = await filasPreguntas(f.id, f.ensayo_id);
  const dtoPreguntas = preguntas.map((p, i) =>
    aPregunta(p, alternativas.filter((a) => a.pregunta_id === p.id), i),
  );
  const primeraSinResponder = dtoPreguntas.findIndex((p) => !p.respuestaActual?.alternativaId);
  const [reloj] = await sql<{ ahora: unknown }[]>`select clock_timestamp() as ahora`;
  return {
    ...resumen!,
    ensayoId: f.ensayo_id,
    duracionMin: f.duracion_min,
    expiraEn: aIso(f.expira_en),
    servidorAhora: aIso(reloj!.ahora),
    preguntas: dtoPreguntas,
    indiceActual: primeraSinResponder === -1 ? 0 : primeraSinResponder,
    esPremium,
  };
}

/* --------------------------------------------------------------------------
 * Entrega y calificación
 * -------------------------------------------------------------------------- */

async function tramosDe(prueba: string, conexion: Conexion = sql): Promise<TramoConversion[]> {
  const filas = await conexion<{ pct_logro_min: number; pct_logro_max: number; puntaje_min: number; puntaje_max: number }[]>`
    select pct_logro_min, pct_logro_max, puntaje_min, puntaje_max
      from conversion_puntaje
     where prueba = ${prueba}
       and version = (select max(version) from conversion_puntaje where prueba = ${prueba})
     order by pct_logro_min`;
  return filas.map((t) => ({
    pctLogroMin: t.pct_logro_min,
    pctLogroMax: t.pct_logro_max,
    puntajeMin: t.puntaje_min,
    puntajeMax: t.puntaje_max,
  }));
}

/**
 * Califica y cierra el intento. Si el tiempo ya terminó, se entrega con
 * `entregado_en = expira_en` y solo cuentan las respuestas guardadas a tiempo.
 * Devuelve los logros nuevos.
 */
export async function entregarIntento(referencia: FilaIntento): Promise<DTOLogro[]> {
  return sql.begin(async (tx) => {
    // El mismo bloqueo protege PUT y entrega: se califica la última respuesta
    // confirmada y nadie puede modificarla después del cierre.
    const [f] = await tx<FilaIntento[]>`
      select id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en, duracion_min
        from intentos where id = ${referencia.id} and usuario_id = ${referencia.usuario_id} for update`;
    if (!f) throw noEncontrado('No encontramos ese intento.');
    if (f.estado !== 'en_curso') return [];
    const [reloj] = await tx<{ ahora: unknown }[]>`select clock_timestamp() as ahora`;
    const ahora = aIso(reloj!.ahora);
    const estado = estadoAlCerrar(aIso(f.expira_en), ahora);
    const entregadoEn = estado === 'expirado' ? aIso(f.expira_en) : ahora;
    const [ensayo] = await tx<{ prueba: string; titulo: string }[]>`
      select prueba, titulo from ensayos where id = ${f.ensayo_id}`;
    const { preguntas, alternativas } = await filasPreguntas(f.id, f.ensayo_id, tx);
    const tramos = await tramosDe(ensayo!.prueba, tx);
    const aCorregir: PreguntaParaCorregir[] = preguntas.map((p) => {
      const correcta = alternativas.find((a) => a.pregunta_id === p.id && a.es_correcta);
      const esCorrecta = p.alternativa_id !== null && p.alternativa_id === correcta?.id;
      return {
        preguntaId: p.id,
        alternativaElegida: p.alternativa_id,
        alternativaCorrecta: correcta?.id ?? '',
        esCorrecta,
        puntajeObtenido: esCorrecta ? Number(p.puntaje) : 0,
        puntajeTotal: Number(p.puntaje),
        segundos: p.tiempo_segundos ?? 0,
        ejeId: p.eje_id,
      };
    });
    const r = calificarIntento(aCorregir, tramos);
    await tx`
      update intentos
         set estado = ${estado}, entregado_en = ${entregadoEn},
             correctas = ${r.correctas}, incorrectas = ${r.incorrectas}, omitidas = ${r.omitidas},
             pct_logro = ${r.pctLogro}, puntaje = ${r.puntaje}, percentil = null, actualizado_en = now()
       where id = ${f.id}`;
    for (const e of r.porEje) {
      await tx`
        insert into resultados_eje (intento_id, eje_id, total, correctas, pct_logro)
        values (${f.id}, ${e.ejeId}, ${e.total}, ${e.correctas}, ${e.pctLogro})
        on conflict (intento_id, eje_id) do update
          set total = excluded.total, correctas = excluded.correctas, pct_logro = excluded.pct_logro`;
    }
    // No publicar percentiles de un banco demo sin población estadística validada.
    const manana = sumarDiasISO(hoyChile(), 1);
    for (const p of aCorregir.filter((p) => p.alternativaElegida !== null && !p.esCorrecta)) {
      await tx`
        insert into cuaderno_errores (usuario_id, pregunta_id, intento_id, origen, caja, proximo_repaso)
        values (${f.usuario_id}, ${p.preguntaId}, ${f.id}, 'ensayo', 1, ${manana})
        on conflict (usuario_id, pregunta_id) do update
          set caja = 1, proximo_repaso = ${manana}, dominada = false, intento_id = ${f.id}, actualizado_en = now()`;
    }
    await notificar(f.usuario_id, {
      tipo: 'resultados_disponibles',
      titulo: `Resultados listos: ${ensayo!.titulo}`,
      cuerpo: `Obtuviste ${r.puntaje} puntos estimados con ${r.correctas} de ${r.total} correctas.`,
      url: `/app/ensayos/intentos/${f.id}`,
    }, tx);
    await registrarActividad(f.usuario_id, 'ensayo', tx);
    const nuevos: string[] = [];
    const [conteo] = await tx<{ n: number }[]>`
      select count(*)::int as n from intentos where usuario_id = ${f.usuario_id} and estado in ('entregado', 'expirado')`;
    if ((conteo?.n ?? 0) >= 1 && await otorgarLogro(f.usuario_id, 'primer_ensayo', tx)) nuevos.push('primer_ensayo');
    if ((conteo?.n ?? 0) >= 10 && await otorgarLogro(f.usuario_id, 'diez_ensayos', tx)) nuevos.push('diez_ensayos');
    const [meta] = await tx<{ puntaje_meta: number | null }[]>`select puntaje_meta from usuarios where id = ${f.usuario_id}`;
    if (meta?.puntaje_meta && r.puntaje >= meta.puntaje_meta && await otorgarLogro(f.usuario_id, 'meta_superada', tx)) {
      nuevos.push('meta_superada');
    }
    if (nuevos.length === 0) return [];
    const logros = await tx<{ codigo: string; nombre: string; descripcion: string; icono: string }[]>`
      select codigo, nombre, descripcion, icono from logros where codigo = any(${nuevos}) order by orden`;
    return logros.map((l) => ({ ...l, obtenidoEn: ahora }));
  });
}

export function sumarDiasISO(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Guarda bajo el mismo bloqueo que la entrega, incluyendo control de revisión. */
export async function guardarRespuestaIntento(
  intentoId: string, usuarioId: string, preguntaId: string, datos: CambioRespuesta,
): Promise<{ ok: true; guardadoEn: string }> {
  const resultado = await sql.begin(async (tx) => {
    const [f] = await tx<FilaIntento[]>`
      select id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en, duracion_min
        from intentos where id = ${intentoId} and usuario_id = ${usuarioId} for update`;
    if (!f) throw noEncontrado('No encontramos ese intento.');
    if (f.estado !== 'en_curso') {
      throw conflicto('Este ensayo ya fue cerrado. Revisa tus resultados.', { estado: f.estado });
    }
    const [reloj] = await tx<{ ahora: unknown }[]>`select clock_timestamp() as ahora`;
    if (estaExpirado(f, aMs(reloj!.ahora))) return { expirado: f };
    const [pertenece] = await tx`
      select 1 from ensayo_preguntas where ensayo_id = ${f.ensayo_id} and pregunta_id = ${preguntaId}`;
    if (!pertenece) throw invalido('Esa pregunta no es parte de este ensayo.');
    if (datos.alternativaId) {
      const [alt] = await tx`
        select 1 from alternativas where id = ${datos.alternativaId} and pregunta_id = ${preguntaId}`;
      if (!alt) throw invalido('Esa alternativa no corresponde a la pregunta.');
    }
    const [actual] = await tx<{
      alternativa_id: string | null; es_marcada: boolean; tiempo_segundos: number; respondida_en: unknown;
    }[]>`
      select alternativa_id, es_marcada, tiempo_segundos, respondida_en from respuestas
       where intento_id = ${f.id} and pregunta_id = ${preguntaId}`;
    const cambio = resolverRespuesta(actual ? {
      alternativaId: actual.alternativa_id,
      esMarcada: actual.es_marcada,
      tiempoSegundos: actual.tiempo_segundos,
      guardadoEn: aIso(actual.respondida_en),
    } : null, datos);
    if (cambio.repetida && actual) return { guardadoEn: aIso(actual.respondida_en) };
    // clock_timestamp se evalúa de nuevo al escribir: esperar el lock no extiende el examen.
    const [guardada] = await tx<{ respondida_en: unknown }[]>`
      insert into respuestas (intento_id, pregunta_id, alternativa_id, es_marcada, tiempo_segundos, respondida_en)
      select ${f.id}, ${preguntaId}, ${cambio.alternativaId}, ${cambio.esMarcada}, ${cambio.tiempoSegundos},
             date_trunc('milliseconds', clock_timestamp())
       where clock_timestamp() < ${aIso(f.expira_en)}::timestamptz
      on conflict (intento_id, pregunta_id) do update
        set alternativa_id = excluded.alternativa_id, es_marcada = excluded.es_marcada,
            tiempo_segundos = excluded.tiempo_segundos,
            respondida_en = greatest(excluded.respondida_en, date_trunc('milliseconds', respuestas.respondida_en) + interval '1 millisecond')
      returning respondida_en`;
    if (!guardada) return { expirado: f };
    await tx`update intentos set actualizado_en = now() where id = ${f.id}`;
    return { guardadoEn: aIso(guardada.respondida_en) };
  });
  if (resultado.expirado) {
    await entregarIntento(resultado.expirado);
    throw conflicto('Se acabó el tiempo. El ensayo se cerró con las respuestas guardadas.', { estado: 'expirado' });
  }
  return { ok: true, guardadoEn: resultado.guardadoEn! };
}

/* --------------------------------------------------------------------------
 * Resultados
 * -------------------------------------------------------------------------- */

export async function preguntasResueltas(f: FilaIntento): Promise<
  (DTOPreguntaResuelta & { errorComun: string | null; videoUrl: string | null })[]
> {
  const { preguntas, alternativas } = await filasPreguntas(f.id, f.ensayo_id);
  return preguntas.map((p, i) => {
    const alts = alternativas.filter((a) => a.pregunta_id === p.id);
    const correcta = alts.find((a) => a.es_correcta);
    return {
      ...aPregunta(p, alts, i),
      esCorrecta: p.alternativa_id !== null && p.alternativa_id === correcta?.id,
      alternativaCorrectaId: correcta?.id ?? '',
      explicacion: p.explicacion ?? '',
      tuRespuestaId: p.alternativa_id,
      errorComun: p.error_comun,
      videoUrl: p.video_url,
    };
  });
}

export async function resultadosIntento(
  f: FilaIntento,
  logrosNuevos: DTOLogro[] = [],
): Promise<DTOResultadosCompletos> {
  const resumen = (await resumenIntento(f.id))!;
  const preguntas = await preguntasResueltas(f);

  const ejes = await sql<{ eje_id: string; nombre: string; materia_codigo: string; total: number; correctas: number; pct_logro: string }[]>`
    select re.eje_id, ej.nombre, m.codigo as materia_codigo, re.total, re.correctas, re.pct_logro
      from resultados_eje re join ejes ej on ej.id = re.eje_id join materias m on m.id = ej.materia_id
     where re.intento_id = ${f.id} order by ej.codigo`;
  const dtoEjes: DTOResultadoEje[] = ejes.map((e) => ({
    ejeId: e.eje_id,
    ejeNombre: e.nombre,
    materiaCodigo: e.materia_codigo,
    total: e.total,
    correctas: e.correctas,
    pctLogro: Number(e.pct_logro),
  }));

  const inicio = aMs(f.iniciado_en);
  const fin = f.entregado_en ? aMs(f.entregado_en) : Date.now();
  const duracionUsadaSegundos = Math.max(0, Math.min(Math.round((fin - inicio) / 1000), f.duracion_min * 60));
  const sumaPorPregunta = preguntas.reduce((acc, p) => acc + (p.respuestaActual?.tiempoSegundos ?? 0), 0);
  const total = preguntas.length || 1;
  const tiempoPromedioPregunta = Math.round((sumaPorPregunta > 0 ? sumaPorPregunta : duracionUsadaSegundos) / total);

  const [u] = await sql<{ puntaje_meta: number | null }[]>`select puntaje_meta from usuarios where id = ${f.usuario_id}`;
  const meta = u?.puntaje_meta ?? null;

  const [ant] = await sql<{ id: string; puntaje: number }[]>`
    select i.id, i.puntaje from intentos i join ensayos e on e.id = i.ensayo_id
     where i.usuario_id = ${f.usuario_id} and i.estado in ('entregado', 'expirado') and i.id <> ${f.id}
       and i.puntaje is not null and i.entregado_en < ${aIso(f.entregado_en ?? new Date().toISOString())}
       and e.prueba = ${resumen.prueba}
     order by i.entregado_en desc limit 1`;

  return {
    intento: resumen,
    duracionMin: f.duracion_min,
    duracionUsadaSegundos,
    tiempoPromedioPregunta,
    percentil: resumen.percentil,
    puntajeMeta: meta,
    distanciaMeta: meta !== null && resumen.puntaje !== null ? resumen.puntaje - meta : null,
    ejes: dtoEjes,
    // El DTO de resultados no expone error común ni video: van en la explicación.
    preguntas: preguntas.map(({ errorComun: _e, videoUrl: _v, ...p }) => p),
    anterior:
      ant && resumen.puntaje !== null
        ? { intentoId: ant.id, puntaje: ant.puntaje, diferencia: resumen.puntaje - ant.puntaje }
        : null,
    superaMeta: meta !== null && resumen.puntaje !== null && resumen.puntaje >= meta,
    ensayoSlug: resumen.slug,
    logrosNuevos,
  };
}
