import type { ProveedorPago, ResultadoCobro, ResultadoConfirmacion, SolicitudCobro } from './tipos.js';

/**
 * Sandbox de Webpay de punta a punta, solo para desarrollo (`modoPagos` lo
 * bloquea en producción). Redirige a una página de la propia app que imita a
 * Transbank y permite aprobar o anular. Nunca pide datos de tarjeta.
 */
export function crearProveedorMock(urlApp: string): ProveedorPago {
  return {
    nombre: 'mock',

    async cobrar(_s: SolicitudCobro): Promise<ResultadoCobro> {
      const tokenPago = `mockwp_${crypto.randomUUID()}`;
      return {
        estado: 'redireccion',
        tokenPago,
        redirectUrl: `${urlApp}/app/premium/webpay?token=${encodeURIComponent(tokenPago)}`,
        payload: { proveedor: 'mock', simulado: true },
      };
    },

    async confirmar(tokenPago, _esperada, opciones): Promise<ResultadoConfirmacion> {
      if (!tokenPago.startsWith('mockwp_')) {
        return { estado: 'rechazado', motivo: 'La transacción no existe o ya expiró.', payload: { simulado: true } };
      }
      if (opciones?.aprobar !== true) {
        return {
          estado: 'rechazado',
          motivo: 'Anulaste el pago de prueba. No se realizó ningún cargo.',
          payload: { simulado: true, response_code: -1 },
        };
      }
      return { estado: 'aprobado', payload: { simulado: true, response_code: 0 } };
    },
  };
}
