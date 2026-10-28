import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DTOEstadisticasCompletas, DTOPuntoHistorial } from '@paes-pro/shared';
import { MATERIA_ETIQUETA, PRUEBAS_LABEL, type Prueba } from '@paes-pro/shared';
import { cn } from '@/lib/cn';

const FMT_SEMANA = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
const FMT_MES = new Intl.DateTimeFormat('es-CL', { month: 'short', year: '2-digit' });

/**
 * Evolución del puntaje: una serie (línea azul 2px, marcadores ≥ 8px) y la meta
 * como línea naranja punteada con etiqueta directa (el naranjo no llega a 3:1
 * sobre blanco, así que nunca va sin texto). Un solo eje Y, escala PAES.
 */
export function GraficoEvolucion({
  historial,
  meta,
  periodo,
}: {
  historial: DTOPuntoHistorial[];
  meta: number | null;
  periodo: 'semanal' | 'mensual';
}) {
  const [verTabla, setVerTabla] = useState(false);
  const fmt = periodo === 'semanal' ? FMT_SEMANA : FMT_MES;
  const datos = useMemo(
    () => historial.map((h) => ({ ...h, etiqueta: fmt.format(new Date(h.fecha)) })),
    [historial, fmt],
  );
  const valores = datos.map((d) => d.puntaje).concat(meta ? [meta] : []);
  const min = Math.max(100, Math.floor((Math.min(...valores) - 60) / 50) * 50);
  const max = Math.min(1000, Math.ceil((Math.max(...valores) + 40) / 50) * 50);
  const ultimo = datos.at(-1);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setVerTabla((v) => !v)}
          aria-pressed={verTabla}
          className="inline-flex min-h-9 items-center rounded px-2 text-label-md font-medium text-primary hover:bg-primary/8"
        >
          {verTabla ? 'Ver gráfico' : 'Ver como tabla'}
        </button>
      </div>
      {verTabla ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <caption className="sr-only">Puntaje por {periodo === 'semanal' ? 'semana' : 'mes'}</caption>
            <thead className="text-caption text-on-surface-variant">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-medium">{periodo === 'semanal' ? 'Semana' : 'Mes'}</th>
                <th scope="col" className="py-2 pr-4 font-medium">Prueba</th>
                <th scope="col" className="py-2 text-right font-medium">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.intentoId + d.fecha} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-on-surface">{d.etiqueta}</td>
                  <td className="py-2 pr-4 text-on-surface-variant">{PRUEBAS_LABEL[d.prueba as Prueba] ?? d.prueba}</td>
                  <td className="py-2 text-right font-semibold text-on-surface tabular-nums">{d.puntaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <figure
          aria-label={`Evolución del puntaje: ${datos.length} puntos, el último ${ultimo?.puntaje ?? ''} puntos${meta ? `, meta ${meta}` : ''}.`}
          className="h-72 w-full md:h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 16, right: 56, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--pal-outline-variant)" strokeOpacity={0.6} />
              <XAxis
                dataKey="etiqueta"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--pal-on-surface-variant)', fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                domain={[min, max]}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fill: 'var(--pal-on-surface-variant)', fontSize: 12 }}
                tickCount={5}
              />
              <Tooltip
                cursor={{ stroke: 'var(--pal-outline)', strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (DTOPuntoHistorial & { etiqueta: string }) | undefined;
                  if (!active || !p) return null;
                  return (
                    <div className="rounded border border-border bg-surface-container-lowest px-3 py-2 shadow-float">
                      <p className="text-caption text-on-surface-variant">{p.etiqueta}</p>
                      <p className="text-body-md font-semibold text-on-surface tabular-nums">{p.puntaje} pts</p>
                      <p className="text-caption text-on-surface-variant">
                        {PRUEBAS_LABEL[p.prueba as Prueba] ?? p.prueba} · {Math.round(p.pctLogro)} % de logro
                      </p>
                    </div>
                  );
                }}
              />
              {meta && (
                <ReferenceLine
                  y={meta}
                  stroke="var(--pal-secondary-container)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  label={{ value: `Meta ${meta}`, position: 'right', fill: 'var(--pal-on-surface)', fontSize: 12, fontWeight: 600 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="puntaje"
                name="Puntaje"
                stroke="var(--pal-primary)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--pal-primary)', stroke: 'var(--pal-surface-container-lowest)', strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: 'var(--pal-surface-container-lowest)', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      )}
    </div>
  );
}

/** Mapa de actividad del último trimestre: una sola tonalidad, claro → oscuro. */
export function MapaActividad({ actividad }: { actividad: NonNullable<DTOEstadisticasCompletas['actividad']> }) {
  const semanas = useMemo(() => {
    const porFecha = new Map(actividad.map((a) => [a.fecha, a.cantidad]));
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // Empieza en el lunes de hace 12 semanas.
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - ((hoy.getDay() + 6) % 7) - 7 * 12);
    const cols: { fecha: string; cantidad: number; futuro: boolean }[][] = [];
    for (let s = 0; s < 13; s++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const f = new Date(inicio);
        f.setDate(inicio.getDate() + s * 7 + d);
        const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
        col.push({ fecha: iso, cantidad: porFecha.get(iso) ?? 0, futuro: f > hoy });
      }
      cols.push(col);
    }
    return cols;
  }, [actividad]);
  const diasActivos = actividad.filter((a) => a.cantidad > 0).length;
  const nivel = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);
  const tonos = ['bg-surface-container-high', 'bg-primary/35', 'bg-primary/65', 'bg-primary'];
  const fmt = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <p className="mb-4 text-body-md text-on-surface">
        <strong className="font-semibold tabular-nums">{diasActivos}</strong> días con actividad en las últimas 13 semanas.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-fino">
        <div aria-hidden="true" className="grid shrink-0 grid-rows-7 gap-1 text-caption text-on-surface-variant">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span key={i} className="flex h-4 items-center">
              {i % 2 === 0 ? d : ''}
            </span>
          ))}
        </div>
        <div role="img" aria-label={`Mapa de actividad: ${diasActivos} días con actividad en las últimas 13 semanas`} className="flex gap-1">
          {semanas.map((col, i) => (
            <div key={i} className="grid grid-rows-7 gap-1">
              {col.map((dia) => (
                <span
                  key={dia.fecha}
                  title={dia.futuro ? undefined : `${fmt.format(new Date(`${dia.fecha}T12:00:00`))}: ${dia.cantidad} ${dia.cantidad === 1 ? 'actividad' : 'actividades'}`}
                  className={cn('size-4 rounded-sm', dia.futuro ? 'bg-transparent' : tonos[nivel(dia.cantidad)])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 flex items-center gap-1.5 text-caption text-on-surface-variant">
        Menos
        {tonos.map((t) => (
          <span key={t} className={cn('size-3 rounded-sm', t)} />
        ))}
        Más
      </div>
    </div>
  );
}

const DIFICULTADES = [1, 2, 3, 4, 5] as const;

/** Errores por eje (filas) y dificultad (columnas): tabla con intensidad de una tonalidad. */
export function ErroresPorEje({ errores }: { errores: NonNullable<DTOEstadisticasCompletas['erroresPorEje']> }) {
  const filas = useMemo(() => {
    const mapa = new Map<string, { eje: string; materia: string; porDif: Record<number, number>; total: number }>();
    for (const e of errores) {
      const clave = `${e.materiaCodigo}:${e.ejeNombre}`;
      const f = mapa.get(clave) ?? { eje: e.ejeNombre, materia: e.materiaCodigo, porDif: {}, total: 0 };
      f.porDif[e.dificultad] = (f.porDif[e.dificultad] ?? 0) + e.errores;
      f.total += e.errores;
      mapa.set(clave, f);
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [errores]);
  const maximo = Math.max(1, ...errores.map((e) => e.errores));

  if (filas.length === 0) {
    return <p className="text-body-md text-on-surface-variant">Todavía no hay errores que analizar. ¡Sigue así!</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-separate border-spacing-1 text-left">
        <caption className="sr-only">Errores por eje temático y nivel de dificultad (1 = más fácil, 5 = más difícil)</caption>
        <thead>
          <tr className="text-caption text-on-surface-variant">
            <th scope="col" className="pb-1 font-medium">Eje</th>
            {DIFICULTADES.map((d) => (
              <th key={d} scope="col" className="pb-1 text-center font-medium">
                Nivel {d}
              </th>
            ))}
            <th scope="col" className="pb-1 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.materia + f.eje}>
              <th scope="row" className="pr-3 text-body-md font-medium text-on-surface">
                {f.eje}
                <span className="block text-caption font-normal text-on-surface-variant">{MATERIA_ETIQUETA[f.materia] ?? f.materia}</span>
              </th>
              {DIFICULTADES.map((d) => {
                const n = f.porDif[d] ?? 0;
                const intensidad = n === 0 ? 0 : 0.18 + (n / maximo) * 0.72;
                return (
                  <td key={d} className="h-11 rounded-sm bg-surface-container-low p-0 text-center">
                    <span
                      className={cn(
                        'flex size-full min-h-11 items-center justify-center rounded-sm text-label-md font-semibold tabular-nums',
                        intensidad > 0.55 ? 'text-on-primary' : 'text-on-surface',
                      )}
                      style={{ backgroundColor: n === 0 ? undefined : `color-mix(in srgb, var(--pal-primary) ${Math.round(intensidad * 100)}%, transparent)` }}
                    >
                      {n || '·'}
                    </span>
                  </td>
                );
              })}
              <td className="pl-2 text-right text-body-md font-semibold text-on-surface tabular-nums">{f.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
