import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { Prueba } from '@paes-pro/shared';
import { PRUEBAS, PRUEBAS_CORTA } from '@paes-pro/shared';
import { useEnsayos, useMisIntentos } from '@/lib/data/ensayos';
import { useDebounce, useTitulo } from '@/hooks/utiles';
import { EncabezadoPagina, Pagina } from '@/components/ui/Pagina';
import { Input } from '@/components/ui/Input';
import { ChipFiltro } from '@/components/ui/Chip';
import { Tabs } from '@/components/ui/Tabs';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Cargando, EstadoError, EstadoVacio, Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { FilaIntento, TarjetaEnsayo } from '@/components/ensayos/comun';

type Pestana = 'biblioteca' | 'intentos';

export default function BibliotecaEnsayos() {
  useTitulo('Mis ensayos');
  const [params, setParams] = useSearchParams();
  const pestana: Pestana = params.get('ver') === 'intentos' ? 'intentos' : 'biblioteca';
  const intentos = useMisIntentos();

  const cambiarPestana = (v: string) => {
    const p = new URLSearchParams(params);
    if (v === 'intentos') p.set('ver', 'intentos');
    else p.delete('ver');
    setParams(p, { replace: true });
  };

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Biblioteca de ensayos"
        descripcion="Practica con ensayos tipo PAES, con el tiempo y la distribución de ejes de la prueba real."
      />
      <Tabs
        className="mb-6"
        etiquetaAria="Ensayos"
        valor={pestana}
        onValorChange={cambiarPestana}
        items={[
          { valor: 'biblioteca', etiqueta: 'Biblioteca', icono: 'library_books' },
          { valor: 'intentos', etiqueta: 'Mis intentos', icono: 'history', contador: intentos.data?.length },
        ]}
      />
      {pestana === 'biblioteca' ? <Catalogo /> : <MisIntentos consulta={intentos} />}
    </Pagina>
  );
}

function Catalogo() {
  const [prueba, setPrueba] = useState<Prueba | undefined>();
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto.trim(), 300);
  const { data, isLoading, isError, refetch, isFetching } = useEnsayos(prueba, q || undefined);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <Input
          label="Buscar ensayos"
          labelOculto
          type="search"
          iconoIzquierdo="search"
          placeholder="Buscar por nombre o tema…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          contenedorClassName="lg:max-w-xl lg:flex-1"
          autoComplete="off"
        />
        <div role="group" aria-label="Filtrar por prueba" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-fino lg:mx-0 lg:px-0 lg:pb-0">
          <ChipFiltro activo={!prueba} onClick={() => setPrueba(undefined)}>
            Todos
          </ChipFiltro>
          {PRUEBAS.map((p) => (
            <ChipFiltro key={p} activo={prueba === p} onClick={() => setPrueba(prueba === p ? undefined : p)}>
              {PRUEBAS_CORTA[p]}
            </ChipFiltro>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Cargando etiqueta="Cargando ensayos…" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} lineas={4} />
          ))}
        </Cargando>
      ) : isError ? (
        <EstadoError titulo="No pudimos cargar los ensayos" onReintentar={() => void refetch()} cargando={isFetching} />
      ) : !data || data.length === 0 ? (
        <EstadoVacio
          icono="search_off"
          titulo={q ? `No encontramos ensayos para “${q}”` : 'No hay ensayos para esta prueba todavía'}
          descripcion="Prueba con otra palabra o quita los filtros."
          accion={
            <Button
              variante="secundario"
              onClick={() => {
                setTexto('');
                setPrueba(undefined);
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {data.length} ensayos
          </p>
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy={isFetching}>
            {data.map((e) => (
              <TarjetaEnsayo key={e.id} ensayo={e} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function MisIntentos({ consulta }: { consulta: ReturnType<typeof useMisIntentos> }) {
  const { data, isLoading, isError, refetch, isFetching } = consulta;
  if (isLoading) {
    return (
      <Cargando etiqueta="Cargando tus intentos…" className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </Cargando>
    );
  }
  if (isError) return <EstadoError titulo="No pudimos cargar tus intentos" onReintentar={() => void refetch()} cargando={isFetching} />;
  if (!data || data.length === 0) {
    return (
      <EstadoVacio
        icono="edit_document"
        titulo="Aún no rindes ningún ensayo"
        descripcion="Parte con el diagnóstico: es gratis y ajusta tu plan de estudio a tu nivel."
        accion={
          <BotonEnlace to="/app/ensayos/ensayo-diagnostico-m1" iconoDerecho="arrow_forward">
            Rendir el diagnóstico
          </BotonEnlace>
        }
      />
    );
  }
  return (
    <ul className="space-y-3">
      {data.map((i) => (
        <FilaIntento key={i.id} intento={i} />
      ))}
    </ul>
  );
}
