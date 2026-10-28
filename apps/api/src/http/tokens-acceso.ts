import { SignJWT, jwtVerify } from 'jose';
import { reclamosValidos, type IdentidadAcceso } from '../services/seguridad.js';

/** Fábrica independiente del entorno para verificar el contrato criptográfico. */
export function crearGestorAcceso(secreto: string, minutos: number) {
  const clave = new TextEncoder().encode(secreto);
  return {
    async firmar(reclamos: IdentidadAcceso): Promise<string> {
      return new SignJWT({ rol: reclamos.rol, sid: reclamos.sid })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(reclamos.sub)
        .setIssuedAt()
        .setIssuer('paes-pro')
        .setAudience('paes-pro-api')
        .setExpirationTime(`${minutos}m`)
        .sign(clave);
    },
    async verificar(token: string): Promise<IdentidadAcceso | null> {
      try {
        const { payload } = await jwtVerify(token, clave, {
          issuer: 'paes-pro', audience: 'paes-pro-api', algorithms: ['HS256'],
        });
        if (!reclamosValidos(payload)) return null;
        return { sub: payload.sub, rol: payload.rol, sid: payload.sid };
      } catch {
        return null;
      }
    },
  };
}
