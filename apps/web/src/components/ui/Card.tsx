import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EtiquetaCard = 'div' | 'article' | 'section' | 'li' | 'aside';

export interface PropsCard extends HTMLAttributes<HTMLElement> {
  como?: EtiquetaCard;
  padding?: 'ninguno' | 'sm' | 'md' | 'lg';
  /** Radio: `md` 12px para cards, `lg` 16px para widgets grandes (DESIGN.md). */
  radio?: 'md' | 'lg';
  /** Eleva al pasar el mouse (nivel 2). Solo para cards clicables. */
  interactiva?: boolean;
  children?: ReactNode;
}

const paddings = {
  ninguno: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
} as const;

/** Nivel 1: blanco, borde 1px y sombra 0 4px 20px rgba(0,0,0,.05). */
export function Card({
  como = 'div',
  padding = 'md',
  radio = 'md',
  interactiva,
  className,
  children,
  ...props
}: PropsCard) {
  return createElement(
    como,
    {
      className: cn(
        'border border-border bg-surface-container-lowest shadow-card',
        radio === 'lg' ? 'rounded-lg' : 'rounded-md',
        paddings[padding],
        interactiva &&
          'transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover focus-within:shadow-card-hover',
        className,
      ),
      ...props,
    },
    children,
  );
}

/** Encabezado de sección dentro de una página: título + subtítulo + acción. */
export function EncabezadoSeccion({
  titulo,
  descripcion,
  accion,
  nivel = 2,
  id,
  className,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  accion?: ReactNode;
  nivel?: 2 | 3;
  id?: string;
  className?: string;
}) {
  const Titulo = nivel === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <Titulo id={id} className={cn('text-on-surface', nivel === 2 ? 'text-headline-md' : 'text-body-lg font-semibold')}>
          {titulo}
        </Titulo>
        {descripcion && <p className="mt-1 text-body-md text-on-surface-variant">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
