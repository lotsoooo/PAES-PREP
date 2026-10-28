import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { formatearCLP, formatearFecha } from '@paes-pro/shared';
import { usePlanesSuscripcion } from '@/lib/data/catalogos';
import { useEstadoSuscripcion } from '@/lib/data/cuenta';
import { useCheckout } from '@/lib/data/premium';
import { useTitulo } from '@/hooks/utiles';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { SegmentedControl, Breadcrumbs } from '@/components/ui/Navegacion';
import { EstadoError, Skeleton } from '@/components/ui/Skeleton';
import { codigoDePeriodo, preciosPremium, type Periodo } from '@/components/premium-pago/precios';
const BENEFICIOS = [
  'Ensayos ilimitados con retroalimentación al instante',
  'Analítica avanzada de tu rendimiento por eje',
  'Explicaciones en video y tutor IA PAES-Bot',
];

export default function Checkout() {
  useTitulo('Pagar Premium');
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const periodo: Periodo = params.get('plan') === 'anual' ? 'anual' : 'mensual';
  const planes = usePlanesSuscripcion();
  const estado = useEstadoSuscripcion();
  const checkout = useCheckout();
  const precios = preciosPremium(planes.data);
  const total = periodo === 'anual' ? precios.anual : precios.mensual;
  const sandbox = estado.data?.modoPago === 'simulado';
  const disponibles = estado.data?.pagosDisponibles ?? false;
  const planExiste = planes.data?.some((p) => p.codigo === codigoDePeriodo(periodo)) ?? false;

  const irResultado = (r: { estado: string; mensaje: string; pagoId: string }) =>
    navegar(`/app/premium/resultado?pago=${encodeURIComponent(r.pagoId)}`, { replace: true });

  const pagar = () =>
    checkout.mutate(
      { plan: codigoDePeriodo(periodo), metodo: 'webpay' },
      {
        onSuccess: (r) => {
          if (r.estado !== 'redireccion' || !r.redirectUrl) return irResultado(r);
          // Webpay real: POST con token_ws al formulario hospedado por Transbank.
          if (r.tokenRedireccion) return enviarAWebpay(r.redirectUrl, r.tokenRedireccion);
          // Sandbox: página simulada de la propia app.
          const url = new URL(r.redirectUrl, window.location.origin);
          if (url.origin === window.location.origin) navegar(url.pathname + url.search);
          else toast.error('No pudimos verificar el destino de la pasarela. Intenta de nuevo.');
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Pagina>
      <Breadcrumbs items={[{ etiqueta: 'Planes Premium', to: '/app/premium' }, { etiqueta: 'Pago' }]} className="mb-4" />
      <EncabezadoPagina titulo="Mejora tu preparación" descripcion="Estás a un paso de acceder a todas las herramientas Premium." />
      {(planes.isError || estado.isError) && <EstadoError titulo="No pudimos cargar las opciones de pago" onReintentar={() => { void planes.refetch(); void estado.refetch(); }} className="mb-6" />}

      {estado.data?.esPremium && (
        <p className="mb-6 flex items-start gap-2 rounded-md border border-tertiary-container/60 bg-tertiary-fixed/50 px-4 py-3 text-body-md text-on-tertiary-fixed-variant">
          <Icono nombre="info" className="mt-0.5" />
          <span>
            Ya tienes Premium{estado.data.suscripcion?.terminaEn ? ` hasta el ${formatearFecha(estado.data.suscripcion.terminaEn)}` : ''}. Si pagas ahora, sumamos el nuevo periodo al que te queda.
          </span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <Card como="section" aria-labelledby="titulo-metodo" padding="lg" className="lg:col-span-7">
          <h2 id="titulo-metodo" className="flex items-center gap-3 text-headline-md text-on-surface">
            <Icono nombre="credit_card" className="text-primary" />
            Método de pago
          </h2>

          <div className="mt-5 flex items-center gap-4 rounded-md border-2 border-primary bg-primary-fixed/40 px-4 py-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded bg-surface-container-lowest text-primary">
              <Icono nombre="account_balance" className="text-3xl" />
            </span>
            <div>
              <p className="text-body-md font-semibold text-on-surface">Webpay Plus</p>
              <p className="text-caption text-on-surface-variant">Débito, crédito o prepago · Transbank</p>
            </div>
          </div>

          <div className="mt-6 rounded-md bg-surface-container-low p-5">
            <p className="text-body-md text-on-surface">
              Te llevaremos a <strong className="font-semibold">Webpay Plus</strong> de Transbank para pagar. Los datos de tu tarjeta se ingresan
              solo en la página de Transbank: PAES Pro nunca los ve ni los guarda. Al terminar vuelves aquí automáticamente.
            </p>
            {sandbox && (
              <p className="mt-3 flex items-start gap-2 text-caption text-on-surface-variant">
                <Icono nombre="science" className="text-base" />
                Entorno de desarrollo: verás una página de Webpay simulada donde eliges aprobar o anular. No se cobra dinero y el Premium
                que se active existe solo en este entorno.
              </p>
            )}
          </div>
          {!disponibles && (
            <p role="status" className="mt-4 flex items-start gap-2 rounded-md border border-border bg-surface-container px-4 py-3 text-body-md text-on-surface">
              <Icono nombre="info" className="mt-0.5 text-on-surface-variant" />
              <span>
                Los pagos todavía no están habilitados. Puedes revisar las opciones disponibles en{' '}
                <Link to="/app/premium" className="font-semibold text-primary underline underline-offset-2">
                  Planes Premium
                </Link>
                .
              </span>
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card como="section" aria-labelledby="titulo-resumen" padding="lg">
            <h2 id="titulo-resumen" className="text-headline-md text-on-surface">
              Resumen del pedido
            </h2>
            <SegmentedControl
              className="mt-4 w-full"
              etiquetaAria="Periodo"
              tamano="sm"
              valor={periodo}
              onCambio={(p) => setParams({ plan: codigoDePeriodo(p) }, { replace: true })}
              opciones={[
                { valor: 'mensual', etiqueta: 'Mensual' },
                { valor: 'anual', etiqueta: `Anual${precios.porcentajeAhorro ? ` (−${precios.porcentajeAhorro} %)` : ''}` },
              ]}
            />
            {planes.isPending ? (
              <Skeleton className="mt-5 h-32" />
            ) : (
              <dl className="mt-5 text-body-md">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <dt>
                    <span className="block font-semibold text-on-surface">Plan Premium</span>
                    <span className="text-caption text-on-surface-variant">{periodo === 'anual' ? 'Suscripción anual · 12 meses' : 'Suscripción mensual'}</span>
                  </dt>
                  <dd className="font-semibold text-on-surface tabular-nums">{formatearCLP(total)}</dd>
                </div>
                <div className="flex justify-between gap-4 pt-4 text-on-surface-variant">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatearCLP(total)}</dd>
                </div>
                <div className="mt-2 flex justify-between gap-4 text-on-surface-variant">
                  <dt>IVA</dt>
                  <dd>Incluido</dd>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4">
                  <dt className="text-body-lg font-semibold text-on-surface">Total</dt>
                  <dd className="text-headline-md font-bold text-primary tabular-nums">{formatearCLP(total)}</dd>
                </div>
              </dl>
            )}
            <Button
              tamano="lg"
              anchoCompleto
              className="mt-6"
              iconoIzquierdo="lock"
              onClick={pagar}
              cargando={checkout.isPending}
              textoCargando="Conectando con Webpay…"
              disabled={planes.isPending || estado.isPending || !disponibles || !planExiste}
            >
              {sandbox ? 'Continuar con la simulación' : 'Ir a Webpay'}
            </Button>
            <p className="mt-3 text-center text-caption text-on-surface-variant">
              Al confirmar aceptas los términos del servicio. Puedes cancelar cuando quieras desde{' '}
              <Link to="/app/configuracion/suscripcion" className="underline hover:text-primary">
                Configuración
              </Link>
              .
            </p>
          </Card>

          <section aria-labelledby="titulo-beneficios" className="rounded-md border border-tertiary-container/50 bg-tertiary-fixed/40 p-6">
            <h2 id="titulo-beneficios" className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
              <Icono nombre="workspace_premium" relleno className="text-tertiary" />
              Beneficios Premium incluidos
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {BENEFICIOS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-body-md text-on-surface">
                  <Icono nombre="check_circle" className="text-tertiary" />
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-on-surface-variant" aria-label="Seguridad del pago">
            <li className="inline-flex items-center gap-1.5">
              <Icono nombre="lock" className="text-base" />
              Pago en la pasarela
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Icono nombre="verified_user" className="text-base" />
              Tu tarjeta solo la ve Transbank
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Icono nombre="shield" className="text-base" />
              Sin datos de tarjeta en PAES Pro
            </li>
          </ul>
        </div>
      </div>
    </Pagina>
  );
}

/** Webpay Plus espera un POST de formulario con `token_ws` (no un GET). */
function enviarAWebpay(url: string, token: string) {
  const destino = new URL(url);
  if (!['https://webpay3gint.transbank.cl', 'https://webpay3g.transbank.cl'].includes(destino.origin)) {
    toast.error('La dirección de pago no corresponde a Transbank.');
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  const campo = document.createElement('input');
  campo.type = 'hidden';
  campo.name = 'token_ws';
  campo.value = token;
  form.appendChild(campo);
  document.body.appendChild(form);
  form.submit();
}
