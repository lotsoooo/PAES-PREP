import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { restaurarSesion, useSesion } from '@/app/sesion';
import { CargandoApp } from '@/app/layouts/CargandoPagina';

function useSesionLista() {
  const estado = useSesion((s) => s.estado);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/') return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [pathname]);
  useEffect(() => {
    void restaurarSesion();
  }, []);
  return estado;
}

/** Todo /app/* y /onboarding/* exige sesión; si no, va al login y vuelve después. */
export function RequiereSesion() {
  const estado = useSesionLista();
  const { pathname, search } = useLocation();
  if (estado === 'iniciando') return <CargandoApp />;
  if (estado === 'invitado') {
    return <Navigate to={`/login?volver=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return <Outlet />;
}

/** Si el onboarding no está completo, se termina antes de entrar a la app. */
export function RequiereOnboarding() {
  const usuario = useSesion((s) => s.usuario);
  if (usuario && !usuario.onboardingCompletado) return <Navigate to="/onboarding/meta" replace />;
  return <Outlet />;
}

/** Login y registro: si ya hay sesión, directo a la app. */
export function SoloInvitado() {
  const estado = useSesionLista();
  const usuario = useSesion((s) => s.usuario);
  const { search } = useLocation();
  if (estado === 'iniciando') return <CargandoApp />;
  if (estado === 'autenticado' && usuario) {
    const volver = new URLSearchParams(search).get('volver');
    const destino = !usuario.onboardingCompletado ? '/onboarding/meta' : volver?.startsWith('/app') ? volver : '/app';
    return <Navigate to={destino} replace />;
  }
  return <Outlet />;
}

/** Rutas públicas que se ven igual con o sin sesión (landing): restaura en segundo plano. */
export function SesionOpcional() {
  useSesionLista();
  return <Outlet />;
}
