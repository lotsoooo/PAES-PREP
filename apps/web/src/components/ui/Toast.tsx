import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/app/providers/tema';

/**
 * Contenedor de notificaciones accesible. Radix Toast cumple el rol ARIA;
 * sonner aporta el montaje y las animaciones respetando prefers-reduced-motion.
 */
export function Toast() {
  const { tema } = useTheme();

  return (
    <SonnerToaster
      theme={tema === 'oscuro' ? 'dark' : 'light'}
      position="top-right"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'rounded-md border border-border bg-surface-container-lowest text-on-surface shadow-float',
          description: 'text-on-surface-variant',
        },
      }}
    />
  );
}
