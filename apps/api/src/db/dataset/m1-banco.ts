/**
 * Banco del ensayo M1 completo: 65 preguntas tipo PAES con 4 alternativas.
 *
 * Distribución por eje (temario PAES M1): Números 14 (21,5 %), Álgebra y
 * funciones 22 (33,8 %), Geometría 14 (21,5 %), Probabilidad y estadística 15
 * (23,1 %).
 *
 * Cada ítem se construye con un generador que CALCULA la respuesta correcta a
 * partir de sus parámetros; los distractores son errores típicos. `construir`
 * falla si dos alternativas quedan iguales, y `verificarBancoM1` comprueba los
 * conteos. La posición de la correcta se reparte de forma determinista.
 */
import type { AlternativaSeed, PreguntaSeed } from './tipos';

type Eje = 'A' | 'B' | 'C' | 'D';
type Dif = 1 | 2 | 3 | 4 | 5;

interface Item {
  eje: Eje;
  dificultad: Dif;
  enunciado: string;
  correcta: string;
  distractores: [string, string, string];
  pasos: string[];
  errorComun: string;
}

/* ------------------------------------------------------------------ helpers */

function mcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** Fracción simplificada en LaTeX (sin $). */
export function fr(n: number, d: number): string {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = mcd(n, d);
  n /= g;
  d /= g;
  if (d === 1) return String(n);
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
}

/** Número con coma decimal chilena para LaTeX (sin $). */
export function dec(x: number, decimales = 4): string {
  const r = Number(x.toFixed(decimales));
  const [ent, frac] = String(Math.abs(r)).split('.');
  const signo = r < 0 ? '-' : '';
  return frac ? `${signo}${ent}{,}${frac}` : `${signo}${ent}`;
}

/** Miles con punto (texto plano): 24000 → "24.000". */
export function miles(n: number): string {
  return Math.round(n).toLocaleString('de-DE');
}

const m = (s: string) => `$${s}$`;

function pasosTexto(pasos: string[]): string {
  return pasos.map((p, i) => `${i + 1}. ${p}`).join('\n');
}

/** Posición determinista de la alternativa correcta (0..3), sin patrón visible. */
function posicionCorrecta(indice: number): number {
  // Un paso de mulberry32 sembrado con el índice: estable entre ejecuciones.
  let t = (Math.imul(indice + 1, 0x9e3779b1) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) % 4;
}

function construir(item: Item, indice: number): PreguntaSeed {
  const textos = [item.correcta, ...item.distractores];
  if (new Set(textos).size !== 4) {
    throw new Error(`Banco M1: alternativas repetidas en el ítem ${indice + 1}: ${textos.join(' | ')}`);
  }
  const pos = posicionCorrecta(indice);
  const alternativas: AlternativaSeed[] = item.distractores.map((t) => ({ texto: t, esCorrecta: false }));
  alternativas.splice(pos, 0, { texto: item.correcta, esCorrecta: true });
  return {
    clave: `M1-E-${String(indice + 1).padStart(2, '0')}`,
    materia: 'M1',
    eje: item.eje,
    tipo: 'multiple',
    enunciado: item.enunciado,
    explicacion: pasosTexto(item.pasos),
    errorComun: item.errorComun,
    dificultad: item.dificultad,
    alternativas: alternativas as PreguntaSeed['alternativas'],
  };
}

/* ================================================================ NÚMEROS */

function sumaFracciones(a: number, b: number, c: number, d: number): Item {
  const num = a * d + c * b;
  const den = b * d;
  return {
    eje: 'A',
    dificultad: 1,
    enunciado: `¿Cuál es el resultado de ${m(`\\frac{${a}}{${b}} + \\frac{${c}}{${d}}`)}?`,
    correcta: m(fr(num, den)),
    distractores: [m(fr(a + c, b + d)), m(fr(a * c, b * d)), m(fr(num, b + d))],
    pasos: [
      `Se busca un denominador común: ${m(`${b} \\cdot ${d} = ${den}`)}.`,
      `Se amplifica cada fracción: ${m(`\\frac{${a * d}}{${den}} + \\frac{${c * b}}{${den}}`)}.`,
      `Se suman los numeradores: ${m(`\\frac{${num}}{${den}}`)}, que simplificada es ${m(fr(num, den))}.`,
    ],
    errorComun: 'Sumar numeradores con numeradores y denominadores con denominadores, lo que no es una operación válida.',
  };
}

function descuento(objeto: string, precio: number, pct: number): Item {
  const pago = (precio * (100 - pct)) / 100;
  const rebaja = (precio * pct) / 100;
  return {
    eje: 'A',
    dificultad: 1,
    enunciado: `${objeto} cuesta ${miles(precio)} pesos y tiene un ${pct} % de descuento. ¿Cuánto se paga?`,
    correcta: `${miles(pago)} pesos`,
    distractores: [
      `${miles(rebaja)} pesos`,
      `${miles(precio + rebaja)} pesos`,
      `${miles(precio - 2 * rebaja)} pesos`,
    ],
    pasos: [
      `El descuento es el ${pct} % del precio: ${m(`${miles(precio)} \\cdot ${dec(pct / 100)} = ${miles(rebaja)}`)}.`,
      `Se resta al precio original: ${m(`${miles(precio)} - ${miles(rebaja)} = ${miles(pago)}`)}.`,
      `También se puede calcular directo con el ${100 - pct} %: ${m(`${miles(precio)} \\cdot ${dec((100 - pct) / 100)} = ${miles(pago)}`)}.`,
    ],
    errorComun: 'Responder con el monto del descuento en vez del precio final que se paga.',
  };
}

function aumentosSucesivos(a: number, b: number): Item {
  const factor = (1 + a / 100) * (1 + b / 100);
  const total = Number(((factor - 1) * 100).toFixed(2));
  return {
    eje: 'A',
    dificultad: 3,
    enunciado: `El precio de un pasaje sube un ${a} % en marzo y luego un ${b} % en abril. ¿En qué porcentaje aumentó en total respecto del precio inicial?`,
    correcta: `${dec(total)} %`,
    distractores: [`${a + b} %`, `${dec((a + b) / 2)} %`, `${dec((a * b) / 100)} %`],
    pasos: [
      `Cada aumento multiplica el precio: subir ${a} % es multiplicar por ${m(dec(1 + a / 100))} y subir ${b} % es multiplicar por ${m(dec(1 + b / 100))}.`,
      `El efecto total es ${m(`${dec(1 + a / 100)} \\cdot ${dec(1 + b / 100)} = ${dec(factor)}`)}.`,
      `Un factor de ${m(dec(factor))} equivale a un aumento de ${m(`${dec(total)}\\,\\%`)}.`,
    ],
    errorComun: `Sumar los porcentajes (${a + b} %): el segundo aumento se aplica sobre un precio que ya subió.`,
  };
}

function potencias(base: number, p: number, q: number, r: number): Item {
  const exp = p + q - r;
  return {
    eje: 'A',
    dificultad: 2,
    enunciado: `¿A qué es igual ${m(`\\dfrac{${base}^{${p}} \\cdot ${base}^{${q}}}{${base}^{${r}}}`)}?`,
    correcta: m(`${base}^{${exp}}`),
    distractores: [m(`${base}^{${p + q + r}}`), m(`${base}^{${p * q - r}}`), m(`${base * base}^{${exp}}`)],
    pasos: [
      `En el numerador, al multiplicar potencias de igual base se suman los exponentes: ${m(`${base}^{${p}+${q}} = ${base}^{${p + q}}`)}.`,
      `Al dividir potencias de igual base se restan los exponentes: ${m(`${base}^{${p + q}-${r}} = ${base}^{${exp}}`)}.`,
    ],
    errorComun: 'Multiplicar los exponentes en vez de sumarlos al multiplicar potencias de igual base.',
  };
}

function raices(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'A',
      dificultad: 2,
      enunciado: `¿Cuál es el resultado de ${m('\\sqrt{12} + \\sqrt{27}')}?`,
      correcta: m('5\\sqrt{3}'),
      distractores: [m('\\sqrt{39}'), m('5\\sqrt{6}'), m('6\\sqrt{3}')],
      pasos: [
        `Se descompone cada raíz: ${m('\\sqrt{12} = \\sqrt{4 \\cdot 3} = 2\\sqrt{3}')} y ${m('\\sqrt{27} = \\sqrt{9 \\cdot 3} = 3\\sqrt{3}')}.`,
        `Son raíces semejantes, así que se suman sus coeficientes: ${m('2\\sqrt{3} + 3\\sqrt{3} = 5\\sqrt{3}')}.`,
      ],
      errorComun: 'Sumar las cantidades subradicales (12 + 27): la raíz de una suma no es la suma de las raíces.',
    };
  }
  return {
    eje: 'A',
    dificultad: 3,
    enunciado: `¿Cuál es el resultado de ${m('\\sqrt{50} - \\sqrt{18}')}?`,
    correcta: m('2\\sqrt{2}'),
    distractores: [m('\\sqrt{32}'), m('8\\sqrt{2}'), m('2')],
    pasos: [
      `${m('\\sqrt{50} = \\sqrt{25 \\cdot 2} = 5\\sqrt{2}')} y ${m('\\sqrt{18} = \\sqrt{9 \\cdot 2} = 3\\sqrt{2}')}.`,
      `Se restan los coeficientes de las raíces semejantes: ${m('5\\sqrt{2} - 3\\sqrt{2} = 2\\sqrt{2}')}.`,
    ],
    errorComun: 'Restar las cantidades subradicales y escribir √32, que vale 4√2 y no 2√2.',
  };
}

function notacionCientifica(): Item {
  return {
    eje: 'A',
    dificultad: 2,
    enunciado: `Una bacteria mide ${m('2 \\cdot 10^{-6}')} metros. ¿Cuánto miden, en metros, ${m('3 \\cdot 10^{4}')} bacterias puestas en fila?`,
    correcta: m('6 \\cdot 10^{-2}'),
    distractores: [m('6 \\cdot 10^{-24}'), m('5 \\cdot 10^{-2}'), m('6 \\cdot 10^{2}')],
    pasos: [
      `Se multiplica: ${m('(3 \\cdot 10^{4}) \\cdot (2 \\cdot 10^{-6})')}.`,
      `Se multiplican los coeficientes: ${m('3 \\cdot 2 = 6')}.`,
      `Se suman los exponentes de 10: ${m('4 + (-6) = -2')}. El resultado es ${m('6 \\cdot 10^{-2}')} m, es decir, 6 cm.`,
    ],
    errorComun: 'Multiplicar los exponentes de 10 (4 · (−6) = −24) en lugar de sumarlos.',
  };
}

function compararNumeros(): Item {
  return {
    eje: 'A',
    dificultad: 2,
    enunciado: `¿Cuál de los siguientes números es el mayor?`,
    correcta: m('\\frac{5}{8}'),
    distractores: [m('0{,}6'), m('0{,}59'), m('\\frac{7}{12}')],
    pasos: [
      `Se escriben todos como decimales: ${m('\\frac{5}{8} = 0{,}625')} y ${m('\\frac{7}{12} \\approx 0{,}583')}.`,
      `Se comparan: ${m('0{,}583 < 0{,}59 < 0{,}6 < 0{,}625')}.`,
      `El mayor es ${m('\\frac{5}{8}')}.`,
    ],
    errorComun: 'Comparar solo los denominadores de las fracciones o la cantidad de cifras decimales.',
  };
}

function proporcionInversa(): Item {
  return {
    eje: 'A',
    dificultad: 2,
    enunciado: 'Seis trabajadores pintan un colegio en 10 días. Si todos trabajan al mismo ritmo, ¿cuántos días tardarían 4 trabajadores?',
    correcta: '15 días',
    distractores: [m('\\frac{20}{3}') + ' días', '8 días', '24 días'],
    pasos: [
      'A menos trabajadores, más días: la relación es inversamente proporcional, así que el producto se mantiene.',
      `El trabajo total es ${m('6 \\cdot 10 = 60')} días-trabajador.`,
      `Con 4 trabajadores: ${m('60 : 4 = 15')} días.`,
    ],
    errorComun: 'Plantear una proporción directa (6 es a 10 como 4 es a x), que da 20/3 días.',
  };
}

function interesSimple(capital: number, tasa: number, anios: number): Item {
  const interes = (capital * tasa * anios) / 100;
  const compuesto = Math.round(capital * ((1 + tasa / 100) ** anios - 1));
  return {
    eje: 'A',
    dificultad: 3,
    enunciado: `Se depositan ${miles(capital)} pesos a un interés simple del ${tasa} % anual. ¿Cuánto interés se gana en ${anios} años?`,
    correcta: `${miles(interes)} pesos`,
    distractores: [
      `${miles(interes / anios)} pesos`,
      `${miles(capital + interes)} pesos`,
      `${miles(compuesto)} pesos`,
    ],
    pasos: [
      `En interés simple, cada año se gana el mismo monto: ${m(`${miles(capital)} \\cdot ${dec(tasa / 100)} = ${miles(interes / anios)}`)}.`,
      `En ${anios} años: ${m(`${miles(interes / anios)} \\cdot ${anios} = ${miles(interes)}`)} pesos.`,
    ],
    errorComun: 'Responder con el capital final (capital más interés) cuando se pregunta solo por el interés.',
  };
}

function operacionesEnteros(): Item {
  return {
    eje: 'A',
    dificultad: 2,
    enunciado: `¿Cuál es el valor de ${m('-2^{4} + (-2)^{3}')}?`,
    correcta: m('-24'),
    distractores: [m('8'), m('24'), m('-8')],
    pasos: [
      `En ${m('-2^{4}')} el exponente afecta solo al 2: ${m('-2^{4} = -16')}.`,
      `En ${m('(-2)^{3}')} el exponente afecta al −2: ${m('(-2)^{3} = -8')}.`,
      `Se suma: ${m('-16 + (-8) = -24')}.`,
    ],
    errorComun: 'Interpretar −2⁴ como (−2)⁴ = 16, olvidando que sin paréntesis el signo no se eleva.',
  };
}

/* ================================================================ ÁLGEBRA */

function ecuacionLineal(tipo: 1 | 2 | 3): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 1,
      enunciado: `¿Cuál es la solución de la ecuación ${m('5x - 3 = 2x + 9')}?`,
      correcta: m('x = 4'),
      distractores: [m('x = 2'), m('x = -4'), m('x = \\frac{12}{7}')],
      pasos: [
        `Se agrupan las ${m('x')} a un lado y los números al otro: ${m('5x - 2x = 9 + 3')}.`,
        `Se reduce: ${m('3x = 12')}.`,
        `Se divide por 3: ${m('x = 4')}.`,
      ],
      errorComun: 'Cambiar mal el signo al trasponer el −3 y obtener 3x = 6.',
    };
  }
  if (tipo === 2) {
    return {
      eje: 'B',
      dificultad: 2,
      enunciado: `¿Qué valor de ${m('x')} satisface ${m('3x + 7 = -x - 5')}?`,
      correcta: m('x = -3'),
      distractores: [m('x = 3'), m('x = -6'), m('x = -1')],
      pasos: [
        `Se suma ${m('x')} a ambos lados: ${m('4x + 7 = -5')}.`,
        `Se resta 7: ${m('4x = -12')}.`,
        `Se divide por 4: ${m('x = -3')}.`,
      ],
      errorComun: 'Restar x en vez de sumarla y llegar a 2x = −12.',
    };
  }
  return {
    eje: 'B',
    dificultad: 2,
    enunciado: `¿Cuál es la solución de ${m('\\frac{x}{2} + 3 = x - 1')}?`,
    correcta: m('x = 8'),
    distractores: [m('x = 4'), m('x = 2'), m('x = -8')],
    pasos: [
      `Se multiplica todo por 2 para eliminar la fracción: ${m('x + 6 = 2x - 2')}.`,
      `Se despeja: ${m('6 + 2 = 2x - x')}.`,
      `Resultado: ${m('x = 8')}.`,
    ],
    errorComun: 'Multiplicar por 2 solo el término con fracción y no toda la ecuación.',
  };
}

function sistema(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 2,
      enunciado: `La suma de dos números es 11 y su diferencia es 3. ¿Cuál es el número menor?`,
      correcta: m('4'),
      distractores: [m('7'), m('8'), m('3')],
      pasos: [
        `Se plantea el sistema ${m('x + y = 11')} y ${m('x - y = 3')}.`,
        `Sumando ambas ecuaciones: ${m('2x = 14')}, luego ${m('x = 7')}.`,
        `Reemplazando: ${m('y = 11 - 7 = 4')}. El menor es 4.`,
      ],
      errorComun: 'Responder con el número mayor (7) sin releer qué se pregunta.',
    };
  }
  return {
    eje: 'B',
    dificultad: 3,
    enunciado: `Si ${m('2x + y = 10')} y ${m('x - y = 2')}, ¿cuál es el valor de ${m('x + y')}?`,
    correcta: m('6'),
    distractores: [m('4'), m('8'), m('12')],
    pasos: [
      `Sumando las ecuaciones se elimina ${m('y')}: ${m('3x = 12')}, entonces ${m('x = 4')}.`,
      `De ${m('x - y = 2')}: ${m('y = 2')}.`,
      `Por lo tanto ${m('x + y = 4 + 2 = 6')}.`,
    ],
    errorComun: 'Detenerse al encontrar x = 4 y marcarlo como respuesta.',
  };
}

function evaluarFuncion(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 2,
      enunciado: `Si ${m('f(x) = 2x^{2} - 3x + 1')}, ¿cuál es el valor de ${m('f(-2)')}?`,
      correcta: m('15'),
      distractores: [m('3'), m('-1'), m('27')],
      pasos: [
        `Se reemplaza ${m('x = -2')}: ${m('f(-2) = 2(-2)^{2} - 3(-2) + 1')}.`,
        `${m('(-2)^{2} = 4')}, así que ${m('2 \\cdot 4 = 8')}; y ${m('-3(-2) = 6')}.`,
        `Se suma: ${m('8 + 6 + 1 = 15')}.`,
      ],
      errorComun: 'Calcular (−2)² como −4, que da −8 + 6 + 1 = −1.',
    };
  }
  return {
    eje: 'B',
    dificultad: 1,
    enunciado: `Si ${m('f(x) = x^{2} + 4x - 5')}, ¿cuál es el valor de ${m('f(3)')}?`,
    correcta: m('16'),
    distractores: [m('-2'), m('26'), m('10')],
    pasos: [
      `Se reemplaza ${m('x = 3')}: ${m('f(3) = 3^{2} + 4 \\cdot 3 - 5')}.`,
      `${m('9 + 12 - 5 = 16')}.`,
    ],
    errorComun: 'Sumar el −5 como +5 y obtener 26.',
  };
}

function composicion(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 3,
      enunciado: `Sean ${m('f(x) = 2x + 1')} y ${m('g(x) = x^{2} - 1')}. ¿Cuál es el valor de ${m('f(g(3))')}?`,
      correcta: m('17'),
      distractores: [m('48'), m('56'), m('15')],
      pasos: [
        `Primero se calcula la función interior: ${m('g(3) = 3^{2} - 1 = 8')}.`,
        `Luego se evalúa ${m('f')} en ese resultado: ${m('f(8) = 2 \\cdot 8 + 1 = 17')}.`,
      ],
      errorComun: 'Calcular g(f(3)) = 48, aplicando las funciones en el orden equivocado.',
    };
  }
  return {
    eje: 'B',
    dificultad: 2,
    enunciado: `Sean ${m('f(x) = 3x - 2')} y ${m('g(x) = x + 4')}. ¿Cuál es el valor de ${m('g(f(2))')}?`,
    correcta: m('8'),
    distractores: [m('16'), m('10'), m('24')],
    pasos: [
      `Se calcula la función interior: ${m('f(2) = 3 \\cdot 2 - 2 = 4')}.`,
      `Se evalúa ${m('g')}: ${m('g(4) = 4 + 4 = 8')}.`,
    ],
    errorComun: 'Calcular f(g(2)) = f(6) = 16, invirtiendo el orden de la composición.',
  };
}

function cuadratica(tipo: 1 | 2 | 3): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 3,
      enunciado: `¿Cuál es el conjunto solución de ${m('x^{2} - x - 12 = 0')}?`,
      correcta: m('\\{-3,\\ 4\\}'),
      distractores: [m('\\{3,\\ -4\\}'), m('\\{-3,\\ -4\\}'), m('\\{1,\\ -12\\}')],
      pasos: [
        `Se buscan dos números que multiplicados den ${m('-12')} y sumados ${m('-1')}: son ${m('-4')} y ${m('3')}.`,
        `Se factoriza: ${m('(x - 4)(x + 3) = 0')}.`,
        `Cada factor se iguala a cero: ${m('x = 4')} o ${m('x = -3')}.`,
      ],
      errorComun: 'Tomar los signos de los factores como soluciones: de (x − 4)(x + 3) concluir x = −4 y x = 3.',
    };
  }
  if (tipo === 2) {
    return {
      eje: 'B',
      dificultad: 2,
      enunciado: `¿Cuáles son las soluciones de ${m('2x^{2} - 8 = 0')}?`,
      correcta: m('x = 2 \\text{ o } x = -2'),
      distractores: [m('\\text{solo } x = 2'), m('x = 4 \\text{ o } x = -4'), m('x = \\sqrt{8} \\text{ o } x = -\\sqrt{8}')],
      pasos: [
        `Se despeja ${m('x^{2}')}: ${m('2x^{2} = 8')}, luego ${m('x^{2} = 4')}.`,
        `Un número al cuadrado da 4 cuando es ${m('2')} o ${m('-2')}.`,
      ],
      errorComun: 'Olvidar la solución negativa al extraer la raíz cuadrada.',
    };
  }
  return {
    eje: 'B',
    dificultad: 3,
    enunciado: `¿Cuánto suman las soluciones de ${m('x^{2} - 7x + 10 = 0')}?`,
    correcta: m('7'),
    distractores: [m('-7'), m('10'), m('5')],
    pasos: [
      `Se factoriza: ${m('(x - 2)(x - 5) = 0')}, así que las soluciones son 2 y 5.`,
      `Su suma es ${m('2 + 5 = 7')}.`,
      `Atajo: en ${m('x^{2} + bx + c = 0')} la suma de las soluciones es ${m('-b')}, aquí ${m('-(-7) = 7')}.`,
    ],
    errorComun: 'Usar b = −7 directamente como la suma, sin cambiarle el signo.',
  };
}

function pendiente(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 2,
      enunciado: `¿Cuál es la pendiente de la recta que pasa por los puntos ${m('(1,\\ 2)')} y ${m('(4,\\ 11)')}?`,
      correcta: m('3'),
      distractores: [m('\\frac{1}{3}'), m('-3'), m('\\frac{13}{5}')],
      pasos: [
        `La pendiente es ${m('m = \\frac{y_2 - y_1}{x_2 - x_1}')}.`,
        `${m('m = \\frac{11 - 2}{4 - 1} = \\frac{9}{3} = 3')}.`,
      ],
      errorComun: 'Invertir la fórmula y dividir la diferencia de x por la diferencia de y (1/3).',
    };
  }
  return {
    eje: 'B',
    dificultad: 2,
    enunciado: `¿Cuál es la pendiente de la recta que pasa por ${m('(-2,\\ 5)')} y ${m('(2,\\ -3)')}?`,
    correcta: m('-2'),
    distractores: [m('2'), m('-\\frac{1}{2}'), m('4')],
    pasos: [
      `${m('m = \\frac{-3 - 5}{2 - (-2)} = \\frac{-8}{4}')}.`,
      `${m('m = -2')}: la recta es decreciente.`,
    ],
    errorComun: 'Perder el signo negativo de −8 y obtener una pendiente positiva.',
  };
}

function ecuacionRecta(): Item {
  return {
    eje: 'B',
    dificultad: 3,
    enunciado: `¿Cuál es la ecuación de la recta de pendiente 2 que pasa por el punto ${m('(1,\\ 5)')}?`,
    correcta: m('y = 2x + 3'),
    distractores: [m('y = 2x + 5'), m('y = 5x + 2'), m('y = 2x - 3')],
    pasos: [
      `La recta tiene la forma ${m('y = 2x + n')}.`,
      `Como pasa por ${m('(1,\\ 5)')}: ${m('5 = 2 \\cdot 1 + n')}, entonces ${m('n = 3')}.`,
      `La ecuación es ${m('y = 2x + 3')}.`,
    ],
    errorComun: 'Usar la ordenada del punto (5) como coeficiente de posición sin verificar.',
  };
}

function inecuacion(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'B',
      dificultad: 2,
      enunciado: `¿Cuál es el conjunto solución de ${m('3x - 5 < 7')}?`,
      correcta: m('x < 4'),
      distractores: [m('x > 4'), m('x < \\frac{2}{3}'), m('x < -4')],
      pasos: [
        `Se suma 5 a ambos lados: ${m('3x < 12')}.`,
        `Se divide por 3, que es positivo, así que el sentido no cambia: ${m('x < 4')}.`,
      ],
      errorComun: 'Invertir el sentido de la desigualdad al dividir por un número positivo.',
    };
  }
  return {
    eje: 'B',
    dificultad: 3,
    enunciado: `¿Cuál es el conjunto solución de ${m('-2x + 1 \\geq 9')}?`,
    correcta: m('x \\leq -4'),
    distractores: [m('x \\geq -4'), m('x \\leq 4'), m('x \\geq 5')],
    pasos: [
      `Se resta 1: ${m('-2x \\geq 8')}.`,
      `Se divide por ${m('-2')}; al dividir por un negativo el sentido se invierte: ${m('x \\leq -4')}.`,
    ],
    errorComun: 'No invertir el sentido de la desigualdad al dividir por −2.',
  };
}

function factorizacion(): Item {
  return {
    eje: 'B',
    dificultad: 2,
    enunciado: `¿Cuál es la factorización de ${m('x^{2} - 49')}?`,
    correcta: m('(x + 7)(x - 7)'),
    distractores: [m('(x - 7)^{2}'), m('(x + 7)^{2}'), m('(x - 49)(x + 1)')],
    pasos: [
      `Es una diferencia de cuadrados: ${m('x^{2} - 7^{2}')}.`,
      `Se aplica ${m('a^{2} - b^{2} = (a + b)(a - b)')}: ${m('(x + 7)(x - 7)')}.`,
    ],
    errorComun: 'Confundir la diferencia de cuadrados con el cuadrado de un binomio (x − 7)².',
  };
}

function cuadradoBinomio(): Item {
  return {
    eje: 'B',
    dificultad: 2,
    enunciado: `¿A qué es igual ${m('(2x - 5)^{2}')}?`,
    correcta: m('4x^{2} - 20x + 25'),
    distractores: [m('4x^{2} + 25'), m('4x^{2} - 10x + 25'), m('2x^{2} - 20x + 25')],
    pasos: [
      `Se usa ${m('(a - b)^{2} = a^{2} - 2ab + b^{2}')} con ${m('a = 2x')} y ${m('b = 5')}.`,
      `${m('(2x)^{2} = 4x^{2}')}, ${m('2 \\cdot 2x \\cdot 5 = 20x')} y ${m('5^{2} = 25')}.`,
      `Resultado: ${m('4x^{2} - 20x + 25')}.`,
    ],
    errorComun: 'Elevar cada término por separado y olvidar el término central −20x.',
  };
}

function problemaEntradas(): Item {
  return {
    eje: 'B',
    dificultad: 4,
    enunciado: 'Para una obra de teatro escolar se vendieron 30 entradas: las de adulto a 4.000 pesos y las de estudiante a 2.500 pesos. Si se recaudaron 96.000 pesos, ¿cuántas entradas de estudiante se vendieron?',
    correcta: '16',
    distractores: ['14', '15', '24'],
    pasos: [
      `Sean ${m('a')} las entradas de adulto y ${m('e')} las de estudiante: ${m('a + e = 30')} y ${m('4000a + 2500e = 96000')}.`,
      `De la primera, ${m('a = 30 - e')}. Reemplazando: ${m('4000(30 - e) + 2500e = 96000')}.`,
      `${m('120000 - 1500e = 96000')}, entonces ${m('1500e = 24000')} y ${m('e = 16')}.`,
    ],
    errorComun: 'Resolver bien el sistema pero responder con las entradas de adulto (14).',
  };
}

function funcionCosto(): Item {
  return {
    eje: 'B',
    dificultad: 3,
    enunciado: `Una imprenta cobra según ${m('C(x) = 15000 + 800x')}, donde ${m('x')} es la cantidad de afiches. ¿Cuántos afiches se pueden imprimir con 39.000 pesos?`,
    correcta: '30',
    distractores: ['48', '18', '67'],
    pasos: [
      `Se iguala el costo al presupuesto: ${m('15000 + 800x = 39000')}.`,
      `${m('800x = 24000')}.`,
      `${m('x = 30')} afiches.`,
    ],
    errorComun: 'Dividir el presupuesto completo por 800 sin restar antes el cargo fijo de 15.000.',
  };
}

function vertice(): Item {
  return {
    eje: 'B',
    dificultad: 3,
    enunciado: `¿Cuál es el vértice de la parábola ${m('y = x^{2} - 4x + 1')}?`,
    correcta: m('(2,\\ -3)'),
    distractores: [m('(-2,\\ -3)'), m('(2,\\ 1)'), m('(4,\\ 1)')],
    pasos: [
      `La abscisa del vértice es ${m('x_v = -\\frac{b}{2a} = -\\frac{-4}{2} = 2')}.`,
      `Se evalúa: ${m('y_v = 2^{2} - 4 \\cdot 2 + 1 = -3')}.`,
      `El vértice es ${m('(2,\\ -3)')}.`,
    ],
    errorComun: 'Usar x = −b/2a sin el signo menos y obtener x = −2.',
  };
}

/* ============================================================== GEOMETRÍA */

function pitagoras(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'C',
      dificultad: 1,
      enunciado: 'Los catetos de un triángulo rectángulo miden 6 cm y 8 cm. ¿Cuánto mide la hipotenusa?',
      correcta: '10 cm',
      distractores: ['14 cm', '48 cm', m('2\\sqrt{7}') + ' cm'],
      pasos: [
        `Por el teorema de Pitágoras: ${m('c^{2} = 6^{2} + 8^{2} = 36 + 64 = 100')}.`,
        `${m('c = \\sqrt{100} = 10')} cm.`,
      ],
      errorComun: 'Sumar los catetos (6 + 8 = 14) en vez de sumar sus cuadrados.',
    };
  }
  return {
    eje: 'C',
    dificultad: 2,
    enunciado: 'Una escalera de 13 m está apoyada en un muro y su base queda a 5 m del muro. ¿A qué altura toca el muro?',
    correcta: '12 m',
    distractores: ['8 m', m('\\sqrt{194}') + ' m', '18 m'],
    pasos: [
      `La escalera es la hipotenusa: ${m('13^{2} = 5^{2} + h^{2}')}.`,
      `${m('h^{2} = 169 - 25 = 144')}.`,
      `${m('h = 12')} m.`,
    ],
    errorComun: 'Sumar los cuadrados (169 + 25) como si 13 fuera un cateto.',
  };
}

function areaTriangulo(): Item {
  return {
    eje: 'C',
    dificultad: 1,
    enunciado: 'Un triángulo tiene base 10 cm y altura 6 cm. ¿Cuál es su área?',
    correcta: m('30\\ \\text{cm}^{2}'),
    distractores: [m('60\\ \\text{cm}^{2}'), m('16\\ \\text{cm}^{2}'), m('32\\ \\text{cm}^{2}')],
    pasos: [
      `El área de un triángulo es ${m('\\frac{b \\cdot h}{2}')}.`,
      `${m('\\frac{10 \\cdot 6}{2} = 30')} cm².`,
    ],
    errorComun: 'Olvidar dividir por 2 y responder 60 cm².',
  };
}

function circulo(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'C',
      dificultad: 2,
      enunciado: 'Una galleta circular tiene 5 cm de radio. ¿Cuál es el área de su superficie?',
      correcta: m('25\\pi\\ \\text{cm}^{2}'),
      distractores: [m('10\\pi\\ \\text{cm}^{2}'), m('25\\ \\text{cm}^{2}'), m('100\\pi\\ \\text{cm}^{2}')],
      pasos: [
        `El área del círculo es ${m('\\pi r^{2}')}.`,
        `${m('\\pi \\cdot 5^{2} = 25\\pi')} cm².`,
      ],
      errorComun: 'Usar la fórmula del perímetro (2πr = 10π) en lugar de la del área.',
    };
  }
  return {
    eje: 'C',
    dificultad: 2,
    enunciado: 'Una rueda tiene 12 cm de diámetro. ¿Cuál es su perímetro?',
    correcta: m('12\\pi') + ' cm',
    distractores: [m('6\\pi') + ' cm', m('36\\pi') + ' cm', m('144\\pi') + ' cm'],
    pasos: [
      `El radio es la mitad del diámetro: ${m('r = 6')} cm.`,
      `El perímetro es ${m('2\\pi r = 2\\pi \\cdot 6 = 12\\pi')} cm.`,
    ],
    errorComun: 'Usar el diámetro como si fuera el radio y obtener 24π, o usar solo πr.',
  };
}

function semejanza(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'C',
      dificultad: 2,
      enunciado: 'Un triángulo de lados 3, 4 y 5 cm es semejante a otro en el que el lado homólogo al de 3 cm mide 9 cm. ¿Cuánto mide el lado homólogo al de 5 cm?',
      correcta: '15 cm',
      distractores: ['11 cm', '12 cm', '45 cm'],
      pasos: [
        `La razón de semejanza es ${m('\\frac{9}{3} = 3')}.`,
        `Todos los lados se multiplican por 3: ${m('5 \\cdot 3 = 15')} cm.`,
      ],
      errorComun: 'Sumar la diferencia (9 − 3 = 6) a cada lado en vez de multiplicar por la razón.',
    };
  }
  return {
    eje: 'C',
    dificultad: 3,
    enunciado: 'A la misma hora, un poste de 2 m proyecta una sombra de 3 m y un árbol proyecta una sombra de 12 m. ¿Cuál es la altura del árbol?',
    correcta: '8 m',
    distractores: ['18 m', '11 m', m('4{,}5') + ' m'],
    pasos: [
      'Los rayos del sol forman triángulos semejantes, así que altura y sombra son proporcionales.',
      `${m('\\frac{h}{12} = \\frac{2}{3}')}.`,
      `${m('h = \\frac{2 \\cdot 12}{3} = 8')} m.`,
    ],
    errorComun: 'Invertir la proporción (h/12 = 3/2) y obtener 18 m.',
  };
}

function angulos(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'C',
      dificultad: 1,
      enunciado: 'Dos ángulos interiores de un triángulo miden 47° y 68°. ¿Cuánto mide el tercero?',
      correcta: '65°',
      distractores: ['115°', '55°', '75°'],
      pasos: [
        'La suma de los ángulos interiores de un triángulo es 180°.',
        `${m('180° - 47° - 68° = 65°')}.`,
      ],
      errorComun: 'Responder con la suma de los dos ángulos dados (115°).',
    };
  }
  return {
    eje: 'C',
    dificultad: 2,
    enunciado: '¿Cuánto suman los ángulos interiores de un hexágono?',
    correcta: '720°',
    distractores: ['1080°', '540°', '360°'],
    pasos: [
      `La suma de los ángulos interiores de un polígono de ${m('n')} lados es ${m('180° \\cdot (n - 2)')}.`,
      `Para ${m('n = 6')}: ${m('180° \\cdot 4 = 720°')}.`,
    ],
    errorComun: 'Usar 180° · n (1080°) sin restar 2 al número de lados.',
  };
}

function traslacion(): Item {
  return {
    eje: 'C',
    dificultad: 2,
    enunciado: `El punto ${m('P(2,\\ -3)')} se traslada según el vector ${m('\\vec{v} = (-4,\\ 5)')}. ¿Cuáles son las coordenadas de su imagen?`,
    correcta: m("P'(-2,\\ 2)"),
    distractores: [m("P'(6,\\ -8)"), m("P'(-2,\\ -8)"), m("P'(6,\\ 2)")],
    pasos: [
      'Trasladar es sumar el vector a las coordenadas del punto.',
      `${m('(2 + (-4),\\ -3 + 5) = (-2,\\ 2)')}.`,
    ],
    errorComun: 'Restar el vector en lugar de sumarlo, lo que da (6, −8).',
  };
}

function reflexion(): Item {
  return {
    eje: 'C',
    dificultad: 2,
    enunciado: `¿Cuál es la imagen del punto ${m('A(3,\\ -5)')} al reflejarlo respecto del eje ${m('X')}?`,
    correcta: m("A'(3,\\ 5)"),
    distractores: [m("A'(-3,\\ -5)"), m("A'(-3,\\ 5)"), m("A'(-5,\\ 3)")],
    pasos: [
      `Al reflejar respecto del eje ${m('X')}, la abscisa se mantiene y la ordenada cambia de signo.`,
      `${m('(3,\\ -5) \\to (3,\\ 5)')}.`,
    ],
    errorComun: 'Cambiar el signo de la abscisa, que es lo que ocurre al reflejar respecto del eje Y.',
  };
}

function rotacion(): Item {
  return {
    eje: 'C',
    dificultad: 3,
    enunciado: `El punto ${m('B(4,\\ 1)')} se rota en 90° en sentido antihorario con centro en el origen. ¿Cuál es su imagen?`,
    correcta: m("B'(-1,\\ 4)"),
    distractores: [m("B'(1,\\ -4)"), m("B'(-4,\\ -1)"), m("B'(1,\\ 4)")],
    pasos: [
      `Una rotación de 90° antihoraria con centro en el origen transforma ${m('(x,\\ y)')} en ${m('(-y,\\ x)')}.`,
      `${m('(4,\\ 1) \\to (-1,\\ 4)')}.`,
    ],
    errorComun: 'Aplicar la regla de la rotación horaria, (x, y) → (y, −x), que da (1, −4).',
  };
}

function volumenCilindro(): Item {
  return {
    eje: 'C',
    dificultad: 3,
    enunciado: 'Un tarro cilíndrico tiene 3 cm de radio y 10 cm de altura. ¿Cuál es su volumen?',
    correcta: m('90\\pi\\ \\text{cm}^{3}'),
    distractores: [m('30\\pi\\ \\text{cm}^{3}'), m('60\\pi\\ \\text{cm}^{3}'), m('900\\pi\\ \\text{cm}^{3}')],
    pasos: [
      `El volumen de un cilindro es ${m('\\pi r^{2} h')}.`,
      `${m('\\pi \\cdot 3^{2} \\cdot 10 = 90\\pi')} cm³.`,
    ],
    errorComun: 'Usar el radio sin elevarlo al cuadrado (π · 3 · 10 = 30π).',
  };
}

function distancia(): Item {
  return {
    eje: 'C',
    dificultad: 2,
    enunciado: `¿Cuál es la distancia entre los puntos ${m('(1,\\ 2)')} y ${m('(4,\\ 6)')}?`,
    correcta: m('5'),
    distractores: [m('7'), m('25'), m('\\sqrt{7}')],
    pasos: [
      `${m('d = \\sqrt{(4 - 1)^{2} + (6 - 2)^{2}}')}.`,
      `${m('d = \\sqrt{9 + 16} = \\sqrt{25} = 5')}.`,
    ],
    errorComun: 'Olvidar la raíz cuadrada final y responder 25.',
  };
}

/* ========================================== PROBABILIDAD Y ESTADÍSTICA */

function dados(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'D',
      dificultad: 2,
      enunciado: 'Se lanzan dos dados comunes. ¿Cuál es la probabilidad de que la suma sea 7?',
      correcta: m('\\frac{1}{6}'),
      distractores: [m('\\frac{7}{36}'), m('\\frac{1}{11}'), m('\\frac{1}{12}')],
      pasos: [
        `Hay ${m('6 \\cdot 6 = 36')} resultados igualmente probables.`,
        `Los favorables son ${m('(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)')}: 6 casos.`,
        `${m('P = \\frac{6}{36} = \\frac{1}{6}')}.`,
      ],
      errorComun: 'Contar 11 sumas posibles (de 2 a 12) como si fueran igual de probables.',
    };
  }
  return {
    eje: 'D',
    dificultad: 2,
    enunciado: 'Se lanzan dos dados comunes. ¿Cuál es la probabilidad de que la suma sea 4?',
    correcta: m('\\frac{1}{12}'),
    distractores: [m('\\frac{1}{11}'), m('\\frac{1}{9}'), m('\\frac{1}{18}')],
    pasos: [
      'Hay 36 resultados igualmente probables.',
      `Suman 4: ${m('(1,3),(2,2),(3,1)')}, es decir, 3 casos.`,
      `${m('P = \\frac{3}{36} = \\frac{1}{12}')}.`,
    ],
    errorComun: 'Contar (1,3) y (3,1) como un solo caso y obtener 2/36 = 1/18.',
  };
}

function urna(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'D',
      dificultad: 1,
      enunciado: 'Una bolsa tiene 5 fichas rojas, 3 azules y 2 verdes. Si se saca una ficha al azar, ¿cuál es la probabilidad de que sea azul?',
      correcta: m('\\frac{3}{10}'),
      distractores: [m('\\frac{3}{7}'), m('\\frac{1}{3}'), m('\\frac{7}{10}')],
      pasos: [
        `Hay ${m('5 + 3 + 2 = 10')} fichas en total.`,
        `${m('P(\\text{azul}) = \\frac{3}{10}')}.`,
      ],
      errorComun: 'Comparar azules con no azules (3/7) en vez de azules con el total.',
    };
  }
  return {
    eje: 'D',
    dificultad: 2,
    enunciado: 'En la misma bolsa (5 rojas, 3 azules y 2 verdes), ¿cuál es la probabilidad de sacar una ficha que no sea verde?',
    correcta: m('\\frac{4}{5}'),
    distractores: [m('\\frac{1}{5}'), m('\\frac{1}{4}'), m('\\frac{2}{5}')],
    pasos: [
      `${m('P(\\text{verde}) = \\frac{2}{10} = \\frac{1}{5}')}.`,
      `Por complemento: ${m('P(\\text{no verde}) = 1 - \\frac{1}{5} = \\frac{4}{5}')}.`,
    ],
    errorComun: 'Calcular la probabilidad de verde (1/5) y no aplicar el complemento.',
  };
}

function media(): Item {
  return {
    eje: 'D',
    dificultad: 1,
    enunciado: 'Las notas de Tomás en cinco controles fueron 5, 8, 12, 8 y 2 (puntos sobre 15). ¿Cuál es el promedio?',
    correcta: '7',
    distractores: ['8', '10', '35'],
    pasos: [
      `Se suman los datos: ${m('5 + 8 + 12 + 8 + 2 = 35')}.`,
      `Se divide por la cantidad de datos: ${m('35 : 5 = 7')}.`,
    ],
    errorComun: 'Confundir el promedio con la moda o la mediana, que en este caso valen 8.',
  };
}

function mediana(): Item {
  return {
    eje: 'D',
    dificultad: 2,
    enunciado: `Las notas de un estudiante en seis evaluaciones fueron ${m('5{,}8')}; ${m('4{,}1')}; ${m('6{,}3')}; ${m('5{,}0')}; ${m('6{,}9')} y ${m('4{,}7')}. ¿Cuál es la mediana?`,
    correcta: m('5{,}4'),
    distractores: [m('5{,}0'), m('5{,}8'), m('2{,}8')],
    pasos: [
      `Se ordenan los datos: ${m('4{,}1;\\ 4{,}7;\\ 5{,}0;\\ 5{,}8;\\ 6{,}3;\\ 6{,}9')}.`,
      'Con seis datos, la mediana es el promedio de los dos centrales.',
      `${m('\\frac{5{,}0 + 5{,}8}{2} = 5{,}4')}.`,
    ],
    errorComun: 'Tomar un dato central sin ordenar primero, o elegir solo uno de los dos centrales.',
  };
}

function rango(): Item {
  return {
    eje: 'D',
    dificultad: 1,
    enunciado: 'Los minutos que tardó un grupo en resolver un problema fueron 3, 6, 6, 2, 11, 6 y 3. ¿Cuál es el rango de los datos?',
    correcta: '9',
    distractores: ['6', '11', '13'],
    pasos: [
      'El rango es la diferencia entre el dato mayor y el menor.',
      `${m('11 - 2 = 9')}.`,
    ],
    errorComun: 'Confundir el rango con la moda (6) o con el valor máximo (11).',
  };
}

function independientes(): Item {
  return {
    eje: 'D',
    dificultad: 2,
    enunciado: 'Se lanza una moneda y un dado. ¿Cuál es la probabilidad de obtener cara y un número par?',
    correcta: m('\\frac{1}{4}'),
    distractores: [m('1'), m('\\frac{1}{12}'), m('\\frac{1}{2}')],
    pasos: [
      `${m('P(\\text{cara}) = \\frac{1}{2}')} y ${m('P(\\text{par}) = \\frac{3}{6} = \\frac{1}{2}')}.`,
      `Son eventos independientes, así que se multiplican: ${m('\\frac{1}{2} \\cdot \\frac{1}{2} = \\frac{1}{4}')}.`,
    ],
    errorComun: 'Sumar las probabilidades (1/2 + 1/2 = 1) en vez de multiplicarlas.',
  };
}

function complemento(): Item {
  return {
    eje: 'D',
    dificultad: 1,
    enunciado: `El pronóstico indica que la probabilidad de lluvia mañana en Concepción es ${m('0{,}35')}. ¿Cuál es la probabilidad de que no llueva?`,
    correcta: m('0{,}65'),
    distractores: [m('0{,}35'), m('0{,}30'), m('1{,}35')],
    pasos: [
      'Llover y no llover son eventos complementarios: sus probabilidades suman 1.',
      `${m('1 - 0{,}35 = 0{,}65')}.`,
    ],
    errorComun: 'Repetir la probabilidad dada sin restarla de 1.',
  };
}

function multiplicativo(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'D',
      dificultad: 2,
      enunciado: 'Camila tiene 4 poleras, 3 pantalones y 2 pares de zapatillas. ¿Cuántas tenidas distintas puede armar con una prenda de cada tipo?',
      correcta: '24',
      distractores: ['9', '12', '48'],
      pasos: [
        'Por el principio multiplicativo, se multiplican las opciones de cada elección.',
        `${m('4 \\cdot 3 \\cdot 2 = 24')}.`,
      ],
      errorComun: 'Sumar las opciones (4 + 3 + 2 = 9) en vez de multiplicarlas.',
    };
  }
  return {
    eje: 'D',
    dificultad: 3,
    enunciado: '¿De cuántas maneras distintas pueden ordenarse 5 personas en una fila para una foto?',
    correcta: '120',
    distractores: ['25', '15', '60'],
    pasos: [
      'El primer lugar tiene 5 opciones, el segundo 4, y así sucesivamente.',
      `${m('5! = 5 \\cdot 4 \\cdot 3 \\cdot 2 \\cdot 1 = 120')}.`,
    ],
    errorComun: 'Calcular 5 · 5 = 25, como si una persona pudiera repetirse en la fila.',
  };
}

function frecuencias(tipo: 1 | 2): Item {
  if (tipo === 1) {
    return {
      eje: 'D',
      dificultad: 1,
      enunciado: 'En un curso de 40 estudiantes, 14 prefieren fútbol, 10 básquetbol y 16 vóleibol. ¿Qué porcentaje prefiere básquetbol?',
      correcta: '25 %',
      distractores: ['10 %', '40 %', '35 %'],
      pasos: [
        `Se calcula la fracción: ${m('\\frac{10}{40} = \\frac{1}{4}')}.`,
        `${m('\\frac{1}{4} = 25\\,\\%')}.`,
      ],
      errorComun: 'Usar la frecuencia absoluta (10) como si fuera un porcentaje.',
    };
  }
  return {
    eje: 'D',
    dificultad: 2,
    enunciado: 'De 200 personas encuestadas en Valparaíso, 72 usan transporte público para ir a trabajar. ¿Cuál es la frecuencia relativa porcentual de este grupo?',
    correcta: '36 %',
    distractores: ['72 %', '28 %', m('0{,}36') + ' %'],
    pasos: [
      `Frecuencia relativa: ${m('\\frac{72}{200} = 0{,}36')}.`,
      `En porcentaje: ${m('0{,}36 \\cdot 100 = 36\\,\\%')}.`,
    ],
    errorComun: 'Dejar 0,36 sin multiplicar por 100 y escribirlo como porcentaje.',
  };
}

function sinReposicion(): Item {
  return {
    eje: 'D',
    dificultad: 4,
    enunciado: 'Una caja tiene 4 bolitas rojas y 6 azules. Se sacan dos bolitas al azar, una tras otra y sin reposición. ¿Cuál es la probabilidad de que ambas sean rojas?',
    correcta: m('\\frac{2}{15}'),
    distractores: [m('\\frac{4}{25}'), m('\\frac{2}{5}'), m('\\frac{1}{15}')],
    pasos: [
      `Primera roja: ${m('\\frac{4}{10}')}.`,
      `Quedan 3 rojas de 9 bolitas: ${m('\\frac{3}{9}')}.`,
      `${m('\\frac{4}{10} \\cdot \\frac{3}{9} = \\frac{12}{90} = \\frac{2}{15}')}.`,
    ],
    errorComun: 'Calcular como si hubiera reposición: (4/10)² = 4/25.',
  };
}

function primos(): Item {
  return {
    eje: 'D',
    dificultad: 2,
    enunciado: 'Se lanza un dado común. ¿Cuál es la probabilidad de obtener un número primo?',
    correcta: m('\\frac{1}{2}'),
    distractores: [m('\\frac{2}{3}'), m('\\frac{1}{3}'), m('\\frac{5}{6}')],
    pasos: [
      'Los primos entre 1 y 6 son 2, 3 y 5 (el 1 no es primo).',
      `${m('P = \\frac{3}{6} = \\frac{1}{2}')}.`,
    ],
    errorComun: 'Considerar el 1 como número primo y obtener 4/6 = 2/3.',
  };
}

/* ================================================================== BANCO */

const ITEMS: Item[] = [
  // Números (14)
  sumaFracciones(1, 2, 1, 3),
  sumaFracciones(2, 3, 3, 4),
  descuento('Un polerón', 24000, 15),
  descuento('Una mochila', 18500, 20),
  aumentosSucesivos(10, 20),
  potencias(2, 5, 3, 4),
  potencias(3, 4, 2, 3),
  raices(1),
  raices(2),
  notacionCientifica(),
  compararNumeros(),
  proporcionInversa(),
  interesSimple(500000, 4, 3),
  operacionesEnteros(),
  // Álgebra y funciones (22)
  ecuacionLineal(1),
  ecuacionLineal(2),
  ecuacionLineal(3),
  sistema(1),
  sistema(2),
  evaluarFuncion(1),
  evaluarFuncion(2),
  composicion(1),
  composicion(2),
  cuadratica(1),
  cuadratica(2),
  cuadratica(3),
  pendiente(1),
  pendiente(2),
  ecuacionRecta(),
  inecuacion(1),
  inecuacion(2),
  factorizacion(),
  cuadradoBinomio(),
  problemaEntradas(),
  funcionCosto(),
  vertice(),
  // Geometría (14)
  pitagoras(1),
  pitagoras(2),
  areaTriangulo(),
  circulo(1),
  circulo(2),
  semejanza(1),
  semejanza(2),
  angulos(1),
  angulos(2),
  traslacion(),
  reflexion(),
  rotacion(),
  volumenCilindro(),
  distancia(),
  // Probabilidad y estadística (15)
  dados(1),
  dados(2),
  urna(1),
  urna(2),
  media(),
  mediana(),
  rango(),
  independientes(),
  complemento(),
  multiplicativo(1),
  multiplicativo(2),
  frecuencias(1),
  frecuencias(2),
  sinReposicion(),
  primos(),
];

export const BANCO_M1: PreguntaSeed[] = ITEMS.map(construir);

/** Claves del banco por eje, en el orden del ensayo. */
export function clavesBancoM1(eje?: Eje): string[] {
  return BANCO_M1.filter((p) => !eje || p.eje === eje).map((p) => p.clave);
}

export function verificarBancoM1(): void {
  const porEje = { A: 0, B: 0, C: 0, D: 0 } as Record<Eje, number>;
  for (const p of BANCO_M1) porEje[p.eje as Eje]++;
  const esperado = { A: 14, B: 22, C: 14, D: 15 };
  if (BANCO_M1.length !== 65 || (Object.keys(esperado) as Eje[]).some((e) => porEje[e] !== esperado[e])) {
    throw new Error(`Banco M1 con distribución inesperada: ${JSON.stringify(porEje)}`);
  }
}
