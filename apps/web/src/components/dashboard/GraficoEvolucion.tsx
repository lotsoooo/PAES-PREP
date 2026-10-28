import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DTOPuntoHistorial } from '@paes-pro/shared';
import { formatearFechaCorta, PRUEBAS_CORTA, type Prueba } from '@paes-pro/shared';
import { usePrefiereMenosMovimiento } from '@/hooks/utiles';

/**
 * Evolución del puntaje (escala PAES 100–1000): línea azul de 2px sin relleno
 * y la meta como línea naranja punteada (DESIGN.md). Una sola serie: el
 * título de la card la nombra, sin leyenda.
 */
export function GraficoEvolucion({ historial, meta, alto = 180 }: { historial: DTOPuntoHistorial[]; meta: number | null; alto?: number }) {
  const reducido = usePrefiereMenosMovimiento();
  const datos = historial.map((p) => ({ ...p, etiqueta: formatearFechaCorta(p.fecha) }));
  const valores = [...datos.map((d) => d.puntaje), ...(meta ? [meta] : [])];
  const min = Math.max(100, Math.floor((Math.min(...valores) - 40) / 100) * 100);
  const max = Math.min(1000, Math.ceil((Math.max(...valores) + 20) / 100) * 100);

  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--pal-outline-variant)" strokeOpacity={0.5} />
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--pal-on-surface-variant)', fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[min, max]}
            tickCount={4}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--pal-on-surface-variant)', fontSize: 12 }}
            width={44}
          />
          {meta && (
            <ReferenceLine
              y={meta}
              stroke="var(--pal-secondary-container)"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{ value: `Meta ${meta}`, position: 'insideTopRight', fill: 'var(--pal-secondary)', fontSize: 12 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: 'var(--pal-outline)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (DTOPuntoHistorial & { etiqueta: string }) | undefined;
              if (!active || !p) return null;
              return (
                <div className="rounded border border-border bg-surface-container-lowest px-3 py-2 text-caption shadow-float">
                  <p className="text-on-surface-variant">
                    {p.etiqueta} · {PRUEBAS_CORTA[p.prueba as Prueba] ?? p.prueba}
                  </p>
                  <p className="text-body-md font-semibold text-on-surface tabular-nums">{p.puntaje} puntos</p>
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="puntaje"
            stroke="var(--pal-primary)"
            strokeWidth={2}
            dot={datos.length <= 12 ? { r: 3, fill: 'var(--pal-primary)', stroke: 'var(--pal-surface-container-lowest)', strokeWidth: 2 } : false}
            activeDot={{ r: 5, stroke: 'var(--pal-surface-container-lowest)', strokeWidth: 2 }}
            isAnimationActive={!reducido}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
