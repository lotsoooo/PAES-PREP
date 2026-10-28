import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { HttpError } from '../http/errores.js';

export function correoConfigurado(): boolean {
  return Boolean(config.SMTP_HOST && (!config.SMTP_USER || config.SMTP_PASSWORD));
}

/** SMTP real; jamás imprime tokens ni destinatarios ni simula un envío. */
export async function enviarRecuperacion(destinatario: string, token: string): Promise<void> {
  if (!correoConfigurado()) {
    throw new HttpError(503, 'INTERNAL_ERROR', 'La recuperación por correo no está disponible por ahora. Intenta más tarde.');
  }
  const enlace = new URL(`/recuperar/${encodeURIComponent(token)}`, config.APP_URL).toString();
  const transporte = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    requireTLS: config.NODE_ENV === 'production',
    ...(config.SMTP_USER ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
  try {
    const resultado = await transporte.sendMail({
      from: config.MAIL_FROM,
      to: destinatario,
      subject: 'Recupera tu contraseña de PAES Pro',
      text: `Recibimos una solicitud para cambiar tu contraseña. Abre este enlace:\n\n${enlace}\n\nSi no fuiste tú, ignora este correo. El enlace tiene un solo uso y vence pronto.`,
    });
    if (resultado.rejected.length > 0 || resultado.accepted.length === 0) throw new Error('Correo rechazado');
  } catch {
    // No propagar errores SMTP: pueden contener credenciales o el destinatario.
    throw new HttpError(503, 'INTERNAL_ERROR', 'No pudimos procesar la recuperación por correo. Intenta más tarde.');
  } finally {
    transporte.close();
  }
}
