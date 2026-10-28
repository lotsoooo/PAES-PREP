import { describe, expect, it, vi } from 'vitest';
import { ColaAutoguardado } from '../src/components/ensayos/colaAutoguardado';
import { crearRelojEnsayo } from '../src/components/ensayos/relojEnsayo';

function preparar(enviar = vi.fn().mockResolvedValue({ guardadoEn: 'revision-1' }), temporal = true) {
  const persistir = vi.fn();
  const alEstado = vi.fn();
  const cola = new ColaAutoguardado({ enviar, persistir, alEstado, alCerrar: vi.fn(), clasificar: () => temporal ? 'temporal' : 'rechazado' }, [['p1', null]]);
  return { cola, enviar, persistir, alEstado };
}

describe('autoguardado de ensayos', () => {
  it('entregar espera el PUT que ya está en curso', async () => {
    let resolver!: (valor: { guardadoEn: string }) => void;
    const enviar = vi.fn(() => new Promise<{ guardadoEn: string }>((r) => { resolver = r; }));
    const { cola } = preparar(enviar);
    cola.encolar('p1', { alternativaId: 'a' });
    const primero = cola.vaciar();
    expect(cola.vaciar()).toBe(primero);
    resolver({ guardadoEn: 'revision-1' });
    expect(await primero).toBe(true);
    expect(enviar).toHaveBeenCalledTimes(1);
  });
  it('preserva la respuesta al perder conexión y la reintenta', async () => {
    const enviar = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ guardadoEn: 'r1' });
    const { cola, alEstado } = preparar(enviar);
    cola.encolar('p1', { alternativaId: 'a' });
    expect(await cola.vaciar()).toBe(false);
    expect(cola.cantidad).toBe(1);
    expect(alEstado).toHaveBeenLastCalledWith('sin_conexion', 'offline');
    expect(await cola.vaciar()).toBe(true);
    expect(cola.cantidad).toBe(0);
  });
  it('no oculta un conflicto ni descarta la respuesta rechazada', async () => {
    const { cola, alEstado } = preparar(vi.fn().mockRejectedValue(new Error('conflicto')), false);
    cola.encolar('p1', { alternativaId: 'b' });
    expect(await cola.vaciar()).toBe(false);
    expect(cola.cantidad).toBe(1);
    expect(alEstado).toHaveBeenLastCalledWith('error', 'conflicto');
  });
  it('envía la edición más reciente con la revisión recién confirmada', async () => {
    let resolver!: (valor: { guardadoEn: string }) => void;
    const enviar = vi.fn().mockImplementationOnce(() => new Promise((r) => { resolver = r; })).mockResolvedValue({ guardadoEn: 'r2' });
    const { cola } = preparar(enviar);
    cola.encolar('p1', { alternativaId: 'a' });
    const vaciado = cola.vaciar();
    cola.encolar('p1', { alternativaId: 'b' });
    resolver({ guardadoEn: 'r1' });
    expect(await vaciado).toBe(true);
    expect(enviar).toHaveBeenLastCalledWith('p1', { alternativaId: 'b', baseGuardadoEn: 'r1' });
  });
});

describe('cronómetro del ensayo', () => {
  it('usa la hora del servidor aunque el reloj local esté atrasado', () => {
    const reloj = crearRelojEnsayo('2026-10-28T12:01:00Z', '2026-10-28T12:00:00Z', 500, 0);
    expect(reloj(500)).toBe(60);
    expect(reloj(30_500)).toBe(30);
    expect(reloj(20_500)).toBe(30);
    expect(reloj(61_500)).toBe(0);
  });
  it('un tiempo inválido no permite extender el intento', () => {
    expect(crearRelojEnsayo('inválido', undefined, 0, 0)(0)).toBe(0);
  });
});
