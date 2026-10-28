import { Link } from 'react-router';
import type { DTOAreaMejorar, DTODashboardCompleto, DTORecomendacionCard } from '@paes-pro/shared';
import { MATERIA_ETIQUETA, PRUEBAS_CORTA, formatearFecha, type Prueba } from '@paes-pro/shared';
import { useDashboard } from '@/lib/data/dashboard';
import { useActualizarTarea } from '@/lib/data/plan';
import { useContador, useTitulo } from '@/hooks/utiles';
import { diasHasta, fechaPaesConfigurada } from '@/config/marca';
import { cn } from '@/lib/cn';
import { Pagina } from '@/components/ui/Pagina';
import { Card, EncabezadoSeccion } from '@/components/ui/Card';
import { BotonEnlace } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar, ProgressCircular } from '@/components/ui/ProgressBar';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { EtiquetaMateria } from '@/components/ui/Datos';
import { TarjetaTarea } from '@/components/plan/TarjetaTarea';
import { aISO, lunesDe } from '@/components/plan/fechas';
import { GraficoEvolucion } from '@/components/dashboard/GraficoEvolucion';

export default function Dashboard() {
  useTitulo('Inicio');
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  if (isLoading) return <EsqueletoDashboard />;
  if (isError || !data) {
    return (
      <Pagina>
        <EstadoError titulo="No pudimos cargar tu inicio" onReintentar={() => void refetch()} cargando={isFetching} />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Saludo datos={data} />
      {!data.usuario.esPremium && <BannerPremium />}

      <div className="grid gap-6 lg:grid-cols-12">
        <Recomendado rec={data.recomendado} className="lg:col-span-8" />
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Objetivo objetivo={data.objetivo} />
          <EnsayosMes cantidad={data.ensayosMes} limite={data.limiteEnsayosMes} />
        </div>

        <TareasHoy datos={data} className="lg:col-span-8" />
        <div className="flex flex-col gap-6 lg:col-span-4">
          <CuentaRegresiva fechaExamen={data.usuario.fechaExamen} />
          <RepasarHoy cantidad={data.repasoHoy} />
        </div>

        <Evolucion datos={data} className="lg:col-span-12" />
      </div>

      <AreasMejorar areas={data.areasMejorar} intentos={data.intentosAnalizados} />
    </Pagina>
  );
}

/* -------------------------------------------------------------------------- */

function Saludo({ datos }: { datos: DTODashboardCompleto }) {
  const { racha, usuario } = datos;
  const frase =
    racha.completoHoy
      ? 'Ya sumaste un día más a tu racha. Lo que estudies ahora es ventaja.'
      : usuario.carrera
        ? `Cada sesión te acerca a ${usuario.carrera}. Hoy es un buen día para avanzar.`
        : 'Tu camino a la universidad está en marcha. Hoy es un buen día para avanzar.';
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 md:mb-8">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
          ¡Hola, <span className="text-primary">{usuario.nombre}</span>!
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant text-pretty md:text-body-lg">{frase}</p>
      </div>
      <div
        className="flex items-center gap-3 rounded-md border border-border bg-surface-container-lowest px-4 py-3 shadow-card"
        aria-label={`Racha actual: ${racha.actual} ${racha.actual === 1 ? 'día' : 'días'}`}
      >
        <span className="flex size-10 items-center justify-center rounded bg-secondary-fixed text-secondary-container">
          <Icono nombre="local_fire_department" relleno />
        </span>
        <div>
          <p className="text-caption text-on-surface-variant">Racha actual</p>
          <p className="text-on-surface">
            <span className="text-headline-md font-bold tabular-nums">{racha.actual}</span>{' '}
            <span className="text-body-md text-on-surface-variant">{racha.actual === 1 ? 'día' : 'días'}</span>
          </p>
        </div>
        <span className={cn('ml-1 hidden text-caption sm:block', racha.completoHoy ? 'text-success' : 'text-on-surface-variant')}>
          {racha.completoHoy ? (
            <span className="inline-flex items-center gap-1">
              <Icono nombre="check_circle" relleno className="text-base" /> Hoy listo
            </span>
          ) : (
            `Récord: ${racha.maxima}`
          )}
        </span>
      </div>
    </header>
  );
}

function BannerPremium() {
  return (
    <section
      aria-labelledby="banner-premium"
      className="mb-6 flex flex-col gap-4 rounded-lg bg-primary-container p-5 text-white md:flex-row md:items-center md:gap-6 md:p-6"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-primary">
        <Icono nombre="rocket_launch" relleno />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="banner-premium" className="text-body-lg font-semibold">
          Desbloquea todo tu potencial
        </h2>
        <p className="mt-0.5 text-body-md text-white/85">Ensayos ilimitados, explicaciones en video, tutor IA y analítica avanzada.</p>
      </div>
      <BotonEnlace to="/app/premium" variante="premium" iconoDerecho="arrow_forward" className="self-start md:self-center">
        Conocer Premium
      </BotonEnlace>
    </section>
  );
}

const ICONO_REC: Record<DTORecomendacionCard['tipo'], string> = {
  ensayo: 'edit_document',
  contenido: 'smart_display',
  repaso: 'autorenew',
};

function Recomendado({ rec, className }: { rec: DTORecomendacionCard | null; className?: string }) {
  if (!rec) {
    return (
      <Card radio="lg" padding="lg" className={cn('flex flex-col justify-center', className)}>
        <EstadoVacio
          compacto
          icono="explore"
          titulo="Elige por dónde partir"
          descripcion="Rinde un ensayo de diagnóstico y te recomendaremos qué estudiar según tus resultados."
          accion={<BotonEnlace to="/app/ensayos">Ver ensayos</BotonEnlace>}
        />
      </Card>
    );
  }
  return (
    <Card como="section" radio="lg" padding="lg" aria-labelledby="titulo-recomendado" className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tono="naranjo" icono="auto_awesome" iconoRelleno>
          Recomendado para ti
        </Chip>
        {rec.materiaCodigo && <EtiquetaMateria codigo={rec.materiaCodigo} />}
      </div>
      <h2 id="titulo-recomendado" className="mt-5 max-w-2xl text-headline-lg-mobile text-on-surface text-balance md:text-headline-lg">
        {rec.titulo}
      </h2>
      <p className="mt-3 max-w-2xl text-body-lg text-on-surface-variant text-pretty">{rec.descripcion}</p>
      <p className="mt-4 flex max-w-2xl items-start gap-2 text-label-md text-on-surface-variant">
        <Icono nombre="lightbulb" className="text-lg text-secondary-container" />
        <span>{rec.motivo}</span>
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
        <BotonEnlace to={rec.url} tamano="lg" iconoDerecho="arrow_forward">
          Comenzar
        </BotonEnlace>
        <span className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <Icono nombre={ICONO_REC[rec.tipo]} className="text-lg" />
          {rec.detalle}
        </span>
      </div>
    </Card>
  );
}

function Objetivo({ objetivo }: { objetivo: DTODashboardCompleto['objetivo'] }) {
  const { actual, meta, brecha } = objetivo;
  const [animado, ref] = useContador(actual ?? 0);
  const porcentaje = actual && meta ? Math.min(100, (actual / meta) * 100) : 0;
  const superada = brecha !== null && brecha <= 0;

  return (
    <Card como="section" radio="lg" aria-labelledby="titulo-objetivo">
      <div className="flex items-center justify-between">
        <h2 id="titulo-objetivo" className="text-label-md font-semibold uppercase text-on-surface">
          Objetivo PAES
        </h2>
        <Link to="/app/estadisticas" className="rounded text-caption font-medium text-primary hover:underline">
          Ver estadísticas
        </Link>
      </div>
      <div className="mt-4 flex justify-center">
        <ProgressCircular
          valor={porcentaje}
          tamano={152}
          grosor={12}
          tono={superada ? 'exito' : 'primario'}
          etiquetaAria={actual ? `Puntaje actual ${actual} de una meta de ${meta ?? 'sin definir'}` : 'Aún sin puntaje'}
        >
          <span ref={ref as React.RefObject<HTMLSpanElement>} className="text-display font-bold text-primary tabular-nums leading-none">
            {actual ? animado : '—'}
          </span>
          <span className="mt-1 text-caption text-on-surface-variant">{actual ? 'Actual' : 'Sin ensayos'}</span>
        </ProgressCircular>
      </div>
      <dl className="mt-5 grid grid-cols-2 border-t border-border pt-4">
        <div>
          <dt className="text-caption text-on-surface-variant">Meta</dt>
          <dd className="text-body-lg font-semibold text-on-surface tabular-nums">
            {meta ?? (
              <Link to="/app/perfil" className="text-label-md text-primary hover:underline">
                Definir meta
              </Link>
            )}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-caption text-on-surface-variant">{superada ? 'Sobre la meta' : 'Brecha'}</dt>
          <dd className={cn('text-body-lg font-semibold tabular-nums', brecha === null ? 'text-on-surface-variant' : superada ? 'text-success' : 'text-secondary')}>
            {brecha === null ? '—' : superada ? `+${Math.abs(brecha)}` : brecha}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function EnsayosMes({ cantidad, limite }: { cantidad: number; limite: number | null }) {
  return (
    <Card padding="sm" className="flex items-center gap-4 px-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <Icono nombre="task_alt" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-on-surface">Ensayos rendidos</p>
        <p className="text-caption text-on-surface-variant">{limite ? `De ${limite} incluidos en tu plan este mes` : 'Este mes'}</p>
        {limite !== null && <ProgressBar valor={(cantidad / limite) * 100} etiquetaAria="Ensayos usados este mes" grosor="fino" className="mt-2" />}
      </div>
      <p className="text-headline-md font-bold text-primary tabular-nums">
        {cantidad}
        {limite !== null && <span className="text-body-md font-normal text-on-surface-variant">/{limite}</span>}
      </p>
    </Card>
  );
}

function TareasHoy({ datos, className }: { datos: DTODashboardCompleto; className?: string }) {
  const actualizar = useActualizarTarea(lunesDe(aISO(new Date())));
  const tareas = datos.tareasHoy;
  const hechas = tareas.filter((t) => t.estado === 'completada').length;

  return (
    <section aria-labelledby="titulo-tareas" className={className}>
      <EncabezadoSeccion
        id="titulo-tareas"
        titulo="Tareas de hoy"
        descripcion={tareas.length ? `${hechas} de ${tareas.length} completadas` : undefined}
        accion={
          <Link to="/app/plan" className="inline-flex min-h-10 items-center gap-1 rounded text-label-md font-medium text-primary hover:underline">
            Ver plan completo <Icono nombre="chevron_right" className="text-lg" />
          </Link>
        }
      />
      <div className="mt-4 flex flex-col gap-3">
        {tareas.length === 0 ? (
          <EstadoVacio
            compacto
            icono="event_available"
            titulo="Hoy no tienes tareas en tu plan"
            descripcion="Aprovecha de repasar tus errores o adelantar una lección."
            accion={<BotonEnlace to="/app/contenidos" variante="secundario">Explorar contenidos</BotonEnlace>}
          />
        ) : (
          tareas.map((t) => (
            <TarjetaTarea
              key={t.id}
              tarea={t}
              compacta
              onCambiar={(c) => {
                actualizar.mutate({ id: t.id, ...c });
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CuentaRegresiva({ fechaExamen }: { fechaExamen: string | null }) {
  const fecha = fechaExamen ?? fechaPaesConfigurada();
  if (!fecha) return (
    <Card como="section">
      <h2 className="text-body-md font-semibold">Fecha de tu PAES</h2>
      <p className="mt-2 text-label-md text-on-surface-variant">Confirma tu fecha en el calendario del DEMRE y agrégala a tu plan para ver la cuenta regresiva.</p>
      <BotonEnlace to="/app/plan" variante="suave" className="mt-4">Configurar mi plan</BotonEnlace>
    </Card>
  );
  const dias = diasHasta(fecha);
  const semanas = Math.floor(dias / 7);
  return (
    <Card como="section" className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-caption text-on-surface-variant">{fechaExamen ? 'Faltan para tu PAES' : 'Faltan para la PAES'}</h2>
        <p className="mt-1 text-on-surface">
          <span className="text-headline-lg font-bold tabular-nums">{dias}</span>{' '}
          <span className="text-body-md text-on-surface-variant">{dias === 1 ? 'día' : 'días'}</span>
        </p>
        <p className="text-caption text-on-surface-variant">
          {formatearFecha(fecha)}
          {semanas > 0 && ` · ${semanas} ${semanas === 1 ? 'semana' : 'semanas'} de estudio`}
        </p>
      </div>
      <Icono nombre="event" className="text-4xl text-outline" />
    </Card>
  );
}

function RepasarHoy({ cantidad }: { cantidad: number }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-body-md font-semibold text-on-surface">Repasar hoy</h2>
          <p className="mt-0.5 text-caption text-on-surface-variant">
            {cantidad > 0
              ? `${cantidad} ${cantidad === 1 ? 'pregunta de tu cuaderno de errores te espera' : 'preguntas de tu cuaderno de errores te esperan'}.`
              : 'Estás al día con tu cuaderno de errores.'}
          </p>
        </div>
        <span className={cn('text-headline-md font-bold tabular-nums', cantidad > 0 ? 'text-secondary' : 'text-on-surface-variant')}>{cantidad}</span>
      </div>
      {cantidad > 0 ? (
        <BotonEnlace to="/app/repaso/sesion" variante="suave" iconoIzquierdo="autorenew" anchoCompleto>
          Repasar ahora
        </BotonEnlace>
      ) : (
        <BotonEnlace to="/app/repaso" variante="fantasma" anchoCompleto>
          Ver cuaderno
        </BotonEnlace>
      )}
    </Card>
  );
}

function Evolucion({ datos, className }: { datos: DTODashboardCompleto; className?: string }) {
  const { historial, ultimoIntento, usuario } = datos;
  return (
    <Card como="section" radio="lg" aria-labelledby="titulo-evolucion" className={className}>
      <EncabezadoSeccion
        id="titulo-evolucion"
        nivel={3}
        titulo="Tu evolución"
        descripcion={historial.length > 1 ? `Puntaje de tus últimos ${historial.length} ensayos` : 'Tus puntajes aparecerán aquí'}
        accion={
          ultimoIntento && (
            <Link
              to={`/app/ensayos/intentos/${ultimoIntento.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded text-label-md text-on-surface-variant hover:text-primary"
            >
              Último: {PRUEBAS_CORTA[ultimoIntento.prueba as Prueba] ?? ultimoIntento.prueba}
              <span className="font-semibold text-on-surface tabular-nums">{ultimoIntento.puntaje ?? '—'} pts</span>
              <Icono nombre="chevron_right" className="text-lg" />
            </Link>
          )
        }
      />
      <div className="mt-4">
        {historial.length >= 2 ? (
          <GraficoEvolucion historial={historial} meta={usuario.puntajeMeta} />
        ) : (
          <EstadoVacio
            compacto
            icono="show_chart"
            titulo="Necesitas al menos dos ensayos"
            descripcion="Con dos o más ensayos rendidos verás cómo avanza tu puntaje frente a tu meta."
            accion={<BotonEnlace to="/app/ensayos" variante="secundario">Rendir un ensayo</BotonEnlace>}
          />
        )}
      </div>
    </Card>
  );
}

function AreasMejorar({ areas, intentos }: { areas: DTOAreaMejorar[]; intentos: number }) {
  return (
    <section aria-labelledby="titulo-areas" className="mt-10">
      <EncabezadoSeccion
        id="titulo-areas"
        titulo="Áreas a mejorar"
        descripcion={intentos > 0 ? `Basado en tus últimos ${intentos} ${intentos === 1 ? 'ensayo' : 'ensayos'}` : 'Se calculan con tus ensayos'}
        accion={
          <Link to="/app/estadisticas" className="inline-flex min-h-10 items-center gap-1 rounded text-label-md font-medium text-primary hover:underline">
            Ver detalle <Icono nombre="chevron_right" className="text-lg" />
          </Link>
        }
      />
      <div className="mt-4 grid gap-4 border-t border-border pt-6 md:grid-cols-3">
        {intentos === 0 ? (
          <EstadoVacio
            compacto
            icono="query_stats"
            titulo="Aún no hay datos"
            descripcion="Rinde un ensayo y te diremos qué ejes reforzar primero."
            accion={<BotonEnlace to="/app/ensayos">Ver ensayos</BotonEnlace>}
            className="md:col-span-3"
          />
        ) : (
          <>
            {areas.slice(0, 3).map((a) => (
              <TarjetaArea key={a.ejeId} area={a} />
            ))}
            {areas.length < 3 && (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-outline-variant bg-surface-container-low px-6 py-8 text-center md:col-span-1">
                <Icono nombre="verified" className="text-3xl text-outline" />
                <p className="mt-2 text-body-md text-on-surface-variant">
                  {areas.length === 0 ? '¡Vas muy bien en todos los ejes!' : '¡Vas muy bien en el resto de los ejes!'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function TarjetaArea({ area }: { area: DTOAreaMejorar }) {
  const alta = area.prioridad === 'alta';
  const destino = area.contenidoSlug ? `/app/contenidos/${area.contenidoSlug}` : '/app/ensayos';
  return (
    <Card como="article" interactiva className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className="text-caption font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
          {MATERIA_ETIQUETA[area.materiaCodigo] ?? area.materiaCodigo}
        </span>
        <Chip tono={alta ? 'error' : 'naranjo'} tamano="sm" icono={alta ? 'priority_high' : 'trending_up'}>
          {alta ? 'Prioridad alta' : 'En proceso'}
        </Chip>
      </div>
      <h3 className="mt-3 text-body-lg font-semibold text-on-surface">{area.ejeNombre}</h3>
      <ProgressBar
        className="mt-4"
        valor={area.precision}
        tono={alta ? 'error' : 'naranjo'}
        etiqueta="Precisión actual"
        mostrarValor
        etiquetaAria={`Precisión en ${area.ejeNombre}`}
      />
      <Link
        to={destino}
        className="mt-5 inline-flex min-h-10 items-center gap-1 border-t border-border pt-4 text-label-md font-medium text-primary hover:underline"
      >
        {area.contenidoSlug ? 'Repasar materia' : 'Practicar con un ensayo'} <Icono nombre="arrow_forward" className="text-lg" />
      </Link>
    </Card>
  );
}

function EsqueletoDashboard() {
  return (
    <Pagina>
      <Cargando etiqueta="Cargando tu inicio…">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="mt-3 h-6 w-96 max-w-full" />
          </div>
          <Skeleton className="h-16 w-44 rounded-md" />
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 rounded-lg lg:col-span-8" />
          <div className="flex flex-col gap-6 lg:col-span-4">
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-20 rounded-md" />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-20 rounded-md" />
            <Skeleton className="h-20 rounded-md" />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <Skeleton className="h-28 rounded-md" />
            <Skeleton className="h-32 rounded-md" />
          </div>
        </div>
      </Cargando>
    </Pagina>
  );
}
