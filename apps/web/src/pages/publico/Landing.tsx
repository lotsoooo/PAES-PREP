import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { DTODatosPlataforma, DTOPlanSuscripcion } from '@paes-pro/shared';
import { formatearCLP, PRECIO_PREMIUM_CLP } from '@paes-pro/shared';
import { get } from '@/lib/api';
import { useSesion } from '@/app/sesion';
import { anioAdmision, BRAND_NAME, CORREO_SOPORTE } from '@/config/marca';
import { PREGUNTAS_FRECUENTES, TESTIMONIOS } from '@/config/contenidoPublico';
import { useContador, useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/marca/Logo';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Accordion } from '@/components/ui/Navegacion';
import { FragmentoEnsayo, FragmentoPlan, FragmentoProgreso, FragmentoUnidad } from '@/components/landing/Fragmentos';

const NAV = [
  { href: '#funciones', etiqueta: 'Funciones' },
  { href: '#como-funciona', etiqueta: 'Cómo funciona' },
  { href: '#planes', etiqueta: 'Planes' },
  { href: '#preguntas', etiqueta: 'Preguntas' },
];

export default function Landing() {
  useTitulo('Prepárate para la PAES');
  const autenticado = useSesion((s) => s.estado === 'autenticado');

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <a href="#contenido" className="saltar-contenido">
        Saltar al contenido
      </a>
      <Cabecera autenticado={autenticado} />
      <main id="contenido">
        <Hero autenticado={autenticado} />
        <Funciones />
        <ComoFunciona />
        <BandaDatos />
        {TESTIMONIOS.length > 0 && <Testimonios />}
        <Planes />
        <Preguntas />
        <LlamadoFinal autenticado={autenticado} />
      </main>
      <Pie />
    </div>
  );
}

function Contenedor({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 md:px-12', className)}>{children}</div>;
}

function Cabecera({ autenticado }: { autenticado: boolean }) {
  const [conBorde, setConBorde] = useState(false);
  useEffect(() => {
    const alScroll = () => setConBorde(window.scrollY > 8);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-background transition-[border-color,box-shadow] duration-200',
        conBorde ? 'border-b border-border shadow-sm' : 'border-b border-transparent',
      )}
    >
      <Contenedor className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Secciones" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="rounded-sm text-label-md text-on-surface-variant transition-colors hover:text-primary">
                  {n.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {autenticado ? (
            <BotonEnlace to="/app" tamano="sm" iconoDerecho="arrow_forward">
              Ir a mi panel
            </BotonEnlace>
          ) : (
            <>
              <BotonEnlace to="/login" variante="secundario" tamano="sm">
                Iniciar sesión
              </BotonEnlace>
              <BotonEnlace to="/registro" tamano="sm" className="hidden sm:inline-flex">
                Crear cuenta
              </BotonEnlace>
            </>
          )}
        </div>
      </Contenedor>
    </header>
  );
}

function Hero({ autenticado }: { autenticado: boolean }) {
  return (
    <section aria-labelledby="titulo-hero" className="relative overflow-hidden border-b border-border bg-surface-container-low">
      <Contenedor className="flex flex-col items-center pb-16 pt-16 text-center md:pb-24 md:pt-24">
        <p className="animar-entrada inline-flex items-center gap-2 text-label-md font-medium text-on-surface-variant">
          <Icono nombre="event" className="text-lg text-primary" />
          Admisión {anioAdmision()} · PAES regular
        </p>
        <h1
          id="titulo-hero"
          className="animar-entrada mt-4 max-w-3xl text-[2.25rem] font-bold leading-[1.1] tracking-[-0.02em] text-on-surface md:text-[3.5rem]"
          style={{ animationDelay: '60ms' }}
        >
          Prepara la PAES con tecnología y eficacia
        </h1>
        <p
          className="animar-entrada mt-6 max-w-2xl text-body-lg text-on-surface-variant"
          style={{ animationDelay: '120ms' }}
        >
          Ensayos cronometrados con el formato oficial, un plan que se ajusta a tu meta y estadísticas que te dicen
          exactamente qué estudiar mañana.
        </p>
        <div className="animar-entrada mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '180ms' }}>
          <BotonEnlace to={autenticado ? '/app' : '/registro'} tamano="lg" iconoDerecho="arrow_forward" className="rounded-full">
            {autenticado ? 'Ir a mi panel' : 'Comenzar ahora'}
          </BotonEnlace>
          {!autenticado && (
            <BotonEnlace to="/login" tamano="lg" variante="fantasma" className="rounded-full">
              Ya tengo cuenta
            </BotonEnlace>
          )}
        </div>
        <p className="mt-4 text-caption text-on-surface-variant">Gratis para empezar. Sin tarjeta.</p>

        <div className="animar-entrada mt-14 grid w-full max-w-5xl gap-4 text-left md:grid-cols-5" style={{ animationDelay: '260ms' }}>
          <FragmentoProgreso className="shadow-card-hover md:col-span-3" />
          <FragmentoEnsayo className="shadow-card-hover md:col-span-2" />
        </div>
      </Contenedor>
    </section>
  );
}

function Funciones() {
  return (
    <section id="funciones" aria-labelledby="titulo-funciones" className="scroll-mt-20 py-20 md:py-28">
      <Contenedor>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="titulo-funciones" className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
            Todo lo que necesitas para el éxito
          </h2>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            Herramientas diseñadas para maximizar tu aprendizaje y minimizar el estrés.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-12">
          <TarjetaFuncion
            className="md:col-span-8"
            icono="monitoring"
            tono="bg-primary-container text-white"
            titulo="Análisis de progreso avanzado"
            texto="Ve cómo crece tu puntaje ensayo a ensayo e identifica tus ejes fuertes y los que necesitan atención, con precisión por eje temático."
          >
            <FragmentoProgreso className="mt-6" />
          </TarjetaFuncion>
          <TarjetaFuncion
            className="md:col-span-4"
            icono="edit_document"
            tono="bg-secondary-container text-white"
            titulo="Ensayos realistas"
            texto="65 preguntas de M1 con el formato del DEMRE, cronómetro real, autoguardado y navegador de preguntas."
          >
            <FragmentoEnsayo className="mt-6" />
          </TarjetaFuncion>
          <TarjetaFuncion
            className="md:col-span-5"
            icono="menu_book"
            tono="bg-tertiary-container text-on-tertiary-container"
            titulo="Contenido estructurado"
            texto="Lecciones organizadas por eje temático, con puntos clave y mini-tests para fijar lo aprendido."
          >
            <FragmentoUnidad className="mt-6" />
          </TarjetaFuncion>
          <TarjetaFuncion
            className="md:col-span-7"
            icono="calendar_month"
            tono="bg-primary-container text-white"
            titulo="Plan de estudio dinámico"
            texto="Se adapta a tu ritmo y disponibilidad, y reparte las horas según lo lejos que estás de tu meta en cada prueba."
          >
            <FragmentoPlan className="mt-6" />
          </TarjetaFuncion>
        </div>
      </Contenedor>
    </section>
  );
}

function TarjetaFuncion({
  icono,
  tono,
  titulo,
  texto,
  className,
  children,
}: {
  icono: string;
  tono: string;
  titulo: string;
  texto: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover md:p-8',
        className,
      )}
    >
      <span className={cn('flex size-12 items-center justify-center rounded-full', tono)}>
        <Icono nombre={icono} />
      </span>
      <h3 className="mt-6 text-headline-md text-on-surface">{titulo}</h3>
      <p className="mt-2 max-w-prose text-body-md text-on-surface-variant">{texto}</p>
      <div className="mt-auto">{children}</div>
    </article>
  );
}

const PASOS = [
  { icono: 'flag', titulo: 'Define tu meta', texto: 'Elige carrera y universidad: te mostramos el puntaje de referencia.' },
  { icono: 'quiz', titulo: 'Rinde un diagnóstico', texto: 'Un ensayo corto nos dice desde dónde partes en cada eje.' },
  { icono: 'event_available', titulo: 'Sigue tu plan', texto: 'Cada día sabes qué estudiar y cuánto tiempo, según tus horas.' },
  { icono: 'trending_up', titulo: 'Mide y ajusta', texto: 'Tras cada ensayo, el plan se reordena hacia lo que más te falta.' },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-20 bg-surface-container-low py-20 md:py-28">
      <Contenedor className="grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <h2 id="titulo-como" className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
            De la meta al puntaje, paso a paso
          </h2>
          <p className="mt-4 text-body-lg text-on-surface-variant">
            {BRAND_NAME} conecta tu meta, tus ensayos y tu tiempo disponible en un solo camino. Nada de adivinar qué
            repasar.
          </p>
          <BotonEnlace to="/registro" className="mt-8" iconoDerecho="arrow_forward">
            Crear mi plan gratis
          </BotonEnlace>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 md:col-span-7">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="rounded-md border border-border bg-surface-container-lowest p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <Icono nombre={p.icono} />
                </span>
                <span className="text-caption font-medium text-on-surface-variant">
                  Paso {i + 1} de {PASOS.length}
                </span>
              </div>
              <h3 className="mt-4 text-body-lg font-semibold text-on-surface">{p.titulo}</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">{p.texto}</p>
            </li>
          ))}
        </ol>
      </Contenedor>
    </section>
  );
}

function Cifra({ valor, etiqueta, sufijo = '' }: { valor: number; etiqueta: string; sufijo?: string }) {
  const [animado, ref] = useContador(valor);
  return (
    <div className="text-center">
      <p ref={ref as React.RefObject<HTMLParagraphElement>} className="text-[3rem] font-bold leading-none tracking-tight text-on-primary tabular-nums md:text-[3.5rem]">
        {animado.toLocaleString('es-CL')}
        {sufijo}
      </p>
      <p className="mt-3 text-label-md font-medium uppercase tracking-[0.06em] text-on-primary">{etiqueta}</p>
    </div>
  );
}

/** Banda azul con datos reales de la plataforma (D-024: sin cifras de marketing inventadas). */
function BandaDatos() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['datos-plataforma'],
    queryFn: () => get<DTODatosPlataforma>('/datos-plataforma'),
    staleTime: 5 * 60_000,
  });
  return (
    <section aria-label="La plataforma en números" className="bg-primary py-16 md:py-20">
      {isPending ? (
        <p role="status" className="text-center text-on-primary">Cargando cifras de la plataforma…</p>
      ) : isError ? (
        <div role="status" className="px-4 text-center text-on-primary">
          <p>No pudimos cargar las cifras de la plataforma.</p>
          <Button variante="secundario" className="mt-4 border-on-primary text-on-primary hover:bg-on-primary/10" onClick={() => void refetch()}>Reintentar</Button>
        </div>
      ) : (
      <Contenedor className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra valor={data?.preguntas ?? 0} etiqueta="Preguntas tipo PAES" />
        <Cifra valor={data?.ensayos ?? 0} etiqueta="Ensayos disponibles" />
        <Cifra valor={data?.contenidos ?? 0} etiqueta="Lecciones" />
        <Cifra valor={data?.carreras ?? 0} etiqueta="Carreras con puntaje de referencia" />
      </Contenedor>
      )}
    </section>
  );
}

function Testimonios() {
  return (
    <section id="testimonios" aria-labelledby="titulo-testimonios" className="scroll-mt-20 py-20 md:py-28">
      <Contenedor>
        <h2 id="titulo-testimonios" className="text-center text-headline-lg-mobile text-on-surface md:text-headline-lg">
          Lo que dicen quienes ya se prepararon
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIOS.map((t) => (
            <figure key={t.autor} className="rounded-md border border-border bg-surface-container-lowest p-6 shadow-card">
              <blockquote className="text-body-lg text-on-surface">“{t.cita}”</blockquote>
              <figcaption className="mt-4 text-label-md text-on-surface-variant">
                {t.autor} · {t.detalle}
              </figcaption>
            </figure>
          ))}
        </div>
      </Contenedor>
    </section>
  );
}

function Planes() {
  const { data } = useQuery({
    queryKey: ['planes-suscripcion'],
    queryFn: () => get<DTOPlanSuscripcion[]>('/planes-suscripcion'),
    staleTime: 5 * 60_000,
  });
  const premium = data?.find((p) => p.codigo === 'premium');
  const basico = data?.find((p) => p.codigo === 'basico');

  const gratis = [
    `${basico?.ensayosMes ?? 1} ensayo completo al mes`,
    'Plan de estudio personalizado',
    'Biblioteca de contenidos esenciales',
    'Comunidad y tutores',
  ];
  const pro = [
    'Ensayos ilimitados de todas las pruebas',
    'Explicaciones en video paso a paso',
    'Analítica avanzada y mapa de actividad',
    'Tutor IA PAES-Bot',
  ];

  return (
    <section id="planes" aria-labelledby="titulo-planes" className="scroll-mt-20 py-20 md:py-28">
      <Contenedor>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="titulo-planes" className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
            Empieza gratis, sube de nivel cuando quieras
          </h2>
          <p className="mt-3 text-body-lg text-on-surface-variant">Sin permanencia: cancelas desde tu perfil en un clic.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-lg border border-border bg-surface-container-lowest p-8 shadow-card">
            <h3 className="text-headline-md text-on-surface">Gratis</h3>
            <p className="mt-2 text-display font-bold text-on-surface tabular-nums">$0</p>
            <ul className="mt-6 flex-1 space-y-3">
              {gratis.map((b) => (
                <li key={b} className="flex gap-3 text-body-md text-on-surface">
                  <Icono nombre="check" className="text-primary" />
                  {b}
                </li>
              ))}
            </ul>
            <BotonEnlace to="/registro" variante="secundario" className="mt-8" anchoCompleto>
              Crear cuenta gratis
            </BotonEnlace>
          </article>
          <article className="relative flex flex-col rounded-lg border-2 border-tertiary-container bg-surface-container-lowest p-8 shadow-card-hover">
            <span className="absolute -top-3.5 left-8 rounded-full bg-tertiary-container px-3 py-1 text-caption font-bold text-on-tertiary-container">
              Recomendado
            </span>
            <h3 className="text-headline-md text-on-surface">Premium</h3>
            <p className="mt-2 text-display font-bold text-on-surface tabular-nums">
              {formatearCLP(premium?.precioClp ?? PRECIO_PREMIUM_CLP)}
              <span className="text-body-md font-normal text-on-surface-variant"> /mes</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {pro.map((b) => (
                <li key={b} className="flex gap-3 text-body-md text-on-surface">
                  <Icono nombre="check_circle" relleno className="text-tertiary" />
                  {b}
                </li>
              ))}
            </ul>
            <BotonEnlace to="/registro" variante="premium" className="mt-8" anchoCompleto>
              Probar 7 días gratis
            </BotonEnlace>
          </article>
        </div>
      </Contenedor>
    </section>
  );
}

function Preguntas() {
  return (
    <section id="preguntas" aria-labelledby="titulo-preguntas" className="scroll-mt-20 bg-surface-container-low py-20 md:py-28">
      <Contenedor className="max-w-3xl">
        <h2 id="titulo-preguntas" className="text-center text-headline-lg-mobile text-on-surface md:text-headline-lg">
          Preguntas frecuentes
        </h2>
        <Accordion className="mt-10" items={PREGUNTAS_FRECUENTES.map((p) => ({ id: p.id, titulo: p.pregunta, contenido: p.respuesta }))} />
        <p className="mt-6 text-center text-body-md text-on-surface-variant">
          ¿Otra duda? Escríbenos a{' '}
          <a href={`mailto:${CORREO_SOPORTE}`} className="font-medium text-primary underline-offset-2 hover:underline">
            {CORREO_SOPORTE}
          </a>
        </p>
      </Contenedor>
    </section>
  );
}

function LlamadoFinal({ autenticado }: { autenticado: boolean }) {
  return (
    <section aria-labelledby="titulo-final" className="py-20 md:py-24">
      <Contenedor>
        <div className="flex flex-col items-start justify-between gap-8 rounded-lg bg-inverse-surface p-8 md:flex-row md:items-center md:p-12">
          <div>
            <h2 id="titulo-final" className="text-headline-lg-mobile text-inverse-on-surface md:text-headline-lg">
              Tu puntaje se construye desde hoy
            </h2>
            <p className="mt-2 text-body-lg text-inverse-on-surface/80">Crea tu cuenta y recibe tu plan en menos de 3 minutos.</p>
          </div>
          <BotonEnlace to={autenticado ? '/app' : '/registro'} tamano="lg" className="shrink-0 rounded-full" iconoDerecho="arrow_forward">
            {autenticado ? 'Ir a mi panel' : 'Comenzar ahora'}
          </BotonEnlace>
        </div>
      </Contenedor>
    </section>
  );
}

function Pie() {
  const anio = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface-container-lowest">
      <Contenedor className="grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-body-md text-on-surface-variant">
            Plataforma chilena de preparación para la Prueba de Acceso a la Educación Superior.
          </p>
        </div>
        <nav aria-label="Producto" className="md:col-span-2">
          <p className="text-label-md font-semibold text-on-surface">Producto</p>
          <ul className="mt-4 space-y-3 text-body-md text-on-surface-variant">
            <li><a href="#funciones" className="hover:text-primary">Funciones</a></li>
            <li><a href="#planes" className="hover:text-primary">Planes</a></li>
            <li><a href="#preguntas" className="hover:text-primary">Preguntas frecuentes</a></li>
          </ul>
        </nav>
        <nav aria-label="Cuenta" className="md:col-span-2">
          <p className="text-label-md font-semibold text-on-surface">Cuenta</p>
          <ul className="mt-4 space-y-3 text-body-md text-on-surface-variant">
            <li><Link to="/login" className="hover:text-primary">Iniciar sesión</Link></li>
            <li><Link to="/registro" className="hover:text-primary">Crear cuenta</Link></li>
            <li><Link to="/recuperar" className="hover:text-primary">Recuperar contraseña</Link></li>
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="text-label-md font-semibold text-on-surface">Contacto</p>
          <ul className="mt-4 space-y-3 text-body-md text-on-surface-variant">
            <li><a href={`mailto:${CORREO_SOPORTE}`} className="hover:text-primary">{CORREO_SOPORTE}</a></li>
            <li>
              <a href="https://demre.cl" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                Información oficial DEMRE <Icono nombre="open_in_new" className="text-base" />
              </a>
            </li>
          </ul>
        </div>
      </Contenedor>
      <Contenedor className="flex flex-col gap-2 border-t border-border py-6 text-caption text-on-surface-variant sm:flex-row sm:justify-between">
        <p>© {anio} {BRAND_NAME}. Todos los derechos reservados.</p>
        <p>{BRAND_NAME} no está afiliado al DEMRE. Los puntajes estimados son una aproximación.</p>
      </Contenedor>
    </footer>
  );
}
