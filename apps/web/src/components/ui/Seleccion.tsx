import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icono } from './Icono';

/**
 * Checkbox con área táctil de 44px: la etiqueta y el control comparten un
 * solo blanco de clic (sin zonas muertas).
 */
export function Checkbox({
  marcado,
  onCambio,
  etiqueta,
  descripcion,
  disabled,
  name,
  className,
}: {
  marcado: boolean;
  onCambio: (marcado: boolean) => void;
  etiqueta: ReactNode;
  descripcion?: ReactNode;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-body-md text-on-surface',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          name={name}
          checked={marcado}
          disabled={disabled}
          onChange={(e) => onCambio(e.target.checked)}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-sm border-2 border-outline bg-surface-container-lowest transition-colors checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <Icono
          nombre="check"
          className="pointer-events-none relative text-base font-bold text-on-primary opacity-0 transition-opacity peer-checked:opacity-100"
        />
      </span>
      <span className="flex flex-col">
        <span>{etiqueta}</span>
        {descripcion && <span className="text-caption text-on-surface-variant">{descripcion}</span>}
      </span>
    </label>
  );
}

export interface OpcionRadio<T extends string> {
  valor: T;
  etiqueta: ReactNode;
  descripcion?: ReactNode;
  icono?: string;
  deshabilitada?: boolean;
}

/** Grupo de radios accesible (fieldset + legend). Variante "tarjeta" para opciones grandes. */
export function RadioGrupo<T extends string>({
  leyenda,
  leyendaOculta,
  nombre,
  valor,
  onCambio,
  opciones,
  variante = 'lista',
  columnas = 1,
  className,
}: {
  leyenda: string;
  leyendaOculta?: boolean;
  nombre: string;
  valor: T | null;
  onCambio: (valor: T) => void;
  opciones: OpcionRadio<T>[];
  variante?: 'lista' | 'tarjeta';
  columnas?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className={cn('mb-2 text-label-md font-medium text-on-surface', leyendaOculta && 'sr-only')}>
        {leyenda}
      </legend>
      <div
        className={cn(
          'grid gap-2',
          columnas === 2 && 'sm:grid-cols-2',
          columnas === 3 && 'sm:grid-cols-3',
        )}
      >
        {opciones.map((o) => {
          const activo = valor === o.valor;
          return (
            <label
              key={o.valor}
              className={cn(
                'relative flex min-h-11 cursor-pointer items-center gap-3 text-body-md text-on-surface',
                variante === 'tarjeta' &&
                  'rounded-md border bg-surface-container-lowest p-4 transition-[border-color,background-color,box-shadow] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                variante === 'tarjeta' &&
                  (activo
                    ? 'border-primary bg-primary-fixed/40 shadow-card'
                    : 'border-border hover:border-outline-variant hover:bg-surface-container-low'),
                o.deshabilitada && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="radio"
                name={nombre}
                value={o.valor}
                checked={activo}
                disabled={o.deshabilitada}
                onChange={() => onCambio(o.valor)}
                className={cn(
                  'size-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-outline bg-surface-container-lowest transition-[border-color,box-shadow]',
                  'checked:border-primary checked:shadow-[inset_0_0_0_4px_var(--color-surface-container-lowest)] checked:bg-primary',
                  variante === 'tarjeta' && 'focus-visible:outline-none',
                )}
              />
              {o.icono && <Icono nombre={o.icono} className={cn('text-2xl', activo ? 'text-primary' : 'text-on-surface-variant')} />}
              <span className="flex flex-col">
                <span className={cn(variante === 'tarjeta' && 'font-semibold')}>{o.etiqueta}</span>
                {o.descripcion && <span className="text-caption text-on-surface-variant">{o.descripcion}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
