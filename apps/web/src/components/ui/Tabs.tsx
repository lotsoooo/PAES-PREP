import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export interface ItemTab {
  valor: string;
  etiqueta: string;
  icono?: string;
  contador?: number;
}

export function Tabs({
  items,
  valor,
  onValorChange,
  className,
  etiquetaAria = 'Secciones',
}: {
  items: ItemTab[];
  valor: string;
  onValorChange: (valor: string) => void;
  className?: string;
  etiquetaAria?: string;
}) {
  return (
    <TabsPrimitive.Root value={valor} onValueChange={onValorChange} className={className}>
      <TabsPrimitive.List
        aria-label={etiquetaAria}
        className="flex gap-1 overflow-x-auto border-b border-border scrollbar-fino"
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.valor}
            value={item.valor}
            className={cn(
              'relative flex min-h-11 shrink-0 items-center gap-2 px-4',
              'text-label-md font-medium transition-colors',
              'text-on-surface-variant hover:text-on-surface',
              'data-[state=active]:text-primary',
              'after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full',
              'after:bg-transparent data-[state=active]:after:bg-primary',
            )}
          >
            {item.icono && (
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                {item.icono}
              </span>
            )}
            {item.etiqueta}
            {item.contador !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-caption tabular-nums',
                  'bg-surface-container-high text-on-surface-variant',
                )}
              >
                {item.contador}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
