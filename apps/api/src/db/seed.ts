import { sql } from './client.js';
import { aFechaISO, rachaDesdeFechas } from '../services/fechas.js';
import { calcularDistribucion, generarTareas, repartirHoras } from '../services/plan-generator.js';
import { convertirPuntaje } from '../services/scoring/puntaje.js';
import { ENSAYOS_SEED, PREGUNTAS, validarDataset } from './dataset/index.js';
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

    // Se resuelven con await (no como subquery anidada): postgres.js 3.x
    // serializa mal los fragmentos `sql` anidados y rompe el SQL generado.
    const carreraId = u.carrera
      ? (await sql`select id from carreras where nombre = ${u.carrera}`)[0]?.id ?? null
      : null;

    const colegioId = u.colegioDominio
      ? (await sql`select id from colegios where dominio_email = ${u.colegioDominio}`)[0]?.id ?? null
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
 * Aplica `ENSAYOS_SEED` a los ensayos ya sembrados por `database/seed.sql`:
 * actualiza sus datos y reemplaza su lista de preguntas por la del dataset, en
 * el orden declarado. Solo toca la tabla puente: las respuestas de los
 * intentos apuntan a `preguntas`, no a `ensayo_preguntas` (D-024).
 */
async function sembrarEnsayoPreguntas(): Promise<void> {
  const ensayos = await sql<{ id: string; slug: string; materia_id: string }[]>`
    select id, slug, materia_id from ensayos
  `;
  if (ensayos.length === 0) throw new Error('No hay ensayos: ejecuta antes database/seed.sql');
  const porSlug = new Map(ensayos.map((e) => [e.slug, e]));
  const dificultadPor = new Map(PREGUNTAS.map((p) => [p.clave, p.dificultad]));

  for (const conf of ENSAYOS_SEED) {
    const en = porSlug.get(conf.slug);
    if (!en) throw new Error(`El ensayo ${conf.slug} no existe: revisa database/seed.sql`);

    await sql.begin(async (tx) => {
      await tx`
        update ensayos set
          titulo = ${conf.titulo}, descripcion = ${conf.descripcion},
          duracion_min = ${conf.duracionMin}, premium = ${conf.premium},
          nivel = ${conf.nivel}, es_diagnostico = ${conf.esDiagnostico}
        where id = ${en.id}
      `;
      await tx`delete from ensayo_preguntas where ensayo_id = ${en.id}`;
      for (const [pos, clave] of conf.preguntas.entries()) {
        await tx`
          insert into ensayo_preguntas (ensayo_id, pregunta_id, posicion, puntaje)
          values (${en.id}, ${uuidEstable(`pregunta:${clave}`)}, ${pos + 1}, ${10 + (dificultadPor.get(clave) ?? 1) * 2})
        `;
      }
      await tx`update ensayos set preguntas_count = ${conf.preguntas.length} where id = ${en.id}`;

      if (conf.pesosEje) {
        for (const [codigo, peso] of Object.entries(conf.pesosEje)) {
          await tx`
            insert into ensayo_ejes (ensayo_id, eje_id, peso)
            select ${en.id}, e.id, ${peso} from ejes e
            where e.materia_id = ${en.materia_id} and e.codigo = ${codigo}
            on conflict (ensayo_id, eje_id) do update set peso = excluded.peso
          `;
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 4. INTENTOS HISTORICOS
// ---------------------------------------------------------------------------

/**
 * Perfiles del historial demo. `aciertoPorDificultad` es la probabilidad de
 * acertar en el intento más reciente; `mejora` es cuánto más bajo partía el
 * primero (en puntos de probabilidad), para que la evolución tenga forma.
 * Todo es determinista: el seed produce siempre los mismos datos.
 */
interface PerfilHistorial {
  usuario: string;
  aciertoPorDificultad: [number, number, number, number, number];
  /** Diferencia de acierto entre el primer y el último intento (negativa = baja). */
  mejora: number;
  /** Probabilidad de dejar una pregunta en blanco. */
  omision: number;
  intentos: number;
  cadaDias: number;
  /** Puede rendir ensayos Premium. */
  premium: boolean;
}

const PERFILES_HISTORIAL: PerfilHistorial[] = [
  {
    usuario: 'usuario:valentina',
    // Sólida y constante: sube a lo largo del mes.
    aciertoPorDificultad: [0.9, 0.82, 0.7, 0.58, 0.45],
    mejora: 0.2,
    omision: 0.03,
    intentos: 12,
    cadaDias: 2,
    premium: true,
  },
  {
    usuario: 'usuario:martina',
    // En mejora clara desde un punto de partida bajo.
    aciertoPorDificultad: [0.8, 0.68, 0.55, 0.42, 0.3],
    mejora: 0.28,
    omision: 0.06,
    intentos: 6,
    cadaDias: 4,
    premium: false,
  },
  {
    usuario: 'usuario:carlos',
    // Parte bien y se estanca.
    aciertoPorDificultad: [0.7, 0.55, 0.45, 0.32, 0.22],
    mejora: -0.06,
    omision: 0.1,
    intentos: 4,
    cadaDias: 6,
    premium: false,
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

interface ItemEnsayo {
  pregunta_id: string;
  dificultad: number;
  eje_id: string | null;
  alternativa_correcta: string | null;
  alternativas: string[];
}

/**
 * Intentos M1 entregados de los usuarios demo. Cada intento responde el ensayo
 * completo y su puntaje sale de la misma tabla de conversión que usa el API.
 * Los ids son estables, así que al volver a sembrar se reemplazan (solo los
 * intentos creados por el seed; nunca los que el usuario rindió de verdad).
 */
async function sembrarIntentos(usuarios: Map<string, string>): Promise<Map<string, string[]>> {
  const ensayosM1 = await sql<{ id: string; premium: boolean; duracion_min: number }[]>`
    select id, premium, duracion_min from ensayos where prueba = 'M1' order by duracion_min, titulo
  `;
  const tramos = (
    await sql<{ pct_logro_min: number; pct_logro_max: number; puntaje_min: number; puntaje_max: number }[]>`
      select pct_logro_min, pct_logro_max, puntaje_min, puntaje_max from conversion_puntaje
      where prueba = 'M1' and version = (select max(version) from conversion_puntaje where prueba = 'M1')
      order by pct_logro_min
    `
  ).map((t) => ({
    pctLogroMin: Number(t.pct_logro_min),
    pctLogroMax: Number(t.pct_logro_max),
    puntajeMin: Number(t.puntaje_min),
    puntajeMax: Number(t.puntaje_max),
  }));

  const itemsPorEnsayo = new Map<string, ItemEnsayo[]>();
  for (const en of ensayosM1) {
    const filas = await sql<ItemEnsayo[]>`
      select ep.pregunta_id, p.difficulty as dificultad, p.eje_id,
             (select id from alternativas where pregunta_id = p.id and es_correcta limit 1) as alternativa_correcta,
             array(select id from alternativas where pregunta_id = p.id order by posicion) as alternativas
      from ensayo_preguntas ep
      join preguntas p on p.id = ep.pregunta_id
      where ep.ensayo_id = ${en.id}
      order by ep.posicion
    `;
    itemsPorEnsayo.set(en.id, filas);
  }

  // Fechas de entrega por usuario, para calcular la racha después.
  const entregasPorUsuario = new Map<string, string[]>();

  for (const perfil of PERFILES_HISTORIAL) {
    const usuarioId = usuarios.get(perfil.usuario);
    if (!usuarioId) continue;
    const disponibles = ensayosM1.filter((e) => perfil.premium || !e.premium);
    if (disponibles.length === 0 || tramos.length === 0) continue;

    const entregas: string[] = [];

    for (let n = perfil.intentos - 1; n >= 0; n--) {
      const clave = `intento:${perfil.usuario}:${n}`;
      const intentoId = uuidEstable(clave);
      const rand = rngConSemilla(hashSemilla(clave));
      const ensayo = disponibles[n % disponibles.length]!;
      const items = itemsPorEnsayo.get(ensayo.id) ?? [];
      if (items.length === 0) continue;

      // n = intentos-1 es el más antiguo: parte con `mejora` menos de acierto.
      const avance = perfil.intentos > 1 ? 1 - n / (perfil.intentos - 1) : 1;
      const ajuste = -perfil.mejora * (1 - avance);

      const respuestas = items.map((item) => {
        const base = perfil.aciertoPorDificultad[item.dificultad - 1] ?? 0.5;
        const p = Math.max(0.05, Math.min(0.97, base + ajuste + (rand() - 0.5) * 0.08));
        const omitida = rand() < perfil.omision;
        const correcta = !omitida && rand() < p;
        const incorrectas = item.alternativas.filter((a) => a !== item.alternativa_correcta);
        const elegida = omitida
          ? null
          : correcta
            ? item.alternativa_correcta
            : (incorrectas[Math.floor(rand() * incorrectas.length)] ?? null);
        return { item, correcta, elegida, segundos: 40 + Math.floor(rand() * 110) };
      });

      const correctas = respuestas.filter((r) => r.correcta).length;
      const omitidas = respuestas.filter((r) => r.elegida === null).length;
      const pctLogro = Number(((correctas / respuestas.length) * 100).toFixed(2));
      const puntaje = convertirPuntaje(tramos, pctLogro);
      const segundos = respuestas.reduce((a, r) => a + r.segundos, 0);
      const duracionMin = Math.min(ensayo.duracion_min, Math.ceil(segundos / 60));

      const iniciada = masDias(hoy(), -(n * perfil.cadaDias + 1));
      iniciada.setHours(17, 30, 0, 0);
      const entregada = new Date(iniciada.getTime() + duracionMin * 60_000);
      const expira = new Date(iniciada.getTime() + ensayo.duracion_min * 60_000);

      await sql.begin(async (tx) => {
        await tx`
          insert into intentos (
            id, usuario_id, ensayo_id, estado, iniciado_en, expira_en, entregado_en,
            duracion_min, correctas, incorrectas, omitidas, pct_logro, puntaje
          )
          values (
            ${intentoId}, ${usuarioId}, ${ensayo.id}, 'entregado'::estado_intento,
            ${iniciada.toISOString()}, ${expira.toISOString()}, ${entregada.toISOString()},
            ${duracionMin}, ${correctas}, ${respuestas.length - correctas - omitidas}, ${omitidas},
            ${pctLogro}, ${puntaje}
          )
          on conflict (id) do update set
            ensayo_id = excluded.ensayo_id, estado = excluded.estado,
            iniciado_en = excluded.iniciado_en, expira_en = excluded.expira_en,
            entregado_en = excluded.entregado_en, duracion_min = excluded.duracion_min,
            correctas = excluded.correctas, incorrectas = excluded.incorrectas,
            omitidas = excluded.omitidas, pct_logro = excluded.pct_logro, puntaje = excluded.puntaje
        `;
        await tx`delete from respuestas where intento_id = ${intentoId}`;
        await tx`delete from resultados_eje where intento_id = ${intentoId}`;

        for (const r of respuestas) {
          await tx`
            insert into respuestas (intento_id, pregunta_id, alternativa_id, es_marcada, tiempo_segundos)
            values (${intentoId}, ${r.item.pregunta_id}, ${r.elegida}, false, ${r.segundos})
          `;
        }

        const porEje = new Map<string, { total: number; correctas: number }>();
        for (const r of respuestas) {
          if (!r.item.eje_id) continue;
          const acc = porEje.get(r.item.eje_id) ?? { total: 0, correctas: 0 };
          acc.total += 1;
          if (r.correcta) acc.correctas += 1;
          porEje.set(r.item.eje_id, acc);
        }
        for (const [ejeId, acc] of porEje) {
          await tx`
            insert into resultados_eje (intento_id, eje_id, total, correctas, pct_logro)
            values (${intentoId}, ${ejeId}, ${acc.total}, ${acc.correctas}, ${Number(((acc.correctas / acc.total) * 100).toFixed(2))})
          `;
        }
      });

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
        usuario_id, titulo, especialidad, bio, verificado, es_demo,
        rating_promedio, rating_cantidad, seguidores
      )
      values (
        -- Perfil de ejemplo: nunca "verificado" (no hay verificación real detrás).
        ${usuarioId}, ${p.titulo}, ${p.especialidad}, ${p.bio}, false, true,
        ${p.rating}, ${p.ratingCantidad}, ${p.seguidores}
      )
      on conflict (usuario_id) do update set
        titulo = excluded.titulo,
        especialidad = excluded.especialidad,
        bio = excluded.bio,
        verificado = false,
        es_demo = true
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
