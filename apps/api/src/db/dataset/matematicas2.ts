import type { PreguntaSeed } from './tipos';

/**
 * M2 según el temario PAES: A Álgebra y funciones, B Geometría, C Probabilidad
 * y estadística, D Números (reales, logaritmos, matemática financiera).
 */
export const PREGUNTAS_M2: PreguntaSeed[] = [
  {
    clave: 'M2-A-1',
    materia: 'M2',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Si $\\log_2 x = 5$, ¿cuál es el valor de $x$?',
    explicacion:
      '1. Un logaritmo es un exponente: $\\log_2 x = 5$ significa $2^5 = x$.\n2. $2^5 = 32$, por lo tanto $x = 32$.',
    errorComun: 'Multiplicar base por resultado ($2 \\cdot 5 = 10$) en vez de elevar.',
    dificultad: 2,
    alternativas: [
      { texto: '$x = 32$', esCorrecta: true },
      { texto: '$x = 10$', esCorrecta: false },
      { texto: '$x = 25$', esCorrecta: false },
      { texto: '$x = \\frac{5}{2}$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-A-2',
    materia: 'M2',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Cuál es el dominio de $f(x) = \\log(x - 3)$?',
    explicacion:
      '1. El argumento de un logaritmo debe ser estrictamente positivo.\n2. $x - 3 > 0$, es decir, $x > 3$.\n3. El dominio es $]3, +\\infty[$.',
    errorComun: 'Incluir el 3 en el dominio: $\\log 0$ no está definido.',
    dificultad: 2,
    alternativas: [
      { texto: '$x > 3$', esCorrecta: true },
      { texto: '$x < 3$', esCorrecta: false },
      { texto: '$x \\geq 3$', esCorrecta: false },
      { texto: 'Todos los números reales', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-A-3',
    materia: 'M2',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Cuál es la solución de la ecuación $2^{x+1} = 32$?',
    explicacion:
      '1. Se escribe 32 como potencia de 2: $32 = 2^5$.\n2. Si las bases son iguales, los exponentes también: $x + 1 = 5$.\n3. Por lo tanto, $x = 4$.',
    errorComun: 'Dividir 32 por 2 y plantear $x + 1 = 16$.',
    dificultad: 2,
    alternativas: [
      { texto: '$x = 4$', esCorrecta: true },
      { texto: '$x = 5$', esCorrecta: false },
      { texto: '$x = 15$', esCorrecta: false },
      { texto: '$x = 3$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-B-1',
    materia: 'M2',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Si $\\vec{a} = (2,\\ 3)$ y $\\vec{b} = (-1,\\ 4)$, ¿cuál es el vector $2\\vec{a} + \\vec{b}$?',
    explicacion:
      '1. Se pondera $\\vec{a}$ por 2: $2\\vec{a} = (4,\\ 6)$.\n2. Se suman componente a componente: $(4 + (-1),\\ 6 + 4) = (3,\\ 10)$.',
    errorComun: 'Multiplicar por 2 solo la primera componente de $\\vec{a}$.',
    dificultad: 2,
    alternativas: [
      { texto: '$(3,\\ 10)$', esCorrecta: true },
      { texto: '$(1,\\ 7)$', esCorrecta: false },
      { texto: '$(2,\\ 14)$', esCorrecta: false },
      { texto: '$(3,\\ 7)$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-B-2',
    materia: 'M2',
    eje: 'B',
    tipo: 'multiple',
    enunciado:
      'Se aplica una homotecia de centro en el origen y razón $-2$ al punto $P(3,\\ -1)$. ¿Cuál es su imagen?',
    explicacion:
      '1. En una homotecia de centro en el origen y razón $k$, la imagen de $(x,\\ y)$ es $(kx,\\ ky)$.\n2. $(-2 \\cdot 3,\\ -2 \\cdot (-1)) = (-6,\\ 2)$.\n3. La razón negativa deja la imagen al otro lado del centro.',
    errorComun: 'Ignorar el signo de la razón y obtener $(6,\\ -2)$.',
    dificultad: 3,
    alternativas: [
      { texto: "$P'(-6,\\ 2)$", esCorrecta: true },
      { texto: "$P'(6,\\ -2)$", esCorrecta: false },
      { texto: "$P'(-6,\\ -2)$", esCorrecta: false },
      { texto: "$P'(1,\\ -3)$", esCorrecta: false },
    ],
  },
  {
    clave: 'M2-B-3',
    materia: 'M2',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Cuál es la ecuación de la recta paralela a $y = 3x - 2$ que pasa por el punto $(1,\\ 4)$?',
    explicacion:
      '1. Las rectas paralelas tienen la misma pendiente: $m = 3$.\n2. Se reemplaza el punto en $y = 3x + n$: $4 = 3 + n$, así que $n = 1$.\n3. La recta es $y = 3x + 1$.',
    errorComun: 'Usar la pendiente de la recta perpendicular, $-\\frac{1}{3}$.',
    dificultad: 3,
    alternativas: [
      { texto: '$y = 3x + 1$', esCorrecta: true },
      { texto: '$y = -\\frac{1}{3}x + \\frac{13}{3}$', esCorrecta: false },
      { texto: '$y = 3x + 4$', esCorrecta: false },
      { texto: '$y = 3x - 2$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-C-1',
    materia: 'M2',
    eje: 'C',
    tipo: 'multiple',
    enunciado:
      'Una variable aleatoria discreta toma los valores 1, 2 y 3 con probabilidades 0,2; 0,5 y 0,3, respectivamente. ¿Cuál es su valor esperado?',
    explicacion:
      '1. El valor esperado pondera cada valor por su probabilidad: $E(X) = \\sum x \\cdot P(x)$.\n2. $1 \\cdot 0{,}2 + 2 \\cdot 0{,}5 + 3 \\cdot 0{,}3 = 0{,}2 + 1 + 0{,}9$.\n3. $E(X) = 2{,}1$.',
    errorComun: 'Promediar los valores 1, 2 y 3 sin considerar sus probabilidades (resultado 2).',
    dificultad: 3,
    alternativas: [
      { texto: '$2{,}1$', esCorrecta: true },
      { texto: '$2$', esCorrecta: false },
      { texto: '$2{,}5$', esCorrecta: false },
      { texto: '$3$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-C-2',
    materia: 'M2',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'Se lanza una moneda tres veces. ¿Cuál es la probabilidad de obtener exactamente dos caras?',
    explicacion:
      '1. Hay $2^3 = 8$ resultados igualmente probables.\n2. Con exactamente dos caras: CCS, CSC, SCC, es decir, $\\binom{3}{2} = 3$ casos.\n3. $P = \\frac{3}{8}$.',
    errorComun: 'Contar solo la secuencia CCS y obtener $\\frac{1}{8}$.',
    dificultad: 3,
    alternativas: [
      { texto: '$\\frac{3}{8}$', esCorrecta: true },
      { texto: '$\\frac{2}{3}$', esCorrecta: false },
      { texto: '$\\frac{1}{8}$', esCorrecta: false },
      { texto: '$\\frac{1}{4}$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-C-3',
    materia: 'M2',
    eje: 'C',
    tipo: 'multiple',
    enunciado:
      'Los puntajes de un ensayo siguen aproximadamente una distribución normal de media 500 y desviación estándar 100. ¿Qué porcentaje aproximado de estudiantes obtuvo entre 400 y 600 puntos?',
    explicacion:
      '1. 400 y 600 están a una desviación estándar de la media ($500 \\pm 100$).\n2. En una distribución normal, cerca del 68 % de los datos está a una desviación estándar de la media.',
    errorComun: 'Confundir con el intervalo de dos desviaciones estándar, que concentra cerca del 95 %.',
    dificultad: 4,
    alternativas: [
      { texto: 'Cerca del 68 %', esCorrecta: true },
      { texto: 'Cerca del 95 %', esCorrecta: false },
      { texto: 'Cerca del 50 %', esCorrecta: false },
      { texto: 'Cerca del 34 %', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-D-1',
    materia: 'M2',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Si $\\log 2 \\approx 0{,}301$, ¿cuál es el valor aproximado de $\\log 8$?',
    explicacion:
      '1. Se escribe 8 como potencia de 2: $\\log 8 = \\log 2^3$.\n2. Por la propiedad de la potencia: $\\log 2^3 = 3 \\log 2$.\n3. $3 \\cdot 0{,}301 = 0{,}903$.',
    errorComun: 'Multiplicar 8 por log 2 en vez de usar el exponente 3.',
    dificultad: 3,
    alternativas: [
      { texto: '$0{,}903$', esCorrecta: true },
      { texto: '$0{,}602$', esCorrecta: false },
      { texto: '$2{,}408$', esCorrecta: false },
      { texto: '$1{,}301$', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-D-2',
    materia: 'M2',
    eje: 'D',
    tipo: 'multiple',
    enunciado:
      'Se invierten 1.000.000 de pesos a un interés compuesto del 5 % anual. ¿Cuánto dinero habrá al cabo de 2 años?',
    explicacion:
      '1. Con interés compuesto, el capital se multiplica por $1{,}05$ cada año: $C = 1.000.000 \\cdot 1{,}05^2$.\n2. $1{,}05^2 = 1{,}1025$.\n3. $C = 1.102.500$ pesos.',
    errorComun: 'Calcular interés simple (5 % cada año sobre el capital inicial) y obtener 1.100.000.',
    dificultad: 3,
    alternativas: [
      { texto: '1.102.500 pesos', esCorrecta: true },
      { texto: '1.100.000 pesos', esCorrecta: false },
      { texto: '102.500 pesos', esCorrecta: false },
      { texto: '1.050.000 pesos', esCorrecta: false },
    ],
  },
  {
    clave: 'M2-D-3',
    materia: 'M2',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿A qué expresión es igual $\\frac{6}{\\sqrt{3}}$ al racionalizar?',
    explicacion:
      '1. Se amplifica por $\\sqrt{3}$: $\\frac{6}{\\sqrt{3}} \\cdot \\frac{\\sqrt{3}}{\\sqrt{3}} = \\frac{6\\sqrt{3}}{3}$.\n2. Se simplifica: $2\\sqrt{3}$.',
    errorComun: 'Amplificar solo el denominador y escribir $6\\sqrt{3}$.',
    dificultad: 2,
    alternativas: [
      { texto: '$2\\sqrt{3}$', esCorrecta: true },
      { texto: '$6\\sqrt{3}$', esCorrecta: false },
      { texto: '$\\frac{\\sqrt{3}}{2}$', esCorrecta: false },
      { texto: '$3\\sqrt{3}$', esCorrecta: false },
    ],
  },
];
