import { useState } from 'react';
import type { DTONotificacion } from '@paes-pro/shared';
import { useMarcarLeida, useMarcarTodasLeidas, useNotificaciones } from '@/lib/data/notificaciones';
import { useTitulo } from '@/hooks/utiles';
import { ItemNotificacion } from '@/components/notificaciones/ItemNotificacion';
import { Pagina } from '@/components/ui/Pagina';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Navegacion';
import { EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';

/** Texto del llamado a la acción según el tipo (Stitch: "Ver resultados"). */
const CTA: Record<string, string> = {
  resultados_disponibles: 'Ver resultados',
  recordatorio: 'Ir a mi plan',
  material_nuevo: 'Ver material',
  nuevo_plan: 'Ver mi plan',
  plan_actualizado: 'Ver mi plan',
  racha: 'Seguir estudiando',
  comentario: 'Ver comentario',
  respuesta: 'Ver respuesta',
  like: 'Ver publicación',
  pago: 'Ver suscripción',
};

export default function Notificaciones() {
  useTitulo('Notificaciones');
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');
  const lista = useNotificaciones(filtro === 'no_leidas');
  const marcar = useMarcarLeida();
  const todas = useMarcarTodasLeidas();

  const items = lista.data?.pages.flatMap((p) => p.items) ?? [];
  const noLeidas = lista.data?.pages[0]?.noLeidas ?? 0;

  const abrir = (n: DTONotificacion) => {
    if (!n.leida) marcar.mutate(n.id);
  };

  return (
    <Pagina ancho="lectura">
      <div className="overflow-hidden rounded-lg border border-border bg-surface-container-lowest shadow-card">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-6 md:p-10 md:pb-8">
          <div>
            <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Notificaciones</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">Mantente al día con tu progreso y tu comunidad.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              etiquetaAria="Filtrar notificaciones"
              tamano="sm"
              valor={filtro}
              onCambio={setFiltro}
              opciones={[
                { valor: 'todas', etiqueta: 'Todas' },
                { valor: 'no_leidas', etiqueta: noLeidas > 0 ? `No leídas (${noLeidas})` : 'No leídas' },
              ]}
            />
            <Button
              variante="fantasma"
              tamano="sm"
              iconoIzquierdo="done_all"
              className="text-primary hover:text-primary"
              disabled={noLeidas === 0}
              cargando={todas.isPending}
              onClick={() => todas.mutate()}
            >
              Marcar todas como leídas
            </Button>
          </div>
        </header>

        {lista.isLoading ? (
          <div role="status" aria-label="Cargando notificaciones" className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex gap-3 p-5">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : lista.isError ? (
          <EstadoError
            className="m-6"
            descripcion="No pudimos cargar tus notificaciones."
            onReintentar={() => void lista.refetch()}
            cargando={lista.isFetching}
          />
        ) : items.length === 0 ? (
          <EstadoVacio
            className="m-6"
            icono="notifications_off"
            titulo={filtro === 'no_leidas' ? 'Estás al día' : 'Aún no tienes notificaciones'}
            descripcion={
              filtro === 'no_leidas'
                ? 'Leíste todo. Te avisaremos cuando haya resultados, recordatorios o respuestas nuevas.'
                : 'Aquí verás tus resultados, recordatorios del plan y la actividad de la comunidad.'
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'border-l-4 transition-colors',
                    n.leida ? 'border-transparent hover:bg-surface-container-low' : 'border-primary bg-primary-fixed/30 hover:bg-primary-fixed/50',
                  )}
                >
                  <ItemNotificacion
                    n={n}
                    onAbrir={abrir}
                    accion={
                      n.url && CTA[n.tipo] ? (
                        <span className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full border border-primary px-4 text-label-md font-medium text-primary">
                          {CTA[n.tipo]}
                          <Icono nombre="arrow_forward" className="text-base" />
                        </span>
                      ) : undefined
                    }
                  />
                </li>
              ))}
            </ul>
            {lista.hasNextPage && (
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => void lista.fetchNextPage()}
                  disabled={lista.isFetchingNextPage}
                  className="flex min-h-14 w-full items-center justify-center gap-2 text-label-md font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60"
                >
                  {lista.isFetchingNextPage && <Icono nombre="progress_activity" className="animate-spin text-lg" />}
                  Cargar notificaciones anteriores
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Pagina>
  );
}
