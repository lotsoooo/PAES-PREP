import type { PreguntaSeed } from './tipos';

export const PREGUNTAS_BIO: PreguntaSeed[] = [
  {
    clave: 'BIO-A-1',
    materia: 'BIO',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Cual organela se considera la central energetica de la celula?',
    explicacion:
      'La mitocondria produce ATP mediante respiracion celular y por eso se llama central energetica.',
    dificultad: 1,
    alternativas: [
      { texto: 'El ribosoma', esCorrecta: false },
      { texto: 'La mitocondria', esCorrecta: true },
      { texto: 'El aparato de Golgi', esCorrecta: false },
      { texto: 'El nucleolo', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-A-2',
    materia: 'BIO',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'En que fase del ciclo celular se replica el ADN?',
    explicacion: 'La replicacion ocurre en la fase S, previa a la division celular.',
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
      'En un cruce de plantas con flores rojas (RR) y blancas (rr), que porcentaje de F1 sera rojo?',
    explicacion:
      'Todos los F1 son Rr, heterocigotos, y presentan el fenotipo dominante rojo: 100%.',
    dificultad: 2,
    alternativas: [
      { texto: '25%', esCorrecta: false },
      { texto: '50%', esCorrecta: false },
      { texto: '75%', esCorrecta: false },
      { texto: '100%', esCorrecta: true },
    ],
  },
  {
    clave: 'BIO-B-2',
    materia: 'BIO',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Que ley mendeliana describe la separacion de los dos alelos de un gen?',
    explicacion:
      'La ley de segregacion indica que los alelos de un gen se separan durante la formacion de los gametos.',
    dificultad: 2,
    alternativas: [
      { texto: 'Ley de segregacion', esCorrecta: true },
      { texto: 'Ley de independiente combinacion', esCorrecta: false },
      { texto: 'Ley de dominancia completa', esCorrecta: false },
      { texto: 'Ley de penetrancia total', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-C-1',
    materia: 'BIO',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'Que mecanismo genera nuevas variaciones en una poblacion?',
    explicacion:
      'Las mutaciones originan alelos nuevos y son la materia prima de la seleccion natural.',
    dificultad: 2,
    alternativas: [
      { texto: 'La mutacion', esCorrecta: true },
      { texto: 'La herencia de caracteres adquiridos', esCorrecta: false },
      { texto: 'El uso y desuso de organos', esCorrecta: false },
      { texto: 'La reproduccion asexuada', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-C-2',
    materia: 'BIO',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'Que evidencia apoya la teoria de la evolucion por seleccion natural?',
    explicacion:
      'El registro fosilifero y la homologia son evidencias directas de descendencia con modificacion.',
    dificultad: 2,
    alternativas: [
      { texto: 'El cambio climatico en el siglo XIX', esCorrecta: false },
      { texto: 'El registro fosilifero y la homologia', esCorrecta: true },
      { texto: 'La organizacion social de las especies', esCorrecta: false },
      { texto: 'La memoria muscular heredada', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-D-1',
    materia: 'BIO',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'En un ecosistema, como fluye la energia?',
    explicacion:
      'La energia fluye en un solo sentido: del sol a los productores, a los consumidores y a los descomponedores.',
    dificultad: 2,
    alternativas: [
      { texto: 'En circulos cerrados entre todos los niveles', esCorrecta: false },
      { texto: 'De los productores hacia los consumidores', esCorrecta: true },
      { texto: 'Solo desde los descomponedores al sol', esCorrecta: false },
      { texto: 'De manera aleatoria entre los niveles', esCorrecta: false },
    ],
  },
  {
    clave: 'BIO-D-2',
    materia: 'BIO',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Cual es la funcion principal de los descomponedores?',
    explicacion:
      'Los descomponedores reciclan la materia organica muerta, devolviendo nutrientes al suelo.',
    dificultad: 1,
    alternativas: [
      { texto: 'Producir energia luminosa', esCorrecta: false },
      { texto: 'Reciclar la materia organica', esCorrecta: true },
      { texto: 'Competir con los productores', esCorrecta: false },
      { texto: 'Realizar fotosintesis', esCorrecta: false },
    ],
  },
];
