import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TonoProgreso = 'primario' | 'exito' | 'naranjo' | 'error' | 'dorado';

const rellenos: Record<TonoProgreso, string> = {
  primario: 'bg-primary',
  exito: 'bg-success',
  naranjo: 'bg-secondary-container',
  error: 'bg-error',
  dorado: 'bg-tertiary-container',
};

export interface PropsProgressBar {
  /** 0–100. */
  valor: number;
  /** Si no se indica: verde al 100 %, azul en curso (DESIGN.md). */
  tono?: TonoProgreso;
  etiqueta?: ReactNode;
  /** Texto accesible cuando la etiqueta visible no es texto. */
  etiquetaAria?: string;
  mostrarValor?: boolean;
  grosor?: 'normal' | 'fino';
  className?: string;
}

/** Barra de 8 px (DESIGN.md) con role=progressbar. */
export function ProgressBar({
  valor,
  tono,
  etiqueta,
  etiquetaAria,
  mostrarValor,
  grosor = 'normal',
  className,
}: PropsProgressBar) {
  const acotado = Math.round(Math.max(0, Math.min(100, valor)));
  const tonoFinal = tono ?? (acotado >= 100 ? 'exito' : 'primario');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(etiqueta || mostrarValor) && (
        <div className="flex items-center justify-between gap-3 text-caption">
          {etiqueta && <span className="min-w-0 text-on-surface-variant">{etiqueta}</span>}
          {mostrarValor && <span className="font-semibold text-on-surface tabular-nums">{acotado}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={acotado}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiquetaAria ?? (typeof etiqueta === 'string' ? etiqueta : 'Progreso')}
        className={cn(
          'w-full overflow-hidden rounded-full bg-surface-container-high',
          grosor === 'normal' ? 'h-2' : 'h-1.5',
        )}
      >
        <div
          className={cn('h-full origin-left rounded-full transition-[width] duration-700 ease-out', rellenos[tonoFinal])}
          style={{ width: `${acotado}%` }}
        />
      </div>
    </div>
  );
}

/** Anillo de progreso (Objetivo PAES, resultados). */
export function ProgressCircular({
  valor,
  tamano = 160,
  grosor = 12,
  tono = 'primario',
  etiquetaAria,
  children,
  className,
}: {
  /** 0–100. */
  valor: number;
  tamano?: number;
  grosor?: number;
  tono?: TonoProgreso;
  etiquetaAria: string;
  children?: ReactNode;
  className?: string;
}) {
  const acotado = Math.max(0, Math.min(100, valor));
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const trazo = {
    primario: 'stroke-primary',
    exito: 'stroke-success',
    naranjo: 'stroke-secondary-container',
    error: 'stroke-error',
    dorado: 'stroke-tertiary-container',
  }[tono];

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(acotado)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiquetaAria}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: tamano, height: tamano }}
    >
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          className="stroke-surface-container-high"
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - acotado / 100)}
          className={cn(trazo, 'transition-[stroke-dashoffset] duration-1000 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
