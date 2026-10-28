import { Link } from 'react-router';
import type { DTONotificacion } from '@paes-pro/shared';
import { tiempoRelativo } from '@paes-pro/shared';
import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';
import { ESTILO_NOTIFICACION } from './estilos';

export function ItemNotificacion({
  n,
  compacto,
  onAbrir,
  accion,
}: {
  n: DTONotificacion;
  compacto?: boolean;
  onAbrir?: (n: DTONotificacion) => void;
  accion?: React.ReactNode;
}) {
  const estilo = ESTILO_NOTIFICACION[n.tipo] ?? ESTILO_NOTIFICACION.sistema!;
  const cuerpo = (
    <>
      <span className={cn('flex shrink-0 items-center justify-center rounded-full', compacto ? 'size-9' : 'size-11', estilo.clase)}>
        <Icono nombre={estilo.icono} relleno className={compacto ? 'text-lg' : 'text-xl'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={cn('text-on-surface', compacto ? 'text-label-md' : 'text-body-md', !n.leida && 'font-semibold')}>
            {n.titulo}
          </span>
          <time dateTime={n.creadoEn} className="shrink-0 text-caption text-on-surface-variant">
            {tiempoRelativo(n.creadoEn)}
          </time>
        </span>
        {n.cuerpo && (
          <span className={cn('mt-0.5 block text-on-surface-variant', compacto ? 'line-clamp-2 text-caption' : 'text-body-md')}>
            {n.cuerpo}
          </span>
        )}
        {!compacto && accion}
      </span>
      {!n.leida && (
        <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary">
          <span className="sr-only">Sin leer</span>
        </span>
      )}
    </>
  );

  const clase = cn(
    'flex w-full items-start gap-3 text-left transition-colors',
    compacto ? 'rounded px-3 py-3 hover:bg-surface-container-low' : 'p-5',
  );

  return n.url ? (
    <Link to={n.url} onClick={() => onAbrir?.(n)} className={clase}>
      {cuerpo}
    </Link>
  ) : (
    <button type="button" onClick={() => onAbrir?.(n)} className={clase}>
      {cuerpo}
    </button>
  );
}
