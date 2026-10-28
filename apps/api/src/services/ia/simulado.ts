import type { DTOMensajeIA } from '@paes-pro/shared';
import type { ContextoTutor } from './contexto.js';

/**
 * Tutor sin modelo de lenguaje: arma respuestas didácticas a partir del
 * material real del contexto. Sirve en desarrollo y como respaldo si la API de
 * IA falla. Es determinista para que se pueda testear.
 */
export function responderSimulado(mensajes: DTOMensajeIA[], ctx: ContextoTutor): string {
  const pregunta = [...mensajes].reverse().find((m) => m.rol === 'usuario')?.texto ?? '';
  const p = pregunta.toLocaleLowerCase('es');
  const nombre = ctx.nombreEstudiante;

  const pideEjemplo = /ejemplo|ejercicio|practicar|práctica/.test(p);
  const pideResumen = /resum|clave|importante|repaso/.test(p);
  const noEntiende = /no entiendo|no entendí|por qué|porque|explica|cómo|como se/.test(p);
  const pidePlan = /plan|estudiar|mejorar|qué hago|que hago|subir/.test(p);

  if (ctx.tipo === 'explicacion' && ctx.material) {
    const lineas = ctx.material.split('\n');
    const correcta = lineas.find((l) => l.startsWith('Respuesta correcta:'))?.replace('Respuesta correcta:', '').trim();
    const explicacion = lineas.find((l) => l.startsWith('Explicación:'))?.replace('Explicación:', '').trim();
    const error = lineas.find((l) => l.startsWith('Error común:'))?.replace('Error común:', '').trim();
    const partes = [
      `Vamos paso a paso, ${nombre}.`,
      correcta ? `La alternativa correcta es ${correcta}.` : '',
      explicacion ? `La idea central: ${explicacion}` : '',
      error ? `Ojo con esto, porque es donde más se equivoca la gente: ${error}` : '',
      pideEjemplo
        ? 'Para practicar, cambia un dato del enunciado (por ejemplo, un número) y resuélvelo de nuevo siguiendo los mismos pasos. Si llegas a un resultado coherente, dominaste el procedimiento.'
        : 'Intenta explicarte el razonamiento con tus palabras antes de pasar a la siguiente pregunta: si puedes contarlo, lo entendiste.',
    ];
    return partes.filter(Boolean).join('\n\n');
  }

  if (ctx.tipo === 'leccion' && ctx.titulo) {
    if (pideResumen || (!noEntiende && !pideEjemplo)) {
      const puntos = ctx.puntosClave.length
        ? ctx.puntosClave.map((x) => `- ${x}`).join('\n')
        : '- Lee el desarrollo de la lección y anota la definición principal.';
      return `Lo esencial de **${ctx.titulo}**:\n\n${puntos}\n\nCuando termines, haz el mini-test de 3 preguntas para comprobar que quedó claro.`;
    }
    if (pideEjemplo) {
      return `Un buen ejercicio para **${ctx.titulo}**: toma el ejemplo resuelto de la lección, cambia uno de sus valores y resuélvelo sin mirar. Después compara cada paso con el original. Si quieres preguntas tipo PAES, el mini-test de esta lección usa el mismo eje.`;
    }
    const primerParrafo = ctx.material
      .split(/\n{2,}/)
      .map((s) => s.replace(/^#+\s*/, '').trim())
      .find((s) => s.length > 40);
    return [
      `Te lo explico de otra forma, ${nombre}.`,
      primerParrafo ?? `El tema central de ${ctx.titulo} es su definición: apréndela antes de memorizar fórmulas.`,
      ctx.puntosClave[0] ? `Si te quedas con una sola idea, que sea esta: ${ctx.puntosClave[0]}` : '',
      'Dime qué parte exacta no te calza y la desarmamos juntos.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (ctx.ejesDebiles.length && (ctx.tipo === 'estadisticas' || pidePlan)) {
    const [peor, ...resto] = ctx.ejesDebiles;
    return [
      `Mirando tus ensayos, ${nombre}, el eje que más puntaje te puede dar ahora es **${peor!.nombre}** (${peor!.precision} % de acierto).`,
      resto.length ? `Después siguen ${resto.map((e) => `${e.nombre} (${e.precision} %)`).join(' y ')}.` : '',
      'Mi recomendación para esta semana:\n- 2 lecciones del eje más débil, con su mini-test.\n- Repasar tu cuaderno de errores todos los días (10 minutos alcanzan).\n- Un ensayo cronometrado el fin de semana para medir el avance.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  return [
    `Hola, ${nombre}. Puedo ayudarte a entender una lección, revisar por qué fallaste una pregunta o armar un plan para tus ejes más débiles.`,
    'Para darte una respuesta útil, cuéntame el tema o abre el tutor desde una lección, una explicación o tus estadísticas.',
  ].join('\n\n');
}
