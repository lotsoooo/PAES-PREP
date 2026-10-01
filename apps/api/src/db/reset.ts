/**
 * db:reset — aplica database/schema.sql y luego database/seed.sql.
 * Uso: bun run db:reset
 */
import { aplicarSchema, aplicarSeedSql } from './aplicar.js';
import { cerrarConexion } from './client.js';

async function principal(): Promise<void> {
  console.log('→ Aplicando database/schema.sql…');
  await aplicarSchema();
  console.log('  ✓ esquema aplicado');

  console.log('→ Aplicando database/seed.sql…');
  await aplicarSeedSql();
  console.log('  ✓ catálogos y contenido editorial aplicados');

  console.log('\nBase de datos lista. Ejecuta `bun run db:seed` para los datos demo.');
}

principal()
  .then(() => cerrarConexion())
  .catch((error: unknown) => {
    console.error('✗ Error aplicando la base de datos:', error);
    process.exit(1);
  });
