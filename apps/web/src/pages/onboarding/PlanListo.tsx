import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { DTODistribucion, DTOTareaPlan } from '@paes-pro/shared';
import { formatearFecha, MATERIA_ETIQUETA, nombreDia, indiceDiaSemana } from '@paes-pro/shared';
import { recargarUsuario, useSesion } from '@/app/sesion';
import { ApiError } from '@/lib/api';
import { usePlanGenerado } from '@/lib/data/onboarding';
import { diasHasta, fechaPaesConfigurada } from '@/config/marca';
import { useContador, useTitulo } from '@/hooks/utiles';
import { MarcoOnboarding } from '@/components/onboarding/Pasos';
import { Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

/** Tonos azules para la distribución: el naranjo es solo de IA y el dorado de Premium. */
const TONOS = ['bg-primary', 'bg-primary-container', 'bg-inverse-primary', 'bg-on-primary-fixed-variant', 'bg-outline'];

export default function PlanListo() {
  useTitulo('Tu plan está listo');
  const navigate = useNavigate();
  const usuario = useSesion((s) => s.usuario);
  const { generado, activo } = usePlanGenerado();
  const [entrando, setEntrando] = useState(false);

  if (!generado && activo.isError) {
    // Sin plan (se llegó aquí sin pasar por la meta): de vuelta al primer paso.
    if (activo.error instanceof ApiError && activo.error.status === 404) return <Navigate to="/onboarding/meta" replace />;
  }

  const plan = generado?.plan ?? activo.data ?? null;
  const resumen = generado?.resumen ?? {
    carrera: usuario?.carrera?.nombre ?? null,
    universidad: usuario?.universidad?.nombre ?? null,
    puntajeMeta: usuario?.puntajeMeta ?? null,
    puntajeActual: null,
    horasSemana: plan?.horasSemana ?? usuario?.horasSemana ?? 0,
    semanas: plan?.semanas ?? 0,
    fechaExamen: plan?.fechaExamen ?? usuario?.fechaExamen ?? null,
    sesionesSemana: null as number | null,
  };

  async function irAlDashboard() {
    setEntrando(true);
    try {
      await recargarUsuario();
      navigate('/app', { replace: true });
    } catch {
      setEntrando(false);
      toast.error('No pudimos abrir tu dashboard. Intenta de nuevo.');
    }
  }

  const fechaExamen = resumen.fechaExamen ?? fechaPaesConfigurada();
  const dias = fechaExamen ? diasHasta(fechaExamen) : null;
  const primeras = (plan?.tareas ?? []).filter((t) => t.estado !== 'completada').slice(0, 3);

  return (
    <MarcoOnboarding
      paso={3}
      total={3}
      acciones={
        <>
          <Button variante="fantasma" iconoIzquierdo="tune" onClick={() => navigate('/onboarding/meta')}>
            Ajustar respuestas
          </Button>
          <Button tamano="lg" iconoDerecho="arrow_forward" cargando={entrando} onClick={irAlDashboard} disabled={!plan}>
            Ver mi dashboard
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success-container text-success">
          <Icono nombre="task_alt" className="text-3xl" />
        </span>
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">¡Tu plan está listo!</h1>
          <p className="mt-1 text-body-md text-on-surface-variant text-pretty">
            Lo armamos con tu meta, tu tiempo y las pruebas que rendirás. Se ajusta solo con cada ensayo que hagas.
          </p>
        </div>
      </div>

      {!plan ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3" role="status" aria-label="Cargando tu plan">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-48 rounded-md md:col-span-3" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Dato icono="track_changes" etiqueta="Objetivo principal">
              <p className="text-body-lg font-semibold text-on-surface">{resumen.carrera ?? 'Sin carrera definida'}</p>
              {resumen.universidad && <p className="text-label-md text-on-surface-variant">{resumen.universidad}</p>}
              {resumen.puntajeMeta !== null && <PuntajeMeta meta={resumen.puntajeMeta} actual={resumen.puntajeActual} />}
            </Dato>
            <Dato icono="schedule" etiqueta="Compromiso semanal">
              <p className="text-headline-md font-bold text-on-surface tabular-nums">
                {resumen.horasSemana}
                <span className="ml-1 text-body-md font-normal text-on-surface-variant">horas / semana</span>
              </p>
              <p className="text-label-md text-on-surface-variant">
                {resumen.sesionesSemana ? `${resumen.sesionesSemana} sesiones` : 'Sesiones'}
                {usuario?.diasDisponibles?.length ? ` repartidas en ${usuario.diasDisponibles.length} días` : ''}
              </p>
            </Dato>
            <Dato icono="event" etiqueta="Fecha de la PAES">
              <p className="text-headline-md font-bold text-on-surface tabular-nums">
                {dias ?? 'Por confirmar'}
                {dias !== null && <span className="ml-1 text-body-md font-normal text-on-surface-variant">días</span>}
              </p>
              <p className="text-label-md text-on-surface-variant">
                {fechaExamen ? formatearFecha(fechaExamen) : 'Consulta el calendario del DEMRE y ajusta tu plan'}
              </p>
            </Dato>
          </div>

          <Distribucion distribucion={plan.distribucion} />
          {primeras.length > 0 && <PrimerasSesiones tareas={primeras} />}
        </>
      )}
    </MarcoOnboarding>
  );
}

function Dato({ icono, etiqueta, children }: { icono: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-surface-container-low p-5">
      <p className="flex items-center gap-2 text-label-md font-medium text-on-surface-variant">
        <Icono nombre={icono} className="text-xl text-primary" />
        {etiqueta}
      </p>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  );
}

function PuntajeMeta({ meta, actual }: { meta: number; actual: number | null }) {
  const [valor, ref] = useContador(meta);
  return (
    <p className="pt-1 text-label-md text-on-surface">
      Puntaje meta:{' '}
      <strong ref={ref as React.RefObject<HTMLElement>} className="font-bold text-primary tabular-nums">
        {valor}
      </strong>
      {actual !== null && <span className="text-on-surface-variant"> · hoy {actual}</span>}
    </p>
  );
}

function Distribucion({ distribucion }: { distribucion: DTODistribucion[] }) {
  const orden = [...distribucion].sort((a, b) => b.porcentaje - a.porcentaje);
  return (
    <section aria-labelledby="titulo-distribucion" className="mt-8">
      <h2 id="titulo-distribucion" className="flex items-center gap-2 text-body-lg font-semibold text-on-surface">
        <Icono nombre="pie_chart" className="text-primary" />
        Distribución de tus horas
      </h2>
      {/* Barra apilada: la proporción de un vistazo; la lista debajo da los números. */}
      <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-surface-container" aria-hidden="true">
        {orden.map((d, i) => (
          <span key={d.materiaCodigo} className={cn('h-full', TONOS[i % TONOS.length])} style={{ width: `${d.porcentaje}%` }} />
        ))}
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {orden.map((d, i) => (
          <li key={d.materiaCodigo} className="flex items-center gap-3">
            <span aria-hidden="true" className={cn('size-3 shrink-0 rounded-sm', TONOS[i % TONOS.length])} />
            <span className="flex-1 text-body-md text-on-surface">{MATERIA_ETIQUETA[d.materiaCodigo] ?? d.materiaNombre}</span>
            <span className="text-label-md text-on-surface-variant tabular-nums">{d.horasSemana.toLocaleString('es-CL', { maximumFractionDigits: 1 })} h</span>
            <span className="w-12 text-right text-body-md font-semibold text-on-surface tabular-nums">{d.porcentaje}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PrimerasSesiones({ tareas }: { tareas: DTOTareaPlan[] }) {
  return (
    <section aria-labelledby="titulo-primeras" className="mt-8 border-t border-border pt-8">
      <h2 id="titulo-primeras" className="text-body-lg font-semibold text-on-surface">
        Tus primeras sesiones
      </h2>
      <ol className="mt-4 space-y-2">
        {tareas.map((t) => {
          const fecha = new Date(`${t.fechaPlanificada}T00:00:00`);
          return (
            <li key={t.id} className="flex items-center gap-4 rounded-md border border-border px-4 py-3">
              <span className="w-24 shrink-0 text-label-md font-semibold text-primary">{nombreDia(indiceDiaSemana(fecha))}</span>
              <span className="min-w-0 flex-1 text-body-md text-on-surface">{t.titulo}</span>
              <span className="shrink-0 text-caption text-on-surface-variant tabular-nums">{t.duracionMin} min</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
