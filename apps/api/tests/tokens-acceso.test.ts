import { describe, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { crearGestorAcceso } from '../src/http/tokens-acceso';

const secreto = 'solamente-para-pruebas-locales-1234567890';
const clave = new TextEncoder().encode(secreto);
const gestor = crearGestorAcceso(secreto, 15);
const identidad = { sub: '11111111-1111-4111-8111-111111111111', sid: '22222222-2222-4222-8222-222222222222', rol: 'estudiante' as const };

describe('JWT de acceso', () => {
  test('firma y verifica la identidad y su familia de sesión', async () => {
    expect(await gestor.verificar(await gestor.firmar(identidad))).toEqual(identidad);
  });
  test('rechaza firmas alteradas', async () => {
    const ajeno = crearGestorAcceso('otra-clave-de-pruebas-que-no-corresponde', 15);
    expect(await gestor.verificar(await ajeno.firmar(identidad))).toBeNull();
    expect(await gestor.verificar('no-es-un-jwt')).toBeNull();
  });
  test('rechaza tokens caducados', async () => {
    const token = await new SignJWT({ rol: identidad.rol, sid: identidad.sid }).setSubject(identidad.sub)
      .setProtectedHeader({ alg: 'HS256' }).setIssuer('paes-pro').setAudience('paes-pro-api')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10).sign(clave);
    expect(await gestor.verificar(token)).toBeNull();
  });
  test('rechaza JWT de otras audiencias e identidades sin sesión', async () => {
    const construir = () => new SignJWT({ rol: identidad.rol }).setSubject(identidad.sub)
      .setProtectedHeader({ alg: 'HS256' }).setIssuer('paes-pro').setExpirationTime('15m');
    expect(await gestor.verificar(await construir().setAudience('otra-api').sign(clave))).toBeNull();
    expect(await gestor.verificar(await construir().setAudience('paes-pro-api').sign(clave))).toBeNull();
  });
  test('rechaza algoritmos no admitidos aunque se use la misma clave', async () => {
    const token = await new SignJWT({ rol: identidad.rol, sid: identidad.sid }).setSubject(identidad.sub)
      .setProtectedHeader({ alg: 'HS384' }).setIssuer('paes-pro').setAudience('paes-pro-api')
      .setExpirationTime('15m').sign(clave);
    expect(await gestor.verificar(token)).toBeNull();
  });
});
