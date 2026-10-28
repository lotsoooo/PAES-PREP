import { cn } from '@/lib/cn';

export interface PropsIcono {
  /** Nombre del ícono de Material Symbols Outlined (ej. "local_fire_department"). */
  nombre: string;
  relleno?: boolean;
  className?: string;
  /** Si el ícono transmite información por sí solo, describe aquí su significado. */
  etiqueta?: string;
}

/**
 * Ícono de Material Symbols Outlined (el set que usa Stitch). Decorativo por
 * defecto (`aria-hidden`); con `etiqueta` se anuncia a lectores de pantalla.
 */
export function Icono({ nombre, relleno, className, etiqueta }: PropsIcono) {
  return (
    <span
      className={cn('material-symbols-outlined shrink-0', relleno && 'icon-filled', className)}
      aria-hidden={etiqueta ? undefined : true}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      translate="no"
    >
      {nombre}
    </span>
  );
}
