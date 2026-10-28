import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useConfirmarWebpay } from '@/lib/data/premium';
import { useTitulo } from '@/hooks/utiles';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { EstadoVacio } from '@/components/ui/Skeleton';

/**
 * Pasarela simulada para el entorno de pruebas (PAYMENT_PROVIDER=mock o
 * webpay sin credenciales). Con credenciales de Transbank el usuario va a la
 * página real de Webpay y vuelve a /app/premium/resultado con `token_ws`.
 */
export default function WebpaySandbox() {
  useTitulo('Webpay Plus (simulación)');
  const [params] = useSearchParams();
  const token = params.get('token');
  const navegar = useNavigate();
  const confirmar = useConfirmarWebpay();

  const decidir = (aprobar: boolean) => {
    if (!token) return;
    confirmar.mutate(
      { token, aprobar },
      {
        onSuccess: (r) =>
          navegar(`/app/premium/resultado?pago=${encodeURIComponent(r.pagoId)}`, { replace: true }),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!token) {
    return (
      <Pagina ancho="lectura">
        <EstadoVacio
          icono="link_off"
          titulo="Este enlace de pago no es válido"
          descripcion="Vuelve a iniciar el pago desde la página de planes."
          accion={<BotonEnlace to="/app/premium">Ver planes</BotonEnlace>}
        />
      </Pagina>
    );
  }

  return (
    <Pagina ancho="lectura">
      <div className="mx-auto max-w-md">
        <p className="mb-4 flex items-start gap-2 rounded-md bg-surface-container-high px-4 py-3 text-caption text-on-surface-variant">
          <Icono nombre="science" className="text-base" />
          Simulación de la pasarela para el entorno de pruebas. No se usa ninguna tarjeta ni se cobra dinero.
        </p>
        <Card padding="lg" radio="lg" como="section" aria-labelledby="titulo-webpay">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-md bg-primary-fixed text-primary">
              <Icono nombre="account_balance" className="text-2xl" />
            </span>
            <div>
              <h1 id="titulo-webpay" className="text-headline-md text-on-surface">
                Webpay Plus
              </h1>
              <p className="text-caption text-on-surface-variant">Pago a PAES Pro</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 text-body-md">
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Comercio</dt>
              <dd className="font-medium text-on-surface">PAES Pro</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Orden</dt>
              <dd className="truncate font-mono text-caption text-on-surface">{token.replace(/^mockwp_/, '')}</dd>
            </div>
          </dl>
          <p className="mt-6 text-body-md text-on-surface">Elige cómo termina la transacción para probar ambos caminos:</p>
          <div className="mt-4 flex flex-col gap-3">
            <Button tamano="lg" anchoCompleto iconoIzquierdo="check_circle" onClick={() => decidir(true)} cargando={confirmar.isPending && confirmar.variables?.aprobar === true}>
              Aprobar pago
            </Button>
            <Button
              variante="secundario"
              anchoCompleto
              iconoIzquierdo="cancel"
              onClick={() => decidir(false)}
              disabled={confirmar.isPending}
              cargando={confirmar.isPending && confirmar.variables?.aprobar === false}
            >
              Anular compra
            </Button>
          </div>
        </Card>
      </div>
    </Pagina>
  );
}
