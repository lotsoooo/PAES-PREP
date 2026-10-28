import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import type { DTOPreguntaResuelta, DTOResultadosCompletos } from '@paes-pro/shared';
import { BRAND_NAME, MATERIA_ETIQUETA } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { useResultados } from '@/lib/data/ensayos';
import { useContador, useTitulo } from '@/hooks/utiles';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Datos';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TextoMat } from '@/components/contenido/TextoMat';
import { Confeti } from '@/components/ensayos/Confeti';
import { formatoSegundos, formatoTiempoLargo } from '@/components/ensayos/formato';
import { cn } from '@/lib/cn';

export default function Resultados() {
  const { id = '' } = useParams();
  const { data, isLoading, isError, error, refetch, isFetching } = useResultados(id);
  useTitulo(data ? `Resultados: ${data.intento.titulo}` : 'Resultados');

  if (isLoading) {
    return (
      <Pagina>
        <Cargando etiqueta="Calculando tus resultados…">
          <Skeleton className="mx-auto size-20 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-10 w-72" />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-lg lg:col-span-2" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </Cargando>
      </Pagina>
    );
  }
  if (isError || !data) {
    const api = error instanceof ApiError ? error : null;
    return (
      <Pagina ancho="lectura">
        {api?.status === 409 ? (
          <EstadoVacio
            icono="pending_actions"
            titulo="Este ensayo sigue en curso"
            descripcion={api.message}
            accion={<BotonEnlace to="/app/ensayos?ver=intentos">Ver mis intentos</BotonEnlace>}
          />
        ) : api?.status === 404 ? (
          <EstadoVacio
            icono="search_off"
            titulo="No encontramos este intento"
            descripcion="Puede que el enlace esté incompleto."
            accion={<BotonEnlace to="/app/ensayos?ver=intentos">Ver mis intentos</BotonEnlace>}
          />
        ) : (
          <EstadoError titulo="No pudimos cargar tus resultados" onReintentar={() => void refetch()} cargando={isFetching} />
        )}
      </Pagina>
    );
  }
  return <Contenido datos={data} />;
}

function Contenido({ datos }: { datos: DTOResultadosCompletos }) {
  const { intento, ejes, preguntas } = datos;
  const total = intento.correctas + intento.incorrectas + intento.omitidas;
  const puntaje = intento.puntaje ?? 0;
  const [animado, refNumero] = useContador(puntaje, 1100);
  const primerError = preguntas.findIndex((p) => !p.esCorrecta);
  const base = `/app/ensayos/intentos/${intento.id}`;

  const avisado = useRef(false);
  useEffect(() => {
    if (avisado.current || !datos.logrosNuevos?.length) return;
    avisado.current = true;
    for (const l of datos.logrosNuevos) toast.success(`Logro desbloqueado: ${l.nombre}`, { description: l.descripcion });
  }, [datos.logrosNuevos]);

  const diferenciaMeta = datos.puntajeMeta !== null ? puntaje - datos.puntajeMeta : null;

  return (
    <Pagina>
      <Confeti activo={datos.superaMeta} />
      <header className="mb-10 flex flex-col items-center text-center">
        <span
          className={cn(
            'flex size-20 items-center justify-center rounded-full',
            datos.superaMeta ? 'bg-success text-on-success' : 'bg-primary-container text-white',
          )}
        >
          <Icono nombre={datos.superaMeta ? 'military_tech' : 'emoji_events'} relleno className="text-4xl" />
        </span>
        <h1 className="mt-6 text-headline-lg-mobile text-on-surface md:text-display">
          {datos.superaMeta ? '¡Superaste tu meta!' : '¡Ensayo finalizado!'}
        </h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">
          {intento.titulo}
          {intento.estado === 'expirado' && ' · Entregado al acabarse el tiempo'}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Puntaje */}
        <Card como="section" radio="lg" padding="lg" aria-labelledby="puntaje" className="lg:col-span-2">
          <div className="flex flex-col items-center text-center">
            <h2 id="puntaje" className="text-label-md uppercase text-on-surface-variant">
              Puntaje estimado
            </h2>
            <p className="mt-2 flex items-baseline gap-2" aria-label={`${puntaje} puntos`}>
              <span ref={refNumero as React.RefObject<HTMLSpanElement>} className="text-[72px] font-bold leading-none tracking-tight text-primary tabular-nums md:text-[96px]" aria-hidden="true">
                {animado}
              </span>
              <span className="text-headline-md text-on-surface-variant" aria-hidden="true">
                pts
              </span>
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {diferenciaMeta !== null && (
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-container px-4 text-label-md text-on-surface" style={{ letterSpacing: 0 }}>
                  <Icono nombre="flag" className="text-lg text-secondary-container" />
                  Meta: {datos.puntajeMeta} pts
                  <strong className={cn('font-semibold tabular-nums', diferenciaMeta >= 0 ? 'text-success' : 'text-secondary')}>
                    {diferenciaMeta >= 0 ? `+${diferenciaMeta}` : diferenciaMeta} pts
                  </strong>
                </span>
              )}
              {datos.anterior && <Comparacion diferencia={datos.anterior.diferencia} anterior={datos.anterior.puntaje} />}
            </div>
            <p className="mt-3 text-caption text-on-surface-variant">
              Escala PAES 100–1000. Es una estimación de {intento.correctas} correctas, no la tabla oficial del DEMRE.
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-3 border-t border-outline-variant pt-6 text-center">
            <Conteo etiqueta="Correctas" valor={intento.correctas} total={total} icono="check_circle" tono="text-success" />
            <Conteo etiqueta="Omitidas" valor={intento.omitidas} icono="remove_circle" tono="text-on-surface-variant" separador />
            <Conteo etiqueta="Incorrectas" valor={intento.incorrectas} icono="cancel" tono="text-error" separador />
          </dl>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Card como="section" radio="lg" aria-labelledby="tiempo">
            <h2 id="tiempo" className="flex items-center gap-2 text-body-lg font-semibold text-on-surface">
              <Icono nombre="timer" className="text-primary" />
              Tiempo total
            </h2>
            <p className="mt-3 text-headline-lg-mobile font-bold text-on-surface tabular-nums md:text-headline-lg">
              {formatoTiempoLargo(datos.duracionUsadaSegundos)}
            </p>
            <p className="mt-1 text-caption text-on-surface-variant">
              de {datos.duracionMin} min disponibles · {formatoSegundos(datos.tiempoPromedioPregunta)} por pregunta en promedio
            </p>
          </Card>
          <Card como="section" radio="lg" aria-labelledby="percentil">
            <h2 id="percentil" className="flex items-center gap-2 text-body-lg font-semibold text-on-surface">
              <Icono nombre="trending_up" className="text-primary" />
              Percentil
            </h2>
            {datos.percentil !== null ? (
              <>
                <p className="mt-3 text-headline-lg font-bold text-on-surface tabular-nums">{Math.round(datos.percentil)}</p>
                <p className="mt-1 text-caption text-on-surface-variant">
                  Te fue mejor que al {Math.round(datos.percentil)} % de quienes rindieron este ensayo en {BRAND_NAME}.
                </p>
              </>
            ) : (
              <p className="mt-3 text-body-md text-on-surface-variant">
                Sin datos suficientes. Lo calculamos cuando al menos 30 estudiantes hayan rendido este ensayo, para que la comparación sea
                confiable.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Ejes */}
      <Card como="section" radio="lg" padding="lg" aria-labelledby="ejes" className="mt-6">
        <h2 id="ejes" className="text-headline-md text-on-surface">
          Desglose por ejes temáticos
        </h2>
        {ejes.length === 0 ? (
          <p className="mt-3 text-body-md text-on-surface-variant">Este ensayo no tiene ejes asociados.</p>
        ) : (
          <ul className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {ejes.map((e) => {
              const pct = Math.round(e.pctLogro);
              return (
                <li key={e.ejeId}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-body-md font-semibold text-on-surface">{e.ejeNombre}</span>
                    <span className="text-label-md text-on-surface-variant tabular-nums" style={{ letterSpacing: 0 }}>
                      {e.correctas}/{e.total} ({pct} %)
                    </span>
                  </div>
                  <ProgressBar
                    valor={pct}
                    tono={pct < 50 ? 'naranjo' : pct >= 80 ? 'exito' : 'primario'}
                    etiquetaAria={`${e.ejeNombre}: ${pct} % de logro`}
                  />
                  {pct < 50 && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-caption text-secondary">
                      <Icono nombre="priority_high" className="text-sm" />
                      Punto débil: entra a tu plan de repaso
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Acciones */}
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
        {primerError >= 0 ? (
          <BotonEnlace to={`${base}/pregunta/${primerError + 1}`} tamano="lg" iconoIzquierdo="error">
            Revisar errores
          </BotonEnlace>
        ) : (
          <span className="inline-flex min-h-13 items-center justify-center gap-2 rounded bg-success-container px-6 text-body-md font-semibold text-on-success-container">
            <Icono nombre="verified" relleno />
            Sin errores. ¡Impecable!
          </span>
        )}
        <Button
          variante="secundario"
          tamano="lg"
          iconoIzquierdo="fact_check"
          onClick={() => document.getElementById('respuestas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Ver todas las respuestas
        </Button>
        <BotonEnlace to="/app" variante="suave" tamano="lg" iconoIzquierdo="home">
          Volver al inicio
        </BotonEnlace>
      </div>

      {/* Todas las respuestas */}
      <section id="respuestas" aria-labelledby="titulo-respuestas" className="mt-14 scroll-mt-24">
        <h2 id="titulo-respuestas" className="text-headline-md text-on-surface">
          Todas las respuestas
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">Toca una pregunta para ver la explicación paso a paso.</p>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {preguntas.map((p, i) => (
            <FilaRespuesta key={p.id} pregunta={p} numero={i + 1} to={`${base}/pregunta/${i + 1}`} />
          ))}
        </ol>
      </section>
    </Pagina>
  );
}

function Comparacion({ diferencia, anterior }: { diferencia: number; anterior: number }) {
  const sube = diferencia > 0;
  const igual = diferencia === 0;
  return (
    <Tooltip texto={`Tu intento anterior en este ensayo: ${anterior} pts`}>
      <span
        tabIndex={0}
        className={cn(
          'inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-label-md font-semibold tabular-nums',
          igual ? 'bg-surface-container text-on-surface-variant' : sube ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container',
        )}
        style={{ letterSpacing: 0 }}
      >
        <Icono nombre={igual ? 'trending_flat' : sube ? 'trending_up' : 'trending_down'} className="text-lg" />
        {igual ? 'Igual que tu intento anterior' : `${sube ? '+' : ''}${diferencia} vs. intento anterior`}
      </span>
    </Tooltip>
  );
}

function Conteo({
  etiqueta,
  valor,
  total,
  icono,
  tono,
  separador,
}: {
  etiqueta: string;
  valor: number;
  total?: number;
  icono: string;
  tono: string;
  separador?: boolean;
}) {
  return (
    <div className={cn('px-2', separador && 'border-l border-outline-variant')}>
      <dt className="inline-flex items-center gap-1 text-caption text-on-surface-variant">
        <Icono nombre={icono} relleno className={cn('text-base', tono)} />
        {etiqueta}
      </dt>
      <dd className={cn('mt-1 text-headline-md font-bold tabular-nums', etiqueta === 'Incorrectas' ? 'text-error' : 'text-on-surface')}>
        {valor}
        {total !== undefined && <span className="text-body-md font-normal text-on-surface-variant">/{total}</span>}
      </dd>
    </div>
  );
}

function FilaRespuesta({ pregunta, numero, to }: { pregunta: DTOPreguntaResuelta; numero: number; to: string }) {
  const omitida = !pregunta.tuRespuestaId;
  const estado = pregunta.esCorrecta ? 'Correcta' : omitida ? 'Omitida' : 'Incorrecta';
  return (
    <li>
      <Link
        to={to}
        className="flex items-start gap-4 rounded-md border border-border bg-surface-container-lowest p-4 transition-[box-shadow,border-color] hover:border-primary/50 hover:shadow-card-hover"
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-label-md font-semibold tabular-nums',
            pregunta.esCorrecta ? 'bg-success-container text-on-success-container' : omitida ? 'bg-surface-container text-on-surface-variant' : 'bg-error-container text-on-error-container',
          )}
        >
          {numero}
        </span>
        <div className="min-w-0 flex-1">
          <TextoMat texto={pregunta.enunciado} className="line-clamp-2 text-body-md text-on-surface" />
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-caption text-on-surface-variant">
            <span className={cn('inline-flex items-center gap-1 font-semibold', pregunta.esCorrecta ? 'text-success' : omitida ? '' : 'text-error')}>
              <Icono nombre={pregunta.esCorrecta ? 'check_circle' : omitida ? 'remove_circle' : 'cancel'} relleno className="text-sm" />
              {estado}
            </span>
            {pregunta.ejeNombre && <span>{pregunta.ejeNombre}</span>}
            <span className="sr-only">{MATERIA_ETIQUETA[pregunta.materiaCodigo]}</span>
          </p>
        </div>
        <Icono nombre="chevron_right" className="mt-1.5 text-on-surface-variant" />
      </Link>
    </li>
  );
}
