/**
 * db:migrate — aplica en orden los archivos de database/migrations/ que aún no
 * se han aplicado. Cada migración es aditiva e idempotente; la tabla
 * `_migraciones` solo evita repetir trabajo.
 * Uso: bun run db:migrate
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql, cerrarConexion } from './client.js';

const CARPETA = fileURLToPath(new URL('../../../../database/migrations/', import.meta.url));

async function principal(): Promise<void> {
  await sql`
    create table if not exists public._migraciones (
      nombre text primary key,
      aplicada_en timestamptz not null default now()
    )`;
  await sql`alter table public._migraciones enable row level security`;

  const aplicadas = new Set(
    (await sql<{ nombre: string }[]>`select nombre from public._migraciones`).map((m) => m.nombre),
  );
  const archivos = (await readdir(CARPETA)).filter((f) => f.endsWith('.sql')).sort();

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      console.log(`  · ${archivo} (ya aplicada)`);
      continue;
    }
    const contenido = await Bun.file(join(CARPETA, archivo)).text();
    await sql.unsafe(contenido);
    await sql`insert into public._migraciones (nombre) values (${archivo})`;
    console.log(`  ✓ ${archivo}`);
  }
}

principal()
  .then(() => cerrarConexion())
  .catch(async (error: unknown) => {
    console.error('✗ Error aplicando migraciones:', error);
    await cerrarConexion();
    process.exit(1);
  });
