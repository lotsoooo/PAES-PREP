import { describe, expect, it } from 'vitest';
import { anioAdmision, diasHasta, fechaPaesConfigurada } from '@/config/marca';

describe('calendario de admisión', () => {
  it('no inventa un proceso ni una fecha oficial sin configuración', () => {
    expect(anioAdmision()).toBe('por confirmar');
    expect(fechaPaesConfigurada()).toBeNull();
  });
  it('cuenta días civiles según Santiago incluso cerca de medianoche UTC', () => {
    expect(diasHasta('2026-10-28', new Date('2026-10-28T02:30:00Z'))).toBe(1);
    expect(diasHasta('2026-10-28', new Date('2026-10-28T12:00:00Z'))).toBe(0);
    expect(diasHasta('2026-10-27', new Date('2026-10-28T12:00:00Z'))).toBe(0);
  });
});
