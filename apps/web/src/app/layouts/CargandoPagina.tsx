import { Skeleton, Cargando } from '@/components/ui/Skeleton';
import { MarcaIcono } from '@/components/marca/Logo';

/** Mientras se descarga el código de una pantalla: el esqueleto genérico de página. */
export function CargandoPagina() {
  return (
    <Cargando className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 lg:px-12">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-6 md:grid-cols-12">
        <Skeleton className="h-64 rounded-lg md:col-span-8" />
        <Skeleton className="h-64 rounded-lg md:col-span-4" />
      </div>
    </Cargando>
  );
}

/** Pantalla completa mientras se restaura la sesión al abrir la app. */
export function CargandoApp() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
      <MarcaIcono className="size-12 animate-pulse" />
      <span className="sr-only">Cargando PAES Pro…</span>
    </div>
  );
}
