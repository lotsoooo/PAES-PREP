import type { ReactNode } from 'react';
import { formatearCLP, PRECIO_PREMIUM_CLP } from '@paes-pro/shared';
import { Modal } from '@/components/ui/Modal';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';
import { useModalUpgrade, usePlan } from './plan';


const BENEFICIOS = [
  { icono: 'all_inclusive', texto: 'Ensayos ilimitados de todas las pruebas' },
  { icono: 'smart_display', texto: 'Explicaciones en video paso a paso' },
  { icono: 'insights', texto: 'Analítica avanzada: mapa de actividad y errores por eje' },
  { icono: 'smart_toy', texto: 'Tutor IA PAES-Bot en lecciones y explicaciones' },
];

export function ModalUpgrade() {
  const { abierto, motivo, cerrar } = useModalUpgrade();
  return (
    <Modal
      abierto={abierto}
      onAbiertoChange={(v) => !v && cerrar()}
      titulo="Desbloquea todo con Premium"
      descripcion={motivo ?? 'Prepárate sin límites y con ayuda personalizada.'}
      icono={
        <span className="flex size-14 items-center justify-center rounded-md bg-tertiary-fixed text-tertiary">
          <Icono nombre="workspace_premium" relleno className="text-3xl" />
        </span>
      }
      pie={
        <>
          <Button variante="fantasma" onClick={cerrar}>
            Ahora no
          </Button>
          <BotonEnlace to="/app/premium" variante="premium" onClick={cerrar} iconoDerecho="arrow_forward">
            Ver planes
          </BotonEnlace>
        </>
      }
    >
      <ul className="space-y-3">
        {BENEFICIOS.map((b) => (
          <li key={b.texto} className="flex items-start gap-3 text-body-md text-on-surface">
            <Icono nombre={b.icono} className="text-tertiary" />
            {b.texto}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-caption text-on-surface-variant">
        Desde {formatearCLP(PRECIO_PREMIUM_CLP)} al mes. Prueba 7 días gratis y cancela cuando quieras.
      </p>
    </Modal>
  );
}

/**
 * Envuelve contenido Premium: si el usuario no lo es, lo muestra atenuado con
 * un candado dorado que abre el modal de upgrade.
 */
export function PremiumLock({
  children,
  motivo,
  titulo = 'Función Premium',
  descripcion,
  className,
}: {
  children: ReactNode;
  motivo: string;
  titulo?: string;
  descripcion?: string;
  className?: string;
}) {
  const { esPremium, pedirUpgrade } = usePlan();
  if (esPremium) return <>{children}</>;
  return (
    <div className={cn('relative overflow-hidden rounded-md', className)}>
      <div aria-hidden="true" inert className="pointer-events-none select-none opacity-40 blur-[3px] saturate-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-w-sm flex-col items-center rounded-md border border-tertiary-container/60 bg-surface-container-lowest p-6 text-center shadow-float">
          <span className="flex size-12 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
            <Icono nombre="lock" relleno />
          </span>
          <p className="mt-3 text-body-md font-semibold text-on-surface">{titulo}</p>
          {descripcion && <p className="mt-1 text-caption text-on-surface-variant">{descripcion}</p>}
          <Button variante="premium" tamano="sm" className="mt-4" onClick={() => pedirUpgrade(motivo)} iconoIzquierdo="workspace_premium">
            Desbloquear
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Insignia dorada "Premium". */
export function InsigniaPremium({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-0.5 text-caption font-semibold text-on-tertiary-fixed-variant',
        className,
      )}
    >
      <Icono nombre="workspace_premium" relleno className="text-sm" />
      Premium
    </span>
  );
}
