import type { PreguntaSeed } from './tipos';

export const PREGUNTAS_M1: PreguntaSeed[] = [
  {
    clave: 'M1-A-1',
    materia: 'M1',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Cual es el valor de $(3/4)^{-2}$?',
    explicacion:
      'Un exponente negativo indica reciproco: $(3/4)^{-2} = (4/3)^2 = 16/9$.',
    dificultad: 2,
    alternativas: [
      { texto: '$16/9$', esCorrecta: true },
      { texto: '$9/16$', esCorrecta: false },
      { texto: '$8/9$', esCorrecta: false },
      { texto: '$-16/9$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-A-2',
    materia: 'M1',
    eje: 'A',
    tipo: 'multiple',
    enunciado:
      'Un numero racional escrito en notacion cientifica es $4{,}8 \\times 10^{-3}$. Cual es su forma decimal?',
    explicacion: 'Multiplicar $4{,}8$ por $10^{-3}$ desplaga la coma tres lugares a la izquierda: $0{,}0048$.',
    dificultad: 2,
    alternativas: [
      { texto: '$0{,}00048$', esCorrecta: false },
      { texto: '$0{,}0048$', esCorrecta: true },
      { texto: '$0{,}048$', esCorrecta: false },
      { texto: '$48$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-B-1',
    materia: 'M1',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Resuelve $2x - 5 = 3x + 1$. Cual es el valor de $x$?',
    explicacion:
      'Se despeja: $2x - 3x = 1 + 5$, por lo tanto $-x = 6$ y $x = -6$.',
    dificultad: 1,
    alternativas: [
      { texto: '$x = -6$', esCorrecta: true },
      { texto: '$x = 6$', esCorrecta: false },
      { texto: '$x = -4$', esCorrecta: false },
      { texto: '$x = 4$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-B-2',
    materia: 'M1',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Cual es el conjunto solucion de $x^2 - 5x + 6 = 0$?',
    explicacion:
      'Se factoriza como $(x-2)(x-3) = 0$, luego $x = 2$ o $x = 3$.',
    dificultad: 2,
    alternativas: [
      { texto: '$x = 2$ o $x = 3$', esCorrecta: true },
      { texto: '$x = -2$ o $x = -3$', esCorrecta: false },
      { texto: '$x = 1$ o $x = 6$', esCorrecta: false },
      { texto: 'Solo $x = 6$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-C-1',
    materia: 'M1',
    eje: 'C',
    tipo: 'multiple',
    enunciado:
      'Un rectangulo de largo 8 y ancho 3 se Reducescala por factor 2. Cuanto queda el perimetro?',
    explicacion:
      'El factor de escala 2 duplica cada lado: largo 16, ancho 6. El perimetro es $2(16 + 6) = 44$.',
    dificultad: 2,
    alternativas: [
      { texto: '$44$', esCorrecta: true },
      { texto: '$22$', esCorrecta: false },
      { texto: '$48$', esCorrecta: false },
      { texto: '$96$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-D-1',
    materia: 'M1',
    eje: 'D',
    tipo: 'multiple',
    enunciado:
      'Se lanzan dos dados. Cual es la probabilidad de que la suma sea 7?',
    explicacion:
      'Hay 36 resultados equiprobables y 6 favorables: $(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)$. Luego $P = 6/36 = 1/6$.',
    dificultad: 3,
    alternativas: [
      { texto: '$1/6$', esCorrecta: true },
      { texto: '$1/12$', esCorrecta: false },
      { texto: '$5/36$', esCorrecta: false },
      { texto: '$1/3$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-D-2',
    materia: 'M1',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Cuantas permutaciones distintas tiene un grupo de 5 personas?',
    explicacion: 'El orden importa, por lo tanto $5! = 5 \\times 4 \\times 3 \\times 2 \\times 1 = 120$.',
    dificultad: 2,
    alternativas: [
      { texto: '$120$', esCorrecta: true },
      { texto: '$25$', esCorrecta: false },
      { texto: '$60$', esCorrecta: false },
      { texto: '$720$', esCorrecta: false },
    ],
  },
];
