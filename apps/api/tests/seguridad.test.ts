import { describe, expect, test } from 'bun:test';
import { firmaImagenValida, identidadPublica, ipValida, origenPermitido, reclamosValidos, rutaRetornoSegura } from '../src/services/seguridad';

describe('retornos OAuth y origen', () => {
  test('mantiene rutas locales con búsqueda y ancla', () => {
    expect(rutaRetornoSegura('/app/ensayos?q=M1#lista')).toBe('/app/ensayos?q=M1#lista');
  });
  test.each(['https://evil.test', '//evil.test', '/\\evil.test', '/%2fevil.test', '/%5cevil.test', '/\n/evil.test', '/%0devil.test', '/%zz'])('rechaza retorno inseguro %s', (valor) => {
    expect(rutaRetornoSegura(valor)).toBeNull();
  });
  test('compara orígenes completos sin confundir prefijos', () => {
    expect(origenPermitido('https://app.example', ['https://app.example/'])).toBe(true);
    expect(origenPermitido('https://app.example.evil.test', ['https://app.example'])).toBe(false);
    expect(origenPermitido('null', ['https://app.example'])).toBe(false);
    expect(origenPermitido(undefined, ['https://app.example'])).toBe(true);
  });
  test('una IP inválida no llega al cast inet de PostgreSQL', () => {
    expect(ipValida('999.999.999.999')).toBeNull();
    expect(ipValida('deadbeef')).toBeNull();
    expect(ipValida('127.0.0.1')).toBe('127.0.0.1');
    expect(ipValida('::1')).toBe('::1');
  });
});

describe('identidad y privacidad', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  test('un JWT necesita familia de sesión y rol válido', () => {
    expect(reclamosValidos({ sub: id, sid: id, rol: 'estudiante' })).toBe(true);
    expect(reclamosValidos({ sub: id, rol: 'estudiante' })).toBe(false);
    expect(reclamosValidos({ sub: id, sid: id, rol: 'owner' })).toBe(false);
    expect(reclamosValidos({ sub: 'not-a-uuid', sid: id, rol: 'admin' })).toBe(false);
  });
  test('el perfil público no filtra email, colegio, horarios, metas ni suscripción', () => {
    const privado = { id, nombre: 'Ana', apellido: 'Pérez', avatarUrl: null, rol: 'profesor' as const,
      email: 'privado@example.test', colegio: { nombre: 'Colegio privado' }, diasDisponibles: [1, 3],
      puntajeMeta: 850, fechaExamen: '2026-12-01', planActual: 'premium' };
    expect(identidadPublica(privado)).toEqual({ id, nombre: 'Ana', apellido: 'Pérez', avatarUrl: null, rol: 'profesor' });
  });
});

describe('validación de archivos', () => {
  test('HTML o SVG renombrado como imagen se rechaza', () => {
    const html = new TextEncoder().encode('<html><script>alert(1)</script></html>');
    for (const mime of ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']) {
      expect(firmaImagenValida(html, mime)).toBe(false);
    }
  });
  test('rechaza archivos vacíos y cabeceras PNG incompletas', () => {
    expect(firmaImagenValida(new Uint8Array(), 'image/png')).toBe(false);
    expect(firmaImagenValida(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]), 'image/png')).toBe(false);
  });
  test('reconoce una imagen PNG y rechaza MIME diferente', () => {
    const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9XcAAAAASUVORK5CYII=', 'base64'));
    expect(firmaImagenValida(png, 'image/png')).toBe(true);
    expect(firmaImagenValida(png, 'image/jpeg')).toBe(false);
  });
});
