import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { DTOContenido } from '@paes-pro/shared';
import { useBibliotecaContenidos, type FiltrosContenidos } from '@/lib/data/contenidos';
import { useDebounce, useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Input, Select } from '@/components/ui/Input';
import { ChipFiltro } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TarjetaContenido } from '@/components/contenidos/TarjetaContenido';
import { TIPO_CONTENIDO } from '@/components/contenidos/tipos';

const AREAS = [
  { valor: '', etiqueta: 'Todas las materias' },
  { valor: 'matematicas', etiqueta: 'Matemática' },
  { valor: 'lenguaje', etiqueta: 'Lenguaje' },
  { valor: 'ciencias', etiqueta: 'Ciencias' },
  { valor: 'historia', etiqueta: 'Historia' },
];

const TIPOS = [
  { valor: '', etiqueta: 'Todos los tipos' },
  { valor: 'video', etiqueta: 'Videos' },
  { valor: 'pdf', etiqueta: 'Guías PDF' },
  { valor: 'mixto', etiqueta: 'Lecciones' },
  { valor: 'practica', etiqueta: 'Práctica' },
];

const ESTADOS = [
  { valor: '', etiqueta: 'Cualquier avance' },
  { valor: 'pendiente', etiqueta: 'Sin empezar' },
  { valor: 'en_curso', etiqueta: 'En curso' },
  { valor: 'completado', etiqueta: 'Completados' },
];

export default function BibliotecaContenidos() {
  useTitulo('Biblioteca de contenidos');
  const [params, setParams] = useSearchParams();
  const materia = params.get('materia') ?? '';
  const tipo = params.get('tipo') ?? '';
  const estado = params.get('estado') ?? '';
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const q = useDebounce(texto.trim(), 300);

  const filtros: FiltrosContenidos = {
    materia: materia || undefined,
    tipo: (tipo || undefined) as FiltrosContenidos['tipo'],
    estado: (estado || undefined) as FiltrosContenidos['estado'],
    q: q || undefined,
  };
  const { data, isLoading, isError, refetch, isFetching, isPlaceholderData } = useBibliotecaContenidos(filtros);
  const hayFiltros = Boolean(materia || tipo || estado || q);

  const cambiar = (clave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
  };
  const limpiar = () => {
    setTexto('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Biblioteca de contenidos"
        descripcion="Lecciones, guías y práctica para cada prueba de la PAES, ordenadas por eje temático."
      />

      {data?.continuar && !hayFiltros && <Continuar contenido={data.continuar} />}

      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Filtrar por materia" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-fino md:mx-0 md:flex-wrap md:px-0">
          {AREAS.map((a) => (
            <ChipFiltro key={a.valor || 'todas'} activo={materia === a.valor} onClick={() => cambiar('materia', a.valor)}>
              {a.etiqueta}
            </ChipFiltro>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          <Input
            label="Buscar contenidos"
            labelOculto
            type="search"
            iconoIzquierdo="search"
            placeholder="Buscar por tema, por ejemplo “funciones”…"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              cambiar('q', e.target.value.trim());
            }}
            contenedorClassName="sm:col-span-2 lg:col-span-1"
          />
          <Select label="Tipo de material" labelOculto opciones={TIPOS} value={tipo} onChange={(e) => cambiar('tipo', e.target.value)} />
          <Select label="Avance" labelOculto opciones={ESTADOS} value={estado} onChange={(e) => cambiar('estado', e.target.value)} />
        </div>
      </div>

      <div className={cn('mt-8 transition-opacity duration-200', isFetching && isPlaceholderData && 'opacity-60')} aria-busy={isFetching}>
        {isLoading ? (
          <EsqueletoBiblioteca />
        ) : isError || !data ? (
          <EstadoError titulo="No pudimos cargar la biblioteca" onReintentar={() => void refetch()} cargando={isFetching} />
        ) : data.items.length === 0 ? (
          <EstadoVacio
            icono="search_off"
            titulo={hayFiltros ? 'No encontramos contenidos con esos filtros' : 'Aún no hay contenidos publicados'}
            descripcion={hayFiltros ? 'Prueba con otra palabra o quita algún filtro.' : 'Vuelve pronto: estamos preparando material nuevo.'}
            accion={hayFiltros && <Button variante="secundario" onClick={limpiar}>Limpiar filtros</Button>}
          />
        ) : (
          <>
            <p className="mb-4 text-caption text-on-surface-variant" aria-live="polite">
              {data.items.length} {data.items.length === 1 ? 'contenido' : 'contenidos'}
              {hayFiltros && ' con estos filtros'}
            </p>
            <Bento items={data.items} />
          </>
        )}
      </div>
    </Pagina>
  );
}

/** Bento: el primero destacado (8 columnas, dos filas) y dos a su lado; luego grilla de tres. */
function Bento({ items }: { items: DTOContenido[] }) {
  const [primero, ...resto] = items;
  const lado = resto.slice(0, 2);
  const demas = resto.slice(2);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {primero && <TarjetaContenido contenido={primero} destacada className={cn(lado.length ? 'lg:col-span-8' : 'lg:col-span-12')} />}
        {lado.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            {lado.map((c) => (
              <TarjetaContenido key={c.id} contenido={c} />
            ))}
          </div>
        )}
      </div>
      {demas.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {demas.map((c) => (
            <TarjetaContenido key={c.id} contenido={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Continuar({ contenido }: { contenido: DTOContenido }) {
  const tipo = TIPO_CONTENIDO[contenido.tipo] ?? TIPO_CONTENIDO.mixto!;
  return (
    <section aria-labelledby="titulo-continuar" className="mb-8">
      <Link
        to={`/app/contenidos/${contenido.slug}`}
        className="group flex flex-col gap-4 rounded-md border border-primary/30 bg-primary-fixed/40 p-5 transition-shadow duration-200 hover:shadow-card-hover sm:flex-row sm:items-center"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icono nombre="play_arrow" relleno />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-continuar" className="text-caption font-medium text-primary">
            Continúa donde quedaste
          </h2>
          <p className="mt-0.5 text-body-lg font-semibold text-on-surface">{contenido.titulo}</p>
          <p className="text-caption text-on-surface-variant">
            {tipo.etiqueta} · {contenido.materia.nombre}
          </p>
        </div>
        <ProgressBar valor={contenido.porcentajeProgreso} mostrarValor etiqueta="Avance" className="w-full sm:w-48" etiquetaAria={`Avance en ${contenido.titulo}`} />
        <Icono nombre="arrow_forward" className="hidden text-primary transition-transform duration-150 group-hover:translate-x-0.5 sm:block" />
      </Link>
    </section>
  );
}

function EsqueletoBiblioteca() {
  return (
    <Cargando etiqueta="Cargando contenidos…" className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-[26rem] rounded-md lg:col-span-8" />
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Skeleton className="h-[12.5rem] rounded-md" />
          <Skeleton className="h-[12.5rem] rounded-md" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-md" />
        ))}
      </div>
    </Cargando>
  );
}
