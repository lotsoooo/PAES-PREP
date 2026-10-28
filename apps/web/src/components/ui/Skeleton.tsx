import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Icono } from './Icono';

/**
 * Bloque de carga plano del tamaño real del valor que reemplaza (sin shimmer).
 * Se usa dentro del layout final para que nada salte cuando llegan los datos.
 */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn('block animate-pulse rounded-sm bg-surface-container-high', className)}
    />
  );
}

/** Región en carga, anunciada a lectores de pantalla una sola vez. */
export function Cargando({ etiqueta = 'Cargando…', children, className }: { etiqueta?: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{etiqueta}</span>
      {children}
    </div>
  );
}

export function SkeletonCard({ className, lineas = 3 }: { className?: string; lineas?: number }) {
  return (
    <div className={cn('rounded-md border border-border bg-surface-container-lowest p-6 shadow-card', className)}>
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="mt-4 h-7 w-3/4" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lineas }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${92 - i * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Estado vacío: conserva el marco del bloque, explica en una frase y ofrece
 * la siguiente acción.
 */
export function EstadoVacio({
  icono = 'inbox',
  titulo,
  descripcion,
  accion,
  compacto,
  className,
}: {
  icono?: string;
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-outline-variant bg-surface-container-low/60 text-center',
        compacto ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <Icono nombre={icono} className={cn('text-outline', compacto ? 'text-3xl' : 'text-4xl')} />
      <h3 className={cn('mt-3 text-on-surface', compacto ? 'text-body-md font-semibold' : 'text-body-lg font-semibold')}>
        {titulo}
      </h3>
      {descripcion && <p className="mt-1 max-w-md text-body-md text-on-surface-variant">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

/** Error dentro del bloque que falló: qué pasó y un botón para reintentar. */
export function EstadoError({
  titulo = 'No pudimos cargar esta sección',
  descripcion = 'Revisa tu conexión e inténtalo de nuevo.',
  onReintentar,
  cargando,
  compacto,
  className,
}: {
  titulo?: string;
  descripcion?: ReactNode;
  onReintentar?: () => void;
  cargando?: boolean;
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-border bg-surface-container-lowest text-center',
        compacto ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <Icono nombre="cloud_off" className="text-3xl text-error" />
      <h3 className="mt-3 text-body-md font-semibold text-on-surface">{titulo}</h3>
      <p className="mt-1 max-w-md text-body-md text-on-surface-variant">{descripcion}</p>
      {onReintentar && (
        <Button variante="secundario" tamano="sm" className="mt-4" onClick={onReintentar} cargando={cargando} iconoIzquierdo="refresh">
          Reintentar
        </Button>
      )}
    </div>
  );
}
