import type { PreguntaSeed } from './tipos';

export const PREGUNTAS_FIS: PreguntaSeed[] = [
  {
    clave: 'FIS-A-1',
    materia: 'FIS',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Sobre un carro de 20 kg actúa una fuerza neta de 60 N. ¿Cuál es su aceleración?',
    explicacion:
      '1. Por la segunda ley de Newton, $F = m \\cdot a$.\n2. $a = \\frac{F}{m} = \\frac{60}{20} = 3$ m/s².',
    errorComun: 'Multiplicar fuerza por masa en vez de dividir, obteniendo 1.200.',
    dificultad: 2,
    alternativas: [
      { texto: '$3$ m/s²', esCorrecta: true },
      { texto: '$1.200$ m/s²', esCorrecta: false },
      { texto: '$\\frac{1}{3}$ m/s²', esCorrecta: false },
      { texto: '$80$ m/s²', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-A-2',
    materia: 'FIS',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Qué enunciado corresponde a la segunda ley de Newton?',
    explicacion:
      '1. La segunda ley relaciona fuerza neta, masa y aceleración: $\\vec{F} = m\\vec{a}$.\n2. La ley de acción y reacción es la tercera; la conservación de la energía no es una ley de Newton.',
    errorComun: 'Confundirla con la tercera ley (acción y reacción).',
    dificultad: 1,
    alternativas: [
      { texto: 'Toda fuerza produce un movimiento uniforme', esCorrecta: false },
      { texto: 'La fuerza neta es igual a la masa por la aceleración', esCorrecta: true },
      { texto: 'A toda acción corresponde una reacción de igual magnitud', esCorrecta: false },
      { texto: 'La energía de un sistema se conserva', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-B-1',
    materia: 'FIS',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Cuál es la frecuencia de una onda cuyo período es 0,5 s?',
    explicacion:
      '1. La frecuencia es el inverso del período: $f = \\frac{1}{T}$.\n2. $f = \\frac{1}{0{,}5} = 2$ Hz.',
    errorComun: 'Responder con el mismo valor del período (0,5 Hz).',
    dificultad: 1,
    alternativas: [
      { texto: '$0{,}5$ Hz', esCorrecta: false },
      { texto: '$2$ Hz', esCorrecta: true },
      { texto: '$4$ Hz', esCorrecta: false },
      { texto: '$1$ Hz', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-B-2',
    materia: 'FIS',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Qué característica distingue a una onda transversal?',
    explicacion:
      '1. En una onda transversal, las partículas del medio oscilan perpendicularmente a la dirección en que viaja la onda.\n2. En una onda longitudinal, como el sonido en el aire, oscilan en la misma dirección.',
    errorComun: 'Confundirla con la onda longitudinal.',
    dificultad: 2,
    alternativas: [
      { texto: 'Oscila en la misma dirección en que se propaga', esCorrecta: false },
      { texto: 'Oscila perpendicularmente a la dirección de propagación', esCorrecta: true },
      { texto: 'Solo se propaga en el vacío', esCorrecta: false },
      { texto: 'Siempre es una onda sonora', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-C-1',
    materia: 'FIS',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'Una resistencia de 10 Ω se conecta a una pila de 5 V. Según la ley de Ohm, ¿qué corriente circula?',
    explicacion:
      '1. La ley de Ohm establece $V = I \\cdot R$.\n2. Despejando: $I = \\frac{V}{R} = \\frac{5}{10} = 0{,}5$ A.',
    errorComun: 'Multiplicar voltaje por resistencia y obtener 50 A.',
    dificultad: 2,
    alternativas: [
      { texto: '$0{,}5$ A', esCorrecta: true },
      { texto: '$50$ A', esCorrecta: false },
      { texto: '$2$ A', esCorrecta: false },
      { texto: '$15$ A', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-C-2',
    materia: 'FIS',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿En qué unidad se mide la potencia eléctrica en el Sistema Internacional?',
    explicacion:
      '1. La potencia es energía por unidad de tiempo.\n2. Su unidad es el watt (W), equivalente a un joule por segundo.',
    errorComun: 'Elegir el ampere, que es la unidad de corriente eléctrica.',
    dificultad: 1,
    alternativas: [
      { texto: 'Watt', esCorrecta: true },
      { texto: 'Ampere', esCorrecta: false },
      { texto: 'Volt', esCorrecta: false },
      { texto: 'Ohm', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-D-1',
    materia: 'FIS',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Qué ocurre con la temperatura de un gas cuando se comprime rápidamente, sin que alcance a intercambiar calor con el entorno?',
    explicacion:
      '1. Sin intercambio de calor, el proceso es adiabático.\n2. El trabajo realizado sobre el gas aumenta su energía interna.\n3. Por eso su temperatura sube, como al inflar una rueda con un bombín.',
    errorComun: 'Pensar que la temperatura se mantiene porque no entra calor desde afuera.',
    dificultad: 3,
    alternativas: [
      { texto: 'Disminuye', esCorrecta: false },
      { texto: 'Aumenta', esCorrecta: true },
      { texto: 'Se mantiene constante', esCorrecta: false },
      { texto: 'Llega al cero absoluto', esCorrecta: false },
    ],
  },
  {
    clave: 'FIS-D-2',
    materia: 'FIS',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Qué establece la primera ley de la termodinámica?',
    explicacion:
      '1. La primera ley es la conservación de la energía aplicada al calor y el trabajo.\n2. La variación de energía interna es igual al calor recibido menos el trabajo realizado por el sistema: $\\Delta U = Q - W$.',
    errorComun: 'Confundirla con la segunda ley, que habla de la entropía.',
    dificultad: 3,
    alternativas: [
      { texto: 'Todo el calor se convierte siempre en trabajo', esCorrecta: false },
      { texto: 'La variación de energía interna es el calor recibido menos el trabajo realizado', esCorrecta: true },
      { texto: 'La entropía de un sistema aislado siempre disminuye', esCorrecta: false },
      { texto: 'La temperatura de un sistema es siempre constante', esCorrecta: false },
    ],
  },
];
