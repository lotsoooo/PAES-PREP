import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/app/pages/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);
