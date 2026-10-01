import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from '../config.js';
import * as schema from './schema.js';

export const sql = postgres(config.DATABASE_URL, {
  max: config.NODE_ENV === 'production' ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Necesario con pgBouncer (Neon/Supabase pooler)
  onnotice: () => {},
});

export const db = drizzle(sql, { schema });

export type Db = typeof db;

/** Ping de salud para GET /api/health. */
export async function verificarConexion(): Promise<boolean> {
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  }
}

/** Cierra el pool (tests y apagado ordenado). */
export async function cerrarConexion(): Promise<void> {
  await sql.end({ timeout: 5 });
}
