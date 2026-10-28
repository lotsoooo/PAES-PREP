import type { Page } from '@playwright/test';
import type { DTOIntento, DTOResultadosCompletos, DTOUsuarioSesion } from '@paes-pro/shared';
import { BANCO_M1 } from '../../../api/src/db/dataset/m1-banco';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** API EN MEMORIA exclusiva de QA. Nunca envía escrituras al backend conectado. */
export async function simularEnsayo(page: Page, segundos = 8400) {
  const ahora = new Date().toISOString();
  const usuario: DTOUsuarioSesion = {
    id: uuid(1), nombre: 'Estudiante de prueba', apellido: null, email: 'qa@example.test', avatarUrl: null,
    rol: 'estudiante', onboardingCompletado: true, esPremium: false, planActual: 'basico', curso: null,
    colegio: null, carrera: null, universidad: null, puntajeMeta: 800, fechaExamen: null, horasSemana: 5,
    diasDisponibles: [1, 3, 5], rachaActual: 0, rachaMaxima: 0, creadoEn: ahora, pruebasObjetivo: ['M1'], ultimaActividad: null,
  };
  const intento: DTOIntento = {
    id: uuid(2), ensayoId: uuid(3), slug: 'm1-qa', titulo: 'Ensayo M1 · datos de prueba', prueba: 'M1',
    estado: 'en_curso', iniciadoEn: ahora, entregadoEn: null, correctas: 0, incorrectas: 0, omitidas: 65,
    pctLogro: 0, puntaje: null, percentil: null, duracionMin: 140,
    expiraEn: new Date(Date.now() + segundos * 1000).toISOString(), indiceActual: 0, esPremium: false,
    preguntas: BANCO_M1.map((p, i) => ({
      id: uuid(100 + i), posicion: i + 1, tipo: p.tipo, enunciado: p.enunciado, textoBase: p.textoBase ?? null,
      dificultad: p.dificultad, ejeId: uuid(4), ejeNombre: 'Eje de prueba', materiaCodigo: 'M1',
      alternativas: p.alternativas.map((a, j) => ({ id: uuid(1000 + i * 5 + j), posicion: j + 1, texto: a.texto })),
      respuestaActual: null,
    })),
  };
  const estado = { sinRed: false, guardados: 0, entregas: 0, inesperadas: [] as string[], intento };
  let resultados: DTOResultadosCompletos | null = null;
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/api/v1', '');
    const responder = (json: unknown) => route.fulfill({ json });
    if (path === '/auth/refresh') return responder({ usuario, accessToken: 'token-solo-fixture' });
    if (path === '/auth/yo') return responder(usuario);
    if (path === '/notificaciones/resumen') return responder({ noLeidas: 0, recientes: [] });
    if (path === '/intentos' && req.method() === 'POST') return responder({ ...intento, servidorAhora: new Date().toISOString() });
    if (path.includes('/respuestas/') && req.method() === 'PUT') {
      if (estado.sinRed) return route.abort('internetdisconnected');
      const pregunta = intento.preguntas.find((p) => p.id === path.split('/').at(-1));
      if (!pregunta) throw new Error('Pregunta de fixture inexistente');
      const datos = req.postDataJSON();
      const guardadoEn = new Date(Date.now() + estado.guardados++).toISOString();
      pregunta.respuestaActual = {
        alternativaId: pregunta.respuestaActual?.alternativaId ?? null, esMarcada: false, tiempoSegundos: 0,
        ...pregunta.respuestaActual, ...datos, guardadoEn,
      };
      return responder({ ok: true, guardadoEn });
    }
    if (path.endsWith('/entregar')) {
      estado.entregas++;
      intento.estado = new Date(intento.expiraEn).getTime() <= Date.now() ? 'expirado' : 'entregado';
      intento.entregadoEn = new Date().toISOString();
      intento.omitidas = intento.preguntas.filter((p) => !p.respuestaActual?.alternativaId).length;
      intento.incorrectas = 65 - intento.omitidas;
      intento.puntaje = 100; // Valor de fixture, no evalúa el cálculo real del servidor.
      resultados = {
        intento, duracionMin: 140, duracionUsadaSegundos: segundos, tiempoPromedioPregunta: 1,
        percentil: null, puntajeMeta: 800, distanciaMeta: -700, ejes: [], anterior: null,
        superaMeta: false, ensayoSlug: intento.slug, logrosNuevos: [],
        preguntas: intento.preguntas.map((p) => ({ ...p, esCorrecta: false, alternativaCorrectaId: p.alternativas[0]!.id, explicacion: 'Explicación de prueba.', tuRespuestaId: p.respuestaActual?.alternativaId ?? null })),
      };
      return responder(resultados);
    }
    if (path.endsWith('/resultados')) return responder(resultados);
    estado.inesperadas.push(`${req.method()} ${path}`);
    return route.fulfill({ status: 501, json: { error: { code: 'FIXTURE_MISSING', message: 'Ruta no simulada' } } });
  });
  return estado;
}
