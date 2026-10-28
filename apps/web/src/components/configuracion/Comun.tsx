import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';

/** Card de la sección activa (Stitch: título 24px + bajada + línea). */
export function PanelSeccion({
  titulo,
  descripcion,
  children,
  pie,
  className,
}: {
  titulo: string;
  descripcion: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="titulo-seccion"
      className={cn('rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card md:p-10', className)}
    >
      <header className="border-b border-border pb-5">
        <h2 id="titulo-seccion" className="text-headline-md text-on-surface">
          {titulo}
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">{descripcion}</p>
      </header>
      <div className="pt-6">{children}</div>
      {pie && <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-border pt-6">{pie}</div>}
    </section>
  );
}

/** Grupo con subtítulo (Stitch: "CORREO ELECTRÓNICO", "PUSH Y APP"). */
export function GrupoAjustes({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-8 first:mt-0">
      <h3 className="mb-3 text-label-md font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{titulo}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function CargandoPanel() {
  return (
    <div role="status" aria-label="Cargando" className="rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card md:p-10">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-5 w-80 max-w-full" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-20 rounded-md" />
      </div>
    </div>
  );
}
