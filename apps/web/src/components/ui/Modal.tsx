import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PropsModal {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg';
}

const anchos = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

export function Modal({
  abierto,
  onAbiertoChange,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
}: PropsModal) {
  return (
    <Dialog.Root open={abierto} onOpenChange={onAbiertoChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[calc(100dvh-2rem)] overflow-y-auto scrollbar-fino',
            'rounded-lg border border-border bg-surface-container-lowest p-6 shadow-float',
            anchos[ancho],
          )}
        >
          <Dialog.Title className="text-headline-md text-on-surface pr-8">
            {titulo}
          </Dialog.Title>
          {descripcion && (
            <Dialog.Description className="mt-1 text-body-md text-on-surface-variant">
              {descripcion}
            </Dialog.Description>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                close
              </span>
            </button>
          </Dialog.Close>

          <div className="mt-5">{children}</div>

          {pie && <div className="mt-6 flex flex-wrap justify-end gap-3">{pie}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface PropsConfirmacion {
  abierto: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  peligro?: boolean;
  cargando?: boolean;
}

/** Modal de confirmación con acción destructiva opcional. */
export function ModalConfirmacion({
  abierto,
  onConfirmar,
  onCancelar,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  peligro,
  cargando,
}: PropsConfirmacion) {
  return (
    <Modal
      abierto={abierto}
      onAbiertoChange={(v) => {
        if (!v) onCancelar();
      }}
      titulo={titulo}
      ancho="sm"
      pie={
        <>
          <button
            type="button"
            onClick={onCancelar}
            className="min-h-11 rounded px-5 text-body-md font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            aria-busy={cargando || undefined}
            className={cn(
              'min-h-11 rounded px-5 text-body-md font-medium text-white transition-all',
              'disabled:pointer-events-none disabled:opacity-50',
              peligro ? 'bg-error hover:brightness-110' : 'bg-primary hover:brightness-110',
            )}
          >
            {textoConfirmar}
          </button>
        </>
      }
    >
      <p className="text-body-md text-on-surface-variant">{descripcion}</p>
    </Modal>
  );
}
