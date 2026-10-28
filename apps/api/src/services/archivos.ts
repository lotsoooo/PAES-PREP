import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { config } from '../config.js';
import { HttpError, invalido } from '../http/errores.js';
import { firmaImagenValida } from './seguridad.js';

/** Extensión por tipo MIME aceptado para imágenes subidas. */
const EXTENSIONES_IMAGEN: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Guarda una imagen subida en STORAGE_LOCAL_DIR con nombre uuid y devuelve la
 * URL pública servida por GET /api/v1/archivos/:nombre.
 * Con STORAGE_DRIVER=s3 se reemplaza esta función por la subida al bucket.
 */
export async function guardarImagen(archivo: unknown, maxBytes = 2 * 1024 * 1024): Promise<string> {
  if (!(archivo instanceof File)) {
    throw invalido('Adjunta una imagen en el campo "archivo".', { archivo: 'Falta la imagen' });
  }
  const extension = EXTENSIONES_IMAGEN[archivo.type];
  if (!extension) {
    throw invalido('Formato no soportado. Usa una imagen PNG, JPG, WEBP o GIF.', { archivo: 'Formato no soportado' });
  }
  if (archivo.size > maxBytes) {
    throw new HttpError(413, 'PAYLOAD_TOO_LARGE', `La imagen supera ${Math.round(maxBytes / 1024 / 1024)} MB. Elige una más liviana.`);
  }

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  // La firma real del archivo manda sobre el MIME declarado (HTML o SVG renombrado no pasa).
  if (!firmaImagenValida(bytes, archivo.type)) {
    throw invalido('El archivo no es una imagen válida.', { archivo: 'Imagen inválida' });
  }

  const nombre = `${crypto.randomUUID()}.${extension}`;
  if (config.STORAGE_DRIVER === 's3') {
    if (!config.STORAGE_PUBLIC_URL || !config.STORAGE_ACCESS_KEY_ID || !config.STORAGE_SECRET_ACCESS_KEY) {
      throw new HttpError(503, 'INTERNAL_ERROR', 'La subida de imágenes no está disponible por ahora.');
    }
    const base = new URL(config.STORAGE_PUBLIC_URL.endsWith('/') ? config.STORAGE_PUBLIC_URL : `${config.STORAGE_PUBLIC_URL}/`);
    if (base.protocol !== 'https:' && !(config.NODE_ENV !== 'production' && base.protocol === 'http:')) {
      throw new HttpError(503, 'INTERNAL_ERROR', 'La configuración del almacenamiento no es válida.');
    }
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const cliente = new S3Client({
      region: config.STORAGE_REGION,
      endpoint: config.STORAGE_ENDPOINT,
      credentials: { accessKeyId: config.STORAGE_ACCESS_KEY_ID, secretAccessKey: config.STORAGE_SECRET_ACCESS_KEY },
    });
    try {
      await cliente.send(new PutObjectCommand({
        Bucket: config.STORAGE_BUCKET, Key: nombre, Body: bytes,
        ContentType: archivo.type, ContentDisposition: 'inline',
        CacheControl: 'public, max-age=31536000, immutable',
      }));
    } catch {
      throw new HttpError(503, 'INTERNAL_ERROR', 'No pudimos guardar la imagen. Intenta de nuevo.');
    } finally {
      cliente.destroy();
    }
    return new URL(nombre, base).toString();
  }

  const carpeta = resolve(config.STORAGE_LOCAL_DIR);
  await mkdir(carpeta, { recursive: true });
  await Bun.write(join(carpeta, nombre), bytes);
  return `/api/v1/archivos/${nombre}`;
}
