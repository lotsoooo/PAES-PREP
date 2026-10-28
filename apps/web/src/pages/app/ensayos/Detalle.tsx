import { useNavigate, useParams } from 'react-router';
import type { DTOEje } from '@paes-pro/shared';
import { formatearFecha, PRUEBAS_LABEL } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { useEnsayo } from '@/lib/data/ensayos';
import { useTitulo } from '@/hooks/utiles';
import { InsigniaPremium } from '@/components/premium/Premium';
import { usePlan } from '@/components/premium/plan';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Breadcrumbs } from '@/components/ui/Navegacion';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Metadato } from '@/components/ui/Datos';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { formatoDuracion } from '@/components/ensayos/formato';

const NIVEL = { basico: 'Básica', medio: 'Media', avanzado: 'Alta' } as const;

/** Ícono por eje temático, según su nombre (Stitch usa uno por eje). */
function iconoEje(eje: DTOEje): string {
  const n = eje.nombre.toLowerCase();
  if (n.includes('número')) return 'calculate';
  if (n.includes('álgebra') || n.includes('funcion')) return 'function';
  if (n.includes('geometr')) return 'architecture';
  if (n.includes('probab') || n.includes('estad')) return 'pie_chart';
  if (n.includes('lectur') || n.includes('texto') || n.includes('localizar')) return 'menu_book';
  if (n.includes('interpret')) return 'psychology';
  if (n.includes('evalu')) return 'fact_check';
  if (n.includes('historia')) return 'history_edu';
  if (n.includes('ciudad')) return 'how_to_vote';
  if (n.includes('econom')) return 'payments';
  if (n.includes('célula') || n.includes('biolog') || n.includes('organism')) return 'biotech';
  if (n.includes('química') || n.includes('materia')) return 'science';
  if (n.includes('física') || n.includes('mecánica') || n.includes('onda') || n.includes('energía')) return 'bolt';
  return 'category';
}

export default function DetalleEnsayo() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { pedirUpgrade } = usePlan();
  const { data: ensayo, isLoading, isError, error, refetch, isFetching } = useEnsayo(slug);
  useTitulo(ensayo?.titulo ?? 'Ensayo');

  if (isLoading) {
    return (
      <Pagina ancho="lectura">
        <Cargando etiqueta="Cargando ensayo…">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-6 h-56 rounded-lg" />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg md:col-span-2" />
          </div>
        </Cargando>
      </Pagina>
    );
  }
  if (isError || !ensayo) {
    const noExiste = error instanceof ApiError && error.status === 404;
    return (
      <Pagina ancho="lectura">
        {noExiste ? (
          <EstadoVacio
            icono="search_off"
            titulo="Este ensayo no existe"
            descripcion={error.message}
            accion={<BotonEnlace to="/app/ensayos">Ver la biblioteca</BotonEnlace>}
          />
        ) : (
          <EstadoError titulo="No pudimos cargar el ensayo" onReintentar={() => void refetch()} cargando={isFetching} />
        )}
      </Pagina>
    );
  }

  const comenzar = () => {
    if (ensayo.bloqueadoPorPlan) {
      pedirUpgrade('Este ensayo es parte de Premium. Con Premium rindes todos los ensayos, sin límite mensual.');
      return;
    }
    navigate(`/app/ensayos/${ensayo.slug}/rendir`);
  };
  const enCurso = Boolean(ensayo.intentoEnCursoId);

  return (
    <Pagina ancho="lectura">
      <Breadcrumbs className="mb-6" items={[{ etiqueta: 'Mis ensayos', to: '/app/ensayos' }, { etiqueta: ensayo.titulo }]} />

      <Card como="section" radio="lg" padding="lg" aria-labelledby="titulo-ensayo" className="overflow-hidden">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Chip tono="primario">{PRUEBAS_LABEL[ensayo.prueba]}</Chip>
              <Metadato icono="schedule">{ensayo.duracionMin} min</Metadato>
              {ensayo.esDiagnostico && (
                <Chip tono="exito" tamano="sm" icono="explore">
                  Diagnóstico
                </Chip>
              )}
              {ensayo.premium && <InsigniaPremium />}
            </div>
            <h1 id="titulo-ensayo" className="mt-4 text-headline-lg-mobile text-on-surface text-balance md:text-headline-lg">
              {ensayo.titulo}
            </h1>
            {ensayo.descripcion && <p className="mt-3 text-body-lg text-on-surface-variant text-pretty">{ensayo.descripcion}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            {ensayo.bloqueadoPorPlan ? (
              <Button variante="premium" tamano="lg" iconoIzquierdo="lock" onClick={comenzar}>
                Desbloquear con Premium
              </Button>
            ) : (
              <Button tamano="lg" iconoDerecho={enCurso ? 'resume' : 'play_arrow'} onClick={comenzar} className="shadow-primary">
                {enCurso ? 'Continuar ensayo' : 'Comenzar ensayo'}
              </Button>
            )}
            {enCurso && <p className="text-caption text-on-surface-variant">Tienes un intento en curso: retomas donde quedaste.</p>}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card como="section" radio="lg" aria-labelledby="detalles">
            <h2 id="detalles" className="text-headline-md text-on-surface">
              Detalles
            </h2>
            <dl className="mt-5 space-y-5">
              <Dato icono="format_list_numbered" etiqueta="Preguntas" valor={`${ensayo.preguntasCount} preguntas`} />
              <Dato icono="timer" etiqueta="Tiempo" valor={formatoDuracion(ensayo.duracionMin)} />
              <Dato icono="trending_up" etiqueta="Dificultad" valor={NIVEL[ensayo.nivel]} />
              <Dato icono="fact_check" etiqueta="Prueba" valor={PRUEBAS_LABEL[ensayo.prueba]} />
            </dl>
          </Card>
          {ensayo.ultimoIntento && ensayo.ultimoIntento.estado !== 'en_curso' && (
            <Card como="section" radio="lg" aria-labelledby="ultimo">
              <h2 id="ultimo" className="text-body-lg font-semibold text-on-surface">
                Tu último intento
              </h2>
              <p className="mt-1 text-caption text-on-surface-variant">
                {formatearFecha(ensayo.ultimoIntento.entregadoEn ?? ensayo.ultimoIntento.iniciadoEn)}
              </p>
              <p className="mt-3 text-display font-bold text-primary tabular-nums">
                {ensayo.ultimoIntento.puntaje ?? '—'}
                <span className="ml-1 text-body-md font-normal text-on-surface-variant">pts</span>
              </p>
              <BotonEnlace
                to={`/app/ensayos/intentos/${ensayo.ultimoIntento.id}`}
                variante="secundario"
                tamano="sm"
                className="mt-4"
                iconoDerecho="arrow_forward"
              >
                Ver resultados
              </BotonEnlace>
            </Card>
          )}
        </div>

        <Card como="section" radio="lg" aria-labelledby="ejes" className="md:col-span-2">
          <h2 id="ejes" className="text-headline-md text-on-surface">
            Ejes temáticos a evaluar
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {ensayo.ejes.length === 0
              ? 'Este ensayo combina contenidos de toda la prueba.'
              : `Este ensayo cubre ${ensayo.ejes.length === 1 ? 'un eje' : `${ensayo.ejes.length} ejes`} de ${PRUEBAS_LABEL[ensayo.prueba]}.`}
          </p>
          {ensayo.ejes.length > 0 && (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {ensayo.ejes.map((eje) => (
                <li key={eje.id} className="flex gap-3 rounded-md border border-border p-4">
                  <Icono nombre={iconoEje(eje)} className="mt-0.5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold text-on-surface">{eje.nombre}</p>
                    {eje.descripcion && <p className="mt-1 text-caption text-on-surface-variant">{eje.descripcion}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <aside className="mt-6 rounded-md border-l-4 border-primary bg-surface-container-low px-5 py-4 text-label-md text-on-surface" style={{ letterSpacing: 0 }}>
            <strong className="font-semibold">Consejo:</strong> busca un lugar tranquilo y con buena conexión. Una vez que
            comiences, el cronómetro no se detiene, pero tus respuestas se guardan solas: si se corta el internet, retomas
            donde quedaste. Ten lápiz y papel a mano para tus cálculos.
          </aside>
        </Card>
      </div>
    </Pagina>
  );
}

function Dato({ icono, etiqueta, valor, tono = 'primario' }: { icono: string; etiqueta: string; valor: string; tono?: 'primario' | 'dorado' }) {
  return (
    <div className="flex items-center gap-4">
      <span
        className={
          tono === 'dorado'
            ? 'flex size-11 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary'
            : 'flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary'
        }
      >
        <Icono nombre={icono} />
      </span>
      <div>
        <dt className="text-caption text-on-surface-variant">{etiqueta}</dt>
        <dd className="text-body-md font-semibold text-on-surface">{valor}</dd>
      </div>
    </div>
  );
}
