/**
 * Biblioteca de contenidos. Cada lección pertenece a una `unidad`; dentro de la
 * unidad, `orden` define la secuencia y el desbloqueo (la lección N+1 se abre
 * al completar la N).
 *
 * Tipos: `mixto` = lectura con ejemplos resueltos, `pdf` = guía descargable,
 * `practica` = set de ejercicios, `video` = lección en video. Sin URL de video
 * verificada, ninguna lección se marca como video (D-016).
 *
 * Los cuerpos usan String.raw para escribir LaTeX sin duplicar barras.
 */

export interface ContenidoSeed {
  slug: string;
  titulo: string;
  descripcion: string;
  materia: string;
  eje: string;
  unidad: string;
  orden: number;
  tipo: 'video' | 'pdf' | 'mixto' | 'practica';
  duracionMin: number;
  premium: boolean;
  puntosClave: string[];
  cuerpo: string;
}

export const CONTENIDOS: ContenidoSeed[] = [
  /* ============================================================== M1 */
  {
    slug: 'porcentajes-y-proporcionalidad',
    titulo: 'Porcentajes y proporcionalidad',
    descripcion: 'Descuentos, aumentos sucesivos y proporción directa e inversa, con los atajos que más se usan en la PAES.',
    materia: 'M1',
    eje: 'A',
    unidad: 'Números',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'Un $p\\,\\%$ de $x$ es $x \\cdot \\frac{p}{100}$',
      'Aumentar un $p\\,\\%$ es multiplicar por $1 + \\frac{p}{100}$',
      'Los porcentajes sucesivos se multiplican, no se suman',
      'En proporción inversa el producto se mantiene constante',
    ],
    cuerpo: String.raw`## Porcentajes como factores

Calcular un porcentaje es multiplicar: el $15\,\%$ de $24.000$ es $24.000 \cdot 0{,}15 = 3.600$.

La idea más útil para la PAES es pensar cada cambio como un **factor**:

| Cambio | Factor |
| --- | --- |
| Subir un $20\,\%$ | $1{,}20$ |
| Bajar un $15\,\%$ | $0{,}85$ |
| Subir un $5\,\%$ | $1{,}05$ |

### Cambios sucesivos

Si un precio sube un $10\,\%$ y luego un $20\,\%$, el factor total es $1{,}1 \cdot 1{,}2 = 1{,}32$: subió un $32\,\%$, **no** un $30\,\%$. El segundo aumento se aplica sobre un precio que ya había subido.

## Proporcionalidad

- **Directa:** si una magnitud se duplica, la otra también. El cociente $\frac{y}{x}$ es constante.
- **Inversa:** si una se duplica, la otra se reduce a la mitad. El producto $x \cdot y$ es constante.

> **Ejemplo.** Seis personas pintan un colegio en 10 días. El trabajo total es $6 \cdot 10 = 60$ días-persona, así que 4 personas tardan $60 : 4 = 15$ días.`,
  },
  {
    slug: 'potencias-y-raices',
    titulo: 'Potencias, raíces y notación científica',
    descripcion: 'Propiedades de potencias, simplificación de raíces y operaciones con notación científica.',
    materia: 'M1',
    eje: 'A',
    unidad: 'Números',
    orden: 2,
    tipo: 'pdf',
    duracionMin: 25,
    premium: false,
    puntosClave: [
      '$a^m \\cdot a^n = a^{m+n}$ y $\\frac{a^m}{a^n} = a^{m-n}$',
      '$a^{-n} = \\frac{1}{a^n}$',
      'Solo se suman raíces semejantes: $2\\sqrt{3} + 3\\sqrt{3} = 5\\sqrt{3}$',
      'En notación científica se multiplican coeficientes y se suman exponentes',
    ],
    cuerpo: String.raw`## Propiedades de las potencias

| Propiedad | Ejemplo |
| --- | --- |
| $a^m \cdot a^n = a^{m+n}$ | $2^3 \cdot 2^4 = 2^7$ |
| $\dfrac{a^m}{a^n} = a^{m-n}$ | $\dfrac{5^6}{5^2} = 5^4$ |
| $(a^m)^n = a^{m \cdot n}$ | $(3^2)^3 = 3^6$ |
| $a^{-n} = \dfrac{1}{a^n}$ | $\left(\dfrac{3}{4}\right)^{-2} = \dfrac{16}{9}$ |

Cuidado con el signo: $-2^4 = -16$, pero $(-2)^4 = 16$.

## Raíces

Para simplificar, se busca el mayor cuadrado perfecto que divide a la cantidad subradical:

$$\sqrt{50} = \sqrt{25 \cdot 2} = 5\sqrt{2}$$

Solo se pueden sumar o restar raíces **semejantes** (misma cantidad subradical):

$$\sqrt{12} + \sqrt{27} = 2\sqrt{3} + 3\sqrt{3} = 5\sqrt{3}$$

## Notación científica

Un número se escribe como $a \cdot 10^n$ con $1 \le a < 10$.

$$(3 \cdot 10^{4}) \cdot (2 \cdot 10^{-6}) = 6 \cdot 10^{-2}$$`,
  },
  {
    slug: 'funciones-lineales',
    titulo: 'Funciones lineales y afines',
    descripcion: 'Pendiente, coeficiente de posición y cómo leer el gráfico de una función de primer grado.',
    materia: 'M1',
    eje: 'B',
    unidad: 'Álgebra y funciones',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 15,
    premium: false,
    puntosClave: [
      'Función afín: $f(x) = mx + n$',
      '$m$ es la pendiente: $m = \\frac{y_2 - y_1}{x_2 - x_1}$',
      '$n$ es el punto de corte con el eje $Y$',
      'Si $m > 0$ la recta crece; si $m < 0$, decrece',
    ],
    cuerpo: String.raw`## La función afín

$$f(x) = mx + n$$

- $m$ es la **pendiente**: cuánto cambia $f(x)$ cuando $x$ aumenta en 1.
- $n$ es el **coeficiente de posición**: el valor de la función en $x = 0$, donde la recta corta al eje $Y$.

Si $n = 0$ la función es **lineal** ($f(x) = mx$) y representa una proporcionalidad directa.

## Calcular la pendiente

Con dos puntos $(x_1, y_1)$ y $(x_2, y_2)$:

$$m = \frac{y_2 - y_1}{x_2 - x_1}$$

> **Ejemplo.** Por $(1, 2)$ y $(4, 11)$: $m = \frac{11 - 2}{4 - 1} = 3$. Luego $2 = 3 \cdot 1 + n$, así que $n = -1$ y la recta es $y = 3x - 1$.

## Leer un problema en contexto

Una imprenta cobra $C(x) = 15.000 + 800x$. El $15.000$ es el cargo fijo ($n$) y $800$ es el costo por afiche ($m$). Con $39.000$ pesos: $800x = 24.000$, es decir, $30$ afiches.`,
  },
  {
    slug: 'factorizacion-por-agrupacion',
    titulo: 'Productos notables y factorización',
    descripcion: 'Cuadrado de binomio, suma por diferencia y factorización por agrupación, paso a paso.',
    materia: 'M1',
    eje: 'B',
    unidad: 'Álgebra y funciones',
    orden: 2,
    tipo: 'mixto',
    duracionMin: 18,
    premium: false,
    puntosClave: [
      '$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$',
      '$a^2 - b^2 = (a + b)(a - b)$',
      'Con cuatro términos, prueba agrupar de a dos',
      'Verifica siempre multiplicando los factores',
    ],
    cuerpo: String.raw`## Productos notables

| Producto | Desarrollo |
| --- | --- |
| $(a + b)^2$ | $a^2 + 2ab + b^2$ |
| $(a - b)^2$ | $a^2 - 2ab + b^2$ |
| $(a + b)(a - b)$ | $a^2 - b^2$ |

El error más común es olvidar el término central: $(2x - 5)^2 = 4x^2 - 20x + 25$, no $4x^2 + 25$.

## Factorizar es el camino inverso

- **Diferencia de cuadrados:** $x^2 - 49 = (x + 7)(x - 7)$.
- **Trinomio:** $x^2 - 5x + 6$; se buscan dos números que multiplicados den $6$ y sumados $-5$: $(x - 2)(x - 3)$.

## Agrupación

Con cuatro términos, se saca factor común por pares:

$$ax + ay + bx + by = a(x + y) + b(x + y) = (a + b)(x + y)$$

> **Regla práctica:** si el segundo grupo empieza con signo negativo, saca $-1$ como factor común para que aparezca el mismo binomio.`,
  },
  {
    slug: 'ecuaciones-cuadraticas',
    titulo: 'Práctica: ecuaciones cuadráticas',
    descripcion: 'Doce ejercicios graduados de factorización, fórmula general y suma y producto de raíces.',
    materia: 'M1',
    eje: 'B',
    unidad: 'Álgebra y funciones',
    orden: 3,
    tipo: 'practica',
    duracionMin: 30,
    premium: true,
    puntosClave: [
      'Fórmula general: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
      'Discriminante $\\Delta = b^2 - 4ac$: dos, una o ninguna solución real',
      'Suma de raíces $-\\frac{b}{a}$, producto $\\frac{c}{a}$',
    ],
    cuerpo: String.raw`## Antes de empezar

Para $ax^2 + bx + c = 0$:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

El **discriminante** $\Delta = b^2 - 4ac$ indica cuántas soluciones reales hay:

- $\Delta > 0$: dos soluciones distintas.
- $\Delta = 0$: una solución (doble).
- $\Delta < 0$: ninguna solución real.

## Ejercicios

1. Resuelve $x^2 - x - 12 = 0$.
2. Resuelve $2x^2 - 8 = 0$.
3. ¿Cuánto suman las soluciones de $x^2 - 7x + 10 = 0$?
4. Calcula el discriminante de $x^2 + 4x + 5 = 0$ e interprétalo.
5. Encuentra $k$ para que $x^2 + kx + 9 = 0$ tenga una sola solución.

## Respuestas

1. $\{-3,\ 4\}$ · 2. $\{-2,\ 2\}$ · 3. $7$ · 4. $\Delta = -4$, sin soluciones reales · 5. $k = 6$ o $k = -6$`,
  },
  {
    slug: 'geometria-pitagoras-semejanza',
    titulo: 'Teorema de Pitágoras y semejanza',
    descripcion: 'Triángulos rectángulos, tríos pitagóricos y razón de semejanza aplicada a problemas reales.',
    materia: 'M1',
    eje: 'C',
    unidad: 'Geometría',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 22,
    premium: false,
    puntosClave: [
      '$a^2 + b^2 = c^2$, con $c$ la hipotenusa',
      'Tríos útiles: 3-4-5, 5-12-13, 8-15-17',
      'En figuras semejantes las longitudes se multiplican por $k$ y las áreas por $k^2$',
    ],
    cuerpo: String.raw`## Teorema de Pitágoras

En un triángulo rectángulo, el cuadrado de la hipotenusa es la suma de los cuadrados de los catetos:

$$c^2 = a^2 + b^2$$

> **Ejemplo.** Una escalera de 13 m con su base a 5 m del muro: $h^2 = 13^2 - 5^2 = 144$, así que toca el muro a 12 m de altura.

Memorizar los tríos **3-4-5**, **5-12-13** y **8-15-17** (y sus múltiplos, como 6-8-10) ahorra tiempo en la prueba.

## Semejanza

Dos figuras son semejantes si tienen la misma forma: sus ángulos son iguales y sus lados son proporcionales con una **razón** $k$.

- Las longitudes (lados, perímetros) se multiplican por $k$.
- Las áreas se multiplican por $k^2$.
- Los volúmenes se multiplican por $k^3$.

> **Sombras.** Un poste de 2 m proyecta 3 m de sombra y un árbol, 12 m. Como los triángulos son semejantes, $\frac{h}{12} = \frac{2}{3}$ y el árbol mide 8 m.`,
  },
  {
    slug: 'transformaciones-isometricas',
    titulo: 'Transformaciones isométricas',
    descripcion: 'Traslaciones, reflexiones y rotaciones en el plano cartesiano, con sus reglas de coordenadas.',
    materia: 'M1',
    eje: 'C',
    unidad: 'Geometría',
    orden: 2,
    tipo: 'pdf',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'Traslación por $(a, b)$: $(x, y) \\to (x + a,\\ y + b)$',
      'Reflexión en el eje $X$: $(x, y) \\to (x, -y)$',
      'Rotación de 90° antihoraria: $(x, y) \\to (-y, x)$',
    ],
    cuerpo: String.raw`## Isometrías

Una transformación isométrica mueve una figura **sin cambiar su forma ni su tamaño**.

| Transformación | Regla |
| --- | --- |
| Traslación por $\vec{v} = (a, b)$ | $(x, y) \to (x + a,\ y + b)$ |
| Reflexión respecto del eje $X$ | $(x, y) \to (x,\ -y)$ |
| Reflexión respecto del eje $Y$ | $(x, y) \to (-x,\ y)$ |
| Rotación de 90° antihoraria (centro en el origen) | $(x, y) \to (-y,\ x)$ |
| Rotación de 180° | $(x, y) \to (-x,\ -y)$ |

> **Ejemplo.** $P(2, -3)$ trasladado por $(-4, 5)$ queda en $(-2, 2)$.

Para no confundir el sentido de una rotación, dibuja el punto y gíralo con el lápiz: el sentido antihorario es el contrario a las agujas del reloj.`,
  },
  {
    slug: 'medidas-tendencia-central',
    titulo: 'Media, mediana, moda y rango',
    descripcion: 'Cómo calcular e interpretar las medidas de un conjunto de datos y cuándo conviene cada una.',
    materia: 'M1',
    eje: 'D',
    unidad: 'Probabilidad y estadística',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 18,
    premium: false,
    puntosClave: [
      'Media: suma de datos dividida por la cantidad',
      'Mediana: dato central de los datos ordenados',
      'Moda: dato más frecuente',
      'Rango: dato mayor menos dato menor',
    ],
    cuerpo: String.raw`## Las cuatro medidas

Para los datos $5, 8, 12, 8, 2$:

- **Media:** $\frac{5 + 8 + 12 + 8 + 2}{5} = 7$.
- **Mediana:** se ordenan ($2, 5, 8, 8, 12$) y se toma el central: $8$.
- **Moda:** el que más se repite: $8$.
- **Rango:** $12 - 2 = 10$.

## Cantidad par de datos

La mediana es el promedio de los dos datos centrales. Con $4{,}1;\ 4{,}7;\ 5{,}0;\ 5{,}8;\ 6{,}3;\ 6{,}9$ la mediana es $\frac{5{,}0 + 5{,}8}{2} = 5{,}4$.

## Promedios ponderados

Si 18 estudiantes promediaron $5{,}2$ y llega una nota $6{,}1$, el nuevo promedio no es $\frac{5{,}2 + 6{,}1}{2}$: hay que recalcular la suma total.

$$\frac{18 \cdot 5{,}2 + 6{,}1}{19} \approx 5{,}25$$

> La media es sensible a los valores extremos; la mediana no. Por eso los sueldos se informan muchas veces con la mediana.`,
  },
  {
    slug: 'probabilidad-condicional',
    titulo: 'Probabilidades: regla de Laplace y eventos compuestos',
    descripcion: 'Casos favorables y posibles, eventos independientes, complemento y extracciones sin reposición.',
    materia: 'M1',
    eje: 'D',
    unidad: 'Probabilidad y estadística',
    orden: 2,
    tipo: 'mixto',
    duracionMin: 25,
    premium: false,
    puntosClave: [
      'Laplace: $P(A) = \\frac{\\text{casos favorables}}{\\text{casos posibles}}$',
      'Complemento: $P(\\bar{A}) = 1 - P(A)$',
      'Independientes: $P(A \\cap B) = P(A) \\cdot P(B)$',
      'Sin reposición, el segundo evento cambia sus casos posibles',
    ],
    cuerpo: String.raw`## Regla de Laplace

Si todos los resultados son igualmente probables:

$$P(A) = \frac{\text{casos favorables}}{\text{casos posibles}}$$

Al lanzar dos dados hay $36$ resultados. Suman 7 en $6$ de ellos, así que $P = \frac{6}{36} = \frac{1}{6}$.

## Complemento

$$P(\text{no } A) = 1 - P(A)$$

Si la probabilidad de lluvia es $0{,}35$, la de que no llueva es $0{,}65$.

## Eventos independientes

Si un evento no afecta al otro, las probabilidades se **multiplican**: cara en una moneda y par en un dado, $\frac{1}{2} \cdot \frac{1}{2} = \frac{1}{4}$.

## Probabilidad condicional

$$P(A \mid B) = \frac{P(A \cap B)}{P(B)}$$

> **Sin reposición.** Con 4 rojas y 6 azules, la probabilidad de sacar dos rojas seguidas es $\frac{4}{10} \cdot \frac{3}{9} = \frac{2}{15}$: después de la primera quedan 3 rojas de 9.`,
  },

  /* ============================================================== M2 */
  {
    slug: 'teoria-exponenciales',
    titulo: 'Funciones exponenciales y crecimiento',
    descripcion: 'Resuelve ecuaciones exponenciales y modela crecimiento poblacional y financiero.',
    materia: 'M2',
    eje: 'A',
    unidad: 'Funciones y álgebra',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 20,
    premium: true,
    puntosClave: [
      '$f(x) = a \\cdot b^x$: crece si $b > 1$, decrece si $0 < b < 1$',
      'Igualar bases: $2^{x+1} = 2^5 \\Rightarrow x + 1 = 5$',
      'Si no se pueden igualar bases, se aplica logaritmo',
    ],
    cuerpo: String.raw`## La función exponencial

$$f(x) = a \cdot b^{x}, \quad b > 0,\ b \ne 1$$

- Si $b > 1$, crece (población, interés compuesto).
- Si $0 < b < 1$, decrece (depreciación, desintegración).

## Ecuaciones exponenciales

**Igualando bases:** $2^{x+1} = 32 = 2^5$, entonces $x + 1 = 5$ y $x = 4$.

**Con logaritmos:** si $3^x = 20$, se aplica logaritmo a ambos lados:

$$x = \frac{\log 20}{\log 3} \approx 2{,}73$$

## Crecimiento en contexto

Una población de 1.000 bacterias que se duplica cada hora se modela con $P(t) = 1.000 \cdot 2^{t}$. A las 5 horas hay $32.000$.`,
  },
  {
    slug: 'logaritmos-propiedades',
    titulo: 'Logaritmos y sus propiedades',
    descripcion: 'Definición, propiedades del producto, cociente y potencia, y cambio de base.',
    materia: 'M2',
    eje: 'D',
    unidad: 'Funciones y álgebra',
    orden: 2,
    tipo: 'mixto',
    duracionMin: 22,
    premium: false,
    puntosClave: [
      '$\\log_b x = y \\iff b^y = x$',
      '$\\log(ab) = \\log a + \\log b$',
      '$\\log a^n = n \\log a$',
      'Cambio de base: $\\log_a b = \\frac{\\log b}{\\log a}$',
    ],
    cuerpo: String.raw`## Definición

Un logaritmo es un **exponente**:

$$\log_b x = y \iff b^{y} = x$$

Por ejemplo, $\log_2 32 = 5$ porque $2^5 = 32$. El argumento siempre debe ser positivo: $\log(x - 3)$ existe solo si $x > 3$.

## Propiedades

| Propiedad | Ejemplo |
| --- | --- |
| $\log(ab) = \log a + \log b$ | $\log 20 = \log 2 + \log 10$ |
| $\log\frac{a}{b} = \log a - \log b$ | $\log 5 = \log 10 - \log 2$ |
| $\log a^{n} = n\log a$ | $\log 8 = 3\log 2$ |

> Con $\log 2 \approx 0{,}301$: $\log 8 = 3 \cdot 0{,}301 = 0{,}903$.

## Cambio de base

$$\log_a b = \frac{\log b}{\log a}$$

$\log_2 10 = \frac{1}{\log 2} \approx 3{,}32$.`,
  },
  {
    slug: 'analisis-vectores',
    titulo: 'Vectores y homotecia en el plano',
    descripcion: 'Suma y ponderación de vectores, rectas paralelas y homotecias con razón positiva y negativa.',
    materia: 'M2',
    eje: 'B',
    unidad: 'Geometría analítica',
    orden: 1,
    tipo: 'pdf',
    duracionMin: 30,
    premium: false,
    puntosClave: [
      'Suma: $(a_1, a_2) + (b_1, b_2) = (a_1 + b_1,\\ a_2 + b_2)$',
      'Ponderación: $k(a_1, a_2) = (ka_1,\\ ka_2)$',
      'Homotecia de centro $O$ y razón $k$: $(x, y) \\to (kx,\\ ky)$',
    ],
    cuerpo: String.raw`## Operaciones con vectores

Si $\vec{a} = (2, 3)$ y $\vec{b} = (-1, 4)$:

- $\vec{a} + \vec{b} = (1, 7)$
- $2\vec{a} = (4, 6)$
- $2\vec{a} + \vec{b} = (3, 10)$

El módulo de $\vec{a}$ es $|\vec{a}| = \sqrt{2^2 + 3^2} = \sqrt{13}$.

## Rectas paralelas y perpendiculares

- Paralelas: misma pendiente.
- Perpendiculares: el producto de sus pendientes es $-1$.

## Homotecia

Con centro en el origen y razón $k$, cada punto $(x, y)$ va a $(kx, ky)$.

- $|k| > 1$ amplía, $|k| < 1$ reduce.
- Si $k < 0$, la imagen queda al otro lado del centro: $P(3, -1)$ con $k = -2$ va a $(-6, 2)$.`,
  },
  {
    slug: 'distribucion-binomial',
    titulo: 'Práctica: variables aleatorias y binomial',
    descripcion: 'Ejercicios de valor esperado, distribución binomial y la regla 68-95 de la normal.',
    materia: 'M2',
    eje: 'C',
    unidad: 'Geometría analítica',
    orden: 2,
    tipo: 'practica',
    duracionMin: 30,
    premium: false,
    puntosClave: [
      '$E(X) = \\sum x \\cdot P(x)$',
      'Binomial: $P(X = k) = \\binom{n}{k} p^k (1 - p)^{n - k}$',
      'Normal: 68 % a una desviación, 95 % a dos',
    ],
    cuerpo: String.raw`## Repaso

- **Valor esperado:** $E(X) = \sum x \cdot P(x)$.
- **Binomial** ($n$ ensayos, probabilidad de éxito $p$):

$$P(X = k) = \binom{n}{k} p^{k}(1 - p)^{n - k}$$

- **Normal:** cerca del 68 % de los datos está a una desviación estándar de la media y cerca del 95 % a dos.

## Ejercicios

1. $X$ toma 1, 2 y 3 con probabilidades 0,2; 0,5 y 0,3. Calcula $E(X)$.
2. Se lanza una moneda 3 veces. ¿Probabilidad de exactamente 2 caras?
3. Un tirador acierta con probabilidad 0,8. ¿Probabilidad de acertar los 2 tiros de 2?
4. Puntajes con media 500 y desviación 100: ¿qué porcentaje aproximado está entre 300 y 700?

## Respuestas

1. $2{,}1$ · 2. $\frac{3}{8}$ · 3. $0{,}64$ · 4. Cerca del 95 %`,
  },

  /* ============================================================== CL */
  {
    slug: 'localizar-informacion',
    titulo: 'Localizar información explícita',
    descripcion: 'Técnicas para encontrar datos en el texto sin caer en distractores que "suenan bien".',
    materia: 'CL',
    eje: 'A',
    unidad: 'Leer para comprender',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 15,
    premium: false,
    puntosClave: [
      'Lee primero la pregunta y subraya la palabra clave',
      'Vuelve al texto: la respuesta está escrita, no se deduce',
      'Descarta alternativas verdaderas pero que el texto no dice',
    ],
    cuerpo: String.raw`## Qué evalúa

Las preguntas de **localizar** piden un dato que aparece de forma explícita: una cifra, un nombre o una afirmación.

## Método en tres pasos

1. **Lee la pregunta antes** y marca la palabra clave ("¿qué porcentaje…?", "¿con qué compara…?").
2. **Escanea el texto** buscando esa palabra o un sinónimo cercano.
3. **Compara literalmente** la alternativa con el fragmento.

## La trampa más común

Alternativas que son ciertas en el mundo real, pero que **el texto no menciona**. Si no puedes señalar la línea que la respalda, descártala.

> En el texto sobre el cerebro aparecen dos porcentajes: 20 % (energía) y 2 % (masa). Las preguntas de localizar suelen usar el otro número como distractor.`,
  },
  {
    slug: 'comprension-lectora-1',
    titulo: 'Interpretar textos argumentativos',
    descripcion: 'Identificar tesis, argumentos y contraargumentos, y distinguir la voz del emisor de la de otros.',
    materia: 'CL',
    eje: 'B',
    unidad: 'Leer para comprender',
    orden: 2,
    tipo: 'mixto',
    duracionMin: 24,
    premium: false,
    puntosClave: [
      'Tesis: la postura que el emisor defiende',
      'Argumentos: las razones que la sostienen',
      'Contraargumento: la objeción que el emisor menciona para refutarla',
    ],
    cuerpo: String.raw`## Estructura argumentativa

- **Tesis:** la idea que el emisor quiere demostrar. Suele estar al inicio o en la conclusión.
- **Argumentos:** razones, datos o ejemplos que la apoyan.
- **Contraargumentos:** objeciones de otros que el emisor presenta para rebatirlas.

## Distingue las voces

Una pregunta frecuente es confundir **lo que dicen los detractores** con lo que piensa el emisor. Fíjate en marcas como "algunos sostienen", "los detractores argumentan", "sin embargo", "pero".

## Conectores que orientan

| Conector | Función |
| --- | --- |
| sin embargo, pero, no obstante | contraste |
| por lo tanto, en consecuencia | conclusión |
| porque, ya que, puesto que | causa |

> "Defender la seguridad vial no es una cuestión emocional: es aplicar estadística." Los dos puntos anuncian la tesis.`,
  },
  {
    slug: 'evaluar-textos-literarios',
    titulo: 'Evaluar recursos y atmósfera en textos literarios',
    descripcion: 'Figuras literarias, narrador y atmósfera: cómo justificar una lectura con el texto.',
    materia: 'CL',
    eje: 'C',
    unidad: 'Leer críticamente',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 20,
    premium: true,
    puntosClave: [
      'Personificación: dar rasgos humanos a lo no humano',
      'Hipérbole: exageración',
      'La atmósfera se justifica con elementos concretos del texto',
    ],
    cuerpo: String.raw`## Figuras frecuentes

| Figura | Ejemplo |
| --- | --- |
| Personificación | "la casa guardaba la memoria" |
| Metáfora | "sus ojos eran dos luceros" |
| Comparación | "frío como el hielo" |
| Hipérbole | "te lo dije un millón de veces" |

## Atmósfera

La atmósfera es el clima emocional del texto. Para identificarla, reúne **evidencia concreta**: objetos, sonidos, acciones inexplicables, adjetivos.

> Puertas que se abren desde adentro, un constructor desconocido y un final abierto: todo apunta al misterio.

## Evaluar es justificar

En las preguntas de evaluar no basta con "sentir" la respuesta: elige la alternativa que puedas defender con una cita del texto.`,
  },
  {
    slug: 'vocabulario-contextual',
    titulo: 'Práctica: vocabulario contextual',
    descripcion: 'Diez palabras de ensayos anteriores para practicar el reemplazo sin cambiar el sentido.',
    materia: 'CL',
    eje: 'D',
    unidad: 'Leer críticamente',
    orden: 2,
    tipo: 'practica',
    duracionMin: 15,
    premium: false,
    puntosClave: [
      'Reemplaza la palabra en la oración y relee',
      'Atiende a los conectores que rodean la palabra',
      'Descarta sinónimos que no calzan con el contexto',
    ],
    cuerpo: String.raw`## Método

1. Lee la oración completa y la anterior.
2. Reemplaza la palabra por cada alternativa.
3. Quédate con la que conserva **el sentido de la oración**, no solo el significado del diccionario.

## Ejercicios

Indica un sinónimo contextual para la palabra en mayúsculas:

1. "Las medidas parecen TRIVIALES a primera vista. Sin embargo, cada una responde a un cálculo."
2. "Durante la noche el cerebro CONSOLIDA la memoria."
3. "El ministro dio una respuesta AMBIGUA y nadie entendió su postura."
4. "La evidencia REFUTA la hipótesis inicial."
5. "Su aporte fue CRUCIAL para ganar el campeonato."

## Respuestas

1. insignificantes · 2. fortalece · 3. imprecisa · 4. contradice · 5. decisivo`,
  },

  /* ============================================================== BIO */
  {
    slug: 'celula-y-organelos',
    titulo: 'La célula y sus organelos',
    descripcion: 'Estructura celular, función de cada organelo y diferencias entre célula animal y vegetal.',
    materia: 'BIO',
    eje: 'A',
    unidad: 'Célula y genética',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'Mitocondria: respiración celular y ATP',
      'Ribosomas: síntesis de proteínas',
      'Cloroplastos y pared celular: solo en células vegetales',
      'El ADN se duplica en la fase S',
    ],
    cuerpo: String.raw`## Organelos y funciones

| Organelo | Función |
| --- | --- |
| Núcleo | Contiene el ADN y controla la célula |
| Mitocondria | Respiración celular, produce ATP |
| Ribosoma | Síntesis de proteínas |
| Retículo endoplasmático | Síntesis y transporte de proteínas y lípidos |
| Aparato de Golgi | Modifica y empaqueta proteínas |
| Cloroplasto | Fotosíntesis (solo vegetales) |

## Ciclo celular

La **interfase** tiene tres etapas: G1 (crecimiento), S (duplicación del ADN) y G2 (preparación). Luego viene la **mitosis**, que reparte el material genético ya duplicado.`,
  },
  {
    slug: 'genetica-mendeliana',
    titulo: 'Genética mendeliana',
    descripcion: 'Cruces monohíbridos, dominancia y las leyes de Mendel con el cuadro de Punnett.',
    materia: 'BIO',
    eje: 'B',
    unidad: 'Célula y genética',
    orden: 2,
    tipo: 'mixto',
    duracionMin: 26,
    premium: false,
    puntosClave: [
      'Genotipo: combinación de alelos (RR, Rr, rr)',
      'Fenotipo: rasgo que se observa',
      'F1 de RR × rr: 100 % Rr',
      'F2 de Rr × Rr: 3:1 en fenotipo',
    ],
    cuerpo: String.raw`## Conceptos base

- **Alelo:** cada versión de un gen. El dominante se escribe con mayúscula ($R$).
- **Homocigoto:** dos alelos iguales ($RR$ o $rr$). **Heterocigoto:** distintos ($Rr$).

## Ley de segregación

Los dos alelos de un gen se separan al formarse los gametos: cada gameto lleva **uno**.

## Cuadro de Punnett: Rr × Rr

|   | R | r |
| --- | --- | --- |
| **R** | RR | Rr |
| **r** | Rr | rr |

Genotipos: 1 RR : 2 Rr : 1 rr. Fenotipos: 3 dominantes : 1 recesivo.

> El cruce RR × rr da 100 % Rr en la F1. La proporción 3:1 aparece recién en la F2.`,
  },
  {
    slug: 'evolucion-seleccion-natural',
    titulo: 'Evolución y selección natural',
    descripcion: 'Variabilidad, mutación, selección natural y las evidencias que respaldan la evolución.',
    materia: 'BIO',
    eje: 'C',
    unidad: 'Evolución y ecosistemas',
    orden: 1,
    tipo: 'pdf',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'La mutación origina variantes nuevas',
      'La selección natural favorece a los mejor adaptados',
      'Evidencias: fósiles, homologías, embriología y ADN',
    ],
    cuerpo: String.raw`## Selección natural

1. En una población hay **variación** heredable.
2. Nacen más individuos de los que pueden sobrevivir.
3. Los que tienen rasgos ventajosos dejan **más descendencia**.
4. Con el tiempo, esos rasgos se vuelven más frecuentes.

La **mutación** es la fuente original de variantes; la recombinación las mezcla.

## Evidencias

- **Registro fósil:** muestra cambios a lo largo del tiempo.
- **Estructuras homólogas:** mismo origen, distinta función (brazo humano, ala de murciélago).
- **Biología molecular:** especies emparentadas comparten más secuencias de ADN.

> Lamarck propuso la herencia de caracteres adquiridos; hoy sabemos que lo que un individuo aprende o ejercita no se hereda.`,
  },
  {
    slug: 'flujo-energia-ecosistemas',
    titulo: 'Práctica: flujo de energía en ecosistemas',
    descripcion: 'Cadenas y tramas tróficas, regla del 10 % y ciclos de la materia.',
    materia: 'BIO',
    eje: 'D',
    unidad: 'Evolución y ecosistemas',
    orden: 2,
    tipo: 'practica',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'La energía fluye en un solo sentido; la materia se recicla',
      'Cerca del 10 % de la energía pasa al nivel siguiente',
      'Los descomponedores devuelven nutrientes al suelo',
    ],
    cuerpo: String.raw`## Repaso

Productores → consumidores primarios → secundarios → terciarios. En cada paso, cerca del **90 %** de la energía se pierde como calor.

## Ejercicios

1. Si los productores fijan 10.000 kcal, ¿cuánta energía llega aproximadamente a los consumidores secundarios?
2. ¿Por qué las cadenas tróficas rara vez tienen más de cuatro o cinco niveles?
3. ¿Qué ocurriría con los nutrientes del suelo sin descomponedores?

## Respuestas

1. Cerca de 100 kcal (10.000 → 1.000 → 100).
2. Porque la energía disponible disminuye en cada nivel.
3. Se agotarían, porque la materia orgánica no se reciclaría.`,
  },

  /* ============================================================== FIS */
  {
    slug: 'leyes-de-newton',
    titulo: 'Leyes de Newton',
    descripcion: 'Inercia, fuerza neta y acción y reacción, con problemas resueltos de $F = ma$.',
    materia: 'FIS',
    eje: 'A',
    unidad: 'Mecánica y ondas',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 22,
    premium: false,
    puntosClave: [
      'Inercia: sin fuerza neta, la velocidad no cambia',
      '$F_{neta} = m \\cdot a$',
      'Acción y reacción actúan sobre cuerpos distintos',
    ],
    cuerpo: String.raw`## Las tres leyes

1. **Inercia:** si la fuerza neta es cero, un cuerpo mantiene su velocidad (incluido el reposo).
2. **Fuerza y aceleración:** $F_{neta} = m \cdot a$. La unidad es el newton: $1\ \text{N} = 1\ \text{kg} \cdot \text{m/s}^2$.
3. **Acción y reacción:** si A empuja a B, B empuja a A con igual fuerza y sentido contrario.

> **Ejemplo.** Una fuerza neta de 60 N sobre un carro de 20 kg produce $a = \frac{60}{20} = 3$ m/s².

## Error frecuente

Las fuerzas de acción y reacción **no se anulan**, porque actúan sobre cuerpos distintos.`,
  },
  {
    slug: 'ondas-y-sonido',
    titulo: 'Ondas y sonido',
    descripcion: 'Período, frecuencia, longitud de onda y diferencias entre ondas transversales y longitudinales.',
    materia: 'FIS',
    eje: 'B',
    unidad: 'Mecánica y ondas',
    orden: 2,
    tipo: 'pdf',
    duracionMin: 18,
    premium: false,
    puntosClave: [
      '$f = \\frac{1}{T}$',
      '$v = \\lambda \\cdot f$',
      'El sonido es una onda mecánica longitudinal',
    ],
    cuerpo: String.raw`## Magnitudes

- **Período** $T$: tiempo de una oscilación (s).
- **Frecuencia** $f = \frac{1}{T}$: oscilaciones por segundo (Hz).
- **Longitud de onda** $\lambda$: distancia entre dos crestas (m).
- **Rapidez:** $v = \lambda \cdot f$.

## Tipos de ondas

| Según | Tipo | Ejemplo |
| --- | --- | --- |
| Dirección de oscilación | Transversal | Onda en una cuerda |
| Dirección de oscilación | Longitudinal | Sonido en el aire |
| Medio | Mecánica | Sonido (necesita medio) |
| Medio | Electromagnética | Luz (viaja en el vacío) |`,
  },
  {
    slug: 'circuitos-ley-de-ohm',
    titulo: 'Práctica: circuitos y ley de Ohm',
    descripcion: 'Corriente, voltaje, resistencia y potencia en circuitos simples.',
    materia: 'FIS',
    eje: 'C',
    unidad: 'Electricidad y calor',
    orden: 1,
    tipo: 'practica',
    duracionMin: 25,
    premium: false,
    puntosClave: [
      '$V = I \\cdot R$',
      'Potencia: $P = V \\cdot I$',
      'En serie las resistencias se suman',
    ],
    cuerpo: String.raw`## Repaso

- **Ley de Ohm:** $V = I \cdot R$.
- **Potencia:** $P = V \cdot I$, en watt.
- **Serie:** $R_{eq} = R_1 + R_2$. **Paralelo:** $\frac{1}{R_{eq}} = \frac{1}{R_1} + \frac{1}{R_2}$.

## Ejercicios

1. Una resistencia de 10 Ω conectada a 5 V. ¿Qué corriente circula?
2. Dos resistencias de 4 Ω en serie conectadas a 12 V. ¿Corriente total?
3. Un hervidor funciona con 220 V y 5 A. ¿Qué potencia tiene?

## Respuestas

1. 0,5 A · 2. 1,5 A · 3. 1.100 W`,
  },
  {
    slug: 'calor-y-temperatura',
    titulo: 'Calor, temperatura y termodinámica',
    descripcion: 'Diferencia entre calor y temperatura, cambios de estado y primera ley.',
    materia: 'FIS',
    eje: 'D',
    unidad: 'Electricidad y calor',
    orden: 2,
    tipo: 'mixto',
    duracionMin: 20,
    premium: true,
    puntosClave: [
      'Temperatura: medida de la agitación de las partículas',
      'Calor: energía que se transfiere por diferencia de temperatura',
      'Primera ley: $\\Delta U = Q - W$',
    ],
    cuerpo: String.raw`## Calor y temperatura

La **temperatura** mide la energía cinética promedio de las partículas. El **calor** es energía en tránsito: fluye del cuerpo más caliente al más frío hasta el equilibrio térmico.

## Calor sensible

$$Q = m \cdot c \cdot \Delta T$$

## Primera ley

$$\Delta U = Q - W$$

Al comprimir rápido un gas (sin intercambio de calor), el trabajo hecho sobre él aumenta su energía interna y su temperatura sube.`,
  },

  /* ============================================================== QUI */
  {
    slug: 'modelo-atomico-enlaces',
    titulo: 'Modelo atómico y enlace químico',
    descripcion: 'Partículas subatómicas, número atómico y másico, y enlaces iónico, covalente y metálico.',
    materia: 'QUI',
    eje: 'A',
    unidad: 'Materia y reacciones',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 22,
    premium: false,
    puntosClave: [
      '$Z$ = protones; en un átomo neutro, protones = electrones',
      '$A = Z + N$ (protones + neutrones)',
      'Covalente: se comparten electrones; iónico: se transfieren',
    ],
    cuerpo: String.raw`## El átomo

- **Número atómico** $Z$: cantidad de protones. Define el elemento.
- **Número másico** $A$: protones más neutrones.
- En un átomo neutro, protones = electrones.

## Enlaces

| Enlace | Qué ocurre | Ejemplo |
| --- | --- | --- |
| Iónico | Transferencia de electrones (metal + no metal) | NaCl |
| Covalente | Se comparten pares de electrones (no metales) | $\mathrm{H_2O}$ |
| Metálico | Electrones compartidos en una "nube" | Cobre |`,
  },
  {
    slug: 'estequiometria-basica',
    titulo: 'Práctica: mol y balanceo',
    descripcion: 'Masa molar, conversiones de masa a moles y balanceo de ecuaciones.',
    materia: 'QUI',
    eje: 'B',
    unidad: 'Materia y reacciones',
    orden: 2,
    tipo: 'practica',
    duracionMin: 25,
    premium: false,
    puntosClave: [
      '$n = \\frac{m}{M}$',
      'Se balancea con coeficientes, nunca cambiando subíndices',
      'Masa se conserva en toda reacción',
    ],
    cuerpo: String.raw`## Repaso

$$n = \frac{m}{M}$$

Masa molar del $\mathrm{CO_2}$: $12 + 2 \cdot 16 = 44$ g/mol.

## Ejercicios

1. ¿Cuántos moles hay en 88 g de $\mathrm{CO_2}$?
2. Balancea: $\mathrm{H_2 + O_2 \rightarrow H_2O}$.
3. ¿Cuál es la masa de 3 mol de agua? (H = 1; O = 16)

## Respuestas

1. 2 mol · 2. $\mathrm{2H_2 + O_2 \rightarrow 2H_2O}$ · 3. 54 g`,
  },
  {
    slug: 'soluciones-y-ph',
    titulo: 'Soluciones, concentración y pH',
    descripcion: 'Molaridad, dilución y la escala de pH para ácidos y bases.',
    materia: 'QUI',
    eje: 'C',
    unidad: 'Soluciones y energía',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'Molaridad: $M = \\frac{n}{V}$ (litros)',
      'Dilución: $C_1V_1 = C_2V_2$',
      'pH < 7 ácido, = 7 neutro, > 7 básico',
    ],
    cuerpo: String.raw`## Concentración molar

$$M = \frac{n_{soluto}}{V_{solución}\ (\text{L})}$$

2 mol en 4 L: $M = 0{,}5$ mol/L.

## Dilución

Al agregar agua, los moles de soluto no cambian:

$$C_1 V_1 = C_2 V_2$$

## pH

$$\mathrm{pH} = -\log[\mathrm{H^+}]$$

A 25 °C, el agua pura tiene pH 7. Cada unidad de pH menos significa diez veces más $\mathrm{H^+}$.`,
  },
  {
    slug: 'termoquimica',
    titulo: 'Termoquímica: reacciones y energía',
    descripcion: 'Reacciones exotérmicas y endotérmicas, entalpía y cambios de estado.',
    materia: 'QUI',
    eje: 'D',
    unidad: 'Soluciones y energía',
    orden: 2,
    tipo: 'pdf',
    duracionMin: 18,
    premium: true,
    puntosClave: [
      'Exotérmica: libera calor, $\\Delta H < 0$',
      'Endotérmica: absorbe calor, $\\Delta H > 0$',
      'Condensar y solidificar liberan energía',
    ],
    cuerpo: String.raw`## Entalpía

$$\Delta H = H_{productos} - H_{reactivos}$$

- **Exotérmica** ($\Delta H < 0$): libera calor. Ejemplo: la combustión.
- **Endotérmica** ($\Delta H > 0$): absorbe calor. Ejemplo: la fotosíntesis.

## Cambios de estado

Fundir y evaporar **absorben** energía. Solidificar y condensar la **liberan**: por eso el vapor que se condensa en un vidrio frío lo entibia.`,
  },

  /* ============================================================== HIST */
  {
    slug: 'republica-siglo-xix',
    titulo: 'La República de Chile en el siglo XIX',
    descripcion: 'Organización del Estado, Constitución de 1833, Guerra del Pacífico y ciclo del salitre.',
    materia: 'HIST',
    eje: 'A',
    unidad: 'Chile y el mundo',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 25,
    premium: false,
    puntosClave: [
      'La Constitución de 1833 fortaleció el Ejecutivo',
      'Guerra del Pacífico (1879–1884): incorporación de Tarapacá y Antofagasta',
      'El salitre financió al Estado hasta la década de 1920',
      'La cuestión social marcó el cambio de siglo',
    ],
    cuerpo: String.raw`## Organización de la República

Tras la Independencia, la **Constitución de 1833** dio forma a un Estado centralizado con un Presidente fuerte. Rigió hasta 1925.

## Guerra del Pacífico (1879–1884)

Chile se enfrentó a Perú y Bolivia. Al terminar, incorporó las provincias de **Tarapacá** y **Antofagasta**, ricas en salitre.

## El ciclo del salitre

Los impuestos a la exportación de salitre financiaron obras públicas y la expansión del Estado. El ciclo terminó con la invención del salitre sintético y la crisis de 1929.

## La cuestión social

A fines del siglo XIX, la migración a las ciudades y a las salitreras trajo hacinamiento, enfermedades y malas condiciones laborales.`,
  },
  {
    slug: 'guerra-fria',
    titulo: 'Guerra Fría y América Latina',
    descripcion: 'Bloques, carrera armamentista y su impacto en América Latina y en Chile.',
    materia: 'HIST',
    eje: 'B',
    unidad: 'Chile y el mundo',
    orden: 2,
    tipo: 'pdf',
    duracionMin: 22,
    premium: false,
    puntosClave: [
      'Rivalidad EE. UU.–URSS entre 1947 y 1991',
      'Sin guerra directa entre las potencias',
      'Revolución cubana (1959) y su efecto regional',
    ],
    cuerpo: String.raw`## Un mundo bipolar

Tras la Segunda Guerra Mundial, Estados Unidos (capitalismo) y la Unión Soviética (comunismo) compitieron por la influencia mundial, sin enfrentarse directamente.

## Formas del conflicto

- Carrera armamentista y espacial.
- Guerras en otros territorios (Corea, Vietnam).
- Propaganda y apoyo a gobiernos aliados.

## América Latina

La **Revolución cubana** (1959) llevó a Estados Unidos a impulsar la Alianza para el Progreso y a apoyar gobiernos afines. En varios países, incluido Chile, la polarización terminó en quiebres democráticos y dictaduras.`,
  },
  {
    slug: 'democracia-y-estado-de-derecho',
    titulo: 'Democracia y Estado de derecho',
    descripcion: 'Separación de poderes, derechos humanos y mecanismos de participación ciudadana.',
    materia: 'HIST',
    eje: 'C',
    unidad: 'Ciudadanía y economía',
    orden: 1,
    tipo: 'mixto',
    duracionMin: 20,
    premium: false,
    puntosClave: [
      'Poderes Ejecutivo, Legislativo y Judicial que se controlan entre sí',
      'Derechos humanos universales e inalienables',
      'Plebiscito, elecciones e iniciativas ciudadanas',
    ],
    cuerpo: String.raw`## Estado de derecho

Todas las personas e instituciones, incluido el Estado, están sometidas a la ley.

## Separación de poderes

| Poder | Función |
| --- | --- |
| Ejecutivo | Gobierna y administra |
| Legislativo | Crea las leyes (Congreso) |
| Judicial | Resuelve conflictos aplicando la ley |

## Participación

- **Elecciones:** se elige a representantes.
- **Plebiscito:** se aprueba o rechaza una propuesta. Chile votó plebiscitos en 1988, 2020, 2022 y 2023.`,
  },
  {
    slug: 'mercado-y-economia',
    titulo: 'Práctica: mercado, inflación y Banco Central',
    descripcion: 'Oferta y demanda, inflación e instituciones económicas de Chile.',
    materia: 'HIST',
    eje: 'D',
    unidad: 'Ciudadanía y economía',
    orden: 2,
    tipo: 'practica',
    duracionMin: 20,
    premium: true,
    puntosClave: [
      'Ley de la demanda: sube el precio, baja la cantidad demandada',
      'Inflación: alza sostenida y generalizada de precios (IPC)',
      'El Banco Central vela por la estabilidad de la moneda',
    ],
    cuerpo: String.raw`## Repaso

- **Demanda:** si sube el precio, baja la cantidad demandada.
- **Oferta:** si sube el precio, aumenta la cantidad ofrecida.
- **Inflación:** se mide con el IPC que calcula el INE.
- **Banco Central:** autónomo; usa la tasa de política monetaria para controlar la inflación.

## Ejercicios

1. Una helada destruye parte de la cosecha de paltas. ¿Qué ocurre con el precio?
2. ¿Por qué una inflación alta afecta más a quienes tienen ingresos fijos?
3. Si el Banco Central sube la tasa de interés, ¿qué busca?

## Respuestas

1. Sube, porque disminuye la oferta. · 2. Porque su ingreso compra menos bienes. · 3. Encarecer el crédito para frenar el consumo y la inflación.`,
  },
];
