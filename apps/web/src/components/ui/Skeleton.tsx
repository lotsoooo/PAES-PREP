import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PropsSkeleton {
  className?: string;
  variante?: 'rect' | 'circulo' | 'texto';
  ancho?: string | number;
  alto?: string | number;
  cantidad?: number;
}

export function Skeleton({
  className,
  variante = 'rect',
  ancho,
  alto,
  cantidad = 1,
}: PropsSkeleton) {
  const base = 'animate-pulse rounded bg-surface-container-high';
  const styles: Record<typeof variante, string> = {
    rect: cn(base, 'h-4'),
    circulo: cn(base, 'rounded-full size-10'),
    texto: cn(base, 'h-3'),
  };

  const render = () => (
    <span
      className={cn(styles[variante], className)}
      style={{ width: ancho, height: alto }}
      aria-hidden="true"
    />
  );

  if (cantidad <= 1) return render();

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: cantidad }).map((_, i) => (
        <span key={i}>{render()}</span>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-md border border-border bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton variante="circulo" />
        <div className="flex-1 space-y-2">
          <Skeleton variante="texto" ancho="70%" />
          <Skeleton variante="texto" ancho="40%" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton ancho="100%" />
        <Skeleton ancho="90%" />
        <Skeleton ancho="60%" />
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton ancho={80} />
        <Skeleton ancho={100} />
      </div>
    </div>
  );
}

export function EstadoVacio({
  icono = 'folder_open',
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono?: string;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-10 text-center',
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-surface-container">
        <span aria-hidden="true" className="material-symbols-outlined text-4xl text-on-surface-variant">
          {icono}
        </span>
      </div>
      <h3 className="mt-4 text-headline-md text-on-surface">{titulo}</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{descripcion}</p>
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

export function EstadoError({
  titulo = 'Ocurrió un error',
  descripcion = 'Inténtalo nuevamente en unos segundos.',
  onReintentar,
  cargando,
  className,
}: {
  titulo?: string;
  descripcion?: string;
  onReintentar?: () => void;
  cargando?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-10 text-center',
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-error-container">
        <span aria-hidden="true" className="material-symbols-outlined text-4xl text-on-error-container">
          error
        </span>
      </div>
      <h3 className="mt-4 text-headline-md text-on-surface">{titulo}</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{descripcion}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          disabled={cargando}
          className="mt-5 min-h-11 rounded px-5 text-body-md font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {cargando ? 'Reintentando…' : 'Reintentar'}
        </button>
      )}
    </div>
  );
}
