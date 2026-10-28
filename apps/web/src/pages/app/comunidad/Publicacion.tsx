import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import type { DTOComentarioSocial, DTOPublicacionCompleta } from '@paes-pro/shared';
import { MATERIA_ETIQUETA, TIPOS_PUBLICACION_LABEL, tiempoRelativo } from '@paes-pro/shared';
import { ApiError, urlArchivo } from '@/lib/api';
import { useSesion } from '@/app/sesion';
import {
  useComentar,
  useDestacados,
  useFeed,
  useMarcarMejor,
  useMeGustaComentario,
  usePublicacion,
  useReportar,
} from '@/lib/data/comunidad';
import { useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button, BotonEnlace } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { CuerpoRico } from '@/components/comunidad/CuerpoRico';
import { AccionesPublicacion, EtiquetaCategoria, Hashtags, LineaAutor } from '@/components/comunidad/Publicacion';
import { rolAutor } from '@/components/comunidad/texto';

export default function Publicacion() {
  const { postId } = useParams();
  const { data, isPending, isError, error, refetch, isRefetching } = usePublicacion(postId);
  useTitulo(data?.titulo ?? 'Publicación');

  return (
    <Pagina>
      <Link
        to="/app/comunidad"
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded text-label-md font-medium text-on-surface-variant transition-colors hover:text-primary"
      >
        <Icono nombre="arrow_back" />
        Volver a la comunidad
      </Link>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {isPending ? (
            <Cargando etiqueta="Cargando publicación…">
              <Card padding="lg">
                <Skeleton className="h-11 w-60" />
                <Skeleton className="mt-6 h-8 w-4/5" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </Card>
            </Cargando>
          ) : isError ? (
            error instanceof ApiError && error.status === 404 ? (
              <EstadoVacio
                icono="search_off"
                titulo="Esta publicación ya no está disponible"
                descripcion="Puede que la hayan eliminado. Vuelve al feed para ver otras conversaciones."
                accion={<BotonEnlace to="/app/comunidad">Ir a la comunidad</BotonEnlace>}
              />
            ) : (
              <EstadoError descripcion={error.message} onReintentar={() => void refetch()} cargando={isRefetching} />
            )
          ) : (
            <>
              <CuerpoPublicacion publicacion={data} />
              <Comentarios publicacion={data} />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Relacionado">
          <Relacionadas materia={data?.materia?.codigo} actualId={postId} />
        </aside>
      </div>
    </Pagina>
  );
}

function CuerpoPublicacion({ publicacion }: { publicacion: DTOPublicacionCompleta }) {
  const [reportando, setReportando] = useState(false);
  return (
    <Card como="article" padding="ninguno" aria-labelledby="titulo-publicacion">
      <div className="p-5 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <LineaAutor autor={publicacion.autor} fecha={publicacion.creadoEn} />
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {publicacion.resuelta && (
              <Chip tono="exito" icono="check_circle" tamano="sm">
                Resuelta
              </Chip>
            )}
            <EtiquetaCategoria publicacion={publicacion} />
          </div>
        </div>
        <h1 id="titulo-publicacion" className="mt-5 text-headline-md text-on-surface text-balance md:text-[28px] md:leading-9">
          {publicacion.titulo}
        </h1>
        <p className="mt-1 text-caption text-on-surface-variant">
          {TIPOS_PUBLICACION_LABEL[publicacion.tipo]}
          {publicacion.materia && ` · ${MATERIA_ETIQUETA[publicacion.materia.codigo] ?? publicacion.materia.nombre}`}
        </p>
        <CuerpoRico texto={publicacion.cuerpo} className="texto-lectura mt-5 text-body-lg text-on-surface" />
        <Hashtags etiquetas={publicacion.etiquetas} className="mt-6" />
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-1 md:px-6">
        <AccionesPublicacion publicacion={{ ...publicacion, comentarios: publicacion.totalComentarios }} className="flex-1" />
        {!publicacion.soyAutor && (
          <Button variante="fantasma" tamano="sm" iconoIzquierdo="flag" onClick={() => setReportando(true)}>
            <span className="sr-only sm:not-sr-only">Reportar</span>
          </Button>
        )}
      </div>
      <ModalReporte abierto={reportando} onCerrar={() => setReportando(false)} publicacionId={publicacion.id} />
    </Card>
  );
}

function Comentarios({ publicacion }: { publicacion: DTOPublicacionCompleta }) {
  const comentarios = [...publicacion.comentarios].sort((a, b) => Number(b.esMejor) - Number(a.esMejor));
  return (
    <section id="comentarios" aria-labelledby="titulo-comentarios" className="mt-10 scroll-mt-24">
      <h2 id="titulo-comentarios" className="text-body-lg font-semibold text-on-surface">
        Comentarios <span className="tabular-nums text-on-surface-variant">({publicacion.totalComentarios})</span>
      </h2>
      <Card className="mt-4">
        <Compositor publicacionId={publicacion.id} />
      </Card>
      {comentarios.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-outline-variant px-5 py-6 text-center text-body-md text-on-surface-variant">
          Nadie ha comentado todavía. {publicacion.tipo === 'duda' ? 'Si sabes la respuesta, ayuda a resolverla.' : 'Comparte lo que piensas.'}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {comentarios.map((c) => (
            <li key={c.id}>
              <Comentario comentario={c} publicacion={publicacion} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Caja de comentario. Con `respondeA` es la respuesta en línea a un comentario. */
function Compositor({
  publicacionId,
  respondeA,
  alTerminar,
}: {
  publicacionId: string;
  respondeA?: DTOComentarioSocial;
  alTerminar?: () => void;
}) {
  const usuario = useSesion((s) => s.usuario);
  const [texto, setTexto] = useState(respondeA ? `@${respondeA.autor.nombre.split(' ')[0]} ` : '');
  const [error, setError] = useState<string | undefined>();
  const comentar = useComentar(publicacionId);
  const id = respondeA ? `respuesta-${respondeA.id}` : 'nuevo-comentario';

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const cuerpo = texto.trim();
    if (!cuerpo) {
      setError('Escribe tu comentario antes de enviarlo.');
      return;
    }
    comentar.mutate(
      { cuerpo, respondeAId: respondeA?.id ?? null },
      {
        onSuccess: () => {
          setTexto('');
          setError(undefined);
          toast.success(respondeA ? 'Respuesta publicada' : 'Comentario publicado');
          alTerminar?.();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={enviar} className="flex gap-3">
      {usuario && <Avatar nombre={usuario.nombre} url={urlArchivo(usuario.avatarUrl)} tamano="sm" className="hidden sm:inline-flex" />}
      <div className="flex-1">
        <Textarea
          id={id}
          label={respondeA ? `Responder a ${respondeA.autor.nombre}` : 'Escribe un comentario'}
          labelOculto
          rows={respondeA ? 2 : 3}
          maxLength={4000}
          value={texto}
          autoFocus={Boolean(respondeA)}
          onChange={(e) => {
            setTexto(e.target.value);
            if (error) setError(undefined);
          }}
          placeholder={respondeA ? 'Escribe tu respuesta…' : 'Escribe una respuesta útil… Puedes usar $x^2$ para fórmulas.'}
          error={error}
        />
        <div className="mt-3 flex justify-end gap-2">
          {alTerminar && (
            <Button variante="fantasma" tamano="sm" onClick={alTerminar}>
              Cancelar
            </Button>
          )}
          <Button type="submit" tamano={respondeA ? 'sm' : 'md'} cargando={comentar.isPending}>
            {respondeA ? 'Responder' : 'Comentar'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Comentario({
  comentario,
  publicacion,
  esRespuesta,
}: {
  comentario: DTOComentarioSocial;
  publicacion: DTOPublicacionCompleta;
  esRespuesta?: boolean;
}) {
  const [respondiendo, setRespondiendo] = useState(false);
  const meGusta = useMeGustaComentario(publicacion.id);
  const mejor = useMarcarMejor(publicacion.id);
  const autor = comentario.autor;

  return (
    <div
      className={cn(
        esRespuesta ? 'border-l-2 border-outline-variant pl-4' : 'rounded-md border bg-surface-container-lowest p-5 shadow-card',
        !esRespuesta && (comentario.esMejor ? 'border-success' : 'border-border'),
      )}
    >
      {comentario.esMejor && (
        <p className="mb-3 inline-flex items-center gap-1.5 text-label-md font-semibold text-success">
          <Icono nombre="verified" relleno />
          Mejor respuesta
        </p>
      )}
      <div className="flex gap-3">
        <Avatar nombre={autor.nombre} url={urlArchivo(autor.avatarUrl)} tamano="sm" verificado={autor.esTutorVerificado} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 leading-5">
            {autor.rol === 'profesor' || autor.esTutorVerificado ? (
              <Link to={`/app/tutores/${autor.id}`} className="rounded-sm text-label-md font-semibold text-on-surface hover:underline">
                {autor.nombre}
              </Link>
            ) : (
              <span className="text-label-md font-semibold text-on-surface">{autor.nombre}</span>
            )}
            {autor.esTutorVerificado && (
              <Chip tono="primario" tamano="sm" icono="verified" iconoRelleno>
                Tutor
              </Chip>
            )}
          </p>
          <p className="text-caption text-on-surface-variant">
            {rolAutor(autor)} · <time dateTime={comentario.creadoEn}>{tiempoRelativo(comentario.creadoEn)}</time>
          </p>
          <CuerpoRico texto={comentario.cuerpo} className="mt-2 text-body-md text-on-surface" />
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => meGusta.mutate(comentario.id)}
              aria-pressed={comentario.meGusta}
              aria-label={`${comentario.meGusta ? 'Quitar me gusta' : 'Me gusta'}: ${comentario.likes}`}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-caption font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high',
                comentario.meGusta && 'text-primary',
              )}
            >
              <Icono nombre="thumb_up" relleno={comentario.meGusta} className="text-base" />
              <span className="tabular-nums">{comentario.likes}</span>
            </button>
            <button
              type="button"
              onClick={() => setRespondiendo((v) => !v)}
              aria-expanded={respondiendo}
              className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-caption font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Icono nombre="reply" className="text-base" />
              Responder
            </button>
            {publicacion.puedeMarcarMejor && !esRespuesta && !comentario.esMejor && autor.id !== publicacion.autor.id && (
              <button
                type="button"
                onClick={() =>
                  mejor.mutate(comentario.id, {
                    onSuccess: () => toast.success('Marcaste la mejor respuesta'),
                    onError: (e) => toast.error(e.message),
                  })
                }
                disabled={mejor.isPending}
                className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-caption font-medium text-success transition-colors hover:bg-success-container"
              >
                <Icono nombre="check_circle" className="text-base" />
                Marcar como mejor respuesta
              </button>
            )}
          </div>
          {respondiendo && (
            <div className="mt-3">
              <Compositor publicacionId={publicacion.id} respondeA={comentario} alTerminar={() => setRespondiendo(false)} />
            </div>
          )}
          {comentario.respuestas.length > 0 && (
            <ul className="mt-4 flex flex-col gap-4">
              {comentario.respuestas.map((r) => (
                <li key={r.id}>
                  <Comentario comentario={r} publicacion={publicacion} esRespuesta />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Relacionadas({ materia, actualId }: { materia: string | undefined; actualId: string | undefined }) {
  const populares = useFeed({ materia, orden: 'populares' });
  const destacados = useDestacados();
  const lista = (populares.data?.pages[0]?.items ?? []).filter((p) => p.id !== actualId).slice(0, 4);
  const nombreMateria = materia ? (MATERIA_ETIQUETA[materia] ?? materia) : null;

  return (
    <>
      <Card como="section" aria-labelledby="titulo-populares">
        <h2 id="titulo-populares" className="text-body-lg font-semibold text-on-surface">
          {nombreMateria ? `Populares en ${nombreMateria}` : 'Populares en la comunidad'}
        </h2>
        {populares.isPending ? (
          <div className="mt-4 flex flex-col gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : lista.length === 0 ? (
          <p className="mt-3 text-body-md text-on-surface-variant">Todavía no hay otras conversaciones de esta materia.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {lista.map((p) => (
              <li key={p.id} className="py-3">
                <Link to={`/app/comunidad/${p.id}`} className="rounded-sm text-body-md font-medium text-on-surface hover:text-primary">
                  {p.titulo}
                </Link>
                <p className="mt-1 text-caption text-on-surface-variant tabular-nums">
                  {p.likes} me gusta · {p.comentarios} {p.comentarios === 1 ? 'comentario' : 'comentarios'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {destacados.data && destacados.data.temasPopulares.length > 0 && (
        <Card como="section" aria-labelledby="titulo-temas">
          <h2 id="titulo-temas" className="text-body-lg font-semibold text-on-surface">
            Temas populares
          </h2>
          <Hashtags etiquetas={destacados.data.temasPopulares.map((t) => t.etiqueta)} className="mt-3" />
        </Card>
      )}
      <BotonEnlace to="/app/comunidad/nuevo" variante="secundario" iconoIzquierdo="edit" anchoCompleto>
        Hacer una pregunta
      </BotonEnlace>
    </>
  );
}

function ModalReporte({ abierto, onCerrar, publicacionId }: { abierto: boolean; onCerrar: () => void; publicacionId: string }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | undefined>();
  const reportar = useReportar();
  const enviar = () => {
    if (motivo.trim().length < 5) {
      setError('Cuéntanos en pocas palabras qué pasa (mínimo 5 caracteres).');
      return;
    }
    reportar.mutate(
      { publicacionId, motivo: motivo.trim() },
      {
        onSuccess: () => {
          toast.success('Gracias. El equipo revisará la publicación.');
          setMotivo('');
          onCerrar();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };
  return (
    <Modal
      abierto={abierto}
      onAbiertoChange={(v) => !v && onCerrar()}
      titulo="Reportar publicación"
      descripcion="Los reportes son anónimos. Úsalos para contenido ofensivo, spam o respuestas de ensayos en curso."
      pie={
        <>
          <Button variante="fantasma" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variante="peligro" onClick={enviar} cargando={reportar.isPending}>
            Enviar reporte
          </Button>
        </>
      }
    >
      <Textarea
        id="motivo-reporte"
        label="Motivo"
        rows={3}
        maxLength={500}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        error={error}
      />
    </Modal>
  );
}
