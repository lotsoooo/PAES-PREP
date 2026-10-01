import { z } from 'zod';

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),

  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  APP_URL: z.string().default('http://localhost:5173'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  REFRESH_SECRET: z.string().min(32, 'REFRESH_SECRET debe tener al menos 32 caracteres'),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().min(1).max(120).default(15),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_BUCKET: z.string().default('paes-pro'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().optional(),
  STORAGE_LOCAL_DIR: z.string().default('uploads'),

  PAYMENT_PROVIDER: z.enum(['mock', 'webpay']).default('mock'),
  TRANSBANK_INTEGRATION_TYPE: z.enum(['integration', 'production']).default('integration'),
  TRANSBANK_API_KEY: z.string().optional(),
  TRANSBANK_API_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('PAES Pro <no-reply@paespro.cl>'),

  RATE_LIMIT_LOGIN: z.coerce.number().int().default(5),
  RATE_LIMIT_VENTANA_MIN: z.coerce.number().int().default(1),
});

export type Config = z.infer<typeof esquema>;

/** Lee el proceso (Bun carga .env automáticamente en desarrollo). */
export function cargarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const datos = esquema.safeParse(env);
  if (!datos.success) {
    const issues = datos.error.issues
      .map((i) => `  - ${i.path.join('.') || '(raíz)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuración inválida:\n${issues}`);
  }
  return datos.data;
}

export const config: Config = cargarConfig();
