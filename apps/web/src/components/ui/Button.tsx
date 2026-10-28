import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';
import { Icono } from './Icono';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'premium' | 'suave';
export type TamanoBoton = 'sm' | 'md' | 'lg';

/**
 * Color por función (DESIGN.md):
 * - primario  → azul: el camino principal (comenzar, enviar, guardar).
 * - secundario → borde azul 1px sobre fondo transparente.
 * - premium   → dorado: solo para Premium.
 * - peligro   → rojo: acciones destructivas.
 * - suave     → tinte azul, para acciones secundarias dentro de cards.
 */
const variantes: Record<VarianteBoton, string> = {
  primario:
    'bg-primary text-on-primary shadow-sm hover:bg-on-primary-fixed-variant active:translate-y-px dark:hover:bg-primary-fixed-dim dark:hover:text-on-primary-fixed',
  secundario:
    'border border-primary bg-transparent text-primary hover:bg-primary/8 active:bg-primary/12',
  fantasma: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
  peligro: 'bg-error text-on-error hover:bg-on-error-container active:translate-y-px dark:hover:bg-error/85',
  premium:
    'bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-fixed-dim active:translate-y-px',
  suave: 'bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-fixed-dim/70',
};

const tamanos: Record<TamanoBoton, string> = {
  // 44px de alto mínimo en md/lg (WCAG 2.5.5); sm queda para barras densas.
  sm: 'min-h-9 px-3 text-label-md gap-1.5',
  md: 'min-h-11 px-5 text-label-md gap-2',
  lg: 'min-h-13 px-7 text-body-md gap-2',
};

const base =
  'inline-flex items-center justify-center rounded font-semibold select-none whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,transform,border-color] duration-150 ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

interface PropsComunes {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  iconoIzquierdo?: string;
  iconoDerecho?: string;
}

export interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement>, PropsComunes {
  cargando?: boolean;
  textoCargando?: string;
}

function Contenido({
  iconoIzquierdo,
  iconoDerecho,
  cargando,
  children,
}: {
  iconoIzquierdo?: string;
  iconoDerecho?: string;
  cargando?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {cargando ? (
        <Icono nombre="progress_activity" className="animate-spin text-[1.25em]" />
      ) : (
        iconoIzquierdo && <Icono nombre={iconoIzquierdo} className="text-[1.25em]" />
      )}
      {children}
      {iconoDerecho && !cargando && <Icono nombre={iconoDerecho} className="text-[1.25em]" />}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, PropsBoton>(function Button(
  {
    variante = 'primario',
    tamano = 'md',
    anchoCompleto,
    cargando,
    textoCargando,
    iconoIzquierdo,
    iconoDerecho,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variantes[variante], tamanos[tamano], anchoCompleto && 'w-full', className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      <Contenido iconoIzquierdo={iconoIzquierdo} iconoDerecho={iconoDerecho} cargando={cargando}>
        {cargando && textoCargando ? textoCargando : children}
      </Contenido>
    </button>
  );
});

export interface PropsBotonEnlace extends Omit<LinkProps, 'className'>, PropsComunes {
  className?: string;
  children: ReactNode;
}

/** Enlace con apariencia de botón: navega sin recarga y admite Ctrl+clic. */
export function BotonEnlace({
  variante = 'primario',
  tamano = 'md',
  anchoCompleto,
  iconoIzquierdo,
  iconoDerecho,
  className,
  children,
  ...props
}: PropsBotonEnlace) {
  return (
    <Link
      className={cn(base, variantes[variante], tamanos[tamano], anchoCompleto && 'w-full', className)}
      {...props}
    >
      <Contenido iconoIzquierdo={iconoIzquierdo} iconoDerecho={iconoDerecho}>
        {children}
      </Contenido>
    </Link>
  );
}

export interface PropsBotonIcono extends ButtonHTMLAttributes<HTMLButtonElement> {
  icono: string;
  /** Obligatorio: los botones solo-ícono necesitan nombre accesible. */
  etiqueta: string;
  relleno?: boolean;
  tamano?: 'sm' | 'md';
  insignia?: number;
}

/** Botón de solo ícono, 44×44 px de área táctil. */
export const BotonIcono = forwardRef<HTMLButtonElement, PropsBotonIcono>(function BotonIcono(
  { icono, etiqueta, relleno, tamano = 'md', insignia, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={insignia ? `${etiqueta} (${insignia} sin leer)` : etiqueta}
      title={etiqueta}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full text-on-surface-variant',
        'transition-[background-color,color] duration-150 hover:bg-surface-container-high hover:text-on-surface',
        'disabled:pointer-events-none disabled:opacity-50',
        tamano === 'md' ? 'size-11' : 'size-9',
        className,
      )}
      {...props}
    >
      <Icono nombre={icono} relleno={relleno} />
      {insignia ? (
        <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-4 text-on-error tabular-nums">
          {insignia > 9 ? '9+' : insignia}
        </span>
      ) : null}
    </button>
  );
});
