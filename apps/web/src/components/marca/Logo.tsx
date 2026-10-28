import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { BRAND_NAME, anioAdmision } from '@/config/marca';

/**
 * Marca de PAES Pro: una "P" cuyo trazo sube como una curva de progreso.
 * Dibujada en código para que herede el color del tema.
 */
export function MarcaIcono({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-9 shrink-0', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M10 24V8h7.2a5.3 5.3 0 0 1 0 10.6H10"
        fill="none"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-on-primary"
      />
      <path d="M18.5 24l5-5.5" fill="none" strokeWidth="2.8" strokeLinecap="round" className="stroke-secondary-container" />
    </svg>
  );
}

export function Logo({
  to = '/',
  conAdmision,
  className,
}: {
  to?: string;
  conAdmision?: boolean;
  className?: string;
}) {
  return (
    <Link to={to} className={cn('flex items-center gap-3 rounded', className)} aria-label={`${BRAND_NAME}, ir al inicio`}>
      <MarcaIcono />
      <span className="flex flex-col leading-none">
        <span className="text-[1.375rem] font-bold tracking-tight text-primary" translate="no">
          {BRAND_NAME}
        </span>
        {conAdmision && (
          <span className="mt-1 text-caption text-on-surface-variant">Admisión {anioAdmision()}</span>
        )}
      </span>
    </Link>
  );
}
