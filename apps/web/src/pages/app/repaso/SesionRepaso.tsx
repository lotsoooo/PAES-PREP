import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { DTORespuestaRepaso } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { useResponderRepaso, useSesionRepaso } from '@/lib/data/cuaderno';
import { useAtajo, useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { MarcaIcono } from '@/components/marca/Logo';
import { BotonEnlace, BotonIcono, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { TextoMat } from '@/components/contenido/TextoMat';
import { Alternativas } from '@/components/repaso/Alternativas';
import { IndicadorCaja } from '@/components/repaso/Cajas';
import { cuandoRepasar } from '@/components/repaso/leitner';

/** Sesión de repaso en modo foco: sin sidebar, una pregunta a la vez. */
export default function SesionRepaso() {
  useTitulo('Sesión de repaso');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sesion = useSesionRepaso();
  const responder = useResponderRepaso();
  const [indice, setIndice] = useState(0);
  const [elegida, setElegida] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DTORespuestaRepaso | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [dominadas, setDominadas] = useState(0);

  const preguntas = sesion.data ?? [];
  const actual = preguntas[indice];
  const terminado = sesion.isSuccess && indice >= preguntas.length;

  const salir = () => {
    void qc.invalidateQueries({ queryKey: ['cuaderno'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
    navigate('/app/repaso');
  };

  const comprobar = () => {
    if (!actual || !elegida || resultado || responder.isPending) return;
    responder.mutate(
      { cuadernoId: actual.cuadernoId, alternativaId: elegida },
      {
        onSuccess: (r) => {
          setResultado(r);
          if (r.esCorrecta) setAciertos((n) => n + 1);
          if (r.dominada) setDominadas((n) => n + 1);
        },
      },
    );
  };
  const siguiente = () => {
    setIndice((i) => i + 1);
    setElegida(null);
    setResultado(null);
    window.scrollTo({ top: 0 });
  };

  // Atajos: A–D o 1–4 eligen, Enter comprueba o avanza.
  const activo = Boolean(actual) && !terminado;
  const elegirPorTecla = (n: number) => {
    if (!actual || resultado) return;
    const alt = [...actual.alternativas].sort((a, b) => a.posicion - b.posicion)[n];
    if (alt) setElegida(alt.id);
  };
  useAtajo('a', () => elegirPorTecla(0), { activo });
  useAtajo('b', () => elegirPorTecla(1), { activo });
  useAtajo('c', () => elegirPorTecla(2), { activo });
  useAtajo('d', () => elegirPorTecla(3), { activo });
  useAtajo('1', () => elegirPorTecla(0), { activo });
  useAtajo('2', () => elegirPorTecla(1), { activo });
  useAtajo('3', () => elegirPorTecla(2), { activo });
  useAtajo('4', () => elegirPorTecla(3), { activo });
  useAtajo(
    'Enter',
    (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      if (resultado) siguiente();
      else comprobar();
    },
    { activo },
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4 md:px-8">
          <Link to="/app" aria-label="PAES Pro, inicio" className="rounded">
            <MarcaIcono className="size-8" />
          </Link>
          <div className="min-w-0 flex-1">
            {preguntas.length > 0 && !terminado ? (
              <ProgressBar
                valor={(indice / preguntas.length) * 100}
                etiqueta={`Pregunta ${indice + 1} de ${preguntas.length}`}
                grosor="fino"
                etiquetaAria="Avance de la sesión de repaso"
              />
            ) : (
              <p className="text-label-md font-semibold text-on-surface">Sesión de repaso</p>
            )}
          </div>
          <BotonIcono icono="close" etiqueta="Salir de la sesión" onClick={salir} />
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        {sesion.isLoading ? (
          <Cargando etiqueta="Preparando tu repaso…">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-20 w-full" />
            <div className="mt-6 flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          </Cargando>
        ) : sesion.isError ? (
          <EstadoError titulo="No pudimos preparar tu repaso" onReintentar={() => void sesion.refetch()} cargando={sesion.isFetching} />
        ) : preguntas.length === 0 ? (
          <EstadoVacio
            icono="task_alt"
            titulo="No tienes preguntas para hoy"
            descripcion="Tu cuaderno está al día. Las próximas vuelven cuando les toque."
            accion={<BotonEnlace to="/app/repaso">Volver al cuaderno</BotonEnlace>}
          />
        ) : terminado ? (
          <Resumen total={preguntas.length} aciertos={aciertos} dominadas={dominadas} onSalir={salir} />
        ) : actual ? (
          <article aria-labelledby="enunciado-repaso" className="animar-entrada" key={actual.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-caption font-semibold uppercase tracking-[0.06em] text-primary">
                {MATERIA_ETIQUETA[actual.materiaCodigo] ?? actual.materiaCodigo}
                {actual.ejeNombre && <span className="font-normal normal-case tracking-normal text-on-surface-variant"> · {actual.ejeNombre}</span>}
              </span>
              <IndicadorCaja caja={actual.caja} />
            </div>
            {actual.textoBase && (
              <div className="mt-5 max-h-80 overflow-y-auto rounded-md border border-border bg-surface-container-low p-5 scrollbar-fino">
                <TextoMat texto={actual.textoBase} className="texto-lectura text-body-md text-on-surface" />
              </div>
            )}
            <div id="enunciado-repaso" className="mt-5">
              <TextoMat texto={actual.enunciado} className="text-body-lg text-on-surface" />
            </div>
            <div className="mt-6">
              <Alternativas
                nombre={`repaso-${actual.id}`}
                leyenda="Elige una alternativa"
                alternativas={actual.alternativas}
                seleccionada={elegida}
                onSeleccionar={setElegida}
                correccion={resultado ? { correctaId: resultado.alternativaCorrectaId } : null}
              />
            </div>

            {resultado && <Retroalimentacion resultado={resultado} />}

            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-caption text-on-surface-variant sm:block">
                Atajos: <kbd className="rounded-sm border border-border px-1">A</kbd>–<kbd className="rounded-sm border border-border px-1">D</kbd> para elegir,{' '}
                <kbd className="rounded-sm border border-border px-1">Enter</kbd> para seguir.
              </p>
              {resultado ? (
                <Button tamano="lg" iconoDerecho="arrow_forward" onClick={siguiente}>
                  {indice === preguntas.length - 1 ? 'Ver resumen' : 'Siguiente'}
                </Button>
              ) : (
                <Button tamano="lg" onClick={comprobar} disabled={!elegida} cargando={responder.isPending} iconoDerecho="check">
                  Comprobar
                </Button>
              )}
            </div>
          </article>
        ) : (
          <Skeleton className="h-40 rounded-md" />
        )}
      </main>
    </div>
  );
}

function Retroalimentacion({ resultado }: { resultado: DTORespuestaRepaso }) {
  const cuando = cuandoRepasar(resultado.proximoRepaso).toLowerCase();
  return (
    <section
      aria-live="polite"
      className={cn('animar-entrada mt-6 rounded-md border p-5', resultado.esCorrecta ? 'border-success/40 bg-success-container/50' : 'border-error/30 bg-error-container/40')}
    >
      <p className={cn('flex items-center gap-2 text-body-md font-semibold', resultado.esCorrecta ? 'text-on-success-container' : 'text-on-error-container')}>
        <Icono nombre={resultado.esCorrecta ? 'check_circle' : 'cancel'} relleno />
        {resultado.dominada
          ? '¡Correcto! Pregunta dominada: sale de tu repaso.'
          : resultado.esCorrecta
            ? `¡Correcto! Sube a la caja ${resultado.caja}. Vuelve ${cuando}.`
            : `Incorrecta. Vuelve a la caja 1 y la repasarás ${cuando}.`}
      </p>
      <TextoMat texto={resultado.explicacion} className="mt-3 text-body-md text-on-surface" />
    </section>
  );
}

function Resumen({ total, aciertos, dominadas, onSalir }: { total: number; aciertos: number; dominadas: number; onSalir: () => void }) {
  return (
    <section className="animar-entrada text-center" aria-labelledby="titulo-resumen">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-container text-success">
        <Icono nombre="task_alt" relleno className="text-4xl" />
      </span>
      <h1 id="titulo-resumen" className="mt-5 text-headline-lg-mobile text-on-surface md:text-headline-lg">
        ¡Repaso terminado!
      </h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">Sumaste un día más a tu racha de estudio.</p>
      <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 divide-x divide-border rounded-md border border-border bg-surface-container-lowest">
        <div className="p-4">
          <dt className="text-caption text-on-surface-variant">Repasadas</dt>
          <dd className="text-headline-md font-bold text-on-surface tabular-nums">{total}</dd>
        </div>
        <div className="p-4">
          <dt className="text-caption text-on-surface-variant">Correctas</dt>
          <dd className="text-headline-md font-bold text-success tabular-nums">{aciertos}</dd>
        </div>
        <div className="p-4">
          <dt className="text-caption text-on-surface-variant">Dominadas</dt>
          <dd className="text-headline-md font-bold text-on-surface tabular-nums">{dominadas}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button variante="secundario" onClick={onSalir}>
          Volver al cuaderno
        </Button>
        <BotonEnlace to="/app" iconoDerecho="arrow_forward">
          Ir al inicio
        </BotonEnlace>
      </div>
    </section>
  );
}
