import type { PreguntaSeed } from './tipos';
import { TEXTOS } from './textos';

export const PREGUNTAS_CL: PreguntaSeed[] = [
  {
    clave: 'CL-B-1',
    materia: 'CL',
    eje: 'B',
    tipo: 'comprension_lectora',
    textoBase: TEXTOS.ARGUMENTATIVO,
    enunciado: 'Cual es la tesis que defiende el texto?',
    explicacion:
      'La tesis aparece al final: la seguridad vial se defiende aplicando estadistica, no emocionalidad.',
    dificultad: 2,
    alternativas: [
      { texto: 'La seguridad vial es una cuestion emocional', esCorrecta: false },
      { texto: 'La seguridad vial se fundamenta en el calculo de riesgos', esCorrecta: true },
      { texto: 'Los dispositivos de retencion son innecesarios', esCorrecta: false },
      { texto: 'El costo de la seguridad es siempre desproporcionado', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-B-2',
    materia: 'CL',
    eje: 'B',
    tipo: 'comprension_lectora',
    textoBase: TEXTOS.ARGUMENTATIVO,
    enunciado: 'Que respuesta ofrecen los detractores segun el texto?',
    explicacion:
      'Los detractores sostienen que el costo de las medidas es desproporcionado.',
    dificultad: 2,
    alternativas: [
      { texto: 'Que el costo es desproporcionado', esCorrecta: true },
      { texto: 'Que las medidas son obligatorias por ley', esCorrecta: false },
      { texto: 'Que el riesgo de lesion es muy bajo', esCorrecta: false },
      { texto: 'Que solo los gobiernos deben decidir', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-B-3',
    materia: 'CL',
    eje: 'B',
    tipo: 'comprension_lectora',
    textoBase: TEXTOS.EXPOSITIVO,
    enunciado: 'Que tipo de texto es el segundo fragmento?',
    explicacion:
      'Expone datos objetivos sobre el cerebro sin adoptar postura, por lo tanto es expositivo.',
    dificultad: 1,
    alternativas: [
      { texto: 'Argumentativo', esCorrecta: false },
      { texto: 'Expositivo', esCorrecta: true },
      { texto: 'Narrativo', esCorrecta: false },
      { texto: 'Descriptivo', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-B-4',
    materia: 'CL',
    eje: 'B',
    tipo: 'comprension_lectora',
    textoBase: TEXTOS.EXPOSITIVO,
    enunciado: 'Que relacion establece el texto entre sueno y aprendizaje?',
    explicacion:
      'El texto afirma que dormir consolida la memoria, por eso estudiar de noche cansa mas.',
    dificultad: 3,
    alternativas: [
      { texto: 'El sueno es un descanso pasivo', esCorrecta: false },
      { texto: 'El sueno consolida lo aprendido', esCorrecta: true },
      { texto: 'El aprendizaje ocurre solo de dia', esCorrecta: false },
      { texto: 'El sueno reduce el consumo de energia', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-C-1',
    materia: 'CL',
    eje: 'C',
    tipo: 'comprension_lectora',
    textoBase: TEXTOS.LITERARIO,
    enunciado: 'Que licencia poetica predomina en el fragmento?',
    explicacion:
      'La construccion sin verbo, la casa que guarda la memoria, funciona como metafora del recuerdo.',
    dificultad: 3,
    alternativas: [
      { texto: 'Metafora', esCorrecta: true },
      { texto: 'Hipérbole', esCorrecta: false },
      { texto: 'Ironía', esCorrecta: false },
      { texto: 'Eufemismo', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-C-2',
    materia: 'CL',
    eje: 'C',
    tipo: 'comprension_lectora',
    textoBase: TEXTOS.LITERARIO,
    enunciado: 'Que atmosfera domina la escena narrada?',
    explicacion:
      'La casa misteriosa, las puertas que se abren desde adentro y el olor a pan crean un clima de expectativa.',
    dificultad: 2,
    alternativas: [
      { texto: 'Misterio y expectativa', esCorrecta: true },
      { texto: 'Alegria y celebracion', esCorrecta: false },
      { texto: 'Terror y violencia', esCorrecta: false },
      { texto: 'Tristeza y derrota', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-D-1',
    materia: 'CL',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Cual es el sujeto de la oracion "Los ninos del barrio inventaron una explicacion"?',
    explicacion:
      'El sujeto es "Los ninos del barrio"; el nucleo es "ninos" y "del barrio" es complemento del nombre.',
    dificultad: 2,
    alternativas: [
      { texto: 'Los ninos del barrio', esCorrecta: true },
      { texto: 'inventaron', esCorrecta: false },
      { texto: 'una explicacion', esCorrecta: false },
      { texto: 'del barrio', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-D-2',
    materia: 'CL',
    eje: 'D',
    tipo: 'multiple',
    enunciado:
      'Cual oracion contiene una oracion subordinada sustantiva?',
    explicacion:
      '"El olor a pan recien hecho" funciona como sustantivo y es el objeto directo de "encontro".',
    dificultad: 3,
    alternativas: [
      { texto: 'Cuando Martin entro, no encontro respuestas', esCorrecta: false },
      { texto: 'Nadie sabia quien habia construido aquel edificio', esCorrecta: false },
      { texto: 'No encontro respuestas, sino el olor a pan recien hecho', esCorrecta: true },
      { texto: 'Los ninos inventaron una explicacion mejor', esCorrecta: false },
    ],
  },
  {
    clave: 'CL-A-1',
    materia: 'CL',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Cual es el proposito comunicativo de un texto argumentativo?',
    explicacion:
      'El texto argumentativo busca convencer al receptor sosteniendo una tesis con argumentos.',
    dificultad: 1,
    alternativas: [
      { texto: 'Convencer sosteniendo una tesis', esCorrecta: true },
      { texto: 'Informar hechos sin postura', esCorrecta: false },
      { texto: 'Relatar hechos en orden cronologico', esCorrecta: false },
      { texto: 'Describir un lugar de forma objetiva', esCorrecta: false },
    ],
  },
];
