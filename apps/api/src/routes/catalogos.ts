import { join, resolve } from 'node:path';
import type {
  Area,
  DTOCarrera,
  DTOColegio,
  DTODatosPlataforma,
  DTOMateriaConEjes,
  DTOOferta,
  DTOPlanSuscripcion,
  DTOUniversidad,
} from '@paes-pro/shared';
import { catalogoQuerySchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { config } from '../config.js';
import { crearRouter } from '../http/app.js';
import { noEncontrado } from '../http/errores.js';
import { leerQuery, leerUuid } from '../http/validar.js';

export const catalogos = crearRouter();

interface FilaCarrera {
  id: string;
  nombre: string;
  area: string;
  duracion_anios: number | null;
  puntaje_referencia: number | null;
  popular: boolean;
}

interface FilaUniversidad {
  id: string;
  nombre: string;
  tipo: string;
  region: string | null;
  puntaje_corte: number | null;
}

export function mapearCarrera(f: FilaCarrera): DTOCarrera {
  return {
    id: f.id,
    nombre: f.nombre,
    area: f.area,
    duracionAnios: f.duracion_anios,
    puntajeReferencia: f.puntaje_referencia,
    popular: f.popular,
  };
}

export function mapearUniversidad(f: FilaUniversidad): DTOUniversidad {
  return { id: f.id, nombre: f.nombre, tipo: f.tipo, region: f.region, puntajeCorte: f.puntaje_corte };
}

/** Patrón ILIKE sin tildes: "medicína" encuentra "Medicina". */
function patron(q: string): string {
  return `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
}

catalogos.get('/carreras', async (c) => {
  const { q, limite } = leerQuery(c, catalogoQuerySchema);
  const filas = q
    ? await sql<FilaCarrera[]>`
        select id, nombre, area, duracion_anios, puntaje_referencia, popular
          from carreras
         where unaccent(nombre) ilike unaccent(${patron(q)})
         order by (unaccent(lower(nombre)) like unaccent(lower(${`${q}%`}))) desc, popular desc, nombre
         limit ${limite}`
    : await sql<FilaCarrera[]>`
        select id, nombre, area, duracion_anios, puntaje_referencia, popular
          from carreras order by popular desc, nombre limit ${limite}`;
  return c.json(filas.map(mapearCarrera));
});

catalogos.get('/carreras/:id/ofertas', async (c) => {
  const id = leerUuid(c);
  const [carrera] = await sql<FilaCarrera[]>`
    select id, nombre, area, duracion_anios, puntaje_referencia, popular from carreras where id = ${id}`;
  if (!carrera) throw noEncontrado('No encontramos esa carrera. Búscala de nuevo en el listado.');

  const filas = await sql<(FilaUniversidad & { corte: number })[]>`
    select u.id, u.nombre, u.tipo, u.region, u.puntaje_corte, cu.puntaje_corte as corte
      from carreras_universidades cu join universidades u on u.id = cu.universidad_id
     where cu.carrera_id = ${id}
     order by cu.puntaje_corte desc, u.nombre`;

  const ofertas: DTOOferta[] = filas.map((f) => ({
    carrera: mapearCarrera(carrera),
    universidad: mapearUniversidad(f),
    puntajeCorte: f.corte,
  }));
  return c.json(ofertas);
});

catalogos.get('/universidades', async (c) => {
  const { q, limite } = leerQuery(c, catalogoQuerySchema);
  const filas = q
    ? await sql<FilaUniversidad[]>`
        select id, nombre, tipo, region, puntaje_corte from universidades
         where unaccent(nombre) ilike unaccent(${patron(q)})
         order by nombre limit ${limite}`
    : await sql<FilaUniversidad[]>`
        select id, nombre, tipo, region, puntaje_corte from universidades
         order by puntaje_corte desc nulls last, nombre limit ${limite}`;
  return c.json(filas.map(mapearUniversidad));
});

catalogos.get('/colegios', async (c) => {
  const { q, limite } = leerQuery(c, catalogoQuerySchema);
  const filas = q
    ? await sql<DTOColegio[]>`
        select id, nombre, comuna, region from colegios
         where activo and (unaccent(nombre) ilike unaccent(${patron(q)})
                           or unaccent(coalesce(comuna, '')) ilike unaccent(${patron(q)}))
         order by nombre, comuna limit ${limite}`
    : await sql<DTOColegio[]>`
        select id, nombre, comuna, region from colegios where activo
         order by nombre, comuna limit ${limite}`;
  return c.json(filas.map((f) => ({ id: f.id, nombre: f.nombre, comuna: f.comuna, region: f.region })));
});

catalogos.get('/materias', async (c) => {
  const materias = await sql<{ id: string; codigo: string; nombre: string; area: Area }[]>`
    select id, codigo, nombre, area from materias where activo
     order by array_position(array['M1','M2','CL','BIO','FIS','QUI','HIST'], codigo), nombre`;
  const ejes = await sql<{ id: string; materia_id: string; codigo: string; nombre: string; descripcion: string | null }[]>`
    select id, materia_id, codigo, nombre, descripcion from ejes order by codigo`;

  const respuesta: DTOMateriaConEjes[] = materias.map((m) => ({
    ...m,
    ejes: ejes
      .filter((e) => e.materia_id === m.id)
      .map((e) => ({ id: e.id, codigo: e.codigo, nombre: e.nombre, descripcion: e.descripcion })),
  }));
  return c.json(respuesta);
});

catalogos.get('/planes-suscripcion', async (c) => {
  const filas = await sql<{
    id: string; codigo: string; nombre: string; descripcion: string | null; precio_clp: number;
    ensayos_mes: number; analytics_avanzados: boolean; video_premium: boolean; destacado: boolean;
  }[]>`
    select id, codigo, nombre, descripcion, precio_clp, ensayos_mes, analytics_avanzados,
           video_premium, destacado
      from planes_suscripcion where activo order by precio_clp`;
  const planes: DTOPlanSuscripcion[] = filas.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precioClp: p.precio_clp,
    ensayosMes: p.ensayos_mes,
    analyticsAvanzados: p.analytics_avanzados,
    videoPremium: p.video_premium,
    destacado: p.destacado,
  }));
  return c.json(planes);
});

catalogos.get('/datos-plataforma', async (c) => {
  const [d] = await sql<{ preguntas: number; ensayos: number; contenidos: number; pruebas: number; carreras: number }[]>`
    select (select count(*)::int from preguntas where activo) as preguntas,
           (select count(*)::int from ensayos where activo) as ensayos,
           (select count(*)::int from contenidos where activo) as contenidos,
           (select count(distinct prueba)::int from ensayos where activo) as pruebas,
           (select count(*)::int from carreras) as carreras`;
  const datos: DTODatosPlataforma = d!;
  c.header('Cache-Control', 'public, max-age=300');
  return c.json(datos);
});

/* --------------------------------------------------------------------------
 * Archivos subidos (avatares, imágenes de publicaciones)
 * -------------------------------------------------------------------------- */

const TIPOS_ARCHIVO: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

catalogos.get('/archivos/:nombre', async (c) => {
  const nombre = c.req.param('nombre');
  // Solo nombres generados por el API: uuid/letras + extensión conocida.
  const coincide = /^[a-zA-Z0-9_-]{1,80}\.([a-z0-9]{2,5})$/.exec(nombre);
  const tipo = coincide ? TIPOS_ARCHIVO[coincide[1]!] : undefined;
  if (!coincide || !tipo) throw noEncontrado('El archivo no existe.');

  const carpeta = resolve(config.STORAGE_LOCAL_DIR);
  const ruta = resolve(join(carpeta, nombre));
  if (!ruta.startsWith(carpeta)) throw noEncontrado('El archivo no existe.');

  const archivo = Bun.file(ruta);
  if (!(await archivo.exists())) throw noEncontrado('El archivo no existe.');

  return new Response(archivo, {
    headers: {
      'Content-Type': tipo,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
