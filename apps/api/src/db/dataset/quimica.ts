import type { PreguntaSeed } from './tipos';

export const PREGUNTAS_QUI: PreguntaSeed[] = [
  {
    clave: 'QUI-A-1',
    materia: 'QUI',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Cuántos protones tiene un átomo neutro que posee 11 electrones?',
    explicacion:
      '1. En un átomo neutro, la cantidad de protones es igual a la de electrones.\n2. Tiene 11 protones: su número atómico es 11 y corresponde al sodio.',
    errorComun: 'Sumar protones y electrones (22), como si fuera el número másico.',
    dificultad: 1,
    alternativas: [
      { texto: '10', esCorrecta: false },
      { texto: '11', esCorrecta: true },
      { texto: '12', esCorrecta: false },
      { texto: '22', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-A-2',
    materia: 'QUI',
    eje: 'A',
    tipo: 'multiple',
    enunciado: '¿Qué tipo de enlace se forma cuando dos átomos comparten pares de electrones?',
    explicacion:
      '1. En el enlace covalente, los átomos comparten pares de electrones.\n2. En el iónico, en cambio, un átomo transfiere electrones a otro.',
    errorComun: 'Confundir compartir electrones (covalente) con transferirlos (iónico).',
    dificultad: 1,
    alternativas: [
      { texto: 'Enlace iónico', esCorrecta: false },
      { texto: 'Enlace metálico', esCorrecta: false },
      { texto: 'Enlace covalente', esCorrecta: true },
      { texto: 'Puente de hidrógeno', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-B-1',
    materia: 'QUI',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Cuántos moles hay en 88 g de $\\mathrm{CO_2}$? (C = 12 g/mol; O = 16 g/mol)',
    explicacion:
      '1. Masa molar del $\\mathrm{CO_2}$: $12 + 2 \\cdot 16 = 44$ g/mol.\n2. $n = \\frac{m}{M} = \\frac{88}{44} = 2$ mol.',
    errorComun: 'Usar la masa del oxígeno una sola vez (28 g/mol) al calcular la masa molar.',
    dificultad: 2,
    alternativas: [
      { texto: '0,5 mol', esCorrecta: false },
      { texto: '2 mol', esCorrecta: true },
      { texto: '3,1 mol', esCorrecta: false },
      { texto: '44 mol', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-B-2',
    materia: 'QUI',
    eje: 'B',
    tipo: 'multiple',
    enunciado: '¿Qué coeficientes balancean la ecuación $\\mathrm{H_2 + O_2 \\rightarrow H_2O}$?',
    explicacion:
      '1. Hay 2 átomos de oxígeno a la izquierda: se necesitan 2 moléculas de agua.\n2. Esas 2 moléculas tienen 4 hidrógenos: se necesitan 2 moléculas de $\\mathrm{H_2}$.\n3. Resultado: $\\mathrm{2H_2 + O_2 \\rightarrow 2H_2O}$.',
    errorComun: 'Cambiar los subíndices (escribir $\\mathrm{H_2O_2}$) en vez de ajustar los coeficientes.',
    dificultad: 2,
    alternativas: [
      { texto: '1, 1, 1', esCorrecta: false },
      { texto: '2, 1, 2', esCorrecta: true },
      { texto: '1, 2, 1', esCorrecta: false },
      { texto: '2, 2, 1', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-C-1',
    materia: 'QUI',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿Cuál es la concentración molar de una solución que contiene 2 mol de soluto en 4 L de solución?',
    explicacion:
      '1. La molaridad es $M = \\frac{n}{V}$, con el volumen en litros.\n2. $M = \\frac{2}{4} = 0{,}5$ mol/L.',
    errorComun: 'Dividir el volumen por los moles y obtener 2 M.',
    dificultad: 2,
    alternativas: [
      { texto: '$0{,}5$ M', esCorrecta: true },
      { texto: '$2$ M', esCorrecta: false },
      { texto: '$4$ M', esCorrecta: false },
      { texto: '$8$ M', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-C-2',
    materia: 'QUI',
    eje: 'C',
    tipo: 'multiple',
    enunciado: '¿Qué pH tiene una solución neutra a 25 °C?',
    explicacion:
      '1. A 25 °C, en el agua pura $[\\mathrm{H^+}] = 10^{-7}$ M.\n2. $\\mathrm{pH} = -\\log[\\mathrm{H^+}] = 7$.\n3. Menor que 7 es ácido y mayor que 7 es básico.',
    errorComun: 'Creer que una solución neutra tiene pH 0.',
    dificultad: 1,
    alternativas: [
      { texto: 'pH 0', esCorrecta: false },
      { texto: 'pH 7', esCorrecta: true },
      { texto: 'pH 14', esCorrecta: false },
      { texto: 'pH 1', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-D-1',
    materia: 'QUI',
    eje: 'D',
    tipo: 'multiple',
    enunciado: '¿Cómo se clasifica una reacción que libera calor al entorno?',
    explicacion:
      '1. Si la reacción libera calor, los productos tienen menos entalpía que los reactivos.\n2. $\\Delta H < 0$: la reacción es exotérmica.',
    errorComun: 'Confundir exotérmica (libera calor) con endotérmica (absorbe calor).',
    dificultad: 1,
    alternativas: [
      { texto: 'Endotérmica', esCorrecta: false },
      { texto: 'Exotérmica', esCorrecta: true },
      { texto: 'Isotérmica', esCorrecta: false },
      { texto: 'Reversible sin cambio de energía', esCorrecta: false },
    ],
  },
  {
    clave: 'QUI-D-2',
    materia: 'QUI',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Cuando el vapor de agua se condensa sobre un vidrio frío, ¿qué ocurre con la energía?',
    explicacion:
      '1. Para evaporar agua hay que entregarle energía.\n2. La condensación es el proceso inverso: el vapor libera esa misma energía al pasar a líquido.\n3. Por eso el vidrio se entibia y el proceso es exotérmico.',
    errorComun: 'Pensar que todo cambio de estado absorbe energía.',
    dificultad: 3,
    alternativas: [
      { texto: 'El vapor absorbe calor del vidrio', esCorrecta: false },
      { texto: 'El vapor libera calor al pasar a líquido', esCorrecta: true },
      { texto: 'No hay intercambio de energía', esCorrecta: false },
      { texto: 'Solo cambia la presión del aire', esCorrecta: false },
    ],
  },
];
