import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router';
import type { DTOTareaPlan } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';
import { BotonEnlace, BotonIcono } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { diasDeSemana, desdeISO, formatearDuracion, hoyISO, lunesDe, sumarDias } from './fechas';
import { destinoTarea } from './tareas';

const ICONO_TIPO: Record<DTOTareaPlan['tipo'], string> = {
  contenido: 'menu_book',
  teoria: 'auto_stories',
  ensayo: 'edit_document',
  repaso: 'autorenew',
};

const VERBO_TIPO: Record<DTOTareaPlan['tipo'], string> = {
  contenido: 'Estudiar',
  teoria: 'Leer',
  ensayo: 'Rendir',
  repaso: 'Repasar',
};

export interface PropsTarjetaTarea {
  tarea: DTOTareaPlan;
  onCambiar: (cambio: { estado?: DTOTareaPlan['estado']; fechaPlanificada?: string }) => void;
  /** Avance de la lección enlazada (0–100) si se conoce. */
  progreso?: number;
  compacta?: boolean;
  /** Muestra el día de la tarea (vista lista). */
  conFecha?: boolean;
  className?: string;
}

/**
 * Tarea del plan: completada (tachada, check verde), en curso (borde azul,
 * progreso y "Continuar") o pendiente. El círculo de la izquierda marca o
 * desmarca; el menú permite reprogramar u omitir.
 */
export function TarjetaTarea({ tarea, onCambiar, progreso, compacta, conFecha, className }: PropsTarjetaTarea) {
  const completada = tarea.estado === 'completada';
  const omitida = tarea.estado === 'omitida';
  const enCurso = tarea.estado === 'en_curso';
  const destino = destinoTarea(tarea);
  const etiqueta = tarea.materiaCodigo ? (MATERIA_ETIQUETA[tarea.materiaCodigo] ?? tarea.materiaCodigo) : 'General';

  return (
    <article
      className={cn(
        'group relative flex items-center gap-3 rounded-md border bg-surface-container-lowest transition-[box-shadow,border-color] duration-200 md:gap-4',
        compacta ? 'p-3' : 'p-4 md:px-5',
        enCurso ? 'border-primary/40 bg-primary-fixed/35 shadow-card before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r before:bg-primary' : 'border-border hover:shadow-card',
        (completada || omitida) && 'bg-surface-container-low',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onCambiar({ estado: completada ? 'pendiente' : 'completada' })}
        aria-pressed={completada}
        aria-label={completada ? `Marcar "${tarea.titulo}" como pendiente` : `Marcar "${tarea.titulo}" como completada`}
        className={cn(
          'relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-95',
          completada
            ? 'bg-success-container text-success'
            : enCurso
              ? 'bg-primary text-on-primary'
              : 'border border-border-strong bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary',
        )}
      >
        <Icono nombre={completada ? 'check' : ICONO_TIPO[tarea.tipo]} relleno={completada} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded-sm bg-surface-container px-1.5 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-on-surface-variant">
            {etiqueta}
          </span>
          <span className={cn('text-caption tabular-nums', enCurso ? 'font-medium text-primary' : 'text-on-surface-variant')}>
            {VERBO_TIPO[tarea.tipo]} · {formatearDuracion(tarea.duracionMin)}
            {enCurso && ' · En curso'}
            {omitida && ' · Omitida'}
          </span>
          {conFecha && (
            <span className="text-caption text-on-surface-variant">
              · {desdeISO(tarea.fechaPlanificada).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <h3
          className={cn(
            'mt-1 text-on-surface',
            compacta ? 'text-body-md font-medium' : 'text-body-lg font-medium',
            (completada || omitida) && 'text-on-surface-variant line-through decoration-outline',
          )}
        >
          {destino && !completada ? (
            <Link to={destino} className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {tarea.titulo}
            </Link>
          ) : (
            tarea.titulo
          )}
        </h3>
        {enCurso && progreso !== undefined && (
          <ProgressBar valor={progreso} etiquetaAria={`Avance de ${tarea.titulo}`} grosor="fino" className="mt-2 max-w-md" />
        )}
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1">
        {enCurso && destino && (
          <BotonEnlace to={destino} tamano="sm" className="hidden sm:inline-flex">
            Continuar
          </BotonEnlace>
        )}
        <MenuTarea tarea={tarea} onCambiar={onCambiar} />
      </div>
    </article>
  );
}

const item =
  'flex min-h-10 cursor-pointer select-none items-center gap-3 rounded px-3 text-body-md text-on-surface outline-none data-[highlighted]:bg-surface-container data-[disabled]:pointer-events-none data-[disabled]:opacity-50';

function MenuTarea({ tarea, onCambiar }: Pick<PropsTarjetaTarea, 'tarea' | 'onCambiar'>) {
  const hoy = hoyISO();
  const lunes = lunesDe(tarea.fechaPlanificada);
  const dias = diasDeSemana(lunes).filter((d) => d !== tarea.fechaPlanificada && d >= hoy);
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <BotonIcono icono="more_vert" etiqueta={`Opciones de "${tarea.titulo}"`} tamano="sm" />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={6} className="animar-aparecer z-50 w-60 rounded-md border border-border bg-surface-container-lowest p-1.5 shadow-float">
          {tarea.estado !== 'en_curso' && tarea.estado !== 'completada' && (
            <Dropdown.Item className={item} onSelect={() => onCambiar({ estado: 'en_curso' })}>
              <Icono nombre="play_circle" className="text-on-surface-variant" /> Empezar ahora
            </Dropdown.Item>
          )}
          <Dropdown.Item className={item} onSelect={() => onCambiar({ fechaPlanificada: sumarDias(tarea.fechaPlanificada < hoy ? hoy : tarea.fechaPlanificada, 1) })}>
            <Icono nombre="event_upcoming" className="text-on-surface-variant" /> Pasar al día siguiente
          </Dropdown.Item>
          {dias.length > 0 && (
            <Dropdown.Sub>
              <Dropdown.SubTrigger className={item}>
                <Icono nombre="calendar_month" className="text-on-surface-variant" />
                <span className="flex-1">Mover a…</span>
                <Icono nombre="chevron_right" className="text-on-surface-variant" />
              </Dropdown.SubTrigger>
              <Dropdown.Portal>
                <Dropdown.SubContent sideOffset={4} className="animar-aparecer z-50 w-52 rounded-md border border-border bg-surface-container-lowest p-1.5 shadow-float">
                  {dias.map((d) => (
                    <Dropdown.Item key={d} className={item} onSelect={() => onCambiar({ fechaPlanificada: d })}>
                      <span className="capitalize">{desdeISO(d).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })}</span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.SubContent>
              </Dropdown.Portal>
            </Dropdown.Sub>
          )}
          <Dropdown.Separator className="my-1 h-px bg-border" />
          {tarea.estado === 'omitida' ? (
            <Dropdown.Item className={item} onSelect={() => onCambiar({ estado: 'pendiente' })}>
              <Icono nombre="undo" className="text-on-surface-variant" /> Volver a pendiente
            </Dropdown.Item>
          ) : (
            <Dropdown.Item className={item} disabled={tarea.estado === 'completada'} onSelect={() => onCambiar({ estado: 'omitida' })}>
              <Icono nombre="block" className="text-on-surface-variant" /> Omitir esta tarea
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
