export type ModoPago = 'simulado' | 'integracion' | 'real' | 'no_disponible';

export interface ConfiguracionPagos {
  NODE_ENV: 'development' | 'test' | 'production';
  PAYMENT_PROVIDER: 'mock' | 'webpay';
  PAYMENT_SANDBOX_ENABLED: boolean;
  PAYMENT_LIVE_ENABLED: boolean;
  TRANSBANK_INTEGRATION_TYPE: 'integration' | 'production';
  TRANSBANK_API_KEY?: string;
  TRANSBANK_API_SECRET?: string;
}

/** El permiso explícito y el ambiente se evalúan antes de escribir o llamar a una pasarela. */
export function modoPagos(c: ConfiguracionPagos): ModoPago {
  if (c.PAYMENT_PROVIDER === 'mock') {
    return c.NODE_ENV !== 'production' && c.PAYMENT_SANDBOX_ENABLED ? 'simulado' : 'no_disponible';
  }
  if (!c.TRANSBANK_API_KEY || !c.TRANSBANK_API_SECRET) return 'no_disponible';
  if (c.TRANSBANK_INTEGRATION_TYPE === 'production') {
    return c.NODE_ENV === 'production' && c.PAYMENT_LIVE_ENABLED ? 'real' : 'no_disponible';
  }
  return c.NODE_ENV !== 'production' && c.PAYMENT_SANDBOX_ENABLED ? 'integracion' : 'no_disponible';
}

export interface TransaccionEsperada {
  referencia: string;
  pagoId: string;
  montoClp: number;
}

export function confirmacionCoincide(datos: Record<string, unknown>, esperada: TransaccionEsperada): boolean {
  return datos.status === 'AUTHORIZED' && datos.response_code === 0 &&
    datos.amount === esperada.montoClp && datos.buy_order === esperada.referencia &&
    datos.session_id === esperada.pagoId;
}

/** Solo conservamos campos necesarios para conciliación, nunca la respuesta cruda. */
export function resumenTransaccion(datos: Record<string, unknown>): Record<string, unknown> {
  const permitidas = ['status', 'response_code', 'amount', 'buy_order', 'session_id', 'authorization_code'];
  return Object.fromEntries(permitidas.filter((k) => k in datos).map((k) => [k, datos[k]]));
}
