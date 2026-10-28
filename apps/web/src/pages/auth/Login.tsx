import { useState } from 'react';
import { Link } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '@paes-pro/shared';
import { iniciarSesion } from '@/app/sesion';
import { aplicarErroresApi } from '@/lib/data/auth';
import { etiquetaColegio, useColegios, useProveedoresAuth } from '@/lib/data/catalogos';
import { useDebounce, useTitulo } from '@/hooks/utiles';
import { BannerError, BotonGoogle, DivisorO, MarcoAuth } from '@/components/auth/MarcoAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Combobox, type OpcionCombobox } from '@/components/ui/Combobox';
import { Checkbox } from '@/components/ui/Seleccion';

const esquema = loginSchema.extend({ mantenerSesion: z.boolean() });
type Datos = z.infer<typeof esquema>;

const URL_GOOGLE = `${(import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'}/auth/google`;

export default function Login() {
  useTitulo('Iniciar sesión');
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [colegio, setColegio] = useState<OpcionCombobox | null>(null);
  const [busquedaColegio, setBusquedaColegio] = useState('');
  const colegios = useColegios(useDebounce(busquedaColegio));
  const proveedores = useProveedoresAuth();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '', password: '', mantenerSesion: false },
  });

  const enviar = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    try {
      // Al quedar autenticado, el guard SoloInvitado redirige a la app (o a `volver`).
      await iniciarSesion({ ...datos, colegioId: colegio?.id });
    } catch (e) {
      setErrorGeneral(aplicarErroresApi(e, setError, ['email', 'password']));
    }
  });

  return (
    <MarcoAuth
      titulo="Inicia sesión"
      descripcion="Sigue con tu preparación donde la dejaste."
      pie={
        <>
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline">
            Regístrate gratis
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
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="tu@correo.cl"
          iconoIzquierdo="mail"
          error={errors.email?.message}
          {...register('email')}
        />

        <Combobox
          label="Colegio"
          hint="Opcional. Si tu colegio tiene convenio, elígelo para ver sus ensayos."
          placeholder="Busca tu colegio o comuna…"
          icono="school"
          valor={colegio}
          onSeleccionar={setColegio}
          opciones={(colegios.data ?? []).map(etiquetaColegio)}
          busqueda={busquedaColegio}
          onBusquedaChange={setBusquedaColegio}
          cargando={colegios.isFetching}
          vacio="No encontramos ese colegio. Puedes entrar sin elegirlo."
        />

        <Input
          label="Contraseña"
          esPassword
          autoComplete="current-password"
          iconoIzquierdo="lock"
          placeholder="••••••••"
          error={errors.password?.message}
          accionEtiqueta={
            <Link to="/recuperar" className="rounded-sm text-caption font-medium text-primary underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          }
          {...register('password')}
        />

        <Controller
          control={control}
          name="mantenerSesion"
          render={({ field }) => (
            <Checkbox marcado={field.value} onCambio={field.onChange} etiqueta="Mantener sesión iniciada" name={field.name} />
          )}
        />

        <Button type="submit" tamano="lg" anchoCompleto cargando={isSubmitting} textoCargando="Entrando…">
          Iniciar sesión
        </Button>
      </form>
    </MarcoAuth>
  );
}
