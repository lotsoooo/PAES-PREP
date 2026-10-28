import type { PreguntaSeed } from './tipos';

/** Ítems M1 escritos a mano (los del ensayo completo están en m1-banco.ts). */
export const PREGUNTAS_M1: PreguntaSeed[] = [
  {
    clave: 'M1-A-1',
    materia: 'M1',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Cuál es el valor de $\\left(\\frac{3}{4}\\right)^{-2}$?',
    explicacion:
      '1. Un exponente negativo invierte la base: $\\left(\\frac{3}{4}\\right)^{-2} = \\left(\\frac{4}{3}\\right)^{2}$.\n2. Se eleva numerador y denominador: $\\frac{4^2}{3^2} = \\frac{16}{9}$.',
    errorComun: 'Interpretar el exponente negativo como un resultado negativo y marcar $-\\frac{16}{9}$.',
    dificultad: 2,
    alternativas: [
      { texto: '$\\frac{16}{9}$', esCorrecta: true },
      { texto: '$\\frac{9}{16}$', esCorrecta: false },
      { texto: '$-\\frac{16}{9}$', esCorrecta: false },
      { texto: '$-\\frac{9}{16}$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-A-2',
    materia: 'M1',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Un número escrito en notación científica es $4{,}8 \\cdot 10^{-3}$. ¿Cuál es su forma decimal?',
    explicacion:
      '1. Multiplicar por $10^{-3}$ equivale a dividir por 1.000.\n2. La coma se desplaza tres lugares a la izquierda: $4{,}8 \\to 0{,}0048$.',
    errorComun: 'Desplazar la coma solo dos lugares, o hacia la derecha, como si el exponente fuera positivo.',
    dificultad: 2,
    alternativas: [
      { texto: '$0{,}00048$', esCorrecta: false },
      { texto: '$0{,}0048$', esCorrecta: true },
      { texto: '$0{,}048$', esCorrecta: false },
      { texto: '$4.800$', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-B-1',
    materia: 'M1',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Resuelve $2x - 5 = 3x + 1$. ¿Cuál es el valor de $x$?',
    explicacion:
      '1. Se agrupan las $x$ en un lado: $2x - 3x = 1 + 5$.\n2. Se reduce: $-x = 6$.\n3. Se multiplica por $-1$: $x = -6$.',
    errorComun: 'Olvidar el signo de $-x = 6$ y responder $x = 6$.',
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
    enunciado: '¿Cuál es el conjunto solución de $x^2 - 5x + 6 = 0$?',
    explicacion:
      '1. Se buscan dos números que multiplicados den 6 y sumados den $-5$: son $-2$ y $-3$.\n2. Se factoriza: $(x - 2)(x - 3) = 0$.\n3. Cada factor se iguala a cero: $x = 2$ o $x = 3$.',
    errorComun: 'Tomar los números de los factores con su signo ($-2$ y $-3$) como soluciones.',
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
      'Un rectángulo de 8 cm de largo y 3 cm de ancho se amplía con razón de semejanza 2. ¿Cuál es el perímetro del rectángulo ampliado?',
    explicacion:
      '1. Con razón 2 cada lado se duplica: largo 16 cm y ancho 6 cm.\n2. El perímetro es $2(16 + 6) = 44$ cm.\n3. Comprobación: el perímetro original es 22 cm y también se duplica.',
    errorComun: 'Multiplicar el perímetro por 4 (como ocurre con el área) y obtener 88 cm.',
    dificultad: 2,
    alternativas: [
      { texto: '44 cm', esCorrecta: true },
      { texto: '22 cm', esCorrecta: false },
      { texto: '88 cm', esCorrecta: false },
      { texto: '96 cm', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-D-1',
    materia: 'M1',
    eje: 'D',
    tipo: 'multiple',
    enunciado:
      'En un curso, 18 estudiantes rindieron un control y su promedio fue 5,2. Si se suma la nota 6,1 de un estudiante que lo rindió atrasado, ¿cuál es el nuevo promedio del curso?',
    explicacion:
      '1. La suma de las 18 notas es $18 \\cdot 5{,}2 = 93{,}6$.\n2. Con la nueva nota: $93{,}6 + 6{,}1 = 99{,}7$.\n3. Se divide por 19: $99{,}7 : 19 \\approx 5{,}25$.',
    errorComun: 'Promediar 5,2 y 6,1 como si tuvieran el mismo peso, lo que da 5,65.',
    dificultad: 3,
    alternativas: [
      { texto: 'Aproximadamente 5,25', esCorrecta: true },
      { texto: '5,65', esCorrecta: false },
      { texto: '5,30', esCorrecta: false },
      { texto: '6,10', esCorrecta: false },
    ],
  },
  {
    clave: 'M1-D-2',
    materia: 'M1',
    eje: 'D',
    tipo: 'multiple',
    enunciado:
      'Una urna tiene fichas numeradas del 1 al 20. Se extrae una al azar. ¿Cuál es la probabilidad de obtener un múltiplo de 3 o de 5?',
    explicacion:
      '1. Múltiplos de 3: 3, 6, 9, 12, 15, 18 (6 fichas). Múltiplos de 5: 5, 10, 15, 20 (4 fichas).\n2. El 15 está en ambos grupos: se cuenta una sola vez, así que hay $6 + 4 - 1 = 9$ casos favorables.\n3. $P = \\frac{9}{20}$.',
    errorComun: 'Sumar 6 + 4 = 10 sin descontar el 15, que se cuenta dos veces.',
    dificultad: 3,
    alternativas: [
      { texto: '$\\frac{9}{20}$', esCorrecta: true },
      { texto: '$\\frac{1}{2}$', esCorrecta: false },
      { texto: '$\\frac{3}{10}$', esCorrecta: false },
      { texto: '$\\frac{1}{20}$', esCorrecta: false },
    ],
  },
];
