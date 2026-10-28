import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { DTOAutor, DTOPublicacionFeed } from '@paes-pro/shared';
import { MATERIA_ETIQUETA, TIPOS_PUBLICACION_LABEL, tiempoRelativo } from '@paes-pro/shared';
import { urlArchivo } from '@/lib/api';
import { useGuardar, useMeGusta } from '@/lib/data/comunidad';
import { cn } from '@/lib/cn';
import { extracto, rolAutor } from './texto';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { Skeleton } from '@/components/ui/Skeleton';

/** Autor + rol + fecha. Enlaza al perfil cuando es profesor o tutor. */
export function LineaAutor({ autor, fecha, tamano = 'md' }: { autor: DTOAutor; fecha: string; tamano?: 'sm' | 'md' }) {
  const esTutor = autor.rol === 'profesor' || autor.esTutorVerificado;
  const nombre = (
    <span className={cn('font-semibold text-on-surface', tamano === 'sm' ? 'text-label-md' : 'text-body-md')}>{autor.nombre}</span>
  );
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar nombre={autor.nombre} url={urlArchivo(autor.avatarUrl)} tamano={tamano === 'sm' ? 'sm' : 'md'} verificado={autor.esTutorVerificado} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 leading-5">
          {esTutor ? (
            <Link to={`/app/tutores/${autor.id}`} className="rounded-sm hover:underline">
              {nombre}
            </Link>
          ) : (
            nombre
          )}
          {autor.esTutorVerificado && (
            <Chip tono="primario" tamano="sm" icono="verified" iconoRelleno>
              Tutor
            </Chip>
          )}
        </p>
        <p className="text-caption text-on-surface-variant">
          {rolAutor(autor)} · <time dateTime={fecha}>{tiempoRelativo(fecha)}</time>
        </p>
      </div>
    </div>
  );
}

/** Convierte los marcadores ⟦…⟧ del API en <mark>. */
export function TextoResaltado({ texto }: { texto: string }) {
  const partes = texto.split(/(⟦[^⟧]*⟧)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith('⟦') ? (
          <mark key={i} className="rounded-sm bg-secondary-fixed px-0.5 text-on-secondary-fixed">
            {p.slice(1, -1)}
          </mark>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function EtiquetaCategoria({ publicacion }: { publicacion: Pick<DTOPublicacionFeed, 'materia' | 'tipo'> }) {
  return publicacion.materia ? (
    <Chip tono="primario">{MATERIA_ETIQUETA[publicacion.materia.codigo] ?? publicacion.materia.nombre}</Chip>
  ) : (
    <Chip>{TIPOS_PUBLICACION_LABEL[publicacion.tipo]}</Chip>
  );
}

export function Hashtags({ etiquetas, className }: { etiquetas: string[]; className?: string }) {
  if (etiquetas.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Etiquetas">
      {etiquetas.map((e) => (
        <li key={e}>
          <Link
            to={`/app/comunidad/buscar?q=${encodeURIComponent(e)}`}
            className="inline-flex min-h-7 items-center rounded-sm bg-primary-fixed px-2 text-caption font-medium text-on-primary-fixed-variant transition-colors hover:bg-primary-fixed-dim"
          >
            #{e}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Me gusta · comentarios · guardar. Optimista en todas las vistas. */
export function AccionesPublicacion({
  publicacion,
  enlaceComentarios,
  className,
}: {
  publicacion: Pick<DTOPublicacionFeed, 'id' | 'likes' | 'meGusta' | 'guardada' | 'titulo'> & { comentarios: number };
  enlaceComentarios?: boolean;
  className?: string;
}) {
  const meGusta = useMeGusta();
  const guardar = useGuardar();
  const n = publicacion.comentarios;
  const textoComentarios = `${n} ${n === 1 ? 'comentario' : 'comentarios'}`;
  const claseAccion =
    'inline-flex min-h-11 items-center gap-2 rounded px-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => meGusta.mutate(publicacion.id)}
        aria-pressed={publicacion.meGusta}
        aria-label={`${publicacion.meGusta ? 'Quitar me gusta' : 'Me gusta'}: ${publicacion.likes}`}
        className={cn(claseAccion, publicacion.meGusta && 'text-primary hover:text-primary')}
      >
        <Icono nombre="thumb_up" relleno={publicacion.meGusta} className="text-xl" />
        <span className="tabular-nums">{publicacion.likes}</span>
      </button>
      {enlaceComentarios ? (
        <Link to={`/app/comunidad/${publicacion.id}#comentarios`} className={claseAccion}>
          <Icono nombre="chat_bubble" className="text-xl" />
          {textoComentarios}
        </Link>
      ) : (
        <a href="#comentarios" className={claseAccion}>
          <Icono nombre="chat_bubble" className="text-xl" />
          {textoComentarios}
        </a>
      )}
      <button
        type="button"
        onClick={() => guardar.mutate(publicacion.id)}
        aria-pressed={publicacion.guardada}
        className={cn(claseAccion, 'ml-auto', publicacion.guardada && 'text-primary hover:text-primary')}
      >
        <Icono nombre="bookmark" relleno={publicacion.guardada} className="text-xl" />
        <span className={cn(!enlaceComentarios ? '' : 'sr-only sm:not-sr-only')}>{publicacion.guardada ? 'Guardada' : 'Guardar'}</span>
      </button>
    </div>
  );
}

/** Tarjeta de publicación del feed, la búsqueda y los perfiles. */
export function TarjetaPublicacion({ publicacion, cabecera }: { publicacion: DTOPublicacionFeed; cabecera?: ReactNode }) {
  const resaltado = publicacion.resaltado;
  return (
    <Card como="article" padding="ninguno" className="transition-shadow duration-200 hover:shadow-card-hover">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          {cabecera ?? <LineaAutor autor={publicacion.autor} fecha={publicacion.creadoEn} />}
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {publicacion.resuelta && (
              <Chip tono="exito" icono="check_circle" tamano="sm">
                Resuelta
              </Chip>
            )}
            <EtiquetaCategoria publicacion={publicacion} />
          </div>
        </div>
        <h2 className="mt-4 text-body-lg font-semibold text-on-surface md:text-headline-md">
          <Link to={`/app/comunidad/${publicacion.id}`} className="rounded-sm hover:text-primary">
            {resaltado ? <TextoResaltado texto={resaltado.titulo} /> : publicacion.titulo}
          </Link>
        </h2>
        <p className="mt-2 text-body-md text-on-surface-variant text-pretty">
          {resaltado?.cuerpo ? <TextoResaltado texto={resaltado.cuerpo} /> : extracto(publicacion.cuerpo)}
        </p>
        <Hashtags etiquetas={publicacion.etiquetas} className="mt-4" />
      </div>
      <div className="border-t border-border px-3 py-1 md:px-4">
        <AccionesPublicacion publicacion={publicacion} enlaceComentarios />
      </div>
    </Card>
  );
}

export function SkeletonPublicacion() {
  return (
    <Card padding="md" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-6 h-9 w-48" />
    </Card>
  );
}
