import { cn } from '@/lib/cn';

export interface PropsProgressBar {
  /** 0–100. */
  valor: number;
  exito?: boolean;
  etiqueta?: string;
  mostrarValor?: boolean;
  className?: string;
}

/** Barra de progreso de 8px (DESIGN.md). role=progressbar para lectores de pantalla. */
export function ProgressBar({
  valor,
  exito,
  etiqueta,
  mostrarValor,
  className,
}: PropsProgressBar) {
  const acotado = Math.max(0, Math.min(100, valor));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(etiqueta || mostrarValor) && (
        <div className="flex items-center justify-between">
          {etiqueta && <span className="text-label-md text-on-surface-variant">{etiqueta}</span>}
          {mostrarValor && (
            <span className="text-label-md text-on-surface font-medium tabular-nums">
              {acotado}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={acotado}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiqueta ?? 'Progreso'}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            exito ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${acotado}%` }}
        />
      </div>
    </div>
  );
}
