import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { DTOPlanSemana, DTOTareaPlan } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { usePlanSemana, useActualizarTarea, useRegenerarPlan } from '@/lib/data/plan';
import { useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Card, EncabezadoSeccion } from '@/components/ui/Card';
import { Button, BotonIcono } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/Navegacion';
import { ModalConfirmacion } from '@/components/ui/Modal';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TarjetaTarea } from '@/components/plan/TarjetaTarea';
import { desdeISO, diasDeSemana, fechaLarga, formatearDuracion, hoyISO, lunesDe, rangoSemana, sumarDias } from '@/components/plan/fechas';

type Vista = 'calendario' | 'lista';

export default function PlanEstudio() {
  useTitulo('Plan de estudio');
  const [params, setParams] = useSearchParams();
  const hoy = hoyISO();
  const lunes = lunesDe(params.get('semana') ?? hoy);
  const vista: Vista = params.get('vista') === 'lista' ? 'lista' : 'calendario';
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  const dia = diaElegido && lunesDe(diaElegido) === lunes ? diaElegido : lunes === lunesDe(hoy) ? hoy : lunes;

  const plan = usePlanSemana(lunes);
  const actualizar = useActualizarTarea(lunes);
  const regenerar = useRegenerarPlan();
  const [confirmar, setConfirmar] = useState(false);

  const cambiarParam = (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params);
    if (valor === null) p.delete(clave);
    else p.set(clave, valor);
    setParams(p, { replace: true });
  };
  const irASemana = (nuevoLunes: string) => {
    cambiarParam('semana', nuevoLunes === lunesDe(hoy) ? null : nuevoLunes);
    setDiaElegido(null);
  };

  const sinPlan = plan.error instanceof ApiError && plan.error.status === 404;

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Plan de estudio"
        descripcion="Organiza tu preparación y sigue tu avance día a día."
        acciones={
          !sinPlan && (
            <>
              <SegmentedControl<Vista>
                etiquetaAria="Vista del plan"
                valor={vista}
                onCambio={(v) => cambiarParam('vista', v === 'lista' ? 'lista' : null)}
                opciones={[
                  { valor: 'calendario', etiqueta: 'Calendario', icono: 'calendar_view_week' },
                  { valor: 'lista', etiqueta: 'Lista', icono: 'view_list' },
                ]}
              />
              <Button variante="fantasma" iconoIzquierdo="autorenew" onClick={() => setConfirmar(true)}>
                Recalcular
              </Button>
            </>
          )
        }
      />

      {plan.isLoading ? (
        <EsqueletoPlan />
      ) : sinPlan ? (
        <EstadoVacio
          icono="calendar_add_on"
          titulo="Todavía no tienes un plan de estudio"
          descripcion="Lo armamos con tu meta, tus horas disponibles y tus resultados: reparte las sesiones entre las pruebas que más puntaje te pueden dar."
          accion={
            <Button cargando={regenerar.isPending} onClick={() => regenerar.mutate({})} iconoIzquierdo="auto_awesome">
              Generar mi plan
            </Button>
          }
        />
      ) : plan.isError || !plan.data ? (
        <EstadoError titulo="No pudimos cargar tu plan" onReintentar={() => void plan.refetch()} cargando={plan.isFetching} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <ContenidoPlan
              datos={plan.data}
              vista={vista}
              lunes={lunes}
              dia={dia}
              hoy={hoy}
              onElegirDia={setDiaElegido}
              onSemana={irASemana}
              onCambiar={(id, c) => actualizar.mutate({ id, ...c })}
              cargando={plan.isFetching && plan.isPlaceholderData}
            />
          </div>
          <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Resumen de la semana">
            <TarjetaRacha datos={plan.data} />
            <ProgresoSemanal datos={plan.data} />
            <Distribucion datos={plan.data} />
          </aside>
        </div>
      )}

      <ModalConfirmacion
        abierto={confirmar}
        titulo="¿Recalcular tu plan?"
        descripcion="Volvemos a repartir las sesiones de las próximas semanas según tu avance y tus últimos resultados. Las tareas que ya completaste se mantienen."
        textoConfirmar="Recalcular plan"
        cargando={regenerar.isPending}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => regenerar.mutate({}, { onSettled: () => setConfirmar(false) })}
      />
    </Pagina>
  );
}

/* -------------------------------------------------------------------------- */

interface PropsContenido {
  datos: DTOPlanSemana;
  vista: Vista;
  lunes: string;
  dia: string;
  hoy: string;
  onElegirDia: (d: string) => void;
  onSemana: (lunes: string) => void;
  onCambiar: (id: string, c: { estado?: DTOTareaPlan['estado']; fechaPlanificada?: string }) => void;
  cargando: boolean;
}

function ContenidoPlan({ datos, vista, lunes, dia, hoy, onElegirDia, onSemana, onCambiar, cargando }: PropsContenido) {
  const porDia = useMemo(() => {
    const mapa = new Map<string, DTOTareaPlan[]>();
    for (const t of datos.tareas) mapa.set(t.fechaPlanificada, [...(mapa.get(t.fechaPlanificada) ?? []), t]);
    return mapa;
  }, [datos.tareas]);

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const alSoltar = (e: DragEndEvent) => {
    const destino = e.over?.id;
    const tarea = datos.tareas.find((t) => t.id === e.active.id);
    if (typeof destino === 'string' && tarea && destino !== tarea.fechaPlanificada) {
      onCambiar(tarea.id, { fechaPlanificada: destino });
    }
  };

  return (
    <DndContext sensors={sensores} onDragEnd={alSoltar} accessibility={{ announcements: anuncios(datos.tareas) }}>
      <SelectorSemana lunes={lunes} dia={dia} hoy={hoy} porDia={porDia} onElegirDia={onElegirDia} onSemana={onSemana} conDia={vista === 'calendario'} />

      <div className={cn('mt-8 transition-opacity duration-200', cargando && 'opacity-60')} aria-busy={cargando}>
        {vista === 'calendario' ? (
          <section aria-labelledby="titulo-dia">
            <EncabezadoSeccion
              id="titulo-dia"
              titulo={dia === hoy ? 'Tareas para hoy' : <span className="capitalize">{fechaLarga(dia)}</span>}
              descripcion={resumenDia(porDia.get(dia) ?? [])}
            />
            <ListaTareas tareas={porDia.get(dia) ?? []} onCambiar={onCambiar} vacio={dia < hoy ? 'Este día no tuvo tareas.' : 'Día libre: no hay tareas planificadas.'} />
            {(porDia.get(dia)?.length ?? 0) > 0 && (
              <p className="mt-4 flex items-center gap-2 text-caption text-on-surface-variant">
                <Icono nombre="drag_indicator" className="text-base" />
                Arrastra una tarea a otro día de la semana para reprogramarla, o usa su menú.
              </p>
            )}
          </section>
        ) : (
          <div className="flex flex-col gap-8">
            {diasDeSemana(lunes).map((d) => {
              const tareas = porDia.get(d) ?? [];
              return (
                <section key={d} aria-labelledby={`dia-${d}`}>
                  <h2 id={`dia-${d}`} className="flex items-baseline gap-2 text-body-lg font-semibold text-on-surface">
                    <span className="capitalize">{fechaLarga(d)}</span>
                    {d === hoy && <span className="text-caption font-semibold text-primary">Hoy</span>}
                    <span className="ml-auto text-caption font-normal text-on-surface-variant">{resumenDia(tareas)}</span>
                  </h2>
                  <ListaTareas tareas={tareas} onCambiar={onCambiar} vacio="Sin tareas." compacta />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </DndContext>
  );
}

function anuncios(tareas: DTOTareaPlan[]) {
  const nombre = (id: string | number) => tareas.find((t) => t.id === id)?.titulo ?? 'la tarea';
  const dia = (id: string | number | undefined) => (typeof id === 'string' ? fechaLarga(id) : 'ningún día');
  return {
    onDragStart: ({ active }: { active: { id: string | number } }) => `Moviendo ${nombre(active.id)}.`,
    onDragOver: ({ over }: { over: { id: string | number } | null }) => `Sobre ${dia(over?.id)}.`,
    onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      over ? `${nombre(active.id)} pasó al ${dia(over.id)}.` : 'Movimiento cancelado.',
    onDragCancel: () => 'Movimiento cancelado.',
  };
}

function resumenDia(tareas: DTOTareaPlan[]): string | undefined {
  if (!tareas.length) return undefined;
  const hechas = tareas.filter((t) => t.estado === 'completada').length;
  const minutos = tareas.filter((t) => t.estado !== 'omitida').reduce((s, t) => s + t.duracionMin, 0);
  return `${hechas} de ${tareas.length} completadas · ${formatearDuracion(minutos)}`;
}

function SelectorSemana({
  lunes,
  dia,
  hoy,
  porDia,
  onElegirDia,
  onSemana,
  conDia,
}: {
  lunes: string;
  dia: string;
  hoy: string;
  porDia: Map<string, DTOTareaPlan[]>;
  onElegirDia: (d: string) => void;
  onSemana: (l: string) => void;
  conDia: boolean;
}) {
  const esSemanaActual = lunes === lunesDe(hoy);
  return (
    <Card padding="sm" className="md:px-4">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <p className="text-label-md font-semibold text-on-surface tabular-nums">{rangoSemana(lunes)}</p>
        {!esSemanaActual && (
          <button type="button" onClick={() => onSemana(lunesDe(hoy))} className="min-h-9 rounded px-2 text-label-md font-medium text-primary hover:bg-primary/8">
            Volver a hoy
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <BotonIcono icono="chevron_left" etiqueta="Semana anterior" onClick={() => onSemana(sumarDias(lunes, -7))} />
        <ul className="grid flex-1 grid-cols-7 gap-1">
          {diasDeSemana(lunes).map((d) => (
            <li key={d}>
              <DiaSoltable fecha={d} hoy={hoy} activo={conDia && d === dia} tareas={porDia.get(d) ?? []} onElegir={() => onElegirDia(d)} />
            </li>
          ))}
        </ul>
        <BotonIcono icono="chevron_right" etiqueta="Semana siguiente" onClick={() => onSemana(sumarDias(lunes, 7))} />
      </div>
    </Card>
  );
}

function DiaSoltable({ fecha, hoy, activo, tareas, onElegir }: { fecha: string; hoy: string; activo: boolean; tareas: DTOTareaPlan[]; onElegir: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: fecha, disabled: fecha < hoy });
  const d = desdeISO(fecha);
  const pendientes = tareas.filter((t) => t.estado === 'pendiente' || t.estado === 'en_curso').length;
  const todasListas = tareas.length > 0 && pendientes === 0;
  const pasado = fecha < hoy;
  const diaSemana = d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onElegir}
      aria-pressed={activo}
      aria-label={`${fechaLarga(fecha)}${tareas.length ? `, ${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}` : ', sin tareas'}${fecha === hoy ? ', hoy' : ''}`}
      className={cn(
        'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded py-2 transition-[background-color,color,box-shadow] duration-150',
        activo ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container',
        !activo && pasado && 'text-outline',
        !activo && !pasado && 'text-on-surface',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest',
      )}
    >
      <span className={cn('text-caption capitalize', activo ? 'text-on-primary/90' : fecha === hoy ? 'font-semibold text-primary' : '')}>{diaSemana}</span>
      <span className="text-headline-md font-semibold leading-7 tabular-nums">{d.getDate()}</span>
      <span aria-hidden="true" className="flex h-1.5 items-center">
        {todasListas ? (
          <Icono nombre="check" className={cn('text-xs', activo ? 'text-on-primary' : 'text-success')} />
        ) : tareas.length > 0 ? (
          <span className={cn('size-1.5 rounded-full', activo ? 'bg-on-primary' : 'bg-primary')} />
        ) : null}
      </span>
    </button>
  );
}

function ListaTareas({ tareas, onCambiar, vacio, compacta }: { tareas: DTOTareaPlan[]; onCambiar: PropsContenido['onCambiar']; vacio: string; compacta?: boolean }) {
  if (!tareas.length) {
    return <p className="mt-3 rounded-md border border-dashed border-outline-variant px-4 py-5 text-center text-body-md text-on-surface-variant">{vacio}</p>;
  }
  const orden: Record<DTOTareaPlan['estado'], number> = { en_curso: 0, pendiente: 1, completada: 2, omitida: 3 };
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {[...tareas]
        .sort((a, b) => orden[a.estado] - orden[b.estado])
        .map((t) => (
          <li key={t.id}>
            <Arrastrable id={t.id} deshabilitado={t.estado === 'completada'}>
              <TarjetaTarea tarea={t} compacta={compacta} onCambiar={(c) => onCambiar(t.id, c)} />
            </Arrastrable>
          </li>
        ))}
    </ul>
  );
}

function Arrastrable({ id, deshabilitado, children }: { id: string; deshabilitado: boolean; children: ReactNode }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id, disabled: deshabilitado });
  return (
    <div
      ref={setNodeRef}
      className={cn('relative flex items-stretch gap-1', isDragging && 'z-20 opacity-90 [&_article]:shadow-float')}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
    >
      {!deshabilitado && (
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label="Arrastrar para reprogramar"
          className="hidden w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-outline hover:text-on-surface-variant active:cursor-grabbing md:flex"
        >
          <Icono nombre="drag_indicator" className="text-xl" />
        </button>
      )}
      <div className={cn('min-w-0 flex-1', deshabilitado && 'md:pl-7')}>{children}</div>
    </div>
  );
}

function TarjetaRacha({ datos }: { datos: DTOPlanSemana }) {
  const { actual, maxima, completoHoy } = datos.racha;
  const faltan = maxima - actual;
  const mensaje =
    actual === 0
      ? 'Completa una tarea hoy para empezar una racha nueva.'
      : faltan > 0
        ? `¡Sigue así! Estás a ${faltan} ${faltan === 1 ? 'día' : 'días'} de tu récord.`
        : actual > 1
          ? '¡Estás en tu mejor racha! Cada día nuevo es récord.'
          : '¡Buen comienzo! Vuelve mañana para sumar otro día.';
  return (
    <Card radio="lg" className="text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary-fixed text-secondary-container">
        <Icono nombre="local_fire_department" relleno className="text-4xl" />
      </span>
      <h2 className="mt-4 text-headline-md text-on-surface">Racha de estudio</h2>
      <p className="mt-1 text-primary">
        <span className="text-display font-bold tabular-nums">{actual}</span>{' '}
        <span className="text-body-lg text-on-surface-variant">{actual === 1 ? 'día seguido' : 'días seguidos'}</span>
      </p>
      <p className="mx-auto mt-2 max-w-xs text-caption text-on-surface-variant">{mensaje}</p>
      {completoHoy && (
        <p className="mt-3 inline-flex items-center gap-1 text-caption font-medium text-success">
          <Icono nombre="check_circle" relleno className="text-base" /> Hoy ya sumaste
        </p>
      )}
    </Card>
  );
}

function ProgresoSemanal({ datos }: { datos: DTOPlanSemana }) {
  const items = datos.progresoSemanal.filter((p) => p.total > 0);
  return (
    <Card como="section" aria-labelledby="titulo-progreso">
      <h2 id="titulo-progreso" className="text-body-lg font-semibold text-on-surface">
        Progreso semanal
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-body-md text-on-surface-variant">No hay tareas esta semana.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {items.map((p) => {
            const pct = p.minutosTotales ? (p.minutosCompletados / p.minutosTotales) * 100 : 0;
            return (
              <li key={p.materiaCodigo}>
                <ProgressBar
                  valor={pct}
                  mostrarValor
                  etiqueta={
                    <span>
                      {MATERIA_ETIQUETA[p.materiaCodigo] ?? p.materiaNombre}{' '}
                      <span className="text-outline">
                        · {p.completadas}/{p.total}
                      </span>
                    </span>
                  }
                  etiquetaAria={`Progreso semanal en ${p.materiaNombre}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Distribucion({ datos }: { datos: DTOPlanSemana }) {
  return (
    <Card como="section" aria-labelledby="titulo-distribucion">
      <h2 id="titulo-distribucion" className="text-body-lg font-semibold text-on-surface">
        Tu semana ideal
      </h2>
      <p className="mt-1 text-caption text-on-surface-variant">
        {datos.horasSemana} horas a la semana
        {datos.fechaExamen && `, hasta el ${desdeISO(datos.fechaExamen).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`}.
      </p>
      <ul className="mt-4 divide-y divide-border">
        {datos.distribucion.map((d) => (
          <li key={d.materiaCodigo} className="flex items-center justify-between gap-3 py-2.5 text-body-md">
            <span className="text-on-surface">{MATERIA_ETIQUETA[d.materiaCodigo] ?? d.materiaNombre}</span>
            <span className="text-on-surface-variant tabular-nums">
              {d.horasSemana.toLocaleString('es-CL', { maximumFractionDigits: 1 })} h · {d.porcentaje}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EsqueletoPlan() {
  return (
    <Cargando etiqueta="Cargando tu plan…" className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Skeleton className="h-32 rounded-md" />
        <Skeleton className="mt-8 h-8 w-56" />
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    </Cargando>
  );
}
