import type { DTOUsuario, Rol } from '@paes-pro/shared';
import { sql, aIso } from '../db/client.js';
import { noEncontrado } from '../http/errores.js';

/** Fila plana que devuelve `consultaUsuario`. */
interface FilaUsuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  avatar_url: string | null;
  rol: Rol;
  onboarding_completado: boolean;
  curso: string | null;
  puntaje_meta: number | null;
  fecha_examen: string | null;
  horas_semana: number | null;
  dias_disponibles: number[];
  pruebas_objetivo: string[];
  racha_actual: number;
  racha_maxima: number;
  ultima_actividad: string | null;
  creado_en: string;
  colegio_id: string | null;
  colegio_nombre: string | null;
  colegio_comuna: string | null;
  colegio_region: string | null;
  carrera_id: string | null;
  carrera_nombre: string | null;
  carrera_area: string | null;
  carrera_duracion: number | null;
  carrera_puntaje: number | null;
  carrera_popular: boolean | null;
  universidad_id: string | null;
  universidad_nombre: string | null;
  universidad_tipo: string | null;
  universidad_region: string | null;
  universidad_corte: number | null;
  plan_codigo: string | null;
}

export type DTOUsuarioCompleto = DTOUsuario & {
  pruebasObjetivo: string[];
  ultimaActividad: string | null;
};

/** Planes que habilitan Premium. */
export const CODIGOS_PREMIUM = ['premium', 'anual'] as const;

async function consultaUsuario(id: string): Promise<FilaUsuario | undefined> {
  const [fila] = await sql<FilaUsuario[]>`
    select u.id, u.email, u.nombre, u.apellido, u.avatar_url, u.rol, u.onboarding_completado,
           u.curso, u.puntaje_meta, to_char(u.fecha_examen, 'YYYY-MM-DD') as fecha_examen,
           u.horas_semana, u.dias_disponibles, u.pruebas_objetivo, u.racha_actual, u.racha_maxima,
           to_char(u.ultima_actividad, 'YYYY-MM-DD') as ultima_actividad, u.creado_en,
           co.id as colegio_id, co.nombre as colegio_nombre, co.comuna as colegio_comuna,
           co.region as colegio_region,
           ca.id as carrera_id, ca.nombre as carrera_nombre, ca.area as carrera_area,
           ca.duracion_anios as carrera_duracion, ca.puntaje_referencia as carrera_puntaje,
           ca.popular as carrera_popular,
           un.id as universidad_id, un.nombre as universidad_nombre, un.tipo as universidad_tipo,
           un.region as universidad_region, un.puntaje_corte as universidad_corte,
           (select ps.codigo from suscripciones s
              join planes_suscripcion ps on ps.id = s.plan_id
             where s.usuario_id = u.id and s.estado = 'activa'
               and (s.termina_en is null or s.termina_en > now())
             order by s.inicia_en desc limit 1) as plan_codigo
      from usuarios u
      left join colegios co on co.id = u.colegio_id
      left join carreras ca on ca.id = u.carrera_id
      left join universidades un on un.id = u.universidad_id
     where u.id = ${id} and u.eliminado_en is null`;
  return fila;
}

function aDTO(f: FilaUsuario): DTOUsuarioCompleto {
  const esPremium = f.plan_codigo !== null && (CODIGOS_PREMIUM as readonly string[]).includes(f.plan_codigo);
  return {
    id: f.id,
    email: f.email,
    nombre: f.nombre,
    apellido: f.apellido,
    avatarUrl: f.avatar_url,
    rol: f.rol,
    onboardingCompletado: f.onboarding_completado,
    esPremium,
    planActual: f.plan_codigo ?? 'basico',
    curso: f.curso,
    colegio: f.colegio_id
      ? { id: f.colegio_id, nombre: f.colegio_nombre!, comuna: f.colegio_comuna, region: f.colegio_region }
      : null,
    carrera: f.carrera_id
      ? {
          id: f.carrera_id,
          nombre: f.carrera_nombre!,
          area: f.carrera_area!,
          duracionAnios: f.carrera_duracion,
          puntajeReferencia: f.carrera_puntaje,
          popular: Boolean(f.carrera_popular),
        }
      : null,
    universidad: f.universidad_id
      ? {
          id: f.universidad_id,
          nombre: f.universidad_nombre!,
          tipo: f.universidad_tipo!,
          region: f.universidad_region,
          puntajeCorte: f.universidad_corte,
        }
      : null,
    puntajeMeta: f.puntaje_meta,
    fechaExamen: f.fecha_examen,
    horasSemana: f.horas_semana,
    diasDisponibles: f.dias_disponibles ?? [],
    pruebasObjetivo: f.pruebas_objetivo ?? [],
    rachaActual: rachaVigente(f.racha_actual, f.ultima_actividad),
    rachaMaxima: f.racha_maxima,
    ultimaActividad: f.ultima_actividad,
    creadoEn: aIso(f.creado_en),
  };
}

/**
 * La racha guardada solo sigue viva si la última actividad fue hoy o ayer.
 * Se corrige al leer para no depender de un cron que la reinicie.
 */
export function rachaVigente(racha: number, ultimaActividad: string | null, hoy = hoyChile()): number {
  if (!ultimaActividad) return 0;
  const dias = Math.round(
    (new Date(`${hoy}T00:00:00Z`).getTime() - new Date(`${ultimaActividad}T00:00:00Z`).getTime()) /
      86_400_000,
  );
  return dias <= 1 ? racha : 0;
}

/** Fecha de hoy en Chile (YYYY-MM-DD): la racha se corta a medianoche local. */
export function hoyChile(fecha: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

export async function obtenerUsuario(id: string): Promise<DTOUsuarioCompleto> {
  const fila = await consultaUsuario(id);
  if (!fila) throw noEncontrado('La cuenta no existe o fue eliminada.');
  return aDTO(fila);
}

export async function esPremium(usuarioId: string): Promise<boolean> {
  const [fila] = await sql<{ ok: boolean }[]>`
    select exists (
      select 1 from suscripciones s join planes_suscripcion ps on ps.id = s.plan_id
       where s.usuario_id = ${usuarioId} and s.estado = 'activa'
         and (s.termina_en is null or s.termina_en > now())
         and ps.codigo in ('premium', 'anual')
    ) as ok`;
  return Boolean(fila?.ok);
}
