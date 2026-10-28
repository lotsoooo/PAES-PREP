import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DTOAlternativa, DTOIntento } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { claveEnsayos, entregarIntento, useIniciarIntento } from '@/lib/data/ensayos';
import { useTitulo } from '@/hooks/utiles';
import { recargarUsuario } from '@/app/sesion';
import { MarcaIcono } from '@/components/marca/Logo';
import { TextoMat } from '@/components/contenido/TextoMat';
import { BotonEnlace, BotonIcono, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Drawer, Modal, ModalConfirmacion } from '@/components/ui/Modal';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { recuperarCambios, useAutoguardado } from '@/components/ensayos/useAutoguardado';
import { Alternativas, Cronometro, IndicadorGuardado, NavegadorPreguntas } from '@/components/ensayos/Examen';
import { ATAJOS_EXAMEN, LETRAS } from '@/components/ensayos/formato';

import { crearRelojEnsayo } from '@/components/ensayos/relojEnsayo';

const claveIndice = (id: string) => `paes-pro:intento:${id}:indice`;

function leerIndice(id: string): number | null {
  try {
    const v = localStorage.getItem(claveIndice(id));
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

function guardarIndice(id: string, i: number) {
  try {
    localStorage.setItem(claveIndice(id), String(i));
  } catch {
    /* sin almacenamiento: se retoma desde la primera en blanco */
  }
}

/**
 * Modo examen (modo foco, sin navegación). El servidor manda sobre el tiempo
 * (`expiraEn`, D-004); cada respuesta se autoguarda y al recargar se retoma.
 */
export default function RendirEnsayo() {
  const { slug = '' } = useParams();
  const iniciar = useIniciarIntento();
  const pedido = useRef(false);

  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    iniciar.mutate(slug);
  }, [slug, iniciar]);

  if (iniciar.isError) return <ErrorInicio error={iniciar.error} slug={slug} reintentar={() => iniciar.mutate(slug)} />;
  if (!iniciar.data) return <CargandoExamen />;
  if (iniciar.data.estado === 'entregado' || iniciar.data.estado === 'expirado') {
    return <Navigate to={`/app/ensayos/intentos/${iniciar.data.id}`} replace />;
  }
  return <Examen key={iniciar.data.id} intento={iniciar.data} slug={slug} />;
}

function Examen({ intento, slug }: { intento: DTOIntento; slug: string }) {
  useTitulo(`Rindiendo: ${intento.titulo}`);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const preguntas = intento.preguntas;
  const total = preguntas.length;

  const [recuperadas] = useState(() => recuperarCambios(intento.id, preguntas));
  const enEntrega = useRef(false);
  const [respuestas, setRespuestas] = useState<Record<string, string>>(() =>
    Object.fromEntries([...preguntas.filter((p) => p.respuestaActual?.alternativaId).map((p) => [p.id, p.respuestaActual!.alternativaId!]), ...recuperadas.filter(([, c]) => c.alternativaId !== undefined).map(([id, c]) => [id, c.alternativaId ?? ''])]),
  );
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...preguntas.filter((p) => p.respuestaActual?.esMarcada).map((p) => [p.id, true]), ...recuperadas.filter(([, c]) => c.esMarcada !== undefined).map(([id, c]) => [id, c.esMarcada!])]),
  );
  const tiempos = useRef<Record<string, number>>(
    Object.fromEntries(preguntas.map((p) => [p.id, Math.max(p.respuestaActual?.tiempoSegundos ?? 0, recuperadas.find(([id]) => id === p.id)?.[1].tiempoSegundos ?? 0)])),
  );
  const [indice, setIndice] = useState(() => {
    const guardado = leerIndice(intento.id);
    if (guardado !== null && Number.isInteger(guardado) && guardado >= 0 && guardado < total) return guardado;
    const primeraEnBlanco = preguntas.findIndex((p) => !p.respuestaActual?.alternativaId);
    return primeraEnBlanco >= 0 ? primeraEnBlanco : Math.min(intento.indiceActual, total - 1);
  });
  const [navegadorAbierto, setNavegadorAbierto] = useState(false);
  const [confirmarEntrega, setConfirmarEntrega] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [ayuda, setAyuda] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const [aviso, setAviso] = useState('');

  // Incluye la primera pregunta: recargar antes de pulsar Siguiente también
  // debe devolver al lugar donde el estudiante estaba trabajando.
  useEffect(() => guardarIndice(intento.id, indice), [intento.id, indice]);

  const pregunta = preguntas[indice]!;
  const inicioPregunta = useRef(Date.now());

  /* ---------------------------------------------------------- entrega */
  const entregar = useCallback(
    async (motivo: 'usuario' | 'tiempo') => {
      if (enEntrega.current) return;
      enEntrega.current = true;
      setEntregando(true);
      try {
        const guardado = await vaciarRef.current();
        if (!guardado && motivo === 'usuario') {
          throw new Error('Hay respuestas sin guardar. Revisa tu conexión o el aviso de conflicto antes de entregar.');
        }
        const r = await entregarIntento(intento.id);
        descartarRef.current();
        qc.setQueryData(claveEnsayos.resultados(intento.id), r);
        void qc.invalidateQueries({ queryKey: ['intentos', 'lista'] });
        void qc.invalidateQueries({ queryKey: ['ensayos'] });
        void qc.invalidateQueries({ queryKey: ['dashboard'] });
        void qc.invalidateQueries({ queryKey: ['estadisticas'] });
        void recargarUsuario().catch(() => undefined);
        try {
          localStorage.removeItem(claveIndice(intento.id));
        } catch {
          /* nada */
        }
        if (motivo === 'tiempo') toast.info('Se acabó el tiempo. Entregamos tu ensayo con las respuestas guardadas.');
        navigate(`/app/ensayos/intentos/${intento.id}`, { replace: true });
      } catch (e) {
        enEntrega.current = false;
        setEntregando(false);
        toast.error(e instanceof Error ? e.message : 'No pudimos entregar el ensayo. Revisa tu conexión e inténtalo de nuevo.');
      }
    },
    [intento.id, navigate, qc],
  );

  const alExpirarServidor = useCallback(() => {
    toast.info('Se acabó el tiempo y el ensayo quedó entregado.');
    navigate(`/app/ensayos/intentos/${intento.id}`, { replace: true });
  }, [intento.id, navigate]);

  const { estado: estadoGuardado, error: errorGuardado, respaldoLocal, encolar, vaciar, descartar } = useAutoguardado(intento.id, preguntas, recuperadas, alExpirarServidor);
  const descartarRef = useRef(descartar);
  descartarRef.current = descartar;
  const vaciarRef = useRef(vaciar);
  vaciarRef.current = vaciar;

  /* ---------------------------------------------------------- cronómetro */
  const [reloj] = useState(() => crearRelojEnsayo(intento.expiraEn, intento.servidorAhora, performance.now(), Date.now()));
  const [restante, setRestante] = useState(() => reloj(performance.now()));
  const avisados = useRef(new Set<number>());
  const entregarRef = useRef(entregar);
  entregarRef.current = entregar;

  useEffect(() => {
    const tic = () => {
      const s = reloj(performance.now());
      setRestante(s);
      for (const min of [10, 5]) {
        if (s <= min * 60 && s > 0 && !avisados.current.has(min)) {
          avisados.current.add(min);
          const texto = `Quedan ${min} minutos.`;
          setAviso(texto);
          toast.warning(texto, { description: min === 5 ? 'Revisa las preguntas en blanco antes de entregar.' : undefined });
        }
      }
      if (s === 0) void entregarRef.current('tiempo');
    };
    tic();
    const id = setInterval(tic, 1000);
    return () => clearInterval(id);
  }, [reloj]);

  /* ---------------------------------------------------------- tiempo por pregunta */
  const irA = useCallback(
    (nuevo: number) => {
      if (nuevo < 0 || nuevo >= total || nuevo === indice) return;
      const actualId = pregunta.id;
      const transcurrido = Math.round((Date.now() - inicioPregunta.current) / 1000);
      if (transcurrido >= 2) {
        tiempos.current[actualId] = (tiempos.current[actualId] ?? 0) + transcurrido;
        encolar(actualId, { tiempoSegundos: tiempos.current[actualId] });
      }
      inicioPregunta.current = Date.now();
      setIndice(nuevo);
      guardarIndice(intento.id, nuevo);
      setNavegadorAbierto(false);
      document.getElementById('enunciado-actual')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    },
    [encolar, indice, intento.id, pregunta.id, total],
  );

  const elegir = useCallback(
    (alt: DTOAlternativa) => {
      setRespuestas((r) => ({ ...r, [pregunta.id]: alt.id }));
      const segundos = (tiempos.current[pregunta.id] ?? 0) + Math.round((Date.now() - inicioPregunta.current) / 1000);
      encolar(pregunta.id, { alternativaId: alt.id, tiempoSegundos: segundos });
    },
    [encolar, pregunta.id],
  );

  const alternarMarca = useCallback(() => {
    const nueva = !marcadas[pregunta.id];
    setMarcadas((m) => ({ ...m, [pregunta.id]: nueva }));
    encolar(pregunta.id, { esMarcada: nueva });
  }, [encolar, marcadas, pregunta.id]);

  /* ---------------------------------------------------------- atajos */
  const hayModal = confirmarEntrega || confirmarSalida || ayuda || navegadorAbierto;
  useEffect(() => {
    if (hayModal || entregando || restante === 0) return;
    const alPresionar = (e: KeyboardEvent) => {
      const objetivo = e.target as HTMLElement | null;
      if (objetivo && (objetivo.tagName === 'INPUT' || objetivo.tagName === 'TEXTAREA' || objetivo.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const alts = [...pregunta.alternativas].sort((a, b) => a.posicion - b.posicion);
      const porLetra = LETRAS.map((l) => l.toLowerCase()).indexOf(k);
      const porNumero = /^[1-5]$/.test(k) ? Number(k) - 1 : -1;
      const i = porLetra >= 0 ? porLetra : porNumero;
      if (i >= 0 && alts[i]) {
        e.preventDefault();
        elegir(alts[i]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        irA(indice + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        irA(indice - 1);
      } else if (k === 'm') {
        e.preventDefault();
        alternarMarca();
      } else if (k === 'g') {
        e.preventDefault();
        setNavegadorAbierto(true);
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [alternarMarca, elegir, hayModal, indice, irA, pregunta.alternativas, entregando, restante]);

  const respondidas = preguntas.filter((p) => respuestas[p.id]).length;
  const enBlanco = preguntas.map((p, i) => (respuestas[p.id] ? -1 : i)).filter((i) => i >= 0);
  const nMarcadas = preguntas.filter((p) => marcadas[p.id]).length;
  const progreso = (respondidas / total) * 100;
  const esUltima = indice === total - 1;

  return (
    <div className="min-h-dvh bg-background">
      <a href="#pregunta" className="saltar-contenido">
        Saltar a la pregunta
      </a>
      <p className="sr-only" aria-live="assertive">
        {aviso}
      </p>

      {(errorGuardado || !respaldoLocal) && (
        <div role="alert" className="mx-auto max-w-[1280px] bg-error-container p-4 text-on-error-container">
          <p>{errorGuardado ?? 'El navegador no permite guardar un respaldo local. Mantén esta pestaña abierta hasta que las respuestas estén guardadas.'}</p>
          <Button variante="secundario" onClick={() => void vaciar()}>Reintentar guardado</Button>
          {estadoGuardado === 'error' && <p className="mt-2">Si cambiaste respuestas en otra pestaña, vuelve a ella para resolver el conflicto. Tus cambios locales siguen conservados.</p>}
        </div>
      )}
      {/* Barra superior del modo foco */}
      <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:h-[72px] md:px-8">
          <BotonIcono icono="close" etiqueta="Salir del ensayo" onClick={() => setConfirmarSalida(true)} />
          <span aria-hidden="true" className="hidden h-8 w-px bg-outline-variant sm:block" />
          <div className="flex min-w-0 items-center gap-3">
            <MarcaIcono className="hidden size-8 shrink-0 sm:block" />
            <div className="min-w-0">
              <p className="hidden text-body-md font-bold text-primary sm:block" translate="no">
                PAES Pro
              </p>
              <h1 className="truncate text-caption text-on-surface-variant sm:text-label-md" style={{ letterSpacing: 0 }}>
                {intento.titulo}
              </h1>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <span className="hidden md:inline-flex">
              <IndicadorGuardado estado={estadoGuardado} />
            </span>
            <Cronometro restante={restante} />
            <BotonIcono icono="keyboard" etiqueta="Atajos de teclado" onClick={() => setAyuda(true)} className="hidden sm:inline-flex" />
            <BotonIcono icono="grid_view" etiqueta="Ver todas las preguntas" onClick={() => setNavegadorAbierto(true)} className="lg:hidden" />
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Preguntas respondidas"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={respondidas}
          aria-valuetext={`${respondidas} de ${total} respondidas`}
          className="h-1.5 w-full bg-surface-container-high"
        >
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progreso}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-32 pt-6 md:px-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_288px] lg:pb-12">
        <main id="pregunta">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-9 items-center rounded-full bg-primary-container px-4 text-label-md font-semibold text-white" style={{ letterSpacing: 0 }}>
              Pregunta {indice + 1} de {total}
            </span>
            {pregunta.ejeNombre && <span className="text-label-md text-on-surface-variant" style={{ letterSpacing: 0 }}>Eje: {pregunta.ejeNombre}</span>}
            <span className="ml-auto md:hidden">
              <IndicadorGuardado estado={estadoGuardado} />
            </span>
            <Button
              variante={marcadas[pregunta.id] ? 'suave' : 'secundario'}
              tamano="sm"
              iconoIzquierdo={marcadas[pregunta.id] ? 'bookmark_added' : 'bookmark'}
              onClick={alternarMarca}
              aria-pressed={Boolean(marcadas[pregunta.id])}
              className="min-h-11 md:ml-auto"
            >
              {marcadas[pregunta.id] ? 'Marcada para revisar' : 'Marcar para revisar'}
            </Button>
          </div>

          <article
            className={cn(
              'rounded-lg border border-border bg-surface-container-lowest p-5 shadow-card md:p-8',
              pregunta.textoBase && 'xl:grid xl:grid-cols-2 xl:gap-8',
            )}
          >
            {pregunta.textoBase && (
              <section aria-label="Texto de lectura" className="mb-6 max-h-[60vh] overflow-y-auto rounded-md bg-surface-container-low p-5 scrollbar-fino xl:mb-0">
                <TextoMat texto={pregunta.textoBase} className="texto-lectura text-body-lg text-on-surface" />
              </section>
            )}
            <div>
              <div id="enunciado-actual" tabIndex={-1} className="outline-none">
                <div id={`enunciado-${pregunta.id}`}>
                  <TextoMat texto={pregunta.enunciado} className="text-body-lg text-on-surface" />
                </div>
              </div>
              <fieldset disabled={entregando || restante === 0}>
                <legend className="sr-only">Elige tu respuesta</legend>
                <Alternativas pregunta={pregunta} elegida={respuestas[pregunta.id]} onElegir={elegir} />
              </fieldset>
            </div>
          </article>

          {/* Navegación inferior: fija en móvil para el pulgar */}
          <nav
            aria-label="Navegación del ensayo"
            className="fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant bg-surface-container-lowest px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0"
          >
            <div className="mx-auto flex max-w-[1280px] items-center gap-3">
              <Button variante="secundario" iconoIzquierdo="arrow_back" onClick={() => irA(indice - 1)} disabled={indice === 0}>
                Anterior
              </Button>
              <span className="flex-1 text-center text-caption text-on-surface-variant tabular-nums lg:hidden">
                {respondidas}/{total} respondidas
              </span>
              <span className="hidden flex-1 lg:block" />
              {esUltima ? (
                <Button iconoDerecho="flag" onClick={() => setConfirmarEntrega(true)}>
                  Finalizar
                </Button>
              ) : (
                <Button iconoDerecho="arrow_forward" onClick={() => irA(indice + 1)}>
                  Siguiente
                </Button>
              )}
            </div>
          </nav>
        </main>

        {/* Panel lateral en escritorio */}
        <aside aria-label="Navegador de preguntas" className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-border bg-surface-container-lowest p-5 shadow-card">
            <h2 className="mb-4 text-body-lg font-semibold text-on-surface">Preguntas</h2>
            <NavegadorPreguntas preguntas={preguntas} respuestas={respuestas} marcadas={marcadas} actual={indice} onIr={irA} />
            <Button anchoCompleto className="mt-5" variante="primario" iconoIzquierdo="flag" onClick={() => setConfirmarEntrega(true)}>
              Finalizar ensayo
            </Button>
            <p className="mt-3 text-center text-caption text-on-surface-variant">
              Atajos: A–D, ← →, M.{' '}
              <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => setAyuda(true)}>
                Ver todos
              </button>
            </p>
          </div>
        </aside>
      </div>

      <Drawer
        abierto={navegadorAbierto}
        onAbiertoChange={setNavegadorAbierto}
        titulo="Todas las preguntas"
        descripcion={`${respondidas} de ${total} respondidas`}
        pie={
          <Button anchoCompleto iconoIzquierdo="flag" onClick={() => { setNavegadorAbierto(false); setConfirmarEntrega(true); }}>
            Finalizar ensayo
          </Button>
        }
      >
        <NavegadorPreguntas preguntas={preguntas} respuestas={respuestas} marcadas={marcadas} actual={indice} onIr={irA} />
      </Drawer>

      <Modal
        abierto={confirmarEntrega}
        onAbiertoChange={(v) => !entregando && setConfirmarEntrega(v)}
        titulo="¿Entregar el ensayo?"
        descripcion={
          enBlanco.length === 0
            ? 'Respondiste todas las preguntas. Una vez entregado no podrás cambiar tus respuestas.'
            : `Te ${enBlanco.length === 1 ? 'queda 1 pregunta' : `quedan ${enBlanco.length} preguntas`} en blanco. En la PAES las omitidas no restan, pero tampoco suman.`
        }
        pie={
          <>
            <Button variante="fantasma" onClick={() => setConfirmarEntrega(false)} disabled={entregando}>
              Seguir respondiendo
            </Button>
            <Button onClick={() => void entregar('usuario')} cargando={entregando} textoCargando="Entregando…" iconoIzquierdo="flag">
              Entregar ensayo
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-3 gap-3 text-center">
          <Resumen etiqueta="Respondidas" valor={respondidas} />
          <Resumen etiqueta="En blanco" valor={enBlanco.length} />
          <Resumen etiqueta="Marcadas" valor={nMarcadas} />
        </dl>
        {enBlanco.length > 0 && (
          <div className="mt-5">
            <p className="text-label-md text-on-surface" style={{ letterSpacing: 0 }}>
              Ir a una en blanco:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {enBlanco.slice(0, 24).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setConfirmarEntrega(false);
                    irA(i);
                  }}
                  className="flex size-11 items-center justify-center rounded border border-border-strong text-label-md font-semibold tabular-nums text-on-surface hover:border-primary hover:text-primary"
                >
                  {i + 1}
                </button>
              ))}
              {enBlanco.length > 24 && <span className="self-center text-caption text-on-surface-variant">y {enBlanco.length - 24} más</span>}
            </div>
          </div>
        )}
      </Modal>

      <ModalConfirmacion
        abierto={confirmarSalida}
        titulo="¿Salir del ensayo?"
        descripcion="Tus respuestas quedan guardadas, pero el cronómetro sigue corriendo. Puedes volver antes de que termine el tiempo."
        textoConfirmar="Salir"
        textoCancelar="Seguir en el ensayo"
        onCancelar={() => setConfirmarSalida(false)}
        onConfirmar={() => {
          void vaciar();
          navigate(`/app/ensayos/${slug}`);
        }}
      />

      <Modal abierto={ayuda} onAbiertoChange={setAyuda} titulo="Atajos de teclado" ancho="sm">
        <ul className="space-y-3">
          {ATAJOS_EXAMEN.map((a) => (
            <li key={a.texto} className="flex items-center justify-between gap-4 text-body-md text-on-surface">
              <span>{a.texto}</span>
              <span className="flex gap-1">
                {a.teclas.map((t) => (
                  <kbd key={t} className="min-w-7 rounded-sm border border-border-strong bg-surface-container-low px-1.5 py-0.5 text-center text-caption font-semibold">
                    {t}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-md bg-surface-container-low px-3 py-3">
      <dt className="text-caption text-on-surface-variant">{etiqueta}</dt>
      <dd className="text-headline-md font-bold text-on-surface tabular-nums">{valor}</dd>
    </div>
  );
}

function CargandoExamen() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-16 border-b border-outline-variant/60 bg-surface md:h-[72px]" />
      <Cargando etiqueta="Preparando tu ensayo…" className="mx-auto max-w-[960px] px-4 pt-8 md:px-8">
        <Skeleton className="h-9 w-48 rounded-full" />
        <Skeleton className="mt-4 h-[420px] rounded-lg" />
      </Cargando>
    </div>
  );
}

function ErrorInicio({ error, slug, reintentar }: { error: Error; slug: string; reintentar: () => void }) {
  useTitulo('Ensayo');
  const api = error instanceof ApiError ? error : null;
  const premium = api?.esPremiumRequerido || api?.esPlanLimite;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center gap-3 border-b border-outline-variant/60 bg-surface px-4 md:px-8">
        <Link to={`/app/ensayos/${slug}`} className="inline-flex min-h-11 items-center gap-2 rounded text-label-md font-medium text-primary">
          <Icono nombre="arrow_back" />
          Volver al ensayo
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-12">
        {premium ? (
          <EstadoVacio
            className="w-full border-tertiary-container/60"
            icono="workspace_premium"
            titulo={api?.esPlanLimite ? 'Usaste tu ensayo del mes' : 'Este ensayo es Premium'}
            descripcion={api?.message}
            accion={
              <div className="flex flex-wrap justify-center gap-3">
                <BotonEnlace to="/app/ensayos" variante="secundario">
                  Ver otros ensayos
                </BotonEnlace>
                <BotonEnlace to="/app/premium" variante="premium" iconoIzquierdo="workspace_premium">
                  Ver planes Premium
                </BotonEnlace>
              </div>
            }
          />
        ) : api?.status === 404 ? (
          <EstadoVacio
            className="w-full"
            icono="search_off"
            titulo="No encontramos este ensayo"
            descripcion={api.message}
            accion={<BotonEnlace to="/app/ensayos">Ir a la biblioteca</BotonEnlace>}
          />
        ) : (
          <EstadoError className="w-full" titulo="No pudimos abrir el ensayo" descripcion={error.message} onReintentar={reintentar} />
        )}
      </main>
    </div>
  );
}
