import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { router } from '@/app/router';
import { queryClient } from '@/lib/queryClient';
import { Toast } from '@/components/ui/Toast';
import { ProveedorTooltip } from '@/components/ui/Datos';
import '@/app/sesion';
import '@/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ProveedorTooltip>
          <RouterProvider router={router} />
          <Toast />
        </ProveedorTooltip>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
