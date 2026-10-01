/**
 * Aplica database/schema.sql de forma idempotente y genera el schema de Drizzle.
 * Uso: bun run src/db/pull.ts
 */
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config.js';

async function principal(): Promise<void> {
  const url = process.env.DATABASE_URL ?? config.DATABASE_URL;

  console.log('→ Aplicando database/schema.sql…');
  const cliente = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(cliente);

  const ruta = new URL('../../../../database/schema.sql', import.meta.url).pathname.replace(
    /^\/([A-Za-z]:)/,
    '$1',
  );
  const contenido = await Bun.file(ruta).text();
  await db.execute(sql.raw(contenido));
  console.log('  ✓ esquema aplicado');
  await cliente.end({ timeout: 5 });

  console.log('→ Generando src/db/schema.ts con drizzle-kit…');
  const proceso = Bun.spawn(
    ['bunx', 'drizzle-kit', 'pull'],
    {
      cwd: new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );
  const codigo = await proceso.exited;
  if (codigo !== 0) {
    throw new Error(`drizzle-kit pull falló con código ${codigo}`);
  }
  console.log('  ✓ src/db/schema.ts generado');
}

principal().catch((error: unknown) => {
  console.error('✗ Error:', error);
  process.exit(1);
});
