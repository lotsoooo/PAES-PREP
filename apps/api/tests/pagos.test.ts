import { describe, expect, test } from 'bun:test';
import { confirmacionCoincide, modoPagos, resumenTransaccion, type ConfiguracionPagos } from '../src/services/pagos/politica';
import { crearProveedorMock } from '../src/services/pagos/mock';
import { crearProveedorWebpay } from '../src/services/pagos/webpay';
import { checkoutSandboxSchema } from '@paes-pro/shared';

const base: ConfiguracionPagos = {
  NODE_ENV: 'development',
  PAYMENT_PROVIDER: 'mock',
  PAYMENT_SANDBOX_ENABLED: true,
  PAYMENT_LIVE_ENABLED: false,
  TRANSBANK_INTEGRATION_TYPE: 'integration',
};

describe('modo de pagos', () => {
  test('el sandbox simulado solo funciona fuera de producción y habilitado', () => {
    expect(modoPagos(base)).toBe('simulado');
    expect(modoPagos({ ...base, PAYMENT_SANDBOX_ENABLED: false })).toBe('no_disponible');
    expect(modoPagos({ ...base, NODE_ENV: 'production' })).toBe('no_disponible');
  });

  test('Webpay sin credenciales no cae a un simulador silencioso', () => {
    expect(modoPagos({ ...base, PAYMENT_PROVIDER: 'webpay' })).toBe('no_disponible');
  });

  test('Webpay de integración con credenciales en desarrollo', () => {
    const c = { ...base, PAYMENT_PROVIDER: 'webpay' as const, TRANSBANK_API_KEY: 'k', TRANSBANK_API_SECRET: 's' };
    expect(modoPagos(c)).toBe('integracion');
    expect(modoPagos({ ...c, NODE_ENV: 'production' })).toBe('no_disponible');
  });

  test('cobro real exige producción, credenciales de producción y permiso explícito', () => {
    const c = {
      ...base,
      NODE_ENV: 'production' as const,
      PAYMENT_PROVIDER: 'webpay' as const,
      TRANSBANK_INTEGRATION_TYPE: 'production' as const,
      TRANSBANK_API_KEY: 'k',
      TRANSBANK_API_SECRET: 's',
    };
    expect(modoPagos(c)).toBe('no_disponible');
    expect(modoPagos({ ...c, PAYMENT_LIVE_ENABLED: true })).toBe('real');
    expect(modoPagos({ ...c, NODE_ENV: 'development', PAYMENT_LIVE_ENABLED: true })).toBe('no_disponible');
  });
});

describe('checkout sin datos de tarjeta', () => {
  test('rechaza datos sensibles y tokens de un formulario propio', () => {
    const datos = { plan: 'premium', metodo: 'webpay' };
    expect(checkoutSandboxSchema.safeParse(datos).success).toBe(true);
    for (const campo of ['numero', 'cvv', 'pan', 'tokenTarjeta', 'ultimos4']) {
      expect(checkoutSandboxSchema.safeParse({ ...datos, [campo]: '1234' }).success).toBe(false);
    }
    expect(checkoutSandboxSchema.safeParse({ ...datos, metodo: 'tarjeta' }).success).toBe(false);
  });
});

describe('pasarela simulada', () => {
  const pasarela = crearProveedorMock('http://localhost:5173');
  const esperada = { pagoId: 'pago-1', referencia: 'PP-ABC', montoClp: 14990 };
  test('dos compras tienen tokens distintos y no piden tarjeta', async () => {
    const solicitud = { ...esperada, urlRetorno: 'http://localhost:3000/retorno' };
    const a = await pasarela.cobrar(solicitud);
    const b = await pasarela.cobrar(solicitud);
    expect(a.estado).toBe('redireccion');
    if (a.estado === 'redireccion' && b.estado === 'redireccion') {
      expect(a.tokenPago).not.toBe(b.tokenPago);
      expect(a.redirectUrl).toStartWith('http://localhost:5173/app/premium/webpay?token=');
    }
  });
  test('requiere una aprobación explícita; omitirla no activa Premium', async () => {
    expect((await pasarela.confirmar('mockwp_test', esperada)).estado).toBe('rechazado');
    expect((await pasarela.confirmar('mockwp_test', esperada, { aprobar: false })).estado).toBe('rechazado');
    expect((await pasarela.confirmar('mockwp_test', esperada, { aprobar: true })).estado).toBe('aprobado');
    expect((await pasarela.confirmar('token_ajeno', esperada, { aprobar: true })).estado).toBe('rechazado');
  });
});

describe('adaptador Webpay con transporte aislado', () => {
  const esperada = { pagoId: 'pago-1', referencia: 'PP-ABC', montoClp: 14990 };
  const autorizada = { status: 'AUTHORIZED', response_code: 0, amount: 14990, buy_order: 'PP-ABC', session_id: 'pago-1' };
  const opciones = { ambiente: 'integration' as const, apiKey: 'prueba-local', apiSecret: 'prueba-local' };
  test('confirma datos exactos y elimina datos sensibles de la respuesta', async () => {
    const pasarela = crearProveedorWebpay({ ...opciones, fetcher: async () => Response.json({ ...autorizada, card_detail: { card_number: '1234' } }) });
    const resultado = await pasarela.confirmar('token', esperada);
    expect(resultado.estado).toBe('aprobado');
    expect(resultado.payload).not.toHaveProperty('card_detail');
  });
  test('recupera una confirmación repetida consultando el estado autorizado', async () => {
    const metodos: string[] = [];
    const pasarela = crearProveedorWebpay({ ...opciones, fetcher: async (_url, init) => {
      metodos.push(init.method!);
      return init.method === 'PUT' ? new Response('', { status: 422 }) : Response.json(autorizada);
    } });
    expect((await pasarela.confirmar('token', esperada)).estado).toBe('aprobado');
    expect(metodos).toEqual(['PUT', 'GET']);
  });
  test('una respuesta autorizada con otro monto queda para conciliación y no concede Premium', async () => {
    const pasarela = crearProveedorWebpay({ ...opciones, fetcher: async () => Response.json({ ...autorizada, amount: 1 }) });
    await expect(pasarela.confirmar('token', esperada)).rejects.toThrow('conciliación');
  });
  test('un fallo de red no se convierte en una afirmación de rechazo sin cargo', async () => {
    const pasarela = crearProveedorWebpay({ ...opciones, fetcher: async () => new Response('', { status: 503 }) });
    await expect(pasarela.confirmar('token', esperada)).rejects.toThrow('verificar');
  });
  test('no redirige a un dominio ajeno ni acepta credenciales vacías', async () => {
    expect(() => crearProveedorWebpay({ ...opciones, apiKey: '' })).toThrow();
    const pasarela = crearProveedorWebpay({ ...opciones, fetcher: async () => Response.json({ token: 'token', url: 'https://ejemplo.invalid/capturar' }) });
    await expect(pasarela.cobrar({ ...esperada, urlRetorno: 'http://localhost/retorno' })).rejects.toThrow('destino');
  });
});

describe('confirmación de Webpay', () => {
  const esperada = { referencia: 'PP-ABC', pagoId: 'pago-1', montoClp: 14990 };
  const ok = { status: 'AUTHORIZED', response_code: 0, amount: 14990, buy_order: 'PP-ABC', session_id: 'pago-1' };

  test('acepta solo si estado, código, monto, orden y sesión coinciden', () => {
    expect(confirmacionCoincide(ok, esperada)).toBe(true);
    expect(confirmacionCoincide({ ...ok, amount: 1 }, esperada)).toBe(false);
    expect(confirmacionCoincide({ ...ok, buy_order: 'OTRA' }, esperada)).toBe(false);
    expect(confirmacionCoincide({ ...ok, session_id: 'pago-2' }, esperada)).toBe(false);
    expect(confirmacionCoincide({ ...ok, response_code: -1 }, esperada)).toBe(false);
    expect(confirmacionCoincide({ ...ok, status: 'FAILED' }, esperada)).toBe(false);
  });

  test('el resumen guardado no incluye datos de tarjeta', () => {
    const r = resumenTransaccion({ ...ok, card_detail: { card_number: '6623' }, accounting_date: '1027' });
    expect(r).not.toHaveProperty('card_detail');
    expect(Object.keys(r).sort()).toEqual(['amount', 'buy_order', 'response_code', 'session_id', 'status']);
  });
});
