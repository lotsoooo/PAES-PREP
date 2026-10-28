import { toast } from 'sonner';
import type { Tema } from '@paes-pro/shared';
import { useTheme } from '@/app/providers/tema';
import { useActualizarPreferencias } from '@/lib/data/cuenta';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';
import { PanelSeccion } from './Comun';

const OPCIONES: { valor: Tema; etiqueta: string; descripcion: string; icono: string }[] = [
  { valor: 'claro', etiqueta: 'Claro', descripcion: 'Fondo claro, ideal de día.', icono: 'light_mode' },
  { valor: 'oscuro', etiqueta: 'Oscuro', descripcion: 'Descansa la vista de noche.', icono: 'dark_mode' },
  { valor: 'sistema', etiqueta: 'Sistema', descripcion: 'Sigue el ajuste de tu dispositivo.', icono: 'contrast' },
];

/** Miniatura del tema: la app en pequeño, con los colores reales del tema. */
function Muestra({ oscuro }: { oscuro: boolean }) {
  return (
    // `.dark` / `.light` en la miniatura reasignan las variables de la paleta solo dentro de ella.
    <span aria-hidden="true" className={cn('block overflow-hidden rounded border border-border', oscuro ? 'dark' : 'light')}>
      <span className="flex h-20 bg-background">
        <span className="w-1/4 bg-surface-container-low" />
        <span className="flex flex-1 flex-col gap-1.5 p-2">
          <span className="h-2 w-2/3 rounded-full bg-on-surface/70" />
          <span className="h-6 rounded-sm border border-border bg-surface-container-lowest" />
          <span className="h-2 w-1/3 rounded-full bg-primary" />
        </span>
      </span>
    </span>
  );
}

export function SeccionApariencia() {
  const { preferencia, setPreferencia, tema } = useTheme();
  const guardar = useActualizarPreferencias();

  const elegir = (t: Tema) => {
    setPreferencia(t); // inmediato y persistido en este navegador
    guardar.mutate(
      { tema: t },
      {
        onSuccess: () => toast.success(`Tema ${OPCIONES.find((o) => o.valor === t)?.etiqueta.toLowerCase()} activado.`),
        onError: () => toast.error('Cambiamos el tema aquí, pero no pudimos guardarlo en tu cuenta.'),
      },
    );
  };

  return (
    <PanelSeccion titulo="Apariencia" descripcion="Elige cómo se ve PAES Pro. El cambio se aplica al instante.">
      <fieldset>
        <legend className="sr-only">Tema</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {OPCIONES.map((o) => {
            const activo = preferencia === o.valor;
            const oscuro = o.valor === 'oscuro' || (o.valor === 'sistema' && tema === 'oscuro');
            return (
              <label
                key={o.valor}
                className={cn(
                  'flex cursor-pointer flex-col gap-3 rounded-md border p-3 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                  activo ? 'border-primary shadow-card ring-1 ring-primary' : 'border-border hover:border-outline-variant',
                )}
              >
                <input type="radio" name="tema" value={o.valor} checked={activo} onChange={() => elegir(o.valor)} className="sr-only" />
                <Muestra oscuro={oscuro} />
                <span className="flex items-start gap-2 px-1 pb-1">
                  <Icono nombre={o.icono} className={cn('text-xl', activo ? 'text-primary' : 'text-on-surface-variant')} />
                  <span className="flex-1">
                    <span className="block text-body-md font-semibold text-on-surface">{o.etiqueta}</span>
                    <span className="block text-caption text-on-surface-variant">{o.descripcion}</span>
                  </span>
                  {activo && <Icono nombre="check_circle" relleno className="text-xl text-primary" etiqueta="Seleccionado" />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </PanelSeccion>
  );
}
