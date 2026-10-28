import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // No reintentar errores que no se arreglan solos (403, 404, 402…).
      retry: (fallos, error) =>
        fallos < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});
