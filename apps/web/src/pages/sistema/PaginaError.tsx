import { isRouteErrorResponse, useRouteError } from 'react-router';
import { MarcaIcono } from '@/components/marca/Logo';
import NoEncontrada from './NoEncontrada';

/**
 * Error de la aplicación (500) con la marca. Los chunks que fallan al cargar
 * tras un despliegue se recuperan recargando la página.
 */
export function PaginaError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NoEncontrada />;

  const esChunk = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message);

  return (
    <main className="flex min-h-dvh items-center bg-background">
      <section className="mx-auto max-w-xl px-4 py-16 md:px-8">
        <MarcaIcono className="size-12" />
        <p className="mt-8 text-display font-bold text-primary tabular-nums">{esChunk ? 'Nueva versión' : '500'}</p>
        <h1 className="mt-2 text-headline-lg-mobile text-on-surface md:text-headline-lg">
          {esChunk ? 'Actualizamos PAES Pro' : 'Algo salió mal de nuestro lado'}
        </h1>
        <p className="mt-3 text-body-lg text-on-surface-variant">
          {esChunk
            ? 'Hay una versión más reciente de la plataforma. Recarga para seguir donde estabas.'
            : 'No es tu culpa. Recarga la página; si vuelve a pasar, escríbenos a hola@paespro.cl y lo revisamos.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-5 text-label-md font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              refresh
            </span>
            Recargar página
          </button>
          <a
            href="/app"
            className="inline-flex min-h-11 items-center rounded border border-primary px-5 text-label-md font-semibold text-primary transition-colors hover:bg-primary/8"
          >
            Ir a mi inicio
          </a>
        </div>
      </section>
    </main>
  );
}
