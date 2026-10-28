import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { DTOTutorResumen, TipoPublicacion } from '@paes-pro/shared';
import { MATERIA_ETIQUETA, TIPOS_PUBLICACION, TIPOS_PUBLICACION_LABEL, formatearNumero, tiempoRelativo } from '@paes-pro/shared';
import { useDestacados, useFeed, useMaterias, useSeguirTutor, type OrdenFeed } from '@/lib/data/comunidad';
import { urlArchivo } from '@/lib/api';
import { useTitulo } from '@/hooks/utiles';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Select } from '@/components/ui/Input';
import { ChipFiltro } from '@/components/ui/Chip';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Icono } from '@/components/ui/Icono';
import { EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { SkeletonPublicacion, TarjetaPublicacion } from '@/components/comunidad/Publicacion';

const ORDENES: { valor: OrdenFeed; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'populares', etiqueta: 'Más populares' },
  { valor: 'sin_responder', etiqueta: 'Sin responder' },
  { valor: 'siguiendo', etiqueta: 'De quienes sigo' },
];

export default function Feed() {
  useTitulo('Comunidad');
  const [params, setParams] = useSearchParams();
  const materia = params.get('materia') ?? undefined;
  const tipoParam = params.get('tipo');
  const tipo = TIPOS_PUBLICACION.includes(tipoParam as TipoPublicacion) ? (tipoParam as TipoPublicacion) : undefined;
  const ordenParam = params.get('orden') as OrdenFeed | null;
  const orden: OrdenFeed = ORDENES.some((o) => o.valor === ordenParam) ? ordenParam! : 'recientes';

  const cambiar = (clave: string, valor: string | undefined) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
  };

  const materias = useMaterias();
  const feed = useFeed({ materia, tipo, orden });
  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const filtrado = Boolean(materia || tipo || orden !== 'recientes');

  // Scroll infinito: carga la página siguiente al acercarse al final.
  const centinela = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    const el = centinela.current;
    if (!el || !hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Comunidad"
        descripcion="Resuelve dudas, comparte estrategias y conéctate con otros estudiantes y profesores."
        acciones={
          <>
            <BotonEnlace to="/app/comunidad/buscar" variante="fantasma" iconoIzquierdo="search">
              Buscar
            </BotonEnlace>
            <BotonEnlace to="/app/comunidad/nuevo" iconoIzquierdo="edit" className="hidden md:inline-flex">
              Crear publicación
            </BotonEnlace>
          </>
        }
        className="mb-6"
      />

      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-fino lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Tipo de publicación">
          <ChipFiltro activo={!tipo} onClick={() => cambiar('tipo', undefined)}>
            Todo
          </ChipFiltro>
          {TIPOS_PUBLICACION.map((t) => (
            <ChipFiltro key={t} activo={tipo === t} onClick={() => cambiar('tipo', tipo === t ? undefined : t)}>
              {TIPOS_PUBLICACION_LABEL[t]}
            </ChipFiltro>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex lg:w-auto">
          <Select
            label="Materia"
            labelOculto
            value={materia ?? ''}
            onChange={(e) => cambiar('materia', e.target.value || undefined)}
            opciones={[{ valor: '', etiqueta: 'Todas las materias' }, ...(materias.data ?? []).map((m) => ({ valor: m.codigo, etiqueta: MATERIA_ETIQUETA[m.codigo] ?? m.nombre }))]}
            contenedorClassName="lg:w-56"
          />
          <Select
            label="Ordenar por"
            labelOculto
            value={orden}
            onChange={(e) => cambiar('orden', e.target.value === 'recientes' ? undefined : e.target.value)}
            opciones={ORDENES.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta }))}
            contenedorClassName="lg:w-52"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <section aria-label="Publicaciones" className="flex flex-col gap-4 lg:col-span-8">
          {feed.isPending ? (
            <>
              <SkeletonPublicacion />
              <SkeletonPublicacion />
              <SkeletonPublicacion />
            </>
          ) : feed.isError ? (
            <EstadoError
              titulo="No pudimos cargar la comunidad"
              descripcion={feed.error.message}
              onReintentar={() => void feed.refetch()}
              cargando={feed.isRefetching}
            />
          ) : items.length === 0 ? (
            <EstadoVacio
              icono="forum"
              titulo={filtrado ? 'No hay publicaciones con estos filtros' : 'Todavía no hay publicaciones'}
              descripcion={
                orden === 'siguiendo'
                  ? 'Sigue a profesores y tutores para ver aquí lo que publican.'
                  : filtrado
                    ? 'Prueba con otra materia u otro tipo, o haz tú la primera pregunta.'
                    : 'Haz la primera pregunta: alguien más seguro tiene la misma duda.'
              }
              accion={
                <div className="flex flex-wrap justify-center gap-2">
                  {filtrado && (
                    <Button variante="secundario" onClick={() => setParams({}, { replace: true })}>
                      Quitar filtros
                    </Button>
                  )}
                  <BotonEnlace to="/app/comunidad/nuevo" iconoIzquierdo="edit">
                    Crear publicación
                  </BotonEnlace>
                </div>
              }
            />
          ) : (
            <>
              {items.map((p) => (
                <TarjetaPublicacion key={p.id} publicacion={p} />
              ))}
              <div ref={centinela} aria-hidden="true" />
              {isFetchingNextPage && <SkeletonPublicacion />}
              {hasNextPage && !isFetchingNextPage && (
                <Button variante="secundario" onClick={() => void fetchNextPage()} className="self-center">
                  Cargar más publicaciones
                </Button>
              )}
              {!hasNextPage && items.length > 5 && (
                <p className="py-4 text-center text-caption text-on-surface-variant">Llegaste al final. ¿Tienes una duda? Publícala.</p>
              )}
            </>
          )}
        </section>

        <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Destacados">
          <Destacados />
        </aside>
      </div>

      <FabCrear />
    </Pagina>
  );
}

function Destacados() {
  const { data, isPending, isError, refetch } = useDestacados();
  if (isPending) {
    return (
      <>
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-56 rounded-md" />
      </>
    );
  }
  if (isError) return <EstadoError compacto titulo="No pudimos cargar los destacados" onReintentar={() => void refetch()} />;

  return (
    <>
      <section aria-labelledby="titulo-anuncios" className="rounded-md border border-primary-fixed-dim bg-primary-fixed/60 p-5 md:p-6">
        <h2 id="titulo-anuncios" className="flex items-center gap-2 text-body-lg font-semibold text-on-surface">
          <Icono nombre="campaign" className="text-primary" />
          Anuncios oficiales
        </h2>
        {data.anuncios.length === 0 ? (
          <p className="mt-3 text-body-md text-on-surface-variant">
            Sin anuncios por ahora. Aquí verás fechas de ensayos nacionales y material nuevo del equipo.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {data.anuncios.map((a) => (
              <li key={a.id} className="border-l-4 border-primary pl-3">
                <Link to={`/app/comunidad/${a.id}`} className="rounded-sm text-body-md font-medium text-on-surface hover:text-primary">
                  {a.titulo}
                </Link>
                <p className="mt-0.5 text-caption text-on-surface-variant">{tiempoRelativo(a.creadoEn)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card como="section" aria-labelledby="titulo-profes">
        <h2 id="titulo-profes" className="text-body-lg font-semibold text-on-surface">
          Profesores destacados
        </h2>
        {data.tutores.length === 0 ? (
          <p className="mt-3 text-body-md text-on-surface-variant">Pronto se sumarán profesores a la comunidad.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {data.tutores.map((t) => (
              <FilaTutor key={t.id} tutor={t} />
            ))}
          </ul>
        )}
      </Card>

      {data.temasPopulares.length > 0 && (
        <Card como="section" aria-labelledby="titulo-temas">
          <h2 id="titulo-temas" className="text-body-lg font-semibold text-on-surface">
            Temas populares
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.temasPopulares.map((t) => (
              <li key={t.etiqueta}>
                <Link
                  to={`/app/comunidad/buscar?q=${encodeURIComponent(t.etiqueta)}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full bg-surface-container px-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  #{t.etiqueta}
                  <span className="text-caption tabular-nums text-outline">{t.cantidad}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function FilaTutor({ tutor }: { tutor: DTOTutorResumen }) {
  const seguir = useSeguirTutor(tutor.id);
  return (
    <li className="flex items-center gap-3">
      <Avatar nombre={tutor.nombre} url={urlArchivo(tutor.avatarUrl)} verificado={tutor.verificado} />
      <div className="min-w-0 flex-1">
        <Link to={`/app/tutores/${tutor.id}`} className="block truncate rounded-sm text-body-md font-semibold text-on-surface hover:text-primary">
          {tutor.nombre}
        </Link>
        <p className="truncate text-caption text-on-surface-variant">
          {tutor.demo ? 'Perfil de ejemplo · ' : ''}
          {tutor.especialidad ?? tutor.titulo ?? 'Profesor'} · {formatearNumero(tutor.seguidores)} seguidores
        </p>
      </div>
      <Button
        tamano="sm"
        variante={tutor.loSigo ? 'fantasma' : 'suave'}
        onClick={() => seguir.mutate()}
        cargando={seguir.isPending}
        aria-pressed={tutor.loSigo}
        aria-label={`${tutor.loSigo ? 'Dejar de seguir' : 'Seguir'} a ${tutor.nombre}`}
      >
        {tutor.loSigo ? 'Siguiendo' : 'Seguir'}
      </Button>
    </li>
  );
}

/** Botón flotante para crear (visible en móvil, donde la cabecera lo esconde). */
function FabCrear() {
  const navegar = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navegar('/app/comunidad/nuevo')}
      aria-label="Crear publicación"
      title="Crear publicación"
      className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 md:hidden"
    >
      <Icono nombre="edit" className="text-2xl" />
    </button>
  );
}
