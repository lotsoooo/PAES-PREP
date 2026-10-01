import { sql } from './client.js';
import { aFechaISO, rachaDesdeFechas } from '../services/fechas.js';
import { calcularDistribucion, generarTareas, repartirHoras } from '../services/plan-generator.js';
import { PREGUNTAS, validarDataset } from './dataset/index.js';
import {
  PASSWORD_DEMO,
  PERFILES_PUBLICOS,
  PUBLICACIONES_DEMO,
  USUARIOS_DEMO,
  uuidEstable,
} from './dataset/demo.js';

/** Fecha actual truncada a dia. */
function hoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function masDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

/**
 * Fecha ISO (YYYY-MM-DD) en hora local del servidor.
 * Reusa `aFechaISO` en vez de `toISOString()` para no correr el riesgo de
 *Saltar de día por la zona horaria.
 */
function iso(d: Date): string {
  return aFechaISO(d);
}

// ---------------------------------------------------------------------------
// 1. USUARIOS
// ---------------------------------------------------------------------------
async function sembrarUsuarios(): Promise<Map<string, string>> {
  const passwordHash = await Bun.password.hash(PASSWORD_DEMO, { algorithm: 'argon2id' });
  const ids = new Map<string, string>();
  const base = hoy();

  for (const u of USUARIOS_DEMO) {
    const id = uuidEstable(u.clave);
    ids.set(u.clave, id);

    const carreraId = u.carrera
      ? sql`select id from carreras where nombre = ${u.carrera}`
      : null;

    const colegioId = u.colegioDominio
      ? sql`select id from colegios where dominio_email = ${u.colegioDominio}`
      : null;

    const fechaExamen = u.fechaExamenDiasAdelante
      ? iso(masDias(base, u.fechaExamenDiasAdelante))
      : null;

    await sql`
      insert into usuarios (
        id, email, nombre, apellido, password_hash, email_verificado, rol,
        onboarding_completado, curso, colegio_id, carrera_id, universidad_id,
        puntaje_meta, fecha_examen, horas_semana, dias_disponibles,
        creado_en, actualizado_en
      ) values (
        ${id}, ${u.email}, ${u.nombre}, ${u.apellido}, ${passwordHash}, true,
        ${u.rol}::rol_usuario, ${u.onboardingCompletado}, ${u.curso},
        ${colegioId}, ${carreraId}, null,
        ${u.puntajeMeta}, ${fechaExamen}, ${u.horasSemana},
        ${u.diasDisponibles}::smallint[],
        now(), now()
      )
      on conflict (id) do update set
        nombre = excluded.nombre,
        apellido = excluded.apellido,
        rol = excluded.rol,
        onboarding_completado = excluded.onboarding_completado,
        curso = excluded.curso,
        carrera_id = excluded.carrera_id,
        puntaje_meta = excluded.puntaje_meta,
        fecha_examen = excluded.fecha_examen,
        horas_semana = excluded.horas_semana,
        dias_disponibles = excluded.dias_disponibles,
        actualizado_en = now()
    `;

    await sql`
      insert into preferencias_usuario (usuario_id, tema)
      values (${id}, ${u.tema}::tema_app)
      on conflict (usuario_id) do update set tema = excluded.tema
    `;
  }

  return ids;
}

// ---------------------------------------------------------------------------
// 2. PREGUNTAS Y ALTERNATIVAS
// ---------------------------------------------------------------------------

interface EjeResuelto {
  materiaId: string;
  ejeId: string | null;
}

/** Resuelve los ids de materia/eje para cada clave de item. */
async function resolverEjes(): Promise<Map<string, EjeResuelto>> {
  const materias = await sql<{ id: string; codigo: string }[]>`
    select id, codigo from materias
  `;
  const ejes = await sql<{ id: string; materia_id: string; codigo: string }[]>`
    select e.id, e.materia_id, e.codigo
    from ejes e
    join materias m on m.id = e.materia_id
  `;

  const materiaPor = new Map(materias.map((m) => [m.codigo, m.id]));
  const ejePor = new Map(ejes.map((e) => [`${e.materia_id}:${e.codigo}`, e.id]));
  const resultado = new Map<string, EjeResuelto>();

  for (const p of PREGUNTAS) {
    const materiaId = materiaPor.get(p.materia);
    if (!materiaId) {
      throw new Error(`Materia inexistente en catalogos: ${p.materia} (item ${p.clave})`);
    }
    resultado.set(p.clave, {
      materiaId,
      ejeId: ejePor.get(`${materiaId}:${p.eje}`) ?? null,
    });
  }

  return resultado;
}

async function sembrarPreguntas(): Promise<Map<string, { preguntaId: string; alternativaId: string }>> {
  const ejes = await resolverEjes();
  const mapa = new Map<string, { preguntaId: string; alternativaId: string }>();

  for (const p of PREGUNTAS) {
    const eje = ejes.get(p.clave);
    if (!eje) throw new Error(`Sin resolver materia/eje para ${p.clave}`);

    const preguntaId = uuidEstable(`pregunta:${p.clave}`);

    await sql`
      insert into preguntas (id, materia_id, eje_id, tipo, enunciado, texto_base, explicacion, difficulty)
      values (
        ${preguntaId}, ${eje.materiaId}, ${eje.ejeId}, ${p.tipo},
        ${p.enunciado}, ${p.textoBase ?? null}, ${p.explicacion}, ${p.dificultad}
      )
      on conflict (id) do update set
        enunciado = excluded.enunciado,
        texto_base = excluded.texto_base,
        explicacion = excluded.explicacion,
        difficulty = excluded.difficulty
    `;

    let correctaId = '';

    for (const [pos, alt] of p.alternativas.entries()) {
      const alternativaId = uuidEstable(`alternativa:${p.clave}:${pos}`);
      if (alt.esCorrecta) correctaId = alternativaId;

      await sql`
        insert into alternativas (id, pregunta_id, texto, es_correcta, posicion)
        values (${alternativaId}, ${preguntaId}, ${alt.texto}, ${alt.esCorrecta}, ${pos})
        on conflict (id) do update set
          texto = excluded.texto,
          es_correcta = excluded.es_correcta
      `;
    }

    if (!correctaId) {
      throw new Error(`Item ${p.clave} no tiene alternativa correcta`);
    }
    mapa.set(p.clave, { preguntaId, alternativaId: correctaId });
  }

  return mapa;
}

// ---------------------------------------------------------------------------
// 3. ENSAYO <-> PREGUNTAS
// ---------------------------------------------------------------------------

/**
 * Enlaza los ítems a los ensayos ya sembrados por `database/seed.sql`.
 * Los ensayos reciben los ítems de su materia; el diagnóstico y los completos
 * se llevan todos, y la pregunta más fácil de cada eje se ordena al inicio.
 */
async function sembrarEnsayoPreguntas(): Promise<void> {
  const ensayos = await sql<{ id: string; slug: string; materia_id: string }[]>`
    select id, slug, materia_id from ensayos
  `;
  if (ensayos.length === 0) throw new Error('No hay ensayos: ejecuta antes database/seed.sql');

  // uuid -> clave lógica, porque `uuidEstable` no es invertible y el esquema
  // no guarda la clave: la reconstruimos desde el dataset en memoria.
  const clavePorId = new Map<string, { clave: string; dificultad: number }>();
  for (const p of PREGUNTAS) {
    clavePorId.set(uuidEstable(`pregunta:${p.clave}`), {
      clave: p.clave,
      dificultad: p.dificultad,
    });
  }

  for (const en of ensayos) {
    const items = await sql<{ id: string; difficulty: number }[]>`
      select p.id, p.difficulty
      from preguntas p
      where p.materia_id = ${en.materia_id}
      order by p.difficulty, p.enunciado
    `;
    if (items.length === 0) continue;

    for (const [pos, item] of items.entries()) {
      const meta = clavePorId.get(item.id);
      if (!meta) {
        throw new Error(
          `La pregunta ${item.id} del ensayo ${en.slug} no pertenece al dataset`,
        );
      }
      await sql`
        insert into ensayo_preguntas (ensayo_id, pregunta_id, posicion, puntaje)
        values (${en.id}, ${item.id}, ${pos}, ${10 + meta.dificultad * 2})
        on conflict (ensayo_id, posicion) do update set
          pregunta_id = excluded.pregunta_id,
          puntaje = excluded.puntaje
      `;
    }

    await sql`update ensayos set preguntas_count = ${items.length} where id = ${en.id}`;
  }
}

// ---------------------------------------------------------------------------
// 4. INTENTOS HISTORICOS
// ---------------------------------------------------------------------------

/**
 * Perfiles de Answer history. `acierto` es la probabilidad de responder
 * bien cada item, para que los graficos de precision tengan forma y no
 * sean planos. El valor es fijo: el seed es reproducible.
 */
interface PerfilHistorial {
  usuario: string;
  /** Probabilidad por dificultad (1..5) de acertar. */
  aciertoPorDificultad: [number, number, number, number, number];
  /** Numero de intentos a generar hacia atras. */
  intentos: number;
  /** Dias entre intento e intento. */
  cadaDias: number;
  /** Numero de items que responde por intento. */
  itemsPorIntento: number;
}

const PERFILES_HISTORIAL: PerfilHistorial[] = [
  {
    usuario: 'usuario:valentina',
    // Perfil solido y parejo: racha larga, precision alta y estable.
    aciertoPorDificultad: [0.95, 0.9, 0.8, 0.7, 0.55],
    intentos: 12,
    cadaDias: 2,
    itemsPorIntento: 8,
  },
  {
    usuario: 'usuario:martina',
    // Perfil en mejora: sube a lo largo de los intentos.
    aciertoPorDificultad: [0.85, 0.75, 0.6, 0.45, 0.3],
    intentos: 6,
    cadaDias: 4,
    itemsPorIntento: 6,
  },
  {
    usuario: 'usuario:carlos',
    // Perfil en descenso: parte bien y se estanca.
    aciertoPorDificultad: [0.7, 0.55, 0.45, 0.3, 0.2],
    intentos: 4,
    cadaDias: 6,
    itemsPorIntento: 5,
  },
];

/**
 * Generador determinista (mulberry32) sembrado por intento.
 * Evita `Math.random`, para que `db:seed` produzca siempre los mismos datos.
 */
function rngConSemilla(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSemilla(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function sembrarIntentos(usuarios: Map<string, string>): Promise<Map<string, string[]>> {
  const ramos = await sql<{ prueba: string }[]>`
    select distinct prueba from ensayos
  `;
  const idsPorPrueba = new Map<string, string[]>();

  for (const { prueba } of ramos) {
    const ids = await sql<{ id: string }[]>`
      select en.id from ensayos en
      join materias m on m.id = en.materia_id
      where en.prueba = ${prueba}
      order by en.duracion_min desc, en.titulo
    `;
    idsPorPrueba.set(prueba, ids.map((r) => r.id));
  }

  // Fechas de entrega por usuario, para calcular la racha despues.
  const entregasPorUsuario = new Map<string, string[]>();

  for (const perfil of PERFILES_HISTORIAL) {
    const usuarioId = usuarios.get(perfil.usuario);
    if (!usuarioId) continue;

    const entregas: string[] = [];

    for (let n = perfil.intentos - 1; n >= 0; n--) {
      const clave = `intento:${perfil.usuario}:${n}`;
      const intentoId = uuidEstable(clave);
      const rand = rngConSemilla(hashSemilla(clave));

      const iniciada = masDias(hoy(), -(n * perfil.cadaDias + 1));
      iniciada.setHours(17, 30, 0, 0);
      const duracionMin = 30 + Math.floor(rand() * 4) * 15;
      const entregada = new Date(iniciada.getTime() + duracionMin * 60_000);

      const items = await sql<
        {
          ensayo_id: string;
          pregunta_id: string;
          dificultad: number;
          eje_id: string | null;
          alternativa_correcta: string | null;
        }[]
      >`
        select ep.ensayo_id, ep.pregunta_id, p.difficulty as dificultad, p.eje_id,
               a.id as alternativa_correcta
        from ensayo_preguntas ep
        join ensayos en on en.id = ep.ensayo_id
        join preguntas p on p.id = ep.pregunta_id
        left join lateral (
          select id from alternativas
          where pregunta_id = p.id and es_correcta
          limit 1
        ) a on true
        where en.prueba = 'M1'
        order by ep.posicion
        limit ${perfil.itemsPorIntento}
      `;
      if (items.length === 0) continue;

      const ensayoId = items[0]!.ensayo_id;

      const respuestas = items.map((item) => {
        const p = Math.max(0, Math.min(0.99, perfil.aciertoPorDificultad[item.dificultad - 1] ?? 0.5));
        return { item, correcta: rand() < p };
      });

      const correctas = respuestas.filter((r) => r.correcta).length;
      const pctLogro = Number(((correctas / respuestas.length) * 100).toFixed(2));

      // Puntaje segun la conversion de la prueba M1 sembrada en seed.sql.
      const puntaje = 100 + Math.round((pctLogro / 100) * 900);

      await sql`
        insert into intentos (
          id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en,
          duracion_min, correctas, incorrectas, omitidas, pct_logro, puntaje
        )
        values (
          ${intentoId}, ${usuarioId}, ${ensayoId}, 'entregado'::estado_intento,
          ${iniciada.toISOString()}, ${entregada.toISOString()}, ${entregada.toISOString()},
          ${duracionMin}, ${correctas}, ${respuestas.length - correctas}, 0,
          ${pctLogro}, ${puntaje}
        )
        on conflict (id) do nothing
      `;

      for (const [pos, r] of respuestas.entries()) {
        const alternativas = await sql<{ id: string }[]>`
          select id from alternativas where pregunta_id = ${r.item.pregunta_id} order by posicion
        `;
        // Acierta: marca la correcta. Falla: marca otra cualquiera.
        const elegida = r.correcta
          ? r.item.alternativa_correcta
          : (alternativas.find((a) => a.id !== r.item.alternativa_correcta)?.id ?? null);

        await sql`
          insert into respuestas (
            intento_id, pregunta_id, alternativa_id, es_marcada, tiempo_segundos
          )
          values (${intentoId}, ${r.item.pregunta_id}, ${elegida}, true, ${20 + pos * 7})
          on conflict (intento_id, pregunta_id) do nothing
        `;

        if (r.item.eje_id) {
          await sql`
            insert into resultados_eje (intento_id, eje_id, total, correctas, pct_logro)
            select ${intentoId}, ${r.item.eje_id}, 1, ${r.correcta ? 1 : 0},
                   ${r.correcta ? 100 : 0}
            on conflict (intento_id, eje_id) do update set
              total = resultados_eje.total + 1,
              correctas = resultados_eje.correctas + excluded.correctas,
              pct_logro = round(
                (resultados_eje.correctas + excluded.correctas)::numeric
                / (resultados_eje.total + 1) * 100, 2
              )
          `;
        }
      }

      entregas.push(iso(entregada));
    }

    entregasPorUsuario.set(perfil.usuario, entregas);
  }

  return entregasPorUsuario;
}

// ---------------------------------------------------------------------------
// 5. RACHAS
// ---------------------------------------------------------------------------

async function sembrarRachas(
  usuarios: Map<string, string>,
  entregasPorUsuario: Map<string, string[]>,
): Promise<void> {
  const hoyIso = aFechaISO(hoy());

  for (const [clave, usuarioId] of usuarios) {
    const entregas = entregasPorUsuario.get(clave) ?? [];
    const { rachaActual, rachaMaxima, ultimaActividad } = rachaDesdeFechas(entregas, hoyIso);

    await sql`
      update usuarios
      set racha_actual = ${rachaActual},
          racha_maxima = greatest(${rachaMaxima}, racha_maxima),
          ultima_actividad = ${ultimaActividad},
          actualizado_en = now()
      where id = ${usuarioId}
    `;
  }
}

// ---------------------------------------------------------------------------
// 6. PLAN DE ESTUDIO
// ---------------------------------------------------------------------------

/**
 * Genera un plan de 4 semanas para cada estudiante usando el generador real,
 * de modo que las tareas del seed tengan la misma forma que las que producira
 * la API. El plan arranca hoy, no en el pasado.
 */
async function sembrarPlanes(usuarios: Map<string, string>): Promise<void> {
  const contenidos = await sql<{ id: string; materiaCodigo: string; titulo: string }[]>`
    select c.id, m.codigo as "materiaCodigo", c.titulo
    from contenidos c
    join materias m on m.id = c.materia_id
    order by c.orden, c.titulo
  `;

  const ensayos = await sql<{ id: string; materiaCodigo: string; titulo: string; premium: boolean }[]>`
    select en.id, m.codigo as "materiaCodigo", en.titulo, en.premium
    from ensayos en
    join materias m on m.id = en.materia_id
    where en.activo
    order by en.titulo
  `;

  for (const u of USUARIOS_DEMO) {
    if (u.rol !== 'estudiante') continue;
    const usuarioId = usuarios.get(u.clave);
    if (!usuarioId || u.horasSemana === 0) continue;

    const planId = uuidEstable(`plan:${u.clave}`);
    const semanas = 4;
    const hoyIso = iso(hoy());
    const finExamen = u.fechaExamenDiasAdelante
      ? masDias(hoy(), u.fechaExamenDiasAdelante)
      : null;

    const area = await sql<{ area: string }[]>`
      select ca.area from carreras ca join usuarios us on us.carrera_id = ca.id
      where us.id = ${usuarioId}
    `;
    const areaCarrera = area[0]?.area ?? null;

    const codigosDisponibles = [...new Set(contenidos.map((c) => c.materiaCodigo))];
    const distribucion = repartirHoras(
      calcularDistribucion(areaCarrera, codigosDisponibles),
      u.horasSemana,
    );

    await sql`
      insert into planes_estudio (
        id, usuario_id, carrera_id, horas_semana, fecha_inicio, fecha_examen,
        semanas, activo, generado_por
      )
      values (
        ${planId}, ${usuarioId},
        (select carrera_id from usuarios where id = ${usuarioId}),
        ${u.horasSemana}, ${hoyIso}, ${finExamen ? iso(finExamen) : null},
        ${semanas}, true, 'generador'
      )
      on conflict (id) do update set
        horas_semana = excluded.horas_semana,
        fecha_examen = excluded.fecha_examen,
        semanas = excluded.semanas
    `;

    for (const d of distribucion) {
      const materiaId = await sql<{ id: string }[]>`
        select id from materias where codigo = ${d.materiaCodigo}
      `;
      if (!materiaId[0]) continue;

      await sql`
        insert into plan_distribucion (plan_id, materia_id, porcentaje, horas_semana)
        values (${planId}, ${materiaId[0].id}, ${d.porcentaje}, ${d.horasSemana})
        on conflict (plan_id, materia_id) do update set
          porcentaje = excluded.porcentaje,
          horas_semana = excluded.horas_semana
      `;
    }

    const tareas = generarTareas({
      hoy: hoyIso,
      semanas,
      diasDisponibles: u.diasDisponibles,
      distribucion,
      restricciones: { contenidosDisponibles: contenidos, ensayosDisponibles: ensayos },
    });

    for (const [pos, t] of tareas.entries()) {
      const materiaId = t.materiaCodigo
        ? (await sql<{ id: string }[]>`select id from materias where codigo = ${t.materiaCodigo}`)[0]
            ?.id ?? null
        : null;

      await sql`
        insert into tareas_plan (
          id, plan_id, usuario_id, titulo, descripcion, tipo, contenido_id,
          ensayo_id, materia_id, fecha_planificada, duracion_min, estado
        )
        values (
          ${uuidEstable(`tarea:${u.clave}:${pos}`)}, ${planId}, ${usuarioId},
          ${t.titulo}, ${t.descripcion}, ${t.tipo}, ${t.contenidoId},
          ${t.ensayoId}, ${materiaId}, ${t.fechaPlanificada}, ${t.duracionMin},
          'pendiente'::estado_tarea
        )
        on conflict (id) do update set
          titulo = excluded.titulo,
          fecha_planificada = excluded.fecha_planificada,
          duracion_min = excluded.duracion_min
      `;
    }
  }
}

// ---------------------------------------------------------------------------
// 7. SUSCRIPCIONES
// ---------------------------------------------------------------------------

async function sembrarSuscripciones(usuarios: Map<string, string>): Promise<void> {
  // Valentina es premium (para ver analiticas avanzadas); Martina basico.
  const planes: { usuario: string; codigo: string }[] = [
    { usuario: 'usuario:valentina', codigo: 'premium' },
    { usuario: 'usuario:martina', codigo: 'basico' },
  ];

  for (const p of planes) {
    const usuarioId = usuarios.get(p.usuario);
    if (!usuarioId) continue;

    const plan = await sql<{ id: string }[]>`
      select id from planes_suscripcion where codigo = ${p.codigo}
    `;
    if (!plan[0]) continue;

    const id = uuidEstable(`suscripcion:${p.usuario}`);

    await sql`
      insert into suscripciones (
        id, usuario_id, plan_id, estado, proveedor, inicia_en, termina_en
      )
      values (
        ${id}, ${usuarioId}, ${plan[0].id}, 'activa'::estado_suscripcion,
        'mock'::proveedor_pago, ${masDias(hoy(), -30).toISOString()},
        ${p.codigo === 'basico' ? null : masDias(hoy(), 335).toISOString()}
      )
      on conflict (id) do update set estado = 'activa'::estado_suscripcion
    `;
  }
}

// ---------------------------------------------------------------------------
// 8. COMUNIDAD
// ---------------------------------------------------------------------------

async function sembrarComunidad(usuarios: Map<string, string>): Promise<void> {
  for (const p of PERFILES_PUBLICOS) {
    const usuarioId = usuarios.get(p.usuario);
    if (!usuarioId) continue;

    await sql`
      insert into perfiles_publicos (
        usuario_id, titulo, especialidad, bio, verificado,
        rating_promedio, rating_cantidad, seguidores
      )
      values (
        ${usuarioId}, ${p.titulo}, ${p.especialidad}, ${p.bio}, ${p.verificado},
        ${p.rating}, ${p.ratingCantidad}, ${p.seguidores}
      )
      on conflict (usuario_id) do update set
        titulo = excluded.titulo,
        especialidad = excluded.especialidad,
        bio = excluded.bio,
        verificado = excluded.verificado
    `;
  }

  for (const pub of PUBLICACIONES_DEMO) {
    const autorId = usuarios.get(pub.autor);
    if (!autorId) continue;

    const id = uuidEstable(pub.clave);
    const materiaId = pub.materia
      ? (await sql<{ id: string }[]>`select id from materias where codigo = ${pub.materia}`)[0]?.id ??
        null
      : null;
    const creada = masDias(hoy(), -pub.haceDias).toISOString();

    await sql`
      insert into publicaciones (
        id, usuario_id, materia_id, tipo, titulo, cuerpo, estado, resuelta, votos,
        creado_en, actualizado_en
      )
      values (
        ${id}, ${autorId}, ${materiaId}, ${pub.tipo}::tipo_publicacion,
        ${pub.titulo}, ${pub.cuerpo}, 'visible'::estado_publicacion,
        ${pub.resuelta}, 0, ${creada}, ${creada}
      )
      on conflict (id) do update set
        titulo = excluded.titulo,
        cuerpo = excluded.cuerpo,
        resuelta = excluded.resuelta
    `;

    for (const claveVotante of pub.voters) {
      const votanteId = usuarios.get(claveVotante);
      if (!votanteId || votanteId === autorId) continue;

      await sql`
        insert into votos (publicacion_id, usuario_id)
        values (${id}, ${votanteId})
        on conflict (publicacion_id, usuario_id) do nothing
      `;
    }

    // El contador `votos` se deriva de la tabla, no se escribe a mano.
    await sql`
      update publicaciones p set votos = v.total
      from (select publicacion_id, count(*)::int as total from votos group by publicacion_id) v
      where p.id = ${id} and v.publicacion_id = p.id
    `;
  }
}

// ---------------------------------------------------------------------------
// 9. PROGRESO DE CONTENIDOS
// ---------------------------------------------------------------------------

async function sembrarProgreso(usuarios: Map<string, string>): Promise<void> {
  const contenidos = await sql<{ id: string; materia_id: string }[]>`
    select id, materia_id from contenidos where premium = false order by orden
  `;

  for (const u of USUARIOS_DEMO) {
    if (u.rol !== 'estudiante') continue;
    const usuarioId = usuarios.get(u.clave);
    if (!usuarioId) continue;

    // El primer tercio queda completado, el segundo a medias.
    const corte = Math.floor(contenidos.length / 3);
    for (const [pos, c] of contenidos.entries()) {
      const completado = pos < corte;
      const porcentaje = completado ? 100 : pos === corte ? 45 : 0;

      await sql`
        insert into progreso_contenido (
          usuario_id, contenido_id, completado, porcentaje, iniciado_en, completado_en
        )
        values (
          ${usuarioId}, ${c.id}, ${completado}, ${porcentaje},
          ${masDias(hoy(), -(pos + 2)).toISOString()},
          ${completado ? masDias(hoy(), -(pos + 1)).toISOString() : null}
        )
        on conflict (usuario_id, contenido_id) do update set
          completado = excluded.completado,
          porcentaje = excluded.porcentaje
      `;
    }
  }
}

// ---------------------------------------------------------------------------
// ENTRYPOINT
// ---------------------------------------------------------------------------

export async function ejecutarSeed(): Promise<void> {
  validarDataset();

  console.log('> validando dataset de preguntas... ok');

  const usuarios = await sembrarUsuarios();
  console.log(`> usuarios demo: ${usuarios.size}`);

  const preguntas = await sembrarPreguntas();
  console.log(`> preguntas: ${preguntas.size}`);

  await sembrarEnsayoPreguntas();
  console.log('> ensayos enlazados');

  const entregas = await sembrarIntentos(usuarios);
  console.log(`> intentos historicos: ${[...entregas.values()].reduce((a, b) => a + b.length, 0)}`);

  await sembrarRachas(usuarios, entregas);
  console.log('> rachas calculadas');

  await sembrarPlanes(usuarios);
  console.log('> planes de estudio generados');

  await sembrarSuscripciones(usuarios);
  console.log('> suscripciones');

  await sembrarComunidad(usuarios);
  console.log('> comunidad');

  await sembrarProgreso(usuarios);
  console.log('> progreso de contenidos');

  console.log('\nSeed completado. Password demo de todas las cuentas: ' + PASSWORD_DEMO);
}

if (import.meta.main) {
  try {
    await ejecutarSeed();
    const { cerrarConexion } = await import('./client.js');
    await cerrarConexion();
    process.exit(0);
  } catch (error) {
    console.error('\nSeed fallo:', error);
    process.exit(1);
  }
}
