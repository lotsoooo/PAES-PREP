import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';

/**
 * Fragmentos de la interfaz real dibujados en HTML/SVG para la landing (en vez
 * de capturas). Usan datos de ejemplo de una estudiante y lo dicen.
 */

const HISTORIAL = [512, 548, 561, 590, 604, 633, 651, 680];
const META = 780;

/** Evolución del puntaje: línea azul + meta naranja punteada (DESIGN.md). */
export function FragmentoProgreso({ className }: { className?: string }) {
  const ancho = 520;
  const alto = 180;
  const min = 450;
  const max = 820;
  const x = (i: number) => 28 + (i * (ancho - 44)) / (HISTORIAL.length - 1);
  const y = (v: number) => alto - 20 - ((v - min) / (max - min)) * (alto - 36);
  const puntos = HISTORIAL.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  return (
    <div data-ui className={cn('rounded-md border border-border bg-surface-container-lowest p-5', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-caption text-on-surface-variant">Puntaje estimado · Matemática M1</p>
          <p className="text-headline-md font-bold text-on-surface tabular-nums">
            680 <span className="text-body-md font-normal text-success">+168 desde marzo</span>
          </p>
        </div>
        <span className="hidden text-caption text-on-surface-variant sm:block">Ejemplo</span>
      </div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="mt-4 w-full" role="img" aria-label="Gráfico de ejemplo: el puntaje sube de 512 a 680 puntos con meta de 780">
        {[500, 600, 700, 800].map((v) => (
          <g key={v}>
            <line x1={28} x2={ancho - 8} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
            <text x={0} y={y(v) + 4} className="fill-on-surface-variant text-[11px]">
              {v}
            </text>
          </g>
        ))}
        <line x1={28} x2={ancho - 8} y1={y(META)} y2={y(META)} className="stroke-secondary-container" strokeWidth={2} strokeDasharray="6 5" />
        <text x={ancho - 8} y={y(META) - 6} textAnchor="end" className="fill-secondary text-[11px] font-medium">
          Meta 780
        </text>
        <polyline points={puntos} fill="none" className="stroke-primary" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(HISTORIAL.length - 1)} cy={y(HISTORIAL.at(-1)!)} r={4.5} className="fill-primary" />
      </svg>
    </div>
  );
}

/** Pregunta en modo examen con cronómetro. */
export function FragmentoEnsayo({ className }: { className?: string }) {
  const alternativas = ['$\\frac{3}{4}$', '$\\frac{4}{3}$', '$\\frac{9}{16}$', '$\\frac{16}{9}$'];
  const textos = ['3/4', '4/3', '9/16', '16/9'];
  return (
    <div data-ui className={cn('rounded-md border border-border bg-surface-container-lowest p-5', className)} aria-hidden="true">
      <div className="flex items-center justify-between text-caption">
        <span className="font-medium text-on-surface-variant">Pregunta 12 de 65</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-semibold text-on-surface tabular-nums">
          <Icono nombre="timer" className="text-base" />
          01:42:18
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-[18%] rounded-full bg-primary" />
      </div>
      <p className="mt-4 text-body-md text-on-surface">¿Cuál es el valor de (3/4)⁻²?</p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {textos.map((t, i) => (
          <li
            key={alternativas[i]}
            className={cn(
              'flex items-center gap-2 rounded border px-3 py-2 text-label-md',
              i === 3 ? 'border-primary bg-primary-fixed/50 text-on-surface' : 'border-border text-on-surface-variant',
            )}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-caption font-bold',
                i === 3 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
              )}
            >
              {'ABCD'[i]}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const SEMANA: { dia: number; titulo: string; materia: string; estado: 'hecha' | 'hoy' | 'pendiente' }[] = [
  { dia: 0, titulo: 'Potencias y raíces', materia: 'M1', estado: 'hecha' },
  { dia: 1, titulo: 'Texto argumentativo', materia: 'CL', estado: 'hecha' },
  { dia: 2, titulo: 'Funciones lineales', materia: 'M1', estado: 'hoy' },
  { dia: 3, titulo: 'Genética mendeliana', materia: 'BIO', estado: 'pendiente' },
  { dia: 4, titulo: 'Ensayo M1 cronometrado', materia: 'M1', estado: 'pendiente' },
];

/** Semana del plan de estudio. */
export function FragmentoPlan({ className }: { className?: string }) {
  return (
    <div data-ui className={cn('rounded-md border border-border bg-surface-container-lowest p-4', className)} aria-hidden="true">
      <div className="grid grid-cols-5 gap-2">
        {DIAS.map((d, i) => (
          <div key={d} className="min-w-0">
            <p className={cn('mb-2 text-center text-caption', i === 2 ? 'font-bold text-primary' : 'text-on-surface-variant')}>{d}</p>
            {SEMANA.filter((t) => t.dia === i).map((t) => (
              <div
                key={t.titulo}
                className={cn(
                  'rounded-sm border-l-[3px] px-2 py-2 text-[11px] leading-tight',
                  t.estado === 'hecha' && 'border-success bg-success-container text-on-success-container line-through decoration-1',
                  t.estado === 'hoy' && 'border-primary bg-primary-fixed text-on-primary-fixed-variant',
                  t.estado === 'pendiente' && 'border-outline-variant bg-surface-container-low text-on-surface-variant',
                )}
              >
                <span className="block font-semibold">{t.materia}</span>
                {t.titulo}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Índice de una unidad con lecciones completadas, actual y bloqueadas. */
export function FragmentoUnidad({ className }: { className?: string }) {
  const lecciones = [
    { t: 'Números racionales', e: 'hecha' },
    { t: 'Potencias de base racional', e: 'hecha' },
    { t: 'Raíces enésimas', e: 'actual' },
    { t: 'Logaritmos', e: 'bloqueada' },
  ] as const;
  return (
    <ul data-ui className={cn('space-y-1.5 rounded-md border border-border bg-surface-container-lowest p-3', className)} aria-hidden="true">
      {lecciones.map((l) => (
        <li
          key={l.t}
          className={cn(
            'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-label-md',
            l.e === 'actual' ? 'bg-primary-fixed/60 font-semibold text-on-surface' : 'text-on-surface-variant',
          )}
        >
          <Icono
            nombre={l.e === 'hecha' ? 'check_circle' : l.e === 'actual' ? 'play_circle' : 'lock'}
            relleno={l.e !== 'bloqueada'}
            className={cn('text-lg', l.e === 'hecha' && 'text-success', l.e === 'actual' && 'text-primary', l.e === 'bloqueada' && 'text-outline')}
          />
          {l.t}
        </li>
      ))}
    </ul>
  );
}
