import type { DTOResultadoBusqueda } from '@paes-pro/shared';
import { busquedaGlobalSchema } from '@paes-pro/shared';
import { sql } from '../db/client.js';
import { crearRouter, requiereSesion } from '../http/app.js';
import { leerQuery } from '../http/validar.js';

export const buscar = crearRouter();

buscar.use('*', requiereSesion);

/** Búsqueda global de la paleta de comandos (Ctrl/⌘ + K). */
buscar.get('/', async (c) => {
  const { q } = leerQuery(c, busquedaGlobalSchema);
  const patron = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;

  const [ensayos, contenidos, publicaciones] = await Promise.all([
    sql<{ slug: string; titulo: string; prueba: string; premium: boolean }[]>`
      select slug, titulo, prueba, premium from ensayos
       where activo and (unaccent(titulo) ilike unaccent(${patron}) or prueba ilike ${patron})
       order by titulo limit 5`,
    sql<{ slug: string; titulo: string; materia_codigo: string; tipo: string }[]>`
      select c.slug, c.titulo, m.codigo as materia_codigo, c.tipo::text as tipo
        from contenidos c join materias m on m.id = c.materia_id
       where c.activo and (unaccent(c.titulo) ilike unaccent(${patron})
                           or unaccent(coalesce(c.descripcion, '')) ilike unaccent(${patron}))
       order by c.orden, c.titulo limit 5`,
    sql<{ id: string; titulo: string }[]>`
      select id, titulo from publicaciones
       where estado = 'visible'
         and (busqueda @@ plainto_tsquery('spanish', ${q}) or unaccent(titulo) ilike unaccent(${patron}))
       order by ts_rank(busqueda, plainto_tsquery('spanish', ${q})) desc, creado_en desc
       limit 5`,
  ]);

  const respuesta: DTOResultadoBusqueda = {
    ensayos,
    contenidos: contenidos.map((c) => ({ slug: c.slug, titulo: c.titulo, materiaCodigo: c.materia_codigo, tipo: c.tipo })),
    publicaciones,
  };
  return c.json(respuesta);
});
