import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { DTOCarrera, DTOOferta } from '@paes-pro/shared';
import { nombreDia, nombreDiaCorto, PRUEBAS_LABEL, PRUEBAS_OBJETIVO, type Prueba } from '@paes-pro/shared';
import { BRAND_NAME } from '@/config/marca';
import { MarcaIcono } from '@/components/marca/Logo';
import { Icono } from '@/components/ui/Icono';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

/* --------------------------------------------------------------------------
 * Marco: barra de progreso fina arriba (Stitch) + card ancha centrada
 * -------------------------------------------------------------------------- */

export function MarcoOnboarding({
  paso,
  total,
  children,
  acciones,
}: {
  paso: number;
  total: number;
  children: ReactNode;
  acciones: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div
        className="h-1.5 w-full bg-primary-fixed"
        role="progressbar"
        aria-label="Progreso de la configuración"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={paso}
        aria-valuetext={`Paso ${paso} de ${total}`}
      >
        <div className="h-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${(paso / total) * 100}%` }} />
      </div>
      <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 rounded" aria-label={`${BRAND_NAME}, ir al inicio`}>
          <MarcaIcono className="size-8" />
          <span className="text-body-lg font-bold text-primary" translate="no">
            {BRAND_NAME}
          </span>
        </Link>
        <p className="text-label-md text-on-surface-variant tabular-nums">
          Paso {paso} de {total}
        </p>
      </header>
      <main id="contenido" className="flex flex-1 justify-center px-4 pb-12 md:pt-8">
        <div className="w-full max-w-[840px]">
          <div key={paso} className="animar-entrada rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card sm:p-10">
            {children}
          </div>
          <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">{acciones}</div>
        </div>
      </main>
    </div>
  );
}

export function TituloPaso({ titulo, descripcion }: { titulo: string; descripcion: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-headline-lg-mobile text-primary text-balance md:text-display md:tracking-[-0.02em]">{titulo}</h1>
      <p className="mt-3 max-w-2xl text-body-lg text-on-surface-variant text-pretty">{descripcion}</p>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Paso 1: carrera + universidad
 * -------------------------------------------------------------------------- */

const ICONO_AREA: Record<string, string> = {
  Salud: 'medical_services',
  Ingeniería: 'engineering',
  Humanidades: 'gavel',
  Diseño: 'architecture',
  Economía: 'payments',
  Educación: 'school',
  Ciencias: 'science',
  Tecnología: 'computer',
};

function iconoArea(area: string): string {
  return ICONO_AREA[area] ?? 'school';
}

/** Chips de carreras populares (Stitch: "Opciones populares"). */
export function CarrerasPopulares({
  carreras,
  cargando,
  seleccionada,
  onElegir,
}: {
  carreras: DTOCarrera[];
  cargando: boolean;
  seleccionada: string | null;
  onElegir: (c: DTOCarrera) => void;
}) {
  return (
    <div className="mt-6">
      <p className="text-label-md font-medium text-on-surface-variant">Opciones populares</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {cargando
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-36 rounded-full" />)
          : carreras.map((c) => {
              const activa = seleccionada === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => onElegir(c)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-label-md font-medium whitespace-nowrap transition-colors duration-150',
                    activa
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary hover:text-primary',
                  )}
                >
                  <Icono nombre={activa ? 'check' : iconoArea(c.area)} className="text-lg" />
                  {c.nombre}
                </button>
              );
            })}
      </div>
    </div>
  );
}

/** Universidades donde se imparte la carrera, con su puntaje de corte. */
export function ListaOfertas({
  ofertas,
  cargando,
  error,
  seleccionada,
  onElegir,
}: {
  ofertas: DTOOferta[];
  cargando: boolean;
  error: boolean;
  seleccionada: string | null;
  onElegir: (o: DTOOferta) => void;
}) {
  if (cargando) {
    return (
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-md" />
        ))}
      </div>
    );
  }
  if (error) return <p className="mt-6 text-body-md text-error">No pudimos cargar las universidades. Intenta de nuevo.</p>;
  if (ofertas.length === 0) {
    return (
      <p className="mt-6 rounded-md bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
        Aún no tenemos universidades para esta carrera. Usaremos su puntaje de referencia como meta.
      </p>
    );
  }
  return (
    <fieldset className="mt-6">
      <legend className="text-label-md font-medium text-on-surface">¿En qué universidad?</legend>
      <div className="scrollbar-fino mt-3 grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {ofertas.map((o) => {
          const activa = seleccionada === o.universidad.id;
          return (
            <label
              key={o.universidad.id}
              className={cn(
                'flex min-h-[72px] cursor-pointer items-center gap-3 rounded-md border p-4 transition-[border-color,background-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                activa ? 'border-primary bg-primary-fixed/50' : 'border-border hover:bg-surface-container-low',
              )}
            >
              <input
                type="radio"
                name="universidad"
                checked={activa}
                onChange={() => onElegir(o)}
                className="size-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-outline checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_4px_var(--color-surface-container-lowest)] focus-visible:outline-none"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-body-md font-semibold text-on-surface">{o.universidad.nombre}</span>
                <span className="block text-caption text-on-surface-variant">{o.universidad.region ?? o.universidad.tipo}</span>
              </span>
              <span className="text-right">
                <span className="block text-body-md font-bold text-on-surface tabular-nums">{o.puntajeCorte}</span>
                <span className="block text-caption text-on-surface-variant">corte ref.</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 flex items-start gap-2 text-caption text-on-surface-variant">
        <Icono nombre="info" className="text-base" />
        Puntajes de corte referenciales y aproximados, solo para orientar tu meta. No son datos oficiales del DEMRE ni de cada
        universidad: revisa los cortes del último proceso en el sitio de la institución.
      </p>
    </fieldset>
  );
}

/** Tarjeta "Meta seleccionada" con puntaje de referencia. */
export function MetaSeleccionada({
  carrera,
  universidad,
  puntaje,
  onQuitar,
}: {
  carrera: DTOCarrera;
  universidad: string | null;
  puntaje: number | null;
  onQuitar: () => void;
}) {
  return (
    <div className="mt-8 flex items-center gap-4 rounded-md border border-primary/30 bg-primary-fixed/40 p-5" aria-live="polite">
      <span className="flex size-12 shrink-0 items-center justify-center rounded bg-primary text-on-primary">
        <Icono nombre={iconoArea(carrera.area)} relleno />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-medium text-on-surface-variant">Meta seleccionada</p>
        <p className="text-body-lg font-semibold text-on-surface">{carrera.nombre}</p>
        <p className="text-label-md text-on-surface-variant">
          {universidad ?? 'Elige una universidad'}
          {puntaje !== null && (
            <>
              {' · '}
              <span className="font-semibold text-primary tabular-nums">Puntaje ref.: {puntaje} pts</span>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar meta"
        title="Quitar meta"
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error"
      >
        <Icono nombre="delete" />
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Paso 2: disponibilidad semanal
 * -------------------------------------------------------------------------- */

const DIAS = [0, 1, 2, 3, 4, 5, 6];

export function SelectorDias({ dias, onCambio }: { dias: number[]; onCambio: (dias: number[]) => void }) {
  return (
    <fieldset>
      <legend className="text-body-md font-semibold text-on-surface">¿Qué días puedes estudiar?</legend>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {DIAS.map((d) => {
          const activo = dias.includes(d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={activo}
              aria-label={nombreDia(d)}
              onClick={() => onCambio(activo ? dias.filter((x) => x !== d) : [...dias, d].sort())}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center rounded border text-label-md font-semibold transition-colors duration-150',
                activo
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-border-strong bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary',
              )}
            >
              <span aria-hidden="true" className="sm:hidden">
                {nombreDiaCorto(d).slice(0, 1)}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                {nombreDiaCorto(d)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const OPCIONES_HORAS = [4, 6, 8, 10, 12, 15, 20];

export function SelectorHoras({ horas, onCambio, dias }: { horas: number; onCambio: (h: number) => void; dias: number }) {
  const porDia = dias > 0 ? horas / dias : 0;
  return (
    <fieldset className="mt-8">
      <legend className="text-body-md font-semibold text-on-surface">¿Cuántas horas a la semana?</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {OPCIONES_HORAS.map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={horas === h}
            onClick={() => onCambio(h)}
            className={cn(
              'inline-flex min-h-11 min-w-16 items-center justify-center rounded border px-4 text-label-md font-semibold tabular-nums transition-colors duration-150',
              horas === h
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border-strong bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary',
            )}
          >
            {h} h
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-md bg-surface-container-low px-4 py-3 text-body-md text-on-surface" aria-live="polite">
        {dias > 0 ? (
          <>
            Unas <strong className="font-semibold tabular-nums">{formatearHoras(porDia)}</strong> por día de estudio.{' '}
            {porDia > 3 && <span className="text-on-surface-variant">Es bastante: considera sumar un día para descansar entre sesiones.</span>}
          </>
        ) : (
          <span className="text-on-surface-variant">Elige al menos un día para repartir tus horas.</span>
        )}
      </p>
    </fieldset>
  );
}

function formatearHoras(h: number): string {
  const totalMin = Math.round(h * 60);
  const horas = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (horas === 0) return `${min} min`;
  return min === 0 ? `${horas} h` : `${horas} h ${min} min`;
}

/* --------------------------------------------------------------------------
 * Paso 3: pruebas que rendirá
 * -------------------------------------------------------------------------- */

const DETALLE_PRUEBA: Record<Prueba, { icono: string; detalle: string; obligatoria: boolean }> = {
  M1: { icono: 'calculate', detalle: 'Obligatoria · 65 preguntas', obligatoria: true },
  CL: { icono: 'menu_book', detalle: 'Obligatoria · 65 preguntas', obligatoria: true },
  M2: { icono: 'functions', detalle: 'Electiva · ingenierías, ciencias y economía', obligatoria: false },
  CIENCIAS: { icono: 'science', detalle: 'Electiva · Biología, Física y Química', obligatoria: false },
  HISTORIA: { icono: 'history_edu', detalle: 'Electiva · Historia y Ciencias Sociales', obligatoria: false },
};

export function SelectorPruebas({ pruebas, onCambio }: { pruebas: string[]; onCambio: (p: string[]) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">Pruebas que rendirás</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {PRUEBAS_OBJETIVO.map((p) => {
          const activa = pruebas.includes(p);
          const d = DETALLE_PRUEBA[p];
          return (
            <label
              key={p}
              className={cn(
                'flex min-h-[76px] cursor-pointer items-center gap-4 rounded-md border p-4 transition-[border-color,background-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                activa ? 'border-primary bg-primary-fixed/50' : 'border-border hover:bg-surface-container-low',
              )}
            >
              <input
                type="checkbox"
                checked={activa}
                onChange={() => onCambio(activa ? pruebas.filter((x) => x !== p) : [...pruebas, p])}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded',
                  activa ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
                )}
              >
                <Icono nombre={d.icono} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body-md font-semibold text-on-surface">{PRUEBAS_LABEL[p]}</span>
                <span className="block text-caption text-on-surface-variant">{d.detalle}</span>
              </span>
              <Icono
                nombre={activa ? 'check_circle' : 'radio_button_unchecked'}
                relleno={activa}
                className={cn('text-2xl', activa ? 'text-primary' : 'text-outline')}
              />
            </label>
          );
        })}
      </div>
      <p className="mt-4 text-caption text-on-surface-variant">
        Competencia Lectora y Matemáticas 1 son obligatorias para todas las carreras. Elige además las electivas que pide tu
        carrera.
      </p>
    </fieldset>
  );
}
