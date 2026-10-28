import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { recargarUsuario } from '@/app/sesion';
import { useConfirmarWebpay, useResultadoPago } from '@/lib/data/premium';
import { useTitulo } from '@/hooks/utiles';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { BotonEnlace } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Cargando, EstadoError, Skeleton } from '@/components/ui/Skeleton';

interface EstadoNavegacion {
  mensaje?: string;
  pagoId?: string;
}

const DESBLOQUEADO = [
  { icono: 'all_inclusive', texto: 'Ensayos ilimitados de todas las pruebas' },
  { icono: 'smart_toy', texto: 'PAES-Bot en lecciones, explicaciones y estadísticas' },
  { icono: 'insights', texto: 'Mapa de actividad y errores por eje' },
  { icono: 'smart_display', texto: 'Explicaciones en video paso a paso' },
];

/**
 * Resultado del pago. Llega por dos caminos:
 * - Webpay real: Transbank vuelve al API (`/premium/webpay/retorno`), que confirma
 *   en el servidor y redirige aquí con `?estado=aprobado|rechazado&pago=`;
 * - Webpay simulado (desarrollo): igual, con el mensaje en el state.
 * `?token_ws=` / `?TBK_TOKEN=` se siguen aceptando por si el retorno apunta a la app.
 */
export default function ResultadoPago() {
  const [params] = useSearchParams();
  const { state } = useLocation() as { state: EstadoNavegacion | null };
  const tokenWs = params.get('token_ws');
  const confirmar = useConfirmarWebpay();
  const pedido = useRef(false);
  const pagoId = params.get('pago') ?? confirmar.data?.pagoId ?? state?.pagoId ?? null;
  const resultado = useResultadoPago(pagoId);

  useEffect(() => {
    if (tokenWs && !pedido.current) {
      pedido.current = true;
      confirmar.mutate({ token: tokenWs });
    }
  }, [tokenWs, confirmar]);

  const estado = resultado.data?.estado;
  const simulado = resultado.data?.modoPago === 'simulado' || resultado.data?.modoPago === 'integracion';
  const mensaje = simulado ? 'Transacción de prueba: no hubo un cobro real. El beneficio Premium corresponde a este entorno de pruebas.' : undefined;

  useEffect(() => {
    if (estado === 'aprobado') void recargarUsuario().catch(() => undefined);
  }, [estado]);

  useTitulo(estado === 'aprobado' ? 'Pago aprobado' : estado === 'rechazado' ? 'Pago rechazado' : 'Confirmando pago');

  if ((tokenWs && !confirmar.isError && !confirmar.data) || (pagoId && resultado.isPending)) {
    return (
      <Pagina ancho="lectura">
        <Cargando etiqueta="Confirmando tu pago con Webpay…">
          <Card padding="lg" className="mx-auto max-w-xl text-center">
            <Skeleton className="mx-auto size-16 rounded-full" />
            <Skeleton className="mx-auto mt-5 h-8 w-64" />
            <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />
          </Card>
        </Cargando>
      </Pagina>
    );
  }

  if (resultado.isError || confirmar.isError) return <Pagina ancho="lectura"><EstadoError titulo="No pudimos verificar el pago" descripcion="No repitas la compra hasta comprobar su estado." onReintentar={() => { if (tokenWs) confirmar.mutate({ token: tokenWs }); else void resultado.refetch(); }} /></Pagina>;

  if (estado === 'pendiente') return <Pagina ancho="lectura"><Card padding="lg"><h1 className="text-headline-md text-on-surface">Pago pendiente de confirmación</h1><p className="mt-3 text-body-md text-on-surface-variant">Todavía no hay una confirmación del servidor. Consulta el historial antes de iniciar otra compra.</p><BotonEnlace className="mt-6" to="/app/configuracion/suscripcion">Ver historial</BotonEnlace></Card></Pagina>;

  if (estado === 'aprobado') {
    return (
      <Pagina ancho="lectura">
        <Card padding="lg" radio="lg" className="mx-auto max-w-xl text-center" como="section" aria-labelledby="titulo-resultado">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-container text-success">
            <Icono nombre="check_circle" relleno className="text-4xl" />
          </span>
          <h1 id="titulo-resultado" className="mt-5 text-headline-lg-mobile text-on-surface md:text-headline-lg" role="status">
            {simulado ? 'Premium de prueba activado' : 'Pago confirmado'}
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">{mensaje ?? 'Tu pago fue aprobado y tu plan ya está activo.'}</p>
          <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left">
            {DESBLOQUEADO.map((d) => (
              <li key={d.texto} className="flex items-start gap-3 text-body-md text-on-surface">
                <Icono nombre={d.icono} className="text-tertiary" />
                {d.texto}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <BotonEnlace to="/app" iconoDerecho="arrow_forward">
              Ir a mi inicio
            </BotonEnlace>
            <BotonEnlace to="/app/ensayos" variante="secundario">
              Ver todos los ensayos
            </BotonEnlace>
          </div>
          <p className="mt-6 text-caption text-on-surface-variant">El comprobante quedó en Configuración → Suscripción.</p>
        </Card>
      </Pagina>
    );
  }

  if (estado === 'rechazado' || estado === 'reembolsado') {
    return (
      <Pagina ancho="lectura">
        <Card padding="lg" radio="lg" className="mx-auto max-w-xl text-center" como="section" aria-labelledby="titulo-resultado">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-error-container text-error">
            <Icono nombre="credit_card_off" className="text-4xl" />
          </span>
          <h1 id="titulo-resultado" className="mt-5 text-headline-lg-mobile text-on-surface md:text-headline-lg" role="alert">
            No pudimos procesar el pago
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">{simulado ? 'La simulación fue rechazada. No hubo un cobro real.' : 'La transacción no tiene una aprobación vigente. Revisa su estado en el historial.'}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <BotonEnlace to="/app/premium/checkout" iconoIzquierdo="refresh">
              Intentar de nuevo
            </BotonEnlace>
            <BotonEnlace to="/app/premium" variante="secundario">
              Volver a planes
            </BotonEnlace>
          </div>
          <p className="mt-6 text-caption text-on-surface-variant">Si el problema sigue, prueba con otra tarjeta o paga con Webpay Plus.</p>
        </Card>
      </Pagina>
    );
  }

  return (
    <Pagina ancho="lectura">
      <Card padding="lg" className="mx-auto max-w-xl text-center">
        <Icono nombre="receipt_long" className="text-4xl text-outline" />
        <h1 className="mt-4 text-headline-md text-on-surface">No hay un pago en curso</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Revisa tu historial de pagos o elige un plan para empezar.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <BotonEnlace to="/app/premium">Ver planes</BotonEnlace>
          <BotonEnlace to="/app/configuracion/suscripcion" variante="secundario">
            Historial de pagos
          </BotonEnlace>
        </div>
      </Card>
    </Pagina>
  );
}
