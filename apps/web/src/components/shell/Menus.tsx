import * as Popover from '@radix-ui/react-popover';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useSesion, cerrarSesion } from '@/app/sesion';
import { useTheme } from '@/app/providers/tema';
import { useMarcarLeida, useMarcarTodasLeidas, useResumenNotificaciones } from '@/lib/data/notificaciones';
import { urlArchivo } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { BotonIcono } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Skeleton } from '@/components/ui/Skeleton';
import { ItemNotificacion } from '@/components/notificaciones/ItemNotificacion';
import { InsigniaPremium } from '@/components/premium/Premium';

/** Campana con contador y vista rápida de las últimas notificaciones. */
export function MenuNotificaciones() {
  const { data, isLoading, isError, refetch } = useResumenNotificaciones();
  const marcar = useMarcarLeida();
  const todas = useMarcarTodasLeidas();
  const noLeidas = data?.noLeidas ?? 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <BotonIcono icono="notifications" etiqueta="Notificaciones" insignia={noLeidas} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="animar-aparecer z-50 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-border bg-surface-container-lowest shadow-float"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-body-md font-semibold text-on-surface">Notificaciones</p>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={() => todas.mutate()}
                className="rounded px-2 py-1 text-label-md font-medium text-primary hover:bg-primary/8"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-[22rem] overflow-y-auto overscroll-contain p-2 scrollbar-fino">
            {isLoading ? (
              <div className="space-y-3 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-body-md text-on-surface-variant">
                No pudimos cargar tus notificaciones.{' '}
                <button type="button" onClick={() => refetch()} className="font-medium text-primary underline">
                  Reintentar
                </button>
              </div>
            ) : data && data.recientes.length > 0 ? (
              data.recientes.map((n) => (
                <Popover.Close asChild key={n.id}>
                  <div>
                    <ItemNotificacion n={n} compacto onAbrir={(x) => !x.leida && marcar.mutate(x.id)} />
                  </div>
                </Popover.Close>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-body-md text-on-surface-variant">
                Estás al día. Te avisaremos cuando haya resultados o novedades.
              </p>
            )}
          </div>
          <Popover.Close asChild>
            <Link
              to="/app/notificaciones"
              className="block border-t border-border px-4 py-3 text-center text-label-md font-medium text-primary hover:bg-surface-container-low"
            >
              Ver todas
            </Link>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Avatar con menú de cuenta: perfil, configuración, tema y cerrar sesión. */
export function MenuUsuario({ tamano = 'sm' }: { tamano?: 'xs' | 'sm' }) {
  const usuario = useSesion((s) => s.usuario);
  const { preferencia, setPreferencia } = useTheme();
  const navigate = useNavigate();
  if (!usuario) return null;
  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');

  const item =
    'flex min-h-10 cursor-pointer select-none items-center gap-3 rounded px-3 text-body-md text-on-surface outline-none data-[highlighted]:bg-surface-container';

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label={`Cuenta de ${nombre}`}
          className="flex shrink-0 items-center rounded-full p-0.5 ring-offset-2 transition-shadow hover:ring-2 hover:ring-outline-variant"
        >
          <Avatar nombre={nombre} url={urlArchivo(usuario.avatarUrl)} tamano={tamano} />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="animar-aparecer z-50 w-64 rounded-md border border-border bg-surface-container-lowest p-1.5 shadow-float"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-body-md font-semibold text-on-surface">{nombre}</p>
            <p className="truncate text-caption text-on-surface-variant">{usuario.email}</p>
            {usuario.esPremium && <InsigniaPremium className="mt-2" />}
          </div>
          <Dropdown.Separator className="my-1 h-px bg-border" />
          <Dropdown.Item className={item} onSelect={() => navigate('/app/perfil')}>
            <Icono nombre="person" className="text-on-surface-variant" /> Mi perfil
          </Dropdown.Item>
          <Dropdown.Item className={item} onSelect={() => navigate('/app/configuracion/cuenta')}>
            <Icono nombre="settings" className="text-on-surface-variant" /> Configuración
          </Dropdown.Item>
          {!usuario.esPremium && (
            <Dropdown.Item className={item} onSelect={() => navigate('/app/premium')}>
              <Icono nombre="workspace_premium" className="text-tertiary" /> Hazte Premium
            </Dropdown.Item>
          )}
          <Dropdown.Separator className="my-1 h-px bg-border" />
          <Dropdown.Label className="px-3 pb-1 pt-2 text-caption text-on-surface-variant">Tema</Dropdown.Label>
          <Dropdown.RadioGroup value={preferencia} onValueChange={(v) => setPreferencia(v as typeof preferencia)}>
            {(
              [
                ['claro', 'Claro', 'light_mode'],
                ['oscuro', 'Oscuro', 'dark_mode'],
                ['sistema', 'Igual que el sistema', 'contrast'],
              ] as const
            ).map(([valor, etiqueta, icono]) => (
              <Dropdown.RadioItem key={valor} value={valor} className={item}>
                <Icono nombre={icono} className="text-on-surface-variant" />
                <span className="flex-1">{etiqueta}</span>
                <Dropdown.ItemIndicator>
                  <Icono nombre="check" className="text-primary" />
                </Dropdown.ItemIndicator>
              </Dropdown.RadioItem>
            ))}
          </Dropdown.RadioGroup>
          <Dropdown.Separator className="my-1 h-px bg-border" />
          <Dropdown.Item
            className={item}
            onSelect={async () => {
              await cerrarSesion();
              toast.success('Cerraste sesión. ¡Nos vemos pronto!');
              navigate('/login');
            }}
          >
            <Icono nombre="logout" className="text-on-surface-variant" /> Cerrar sesión
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
