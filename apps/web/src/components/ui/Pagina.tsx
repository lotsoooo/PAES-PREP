import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Contenedor de página dentro del AppShell: máx. 1280px, márgenes 16/32/48px. */
export function Pagina({ children, className, ancho = 'normal' }: { children: ReactNode; className?: string; ancho?: 'normal' | 'lectura' }) {
  return (
    <div
      className={cn(
        'animar-entrada mx-auto w-full px-4 py-6 md:px-8 md:py-8 lg:px-12',
        ancho === 'lectura' ? 'max-w-[960px]' : 'max-w-[1280px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Título de página (headline-lg: 24px móvil / 32px escritorio) con bajada y acciones. */
export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
  antes,
  className,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Breadcrumbs o etiqueta sobre el título. */
  antes?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8', className)}>
      <div className="min-w-0 max-w-3xl">
        {antes && <div className="mb-2">{antes}</div>}
        <h1 className="text-headline-lg-mobile text-on-surface text-balance md:text-headline-lg">{titulo}</h1>
        {descripcion && <p className="mt-2 text-body-md text-on-surface-variant text-pretty">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}
