import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { DTOPreferencias } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { useActualizarPreferencias, usePreferencias } from '@/lib/data/cuenta';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { EstadoError } from '@/components/ui/Skeleton';
import { CargandoPanel, GrupoAjustes, PanelSeccion } from './Comun';

type ClaveNotif = Exclude<keyof DTOPreferencias, 'tema'>;

const GRUPOS: { titulo: string; items: { clave: ClaveNotif; etiqueta: string; descripcion: string }[] }[] = [
  {
    titulo: 'Correo electrónico',
    items: [
      { clave: 'notifEmail', etiqueta: 'Resumen semanal', descripcion: 'Tu progreso y estadísticas de estudio, cada domingo.' },
      { clave: 'notifMarketing', etiqueta: 'Nuevos contenidos', descripcion: 'Avisos de ensayos, guías y material de estudio nuevos.' },
    ],
  },
  {
    titulo: 'Push y app',
    items: [
      { clave: 'notifRacha', etiqueta: 'Recordatorios de estudio', descripcion: 'Te avisamos las sesiones del día para que no pierdas tu racha.' },
      { clave: 'notifResultados', etiqueta: 'Resultados de ensayos', descripcion: 'Cuando tus resultados y explicaciones están listos.' },
      { clave: 'notifSocial', etiqueta: 'Actividad de la comunidad', descripcion: 'Respuestas y me gusta en tus publicaciones y comentarios.' },
      { clave: 'notifPush', etiqueta: 'Notificaciones en el navegador', descripcion: 'Muestra los avisos aunque no tengas PAES Pro abierto.' },
    ],
  },
];

export function SeccionNotificaciones() {
  const prefs = usePreferencias();
  const guardar = useActualizarPreferencias();
  const [borrador, setBorrador] = useState<DTOPreferencias | null>(null);

  useEffect(() => {
    if (prefs.data && !borrador) setBorrador(prefs.data);
  }, [prefs.data, borrador]);

  if (prefs.isLoading || (!borrador && !prefs.isError)) return <CargandoPanel />;
  if (prefs.isError || !borrador) {
    return <EstadoError descripcion="No pudimos cargar tus preferencias." onReintentar={() => void prefs.refetch()} cargando={prefs.isFetching} />;
  }

  const cambios = Object.fromEntries(
    GRUPOS.flatMap((g) => g.items)
      .filter(({ clave }) => prefs.data && borrador[clave] !== prefs.data[clave])
      .map(({ clave }) => [clave, borrador[clave]]),
  ) as Partial<DTOPreferencias>;
  const hayCambios = Object.keys(cambios).length > 0;

  async function enviar() {
    try {
      const nuevas = await guardar.mutateAsync(cambios);
      setBorrador(nuevas);
      toast.success('Guardamos tus preferencias de notificaciones.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No pudimos guardar. Intenta de nuevo.');
    }
  }

  return (
    <PanelSeccion
      titulo="Notificaciones"
      descripcion="Controla cómo y cuándo PAES Pro se comunica contigo."
      pie={
        <>
          {hayCambios && (
            <Button variante="fantasma" onClick={() => setBorrador(prefs.data ?? null)}>
              Descartar
            </Button>
          )}
          <Button onClick={enviar} disabled={!hayCambios} cargando={guardar.isPending} textoCargando="Guardando…">
            Guardar cambios
          </Button>
        </>
      }
    >
      {GRUPOS.map((g) => (
        <GrupoAjustes key={g.titulo} titulo={g.titulo}>
          {g.items.map((i) => (
            <div key={i.clave} className="rounded-md border border-border px-5 py-1 transition-colors hover:bg-surface-container-low">
              <Switch
                id={`pref-${i.clave}`}
                etiqueta={i.etiqueta}
                descripcion={i.descripcion}
                marcado={borrador[i.clave]}
                onCambio={(v) => setBorrador((b) => (b ? { ...b, [i.clave]: v } : b))}
              />
            </div>
          ))}
        </GrupoAjustes>
      ))}
    </PanelSeccion>
  );
}
