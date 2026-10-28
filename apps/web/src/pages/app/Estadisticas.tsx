import { useState } from 'react';
import type { DTOEstadisticasCompletas, DTOPrecisionEje, Prueba } from '@paes-pro/shared';
import { MATERIA_ETIQUETA, PRUEBAS_LABEL } from '@paes-pro/shared';
import { useEstadisticas } from '@/lib/data/ensayos';
import { useContador, useTitulo } from '@/hooks/utiles';
import { EncabezadoPagina, Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/Navegacion';
import { BotonEnlace } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { PremiumLock } from '@/components/premium/Premium';
import { PaesBot } from '@/components/ia/PaesBot';
import { ErroresPorEje, GraficoEvolucion, MapaActividad } from '@/components/estadisticas/Graficos';
import { formatoSegundos } from '@/components/ensayos/formato';
import { cn } from '@/lib/cn';

type Periodo = 'semanal' | 'mensual';

export default function Estadisticas() {
  useTitulo('Estadísticas');
  const [periodo, setPeriodo] = useState<Periodo>('semanal');
  const { data, isLoading, isError, refetch, isFetching, isPlaceholderData } = useEstadisticas(periodo);

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Estadísticas"
        descripcion="Cómo avanzas hacia tu puntaje meta, según tus ensayos."
        acciones={
          <>
            <PaesBot contexto={{ tipo: 'estadisticas' }} />
            <SegmentedControl
              etiquetaAria="Agrupar por"
              valor={periodo}
              onCambio={setPeriodo}
              opciones={[
                { valor: 'semanal', etiqueta: 'Semanal' },
                { valor: 'mensual', etiqueta: 'Mensual' },
              ]}
            />
          </>
        }
      />
      {isLoading ? (
        <Cargando etiqueta="Cargando estadísticas…" className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-lg lg:col-span-2" />
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-48 rounded-lg lg:col-span-3" />
          <Skeleton className="h-96 rounded-lg lg:col-span-3" />
        </Cargando>
      ) : isError || !data ? (
        <EstadoError titulo="No pudimos cargar tus estadísticas" onReintentar={() => void refetch()} cargando={isFetching} />
      ) : data.totalIntentos === 0 ? (
        <EstadoVacio
          icono="query_stats"
          titulo="Aún no hay datos para mostrar"
          descripcion="Rinde tu primer ensayo y aquí verás tu puntaje estimado, tu precisión por eje y cómo evolucionas."
          accion={
            <BotonEnlace to="/app/ensayos/ensayo-diagnostico-m1" iconoDerecho="arrow_forward">
              Rendir el diagnóstico
            </BotonEnlace>
          }
        />
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')} aria-busy={isPlaceholderData}>
          <Contenido datos={data} />
        </div>
      )}
    </Pagina>
  );
}

function Contenido({ datos }: { datos: DTOEstadisticasCompletas }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Prediccion datos={datos} />
      <TiempoPregunta datos={datos} />
      <PrecisionEjes ejes={datos.precisionPorEje} />

      <Card como="section" radio="lg" padding="lg" aria-labelledby="evolucion" className="lg:col-span-3">
        <h2 id="evolucion" className="text-headline-md text-on-surface">
          Evolución del puntaje
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Promedio {datos.periodo === 'semanal' ? 'semanal' : 'mensual'} de tus ensayos entregados.
        </p>
        <div className="mt-4">
          {datos.historial.length < 2 ? (
            <EstadoVacio
              compacto
              icono="show_chart"
              titulo="Necesitas al menos dos ensayos"
              descripcion={`Con un ensayo más en otra ${datos.periodo === 'semanal' ? 'semana' : 'mes'} verás aquí tu tendencia.`}
            />
          ) : (
            <GraficoEvolucion historial={datos.historial} meta={datos.puntajeMeta} periodo={datos.periodo} />
          )}
        </div>
        {Object.keys(datos.porPrueba).length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-3 border-t border-outline-variant pt-5">
            {Object.entries(datos.porPrueba).map(([prueba, puntaje]) => (
              <div key={prueba} className="rounded-md bg-surface-container-low px-4 py-3">
                <dt className="text-caption text-on-surface-variant">{PRUEBAS_LABEL[prueba as Prueba] ?? prueba}</dt>
                <dd className="text-body-lg font-semibold text-on-surface tabular-nums">{puntaje} pts</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <Card como="section" radio="lg" padding="lg" aria-labelledby="actividad" className="lg:col-span-1">
        <h2 id="actividad" className="flex items-center gap-2 text-headline-md text-on-surface">
          Actividad
        </h2>
        <div className="mt-4">
          <PremiumLock motivo="El mapa de actividad es parte de la analítica avanzada de Premium." titulo="Mapa de actividad" descripcion="Mira qué días estudias y mantén tu constancia.">
            <MapaActividad actividad={datos.actividad ?? EJEMPLO_ACTIVIDAD} />
          </PremiumLock>
        </div>
      </Card>

      <Card como="section" radio="lg" padding="lg" aria-labelledby="errores" className="lg:col-span-2">
        <h2 id="errores" className="text-headline-md text-on-surface">
          Dónde se concentran tus errores
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">Errores por eje y nivel de dificultad (1 es el más fácil).</p>
        <div className="mt-4">
          <PremiumLock motivo="La distribución de errores por eje y dificultad es parte de la analítica avanzada de Premium." titulo="Análisis de errores" descripcion="Descubre en qué ejes y niveles pierdes más puntos.">
            <ErroresPorEje errores={datos.erroresPorEje ?? EJEMPLO_ERRORES} />
          </PremiumLock>
        </div>
      </Card>
    </div>
  );
}

function Prediccion({ datos }: { datos: DTOEstadisticasCompletas }) {
  const puntaje = datos.prediccion.puntaje ?? datos.puntajeActual;
  const meta = datos.prediccion.meta;
  const [animado, ref] = useContador(puntaje);
  const falta = meta !== null ? meta - puntaje : null;
  const posMeta = meta !== null ? ((meta - 100) / 900) * 100 : null;

  return (
    <Card como="section" radio="lg" padding="lg" aria-labelledby="prediccion" className="lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="prediccion" className="text-headline-md text-on-surface">
            Puntaje estimado
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Según tus ensayos más recientes.</p>
        </div>
        {datos.tendencia !== null && datos.tendencia !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md font-semibold tabular-nums',
              datos.tendencia > 0 ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container',
            )}
            style={{ letterSpacing: 0 }}
          >
            <Icono nombre={datos.tendencia > 0 ? 'trending_up' : 'trending_down'} className="text-lg" />
            {datos.tendencia > 0 ? '+' : ''}
            {Math.round(datos.tendencia)} vs. tu promedio anterior
          </span>
        )}
      </div>
      <p className="mt-6 flex items-baseline gap-2" aria-label={`${puntaje} de 1000 puntos`}>
        <span ref={ref as React.RefObject<HTMLSpanElement>} aria-hidden="true" className="text-[64px] font-bold leading-none tracking-tight text-primary tabular-nums md:text-[80px]">
          {animado}
        </span>
        <span aria-hidden="true" className="text-body-lg text-on-surface-variant">
          / 1000 pts
        </span>
      </p>

      <div className="relative mt-8">
        {posMeta !== null && (
          <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-caption font-semibold text-secondary" style={{ left: `${posMeta}%` }}>
            Meta {meta}
          </span>
        )}
        <div
          role="progressbar"
          aria-label="Puntaje estimado en la escala PAES"
          aria-valuemin={100}
          aria-valuemax={1000}
          aria-valuenow={puntaje}
          className="relative h-2 w-full rounded-full bg-surface-container-high"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${((puntaje - 100) / 900) * 100}%` }} />
          {posMeta !== null && (
            <span aria-hidden="true" className="absolute -top-1.5 h-5 w-1 -translate-x-1/2 rounded-full bg-secondary" style={{ left: `${posMeta}%` }} />
          )}
        </div>
      </div>
      {falta !== null && (
        <p className={cn('mt-5 inline-flex items-center gap-1.5 text-label-md', falta > 0 ? 'text-secondary' : 'text-success')} style={{ letterSpacing: 0 }}>
          <Icono nombre={falta > 0 ? 'info' : 'verified'} className="text-lg" />
          {falta > 0 ? `Te faltan ${falta} puntos para tu meta. ¡Sigue practicando!` : `Superas tu meta por ${-falta} puntos. ¡Mantén el ritmo!`}
        </p>
      )}
    </Card>
  );
}

function TiempoPregunta({ datos }: { datos: DTOEstadisticasCompletas }) {
  const diferencia = datos.tiempoPromedioPregunta - datos.tiempoRecomendado;
  const lento = diferencia > 5;
  return (
    <Card como="section" radio="lg" padding="lg" aria-labelledby="tiempo-pregunta" className="flex flex-col">
      <h2 id="tiempo-pregunta" className="flex items-center gap-2 text-headline-md text-on-surface">
        <Icono nombre="timer" className="text-primary" />
        Tiempo por pregunta
      </h2>
      <p className="mt-6 text-headline-lg font-bold text-on-surface tabular-nums">{formatoSegundos(datos.tiempoPromedioPregunta)}</p>
      <p className="mt-2 text-body-md text-on-surface-variant">
        {lento
          ? `Estás ${formatoSegundos(diferencia)} sobre lo recomendado (${formatoSegundos(datos.tiempoRecomendado)}).`
          : `Dentro de lo recomendado: ${formatoSegundos(datos.tiempoRecomendado)} por pregunta.`}
      </p>
      <div className="flex-1" />
      <BotonEnlace to="/app/ensayos" variante="secundario" anchoCompleto className="mt-6" iconoIzquierdo="speed">
        Practicar velocidad
      </BotonEnlace>
    </Card>
  );
}

const ESTADO_EJE: Record<DTOPrecisionEje['etiqueta'], { texto: string; tono: 'exito' | 'primario' | 'naranjo'; icono: string }> = {
  fuerte: { texto: 'Buen rendimiento', tono: 'exito', icono: 'check_circle' },
  por_buen_camino: { texto: 'En camino', tono: 'primario', icono: 'trending_up' },
  promedio: { texto: 'En camino', tono: 'primario', icono: 'trending_flat' },
  necesita_repaso: { texto: 'Revisar', tono: 'naranjo', icono: 'priority_high' },
};

function PrecisionEjes({ ejes }: { ejes: DTOPrecisionEje[] }) {
  return (
    <Card como="section" radio="lg" padding="lg" aria-labelledby="precision" className="lg:col-span-3">
      <h2 id="precision" className="text-headline-md text-on-surface">
        Precisión por eje
      </h2>
      {ejes.length === 0 ? (
        <p className="mt-3 text-body-md text-on-surface-variant">Aún no respondes preguntas con eje asignado.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ejes.map((e) => {
            const estado = ESTADO_EJE[e.etiqueta];
            const pct = Math.round(e.precision);
            return (
              <li key={e.ejeId} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold text-on-surface">{e.ejeNombre}</p>
                    <p className="text-caption text-on-surface-variant">{MATERIA_ETIQUETA[e.materiaCodigo] ?? e.materiaCodigo}</p>
                  </div>
                  <span className="text-body-lg font-bold text-on-surface tabular-nums">{pct} %</span>
                </div>
                <ProgressBar className="mt-3" valor={pct} tono={estado.tono} etiquetaAria={`${e.ejeNombre}: ${pct} % de precisión`} />
                <p
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 text-caption font-medium',
                    estado.tono === 'exito' ? 'text-success' : estado.tono === 'naranjo' ? 'text-secondary' : 'text-on-surface-variant',
                  )}
                >
                  <Icono nombre={estado.icono} className="text-sm" />
                  {estado.texto} · {e.correctas}/{e.total} correctas
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* Relleno visual detrás del candado Premium (no son datos del usuario). */
const EJEMPLO_ACTIVIDAD = Array.from({ length: 40 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 2);
  return { fecha: d.toISOString().slice(0, 10), cantidad: (i % 4) + 1 };
});
const EJEMPLO_ERRORES = [
  { ejeNombre: 'Geometría', materiaCodigo: 'M1', dificultad: 3, errores: 4 },
  { ejeNombre: 'Álgebra y funciones', materiaCodigo: 'M1', dificultad: 2, errores: 2 },
  { ejeNombre: 'Probabilidad y estadística', materiaCodigo: 'M1', dificultad: 4, errores: 3 },
];
