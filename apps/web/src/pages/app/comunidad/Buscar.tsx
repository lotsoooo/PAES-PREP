import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MATERIA_ETIQUETA, TIPOS_PUBLICACION, TIPOS_PUBLICACION_LABEL, type TipoPublicacion } from '@paes-pro/shared';
import { useBusquedaComunidad, useMaterias, type FiltrosBusqueda } from '@/lib/data/comunidad';
import { useDebounce, useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { ChipFiltro } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Input';
import { RadioGrupo } from '@/components/ui/Seleccion';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Breadcrumbs } from '@/components/ui/Navegacion';
import { EstadoError, EstadoVacio } from '@/components/ui/Skeleton';
import { SkeletonPublicacion, TarjetaPublicacion } from '@/components/comunidad/Publicacion';

type Desde = NonNullable<FiltrosBusqueda['desde']>;
const FECHAS: { valor: '' | Desde; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Cualquier fecha' },
  { valor: 'semana', etiqueta: 'Última semana' },
  { valor: 'mes', etiqueta: 'Último mes' },
  { valor: 'anio', etiqueta: 'Último año' },
];

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const qUrl = params.get('q') ?? '';
  const materia = params.get('materia') ?? undefined;
  const tipoP = params.get('tipo');
  const tipo = TIPOS_PUBLICACION.includes(tipoP as TipoPublicacion) ? (tipoP as TipoPublicacion) : undefined;
  const desdeP = params.get('desde');
  const desde = FECHAS.some((f) => f.valor === desdeP && f.valor) ? (desdeP as Desde) : undefined;

  const [texto, setTexto] = useState(qUrl);
  const q = useDebounce(texto.trim(), 300);
  useTitulo(qUrl ? `Buscar «${qUrl}»` : 'Buscar en la comunidad');

  const cambiar = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(cambios)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  };

  // El texto escrito viaja a la URL (con pausa) para poder compartir la búsqueda.
  useEffect(() => {
    if (q !== qUrl) cambiar({ q: q || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Si la URL cambia desde fuera (un hashtag), el campo la sigue.
  useEffect(() => {
    if (qUrl !== q) setTexto(qUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qUrl]);

  const materias = useMaterias();
  const busqueda = useBusquedaComunidad({ q: qUrl, materia, tipo, desde });
  const hayFiltros = Boolean(materia || tipo || desde);
  const limpiar = () => cambiar({ materia: undefined, tipo: undefined, desde: undefined });
  const muyCorto = qUrl.length > 0 && qUrl.length < 2;

  return (
    <Pagina>
      <Breadcrumbs items={[{ etiqueta: 'Comunidad', to: '/app/comunidad' }, { etiqueta: 'Buscar' }]} className="mb-4" />
      <EncabezadoPagina titulo="Búsqueda en la comunidad" className="mb-5" />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="max-w-2xl">
        <label htmlFor="buscar-comunidad" className="sr-only">
          Buscar publicaciones
        </label>
        <div className="relative">
          <Icono nombre="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            id="buscar-comunidad"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Busca por tema, ejercicio o #etiqueta"
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={!qUrl}
            className="min-h-14 w-full rounded border border-border-strong bg-surface-container-lowest pl-12 pr-4 text-body-lg text-on-surface placeholder:text-outline transition-[border-color,box-shadow] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3" aria-labelledby="titulo-filtros">
          <Card className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-filtros" className="text-body-lg font-semibold text-on-surface">
                Filtros
              </h2>
              <button
                type="button"
                onClick={limpiar}
                disabled={!hayFiltros}
                className="min-h-9 rounded px-2 text-label-md font-medium text-primary transition-colors hover:bg-primary/8 disabled:text-outline disabled:hover:bg-transparent"
              >
                Limpiar
              </button>
            </div>

            <RadioGrupo
              className="mt-5"
              leyenda="Materia"
              nombre="materia"
              valor={materia ?? ''}
              onCambio={(v) => cambiar({ materia: v || undefined })}
              opciones={[
                { valor: '', etiqueta: 'Todas' },
                ...(materias.data ?? []).map((m) => ({ valor: m.codigo, etiqueta: MATERIA_ETIQUETA[m.codigo] ?? m.nombre })),
              ]}
            />

            <fieldset className="mt-6">
              <legend className="mb-2 text-label-md font-medium text-on-surface">Tipo de publicación</legend>
              <div className="flex flex-wrap gap-2">
                {TIPOS_PUBLICACION.map((t) => (
                  <ChipFiltro key={t} activo={tipo === t} onClick={() => cambiar({ tipo: tipo === t ? undefined : t })}>
                    {TIPOS_PUBLICACION_LABEL[t]}
                  </ChipFiltro>
                ))}
              </div>
            </fieldset>

            <Select
              contenedorClassName="mt-6"
              label="Fecha"
              value={desde ?? ''}
              onChange={(e) => cambiar({ desde: e.target.value || undefined })}
              opciones={FECHAS.map((f) => ({ valor: f.valor, etiqueta: f.etiqueta }))}
            />
          </Card>
        </aside>

        <section className="min-w-0 lg:col-span-9" aria-labelledby="titulo-resultados" aria-busy={busqueda.isFetching}>
          <h2 id="titulo-resultados" className="sr-only">
            Resultados
          </h2>
          {!qUrl || muyCorto ? (
            <EstadoVacio
              icono="travel_explore"
              titulo={muyCorto ? 'Escribe al menos 2 letras' : '¿Qué quieres encontrar?'}
              descripcion="Busca un tema («logaritmos»), un tipo de ejercicio («probabilidad condicional») o una etiqueta («#consejopaes»)."
            />
          ) : busqueda.isPending ? (
            <div className="flex flex-col gap-4">
              <p className="h-6" />
              <SkeletonPublicacion />
              <SkeletonPublicacion />
            </div>
          ) : busqueda.isError ? (
            <EstadoError descripcion={busqueda.error.message} onReintentar={() => void busqueda.refetch()} />
          ) : (
            <>
              <p className="border-b border-border pb-3 text-body-md text-on-surface-variant" aria-live="polite">
                {busqueda.data.total === 0 ? 'Sin resultados' : busqueda.data.total === 1 ? 'Mostrando 1 resultado' : `Mostrando ${busqueda.data.total} resultados`}{' '}
                para <strong className="font-semibold text-on-surface">«{qUrl}»</strong>
                {busqueda.data.total >= 50 && ' (los 50 más relevantes)'}
              </p>
              {busqueda.data.items.length === 0 ? (
                <EstadoVacio
                  className="mt-4"
                  icono="search_off"
                  titulo="No encontramos publicaciones"
                  descripcion={hayFiltros ? 'Prueba quitando filtros o con otra palabra.' : 'Prueba con otra palabra o haz tú la pregunta: alguien te va a responder.'}
                  accion={
                    <div className="flex flex-wrap justify-center gap-2">
                      {hayFiltros && (
                        <Button variante="secundario" onClick={limpiar}>
                          Quitar filtros
                        </Button>
                      )}
                      <BotonEnlace to="/app/comunidad/nuevo" iconoIzquierdo="edit">
                        Hacer la pregunta
                      </BotonEnlace>
                    </div>
                  }
                />
              ) : (
                <ul className={cn('mt-4 flex flex-col gap-4 transition-opacity', busqueda.isFetching && 'opacity-60')}>
                  {busqueda.data.items.map((p) => (
                    <li key={p.id}>
                      <TarjetaPublicacion publicacion={p} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </Pagina>
  );
}
