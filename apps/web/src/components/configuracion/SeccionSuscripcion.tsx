import { useState } from 'react';
import { toast } from 'sonner';
import type { DTOPago } from '@paes-pro/shared';
import { formatearCLP, formatearFecha } from '@paes-pro/shared';
import { recargarUsuario } from '@/app/sesion';
import { ApiError } from '@/lib/api';
import { useCancelarSuscripcion, useEstadoSuscripcion, usePagos } from '@/lib/data/cuenta';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { ModalConfirmacion } from '@/components/ui/Modal';
import { EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { InsigniaPremium } from '@/components/premium/Premium';
import { CargandoPanel, PanelSeccion } from './Comun';

const ESTADO_PAGO: Record<DTOPago['estado'], { texto: string; tono: 'exito' | 'error' | 'neutro' }> = {
  aprobado: { texto: 'Aprobado', tono: 'exito' },
  rechazado: { texto: 'Rechazado', tono: 'error' },
  pendiente: { texto: 'Pendiente', tono: 'neutro' },
  reembolsado: { texto: 'Reembolsado', tono: 'neutro' },
};

export function SeccionSuscripcion() {
  const estado = useEstadoSuscripcion();
  const pagos = usePagos();
  const cancelar = useCancelarSuscripcion();
  const [confirmar, setConfirmar] = useState(false);

  if (estado.isLoading) return <CargandoPanel />;
  if (estado.isError || !estado.data) {
    return <EstadoError descripcion="No pudimos cargar tu suscripción." onReintentar={() => void estado.refetch()} cargando={estado.isFetching} />;
  }

  const { esPremium, planActual, suscripcion, pruebaDisponible } = estado.data;
  const cancelada = Boolean(suscripcion?.canceladaEn);

  async function confirmarCancelacion() {
    try {
      await cancelar.mutateAsync();
      await recargarUsuario();
      setConfirmar(false);
      toast.success('Cancelamos la renovación. Mantienes Premium hasta el fin del período pagado.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No pudimos cancelar. Intenta de nuevo.');
    }
  }

  return (
    <PanelSeccion titulo="Suscripción" descripcion="Tu plan actual, la renovación y el historial de pagos.">
      <div className={esPremium ? 'rounded-md border border-tertiary-container/60 bg-tertiary-fixed/40 p-5' : 'rounded-md bg-surface-container-low p-5'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption font-medium text-on-surface-variant">Tu plan actual</p>
            <p className="mt-1 flex items-center gap-2 text-headline-md text-on-surface">
              {planActual.nombre}
              {esPremium && <InsigniaPremium />}
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {esPremium && suscripcion?.terminaEn
                ? cancelada
                  ? `Cancelada. Tienes acceso hasta el ${formatearFecha(suscripcion.terminaEn)}.`
                  : `Se renueva el ${formatearFecha(suscripcion.terminaEn)} por ${formatearCLP(planActual.precioClp)}.`
                : planActual.ensayosMes > 0
                  ? `${planActual.ensayosMes} ensayos al mes y contenidos esenciales.`
                  : 'Contenidos esenciales gratis.'}
            </p>
          </div>
          {esPremium ? (
            !cancelada && (
              <Button variante="fantasma" className="text-error hover:text-error" onClick={() => setConfirmar(true)}>
                Cancelar suscripción
              </Button>
            )
          ) : (
            <BotonEnlace to="/app/premium" variante="premium" iconoIzquierdo="workspace_premium">
              {pruebaDisponible ? 'Probar 7 días gratis' : 'Hazte Premium'}
            </BotonEnlace>
          )}
        </div>
      </div>

      <h3 className="mt-8 text-body-lg font-semibold text-on-surface">Historial de pagos</h3>
      {pagos.isLoading ? (
        <div className="mt-3 space-y-2" role="status" aria-label="Cargando pagos">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : pagos.isError ? (
        <EstadoError compacto className="mt-3" descripcion="No pudimos cargar tus pagos." onReintentar={() => void pagos.refetch()} />
      ) : !pagos.data?.length ? (
        <EstadoVacio compacto className="mt-3" icono="receipt_long" titulo="Aún no tienes pagos" descripcion="Cuando te suscribas, verás aquí cada cobro." />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-body-md">
            <thead>
              <tr className="border-b border-border text-caption text-on-surface-variant">
                <th scope="col" className="py-2 pr-4 font-medium">Fecha</th>
                <th scope="col" className="py-2 pr-4 font-medium">Plan</th>
                <th scope="col" className="py-2 pr-4 font-medium">Método</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Monto</th>
                <th scope="col" className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagos.data.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-on-surface">{formatearFecha(p.creadoEn)}</td>
                  <td className="py-3 pr-4 text-on-surface">{p.planNombre}</td>
                  <td className="py-3 pr-4 text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <Icono nombre={p.metodo === 'webpay' ? 'account_balance' : 'credit_card'} className="text-lg" />
                      {p.metodo === 'webpay' ? 'Webpay Plus' : `Tarjeta${p.ultimos4 ? ` •••• ${p.ultimos4}` : ''}`}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-on-surface tabular-nums">{formatearCLP(p.montoClp)}</td>
                  <td className="py-3">
                    <Chip tamano="sm" tono={ESTADO_PAGO[p.estado].tono}>
                      {ESTADO_PAGO[p.estado].texto}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalConfirmacion
        abierto={confirmar}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => void confirmarCancelacion()}
        cargando={cancelar.isPending}
        peligro
        titulo="¿Cancelar tu suscripción Premium?"
        descripcion={
          suscripcion?.terminaEn
            ? `No habrá más cobros. Mantienes los beneficios hasta el ${formatearFecha(suscripcion.terminaEn)}; después vuelves al plan gratis.`
            : 'No habrá más cobros y volverás al plan gratis al terminar el período.'
        }
        textoConfirmar="Sí, cancelar"
        textoCancelar="Mantener Premium"
      />
    </PanelSeccion>
  );
}
