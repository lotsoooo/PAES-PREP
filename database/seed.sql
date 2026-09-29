-- ============================================================================
-- PAES Pro — CATÁLOGOS Y DATOS DEMO (idempotente)
-- ----------------------------------------------------------------------------
-- Solo catálogos y contenido editorial. Los usuarios demo, el banco de
-- preguntas y los intentos históricos los genera apps/api/src/db/seed.ts.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- MATERIAS (áreas de la biblioteca de ensayos)
-- ---------------------------------------------------------------------------
insert into public.materias (codigo, nombre, area, peso) values
  ('M1',      'Matemáticas 1',              'matematicas', 1.00),
  ('M2',      'Matemáticas 2',              'matematicas', 1.00),
  ('CL',      'Lenguaje y Comunicación',     'lenguaje',    1.00),
  ('BIO',     'Biología',                    'ciencias',    1.00),
  ('FIS',     'Física',                      'ciencias',    1.00),
  ('QUI',     'Química',                     'ciencias',    1.00),
  ('HIST',    'Historia y Ciencias Sociales','historia',    1.00)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
-- EJES TEMÁTICOS — 4 por prueba (la base de v_precision_por_eje)
-- ---------------------------------------------------------------------------
insert into public.ejes (materia_id, codigo, nombre, descripcion)
select m.id, v.codigo, v.nombre, v.descripcion
from (values
  ('M1',   'A', 'Números',                 'Reales, potencias, raíces y notación científica'),
  ('M1',   'B', 'Álgebra',                 'Ecuaciones, inecuaciones, funciones y polinomios'),
  ('M1',   'C', 'Geometría',               'Plano, área y perímetro; transformaciones isométricas'),
  ('M1',   'D', 'Probabilidades',           'Combinatoria, probabilidad condicional y muestreo'),
  ('M2',   'A', 'Álgebra',                 'Funciones,ECUaciones exponenciales y logaritmos'),
  ('M2',   'B', 'Geometría',               'Analítica, vectores y números complejos'),
  ('M2',   'C', 'Probabilidades',           'Variables aleatorias y distribuciones'),
  ('M2',   'D', 'Cálculo',                 'Límites, derivadas e integrales'),
  ('CL',   'A', 'Lenguaje oral',           'Comprensión y producción oral'),
  ('CL',   'B', 'Lenguaje escrito',        'Textos argumentativos y expositivos'),
  ('CL',   'C', 'Literatura',              'Obra literals y movimientos'),
  ('CL',   'D', 'Gramática y sintaxis',    'Oración,oposición y conectores'),
  ('BIO',  'A', 'Célula',                  'Estructura, ciclo celular y genética'),
  ('BIO',  'B', 'Genética',                'Herencia mendeliana yADN'),
  ('BIO',  'C', 'Evolución',               'Selección natural y evidencia de evolución'),
  ('BIO',  'D', 'Ecología',                'Ecosistemas y flujo de energía'),
  ('FIS',  'A', 'Mecánica',                'Fuerzas, movimiento y energía'),
  ('FIS',  'B', 'Ondas',                   'Ondas mecánicas y acústicas'),
  ('FIS',  'C', 'Electricidad y magnetismo','Circuitos y campos'),
  ('FIS',  'D', 'Termodinámica',           'Calor y temperatura'),
  ('QUI',  'A', 'Estructura atómica',      'Modelos atómicos y enlace'),
  ('QUI',  'B', 'Reacciones químicas',     'Balanceo y estequiometría'),
  ('QUI',  'C', 'Soluciones',              'Concentraciones y pH'),
  ('QUI',  'D', 'Termoquímica',            'Reacciones exotérmicas y endotérmicas'),
  ('HIST', 'A', 'Antigüedad',              'Antigua Mesopotamia, Egipto, Grecia y Roma'),
  ('HIST', 'B', 'Edad Media',              'Feudalismo y cruzadas'),
  ('HIST', 'C', 'Edad Moderna',            'Renacimiento y Revoluciones'),
  ('HIST', 'D', 'Historia Contemporánea',  'Siglo XX y América Latina')
) as v(materia_codigo, codigo, nombre, descripcion)
join public.materias m on m.codigo = v.materia_codigo
on conflict (materia_id, codigo) do nothing;

-- ---------------------------------------------------------------------------
-- CONVERSIÓN DE PUNTAJE PAES 2026 (% de logro -> puntaje)
-- Tramos alineados a la escala oficial de 100 a 1000.
-- ---------------------------------------------------------------------------
insert into public.conversion_puntaje
  (prueba, version, pct_logro_min, pct_logro_max, puntaje_min, puntaje_max)
values
  ('M1',      '2026',  0,  50, 100, 400),
  ('M1',      '2026', 50,  70, 400, 600),
  ('M1',      '2026', 70,  85, 600, 800),
  ('M1',      '2026', 85, 100, 800, 1000),
  ('M2',      '2026',  0,  50, 100, 400),
  ('M2',      '2026', 50,  70, 400, 600),
  ('M2',      '2026', 70,  85, 600, 800),
  ('M2',      '2026', 85, 100, 800, 1000),
  ('CL',      '2026',  0,  50, 100, 400),
  ('CL',      '2026', 50,  70, 400, 600),
  ('CL',      '2026', 70,  85, 600, 800),
  ('CL',      '2026', 85, 100, 800, 1000),
  ('CIENCIAS','2026',  0,  50, 100, 400),
  ('CIENCIAS','2026', 50,  70, 400, 600),
  ('CIENCIAS','2026', 70,  85, 600, 800),
  ('CIENCIAS','2026', 85, 100, 800, 1000),
  ('HISTORIA','2026',  0,  50, 100, 400),
  ('HISTORIA','2026', 50,  70, 400, 600),
  ('HISTORIA','2026', 70,  85, 600, 800),
  ('HISTORIA','2026', 85, 100, 800, 1000)
on conflict (prueba, version, pct_logro_min) do nothing;

-- ---------------------------------------------------------------------------
-- PLANES DE SUSCRIPCIÓN
-- ---------------------------------------------------------------------------
insert into public.planes_suscripcion
  (codigo, nombre, descripcion, precio_clp, ensayos_mes, analytics_avanzados, video_premium, destacado, activo)
values
  ('basico',   'Básico',   'Acceso esencial para empezar a preparar la PAES.',        0,     1, false, false, false, true),
  ('premium',  'Premium',  'Ensayos ilimitados, videos y analítica avanzada.',          14990, 99, true,  true,  true,  true),
  ('anual',    'Anual',    'Todo Premium con dos meses de cortesía.',                   139990, 99, true, true,  false, true)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
-- COLEGIOS — dominate_email se usa en el login con colegio
-- ---------------------------------------------------------------------------
insert into public.colegios (nombre, comuna, region, dominio_email)
values
  ('Liceo Bicentenario',        'Viña del Mar', 'Valparaíso', 'liceobicentenario.cl'),
  ('Liceo Bicentenario',        'Santiago',     'Metropolitana', 'liceosantiago.cl'),
  ('Colegio San Ignacio',       'Santiago',     'Metropolitana', 'sanignacio.cl'),
  ('Instituto Andrés Bello',   'Rancagua',     'O’Higgins', 'iab.cl'),
  ('Colegio Tabancura',         'Santiago',     'Metropolitana', 'tabancura.cl'),
  ('Liceo El Salvador',         'Concepción',   'Biobío', 'elsalvador.cl'),
  ('Escuela Domingo Atienza',   'Puerto Montt', 'Los Lagos', 'domingoatienza.cl'),
  ('Colegio Saint George',      'Viña del Mar', 'Valparaíso', 'saintgeorge.cl')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- CARRERAS — buscador del onboarding (con puntaje de referencia)
-- ---------------------------------------------------------------------------
insert into public.carreras (nombre, area, duracion_anios, puntaje_referencia, popular) values
  ('Medicina',                'Salud',     7, 750, true),
  ('Derecho',                 'Humanidades', 6, 620, true),
  ('Ingeniería Comercial',    'Economía',  4, 640, true),
  ('Ingeniería en Computación','Tecnología',6, 700, true),
  ('Contabilidad',            'Economía',  5, 600, true),
  ('Psicología',              'Humanidades',5, 600, true),
  ('Enfermería',              'Salud',     4, 620, true),
  ('Arquitectura',            'Diseño',    7, 640, true),
  ('Veterinaria',             'Salud',     7, 660, true),
  ('Trabajo Social',          'Humanidades',4, 550, true),
  ('Diseño Gráfico',          'Diseño',    4, 550, false),
  ('Nutrición y Dietética',   'Salud',     5, 600, false)
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------------
-- UNIVERSIDADES
-- ---------------------------------------------------------------------------
insert into public.universidades (nombre, tipo, region, puntaje_corte) values
  ('Universidad de Chile',        'estado',      'Metropolitana', 760),
  ('Pontificia Universidad Católica de Chile', 'privada', 'Metropolitana', 720),
  ('Universidad de Santiago de Chile', 'estado',  'Metropolitana', 690),
  ('Universidad Técnica Federico Santa María', 'privada', 'Valparaíso', 700),
  ('Universidad de Concepción',   'estado',      'Biobío', 640),
  ('Universidad de los Andes',    'privada',     'Metropolitana', 680),
  ('Universidad Diego Portales',  'privada',     'Metropolitana', 620),
  ('Universidad del Desarrollo',  'privada',     'Metropolitana', 600)
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------------
-- CONTENIDOS — biblioteca editorial
-- ---------------------------------------------------------------------------
insert into public.contenidos
  (slug, titulo, descripcion, materia_id, eje_id, tipo, duracion_min, video_url, cuerpo_md, puntos_clave, premium, orden)
select
  v.slug, v.titulo, v.descripcion, m.id, e.id, v.tipo::tipo_material, v.duracion_min, v.video_url,
  v.cuerpo_md, v.puntos_clave, v.premium, v.orden
from (values
  ('factorizacion-por-agrupacion', 'Factorización por agrupación',
   'El método más rápido para factorizar polinomios de grado medio y superior.',
   'M1', 'B', 'video', 18, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Factorización por agrupación\n\nCuando un polinomio tiene **cuatro términos**, buscar un factor común entre los dos primeros y los dos últimos suele resolverlo en un solo paso.\n\n$$\\frac{x^2 - 9}{x+3} = \\frac{(x-3)(x+3)}{x+3} = x-3$$\n\n### Procedimiento\n\n1. Identifica los dos primeros términos y saca su factor común.\n2. Haz lo mismo con los dos últimos.\n3. Si el segundo grupo tiene signo negativo, usa $-1$ para convertirlo en producto.\n\n> **Regla práctica:** si al final queda un factor $-1$ adelante, es correcto; solo cambia el signo de todo el grupo.',
   array['Sacar factor común por grupos de dos términos','Usar $-1$ para unificar signos','Verificar multiplicando'], false, 1),

  ('logaritmos-propiedades', 'Logaritmos y sus propiedades',
   'Cambio de base, producto, cociente y potencia: las cuatro propiedades que necesitas.',
   'M2', 'A', 'video', 22, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Propiedades de los logaritmos\n\nUn logaritmo es el **exponente** al que hay que elevar la base para obtener el argumento:\n\n$$\\log_b(x) = y \\iff b^y = x$$\n\n### Cambio de base\n\n$$\\log_a b = \\frac{\\log_c b}{\\log_c a}$$\n\nEjemplo: $\\log_2 10 = \\frac{\\ln 10}{\\ln 2} \\approx 3{,}3219$',
   array['Definición como exponente','Cambio de base','Producto y cociente'], false, 2),

  ('funciones-lineales', 'Funciones lineales y afines',
   'Pendiente, intercepto y gráficos de funciones de primer grado.',
   'M1', 'B', 'video', 15, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Función afín\n\n$$f(x) = mx + b$$\n\n- $m$ es la **pendiente**: cuánto sube $f$ por cada unidad que aumenta $x$.\n- $b$ es el **intercepto** con el eje $y$.\n\nSi $m > 0$ la función es creciente; si $m < 0$, decreciente.',
   array['Pendiente $m$ e intercepto $b$','Signo de la pendiente','Crecimiento y decrecimiento'], false, 3),

  ('probabilidad-condicional', 'Probabilidad condicional',
   'Árboles de probabilidad, eventos independientes y el teorema de Bayes.',
   'M1', 'D', 'video', 25, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Probabilidad condicional\n\n$$P(A\\mid B) = \\frac{P(A \\cap B)}{P(B)}$$\n\nSi $A$ y $B$ son **independientes**, entonces $P(A\\mid B) = P(A)$.',
   array['Fórmula condicional','Eventos independientes','Bayes'], false, 4),

  ('teoria-exponenciales', 'Ecuaciones exponenciales y crecimiento',
   'Resuelve $e^{x}=k$ y modela crecimiento poblacional y Nurse.',
   'M2', 'D', 'video', 20, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Ecuaciones exponenciales\n\nPara despejar, aplica logaritmo a ambos lados:\n\n$$e^{x} = k \\Rightarrow x = \\ln k$$',
   array['Aplicar logaritmo','Interpretar el crecimiento','Tiempo de duplicación'], true, 5),

  ('analisis-vectores', 'Vectores en el plano y el espacio',
   'Suma, resta, producto punto y ángulo entre vectores.',
   'M2', 'B', 'pdf', 30, null,
   E'## Producto punto\n\n$$\\vec{a} \\cdot \\vec{b} = a_x b_x + a_y b_y$$\n\nEl coseno del ángulo entre dos vectores es:\n\n$$\\cos\\theta = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$$',
   array['Componentes','Producto punto','Ángulo entre vectores'], false, 6),

  ('comprension-lectora-1', 'Comprensión lectora: texto argumentativo',
   'Identificar tesis, argumentos y contraargumentos en un texto.',
   'CL', 'B', 'video', 24, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Textos argumentativos\n\nUn texto argumentativo presenta una **tesis** sostenida por argumentos y refutada por contraargumentos.',
   array['Tesis','Argumentos','Contraargumentos'], false, 7),

  ('genetica-mendeliana', 'Genética mendeliana',
   'Cruces monohíbridos, dihíbridos y leyes de segregación.',
   'BIO', 'B', 'video', 26, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   E'## Ley de segregación\n\nLos dos alelos de un gen se separan durante la formación de los gametos.',
   array['Genotipo y fenotipo','Monohíbrido y dihíbrido','Cuadro de Punnett'], false, 8)
) as v(slug, titulo, descripcion, materia_codigo, eje_codigo, tipo, duracion_min, video_url, cuerpo_md, puntos_clave, premium, orden)
join public.materias m on m.codigo = v.materia_codigo
join public.ejes    e on e.materia_id = m.id and e.codigo = v.eje_codigo
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- ENSAYOS — biblioteca (el banco de preguntas lo crea seed.ts)
-- ---------------------------------------------------------------------------
insert into public.ensayos
  (slug, titulo, descripcion, materia_id, prueba, nivel, duracion_min, premium, es_diagnostico)
select
  v.slug, v.titulo, v.descripcion, m.id, v.prueba, v.nivel::text, v.duracion_min, v.premium, v.es_diagnostico
from (values
  ('ensayo-diagnostico-m1', 'Ensayo de diagnóstico M1',
   'Evalúa tu punto de partida en las cuatro habilidades de Matemáticas 1.',
   'M1', 'M1', 'medio', 90, false, true),
  ('ensayo-m1-algebra', 'Ensayo M1 — Álgebra y Funciones',
   'Ecuaciones, inecuaciones, funciones y polinomios.',
   'M1', 'M1', 'basico', 60, false, false),
  ('ensayo-m1-probabilidad', 'Ensayo M1 — Probabilidades',
   'Combinatoria, probabilidad condicional y muestreo.',
   'M1', 'M1', 'avanzado', 60, true, false),
  ('ensayo-m1-Completo', 'Ensayo M1 — Prueba completa',
   'Los cuatro ejes de M1 con dificultad mixta.',
   'M1', 'M1', 'avanzado', 120, true, false),
  ('ensayo-m2-completo', 'Ensayo M2 — Prueba completa',
   'Álgebra, geometría, probabilidad y cálculo.',
   'M2', 'M2', 'avanzado', 120, true, false),
  ('ensayo-cl-comprension', 'Ensayo CL — Comprensión lectora',
   'Textos argumentativos y literarios con preguntas de cierre.',
   'CL', 'CL', 'medio', 60, false, false),
  ('ensayo-ciencias-completo', 'Ensayo Ciencias — Biología y Física',
   'Los ejes más demandados de la prueba de Ciencias.',
   'BIO', 'CIENCIAS', 'avanzado', 120, true, false),
  ('ensayo-historia-completo', 'Ensayo Historia — Prueba completa',
   'De la Antigüedad a la Contemporánea.',
   'HIST', 'HISTORIA', 'medio', 90, false, false)
) as v(slug, titulo, descripcion, materia_codigo, prueba, nivel, duracion_min, premium, es_diagnostico)
join public.materias m on m.codigo = v.materia_codigo
on conflict (slug) do nothing;

-- Ensayo <-> ejes
insert into public.ensayo_ejes (ensayo_id, eje_id, peso)
select en.id, e.id, 25
from public.ensayos en
join public.materias m on m.id = en.materia_id
join public.ejes    e on e.materia_id = m.id
on conflict (ensayo_id, eje_id) do nothing;

-- ---------------------------------------------------------------------------
-- COMUNIDAD — publicaciones del diseño
-- ---------------------------------------------------------------------------
insert into public.publicaciones (usuario_id, materia_id, tipo, titulo, cuerpo)
select u.id, m.id, 'tip', 'Tip rápido: Factorización por agrupación',
  E'Cuando un polinomio tiene cuatro términos, agrupa los dos primeros y los dos últimos, saca el factor común de cada grupo y, si el segundo queda negativo, extrae un $-1$.\n\nEjemplo: $x^3 - 4x^2 - x + 4 = x^2(x-4) - 1(x-4) = (x^2-1)(x-4) = (x-1)(x+1)(x-4)$.\n\nEs mucho más rápido que la división sintética cuando funciona. #M1 #algebra'
from public.usuarios u, public.materias m
where u.email = 'carlos.mendoza@demo.cl' and m.codigo = 'M1'
  and not exists (
    select 1 from public.publicaciones p where p.titulo = 'Tip rápido: Factorización por agrupación'
  );

insert into public.publicaciones (usuario_id, materia_id, tipo, titulo, cuerpo)
select u.id, m.id, 'duda', '¿Diferencia entre permutación y combinación?',
  E'En el ejercicio 4 me piden "de cuántas formas puedo elegir 3 preguntas de 10" y marqué $\\binom{10}{3}$, pero el enunciado dice "ordenar". ¿Cuándo me corresponde una permutación y cuándo una combinación?'
from public.usuarios u, public.materias m
where u.email = 'martina@demo.cl' and m.codigo = 'M1'
  and not exists (
    select 1 from public.publicaciones p where p.titulo = '¿Diferencia entre permutación y combinación?'
  );

insert into public.publicaciones (usuario_id, materia_id, tipo, titulo, cuerpo)
select u.id, m.id, 'duda', 'Logaritmos: no entiendo el cambio de base',
  E'Nunca me sale bien el cambio de base. Si tengo $\\log_2 10$, ¿por qué puedo escribir $\\frac{\\log 10}{\\log 2}$? ¿Qué está pasando con las bases?'
from public.usuarios u, public.materias m
where u.email = 'martina@demo.cl' and m.codigo = 'M2'
  and not exists (
    select 1 from public.publicaciones p where p.titulo = 'Logaritmos: no entiendo el cambio de base'
  );
