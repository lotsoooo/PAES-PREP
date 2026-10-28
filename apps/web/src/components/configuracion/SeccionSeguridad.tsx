import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { cambiarPasswordSchema, tiempoRelativo } from '@paes-pro/shared';
import { useSesion } from '@/app/sesion';
import { queryClient } from '@/lib/queryClient';
import { aplicarErroresApi } from '@/lib/data/auth';
import { useCambiarPassword, useCerrarOtrasSesiones, useCerrarSesionDispositivo, useEliminarCuenta, useSesionesActivas } from '@/lib/data/cuenta';
import { FortalezaPassword } from '@/components/auth/FortalezaPassword';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EstadoError, Skeleton } from '@/components/ui/Skeleton';
import { PanelSeccion } from './Comun';

const esquema = cambiarPasswordSchema
  .extend({ confirmar: z.string() })
  .refine((d) => d.passwordNuevo === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden' })
  .refine((d) => d.passwordNuevo !== d.passwordActual, { path: ['passwordNuevo'], message: 'Usa una contraseña distinta a la actual' });
type Datos = z.infer<typeof esquema>;

function iconoDispositivo(d: string): string {
  if (/Android|iOS/.test(d)) return 'smartphone';
  return 'computer';
}

export function SeccionSeguridad() {
  return (
    <PanelSeccion titulo="Seguridad" descripcion="Tu contraseña, los dispositivos con sesión abierta y tu cuenta.">
      <CambiarPassword />
      <Sesiones />
      <EliminarCuenta />
    </PanelSeccion>
  );
}

function CambiarPassword() {
  const cambiar = useCambiarPassword();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Datos>({ resolver: zodResolver(esquema), defaultValues: { passwordActual: '', passwordNuevo: '', confirmar: '' } });
  const nueva = useWatch({ control, name: 'passwordNuevo' });

  const enviar = handleSubmit(async ({ passwordActual, passwordNuevo }) => {
    try {
      await cambiar.mutateAsync({ passwordActual, passwordNuevo });
      reset();
      toast.success('Cambiamos tu contraseña y cerramos tus otras sesiones.');
    } catch (e) {
      toast.error(aplicarErroresApi(e, setError, ['passwordActual', 'passwordNuevo']));
    }
  });

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="titulo-password">
      <h3 id="titulo-password" className="text-body-lg font-semibold text-on-surface">
        Cambiar contraseña
      </h3>
      <div className="mt-4 grid max-w-xl gap-5">
        <Input label="Contraseña actual" esPassword autoComplete="current-password" error={errors.passwordActual?.message} {...register('passwordActual')} />
        <Input label="Contraseña nueva" esPassword autoComplete="new-password" error={errors.passwordNuevo?.message} {...register('passwordNuevo')} />
        <FortalezaPassword password={nueva} />
        <Input label="Repite la contraseña nueva" esPassword autoComplete="new-password" error={errors.confirmar?.message} {...register('confirmar')} />
        <div>
          <Button type="submit" cargando={cambiar.isPending} textoCargando="Guardando…">
            Actualizar contraseña
          </Button>
        </div>
      </div>
    </form>
  );
}

function Sesiones() {
  const sesiones = useSesionesActivas();
  const cerrarUna = useCerrarSesionDispositivo();
  const cerrarOtras = useCerrarOtrasSesiones();
  const otras = (sesiones.data ?? []).filter((s) => !s.actual).length;

  return (
    <section aria-labelledby="titulo-sesiones" className="mt-10 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="titulo-sesiones" className="text-body-lg font-semibold text-on-surface">
            Sesiones activas
          </h3>
          <p className="text-caption text-on-surface-variant">Si no reconoces un dispositivo, cierra su sesión y cambia tu contraseña.</p>
        </div>
        {otras > 0 && (
          <Button
            variante="secundario"
            tamano="sm"
            iconoIzquierdo="logout"
            cargando={cerrarOtras.isPending}
            onClick={() =>
              cerrarOtras.mutate(undefined, {
                onSuccess: () => toast.success('Cerramos tus otras sesiones.'),
                onError: () => toast.error('No pudimos cerrar las sesiones. Intenta de nuevo.'),
              })
            }
          >
            Cerrar las demás
          </Button>
        )}
      </div>

      {sesiones.isLoading ? (
        <div className="mt-4 space-y-2" role="status" aria-label="Cargando sesiones">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
        </div>
      ) : sesiones.isError ? (
        <EstadoError compacto className="mt-4" descripcion="No pudimos cargar tus sesiones." onReintentar={() => void sesiones.refetch()} />
      ) : (
        <ul className="mt-4 space-y-2">
          {(sesiones.data ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-md border border-border px-4 py-3">
              <Icono nombre={iconoDispositivo(s.dispositivo)} className="text-2xl text-on-surface-variant" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-body-md font-medium text-on-surface">
                  {s.dispositivo}
                  {s.actual && (
                    <Chip tamano="sm" tono="exito">
                      Este dispositivo
                    </Chip>
                  )}
                </p>
                <p className="text-caption text-on-surface-variant">
                  {s.ip ? `${s.ip} · ` : ''}Último uso {tiempoRelativo(s.ultimoUsoEn).toLowerCase()}
                </p>
              </div>
              {!s.actual && (
                <Button
                  variante="fantasma"
                  tamano="sm"
                  cargando={cerrarUna.isPending && cerrarUna.variables === s.id}
                  onClick={() =>
                    cerrarUna.mutate(s.id, {
                      onSuccess: () => toast.success(`Cerramos la sesión en ${s.dispositivo}.`),
                      onError: () => toast.error('No pudimos cerrar esa sesión.'),
                    })
                  }
                >
                  Cerrar sesión
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EliminarCuenta() {
  const navigate = useNavigate();
  const eliminar = useEliminarCuenta();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');

  async function confirmar() {
    try {
      await eliminar.mutateAsync();
      useSesion.getState().limpiar();
      queryClient.clear();
      toast.success('Eliminamos tu cuenta. Gracias por prepararte con nosotros.');
      navigate('/', { replace: true });
    } catch {
      toast.error('No pudimos eliminar tu cuenta. Intenta de nuevo.');
    }
  }

  return (
    <section aria-labelledby="titulo-eliminar" className="mt-10 rounded-md border border-error/40 bg-error-container/30 p-5">
      <h3 id="titulo-eliminar" className="text-body-lg font-semibold text-on-surface">
        Eliminar cuenta
      </h3>
      <p className="mt-1 text-body-md text-on-surface-variant">
        Tu cuenta se cierra y ya no podrás entrar con ella ni recuperar tu progreso. Esta acción no se puede deshacer.
      </p>
      <Button variante="peligro" className="mt-4" iconoIzquierdo="delete_forever" onClick={() => setAbierto(true)}>
        Eliminar mi cuenta
      </Button>

      <Modal
        abierto={abierto}
        onAbiertoChange={(v) => {
          setAbierto(v);
          if (!v) setTexto('');
        }}
        titulo="¿Eliminar tu cuenta para siempre?"
        descripcion="Perderás tu historial de ensayos, tu racha y tu plan de estudio. Si tienes Premium, se cancela sin reembolso del período en curso."
        ancho="sm"
        pie={
          <>
            <Button variante="fantasma" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button variante="peligro" disabled={texto !== 'ELIMINAR'} cargando={eliminar.isPending} onClick={() => void confirmar()}>
              Eliminar cuenta
            </Button>
          </>
        }
      >
        <Input
          label="Escribe ELIMINAR para confirmar"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </Modal>
    </section>
  );
}
