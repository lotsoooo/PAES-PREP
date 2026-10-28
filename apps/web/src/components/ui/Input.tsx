import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icono } from './Icono';

/** Clases del control: blanco, borde #D1D5DB, foco azul con halo de 2px (DESIGN.md). */
export const claseControl =
  'w-full rounded border bg-surface-container-lowest text-body-md text-on-surface ' +
  'placeholder:text-outline transition-[border-color,box-shadow] duration-150 ' +
  'focus:outline-none focus-visible:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

interface PropsMarco {
  id: string;
  label: string;
  /** Oculta la etiqueta visualmente (sigue disponible para lectores). */
  labelOculto?: boolean;
  error?: string;
  exito?: string;
  hint?: ReactNode;
  opcional?: boolean;
  accionEtiqueta?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Etiqueta + control + mensaje de validación con ícono (el color nunca va solo). */
function Marco({ id, label, labelOculto, error, exito, hint, opcional, accionEtiqueta, className, children }: PropsMarco) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className={cn('flex items-baseline justify-between gap-2', labelOculto && 'sr-only')}>
        <label htmlFor={id} className="text-label-md font-medium text-on-surface">
          {label}
          {opcional && <span className="ml-1 font-normal text-on-surface-variant">(opcional)</span>}
        </label>
        {accionEtiqueta}
      </div>
      {children}
      <div aria-live="polite">
        {error ? (
          <p id={`${id}-error`} className="flex items-start gap-1 text-caption text-error">
            <Icono nombre="error" className="text-base leading-4" />
            {error}
          </p>
        ) : exito ? (
          <p id={`${id}-exito`} className="flex items-start gap-1 text-caption text-success">
            <Icono nombre="check_circle" className="text-base leading-4" />
            {exito}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-caption text-on-surface-variant">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function describedBy(id: string, error?: string, exito?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (exito) return `${id}-exito`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelOculto?: boolean;
  error?: string;
  exito?: string;
  hint?: ReactNode;
  opcional?: boolean;
  iconoIzquierdo?: string;
  /** Muestra el botón para ver u ocultar la contraseña. */
  esPassword?: boolean;
  accionEtiqueta?: ReactNode;
  contenedorClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, PropsInput>(function Input(
  {
    label,
    labelOculto,
    error,
    exito,
    hint,
    opcional,
    iconoIzquierdo,
    esPassword,
    accionEtiqueta,
    contenedorClassName,
    className,
    id,
    type,
    ...props
  },
  ref,
) {
  const generado = useId();
  const inputId = id ?? generado;
  const [visible, setVisible] = useState(false);
  const tipo = esPassword ? (visible ? 'text' : 'password') : (type ?? 'text');

  return (
    <Marco
      id={inputId}
      label={label}
      labelOculto={labelOculto}
      error={error}
      exito={exito}
      hint={hint}
      opcional={opcional}
      accionEtiqueta={accionEtiqueta}
      className={contenedorClassName}
    >
      <div className="relative flex items-center">
        {iconoIzquierdo && (
          <Icono
            nombre={iconoIzquierdo}
            className="pointer-events-none absolute left-3 text-xl text-on-surface-variant"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          type={tipo}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, exito, hint)}
          className={cn(
            claseControl,
            'min-h-12 px-3.5',
            iconoIzquierdo && 'pl-10',
            esPassword && 'pr-12',
            error ? 'border-error focus:border-error focus:ring-error/20' : exito ? 'border-success' : 'border-border-strong',
            className,
          )}
          {...props}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            disabled={props.disabled}
            className="absolute right-0.5 flex size-11 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:pointer-events-none"
          >
            <Icono nombre={visible ? 'visibility_off' : 'visibility'} className="text-xl" />
          </button>
        )}
      </div>
    </Marco>
  );
});

export interface PropsTextarea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  labelOculto?: boolean;
  error?: string;
  hint?: ReactNode;
  opcional?: boolean;
  contenedorClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, PropsTextarea>(function Textarea(
  { label, labelOculto, error, hint, opcional, contenedorClassName, className, id, ...props },
  ref,
) {
  const generado = useId();
  const areaId = id ?? generado;
  return (
    <Marco id={areaId} label={label} labelOculto={labelOculto} error={error} hint={hint} opcional={opcional} className={contenedorClassName}>
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(areaId, error, undefined, hint)}
        className={cn(
          claseControl,
          'min-h-28 resize-y px-3.5 py-3 leading-relaxed',
          error ? 'border-error' : 'border-border-strong',
          className,
        )}
        {...props}
      />
    </Marco>
  );
});

export interface PropsSelect extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  labelOculto?: boolean;
  error?: string;
  hint?: ReactNode;
  opciones: { valor: string; etiqueta: string }[];
  placeholder?: string;
  contenedorClassName?: string;
}

/** Select nativo con estilo del sistema: accesible y cómodo en móvil. */
export const Select = forwardRef<HTMLSelectElement, PropsSelect>(function Select(
  { label, labelOculto, error, hint, opciones, placeholder, contenedorClassName, className, id, ...props },
  ref,
) {
  const generado = useId();
  const selectId = id ?? generado;
  return (
    <Marco id={selectId} label={label} labelOculto={labelOculto} error={error} hint={hint} className={contenedorClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, error, undefined, hint)}
          className={cn(
            claseControl,
            'min-h-12 appearance-none pl-3.5 pr-10',
            error ? 'border-error' : 'border-border-strong',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
        <Icono
          nombre="expand_more"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
    </Marco>
  );
});
