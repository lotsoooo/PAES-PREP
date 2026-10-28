import type { ProveedorPago, ResultadoCobro, ResultadoConfirmacion, SolicitudCobro } from './tipos.js';
import { confirmacionCoincide, resumenTransaccion } from './politica.js';

/**
 * Webpay Plus (Transbank) vía su API REST.
 *
 * - Crear transacción: POST {base}/rswebpaytransaction/api/webpay/v1.2/transactions
 *   con { buy_order, session_id, amount, return_url } → { token, url }.
 *   El navegador envía un POST a `url` con `token_ws`.
 * - Confirmar: PUT {base}/…/transactions/{token} → { status, response_code, amount, … }.
 *
 * Solo se crea con credenciales; sin ellas `modoPagos` devuelve
 * `no_disponible` y el checkout lo informa (no hay fallback silencioso).
 */
export interface OpcionesWebpay {
  apiKey: string;
  apiSecret: string;
  ambiente: 'integration' | 'production';
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

const BASES = {
  integration: 'https://webpay3gint.transbank.cl',
  production: 'https://webpay3g.transbank.cl',
} as const;

export function crearProveedorWebpay(o: OpcionesWebpay): ProveedorPago {
  if (!o.apiKey || !o.apiSecret) throw new Error('Webpay requiere credenciales explícitas.');
  const fetcher = o.fetcher ?? fetch;
  const base = `${BASES[o.ambiente]}/rswebpaytransaction/api/webpay/v1.2/transactions`;
  const cabeceras = {
    'Tbk-Api-Key-Id': o.apiKey,
    'Tbk-Api-Key-Secret': o.apiSecret,
    'Content-Type': 'application/json',
  };

  return {
    nombre: 'webpay',

    async cobrar(s: SolicitudCobro): Promise<ResultadoCobro> {
      const r = await fetcher(base, {
        method: 'POST',
        headers: cabeceras,
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          buy_order: s.referencia.slice(0, 26),
          session_id: s.pagoId.slice(0, 61),
          amount: s.montoClp,
          return_url: s.urlRetorno,
        }),
      });
      const datos = (await r.json().catch(() => ({}))) as { token?: string; url?: string };
      if (!r.ok || !datos.token || !datos.url) {
        return { estado: 'rechazado', motivo: 'Webpay no respondió. Intenta de nuevo en unos minutos.', payload: { http: r.status } };
      }
      if (new URL(datos.url).origin !== BASES[o.ambiente]) throw new Error('Webpay devolvió un destino no permitido.');
      return {
        estado: 'redireccion',
        tokenPago: datos.token,
        redirectUrl: datos.url,
        tokenRedireccion: datos.token,
        payload: { creada: true },
      };
    },

    async confirmar(tokenPago, esperada): Promise<ResultadoConfirmacion> {
      const destino = `${base}/${encodeURIComponent(tokenPago)}`;
      let r = await fetcher(destino, { method: 'PUT', headers: cabeceras, signal: AbortSignal.timeout(15_000) });
      // Recuperar una confirmación previa sin rechazar un pago que el proveedor ya cobró.
      if (!r.ok) r = await fetcher(destino, { method: 'GET', headers: cabeceras, signal: AbortSignal.timeout(15_000) });
      if (!r.ok) throw new Error('No pudimos verificar el pago. Reintenta la confirmación, no la compra.');
      const datos = await r.json() as Record<string, unknown>;
      const resumen = resumenTransaccion(datos);
      const esperadaWebpay = { ...esperada, referencia: esperada.referencia.slice(0, 26), pagoId: esperada.pagoId.slice(0, 61) };
      if (r.ok && confirmacionCoincide(datos, esperadaWebpay)) return { estado: 'aprobado', payload: resumen };
      if (datos.status === 'INITIALIZED' || datos.status === 'AUTHORIZED') throw new Error('El pago requiere conciliación: sigue pendiente o los datos no coinciden.');
      return { estado: 'rechazado', motivo: 'La pasarela no aprobó esta transacción. Revisa su estado antes de repetir el pago.', payload: resumen };
    },
  };
}
