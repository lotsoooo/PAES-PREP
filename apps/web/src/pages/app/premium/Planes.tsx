import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { formatearCLP, formatearFecha } from '@paes-pro/shared';
import { usePlanesSuscripcion } from '@/lib/data/catalogos';
import { useEstadoSuscripcion } from '@/lib/data/cuenta';
import { useProbarPremium } from '@/lib/data/premium';
import { useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina } from '@/components/ui/Pagina';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { SegmentedControl, Accordion } from '@/components/ui/Navegacion';
import { EstadoError, Skeleton } from '@/components/ui/Skeleton';
import { codigoDePeriodo, preciosPremium, type Periodo } from '@/components/premium-pago/precios';

const GRATIS = [
  { ok: true, texto: '1 ensayo PAES completo al mes' },
  { ok: true, texto: 'Guías y lecciones básicas' },
  { ok: true, texto: 'Plan de estudio y estadísticas generales' },
  { ok: true, texto: 'Comunidad y cuaderno de errores' },
  { ok: false, texto: 'Tutor IA PAES-Bot' },
  { ok: false, texto: 'Explicaciones en video paso a paso' },
];

const PREMIUM = [
  'Ensayos PAES ilimitados de todas las pruebas',
  'Tutor IA PAES-Bot en lecciones, errores y estadísticas',
  'Analítica avanzada: mapa de actividad y errores por eje',
  'Explicaciones en video paso a paso',
  'Todo el contenido Premium de la biblioteca',
];

const RAZONES = [
  {
    icono: 'psychology',
    titulo: 'Aprendizaje adaptativo',
    texto: 'Tu plan se recalcula con cada ensayo: más horas donde está tu brecha, menos donde ya rindes.',
  },
  {
    icono: 'smart_display',
    titulo: 'Videos resolutivos',
    texto: 'Revisa las explicaciones paso a paso y los videos disponibles en cada contenido.',
  },
  {
    icono: 'monitoring',
    titulo: 'Métricas precisas',
    texto: 'Precisión por eje y dificultad, tiempo por pregunta y tu evolución frente a tu meta.',
  },
];

const FAQ = [
  {
    id: 'cobro',
    titulo: '¿Cuándo se me cobra?',
    contenido: 'Cada compra cubre el periodo elegido. Esta versión no realiza cobros automáticos. En el entorno de pruebas no se cobra dinero.',
  },
  {
    id: 'prueba',
    titulo: '¿La prueba se cobra al terminar?',
    contenido: 'No. La prueba no pide tarjeta ni se renueva sola. Su duración se muestra antes de activarla y al vencer vuelves al plan Básico.',
  },
  {
    id: 'cancelar',
    titulo: '¿Puedo cancelar cuando quiera?',
    contenido: 'Sí, desde Configuración → Suscripción. Mantienes Premium hasta el final del periodo que pagaste y no se vuelve a cobrar.',
  },
  {
    id: 'medios',
    titulo: '¿Qué medios de pago aceptan?',
    contenido: 'Tarjetas de crédito y débito, y Webpay Plus de Transbank. Nunca guardamos los datos de tu tarjeta.',
  },
  {
    id: 'boleta',
    titulo: '¿Entregan boleta?',
    contenido: 'El historial muestra el registro de las transacciones. La emisión de boletas tributarias requiere habilitar el servicio de facturación; un registro de prueba no es una boleta.',
  },
];

export default function Planes() {
  useTitulo('Planes Premium');
  const navegar = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>('mensual');
  const planes = usePlanesSuscripcion();
  const estado = useEstadoSuscripcion();
  const probar = useProbarPremium();
  const precios = preciosPremium(planes.data);
  const esPremium = estado.data?.esPremium ?? false;
  const pruebaDisponible = estado.data?.pruebaDisponible ?? false;
  const diasPrueba = estado.data?.diasPrueba ?? 7;
  const terminaEn = estado.data?.suscripcion?.terminaEn;

  const irCheckout = () => navegar(`/app/premium/checkout?plan=${codigoDePeriodo(periodo)}`);
  const iniciarPrueba = () =>
    probar.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Comenzó tu prueba Premium de ${diasPrueba} días`, { description: 'Beneficio de demostración en este entorno. No se hará ningún cobro.' });
        navegar('/app');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Pagina>
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-headline-lg-mobile text-on-surface text-balance md:text-[40px] md:leading-[48px] md:font-bold md:tracking-[-0.02em]">
          Maximiza tu puntaje PAES
        </h1>
        <p className="mt-3 text-body-lg text-on-surface-variant text-pretty">
          Elige el plan que se adapte a tu ritmo. Con Premium desbloqueas todos los ensayos, el tutor IA y la analítica que te muestra dónde sumar puntos.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <SegmentedControl
            etiquetaAria="Periodo de facturación"
            valor={periodo}
            onCambio={setPeriodo}
            opciones={[
              { valor: 'mensual', etiqueta: 'Mensual' },
              { valor: 'anual', etiqueta: 'Anual' },
            ]}
          />
          <p className="min-h-5 text-caption text-on-surface-variant" aria-live="polite">
            {precios.ahorro > 0 && (periodo === 'anual' ? `Ahorras ${formatearCLP(precios.ahorro)} al año` : `Paga anual y ahorra ${precios.porcentajeAhorro} %`)}
          </p>
        </div>
      </header>

      {estado.isError && (
        <EstadoError compacto className="mx-auto mt-6 max-w-xl" titulo="No pudimos revisar tu plan actual" onReintentar={() => void estado.refetch()} />
      )}

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2 md:items-stretch">
        {/* Gratis */}
        <section aria-labelledby="plan-gratis" className="flex flex-col rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card md:p-8">
          <Chip className="self-start">Básico</Chip>
          <h2 id="plan-gratis" className="mt-3 text-headline-md text-on-surface">
            Gratis
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Para empezar tu preparación.</p>
          <p className="mt-6 flex items-baseline gap-1">
            <span className="text-[44px] font-bold leading-none tracking-[-0.02em] text-on-surface tabular-nums">$0</span>
            <span className="text-body-md text-on-surface-variant">/ mes</span>
          </p>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            {GRATIS.map((b) => (
              <li key={b.texto} className={cn('flex items-start gap-3 text-body-md', b.ok ? 'text-on-surface' : 'text-on-surface-variant')}>
                <Icono nombre={b.ok ? 'check_circle' : 'cancel'} className={b.ok ? 'text-primary' : 'text-outline'} />
                <span className={cn(!b.ok && 'line-through decoration-outline')}>{b.texto}</span>
                {!b.ok && <span className="sr-only">(no incluido)</span>}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {estado.isPending ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <Button variante="secundario" anchoCompleto disabled>
                {esPremium ? 'Plan básico' : 'Tu plan actual'}
              </Button>
            )}
          </div>
        </section>

        {/* Premium */}
        <section
          aria-labelledby="plan-premium"
          className="relative flex flex-col rounded-lg border-2 border-tertiary-container bg-surface-container-lowest p-6 shadow-card-hover md:p-8"
        >
          <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-tertiary-container px-3 py-1 text-label-md font-semibold text-on-tertiary-container">
            <Icono nombre="star" relleno className="text-base" />
            Recomendado
          </span>
          <h2 id="plan-premium" className="mt-2 inline-flex items-center gap-2 text-headline-md text-on-surface">
            <Icono nombre="workspace_premium" relleno className="text-tertiary" />
            Premium
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Preparación intensiva y personalizada, sin límites.</p>
          <div className="mt-6" aria-live="polite">
            {planes.isPending ? (
              <Skeleton className="h-11 w-48" />
            ) : (
              <>
                <p className="flex items-baseline gap-1">
                  <span className="text-[44px] font-bold leading-none tracking-[-0.02em] text-on-surface tabular-nums">
                    {formatearCLP(periodo === 'anual' ? precios.anualPorMes : precios.mensual)}
                  </span>
                  <span className="text-body-md text-on-surface-variant">/ mes</span>
                </p>
                <p className="mt-2 min-h-5 text-caption text-on-surface-variant">
                  {periodo === 'anual' ? `${formatearCLP(precios.anual)} por 365 días, sin renovación automática` : 'Acceso por 30 días, sin renovación automática.'}
                </p>
              </>
            )}
          </div>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            {PREMIUM.map((b) => (
              <li key={b} className="flex items-start gap-3 text-body-md text-on-surface">
                <Icono nombre="check_circle" relleno className="text-tertiary" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            {estado.isPending ? (
              <Skeleton className="h-13 w-full" />
            ) : esPremium ? (
              <>
                <Button variante="premium" tamano="lg" anchoCompleto disabled iconoIzquierdo="check">
                  Tu plan actual
                </Button>
                <p className="text-center text-caption text-on-surface-variant">
                  {terminaEn ? `Activo hasta el ${formatearFecha(terminaEn)}. ` : ''}
                  <BotonEnlace to="/app/configuracion/suscripcion" variante="fantasma" tamano="sm" className="px-1 underline">
                    Administrar suscripción
                  </BotonEnlace>
                </p>
              </>
            ) : pruebaDisponible ? (
              <>
                <Button variante="premium" tamano="lg" anchoCompleto iconoDerecho="arrow_forward" onClick={iniciarPrueba} cargando={probar.isPending}>
                  Probar {diasPrueba} días gratis
                </Button>
                <Button variante="secundario" anchoCompleto onClick={irCheckout}>
                  Suscribirme ahora
                </Button>
                <p className="text-center text-caption text-on-surface-variant">Sin tarjeta y sin cobro automático.</p>
              </>
            ) : (
              <>
                <Button variante="premium" tamano="lg" anchoCompleto iconoDerecho="arrow_forward" onClick={irCheckout}>
                  {periodo === 'anual' ? `Suscribirme por ${formatearCLP(precios.anual)} al año` : `Suscribirme por ${formatearCLP(precios.mensual)}`}
                </Button>
                <p className="text-center text-caption text-on-surface-variant">Cancela en cualquier momento.</p>
              </>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="titulo-razones" className="mx-auto mt-20 max-w-5xl border-t border-border pt-12">
        <h2 id="titulo-razones" className="text-center text-headline-md text-on-surface">
          ¿Por qué elegir Premium?
        </h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {RAZONES.map((r) => (
            <li key={r.titulo} className="flex gap-4 md:flex-col md:gap-3">
              <Icono nombre={r.icono} className="text-3xl text-primary" />
              <div>
                <h3 className="text-body-lg font-semibold text-on-surface">{r.titulo}</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">{r.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-faq" className="mx-auto mt-16 max-w-3xl">
        <h2 id="titulo-faq" className="text-headline-md text-on-surface">
          Preguntas sobre facturación
        </h2>
        <Accordion className="mt-6" items={FAQ} />
      </section>
    </Pagina>
  );
}
