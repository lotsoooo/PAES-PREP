import type { PreguntaSeed } from './tipos';

export const PREGUNTAS_BIO: PreguntaSeed[] = [
  {
    clave: 'BIO-A-1',
    materia: 'BIO',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Qué organelo realiza la respiración celular y produce la mayor parte del ATP de la célula?',
    explicacion:
      '1. La respiración celular aeróbica ocurre principalmente en la mitocondria.\n2. Allí se oxidan los nutrientes y se produce ATP, la "moneda energética" de la célula.',
    errorComun: 'Elegir el ribosoma, que sintetiza proteínas pero no produce ATP.',
    dificultad: 1,
    alternativas: [
      { texto: 'El ribosoma', esCorrecta: false },
      { texto: 'La mitocondria', esCorrecta: true },
      { texto: 'El aparato de Golgi', esCorrecta: false },
      { texto: 'El nucléolo', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-A-2',
    materia: 'BIO',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿En qué etapa del ciclo celular se replica el ADN?',
    explicacion:
      '1. La interfase se divide en G1, S y G2.\n2. En la fase S (síntesis) se duplica el ADN, de modo que cada cromosoma queda con dos cromátidas.\n3. La mitosis reparte ese material ya duplicado.',
    errorComun: 'Pensar que el ADN se duplica durante la mitosis, cuando en realidad ya llega duplicado.',
    dificultad: 2,
    alternativas: [
      { texto: 'Fase G1', esCorrecta: false },
      { texto: 'Fase S', esCorrecta: true },
      { texto: 'Fase G2', esCorrecta: false },
      { texto: 'Mitosis', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-B-1',
    materia: 'BIO',
    eje: 'B',
    tipo: 'multiple',
    enunciado:
      'Se cruzan plantas de flores rojas homocigotas (RR) con plantas de flores blancas (rr). Si el rojo es dominante, ¿qué porcentaje de la F1 tendrá flores rojas?',
    explicacion:
      '1. Un progenitor solo aporta gametos R y el otro solo gametos r.\n2. Toda la F1 es Rr (heterocigota).\n3. Como R es dominante, el 100 % presenta flores rojas.',
    errorComun: 'Aplicar la proporción 3:1, que corresponde a la F2 (cruce Rr × Rr).',
    dificultad: 2,
    alternativas: [
      { texto: '25 %', esCorrecta: false },
      { texto: '50 %', esCorrecta: false },
      { texto: '75 %', esCorrecta: false },
      { texto: '100 %', esCorrecta: true },
    ],
  },
  {
    clave: 'BIO-B-2',
    materia: 'BIO',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Qué ley de Mendel describe la separación de los dos alelos de un gen durante la formación de los gametos?',
    explicacion:
      '1. Cada individuo tiene dos alelos por gen.\n2. Al formarse los gametos, esos alelos se separan y cada gameto recibe solo uno: es la ley de segregación (primera ley).',
    errorComun: 'Confundirla con la ley de la segregación independiente, que se refiere a genes distintos.',
    dificultad: 2,
    alternativas: [
      { texto: 'Ley de segregación', esCorrecta: true },
      { texto: 'Ley de la segregación independiente', esCorrecta: false },
      { texto: 'Ley de la dominancia incompleta', esCorrecta: false },
      { texto: 'Ley de la herencia ligada al sexo', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-C-1',
    materia: 'BIO',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿Cuál es la fuente original de nuevas variantes genéticas en una población?',
    explicacion:
      '1. Las mutaciones cambian la secuencia del ADN y originan alelos nuevos.\n2. La recombinación mezcla alelos que ya existen, pero no crea alelos nuevos.\n3. Sobre esa variación actúa la selección natural.',
    errorComun: 'Elegir la herencia de caracteres adquiridos, idea de Lamarck que no tiene respaldo.',
    dificultad: 2,
    alternativas: [
      { texto: 'La mutación', esCorrecta: true },
      { texto: 'La herencia de caracteres adquiridos', esCorrecta: false },
      { texto: 'El uso y desuso de los órganos', esCorrecta: false },
      { texto: 'La reproducción asexual', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-C-2',
    materia: 'BIO',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿Cuál de las siguientes es una evidencia de la evolución?',
    explicacion:
      '1. El registro fósil muestra cambios en las especies a lo largo del tiempo.\n2. Las estructuras homólogas (como el brazo humano y el ala del murciélago) indican un ancestro común.',
    errorComun: 'Elegir una opción que suena científica, como la "memoria muscular heredada", que no existe.',
    dificultad: 2,
    alternativas: [
      { texto: 'El cambio climático del siglo XIX', esCorrecta: false },
      { texto: 'El registro fósil y las estructuras homólogas', esCorrecta: true },
      { texto: 'La organización social de las especies', esCorrecta: false },
      { texto: 'La memoria muscular heredada', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-D-1',
    materia: 'BIO',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Cómo fluye la energía en un ecosistema?',
    explicacion:
      '1. La energía entra como luz solar y los productores la transforman en energía química.\n2. Pasa a los consumidores en un solo sentido y en cada nivel se pierde parte como calor.\n3. Por eso la energía fluye, mientras que la materia se recicla.',
    errorComun: 'Pensar que la energía circula en ciclos, como la materia.',
    dificultad: 2,
    alternativas: [
      { texto: 'En ciclos cerrados entre todos los niveles', esCorrecta: false },
      { texto: 'En un solo sentido, de los productores a los consumidores', esCorrecta: true },
      { texto: 'Desde los descomponedores hacia el sol', esCorrecta: false },
      { texto: 'De manera aleatoria entre los niveles', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-D-2',
    materia: 'BIO',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Cuál es la función principal de los descomponedores?',
    explicacion:
      '1. Hongos y bacterias degradan la materia orgánica muerta.\n2. Así devuelven nutrientes inorgánicos al suelo, que los productores vuelven a usar.',
    errorComun: 'Asignarles la fotosíntesis, que es propia de los productores.',
    dificultad: 1,
    alternativas: [
      { texto: 'Producir energía luminosa', esCorrecta: false },
      { texto: 'Reciclar la materia orgánica', esCorrecta: true },
      { texto: 'Competir con los productores', esCorrecta: false },
      { texto: 'Realizar la fotosíntesis', esCorrecta: false },
    ],
  },
];
