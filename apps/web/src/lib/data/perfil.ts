import { useQuery } from '@tanstack/react-query';
import type { DTOPerfilPropio } from '@paes-pro/shared';
import { get } from '@/lib/api';

/** Perfil propio completo: usuario, resumen, logros, últimos ensayos, publicaciones y guardados. */
export function usePerfilPropio() {
  return useQuery({
    queryKey: ['perfil', 'propio'],
    queryFn: () => get<DTOPerfilPropio>('/usuarios/perfil'),
  });
}
