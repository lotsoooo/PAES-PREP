import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import type { DTOContenidoLeccion, DTOLeccionUnidad } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { ApiError, urlArchivo } from '@/lib/api';
import { useLeccion, useProgresoContenido } from '@/lib/data/contenidos';
import { usePlan } from '@/components/premium/plan';
import { useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { Breadcrumbs } from '@/components/ui/Navegacion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TextoMat } from '@/components/contenido/TextoMat';
import { PaesBot } from '@/components/ia/PaesBot';
import { MiniTest } from '@/components/contenidos/MiniTest';
import { TIPO_CONTENIDO } from '@/components/contenidos/tipos';
import { formatearDuracion } from '@/components/plan/fechas';

export default function Leccion() {
  const { slug } = useParams();
  const { data, isLoading, isError, error, refetch, isFetching } = useLeccion(slug);
  useTitulo(data?.titulo ?? 'Lección');

  if (isLoading) return <EsqueletoLeccion />;
  if (isError || !data) {
    const noExiste = error instanceof ApiError && error.status === 404;
    return (
      <Pagina ancho="lectura">
        {noExiste ? (
          <EstadoVacio
            icono="menu_book"
            titulo="No encontramos esta lección"
            descripcion="Puede que la hayan movido o retirado. Vuelve a la biblioteca para seguir estudiando."
            accion={<BotonEnlace to="/app/contenidos">Ir a la biblioteca</BotonEnlace>}
          />
        ) : (
          <EstadoError titulo="No pudimos cargar la lección" onReintentar={() => void refetch()} cargando={isFetching} />
        )}
      </Pagina>
    );
  }
  return <VistaLeccion key={data.id} leccion={data} />;
}

function VistaLeccion({ leccion }: { leccion: DTOContenidoLeccion }) {
  const navigate = useNavigate();
  const { pedirUpgrade } = usePlan();
  const progreso = useProgresoContenido(leccion.id);
  const [avance, setAvance] = useState(leccion.porcentajeProgreso);
  const [completada, setCompletada] = useState(leccion.completado);
  const [siguiente, setSiguiente] = useState(leccion.siguiente);
  const [miniTest, setMiniTest] = useState(false);
  const guardado = useRef(leccion.porcentajeProgreso);

  const numero = leccion.unidad.lecciones.findIndex((l) => l.slug === leccion.slug) + 1;
  const tipo = TIPO_CONTENIDO[leccion.tipo] ?? TIPO_CONTENIDO.mixto!;
  const bloqueada = leccion.bloqueadoPorPlan;

  /** Guarda el avance en tramos de 25% (no baja nunca). */
  const registrarAvance = (pct: number) => {
    if (bloqueada || completada) return;
    const tramo = Math.min(90, Math.floor(pct / 25) * 25);
    setAvance((a) => Math.max(a, Math.round(pct)));
    if (tramo > guardado.current) {
      guardado.current = tramo;
      progreso.mutate(tramo);
    }
  };

  const completar = () => {
    progreso.mutate(100, {
      onSuccess: (r) => {
        setCompletada(true);
        setAvance(100);
        if (r.siguiente) setSiguiente(r.siguiente);
        toast.success('¡Lección completada!', {
          description: r.siguiente ? `Se desbloqueó «${r.siguiente.titulo}».` : 'Terminaste esta unidad.',
        });
      },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No pudimos registrar la lección.'),
    });
  };

  return (
    <Pagina>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/app/contenidos" className="inline-flex min-h-10 items-center gap-2 rounded text-label-md text-on-surface-variant hover:text-primary">
          <Icono nombre="arrow_back" className="text-xl" /> Volver a contenidos
        </Link>
        <Breadcrumbs
          className="hidden md:block"
          items={[
            { etiqueta: 'Contenidos', to: '/app/contenidos' },
            { etiqueta: MATERIA_ETIQUETA[leccion.materia.codigo] ?? leccion.materia.nombre, to: `/app/contenidos?materia=${leccion.materia.codigo}` },
            { etiqueta: leccion.unidad.nombre },
          ]}
        />
      </div>

      <Card radio="lg" padding="ninguno" className="overflow-hidden">
        <Medio leccion={leccion} bloqueada={bloqueada} avance={avance} onAvance={registrarAvance} onTermino={() => !completada && completar()} />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Chip tono="primario">Lección {numero || 1}</Chip>
              <span className="inline-flex items-center gap-1 text-caption text-on-surface-variant">
                <Icono nombre="schedule" className="text-base" /> {formatearDuracion(leccion.duracionMin)}
              </span>
              <span className="inline-flex items-center gap-1 text-caption text-on-surface-variant">
                <Icono nombre={tipo.icono} className="text-base" /> {tipo.etiqueta}
              </span>
              {completada && (
                <Chip tono="exito" tamano="sm" icono="check_circle" iconoRelleno>
                  Completada
                </Chip>
              )}
            </div>
            <h1 className="mt-3 text-headline-lg-mobile text-on-surface text-balance md:text-headline-lg">{leccion.titulo}</h1>
            {leccion.descripcion && <p className="mt-2 text-body-lg text-on-surface-variant text-pretty">{leccion.descripcion}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            {bloqueada ? (
              <Button variante="premium" tamano="lg" iconoIzquierdo="lock" onClick={() => pedirUpgrade('Esta lección es parte de Premium.')}>
                Desbloquear lección
              </Button>
            ) : completada ? (
              siguiente ? (
                <Button tamano="lg" iconoDerecho="arrow_forward" onClick={() => navigate(`/app/contenidos/${siguiente.slug}`)}>
                  Siguiente lección
                </Button>
              ) : (
                <BotonEnlace to="/app/contenidos" tamano="lg" variante="secundario">
                  Volver a la biblioteca
                </BotonEnlace>
              )
            ) : (
              <Button tamano="lg" iconoIzquierdo="check_circle" onClick={completar} cargando={progreso.isPending && progreso.variables === 100}>
                Completar lección
              </Button>
            )}
            {!completada && !bloqueada && (
              <ProgressBar valor={avance} grosor="fino" etiqueta="Tu avance" mostrarValor className="w-full md:w-56" etiquetaAria="Avance de la lección" />
            )}
          </div>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          {leccion.puntosClave.length > 0 && (
            <section aria-labelledby="titulo-puntos" className="rounded-lg bg-primary-fixed p-5 md:p-6">
              <h2 id="titulo-puntos" className="flex items-center gap-2 text-label-md font-semibold text-on-primary-fixed-variant">
                <Icono nombre="lightbulb" /> Puntos clave
              </h2>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body-md text-on-primary-fixed marker:text-primary">
                {leccion.puntosClave.map((p) => (
                  <li key={p}>
                    <TextoMat texto={p} modo="linea" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Cuerpo leccion={leccion} bloqueada={bloqueada} onAvance={registrarAvance} />

          {leccion.materiales.length > 0 && (
            <Card como="section" aria-labelledby="titulo-material">
              <h2 id="titulo-material" className="flex items-center gap-2 text-headline-md text-on-surface">
                <Icono nombre="folder_open" className="text-primary" /> Material descargable
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {leccion.materiales.map((m) => (
                  <li key={m.url}>
                    <a
                      href={urlArchivo(m.url) ?? m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-14 items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary hover:bg-surface-container-low"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded bg-error-container text-error">
                        <Icono nombre={m.tipo === 'pdf' ? 'picture_as_pdf' : 'link'} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-body-md font-medium text-on-surface">{m.nombre}</span>
                        <span className="text-caption text-on-surface-variant">{m.tipo === 'pdf' ? 'PDF · se abre en otra pestaña' : 'Enlace externo'}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Navegacion leccion={leccion} siguiente={completada ? siguiente : null} />
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Unidad y práctica">
          <IndiceUnidad lecciones={leccion.unidad.lecciones} nombre={leccion.unidad.nombre} actual={leccion.slug} completada={completada} />
          <Card className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icono nombre="quiz" />
            </span>
            <h2 className="mt-3 text-body-lg font-semibold text-on-surface">¿Entendiste la lección?</h2>
            <p className="mt-1 text-caption text-on-surface-variant">Pon a prueba lo que aprendiste con 3 preguntas rápidas.</p>
            <Button
              variante="secundario"
              anchoCompleto
              className="mt-4"
              onClick={() => (bloqueada ? pedirUpgrade('Esta lección es parte de Premium.') : setMiniTest(true))}
            >
              Iniciar mini-test
            </Button>
          </Card>
          <Card className="flex flex-col gap-3">
            <h2 className="text-body-md font-semibold text-on-surface">¿Te quedó una duda?</h2>
            <p className="text-caption text-on-surface-variant">PAES-Bot conoce esta lección y te la explica con otros ejemplos.</p>
            <PaesBot contexto={{ tipo: 'leccion', id: leccion.slug }} />
          </Card>
        </aside>
      </div>

      <MiniTest contenidoId={leccion.id} abierto={miniTest} onAbiertoChange={setMiniTest} />
    </Pagina>
  );
}

/* -------------------------------------------------------------------------- */

function urlIncrustada(url: string): { tipo: 'iframe' | 'video'; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { tipo: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { tipo: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { tipo: 'video', src: urlArchivo(url) ?? url };
}

function Medio({
  leccion,
  bloqueada,
  avance,
  onAvance,
  onTermino,
}: {
  leccion: DTOContenidoLeccion;
  bloqueada: boolean;
  avance: number;
  onAvance: (pct: number) => void;
  onTermino: () => void;
}) {
  const { pedirUpgrade } = usePlan();
  if (bloqueada) {
    return (
      <div className="flex aspect-video max-h-[28rem] w-full flex-col items-center justify-center gap-3 bg-inverse-surface px-6 text-center text-inverse-on-surface">
        <span className="flex size-14 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
          <Icono nombre="lock" relleno />
        </span>
        <p className="text-body-lg font-semibold">Lección Premium</p>
        <p className="max-w-md text-body-md opacity-80">Hazte Premium para ver esta lección completa, descargar su material y hacer el mini-test.</p>
        <Button variante="premium" onClick={() => pedirUpgrade('Esta lección es parte de Premium.')} iconoIzquierdo="workspace_premium">
          Ver Premium
        </Button>
      </div>
    );
  }
  if (!leccion.videoUrl) {
    // Lección de lectura: franja de portada con el avance de lectura.
    return (
      <div className="border-b border-border bg-surface-container-low">
        <div className="flex items-center gap-4 px-5 py-6 md:px-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icono nombre="auto_stories" />
          </span>
          <div className="min-w-0">
            <p className="text-label-md font-semibold text-on-surface">Lección de lectura</p>
            <p className="text-caption text-on-surface-variant">Tu avance se guarda solo a medida que lees.</p>
          </div>
        </div>
        <div className="h-1 bg-surface-container-high" aria-hidden="true">
          <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${avance}%` }} />
        </div>
      </div>
    );
  }
  const medio = urlIncrustada(leccion.videoUrl);
  return (
    <div className="bg-inverse-surface">
      {medio.tipo === 'iframe' ? (
        <iframe
          src={medio.src}
          title={`Video: ${leccion.titulo}`}
          className="aspect-video w-full"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          src={medio.src}
          controls
          preload="metadata"
          className="aspect-video w-full"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) onAvance((v.currentTime / v.duration) * 100);
          }}
          onEnded={onTermino}
        >
          <track kind="captions" />
        </video>
      )}
      <div className="h-1 bg-inverse-on-surface/20" aria-hidden="true">
        <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${avance}%` }} />
      </div>
    </div>
  );
}

/** Cuerpo de la lección: tipografía de lectura (body-lg) y avance por scroll. */
function Cuerpo({ leccion, bloqueada, onAvance }: { leccion: DTOContenidoLeccion; bloqueada: boolean; onAvance: (pct: number) => void }) {
  const ref = useRef<HTMLElement>(null);
  const alAvanzar = useRef(onAvance);
  alAvanzar.current = onAvance;
  const sinVideo = !leccion.videoUrl;

  useEffect(() => {
    const el = ref.current;
    if (!el || bloqueada || !sinVideo) return;
    let raf = 0;
    const medir = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const leido = (window.innerHeight - r.top) / (r.height + window.innerHeight * 0.25);
        alAvanzar.current(Math.max(0, Math.min(100, leido * 100)));
      });
    };
    medir();
    window.addEventListener('scroll', medir, { passive: true });
    return () => {
      window.removeEventListener('scroll', medir);
      cancelAnimationFrame(raf);
    };
  }, [bloqueada, sinVideo]);

  if (!leccion.cuerpoMd.trim()) return null;
  return (
    <article ref={ref} aria-label="Contenido de la lección" className={cn('relative', bloqueada && 'max-h-64 overflow-hidden')}>
      <TextoMat texto={leccion.cuerpoMd} className="texto-lectura text-body-lg text-on-surface" />
      {bloqueada && <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-background/90" />}
    </article>
  );
}

function Navegacion({ leccion, siguiente }: { leccion: DTOContenidoLeccion; siguiente: DTOContenidoLeccion['siguiente'] }) {
  const sig = siguiente ?? leccion.siguiente;
  if (!leccion.anterior && !sig) return null;
  return (
    <nav aria-label="Lecciones de la unidad" className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {leccion.anterior ? (
        <Link to={`/app/contenidos/${leccion.anterior.slug}`} className="flex min-h-16 flex-col justify-center rounded-md border border-border px-4 py-3 transition-colors hover:border-primary">
          <span className="inline-flex items-center gap-1 text-caption text-on-surface-variant">
            <Icono nombre="arrow_back" className="text-base" /> Anterior
          </span>
          <span className="text-body-md font-medium text-on-surface">{leccion.anterior.titulo}</span>
        </Link>
      ) : (
        <span />
      )}
      {sig && (
        <Link to={`/app/contenidos/${sig.slug}`} className="flex min-h-16 flex-col items-end justify-center rounded-md border border-border px-4 py-3 text-right transition-colors hover:border-primary">
          <span className="inline-flex items-center gap-1 text-caption text-on-surface-variant">
            Siguiente <Icono nombre="arrow_forward" className="text-base" />
          </span>
          <span className="text-body-md font-medium text-on-surface">{sig.titulo}</span>
        </Link>
      )}
    </nav>
  );
}

function IndiceUnidad({ lecciones, nombre, actual, completada }: { lecciones: DTOLeccionUnidad[]; nombre: string; actual: string; completada: boolean }) {
  // Al completar la actual, la siguiente bloqueada pasa a disponible sin recargar.
  const indiceActual = lecciones.findIndex((l) => l.slug === actual);
  const estados = lecciones.map((l, i) =>
    l.slug === actual && completada
      ? 'completada'
      : completada && i === indiceActual + 1 && l.estado === 'bloqueada'
        ? 'disponible'
        : l.estado,
  );
  return (
    <Card como="section" aria-labelledby="titulo-unidad" padding="sm" className="md:p-5">
      <h2 id="titulo-unidad" className="border-b border-border pb-3 text-body-md font-semibold text-on-surface">
        En esta unidad <span className="font-normal text-on-surface-variant">· {nombre}</span>
      </h2>
      <ol className="mt-2 flex flex-col gap-1">
        {lecciones.map((l, i) => {
          const estado = estados[i]!;
          const esActual = l.slug === actual;
          const icono = estado === 'completada' ? 'check_circle' : estado === 'bloqueada' ? 'lock' : esActual ? 'play_circle' : 'radio_button_unchecked';
          const contenido = (
            <>
              <Icono
                nombre={icono}
                relleno={estado === 'completada' || esActual}
                className={cn(estado === 'completada' ? 'text-success' : estado === 'bloqueada' ? 'text-outline' : 'text-primary')}
              />
              <span className="min-w-0 flex-1">
                <span className={cn('block text-body-md', esActual ? 'font-semibold text-on-surface' : estado === 'bloqueada' ? 'text-on-surface-variant' : 'text-on-surface')}>
                  {i + 1}. {l.titulo}
                </span>
                <span className="text-caption text-on-surface-variant">
                  {formatearDuracion(l.duracionMin)}
                  {estado === 'bloqueada' && ' · Completa la anterior para desbloquearla'}
                  {estado === 'completada' && ' · Completada'}
                </span>
              </span>
            </>
          );
          const clase = cn(
            'flex min-h-12 items-start gap-3 rounded px-3 py-2',
            esActual && 'bg-primary-fixed/50 shadow-[inset_3px_0_0_var(--pal-primary)]',
          );
          return (
            <li key={l.slug}>
              {esActual || estado === 'bloqueada' ? (
                <div className={clase} aria-current={esActual ? 'page' : undefined}>
                  {contenido}
                </div>
              ) : (
                <Link to={`/app/contenidos/${l.slug}`} className={cn(clase, 'transition-colors hover:bg-surface-container')}>
                  {contenido}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function EsqueletoLeccion() {
  return (
    <Pagina>
      <Cargando etiqueta="Cargando lección…">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-5 aspect-video max-h-[28rem] w-full rounded-lg" />
        <Skeleton className="mt-6 h-10 w-2/3" />
        <Skeleton className="mt-3 h-6 w-1/2" />
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-md lg:col-span-4" />
        </div>
      </Cargando>
    </Pagina>
  );
}
