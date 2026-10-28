import { config } from '../../config.js';
import { crearProveedorMock } from './mock.js';
import { crearProveedorWebpay } from './webpay.js';
import { modoPagos, type ModoPago } from './politica.js';
import type { ProveedorPago } from './tipos.js';

export type { ProveedorPago } from './tipos.js';

/** Modo efectivo según ambiente, proveedor, credenciales y permisos explícitos. */
export const MODO_PAGOS: ModoPago = modoPagos(config);

let proveedor: ProveedorPago | null | undefined;

/** Pasarela activa, o null si los pagos no están habilitados en este ambiente. */
export function proveedorPagos(): ProveedorPago | null {
  if (proveedor !== undefined) return proveedor;
  if (MODO_PAGOS === 'simulado') proveedor = crearProveedorMock(config.APP_URL);
  else if (MODO_PAGOS === 'integracion' || MODO_PAGOS === 'real') {
    proveedor = crearProveedorWebpay({
      apiKey: config.TRANSBANK_API_KEY!,
      apiSecret: config.TRANSBANK_API_SECRET!,
      ambiente: config.TRANSBANK_INTEGRATION_TYPE,
    });
  } else proveedor = null;
  return proveedor;
}

/** Días de vigencia por plan. */
export const DIAS_PLAN: Record<string, number> = { premium: 30, anual: 365 };
export const DIAS_PRUEBA = config.PREMIUM_TRIAL_DAYS;
