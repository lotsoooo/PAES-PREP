import { useQuery } from '@tanstack/react-query';
import type { DTODashboardCompleto } from '@paes-pro/shared';
import { get } from '@/lib/api';

export const claveDashboard = ['dashboard'] as const;

export function useDashboard() {
  return useQuery({
    queryKey: claveDashboard,
    queryFn: () => get<DTODashboardCompleto>('/dashboard'),
  });
}
