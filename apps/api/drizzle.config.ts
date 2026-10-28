import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://paes:paes_local_dev@localhost:5432/paes_pro',
  },
  strict: true,
  verbose: true,
});
