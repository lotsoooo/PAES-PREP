import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useSesion } from '@/app/sesion';
import { NAV_MOVIL, NAV_PRINCIPAL, RUTAS_ESTUDIO } from '@/config/navegacion';
import { cn } from '@/lib/cn';
import { Logo, MarcaIcono } from '@/components/marca/Logo';
import { Icono } from '@/components/ui/Icono';
import { BotonEnlace, BotonIcono } from '@/components/ui/Button';
import { MenuNotificaciones, MenuUsuario } from '@/components/shell/Menus';
import { PaletaComandos } from '@/components/shell/PaletaComandos';
import { usePaleta } from '@/components/shell/paleta';
import { ModalUpgrade } from '@/components/premium/Premium';
import { CargandoPagina } from '@/app/layouts/CargandoPagina';

/**
 * Un solo AppShell (D-023): sidebar fijo + topbar en escritorio (≥1024 px);
 * topbar compacta + barra inferior en móvil y tablet.
 */
export function AppShell() {
  const usuario = useSesion((s) => s.usuario);
  const abrirPaleta = usePaleta((s) => s.setAbierta);
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-background">
      <a href="#contenido" className="saltar-contenido">
        Saltar al contenido
      </a>

      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant/70 bg-surface-container-low px-4 py-6 lg:flex">
        <Logo to="/app" conAdmision className="mb-8 px-3" />
        <nav aria-label="Principal" className="flex-1">
          <ul className="flex flex-col gap-1">
            {NAV_PRINCIPAL.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exacto}
                  className={({ isActive }) =>
                    cn(
                      'group flex min-h-11 items-center gap-3 rounded px-3 text-label-md transition-colors duration-150',
                      isActive
                        ? 'bg-primary-container font-semibold text-white'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icono nombre={item.icono} relleno={isActive} />
                      {item.etiqueta}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 flex flex-col gap-4">
          {usuario && !usuario.esPremium && (
            <BotonEnlace to="/app/premium" variante="premium" iconoIzquierdo="workspace_premium" anchoCompleto>
              Hazte Premium
            </BotonEnlace>
          )}
          <ul className="flex flex-col gap-1 border-t border-outline-variant/70 pt-4">
            <li>
              <NavLink
                to="/app/configuracion/cuenta"
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center gap-3 rounded px-3 text-label-md transition-colors',
                    isActive || pathname.startsWith('/app/configuracion')
                      ? 'bg-surface-container-high font-semibold text-on-surface'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                  )
                }
              >
                <Icono nombre="settings" />
                Configuración
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/app/ayuda"
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center gap-3 rounded px-3 text-label-md transition-colors',
                    isActive
                      ? 'bg-surface-container-high font-semibold text-on-surface'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                  )
                }
              >
                <Icono nombre="help" />
                Ayuda
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface/95 supports-[backdrop-filter]:bg-surface/90">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:px-8 lg:px-12">
            <NavLink to="/app" className="flex items-center gap-2 rounded lg:hidden" aria-label="PAES Pro, inicio">
              <MarcaIcono className="size-8" />
              <span className="text-body-lg font-bold text-primary" translate="no">
                PAES Pro
              </span>
            </NavLink>

            <button
              type="button"
              onClick={() => abrirPaleta(true)}
              className="ml-auto hidden h-11 w-full max-w-md items-center gap-3 rounded border border-border-strong bg-surface-container-lowest px-3 text-left text-body-md text-outline transition-[border-color,box-shadow] hover:border-outline md:flex lg:ml-0"
            >
              <Icono nombre="search" className="text-on-surface-variant" />
              <span className="flex-1">Buscar ensayos, contenidos, publicaciones…</span>
              <kbd className="rounded-sm border border-border px-1.5 text-caption text-on-surface-variant">Ctrl&nbsp;K</kbd>
            </button>

            <div className="ml-auto flex items-center gap-1 md:ml-4">
              {usuario && usuario.rachaActual > 0 && (
                <span
                  className="mr-1 inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-high px-2.5 py-1 text-label-md font-semibold text-on-surface lg:hidden"
                  title={`Racha de ${usuario.rachaActual} días`}
                >
                  <Icono nombre="local_fire_department" relleno className="text-base text-secondary-container" />
                  <span className="tabular-nums">{usuario.rachaActual}</span>
                  <span className="sr-only">días de racha</span>
                </span>
              )}
              <BotonIcono icono="search" etiqueta="Buscar" onClick={() => abrirPaleta(true)} className="md:hidden" />
              <MenuNotificaciones />
              <NavLink to="/app/configuracion/cuenta" className="hidden lg:block" aria-label="Configuración" title="Configuración">
                <span className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
                  <Icono nombre="settings" />
                </span>
              </NavLink>
              <span className="ml-1">
                <MenuUsuario />
              </span>
            </div>
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="flex-1 pb-24 outline-none lg:pb-12">
          <Suspense fallback={<CargandoPagina />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Barra inferior móvil y tablet */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] shadow-card-inset lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {NAV_MOVIL.map((item) => {
            const activoEstudio = item.to === '/app/plan' && RUTAS_ESTUDIO.some((r) => pathname.startsWith(r));
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.exacto}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-16 flex-col items-center justify-center gap-0.5 text-caption transition-colors',
                      isActive || activoEstudio ? 'font-semibold text-primary' : 'text-on-surface-variant',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                          (isActive || activoEstudio) && 'bg-primary-fixed',
                        )}
                      >
                        <Icono nombre={item.icono} relleno={isActive || activoEstudio} />
                      </span>
                      {item.etiqueta}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <PaletaComandos />
      <ModalUpgrade />
    </div>
  );
}
