import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { forgotPasswordSchema, MINUTOS_TOKEN_RECUPERACION } from '@paes-pro/shared';
import { aplicarErroresApi, useRecuperarPassword } from '@/lib/data/auth';
import { useTitulo } from '@/hooks/utiles';
import { BannerError, MarcoAuth } from '@/components/auth/MarcoAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icono } from '@/components/ui/Icono';

type Datos = z.infer<typeof forgotPasswordSchema>;

export default function Recuperar() {
  useTitulo('Recuperar contraseña');
  const recuperar = useRecuperarPassword();
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Datos>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const enviar = handleSubmit(async ({ email }) => {
    setErrorGeneral(null);
    try {
      await recuperar.mutateAsync(email);
      setEnviadoA(email);
    } catch (e) {
      setErrorGeneral(aplicarErroresApi(e, setError, ['email']));
    }
  });

  const pie = (
    <Link to="/login" className="inline-flex items-center gap-1 rounded-sm font-semibold text-primary underline-offset-4 hover:underline">
      <Icono nombre="arrow_back" className="text-lg" />
      Volver a iniciar sesión
    </Link>
  );

  if (enviadoA) {
    return (
      <MarcoAuth titulo="Revisa tu correo" pie={pie}>
        <div className="flex flex-col items-center text-center" role="status">
          <span className="flex size-16 items-center justify-center rounded-full bg-success-container text-success">
            <Icono nombre="mark_email_read" relleno className="text-3xl" />
          </span>
          <p className="mt-5 text-body-md text-on-surface text-pretty">
            Si existe una cuenta con <strong className="font-semibold">{enviadoA}</strong>, te enviamos un enlace para crear
            una contraseña nueva. Vence en {MINUTOS_TOKEN_RECUPERACION} minutos.
          </p>
          <p className="mt-3 text-caption text-on-surface-variant">¿No llegó? Revisa la carpeta de spam o pide otro enlace.</p>
          <Button variante="secundario" className="mt-6" onClick={() => setEnviadoA(null)}>
            Usar otro correo
          </Button>
        </div>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      titulo="Recupera tu contraseña"
      descripcion="Escribe el correo con el que te registraste y te mandamos un enlace para crear una nueva."
      pie={pie}
    >
      <BannerError mensaje={errorGeneral} />
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
        <Button type="submit" tamano="lg" anchoCompleto cargando={recuperar.isPending} textoCargando="Enviando…">
          Enviar enlace
        </Button>
      </form>
    </MarcoAuth>
  );
}
