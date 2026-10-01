import { sql } from 'drizzle-orm';
import { db } from './client.js';

/**
 * Aplica database/schema.sql completo.
 * Se ejecuta por fuera de Drizzle porque el esquema canónico vive en SQL
 * (fuente de verdad compartida con Supabase/Neon).
 */
export async function aplicarSchema(rutaArchivo?: string): Promise<void> {
  const ruta =
    rutaArchivo ??
    new URL('../../../../database/schema.sql', import.meta.url).pathname.replace(
      /^\/([A-Za-z]:)/,
      '$1',
    );

  const archivo = Bun.file(ruta);
  if (!(await archivo.exists())) {
    throw new Error(`No se encontró schema.sql en ${ruta}`);
  }

  const contenido = await archivo.text();
  await db.execute(sql.raw(contenido));
}

/**
 * Ejecuta database/seed.sql (catálogos + contenido editorial).
 * Es idempotente: se puede correr las veces que sea.
 */
export async function aplicarSeedSql(rutaArchivo?: string): Promise<void> {
  const ruta =
    rutaArchivo ??
    new URL('../../../../database/seed.sql', import.meta.url).pathname.replace(
      /^\/([A-Za-z]:)/,
      '$1',
    );

  const archivo = Bun.file(ruta);
  if (!(await archivo.exists())) {
    throw new Error(`No se encontró seed.sql en ${ruta}`);
  }

  const contenido = await archivo.text();
  await db.execute(sql.raw(contenido));
}
