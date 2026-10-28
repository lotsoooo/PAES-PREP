import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Icono } from './Icono';

/* --------------------------------------------------------------------------
 * SegmentedControl — radiogroup con flechas de teclado
 * -------------------------------------------------------------------------- */

export interface OpcionSegmento<T extends string> {
  valor: T;
  etiqueta: string;
  icono?: string;
}

export function SegmentedControl<T extends string>({
  opciones,
  valor,
  onCambio,
  etiquetaAria,
  tamano = 'md',
  className,
}: {
  opciones: OpcionSegmento<T>[];
  valor: T;
  onCambio: (valor: T) => void;
  etiquetaAria: string;
  tamano?: 'sm' | 'md';
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function alTeclado(e: KeyboardEvent, indice: number) {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const siguiente = (indice + delta + opciones.length) % opciones.length;
    onCambio(opciones[siguiente]!.valor);
    refs.current[siguiente]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={etiquetaAria}
      className={cn('inline-flex rounded bg-surface-container p-1', className)}
    >
      {opciones.map((o, i) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onCambio(o.valor)}
            onKeyDown={(e) => alTeclado(e, i)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-4 font-medium whitespace-nowrap',
              'transition-[background-color,color,box-shadow] duration-150',
              tamano === 'md' ? 'min-h-10 text-label-md' : 'min-h-8 text-caption',
              activo
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {o.icono && <Icono nombre={o.icono} className="text-lg" />}
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Accordion — botón con aria-expanded; animación de alto con grid-rows
 * -------------------------------------------------------------------------- */

export interface ItemAcordeon {
  id: string;
  titulo: string;
  contenido: ReactNode;
}

export function Accordion({ items, className }: { items: ItemAcordeon[]; className?: string }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const base = useId();
  return (
    <div className={cn('divide-y divide-border rounded-md border border-border bg-surface-container-lowest', className)}>
      {items.map((item) => {
        const estaAbierto = abierto === item.id;
        const panelId = `${base}-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                aria-expanded={estaAbierto}
                aria-controls={panelId}
                onClick={() => setAbierto(estaAbierto ? null : item.id)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                {item.titulo}
                <Icono
                  nombre="expand_more"
                  className={cn('text-on-surface-variant transition-transform duration-200', estaAbierto && 'rotate-180')}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-label={item.titulo}
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                estaAbierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden" inert={!estaAbierto}>
                <div className="px-5 pb-5 text-body-md text-on-surface-variant">{item.contenido}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Breadcrumbs
 * -------------------------------------------------------------------------- */

export function Breadcrumbs({ items, className }: { items: { etiqueta: string; to?: string }[]; className?: string }) {
  return (
    <nav aria-label="Ruta de navegación" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-label-md text-on-surface-variant">
        {items.map((item, i) => {
          const ultimo = i === items.length - 1;
          return (
            <li key={`${item.etiqueta}-${i}`} className="flex min-w-0 items-center gap-1">
              {item.to && !ultimo ? (
                <Link to={item.to} className="rounded-sm transition-colors hover:text-primary hover:underline">
                  {item.etiqueta}
                </Link>
              ) : (
                <span aria-current={ultimo ? 'page' : undefined} className={cn('truncate', ultimo && 'font-medium text-on-surface')}>
                  {item.etiqueta}
                </span>
              )}
              {!ultimo && <Icono nombre="chevron_right" className="text-lg text-outline" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
