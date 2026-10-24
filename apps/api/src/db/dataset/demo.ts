import { createHash } from 'node:crypto';

/**
 * UUID v5 determinista (SHA-1) para que `db:seed` sea idempotente.
 * Los ids se derivan de una clave lógica y un namespace fijo del proyecto,
 * por lo que volver a ejecutar el seed actualiza en vez de duplicar.
 */
const NAMESPACE_PAES_PRO = '8f1b2c34-5d6e-4f70-8a91-b2c3d4e5f607';

/** Deriva un UUID estable a partir de una clave lógica. */
export function uuidEstable(clave: string): string {
  const hex = createHash('sha1')
    .update(`${NAMESPACE_PAES_PRO}:${clave}`)
    .digest('hex')
    .slice(0, 32);

  // Forzamos versión 5 (dígito 13) y variante RFC 4122 (dígito 17 = 8..b).
  const conVersion = hex.slice(0, 12) + '5' + hex.slice(13);
  const variante = ((parseInt(conVersion[16]!, 16) & 0x3) | 0x8).toString(16);
  const v5 = conVersion.slice(0, 16) + variante + conVersion.slice(17);

  return [
    v5.slice(0, 8),
    v5.slice(8, 12),
    v5.slice(12, 16),
    v5.slice(16, 20),
    v5.slice(20, 32),
  ].join('-');
}

export const PASSWORD_DEMO = 'Demo1234!';

export type RolDemo = 'estudiante' | 'profesor' | 'admin';

export interface UsuarioDemo {
  clave: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolDemo;
  /** Carrera objetivo, debe existir en `carreras.nombre`. */
  carrera: string | null;
  colegioDominio: string | null;
  curso: string | null;
  horasSemana: number;
  diasDisponibles: number[];
  puntajeMeta: number | null;
  fechaExamenDiasAdelante: number | null;
  onboardingCompletado: boolean;
  tema: 'claro' | 'oscuro' | 'sistema';
}

/** Cuentas demo. El password de todas es `PASSWORD_DEMO`. */
export const USUARIOS_DEMO: UsuarioDemo[] = [
  {
    clave: 'usuario:valentina',
    email: 'valentina.perez@demo.cl',
    nombre: 'Valentina',
    apellido: 'Perez',
    rol: 'estudiante',
    carrera: 'Medicina',
    colegioDominio: null,
    curso: '4 Medio B',
    horasSemana: 18,
    diasDisponibles: [1, 2, 3, 4, 5, 6],
    puntajeMeta: 780,
    fechaExamenDiasAdelante: 120,
    onboardingCompletado: true,
    tema: 'oscuro',
  },
  {
    clave: 'usuario:martina',
    email: 'martina@demo.cl',
    nombre: 'Martina',
    apellido: 'Sanchez',
    rol: 'estudiante',
    carrera: 'Ingenieria en Computacion',
    colegioDominio: null,
    curso: '4 Medio A',
    horasSemana: 12,
    diasDisponibles: [1, 3, 5],
    puntajeMeta: 700,
    fechaExamenDiasAdelante: 200,
    onboardingCompletado: true,
    tema: 'sistema',
  },
  {
    clave: 'usuario:carlos',
    email: 'carlos.mendoza@demo.cl',
    nombre: 'Carlos',
    apellido: 'Mendoza',
    rol: 'estudiante',
    carrera: 'Derecho',
    colegioDominio: null,
    curso: '4 Medio C',
    horasSemana: 8,
    diasDisponibles: [2, 4, 6],
    puntajeMeta: 620,
    fechaExamenDiasAdelante: 75,
    onboardingCompletado: false,
    tema: 'claro',
  },
  {
    clave: 'usuario:jorge',
    email: 'jorge.alvarez@paespro.cl',
    nombre: 'Jorge',
    apellido: 'Alvarez',
    rol: 'profesor',
    carrera: null,
    colegioDominio: null,
    curso: null,
    horasSemana: 10,
    diasDisponibles: [1, 2, 3, 4, 5],
    puntajeMeta: null,
    fechaExamenDiasAdelante: null,
    onboardingCompletado: true,
    tema: 'claro',
  },
  {
    clave: 'usuario:admin',
    email: 'admin@paespro.cl',
    nombre: 'Equipo',
    apellido: 'PAES Pro',
    rol: 'admin',
    carrera: null,
    colegioDominio: null,
    curso: null,
    horasSemana: 10,
    diasDisponibles: [1, 2, 3, 4, 5],
    puntajeMeta: null,
    fechaExamenDiasAdelante: null,
    onboardingCompletado: true,
    tema: 'sistema',
  },
];

/** Perfiles públicos visibles en la comunidad. */
export const PERFILES_PUBLICOS: {
  usuario: string;
  titulo: string;
  especialidad: string;
  bio: string;
  verificado: boolean;
  rating: number;
  ratingCantidad: number;
  seguidores: number;
}[] = [
  {
    usuario: 'usuario:jorge',
    titulo: 'Profesor de Matematicas 1 y 2',
    especialidad: 'Algebra, calculo y probabilidades',
    bio: 'Docente hace 12 anos. Preparo estudiantes de 4 Medio para la prueba de Matematicas de la PAES.',
    verificado: true,
    rating: 4.8,
    ratingCantidad: 126,
    seguidores: 1840,
  },
  {
    usuario: 'usuario:valentina',
    titulo: 'Estudiante de Medicina',
    especialidad: 'Biologia y Quimica',
    bio: 'Estudio Medicina en la UV. Comparto mis apuntes y cronogramas de estudio.',
    verificado: false,
    rating: 4.5,
    ratingCantidad: 18,
    seguidores: 96,
  },
  {
    usuario: 'usuario:martina',
    titulo: 'Estudiante de Computacion',
    especialidad: 'Lenguaje y Matematicas 2',
    bio: 'Me preparo para la prueba usando metodos de estudio activos.',
    verificado: false,
    rating: 4.2,
    ratingCantidad: 7,
    seguidores: 41,
  },
];

export interface PublicacionDemo {
  clave: string;
  autor: string;
  tipo: 'duda' | 'tip' | 'material' | 'debate';
  titulo: string;
  cuerpo: string;
  materia: string | null;
  votos: number;
  voters: string[];
  resuelta: boolean;
  haceDias: number;
}

export const PUBLICACIONES_DEMO: PublicacionDemo[] = [
  {
    clave: 'pub:probabilidad-condicional',
    autor: 'usuario:carlos',
    tipo: 'duda',
    titulo: 'Como se lee un arbol de probabilidad condicional',
    cuerpo:
      'Entiendo la formula P(A|B) = P(A y B) / P(B), pero no logro identificar el evento condicionante en un ejercicio con dos dados. Alguien me podria ayudar con un ejemplo paso a paso?',
    materia: 'M1',
    votos: 12,
    voters: ['usuario:valentina', 'usuario:martina', 'usuario:jorge'],
    resuelta: true,
    haceDias: 3,
  },
  {
    clave: 'pub:metodo-estudio',
    autor: 'usuario:valentina',
    tipo: 'tip',
    titulo: 'Mi metodo para no perder la racha en maths',
    cuerpo:
      'Estudio 25 minutos por la manana y cierro con 15 minutos de repaso activo de lo que falle. Con eso llevo 23 dias seguidos. No es magic, es rutina.',
    materia: 'M1',
    votos: 41,
    voters: ['usuario:martina', 'usuario:jorge', 'usuario:admin'],
    resuelta: false,
    haceDias: 6,
  },
  {
    clave: 'pub:economia-carrera',
    autor: 'usuario:martina',
    tipo: 'debate',
    titulo: 'Vale la pena hacer una carrera tecnica ahora?',
    cuerpo:
      'Estoy decidiendo entre Computacion y Ingenieria Comercial. Me interesa el desarrollo tecnico, pero el mundo laboral apunta a lo comercial. Como lo ven ustedes?',
    materia: null,
    votos: 27,
    voters: ['usuario:valentina', 'usuario:carlos', 'usuario:jorge'],
    resuelta: false,
    haceDias: 9,
  },
];
