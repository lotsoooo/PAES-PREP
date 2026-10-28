import { cn } from '@/lib/cn';
import { INTERVALOS_CAJA } from './leitner';

/** Cinco segmentos: cuántas cajas lleva subidas la pregunta. Con texto, nunca solo color. */
export function IndicadorCaja({ caja, dominada, className }: { caja: number; dominada?: boolean; className?: string }) {
  const nivel = dominada ? 5 : Math.min(5, Math.max(1, caja));
  return (
    <span className={cn('inline-flex items-center gap-2 text-caption text-on-surface-variant', className)}>
      <span aria-hidden="true" className="flex gap-0.5">
        {INTERVALOS_CAJA.map((_, i) => (
          <span key={i} className={cn('h-1.5 w-3 rounded-full', i < nivel ? (dominada ? 'bg-success' : 'bg-primary') : 'bg-surface-container-high')} />
        ))}
      </span>
      {dominada ? 'Dominada' : `Caja ${nivel} de 5`}
    </span>
  );
}
