import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TonoChip = 'neutro' | 'primario' | 'naranjo' | 'dorado' | 'exito' | 'error';

/**
 * Los tonos respetan la regla de color por función:
 * naranjo solo para recomendaciones IA / puntos débiles,
 * dorado solo para Premium, verde solo para completado/correcto.
 */
const tonos: Record<TonoChip, string> = {
  neutro: 'bg-surface-container text-on-surface-variant',
  primario: 'bg-primary-container/15 text-primary',
  naranjo: 'bg-secondary-container/20 text-secondary',
  dorado: 'bg-tertiary-container/25 text-tertiary',
  exito: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
};

export interface PropsChip extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoChip;
  icono?: string;
  relleno?: boolean;
}

/**
 * Variante "relleno": fondo sólido del color del tono, en vez del tinte.
 * Se usa para el estado activo de los chips de la biblioteca.
 */
const rellenos: Record<TonoChip, string> = {
  neutro: 'bg-surface-container-high text-on-surface',
  primario: 'bg-primary text-on-primary',
  naranjo: 'bg-secondary text-on-secondary',
  dorado: 'bg-tertiary text-on-tertiary',
  exito: 'bg-success text-on-success',
  error: 'bg-error text-on-error',
};

export function Chip({ tono = 'neutro', icono, relleno, className, children, ...props }: PropsChip) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
        'text-label-md font-medium whitespace-nowrap',
        relleno ? rellenos[tono] : tonos[tono],
        className,
      )}
      {...props}
    >
      {icono && (
        <span aria-hidden="true" className="material-symbols-outlined text-base">
          {icono}
        </span>
      )}
      {children}
    </span>
  );
}

/** Chip filtrable: botón con aria-pressed. */
export function ChipFiltro({
  activo,
  onClick,
  children,
  className,
  ...props
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & Omit<HTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-4 min-h-9',
        'text-label-md font-medium transition-colors',
        activo
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
