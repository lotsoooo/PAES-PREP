import { useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { registroSchema } from '@paes-pro/shared';
import { registrarse } from '@/app/sesion';
import { aplicarErroresApi } from '@/lib/data/auth';
import { useProveedoresAuth } from '@/lib/data/catalogos';
import { useTitulo } from '@/hooks/utiles';
import { BannerError, BotonGoogle, DivisorO, MarcoAuth } from '@/components/auth/MarcoAuth';
import { FortalezaPassword } from '@/components/auth/FortalezaPassword';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const esquema = registroSchema.pick({ nombre: true, email: true, password: true });
type Datos = z.infer<typeof esquema>;

const URL_GOOGLE = `${(import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'}/auth/google`;

export default function Registro() {
  useTitulo('Crear cuenta');
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const proveedores = useProveedoresAuth();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    mode: 'onTouched',
    defaultValues: { nombre: '', email: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const enviar = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    try {
      // Con sesión nueva, SoloInvitado manda a /onboarding/meta (onboarding pendiente).
      await registrarse(datos);
    } catch (e) {
      setErrorGeneral(aplicarErroresApi(e, setError, ['nombre', 'email', 'password']));
    }
  });

  return (
    <MarcoAuth
      titulo="Crea tu cuenta"
      descripcion="Gratis. En dos minutos tienes tu plan de estudio para la PAES."
      pie={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <BannerError mensaje={errorGeneral} />

      {proveedores.data?.google && (
        <>
          <BotonGoogle href={URL_GOOGLE} />
          <DivisorO />
        </>
      )}

      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <Input
          label="Nombre completo"
          autoComplete="name"
          placeholder="Ej.: Javiera Muñoz"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="tu@correo.cl"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          esPassword
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <FortalezaPassword password={password} />

        <Button type="submit" tamano="lg" anchoCompleto cargando={isSubmitting} textoCargando="Creando tu cuenta…">
          Crear cuenta
        </Button>
        <p className="text-center text-caption text-on-surface-variant text-pretty">
          Al crear tu cuenta aceptas los términos de uso y la política de privacidad de PAES Pro.
        </p>
      </form>
    </MarcoAuth>
  );
}
