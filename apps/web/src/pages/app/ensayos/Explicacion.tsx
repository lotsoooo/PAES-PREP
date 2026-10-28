import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import type { DTOExplicacion } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { useAlternarCuaderno, useExplicacion } from '@/lib/data/ensayos';
import { useAtajo, useTitulo } from '@/hooks/utiles';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Navegacion';
import { Icono } from '@/components/ui/Icono';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TextoMat } from '@/components/contenido/TextoMat';
import { PremiumLock } from '@/components/premium/Premium';
import { PaesBot } from '@/components/ia/PaesBot';
import { LETRAS } from '@/components/ensayos/formato';
import { cn } from '@/lib/cn';

export default function Explicacion() {
  const { id = '', n = '1' } = useParams();
  const numero = Number(n);
  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useExplicacion(id, numero);
  useTitulo(`Pregunta ${numero}: explicación`);

  if (isLoading) {
    return (
      <Pagina>
        <Cargando etiqueta="Cargando la explicación…">
          <Skeleton className="h-5 w-56" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </Cargando>
      </Pagina>
    );
  }
  if (isError || !data) {
    const api = error instanceof ApiError ? error : null;
    return (
      <Pagina ancho="lectura">
        {api && (api.status === 404 || api.status === 409) ? (
          <EstadoVacio
            icono={api.status === 409 ? 'pending_actions' : 'search_off'}
            titulo={api.status === 409 ? 'Aún no entregas este ensayo' : 'Esta pregunta no existe'}
            descripcion={api.message}
            accion={<BotonEnlace to={`/app/ensayos/intentos/${id}`}>Volver a los resultados</BotonEnlace>}
          />
        ) : (
          <EstadoError titulo="No pudimos cargar la explicación" onReintentar={() => void refetch()} cargando={isFetching} />
        )}
      </Pagina>
    );
  }
  return <Contenido datos={data} cargandoOtra={isPlaceholderData} />;
}

function Contenido({ datos, cargandoOtra }: { datos: DTOExplicacion; cargandoOtra: boolean }) {
  const navigate = useNavigate();
  const { pregunta: p, intentoId, numero, total } = datos;
  const base = `/app/ensayos/intentos/${intentoId}`;
  const omitida = !p.tuRespuestaId;
  const cuaderno = useAlternarCuaderno(intentoId, numero);
  const alts = [...p.alternativas].sort((a, b) => a.posicion - b.posicion);

  useAtajo('ArrowRight', () => numero < total && navigate(`${base}/pregunta/${numero + 1}`));
  useAtajo('ArrowLeft', () => numero > 1 && navigate(`${base}/pregunta/${numero - 1}`));

  const alternarCuaderno = () =>
    cuaderno.mutate(
      { preguntaId: p.id, agregar: !datos.enCuaderno },
      {
        onSuccess: (agregada) =>
          toast.success(agregada ? 'Guardada en tu cuaderno de errores' : 'Quitada del cuaderno de errores', {
            description: agregada ? 'Te la volveremos a preguntar mañana para que no se te olvide.' : undefined,
          }),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No pudimos actualizar tu cuaderno.'),
      },
    );

  const estado = p.esCorrecta
    ? { texto: 'Correcta', icono: 'check_circle', clase: 'text-success' }
    : omitida
      ? { texto: 'Omitida', icono: 'remove_circle', clase: 'text-on-surface-variant' }
      : { texto: 'Incorrecta', icono: 'cancel', clase: 'text-error' };

  return (
    <Pagina>
      <Breadcrumbs
        className="mb-6"
        items={[
          { etiqueta: 'Mis ensayos', to: '/app/ensayos?ver=intentos' },
          { etiqueta: 'Resultados', to: base },
          { etiqueta: `Pregunta ${numero}` },
        ]}
      />

      <div className={cn('grid gap-6 transition-opacity lg:grid-cols-2', cargandoOtra && 'opacity-60')} aria-busy={cargandoOtra}>
        {/* Pregunta */}
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-sm bg-primary-fixed px-2.5 py-1 text-label-md font-semibold uppercase text-on-primary-fixed-variant">
              {MATERIA_ETIQUETA[p.materiaCodigo] ?? p.materiaCodigo}
            </span>
            <h1 className="text-body-lg text-on-surface">
              Pregunta {numero} de {total}
            </h1>
            <span className={cn('ml-auto inline-flex items-center gap-1.5 text-body-md font-semibold', estado.clase)}>
              <Icono nombre={estado.icono} relleno />
              {estado.texto}
            </span>
          </div>
          <Card como="section" radio="lg" padding="lg" aria-label="Enunciado y alternativas">
            {p.textoBase && (
              <details className="mb-5 rounded-md bg-surface-container-low p-4">
                <summary className="cursor-pointer text-label-md font-semibold text-primary">Ver el texto de lectura</summary>
                <TextoMat texto={p.textoBase} className="texto-lectura mt-3 text-body-md text-on-surface" />
              </details>
            )}
            <TextoMat texto={p.enunciado} className="text-body-lg font-semibold text-on-surface" />
            <ul className="mt-6 flex flex-col gap-3">
              {alts.map((alt, i) => {
                const esCorrecta = alt.id === p.alternativaCorrectaId;
                const esTuya = alt.id === p.tuRespuestaId;
                const letra = LETRAS[i] ?? String(i + 1);
                return (
                  <li
                    key={alt.id}
                    className={cn(
                      'flex min-h-14 items-center gap-4 rounded border px-4 py-3',
                      esCorrecta && 'border-2 border-success bg-success-container/50',
                      esTuya && !esCorrecta && 'border-2 border-error bg-error-container/40',
                      !esCorrecta && !esTuya && 'border-border text-on-surface-variant',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full text-label-md font-semibold',
                        esCorrecta ? 'bg-success text-on-success' : esTuya ? 'bg-error text-on-error' : 'border border-outline-variant',
                      )}
                    >
                      {esCorrecta ? <Icono nombre="check" className="text-lg" /> : esTuya ? <Icono nombre="close" className="text-lg" /> : letra}
                    </span>
                    <span className="min-w-0 flex-1 text-body-md text-on-surface">
                      <span className="font-semibold">{letra})</span> <TextoMat texto={alt.texto} modo="linea" />
                    </span>
                    {(esCorrecta || esTuya) && (
                      <span className={cn('shrink-0 text-label-md font-semibold', esCorrecta ? 'text-success' : 'text-error')} style={{ letterSpacing: 0 }}>
                        {esCorrecta && esTuya ? 'Tu respuesta · Correcta' : esCorrecta ? 'Correcta' : 'Tu respuesta'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {omitida && <p className="mt-4 text-caption text-on-surface-variant">Dejaste esta pregunta en blanco.</p>}
          </Card>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!p.esCorrecta && (
              <Button
                variante={datos.enCuaderno ? 'suave' : 'secundario'}
                iconoIzquierdo={datos.enCuaderno ? 'bookmark_added' : 'bookmark_add'}
                onClick={alternarCuaderno}
                cargando={cuaderno.isPending}
                aria-pressed={datos.enCuaderno}
              >
                {datos.enCuaderno ? 'En tu cuaderno de errores' : 'Guardar en el cuaderno de errores'}
              </Button>
            )}
            <PaesBot contexto={{ tipo: 'explicacion', id: `${intentoId}:${numero}` }} />
          </div>
        </div>

        {/* Explicación */}
        <Card como="section" radio="lg" padding="lg" aria-labelledby="titulo-explicacion" className="min-w-0">
          <h2 id="titulo-explicacion" className="flex items-center gap-3 border-b border-outline-variant pb-4 text-headline-md text-on-surface">
            <Icono nombre="school" className="text-primary" />
            Explicación paso a paso
          </h2>

          {p.tieneVideo && (
            <div className="mt-6">
              <PremiumLock
                motivo="Las explicaciones en video son parte de Premium: un profesor resuelve cada pregunta paso a paso."
                titulo="Explicación en video"
                descripcion="Mira cómo un profesor resuelve esta pregunta."
              >
                <Video url={p.videoUrl} />
              </PremiumLock>
            </div>
          )}

          {p.pasos.length > 0 ? (
            <ol className="mt-6 space-y-4">
              {p.pasos.map((paso, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md font-semibold text-on-primary-fixed-variant tabular-nums">
                    {i + 1}
                  </span>
                  <TextoMat texto={paso} className="min-w-0 flex-1 pt-1 text-body-md text-on-surface" />
                </li>
              ))}
            </ol>
          ) : (
            <TextoMat texto={p.explicacion} className="mt-6 text-body-md text-on-surface" />
          )}

          {p.errorComun && (
            <aside className="mt-6 rounded-md border-l-4 border-primary bg-surface-container-low px-5 py-4" aria-labelledby="error-comun">
              <h3 id="error-comun" className="flex items-center gap-2 text-body-md font-semibold text-primary">
                <Icono nombre="lightbulb" />
                Error común
              </h3>
              <TextoMat texto={p.errorComun} className="mt-1 text-body-md text-on-surface" />
            </aside>
          )}
        </Card>
      </div>

      {/* Navegación entre preguntas */}
      <nav aria-label="Navegar entre preguntas" className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <BotonEnlace
            to={`${base}/pregunta/${numero - 1}`}
            variante="secundario"
            iconoIzquierdo="arrow_back"
            aria-disabled={numero <= 1}
            tabIndex={numero <= 1 ? -1 : undefined}
          >
            Anterior
          </BotonEnlace>
          <BotonEnlace
            to={`${base}/pregunta/${numero + 1}`}
            variante="secundario"
            iconoDerecho="arrow_forward"
            aria-disabled={numero >= total}
            tabIndex={numero >= total ? -1 : undefined}
          >
            Siguiente
          </BotonEnlace>
        </div>
        <div className="flex flex-wrap gap-2">
          {datos.anteriorError && (
            <BotonEnlace to={`${base}/pregunta/${datos.anteriorError}`} variante="fantasma" iconoIzquierdo="undo">
              Error anterior
            </BotonEnlace>
          )}
          {datos.siguienteError ? (
            <BotonEnlace to={`${base}/pregunta/${datos.siguienteError}`} iconoDerecho="arrow_forward">
              Siguiente error
            </BotonEnlace>
          ) : (
            <BotonEnlace to={base} variante="suave" iconoIzquierdo="insights">
              Volver a los resultados
            </BotonEnlace>
          )}
        </div>
      </nav>
    </Pagina>
  );
}

function Video({ url }: { url: string | null }) {
  if (!url) {
    // Gratis: se muestra un marco con el reproductor bloqueado por PremiumLock.
    return (
      <div className="flex aspect-video items-center justify-center rounded-md bg-inverse-surface">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icono nombre="play_arrow" relleno className="text-4xl" />
        </span>
      </div>
    );
  }
  const youtube = /youtu\.?be/.test(url);
  return youtube ? (
    <iframe
      src={url.replace('watch?v=', 'embed/')}
      title="Explicación en video"
      loading="lazy"
      allow="accelerometer; encrypted-media; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-md"
    />
  ) : (
    <video src={url} controls preload="metadata" className="aspect-video w-full rounded-md bg-inverse-surface">
      <track kind="captions" />
    </video>
  );
}
