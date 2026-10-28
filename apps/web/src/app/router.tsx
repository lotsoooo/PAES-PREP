import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';
import { RequiereOnboarding, RequiereSesion, SesionOpcional, SoloInvitado } from '@/app/guards';
import { PaginaError } from '@/pages/sistema/PaginaError';

type Modulo = { default: React.ComponentType };

/** Carga diferida por pantalla: cada ruta es su propio chunk. */
const pagina = (cargar: () => Promise<Modulo>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await cargar()).default }),
});

export const router = createBrowserRouter([
  {
    errorElement: <PaginaError />,
    children: [
      {
        element: <SesionOpcional />,
        children: [
          { path: '/', ...pagina(() => import('@/pages/publico/Landing')) },
          { path: '/recuperar/:token', ...pagina(() => import('@/pages/auth/Restablecer')) },
        ],
      },
      {
        element: <SoloInvitado />,
        children: [
          { path: '/login', ...pagina(() => import('@/pages/auth/Login')) },
          { path: '/registro', ...pagina(() => import('@/pages/auth/Registro')) },
          { path: '/recuperar', ...pagina(() => import('@/pages/auth/Recuperar')) },
        ],
      },
      {
        element: <RequiereSesion />,
        children: [
          { path: '/onboarding', ...pagina(() => import('@/pages/onboarding/Meta')) },
          { path: '/onboarding/meta', ...pagina(() => import('@/pages/onboarding/Meta')) },
          { path: '/onboarding/plan', ...pagina(() => import('@/pages/onboarding/PlanListo')) },
          {
            element: <RequiereOnboarding />,
            children: [
              // Modo foco: sin sidebar ni barra inferior.
              { path: '/app/ensayos/:slug/rendir', ...pagina(() => import('@/pages/app/ensayos/Rendir')) },
              { path: '/app/repaso/sesion', ...pagina(() => import('@/pages/app/repaso/SesionRepaso')) },
              {
                path: '/app',
                element: <AppShell />,
                children: [
                  { index: true, ...pagina(() => import('@/pages/app/Dashboard')) },
                  { path: 'plan', ...pagina(() => import('@/pages/app/PlanEstudio')) },
                  { path: 'contenidos', ...pagina(() => import('@/pages/app/contenidos/Biblioteca')) },
                  { path: 'contenidos/:slug', ...pagina(() => import('@/pages/app/contenidos/Leccion')) },
                  { path: 'ensayos', ...pagina(() => import('@/pages/app/ensayos/Biblioteca')) },
                  { path: 'ensayos/intentos/:id', ...pagina(() => import('@/pages/app/ensayos/Resultados')) },
                  { path: 'ensayos/intentos/:id/pregunta/:n', ...pagina(() => import('@/pages/app/ensayos/Explicacion')) },
                  { path: 'ensayos/:slug', ...pagina(() => import('@/pages/app/ensayos/Detalle')) },
                  { path: 'repaso', ...pagina(() => import('@/pages/app/repaso/Cuaderno')) },
                  { path: 'estadisticas', ...pagina(() => import('@/pages/app/Estadisticas')) },
                  { path: 'comunidad', ...pagina(() => import('@/pages/app/comunidad/Feed')) },
                  { path: 'comunidad/nuevo', ...pagina(() => import('@/pages/app/comunidad/Crear')) },
                  { path: 'comunidad/buscar', ...pagina(() => import('@/pages/app/comunidad/Buscar')) },
                  { path: 'comunidad/:postId', ...pagina(() => import('@/pages/app/comunidad/Publicacion')) },
                  { path: 'tutores/:id', ...pagina(() => import('@/pages/app/comunidad/Tutor')) },
                  { path: 'perfil', ...pagina(() => import('@/pages/app/Perfil')) },
                  { path: 'notificaciones', ...pagina(() => import('@/pages/app/Notificaciones')) },
                  { path: 'configuracion', ...pagina(() => import('@/pages/app/Configuracion')) },
                  { path: 'configuracion/:seccion', ...pagina(() => import('@/pages/app/Configuracion')) },
                  { path: 'premium', ...pagina(() => import('@/pages/app/premium/Planes')) },
                  { path: 'premium/checkout', ...pagina(() => import('@/pages/app/premium/Checkout')) },
                  { path: 'premium/webpay', ...pagina(() => import('@/pages/app/premium/WebpaySandbox')) },
                  { path: 'premium/resultado', ...pagina(() => import('@/pages/app/premium/ResultadoPago')) },
                  { path: 'ayuda', ...pagina(() => import('@/pages/app/Ayuda')) },
                  { path: '*', ...pagina(() => import('@/pages/sistema/NoEncontrada')) },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', ...pagina(() => import('@/pages/sistema/NoEncontrada')) },
    ],
  },
]);
