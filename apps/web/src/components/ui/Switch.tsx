import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

export interface PropsSwitch {
  id: string;
  marcado: boolean;
  onCambio: (marcado: boolean) => void;
  etiqueta: string;
  descripcion?: string;
  disabled?: boolean;
  cargando?: boolean;
}

export function Switch({
  id,
  marcado,
  onCambio,
  etiqueta,
  descripcion,
  disabled,
  cargando,
}: PropsSwitch) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-body-md text-on-surface font-medium">
          {etiqueta}
        </label>
        {descripcion && (
          <p className="text-caption text-on-surface-variant">{descripcion}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {cargando && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined animate-spin text-lg text-on-surface-variant"
          >
            progress_activity
          </span>
        )}
        <SwitchPrimitive.Root
          id={id}
          checked={marcado}
          onCheckedChange={onCambio}
          disabled={disabled || cargando}
          aria-label={etiqueta}
          className={cn(
            'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            marcado ? 'bg-primary' : 'bg-surface-container-highest',
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'block h-5 w-5 rounded-full bg-white shadow-card transition-transform',
              'data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5',
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    </div>
  );
}
