import { conflicto } from '../http/errores.js';

export interface CambioRespuesta {
  alternativaId?: string | null;
  esMarcada?: boolean;
  tiempoSegundos?: number;
  baseGuardadoEn?: string | null;
}

export interface RespuestaGuardada {
  alternativaId: string | null;
  esMarcada: boolean;
  tiempoSegundos: number;
  guardadoEn: string;
}

/** Reintentar un PUT idéntico no cambia su revisión ni pisa otro campo. */
export function resolverRespuesta(actual: RespuestaGuardada | null, cambio: CambioRespuesta) {
  const repetida = actual !== null &&
    (cambio.alternativaId === undefined || cambio.alternativaId === actual.alternativaId) &&
    (cambio.esMarcada === undefined || cambio.esMarcada === actual.esMarcada) &&
    (cambio.tiempoSegundos === undefined || cambio.tiempoSegundos <= actual.tiempoSegundos);
  const coincide = cambio.baseGuardadoEn === undefined ||
    (cambio.baseGuardadoEn === null ? actual === null : actual !== null &&
      Date.parse(cambio.baseGuardadoEn) === Date.parse(actual.guardadoEn));
  if (!coincide && !repetida) {
    throw conflicto('La respuesta cambió en otra pestaña. Recarga el ensayo para revisar la versión guardada.', {
      razon: 'RESPUESTA_CONFLICTO',
    });
  }
  return {
    repetida,
    alternativaId: cambio.alternativaId === undefined ? actual?.alternativaId ?? null : cambio.alternativaId,
    esMarcada: cambio.esMarcada ?? actual?.esMarcada ?? false,
    tiempoSegundos: Math.max(cambio.tiempoSegundos ?? 0, actual?.tiempoSegundos ?? 0),
  };
}

export function estadoAlCerrar(expiraEn: string, ahora: string): 'entregado' | 'expirado' {
  return Date.parse(ahora) >= Date.parse(expiraEn) ? 'expirado' : 'entregado';
}
