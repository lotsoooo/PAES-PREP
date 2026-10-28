import type { PreguntaSeed } from './tipos';

/**
 * Historia y Ciencias Sociales según el temario PAES: A Historia de Chile,
 * B Historia universal, C Formación ciudadana, D Sistema económico.
 */
export const PREGUNTAS_HIST: PreguntaSeed[] = [
  {
    clave: 'HIST-A-1',
    materia: 'HIST',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Qué constitución organizó la República de Chile durante gran parte del siglo XIX y estableció un Ejecutivo fuerte?',
    explicacion:
      '1. La Constitución de 1833 rigió hasta 1925.\n2. Concentró el poder en el Presidente de la República, base del orden conservador del período.',
    errorComun: 'Elegir la Constitución de 1925, que la reemplazó y es posterior.',
    dificultad: 2,
    alternativas: [
      { texto: 'La Constitución de 1833', esCorrecta: true },
      { texto: 'La Constitución de 1925', esCorrecta: false },
      { texto: 'La Constitución de 1980', esCorrecta: false },
      { texto: 'El Reglamento Constitucional de 1812', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-A-2',
    materia: 'HIST',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Qué recurso se convirtió en la principal fuente de ingresos del Estado chileno tras la Guerra del Pacífico?',
    explicacion:
      '1. Con la guerra (1879–1884), Chile incorporó Tarapacá y Antofagasta.\n2. La exportación de salitre de esas provincias pasó a financiar gran parte del presupuesto fiscal hasta la década de 1920.',
    errorComun: 'Elegir el cobre, que se volvió el recurso principal recién en el siglo XX.',
    dificultad: 2,
    alternativas: [
      { texto: 'El salitre', esCorrecta: true },
      { texto: 'El cobre', esCorrecta: false },
      { texto: 'El trigo', esCorrecta: false },
      { texto: 'La plata', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-A-3',
    materia: 'HIST',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Cómo se denominó al conjunto de problemas sociales que afectaron a los sectores populares chilenos a fines del siglo XIX e inicios del XX?',
    explicacion:
      '1. Hacinamiento, enfermedades, bajos salarios y malas condiciones laborales marcaron la vida de obreros y campesinos.\n2. A ese conjunto de problemas se le llamó la "cuestión social".',
    errorComun: 'Confundirla con la "crisis del parlamentarismo", que es un fenómeno político.',
    dificultad: 2,
    alternativas: [
      { texto: 'La cuestión social', esCorrecta: true },
      { texto: 'La crisis del parlamentarismo', esCorrecta: false },
      { texto: 'La reforma agraria', esCorrecta: false },
      { texto: 'La pacificación de la Araucanía', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-B-1',
    materia: 'HIST',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Qué principio difundió la Revolución francesa?',
    explicacion:
      '1. La Declaración de los Derechos del Hombre y del Ciudadano (1789) afirmó que los hombres nacen libres e iguales en derechos.\n2. Además, puso la soberanía en la nación y no en el rey.',
    errorComun: 'Asociarla al derecho divino de los reyes, que fue precisamente lo que cuestionó.',
    dificultad: 2,
    alternativas: [
      { texto: 'La igualdad ante la ley y la soberanía nacional', esCorrecta: true },
      { texto: 'El derecho divino de los reyes', esCorrecta: false },
      { texto: 'La restauración de los privilegios nobiliarios', esCorrecta: false },
      { texto: 'La unión entre la Iglesia y el Estado', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-B-2',
    materia: 'HIST',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Entre qué años ocurrieron las dos guerras mundiales?',
    explicacion:
      '1. La Primera Guerra Mundial ocurrió entre 1914 y 1918.\n2. La Segunda Guerra Mundial, entre 1939 y 1945.',
    errorComun: 'Confundir la Gran Depresión (1929) con el inicio de una guerra.',
    dificultad: 1,
    alternativas: [
      { texto: '1900–1904 y 1914–1918', esCorrecta: false },
      { texto: '1914–1918 y 1939–1945', esCorrecta: true },
      { texto: '1929–1933 y 1936–1939', esCorrecta: false },
      { texto: '1939–1945 y 1950–1953', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-B-3',
    materia: 'HIST',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Qué caracterizó a la Guerra Fría?',
    explicacion:
      '1. Entre 1947 y 1991, Estados Unidos y la Unión Soviética compitieron por la hegemonía mundial.\n2. No se enfrentaron directamente: lo hicieron mediante carrera armamentista, propaganda y conflictos en otros países.',
    errorComun: 'Pensar que hubo una guerra directa entre las dos potencias.',
    dificultad: 2,
    alternativas: [
      { texto: 'Una rivalidad entre EE. UU. y la URSS sin enfrentamiento militar directo entre ambos', esCorrecta: true },
      { texto: 'Una guerra directa entre Alemania y Francia', esCorrecta: false },
      { texto: 'Un conflicto por las colonias de América', esCorrecta: false },
      { texto: 'Un período de cooperación entre las potencias', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-C-1',
    materia: 'HIST',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'En un Estado democrático, ¿qué significa la separación de los poderes públicos?',
    explicacion:
      '1. Las funciones del Estado se dividen en Ejecutivo, Legislativo y Judicial.\n2. Cada poder controla y limita a los otros, lo que evita la concentración del poder.',
    errorComun: 'Creer que significa que los poderes no se relacionan entre sí, cuando en realidad se controlan mutuamente.',
    dificultad: 2,
    alternativas: [
      { texto: 'Que distintas instituciones ejercen funciones distintas y se controlan entre sí', esCorrecta: true },
      { texto: 'Que el Presidente puede disolver los tribunales', esCorrecta: false },
      { texto: 'Que los ciudadanos eligen a los jueces cada cuatro años', esCorrecta: false },
      { texto: 'Que el Congreso dirige a las Fuerzas Armadas', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-C-2',
    materia: 'HIST',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿Qué mecanismo permite a la ciudadanía aprobar o rechazar directamente una propuesta, como una nueva constitución?',
    explicacion:
      '1. El plebiscito somete una decisión a votación directa de la ciudadanía.\n2. En Chile se usó en 1988, 2020 y en los procesos constitucionales de 2022 y 2023.',
    errorComun: 'Confundirlo con una elección, en la que se eligen representantes y no se decide sobre una propuesta.',
    dificultad: 1,
    alternativas: [
      { texto: 'El plebiscito', esCorrecta: true },
      { texto: 'La acusación constitucional', esCorrecta: false },
      { texto: 'El recurso de protección', esCorrecta: false },
      { texto: 'La elección parlamentaria', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-C-3',
    materia: 'HIST',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿Qué característica tienen los derechos humanos?',
    explicacion:
      '1. Son universales: corresponden a todas las personas por el solo hecho de serlo.\n2. También son inalienables: no se pueden quitar ni renunciar a ellos.',
    errorComun: 'Pensar que el Estado los otorga y, por lo tanto, puede retirarlos.',
    dificultad: 2,
    alternativas: [
      { texto: 'Son universales e inalienables', esCorrecta: true },
      { texto: 'Solo los tienen los ciudadanos con derecho a voto', esCorrecta: false },
      { texto: 'El Estado puede suspenderlos sin límites', esCorrecta: false },
      { texto: 'Dependen de la nacionalidad de cada persona', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-D-1',
    materia: 'HIST',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Si el precio de las paltas sube mucho y lo demás se mantiene, ¿qué ocurre normalmente con la cantidad demandada de paltas?',
    explicacion:
      '1. La ley de la demanda dice que, si todo lo demás se mantiene, al subir el precio la cantidad demandada baja.\n2. Los consumidores compran menos o reemplazan el producto por otro.',
    errorComun: 'Confundir la demanda con la oferta, que sí tiende a aumentar con el precio.',
    dificultad: 1,
    alternativas: [
      { texto: 'Disminuye', esCorrecta: true },
      { texto: 'Aumenta', esCorrecta: false },
      { texto: 'Se mantiene igual siempre', esCorrecta: false },
      { texto: 'Se vuelve cero', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-D-2',
    materia: 'HIST',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Qué mide la inflación?',
    explicacion:
      '1. La inflación es el aumento sostenido y generalizado de los precios.\n2. En Chile se mide principalmente con la variación del IPC (Índice de Precios al Consumidor), que calcula el INE.',
    errorComun: 'Confundirla con el alza del precio de un solo producto.',
    dificultad: 2,
    alternativas: [
      { texto: 'El alza sostenida y generalizada de los precios', esCorrecta: true },
      { texto: 'El aumento del precio de un solo producto', esCorrecta: false },
      { texto: 'La cantidad de dinero que exporta un país', esCorrecta: false },
      { texto: 'El crecimiento de la población', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-D-3',
    materia: 'HIST',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Cuál es el objetivo principal del Banco Central de Chile?',
    explicacion:
      '1. Su ley orgánica le encarga velar por la estabilidad de la moneda, es decir, controlar la inflación.\n2. También debe velar por el normal funcionamiento de los pagos internos y externos.\n3. Para eso usa herramientas como la tasa de política monetaria.',
    errorComun: 'Pensar que fija el presupuesto fiscal, tarea del Gobierno y el Congreso.',
    dificultad: 3,
    alternativas: [
      { texto: 'Velar por la estabilidad de la moneda y el funcionamiento de los pagos', esCorrecta: true },
      { texto: 'Definir el presupuesto anual del Estado', esCorrecta: false },
      { texto: 'Recaudar los impuestos', esCorrecta: false },
      { texto: 'Fijar el sueldo mínimo', esCorrecta: false },
    ],
  },
];
