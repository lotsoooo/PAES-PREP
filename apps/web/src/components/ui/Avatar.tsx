import { cn } from '@/lib/cn';
import { iniciales } from '@/lib/texto';

const tamanos = {
  xs: 'size-7 text-caption',
  sm: 'size-9 text-label-md',
  md: 'size-11 text-body-md',
  lg: 'size-14 text-headline-md',
  xl: 'size-20 text-display',
} as const;

export interface PropsAvatar {
  nombre: string;
  url?: string | null;
  tamano?: keyof typeof tamanos;
  /** Anillo dorado para perfiles de tutor verificados. */
  verificado?: boolean;
  className?: string;
}

export function Avatar({
  nombre,
  url,
  tamano = 'md',
  verificado,
  className,
}: PropsAvatar) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {url ? (
        <img
          src={url}
          alt={nombre}
          loading="lazy"
          decoding="async"
          className={cn('rounded-full object-cover', tamanos[tamano])}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-primary-container font-semibold text-on-primary-container',
            tamanos[tamano],
          )}
        >
          {iniciales(nombre)}
        </span>
      )}
      {verificado && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container ring-2 ring-surface-container-lowest"
          title="Tutor verificado"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined icon-filled text-sm"
          >
            verified
          </span>
          <span className="sr-only">Tutor verificado</span>
        </span>
      )}
    </span>
  );
}
