import { useState } from 'react';
import type { DTOItemCuaderno } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { useCuaderno, useQuitarDelCuaderno } from '@/lib/data/cuaderno';
import { useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { BotonEnlace, BotonIcono } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Tabs } from '@/components/ui/Tabs';
import { ModalConfirmacion } from '@/components/ui/Modal';
import { Accordion } from '@/components/ui/Navegacion';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TextoMat } from '@/components/contenido/TextoMat';
import { IndicadorCaja } from '@/components/repaso/Cajas';
import { INTERVALOS_CAJA, cuandoRepasar } from '@/components/repaso/leitner';
import { hoyISO } from '@/components/plan/fechas';

type Filtro = 'hoy' | 'repaso' | 'dominadas';

const ORIGEN: Record<DTOItemCuaderno['origen'], string> = {
  ensayo: 'De un ensayo',
  mini_test: 'De un mini-test',
  manual: 'Guardada por ti',
};

export default function Cuaderno() {
  useTitulo('Repaso de errores');
  const { data, isLoading, isError, refetch, isFetching } = useCuaderno();
  const quitar = useQuitarDelCuaderno();
  const [filtro, setFiltro] = useState<Filtro>('hoy');
  const [porQuitar, setPorQuitar] = useState<DTOItemCuaderno | null>(null);
  const hoy = hoyISO();

  const items = data?.items ?? [];
  const deHoy = items.filter((i) => !i.dominada && i.proximoRepaso.slice(0, 10) <= hoy);
  const enRepaso = items.filter((i) => !i.dominada);
  const dominadas = items.filter((i) => i.dominada);
  const visibles = filtro === 'hoy' ? deHoy : filtro === 'repaso' ? enRepaso : dominadas;

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Cuaderno de errores"
        descripcion="Cada pregunta que fallas vuelve justo antes de que la olvides. Acierta cinco veces seguidas y queda dominada."
        acciones={
          data && data.pendientesHoy > 0 ? (
            <BotonEnlace to="/app/repaso/sesion" tamano="lg" iconoIzquierdo="autorenew">
              Repasar {data.pendientesHoy} {data.pendientesHoy === 1 ? 'pregunta' : 'preguntas'}
            </BotonEnlace>
          ) : undefined
        }
      />

      {isLoading ? (
        <Cargando etiqueta="Cargando tu cuaderno…">
          <Skeleton className="h-24 rounded-md" />
          <div className="mt-8 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
        </Cargando>
      ) : isError || !data ? (
        <EstadoError titulo="No pudimos cargar tu cuaderno" onReintentar={() => void refetch()} cargando={isFetching} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <dl className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-surface-container-lowest shadow-card">
              <Cifra etiqueta="Para hoy" valor={data.pendientesHoy} destacado={data.pendientesHoy > 0} />
              <Cifra etiqueta="En repaso" valor={data.total - data.dominadas} />
              <Cifra etiqueta="Dominadas" valor={data.dominadas} />
            </dl>

            <Tabs
              className="mt-8"
              etiquetaAria="Filtrar preguntas del cuaderno"
              valor={filtro}
              onValorChange={(v) => setFiltro(v as Filtro)}
              items={[
                { valor: 'hoy', etiqueta: 'Para hoy', contador: deHoy.length },
                { valor: 'repaso', etiqueta: 'En repaso', contador: enRepaso.length },
                { valor: 'dominadas', etiqueta: 'Dominadas', contador: dominadas.length },
              ]}
            />

            <div className="mt-6">
              {data.total === 0 ? (
                <EstadoVacio
                  icono="auto_stories"
                  titulo="Tu cuaderno está vacío"
                  descripcion="Cuando falles una pregunta en un ensayo o mini-test, aparecerá aquí para repasarla en el momento justo."
                  accion={<BotonEnlace to="/app/ensayos">Rendir un ensayo</BotonEnlace>}
                />
              ) : visibles.length === 0 ? (
                <EstadoVacio
                  compacto
                  icono={filtro === 'hoy' ? 'task_alt' : 'inbox'}
                  titulo={filtro === 'hoy' ? '¡Estás al día!' : filtro === 'dominadas' ? 'Aún no dominas ninguna' : 'No hay preguntas en repaso'}
                  descripcion={
                    filtro === 'hoy'
                      ? 'No te toca repasar nada hoy. Vuelve mañana o adelanta una lección.'
                      : filtro === 'dominadas'
                        ? 'Una pregunta queda dominada al acertarla en la caja 5.'
                        : undefined
                  }
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {visibles.map((i) => (
                    <ItemCuaderno key={i.id} item={i} onQuitar={() => setPorQuitar(i)} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Cómo funciona el repaso">
            <Card>
              <h2 className="text-body-lg font-semibold text-on-surface">Cómo funciona</h2>
              <p className="mt-1 text-caption text-on-surface-variant">Cada acierto sube la pregunta una caja; un error la devuelve a la caja 1.</p>
              <ol className="mt-4 flex flex-col divide-y divide-border">
                {INTERVALOS_CAJA.map((dias, i) => (
                  <li key={dias} className="flex items-center justify-between py-2.5 text-body-md">
                    <IndicadorCaja caja={i + 1} />
                    <span className="text-on-surface-variant tabular-nums">
                      {dias === 1 ? 'Al día siguiente' : `A los ${dias} días`}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
            <Accordion
              items={[
                {
                  id: 'por-que',
                  titulo: '¿Por qué repasar así?',
                  contenido: (
                    <p className="text-body-md text-on-surface-variant">
                      Repasar cuando estás a punto de olvidar algo fija el recuerdo mucho mejor que volver a estudiar todo. Por eso los intervalos se alargan a
                      medida que aciertas.
                    </p>
                  ),
                },
                {
                  id: 'agregar',
                  titulo: '¿Cómo agrego preguntas?',
                  contenido: (
                    <p className="text-body-md text-on-surface-variant">
                      Las que fallas en mini-tests entran solas. Desde la explicación de cualquier pregunta de un ensayo puedes guardarla con «Guardar en mi
                      cuaderno».
                    </p>
                  ),
                },
              ]}
            />
          </aside>
        </div>
      )}

      <ModalConfirmacion
        abierto={Boolean(porQuitar)}
        titulo="¿Quitar esta pregunta?"
        descripcion="Dejará de aparecer en tus repasos. Puedes volver a guardarla desde la explicación del ensayo."
        textoConfirmar="Quitar"
        peligro
        cargando={quitar.isPending}
        onCancelar={() => setPorQuitar(null)}
        onConfirmar={() => porQuitar && quitar.mutate(porQuitar.id, { onSettled: () => setPorQuitar(null) })}
      />
    </Pagina>
  );
}

function Cifra({ etiqueta, valor, destacado }: { etiqueta: string; valor: number; destacado?: boolean }) {
  return (
    <div className="px-4 py-4 md:px-6">
      <dt className="text-caption text-on-surface-variant">{etiqueta}</dt>
      <dd className={cn('mt-1 text-headline-md font-bold tabular-nums', destacado ? 'text-secondary' : 'text-on-surface')}>{valor}</dd>
    </div>
  );
}

function ItemCuaderno({ item, onQuitar }: { item: DTOItemCuaderno; onQuitar: () => void }) {
  const cuando = cuandoRepasar(item.proximoRepaso);
  const atrasada = cuando.startsWith('Atrasada') || cuando === 'Hoy';
  return (
    <li className="flex gap-4 rounded-md border border-border bg-surface-container-lowest p-4 md:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-caption font-semibold uppercase tracking-[0.06em] text-primary">{MATERIA_ETIQUETA[item.materiaCodigo] ?? item.materiaCodigo}</span>
          {item.ejeNombre && <span className="text-caption text-on-surface-variant">{item.ejeNombre}</span>}
        </div>
        <TextoMat texto={item.enunciado} className="mt-2 line-clamp-3 text-body-md text-on-surface" />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <IndicadorCaja caja={item.caja} dominada={item.dominada} />
          {!item.dominada && (
            <span className={cn('inline-flex items-center gap-1 text-caption', atrasada ? 'font-medium text-secondary' : 'text-on-surface-variant')}>
              <Icono nombre="event" className="text-base" />
              {cuando}
            </span>
          )}
          <span className="text-caption text-on-surface-variant">
            {ORIGEN[item.origen]} · {item.repasos} {item.repasos === 1 ? 'repaso' : 'repasos'}
          </span>
        </div>
      </div>
      <BotonIcono icono="delete" etiqueta="Quitar del cuaderno" tamano="sm" onClick={onQuitar} className="self-start" />
    </li>
  );
}
