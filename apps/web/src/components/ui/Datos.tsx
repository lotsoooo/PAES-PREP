import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { cn } from '@/lib/cn';
import { Icono } from './Icono';

/* --------------------------------------------------------------------------
 * Tooltip
 * -------------------------------------------------------------------------- */

export function Tooltip({ texto, children, lado = 'top' }: { texto: ReactNode; children: ReactNode; lado?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root delayDuration={250}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={lado}
          sideOffset={6}
          className="animar-aparecer z-[60] max-w-xs rounded bg-inverse-surface px-3 py-2 text-caption text-inverse-on-surface shadow-float"
        >
          {texto}
          <TooltipPrimitive.Arrow className="fill-inverse-surface" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export const ProveedorTooltip = TooltipPrimitive.Provider;

/* --------------------------------------------------------------------------
 * StatCard — etiqueta sobre valor; el ícono es opcional y neutro
 * -------------------------------------------------------------------------- */

export function StatCard({
  etiqueta,
  valor,
  unidad,
  detalle,
  icono,
  tonoIcono = 'primario',
  className,
}: {
  etiqueta: string;
  valor: ReactNode;
  unidad?: string;
  detalle?: ReactNode;
  icono?: string;
  tonoIcono?: 'primario' | 'naranjo' | 'dorado' | 'exito';
  className?: string;
}) {
  const tonos = {
    primario: 'bg-primary-fixed text-primary',
    naranjo: 'bg-secondary-fixed text-secondary-container',
    dorado: 'bg-tertiary-fixed text-tertiary',
    exito: 'bg-success-container text-success',
  } as const;
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-md border border-border bg-surface-container-lowest px-5 py-4 shadow-card',
        className,
      )}
    >
      {icono && (
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded', tonos[tonoIcono])}>
          <Icono nombre={icono} relleno />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-caption text-on-surface-variant">{etiqueta}</p>
        <p className="text-headline-md font-bold text-on-surface tabular-nums">
          {valor}
          {unidad && <span className="ml-1 text-body-md font-normal text-on-surface-variant">{unidad}</span>}
        </p>
        {detalle && <p className="text-caption text-on-surface-variant">{detalle}</p>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Etiqueta de materia (label-md en mayúsculas, DESIGN.md)
 * -------------------------------------------------------------------------- */

export function EtiquetaMateria({ codigo, className }: { codigo: string | null | undefined; className?: string }) {
  if (!codigo) return null;
  return (
    <span className={cn('text-[12px] font-semibold uppercase leading-4 tracking-[0.06em] text-primary', className)}>
      {MATERIA_ETIQUETA[codigo] ?? codigo}
    </span>
  );
}

/** Punto de dificultad (verde/ámbar/rojo) con texto: el color nunca va solo. */
export function Dificultad({ nivel, className }: { nivel: 'basico' | 'medio' | 'avanzado'; className?: string }) {
  const datos = {
    basico: { texto: 'Básico', color: 'bg-success' },
    medio: { texto: 'Intermedio', color: 'bg-tertiary-container' },
    avanzado: { texto: 'Avanzado', color: 'bg-error' },
  }[nivel];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-caption text-on-surface-variant', className)}>
      <span aria-hidden="true" className={cn('size-2 rounded-full', datos.color)} />
      {datos.texto}
    </span>
  );
}

/** Dato con ícono pequeño: "65 preguntas", "140 min". */
export function Metadato({ icono, children, className }: { icono: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-caption text-on-surface-variant', className)}>
      <Icono nombre={icono} className="text-base" />
      {children}
    </span>
  );
}
