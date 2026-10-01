import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type EtiquetaCard = 'div' | 'article' | 'section' | 'li';

export type NivelCard = 1 | 2;

export interface PropsCard {
  nivel?: NivelCard;
  como?: EtiquetaCard;
  padding?: 'ninguno' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const niveles: Record<NivelCard, string> = {
  1: 'border border-border bg-surface-container-lowest shadow-card',
  2: 'border border-border bg-surface-container-lowest shadow-card-hover',
};

const paddings = {
  ninguno: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
} as const;

/** Card nivel 1: blanco, borde 1px #E5E7EB, sombra 0 4px 20px rgba(0,0,0,.05). */
export function Card({
  nivel = 1,
  como = 'div',
  padding = 'md',
  className,
  children,
  ...props
}: PropsCard & HTMLAttributes<HTMLElement>) {
  return (
    <div
      className={cn(
        niveles[nivel],
        paddings[padding],
        'rounded-md transition-shadow duration-200',
        nivel === 1 && 'hover:shadow-card-hover',
        className,
      )}
      data-como={como}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-headline-md text-on-surface', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-md text-on-surface-variant', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-body-md text-on-surface', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center gap-3', className)} {...props} />;
}
