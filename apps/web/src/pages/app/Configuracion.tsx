import { Navigate, NavLink, useParams } from 'react-router';
import { useTitulo } from '@/hooks/utiles';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';
import { SeccionCuenta } from '@/components/configuracion/SeccionCuenta';
import { SeccionNotificaciones } from '@/components/configuracion/SeccionNotificaciones';
import { SeccionApariencia } from '@/components/configuracion/SeccionApariencia';
import { SeccionSuscripcion } from '@/components/configuracion/SeccionSuscripcion';
import { SeccionSeguridad } from '@/components/configuracion/SeccionSeguridad';

const SECCIONES = [
  { id: 'cuenta', etiqueta: 'Cuenta', icono: 'person', Componente: SeccionCuenta },
  { id: 'notificaciones', etiqueta: 'Notificaciones', icono: 'notifications', Componente: SeccionNotificaciones },
  { id: 'apariencia', etiqueta: 'Apariencia', icono: 'palette', Componente: SeccionApariencia },
  { id: 'suscripcion', etiqueta: 'Suscripción', icono: 'card_membership', Componente: SeccionSuscripcion },
  { id: 'seguridad', etiqueta: 'Seguridad', icono: 'shield', Componente: SeccionSeguridad },
] as const;

export default function Configuracion() {
  const { seccion } = useParams();
  const actual = SECCIONES.find((s) => s.id === seccion);
  useTitulo(actual ? `Configuración · ${actual.etiqueta}` : 'Configuración');
  if (!actual) return <Navigate to="/app/configuracion/cuenta" replace />;
  const { Componente } = actual;

  return (
    <Pagina>
      <EncabezadoPagina titulo="Configuración" />
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Secciones de configuración" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1">
            {SECCIONES.map((s) => (
              <li key={s.id} className="shrink-0">
                <NavLink
                  to={`/app/configuracion/${s.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded px-4 text-body-md whitespace-nowrap transition-colors duration-150',
                      isActive
                        ? 'bg-primary-container font-semibold text-white'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icono nombre={s.icono} relleno={isActive} />
                      {s.etiqueta}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div key={actual.id} className="animar-entrada min-w-0">
          <Componente />
        </div>
      </div>
    </Pagina>
  );
}
