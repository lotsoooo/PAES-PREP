import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icono } from './Icono';

export type TonoChip = 'neutro' | 'primario' | 'naranjo' | 'dorado' | 'exito' | 'error';

/**
 * Color por función: naranjo solo para IA, recomendaciones y puntos débiles;
 * dorado solo para Premium; verde para completado o correcto.
 */
const tonos: Record<TonoChip, string> = {
  neutro: 'bg-surface-container text-on-surface-variant',
  primario: 'bg-primary-fixed text-on-primary-fixed-variant',
  naranjo: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  dorado: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  exito: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
};

export interface PropsChip extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoChip;
  icono?: string;
  iconoRelleno?: boolean;
  tamano?: 'sm' | 'md';
}

/** Pill de estado o categoría. Nunca se corta: el texto siempre cabe. */
export function Chip({ tono = 'neutro', icono, iconoRelleno, tamano = 'md', className, children, ...props }: PropsChip) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-1 rounded-full font-medium whitespace-nowrap',
        tamano === 'sm' ? 'px-2 py-0.5 text-caption' : 'px-3 py-1 text-[13px] leading-5',
        tonos[tono],
        className,
      )}
      {...props}
    >
      {icono && <Icono nombre={icono} relleno={iconoRelleno} className={tamano === 'sm' ? 'text-sm' : 'text-base'} />}
      {children}
    </span>
  );
}

export interface PropsChipFiltro extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  activo: boolean;
  onClick: () => void;
  icono?: string;
  contador?: number;
  children: ReactNode;
}

/**
 * Chip de filtro (botón con aria-pressed). Alto 40px, texto completo sin
 * truncar: en Stitch los chips de búsqueda cortaban la palabra.
 */
export function ChipFiltro({ activo, onClick, icono, contador, children, className, ...props }: PropsChipFiltro) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-label-md font-medium whitespace-nowrap',
        'transition-[background-color,color,border-color] duration-150',
        activo
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border-strong bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:text-on-surface',
        className,
      )}
      {...props}
    >
      {icono && <Icono nombre={activo ? 'check' : icono} className="text-lg" />}
      {children}
      {contador !== undefined && (
        <span className={cn('tabular-nums', activo ? 'text-on-primary/80' : 'text-outline')}>{contador}</span>
      )}
    </button>
  );
}

/** Contador numérico pequeño (notificaciones, pestañas). */
export function Insignia({ valor, tono = 'primario', className }: { valor: number; tono?: 'primario' | 'error' | 'neutro'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-caption font-semibold tabular-nums',
        tono === 'primario' && 'bg-primary text-on-primary',
        tono === 'error' && 'bg-error text-on-error',
        tono === 'neutro' && 'bg-surface-container-high text-on-surface-variant',
        className,
      )}
    >
      {valor}
    </span>
  );
}
