import type { DTOAlternativa, DTOPregunta } from '@paes-pro/shared';
import { formatearCronometro } from '@paes-pro/shared';
import { TextoMat } from '@/components/contenido/TextoMat';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';
import { LETRAS } from './formato';
import type { EstadoGuardado } from './useAutoguardado';

/** Cronómetro regresivo: neutro, naranjo bajo 10 min (alerta), rojo bajo 5 min. */
export function Cronometro({ restante }: { restante: number }) {
  const tono = restante <= 300 ? 'critico' : restante <= 600 ? 'alerta' : 'normal';
  return (
    <div
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-semibold tabular-nums',
        tono === 'normal' && 'border-outline-variant bg-surface-container-low text-on-surface',
        tono === 'alerta' && 'border-secondary-container/60 bg-secondary-fixed text-on-secondary-fixed-variant',
        tono === 'critico' && 'border-error/50 bg-error-container text-on-error-container',
      )}
    >
      <Icono nombre="timer" className={tono === 'normal' ? 'text-primary' : undefined} />
      <span className="sr-only">Tiempo restante:</span>
      <span className="text-body-md md:text-body-lg" aria-hidden="true">
        {formatearCronometro(restante)}
      </span>
      <span className="sr-only">{Math.ceil(restante / 60)} minutos</span>
    </div>
  );
}

export function IndicadorGuardado({ estado }: { estado: EstadoGuardado }) {
  const datos = {
    guardado: { icono: 'cloud_done', texto: 'Respuestas guardadas', clase: 'text-on-surface-variant' },
    guardando: { icono: 'cloud_sync', texto: 'Guardando…', clase: 'text-on-surface-variant' },
    error: { icono: 'error', texto: 'No se pudo guardar: revisa el aviso', clase: 'text-error' },
    sin_conexion: { icono: 'cloud_off', texto: 'Sin conexión: reintentando', clase: 'text-error' },
  }[estado];
  return (
    <span role="status" className={cn('inline-flex items-center gap-1.5 text-caption', datos.clase)}>
      <Icono nombre={datos.icono} className="text-base" />
      <span className="hidden sm:inline">{datos.texto}</span>
      <span className="sr-only sm:hidden">{datos.texto}</span>
    </span>
  );
}

/** Alternativas A–D grandes (≥ 56 px), como radio group accesible. */
export function Alternativas({
  pregunta,
  elegida,
  onElegir,
}: {
  pregunta: DTOPregunta;
  elegida: string | undefined;
  onElegir: (alt: DTOAlternativa) => void;
}) {
  const alts = [...pregunta.alternativas].sort((a, b) => a.posicion - b.posicion);
  return (
    <div role="radiogroup" aria-labelledby={`enunciado-${pregunta.id}`} className="mt-6 flex flex-col gap-3">
      {alts.map((alt, i) => {
        const activa = elegida === alt.id;
        const letra = LETRAS[i] ?? String(i + 1);
        return (
          <button
            key={alt.id}
            type="button"
            role="radio"
            aria-checked={activa}
            tabIndex={activa || (!elegida && i === 0) ? 0 : -1}
            onClick={() => onElegir(alt)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              e.preventDefault();
              e.stopPropagation();
              const siguiente = alts[(i + (e.key === 'ArrowDown' ? 1 : alts.length - 1)) % alts.length];
              if (siguiente) {
                onElegir(siguiente);
                const hermanos = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
                hermanos?.[alts.indexOf(siguiente)]?.focus();
              }
            }}
            className={cn(
              'group flex min-h-14 w-full items-center gap-4 rounded border px-4 py-3 text-left transition-[background-color,border-color] duration-100 md:px-5',
              activa
                ? 'border-primary bg-primary-fixed/60 ring-1 ring-primary'
                : 'border-border-strong bg-surface-container-lowest hover:border-primary/60 hover:bg-surface-container-low',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-label-md font-semibold',
                activa ? 'border-primary bg-primary text-on-primary' : 'border-outline text-on-surface-variant',
              )}
            >
              {letra}
            </span>
            <span className="sr-only">Alternativa {letra}:</span>
            <TextoMat texto={alt.texto} modo="linea" className="min-w-0 flex-1 text-body-lg text-on-surface" />
          </button>
        );
      })}
    </div>
  );
}

/** Grid de preguntas con estado: respondida, marcada, en blanco y actual. */
export function NavegadorPreguntas({
  preguntas,
  respuestas,
  marcadas,
  actual,
  onIr,
}: {
  preguntas: DTOPregunta[];
  respuestas: Record<string, string>;
  marcadas: Record<string, boolean>;
  actual: number;
  onIr: (indice: number) => void;
}) {
  const respondidas = preguntas.filter((p) => respuestas[p.id]).length;
  const nMarcadas = preguntas.filter((p) => marcadas[p.id]).length;
  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-caption text-on-surface-variant">
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-primary" /> Respondidas ({respondidas})
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Icono nombre="bookmark" relleno className="text-sm text-primary" /> Marcadas ({nMarcadas})
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm border border-outline" /> En blanco ({preguntas.length - respondidas})
        </li>
      </ul>
      <ol className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5">
        {preguntas.map((p, i) => {
          const respondida = Boolean(respuestas[p.id]);
          const marcada = Boolean(marcadas[p.id]);
          const estado = `${respondida ? 'respondida' : 'en blanco'}${marcada ? ', marcada para revisar' : ''}`;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onIr(i)}
                aria-label={`Pregunta ${i + 1}, ${estado}`}
                aria-current={i === actual ? 'step' : undefined}
                className={cn(
                  'relative flex size-11 w-full items-center justify-center rounded text-label-md font-semibold tabular-nums transition-colors',
                  respondida
                    ? 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
                    : 'border border-border-strong bg-surface-container-lowest text-on-surface-variant hover:border-primary',
                  i === actual && 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
                )}
              >
                {i + 1}
                {marcada && (
                  <Icono
                    nombre="bookmark"
                    relleno
                    className={cn('absolute -right-1 -top-1.5 text-base', respondida ? 'text-secondary-container' : 'text-primary')}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

