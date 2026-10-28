/**
 * Contrato de una pasarela de pago. El API nunca recibe ni guarda datos de
 * tarjeta: el estudiante paga en la página de la pasarela (D-020, D-033).
 */

export interface SolicitudCobro {
  pagoId: string;
  referencia: string;
  montoClp: number;
  /** URL de vuelta tras pagar en la pasarela. */
  urlRetorno: string;
}

export type ResultadoCobro =
  | { estado: 'rechazado'; motivo: string; payload: Record<string, unknown> }
  | {
      estado: 'redireccion';
      tokenPago: string;
      redirectUrl: string;
      /** Webpay real exige un POST con `token_ws`; el sandbox usa GET. */
      tokenRedireccion?: string;
      payload: Record<string, unknown>;
    };

export type ResultadoConfirmacion =
  | { estado: 'aprobado'; payload: Record<string, unknown> }
  | { estado: 'rechazado'; motivo: string; payload: Record<string, unknown> };

export interface TransaccionPendiente {
  pagoId: string;
  referencia: string;
  montoClp: number;
}

export interface ProveedorPago {
  readonly nombre: 'mock' | 'webpay';
  cobrar(solicitud: SolicitudCobro): Promise<ResultadoCobro>;
  /**
   * Confirma una transacción que pasó por la página de la pasarela y verifica
   * que coincida con lo que se cobró. `aprobar` solo lo usa el sandbox.
   */
  confirmar(tokenPago: string, esperada: TransaccionPendiente, opciones?: { aprobar?: boolean }): Promise<ResultadoConfirmacion>;
}
