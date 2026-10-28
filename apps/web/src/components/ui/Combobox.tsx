import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { claseControl } from './Input';
import { Icono } from './Icono';

export interface OpcionCombobox {
  id: string;
  etiqueta: string;
  detalle?: string;
}

/**
 * Combobox con búsqueda (patrón ARIA 1.2): el texto filtra las opciones del
 * servidor; flechas para moverse, Enter para elegir, Esc para cerrar.
 */
export function Combobox({
  label,
  labelOculto,
  placeholder,
  valor,
  onSeleccionar,
  opciones,
  busqueda,
  onBusquedaChange,
  cargando,
  error,
  hint,
  icono = 'search',
  vacio = 'Sin resultados. Prueba con otra palabra.',
  name,
  autoComplete = 'off',
  className,
}: {
  label: string;
  labelOculto?: boolean;
  placeholder?: string;
  valor: OpcionCombobox | null;
  onSeleccionar: (opcion: OpcionCombobox | null) => void;
  opciones: OpcionCombobox[];
  busqueda: string;
  onBusquedaChange: (texto: string) => void;
  cargando?: boolean;
  error?: string;
  hint?: ReactNode;
  icono?: string;
  vacio?: string;
  name?: string;
  autoComplete?: string;
  className?: string;
}) {
  const id = useId();
  const listaId = `${id}-lista`;
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  useEffect(() => setActivo(0), [opciones]);

  const texto = abierto ? busqueda : (valor?.etiqueta ?? busqueda);

  function elegir(o: OpcionCombobox) {
    onSeleccionar(o);
    onBusquedaChange('');
    setAbierto(false);
  }

  function alTeclado(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => Math.min(a + 1, opciones.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && abierto && opciones[activo]) {
      e.preventDefault();
      elegir(opciones[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedor} className={cn('relative flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-label-md font-medium text-on-surface', labelOculto && 'sr-only')}>
        {label}
      </label>
      <div className="relative flex items-center">
        <Icono nombre={icono} className="pointer-events-none absolute left-3 text-xl text-on-surface-variant" />
        <input
          id={id}
          name={name}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={abierto && opciones[activo] ? `${id}-op-${activo}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          autoComplete={autoComplete}
          spellCheck={false}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => {
            onBusquedaChange(e.target.value);
            setAbierto(true);
            if (valor) onSeleccionar(null);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclado}
          className={cn(claseControl, 'min-h-12 pl-10 pr-10', error ? 'border-error' : 'border-border-strong')}
        />
        {cargando ? (
          <Icono nombre="progress_activity" className="absolute right-3 animate-spin text-on-surface-variant" />
        ) : valor ? (
          <button
            type="button"
            aria-label={`Quitar ${valor.etiqueta}`}
            onClick={() => {
              onSeleccionar(null);
              onBusquedaChange('');
            }}
            className="absolute right-1 flex size-10 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high"
          >
            <Icono nombre="close" className="text-xl" />
          </button>
        ) : null}
      </div>

      {abierto && (
        <ul
          id={listaId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-md border border-border bg-surface-container-lowest py-1 shadow-float scrollbar-fino"
        >
          {opciones.length === 0 && !cargando ? (
            <li className="px-4 py-3 text-body-md text-on-surface-variant">{vacio}</li>
          ) : (
            opciones.map((o, i) => (
              <li
                key={o.id}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={valor?.id === o.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(o)}
                onMouseEnter={() => setActivo(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-body-md',
                  i === activo ? 'bg-surface-container text-on-surface' : 'text-on-surface',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate">{o.etiqueta}</span>
                  {o.detalle && <span className="block truncate text-caption text-on-surface-variant">{o.detalle}</span>}
                </span>
                {valor?.id === o.id && <Icono nombre="check" className="text-primary" />}
              </li>
            ))
          )}
        </ul>
      )}

      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1 text-caption text-error">
          <Icono nombre="error" className="text-base" />
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
