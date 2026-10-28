import { useMutation } from '@tanstack/react-query';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, post } from '@/lib/api';

export function useRecuperarPassword() {
  return useMutation({
    mutationFn: (email: string) => post<{ ok: true }>('/auth/recuperar', { email }, { sinRefresh: true }),
  });
}

export function useRestablecerPassword(token: string) {
  return useMutation({
    mutationFn: (password: string) =>
      post<{ ok: true }>(`/auth/recuperar/${encodeURIComponent(token)}`, { password }, { sinRefresh: true }),
  });
}

/**
 * Lleva los errores por campo del API (`details: { campo: mensaje }`) al
 * formulario. Devuelve el mensaje general para mostrarlo en un banner.
 */
export function aplicarErroresApi<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
): string {
  if (error instanceof ApiError) {
    const detalles = (error.details ?? {}) as Record<string, string>;
    for (const campo of campos) {
      const mensaje = detalles[campo as string];
      if (mensaje) setError(campo, { type: 'server', message: mensaje });
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
