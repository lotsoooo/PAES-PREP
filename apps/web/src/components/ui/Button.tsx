import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export type VarianteBoton = 'primario' | 'secundario' | 'terciario' | 'peligro' | 'fantasma';
export type TamanoBoton = 'sm' | 'md' | 'lg';

/**
 * Colores por función (DESIGN.md):
 * - primario → azul, acciones principales ("Comenzar ensayo", "Enviar").
 * - terciario → dorado, solo Premium.
 * - peligro  → rojo, acciones destructivas.
 */
const variantes: Record<VarianteBoton, string> = {
  primario:
    'bg-primary text-on-primary shadow-primary hover:brightness-110 active:brightness-95',
  secundario:
    'bg-transparent text-primary border border-primary hover:bg-primary/10 active:bg-primary/15',
  terciario:
    'bg-tertiary-container text-on-tertiary-container hover:brightness-105 active:brightness-95',
  peligro: 'bg-error text-on-error hover:brightness-110 active:brightness-95',
  fantasma: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low',
};

const tamanos: Record<TamanoBoton, string> = {
  // min-h de 44px en sm/md para cumplir el área táctil mínima de WCAG.
  sm: 'min-h-9 px-3 text-label-md gap-1.5 rounded-sm',
  md: 'min-h-11 px-5 text-body-md gap-2 rounded',
  lg: 'min-h-12 px-6 text-body-lg gap-2 rounded',
};

const base =
  'inline-flex items-center justify-center font-medium transition-all duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap';

export interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  cargando?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, PropsBoton>(function Button(
  { variante = 'primario', tamano = 'md', anchoCompleto, cargando, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variantes[variante], tamanos[tamano], anchoCompleto && 'w-full', className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando && (
        <span
          aria-hidden="true"
          className="material-symbols-outlined animate-spin text-lg"
          style={{ fontVariationSettings: "'FILL' 0, 'wgHT' 500, 'GRAD' 0, 'opsz' 24" }}
        >
          progress_activity
        </span>
      )}
      {children}
    </button>
  );
});

/** Enlace con la misma apariencia que Button, para navegación sin recarga. */
export function BotonEnlace({
  to,
  variante = 'primario',
  tamano = 'md',
  anchoCompleto,
  className,
  children,
}: {
  to: string;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(base, variantes[variante], tamanos[tamano], anchoCompleto && 'w-full', className)}
    >
      {children}
    </Link>
  );
}
