import type { PreguntaSeed } from './tipos';

export const PREGUNTAS_HIST: PreguntaSeed[] = [
  {
    clave: 'HIST-A-1',
    materia: 'HIST',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Que civilizacion descontro el cero y dio origen a los numerales atuais?',
    explicacion:
      'Los babilonios usaron un sistema de base 60 que persiste en el reloj y los angulos.',
    dificultad: 1,
    alternativas: [
      { texto: 'Los egipcios', esCorrecta: false },
      { texto: 'Los babilonios', esCorrecta: true },
      { texto: 'Los griegos', esCorrecta: false },
      { texto: 'Los romanos', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-A-2',
    materia: 'HIST',
    eje: 'A',
    tipo: 'multiple',
    enunciado: 'Que forma de gobierno se.instauro en Roma tras la expulsion de los reyes?',
    explicacion:
      'La monarquia fue reemplazada por la Republica, gobernada por el Senado y los magistrados.',
    dificultad: 2,
    alternativas: [
      { texto: 'Monarquia', esCorrecta: false },
      { texto: 'Republica', esCorrecta: true },
      { texto: 'Imperio absoluto', esCorrecta: false },
      { texto: 'Teocracia', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-B-1',
    materia: 'HIST',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Que fue la feudalidad en la Edad Media europea?',
    explicacion:
      'Fue un sistema de relacion entre nobles y vasallos basado en el control de la tierra y el servicio.',
    dificultad: 2,
    alternativas: [
      { texto: 'Un sistema economico mercantil', esCorrecta: false },
      { texto: 'Un sistema de vasallaje basado en la tierra', esCorrecta: true },
      { texto: 'Una union democratic moderna', esCorrecta: false },
      { texto: 'Un imperio unificado de Europa', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-B-2',
    materia: 'HIST',
    eje: 'B',
    tipo: 'multiple',
    enunciado: 'Cual fue el principal motivo de las Cruzadas?',
    explicacion:
      'El motivo central fue recuperar Jerusalem, aunque tambien influyeron causas economicas y politicas.',
    dificultad: 3,
    alternativas: [
      { texto: 'Conquistar la peninsula Iberica', esCorrecta: false },
      { texto: 'Recuperar Jerusalem', esCorrecta: true },
      { texto: 'Terminar la peste negra en Europa', esCorrecta: false },
      { texto: 'Defender las rutas de la seda', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-C-1',
    materia: 'HIST',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'Cual fue el cambio central del Renacimiento en Europa?',
    explicacion:
      'Se recupero el saber clasico y se sustituyo la vision medieval por una centrada en la razon humana.',
    dificultad: 2,
    alternativas: [
      { texto: 'La restauracion del feudalismo', esCorrecta: false },
      { texto: 'El regreso al saber clasico', esCorrecta: true },
      { texto: 'La adopcion de la escritura', esCorrecta: false },
      { texto: 'La invencion de la imprenta electronica', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-C-2',
    materia: 'HIST',
    eje: 'C',
    tipo: 'multiple',
    enunciado: 'Que principio inspiro la Ilustracion?',
    explicacion: 'La Ilustracion defendio el uso de la razon y la critica a la autoridad sin fundamento.',
    dificultad: 2,
    alternativas: [
      { texto: 'La autoridad de la Iglesia', esCorrecta: false },
      { texto: 'La razon y la critica a la autoridad', esCorrecta: true },
      { texto: 'El retorno a los privilegios nobiliarios', esCorrecta: false },
      { texto: 'La intervencion militar del Estado', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-D-1',
    materia: 'HIST',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'En que años ocurrieron las dos guerras mundiales?',
    explicacion:
      'La Primera Guerra Mundial (1914-1918) y la Segunda (1939-1945) definieron el siglo XX.',
    dificultad: 1,
    alternativas: [
      { texto: '1900-1904 y 1914-1918', esCorrecta: false },
      { texto: '1914-1918 y 1939-1945', esCorrecta: true },
      { texto: '1929-1933 y 1936-1939', esCorrecta: false },
      { texto: '1939-1945 y 1950-1953', esCorrecta: false },
    ],
  },
  {
    clave: 'HIST-D-2',
    materia: 'HIST',
    eje: 'D',
    tipo: 'multiple',
    enunciado: 'Cual fue un resultado de la Guerra Fria en America Latina?',
    explicacion:
      'Se instalaron dictaduras militares en varios paises, con intervencion de las grandes potencias.',
    dificultad: 3,
    alternativas: [
      { texto: 'La unificacion de America Latina', esCorrecta: false },
      { texto: 'Dictaduras militares con apoyo de las grandes potencias', esCorrecta: true },
      { texto: 'La eliminacion de las fronteras heredadas', esCorrecta: false },
      { texto: 'El fin inmediato de la desigualdad regional', esCorrecta: false },
    ],
  },
];
