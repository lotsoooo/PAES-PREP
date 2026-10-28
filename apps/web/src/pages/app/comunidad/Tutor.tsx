import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { formatearNumero, tiempoRelativo, type DTOResena } from '@paes-pro/shared';
import { ApiError, urlArchivo } from '@/lib/api';
import { useSesion } from '@/app/sesion';
import { usePerfilTutor, useResenar, useSeguirTutor, type DTOPerfilTutor } from '@/lib/data/comunidad';
import { useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { SegmentedControl, Breadcrumbs } from '@/components/ui/Navegacion';
import { Textarea } from '@/components/ui/Input';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { SkeletonPublicacion, TarjetaPublicacion } from '@/components/comunidad/Publicacion';

type Orden = 'recientes' | 'populares';

export default function Tutor() {
  const { id } = useParams();
  const [orden, setOrden] = useState<Orden>('recientes');
  const { data, isPending, isError, error, refetch, isFetching } = usePerfilTutor(id, orden);
  const nombre = data ? [data.usuario.nombre, data.usuario.apellido].filter(Boolean).join(' ') : null;
  useTitulo(nombre ?? 'Perfil de tutor');

  if (isPending) {
    return (
      <Pagina>
        <Cargando etiqueta="Cargando perfil…">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="-mt-16 mx-4 h-52 rounded-lg md:mx-8" />
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-64 rounded-md lg:col-span-4" />
            <div className="flex flex-col gap-4 lg:col-span-8">
              <SkeletonPublicacion />
            </div>
          </div>
        </Cargando>
      </Pagina>
    );
  }

  if (isError) {
    return (
      <Pagina>
        {error instanceof ApiError && error.status === 404 ? (
          <EstadoVacio
            icono="person_off"
            titulo="Este perfil no existe o no es público"
            descripcion="Puede que el tutor haya cerrado su cuenta."
            accion={<BotonEnlace to="/app/comunidad">Volver a la comunidad</BotonEnlace>}
          />
        ) : (
          <EstadoError descripcion={error.message} onReintentar={() => void refetch()} />
        )}
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Breadcrumbs items={[{ etiqueta: 'Comunidad', to: '/app/comunidad' }, { etiqueta: nombre ?? 'Tutor' }]} className="mb-4" />
      <Cabecera datos={data} nombre={nombre ?? ''} />

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Impacto datos={data} />
          <Resenas datos={data} tutorId={id!} />
        </div>

        <section className="min-w-0 lg:col-span-8" aria-labelledby="titulo-pubs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="titulo-pubs" className="text-headline-md text-on-surface">
              Publicaciones y tips
            </h2>
            <SegmentedControl
              etiquetaAria="Ordenar publicaciones"
              valor={orden}
              onCambio={setOrden}
              tamano="sm"
              opciones={[
                { valor: 'recientes', etiqueta: 'Más recientes' },
                { valor: 'populares', etiqueta: 'Populares' },
              ]}
            />
          </div>
          {data.publicaciones.length === 0 ? (
            <EstadoVacio
              compacto
              icono="edit_note"
              titulo="Todavía no ha publicado"
              descripcion={`Cuando ${data.usuario.nombre} comparta tips o resuelva dudas, aparecerán aquí.`}
            />
          ) : (
            <ul className={cn('flex flex-col gap-4 transition-opacity', isFetching && 'opacity-60')}>
              {data.publicaciones.map((p) => (
                <li key={p.id}>
                  <TarjetaPublicacion
                    publicacion={p}
                    cabecera={
                      <p className="text-caption text-on-surface-variant">
                        <time dateTime={p.creadoEn}>{tiempoRelativo(p.creadoEn)}</time>
                      </p>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Pagina>
  );
}

function Cabecera({ datos, nombre }: { datos: DTOPerfilTutor; nombre: string }) {
  const yo = useSesion((s) => s.usuario?.id);
  const seguir = useSeguirTutor(datos.usuario.id);
  const navegar = useNavigate();
  const { perfil } = datos;
  const esYo = yo === datos.usuario.id;

  const alSeguir = () =>
    seguir.mutate(undefined, {
      onSuccess: (r) => toast.success(r.loSigo ? `Ahora sigues a ${datos.usuario.nombre}` : `Dejaste de seguir a ${datos.usuario.nombre}`),
      onError: (e) => toast.error(e.message),
    });

  return (
    <section aria-labelledby="titulo-tutor" className="overflow-hidden rounded-lg border border-border bg-surface-container-lowest shadow-card">
      <div aria-hidden="true" className="h-28 bg-primary-container md:h-36" />
      <div className="flex flex-col gap-6 px-5 pb-6 md:flex-row md:items-start md:px-8 md:pb-8">
        <span className="-mt-14 inline-flex self-start rounded-full bg-surface-container-lowest p-1.5 md:-mt-16">
          <Avatar nombre={nombre} url={urlArchivo(datos.usuario.avatarUrl)} tamano="xl" verificado={perfil.verificado} className="[&>span:first-child]:size-28 [&>img]:size-28" />
        </span>
        <div className="min-w-0 flex-1 md:pt-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 id="titulo-tutor" className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
                {nombre}
              </h1>
              {perfil.titulo && <p className="mt-1 text-body-md text-on-surface-variant">{perfil.titulo}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {perfil.especialidad && (
                  <Chip tono="primario" icono="school">
                    {perfil.especialidad}
                  </Chip>
                )}
                {perfil.demo && (
                  <Chip icono="science" title="Perfil creado como ejemplo: su rating y seguidores son ilustrativos.">
                    Perfil de ejemplo
                  </Chip>
                )}
                {perfil.verificado && (
                  <Chip tono="primario" icono="verified" iconoRelleno>
                    Tutor verificado
                  </Chip>
                )}
                <span className="inline-flex items-center gap-1 text-body-md text-on-surface">
                  <Icono nombre="star" relleno className="text-xl text-tertiary-container" />
                  <span className="font-semibold tabular-nums">{perfil.ratingPromedio.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  <span className="text-on-surface-variant">
                    ({formatearNumero(perfil.ratingCantidad)} {perfil.ratingCantidad === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </span>
              </div>
            </div>
            {!esYo && (
              <div className="flex w-full gap-3 sm:w-auto">
                <Button
                  variante="secundario"
                  iconoIzquierdo="mail"
                  className="flex-1 sm:flex-none"
                  onClick={() => navegar(`/app/comunidad/nuevo?mencion=${encodeURIComponent(nombre)}`)}
                >
                  Mensaje
                </Button>
                <Button
                  variante={datos.loSigo ? 'suave' : 'primario'}
                  iconoIzquierdo={datos.loSigo ? 'how_to_reg' : 'person_add'}
                  aria-pressed={datos.loSigo}
                  onClick={alSeguir}
                  cargando={seguir.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {datos.loSigo ? 'Siguiendo' : 'Seguir'}
                </Button>
              </div>
            )}
          </div>
          {perfil.bio && <p className="texto-lectura mt-4 text-body-md text-on-surface">{perfil.bio}</p>}
        </div>
      </div>
    </section>
  );
}

function Impacto({ datos }: { datos: DTOPerfilTutor }) {
  const cifras = [
    { etiqueta: 'Respuestas dadas', valor: datos.impacto.respuestas },
    { etiqueta: 'Me gusta recibidos', valor: datos.impacto.likes },
    { etiqueta: 'Estudiantes lo siguen', valor: datos.perfil.seguidores },
  ];
  return (
    <Card como="section" aria-labelledby="titulo-impacto">
      <h2 id="titulo-impacto" className="text-body-lg font-semibold text-on-surface">
        Impacto en la comunidad
      </h2>
      <dl className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-border">
        {cifras.map((c) => (
          <div key={c.etiqueta} className="rounded bg-surface-container-low p-3 lg:flex lg:items-baseline lg:justify-between lg:rounded-none lg:bg-transparent lg:px-0 lg:py-3">
            <dt className="text-caption text-on-surface-variant lg:text-body-md">{c.etiqueta}</dt>
            <dd className="mt-1 text-headline-md font-bold text-on-surface tabular-nums lg:mt-0">{formatearNumero(c.valor)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Estrellas({ valor, className }: { valor: number; className?: string }) {
  return (
    <span className={cn('inline-flex', className)} role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icono key={n} nombre="star" relleno={n <= valor} className={cn('text-base', n <= valor ? 'text-tertiary-container' : 'text-outline-variant')} />
      ))}
    </span>
  );
}

function Resenas({ datos, tutorId }: { datos: DTOPerfilTutor; tutorId: string }) {
  const yo = useSesion((s) => s.usuario);
  const puedeResenar = yo && yo.id !== tutorId && !datos.resenas.some((r) => r.autorNombre === yo.nombre);
  return (
    <Card como="section" aria-labelledby="titulo-resenas">
      <h2 id="titulo-resenas" className="text-body-lg font-semibold text-on-surface">
        Reseñas
      </h2>
      {datos.resenas.length === 0 ? (
        <p className="mt-2 text-body-md text-on-surface-variant">Aún no hay reseñas escritas.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {datos.resenas.slice(0, 5).map((r: DTOResena) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label-md font-semibold text-on-surface">{r.autorNombre}</span>
                <Estrellas valor={r.calificacion} />
              </div>
              {r.comentario && <p className="mt-1 text-body-md text-on-surface">{r.comentario}</p>}
              <p className="mt-1 text-caption text-on-surface-variant">{tiempoRelativo(r.creadoEn)}</p>
            </li>
          ))}
        </ul>
      )}
      {puedeResenar && <FormResena tutorId={tutorId} />}
    </Card>
  );
}

function FormResena({ tutorId }: { tutorId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const resenar = useResenar(tutorId);
  if (!abierto) {
    return (
      <Button variante="suave" tamano="sm" iconoIzquierdo="rate_review" className="mt-4" onClick={() => setAbierto(true)}>
        Escribir reseña
      </Button>
    );
  }
  return (
    <form
      className="mt-4 border-t border-border pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nota) {
          toast.error('Elige de 1 a 5 estrellas.');
          return;
        }
        resenar.mutate(
          { calificacion: nota, comentario: comentario.trim() || undefined },
          {
            onSuccess: () => {
              toast.success('Gracias por tu reseña');
              setAbierto(false);
            },
            onError: (er) => toast.error(er.message),
          },
        );
      }}
    >
      <fieldset>
        <legend className="text-label-md font-medium text-on-surface">Tu calificación</legend>
        <div className="mt-1 flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNota(n)}
              aria-pressed={nota === n}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              className="flex size-11 items-center justify-center rounded-full hover:bg-surface-container-high"
            >
              <Icono nombre="star" relleno={n <= nota} className={cn('text-2xl', n <= nota ? 'text-tertiary-container' : 'text-outline')} />
            </button>
          ))}
        </div>
      </fieldset>
      <Textarea
        id="comentario-resena"
        label="Comentario"
        opcional
        rows={3}
        maxLength={1000}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        contenedorClassName="mt-3"
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button variante="fantasma" tamano="sm" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
        <Button type="submit" tamano="sm" cargando={resenar.isPending}>
          Publicar reseña
        </Button>
      </div>
    </form>
  );
}
