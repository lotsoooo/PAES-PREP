import { useSesion } from '@/app/sesion';
import { useTitulo } from '@/hooks/utiles';
import { BotonEnlace } from '@/components/ui/Button';
import { MarcaIcono } from '@/components/marca/Logo';

/** 404 con la marca: explica qué pasó y ofrece volver a un lugar útil. */
export default function NoEncontrada() {
  useTitulo('Página no encontrada');
  const autenticado = useSesion((s) => s.estado === 'autenticado');
  return (
    <section className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center px-4 py-16 md:px-8">
      <MarcaIcono className="size-12" />
      <p className="mt-8 text-display font-bold text-primary tabular-nums">404</p>
      <h1 className="mt-2 text-headline-lg-mobile text-on-surface md:text-headline-lg">Esta página no existe</h1>
      <p className="mt-3 text-body-lg text-on-surface-variant">
        Puede que el enlace esté mal escrito o que el contenido se haya movido. Tu progreso sigue guardado.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <BotonEnlace to={autenticado ? '/app' : '/'} iconoIzquierdo="home">
          {autenticado ? 'Ir a mi inicio' : 'Ir al inicio'}
        </BotonEnlace>
        {autenticado && (
          <BotonEnlace to="/app/ensayos" variante="secundario">
            Ver ensayos
          </BotonEnlace>
        )}
      </div>
    </section>
  );
}
