import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordSchema } from '@paes-pro/shared';
import { aplicarErroresApi, useRestablecerPassword } from '@/lib/data/auth';
import { useTitulo } from '@/hooks/utiles';
import { BannerError, MarcoAuth } from '@/components/auth/MarcoAuth';
import { FortalezaPassword } from '@/components/auth/FortalezaPassword';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icono } from '@/components/ui/Icono';

const esquema = resetPasswordSchema
  .pick({ password: true })
  .extend({ confirmar: z.string() })
  .refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden' });
type Datos = z.infer<typeof esquema>;

export default function Restablecer() {
  useTitulo('Nueva contraseña');
  const { token = '' } = useParams();
  const restablecer = useRestablecerPassword(token);
  const [listo, setListo] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Datos>({ resolver: zodResolver(esquema), defaultValues: { password: '', confirmar: '' } });
  const password = useWatch({ control, name: 'password' });

  const enviar = handleSubmit(async ({ password: nueva }) => {
    setErrorGeneral(null);
    try {
      await restablecer.mutateAsync(nueva);
      setListo(true);
    } catch (e) {
      setErrorGeneral(aplicarErroresApi(e, setError, ['password']));
    }
  });

  if (listo) {
    return (
      <MarcoAuth titulo="Contraseña actualizada">
        <div className="flex flex-col items-center text-center" role="status">
          <span className="flex size-16 items-center justify-center rounded-full bg-success-container text-success">
            <Icono nombre="lock_reset" className="text-3xl" />
          </span>
          <p className="mt-5 text-body-md text-on-surface text-pretty">
            Listo. Por seguridad cerramos tu sesión en todos los dispositivos: entra con tu contraseña nueva.
          </p>
          <BotonEnlace to="/login" tamano="lg" anchoCompleto className="mt-6">
            Iniciar sesión
          </BotonEnlace>
        </div>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      titulo="Crea una contraseña nueva"
      descripcion="Elige una que no uses en otros sitios."
      pie={
        <Link to="/recuperar" className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline">
          Pedir un enlace nuevo
        </Link>
      }
    >
      <BannerError mensaje={errorGeneral} />
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <Input
          label="Contraseña nueva"
          esPassword
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <FortalezaPassword password={password} />
        <Input
          label="Repite la contraseña"
          esPassword
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register('confirmar')}
        />
        <Button type="submit" tamano="lg" anchoCompleto cargando={restablecer.isPending} textoCargando="Guardando…">
          Guardar contraseña
        </Button>
      </form>
    </MarcoAuth>
  );
}
