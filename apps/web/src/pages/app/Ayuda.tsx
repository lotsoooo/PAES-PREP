import { useMemo, useState } from 'react';
import { CORREO_SOPORTE } from '@/config/marca';
import { useTitulo } from '@/hooks/utiles';
import { Pagina, EncabezadoPagina } from '@/components/ui/Pagina';
import { Accordion, type ItemAcordeon } from '@/components/ui/Navegacion';
import { BotonEnlace } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icono } from '@/components/ui/Icono';
import { EstadoVacio } from '@/components/ui/Skeleton';

interface Pregunta {
  id: string;
  tema: string;
  titulo: string;
  respuesta: string;
}

const PREGUNTAS: Pregunta[] = [
  {
    id: 'puntaje',
    tema: 'Ensayos',
    titulo: '¿Cómo se calcula mi puntaje estimado?',
    respuesta:
      'Convertimos tus respuestas correctas a la escala PAES de 100 a 1000 con una tabla de conversión propia. Es una aproximación para seguir tu avance: el DEMRE publica la tabla oficial después de cada proceso.',
  },
  {
    id: 'autoguardado',
    tema: 'Ensayos',
    titulo: '¿Qué pasa si se cierra la pestaña durante un ensayo?',
    respuesta:
      'Cada respuesta se guarda al instante. Vuelve a entrar al ensayo y sigues donde quedaste. El cronómetro sigue corriendo en el servidor, igual que en la prueba real.',
  },
  {
    id: 'atajos',
    tema: 'Ensayos',
    titulo: '¿Hay atajos de teclado en el modo examen?',
    respuesta:
      'Sí: A–D o 1–4 para responder, ← y → para moverte entre preguntas y M para marcar una pregunta para revisarla al final.',
  },
  {
    id: 'plan',
    tema: 'Plan de estudio',
    titulo: '¿Cómo se arma mi plan de estudio?',
    respuesta:
      'Repartimos tus horas semanales entre las pruebas que rendirás según la brecha entre tu puntaje actual y tu meta, y el peso de cada prueba en tu carrera. Después de cada ensayo el plan se ajusta.',
  },
  {
    id: 'racha',
    tema: 'Plan de estudio',
    titulo: '¿Cómo mantengo mi racha?',
    respuesta:
      'Tu racha suma un día cada vez que completas una tarea del plan, terminas una lección o respondes un mini-test. Si pasa un día completo sin actividad, vuelve a cero.',
  },
  {
    id: 'repaso',
    tema: 'Plan de estudio',
    titulo: '¿Qué es el repaso de errores?',
    respuesta:
      'Cada pregunta que respondes mal entra a tu cuaderno de errores. Te la volvemos a mostrar con intervalos cada vez más largos hasta que la domines.',
  },
  {
    id: 'premium',
    tema: 'Premium',
    titulo: '¿Qué incluye Premium?',
    respuesta:
      'Ensayos ilimitados de todas las pruebas, explicaciones en video, analítica avanzada con mapa de actividad y errores por eje, y el tutor IA PAES-Bot.',
  },
  {
    id: 'cancelar',
    tema: 'Premium',
    titulo: '¿Puedo cancelar cuando quiera?',
    respuesta:
      'Sí. Cancelas desde Configuración → Suscripción y mantienes los beneficios hasta el final del período pagado. No hay cobros después.',
  },
  {
    id: 'tarjeta',
    tema: 'Premium',
    titulo: '¿Guardan los datos de mi tarjeta?',
    respuesta:
      'No. El pago lo procesa la pasarela (Webpay Plus o el procesador de la tarjeta); PAES Pro solo guarda el resultado del pago y los últimos 4 dígitos para tu historial.',
  },
  {
    id: 'password',
    tema: 'Cuenta',
    titulo: 'Olvidé mi contraseña, ¿qué hago?',
    respuesta:
      'En la pantalla de inicio de sesión toca "¿Olvidaste tu contraseña?" y te enviaremos un enlace para crear una nueva. Vence en 30 minutos.',
  },
  {
    id: 'tema',
    tema: 'Cuenta',
    titulo: '¿Puedo usar PAES Pro en modo oscuro?',
    respuesta: 'Sí. En Configuración → Apariencia eliges entre Claro, Oscuro o Sistema (sigue el ajuste de tu dispositivo).',
  },
];

const ATAJOS: { teclas: string[]; accion: string }[] = [
  { teclas: ['Ctrl', 'K'], accion: 'Buscar y saltar a cualquier pantalla' },
  { teclas: ['A', '–', 'D'], accion: 'Responder en el modo examen' },
  { teclas: ['←', '→'], accion: 'Pregunta anterior o siguiente' },
  { teclas: ['M'], accion: 'Marcar la pregunta para revisar' },
];

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export default function Ayuda() {
  useTitulo('Ayuda');
  const [busqueda, setBusqueda] = useState('');

  const grupos = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const filtradas = q ? PREGUNTAS.filter((p) => normalizar(`${p.titulo} ${p.respuesta}`).includes(q)) : PREGUNTAS;
    const porTema = new Map<string, ItemAcordeon[]>();
    for (const p of filtradas) {
      porTema.set(p.tema, [...(porTema.get(p.tema) ?? []), { id: p.id, titulo: p.titulo, contenido: <p>{p.respuesta}</p> }]);
    }
    return [...porTema.entries()];
  }, [busqueda]);

  return (
    <Pagina>
      <EncabezadoPagina titulo="Ayuda" descripcion="Respuestas rápidas sobre ensayos, tu plan, Premium y tu cuenta." />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <Input
            label="Buscar en la ayuda"
            labelOculto
            type="search"
            iconoIzquierdo="search"
            placeholder="Ej.: racha, cancelar, puntaje…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {grupos.length === 0 ? (
            <EstadoVacio
              className="mt-6"
              icono="search_off"
              titulo="No encontramos esa pregunta"
              descripcion={`Prueba con otra palabra o escríbenos a ${CORREO_SOPORTE}.`}
            />
          ) : (
            grupos.map(([tema, items]) => (
              <section key={tema} aria-labelledby={`tema-${tema}`} className="mt-8">
                <h2 id={`tema-${tema}`} className="mb-3 text-headline-md text-on-surface">
                  {tema}
                </h2>
                <Accordion items={items} />
              </section>
            ))
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card">
            <span className="flex size-11 items-center justify-center rounded bg-primary-fixed text-primary">
              <Icono nombre="mail" />
            </span>
            <h2 className="mt-4 text-body-lg font-semibold text-on-surface">¿No encontraste tu respuesta?</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">Te respondemos en menos de un día hábil.</p>
            <a
              href={`mailto:${CORREO_SOPORTE}?subject=${encodeURIComponent('Ayuda con PAES Pro')}`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded bg-primary px-5 text-label-md font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
            >
              Escribir a soporte
            </a>
            <BotonEnlace to="/app/comunidad/nuevo" variante="fantasma" className="mt-2 w-full justify-start px-0 text-primary">
              O pregunta en la comunidad
            </BotonEnlace>
          </div>

          <div className="rounded-lg bg-surface-container-low p-6">
            <h2 className="text-body-lg font-semibold text-on-surface">Atajos de teclado</h2>
            <dl className="mt-4 space-y-3">
              {ATAJOS.map((a) => (
                <div key={a.accion} className="flex items-center justify-between gap-4">
                  <dt className="text-body-md text-on-surface">{a.accion}</dt>
                  <dd className="flex shrink-0 gap-1">
                    {a.teclas.map((t) =>
                      t === '–' ? (
                        <span key={t} className="text-caption text-on-surface-variant">–</span>
                      ) : (
                        <kbd key={t} className="rounded-sm border border-border-strong bg-surface-container-lowest px-1.5 py-0.5 text-caption font-medium text-on-surface">
                          {t}
                        </kbd>
                      ),
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </Pagina>
  );
}
