import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Icono } from './Icono';

export interface PropsModal {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children?: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg' | 'xl';
  /** Ícono destacado sobre el título (ej. Premium). */
  icono?: ReactNode;
  className?: string;
}

const anchos = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

/** Modal accesible (Radix): foco atrapado, Esc para cerrar, sombra marcada y backdrop. */
export function Modal({ abierto, onAbiertoChange, titulo, descripcion, children, pie, ancho = 'md', icono, className }: PropsModal) {
  return (
    <Dialog.Root open={abierto} onOpenChange={onAbiertoChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animar-aparecer fixed inset-0 z-50 bg-inverse-surface/55" />
        <Dialog.Content
          className={cn(
            'animar-entrada fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain scrollbar-fino',
            'rounded-lg border border-border bg-surface-container-lowest p-6 shadow-float md:p-8',
            anchos[ancho],
            className,
          )}
        >
          {icono && <div className="mb-4">{icono}</div>}
          <Dialog.Title className="pr-10 text-headline-md text-on-surface">{titulo}</Dialog.Title>
          {descripcion ? (
            <Dialog.Description className="mt-2 text-body-md text-on-surface-variant">{descripcion}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">Diálogo</Dialog.Description>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Icono nombre="close" />
            </button>
          </Dialog.Close>

          {children && <div className="mt-6">{children}</div>}
          {pie && <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{pie}</div>}
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
  descripcion: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
  cargando?: boolean;
}

/** Confirmación previa a acciones destructivas o irreversibles. */
export function ModalConfirmacion({
  abierto,
  onConfirmar,
  onCancelar,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
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
      descripcion={descripcion}
      ancho="sm"
      pie={
        <>
          <Button variante="fantasma" onClick={onCancelar}>
            {textoCancelar}
          </Button>
          <Button variante={peligro ? 'peligro' : 'primario'} onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    />
  );
}

/** Panel lateral (o inferior en móvil) para filtros, tutor IA y menús. */
export function Drawer({
  abierto,
  onAbiertoChange,
  titulo,
  descripcion,
  children,
  pie,
  lado = 'derecha',
  className,
}: {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  lado?: 'derecha' | 'izquierda';
  className?: string;
}) {
  return (
    <Dialog.Root open={abierto} onOpenChange={onAbiertoChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animar-aparecer fixed inset-0 z-50 bg-inverse-surface/45" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-surface-container-lowest shadow-float',
            lado === 'derecha' ? 'animar-lado-derecha' : 'animar-lado-izquierda',
            lado === 'derecha' ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-body-lg font-semibold text-on-surface">{titulo}</Dialog.Title>
              {descripcion ? (
                <Dialog.Description className="mt-0.5 text-caption text-on-surface-variant">{descripcion}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Panel</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar panel"
                className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <Icono nombre="close" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 scrollbar-fino">{children}</div>
          {pie && <div className="border-t border-border px-6 py-4">{pie}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
