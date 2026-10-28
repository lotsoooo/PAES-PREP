import Anthropic from '@anthropic-ai/sdk';
import type { DTOMensajeIA, DTORespuestaIA } from '@paes-pro/shared';
import { cargarContexto, type ContextoTutor } from './contexto.js';
import { responderSimulado } from './simulado.js';
import { responderAnthropic } from './anthropic.js';
import { config } from '../../config.js';

export { responderSimulado } from './simulado.js';

/**
 * Responde como tutor. Con ANTHROPIC_API_KEY usa Claude; sin clave, o si la
 * API falla o declina, responde el tutor simulado con el material real.
 */
export async function responderTutor(
  usuarioId: string,
  mensajes: DTOMensajeIA[],
  contexto?: { tipo: ContextoTutor['tipo']; id?: string },
): Promise<DTORespuestaIA> {
  const ctx = await cargarContexto(usuarioId, contexto);

  if (config.AI_PAID_ENABLED && config.ANTHROPIC_API_KEY && config.ANTHROPIC_MODEL) {
    try {
      const texto = await responderAnthropic(mensajes, ctx);
      if (texto) return { respuesta: texto, proveedor: 'anthropic' };
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) console.warn('[ia] Límite de la API de IA; uso el tutor simulado.');
      else if (error instanceof Anthropic.APIError) console.warn(`[ia] Proveedor no disponible (HTTP ${error.status}).`);
      else console.warn('[ia] Proveedor no disponible; se usará la demostración.');
    }
  }
  return { respuesta: responderSimulado(mensajes, ctx), proveedor: 'simulado' };
}
