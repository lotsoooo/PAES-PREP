import type { Context } from 'hono';
import type { z, ZodTypeAny } from 'zod';
import { invalido } from './errores.js';

/** Convierte los issues de Zod en `{ campo: mensaje }` para el formulario. */
function detallesZod(error: z.ZodError): Record<string, string> {
  const detalles: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || '_';
    if (!detalles[campo]) detalles[campo] = issue.message;
  }
  return detalles;
}

/** Lee y valida el cuerpo JSON. Un cuerpo vacío se valida como `{}`. */
export async function leerCuerpo<S extends ZodTypeAny>(c: Context, esquema: S): Promise<z.infer<S>> {
  let datos: unknown = {};
  const texto = await c.req.text();
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      throw invalido('El cuerpo de la petición no es JSON válido.');
    }
  }
  const r = esquema.safeParse(datos);
  if (!r.success) throw invalido('Revisa los datos del formulario.', detallesZod(r.error));
  return r.data;
}

/** Valida la query string. */
export function leerQuery<S extends ZodTypeAny>(c: Context, esquema: S): z.infer<S> {
  const r = esquema.safeParse(c.req.query());
  if (!r.success) throw invalido('Parámetros inválidos.', detallesZod(r.error));
  return r.data;
}

/** Valida un parámetro de ruta UUID y lo devuelve. */
export function leerUuid(c: Context, nombre = 'id'): string {
  const valor = c.req.param(nombre) ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) {
    throw invalido(`El parámetro ${nombre} no es un identificador válido.`);
  }
  return valor;
}

/** Cursor opaco = base64url de `{ fecha ISO, id }` para paginar por (creado_en, id). */
export function codificarCursor(fecha: string | Date, id: string): string {
  const iso = typeof fecha === 'string' ? fecha : fecha.toISOString();
  return Buffer.from(JSON.stringify([iso, id])).toString('base64url');
}

export function decodificarCursor(cursor: string | undefined): { fecha: string; id: string } | null {
  if (!cursor) return null;
  try {
    const [fecha, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as [string, string];
    if (typeof fecha !== 'string' || typeof id !== 'string') return null;
    return { fecha, id };
  } catch {
    return null;
  }
}
