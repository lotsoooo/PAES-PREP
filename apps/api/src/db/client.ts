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

/**
 * Con esta configuración (pooler + prepare:false en Bun) postgres.js devuelve
 * timestamptz como texto y no acepta Date como parámetro. Regla del proyecto:
 * se envían strings ISO y se normaliza al leer con estos helpers (D-015).
 */
export function aIso(valor: unknown): string {
  return new Date(valor as string).toISOString();
}

export function aIsoONull(valor: unknown): string | null {
  return valor == null ? null : new Date(valor as string).toISOString();
}

export function aMs(valor: unknown): number {
  return new Date(valor as string).getTime();
}
