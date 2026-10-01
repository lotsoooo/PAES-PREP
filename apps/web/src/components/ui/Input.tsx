import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import * as Label from '@radix-ui/react-label';
import { cn } from '@/lib/cn';

export interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string;
  iconoIzquierdo?: string;
  /** Activa el botón de mostrar/ocultar contraseña. */
  esPassword?: boolean;
  contenedorClassName?: string;
}

/**
 * Input con etiqueta accesible, estados de validación con color + ícono
 * (DESIGN.md) y área táctil mínima de 44px.
 */
export const Input = forwardRef<HTMLInputElement, PropsInput>(function Input(
  {
    label,
    error,
    hint,
    iconoIzquierdo,
    esPassword = false,
    className,
    contenedorClassName,
    id,
    ...props
  },
  ref,
) {
  const idGenerado = useId();
  const inputId = id ?? idGenerado;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn('flex flex-col gap-1.5', contenedorClassName)}>
      <Label.Root htmlFor={inputId} className="text-label-md text-on-surface font-medium">
        {label}
      </Label.Root>

      <div className="relative flex items-center">
        {iconoIzquierdo && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined absolute left-3 text-xl text-on-surface-variant pointer-events-none"
          >
            {iconoIzquierdo}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={esPassword ? 'password' : (props.type ?? 'text')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'w-full min-h-11 rounded border bg-surface-container-lowest px-3 text-body-md',
            'text-on-surface placeholder:text-on-surface-variant/60',
            'transition-colors focus:outline-none',
            // Foco: borde primario + halo exterior de 2px (DESIGN.md)
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            iconoIzquierdo && 'pl-10',
            error ? 'border-error' : 'border-border-strong',
            className,
          )}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-caption text-error">
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            error
          </span>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface PropsCampo {
  label: string;
  children: (props: { id: string; describedBy?: string }) => ReactNode;
  error?: string | undefined;
  hint?: string;
}

/** Envoltorio etiquetado para controles no-<input> (Radix Select, Switch…). */
export function Campo({ label, children, error, hint }: PropsCampo) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label.Root htmlFor={id} className="text-label-md text-on-surface font-medium">
        {label}
      </Label.Root>
      {children({ id, describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
