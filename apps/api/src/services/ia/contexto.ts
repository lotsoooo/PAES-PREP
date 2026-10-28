import { sql } from '../../db/client.js';

/** Contexto académico que recibe el tutor (simulado o real). */
export interface ContextoTutor {
  tipo: 'leccion' | 'explicacion' | 'estadisticas' | 'general';
  titulo: string | null;
  /** Texto de referencia: cuerpo de la lección, enunciado + explicación, resumen de precisión. */
  material: string;
  /** Datos estructurados que el simulado usa para armar respuestas. */
  puntosClave: string[];
  ejesDebiles: { nombre: string; precision: number }[];
  nombreEstudiante: string;
}

/**
 * Lee de la BD el material del contexto. `id` es el slug de la lección, el
 * `intentoId:numero` de una explicación, o nada.
 */
export async function cargarContexto(
  usuarioId: string,
  contexto?: { tipo: ContextoTutor['tipo']; id?: string },
): Promise<ContextoTutor> {
  const [u] = await sql<{ nombre: string }[]>`select nombre from usuarios where id = ${usuarioId}`;
  const base: ContextoTutor = {
    tipo: contexto?.tipo ?? 'general',
    titulo: null,
    material: '',
    puntosClave: [],
    ejesDebiles: [],
    nombreEstudiante: u?.nombre ?? 'estudiante',
  };

  const ejes = await sql<{ nombre: string; precision: string }[]>`
    select ej.nombre, round(sum(re.correctas)::numeric * 100 / nullif(sum(re.total), 0), 1) as precision
      from resultados_eje re
      join intentos i on i.id = re.intento_id and i.estado in ('entregado', 'expirado')
      join ejes ej on ej.id = re.eje_id
     where i.usuario_id = ${usuarioId} and re.total > 0
     group by ej.nombre
     order by precision asc limit 3`;
  base.ejesDebiles = ejes.map((e) => ({ nombre: e.nombre, precision: Number(e.precision) }));

  if (contexto?.tipo === 'leccion' && contexto.id) {
    const [c] = await sql<{ titulo: string; cuerpo_md: string | null; puntos_clave: string[] }[]>`
      select titulo, cuerpo_md, puntos_clave from contenidos where slug = ${contexto.id} and activo`;
    if (c) {
      base.titulo = c.titulo;
      base.material = (c.cuerpo_md ?? '').slice(0, 6000);
      base.puntosClave = c.puntos_clave ?? [];
    }
  }

  if (contexto?.tipo === 'explicacion' && contexto.id) {
    const [intentoId, numero] = contexto.id.split(':');
    const n = Number(numero);
    if (intentoId && /^[0-9a-f-]{36}$/i.test(intentoId) && Number.isInteger(n)) {
      // Solo intentos propios y ya entregados: nunca se filtra la correcta antes (D-004).
      const [p] = await sql<{ enunciado: string; explicacion: string | null; error_comun: string | null; correcta: string; eje: string | null }[]>`
        select p.enunciado, p.explicacion, p.error_comun, a.texto as correcta, ej.nombre as eje
          from intentos i
          join ensayo_preguntas ep on ep.ensayo_id = i.ensayo_id
          join preguntas p on p.id = ep.pregunta_id
          join alternativas a on a.pregunta_id = p.id and a.es_correcta
          left join ejes ej on ej.id = p.eje_id
         where i.id = ${intentoId} and i.usuario_id = ${usuarioId} and i.estado in ('entregado', 'expirado')
         order by ep.posicion
         offset ${n - 1} limit 1`;
      if (p) {
        base.titulo = p.eje ? `Pregunta ${n} · ${p.eje}` : `Pregunta ${n}`;
        base.material = [
          `Enunciado: ${p.enunciado}`,
          `Respuesta correcta: ${p.correcta}`,
          p.explicacion ? `Explicación: ${p.explicacion}` : '',
          p.error_comun ? `Error común: ${p.error_comun}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        base.puntosClave = p.explicacion ? [p.explicacion] : [];
      }
    }
  }

  if (contexto?.tipo === 'estadisticas') {
    base.titulo = 'Tus estadísticas';
    base.material = base.ejesDebiles.length
      ? `Ejes con menor precisión: ${base.ejesDebiles.map((e) => `${e.nombre} (${e.precision} %)`).join(', ')}.`
      : 'Todavía no hay ensayos entregados.';
  }

  return base;
}
