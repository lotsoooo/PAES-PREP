import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { Button, BotonEnlace } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Health {
  status: string;
  database: boolean;
}

export function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: () => get<Health>('/health'),
    retry: false,
  });

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-on-surface">PAES Pro</h1>
        <p className="text-body-lg text-on-surface-variant">
          Plataforma de preparación para la PAES
        </p>
      </div>

      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-title-md font-semibold text-on-surface">Estado del sistema</h2>
        {isLoading && <p className="text-body-md text-on-surface-variant">Consultando API…</p>}
        {isError && (
          <div className="space-y-3">
            <p className="text-body-md text-error">
              No se pudo contactar al API. ¿Está corriendo con <code>bun run dev</code>?
            </p>
            <Button variante="secundario" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {data && (
          <div className="space-y-1">
            <p className="text-body-md text-on-surface">
              API: <strong>{data.status}</strong>
            </p>
            <p className="text-body-md text-on-surface">
              Base de datos:{' '}
              <strong className={data.database ? 'text-primary' : 'text-error'}>
                {data.database ? 'conectada' : 'sin conexión'}
              </strong>
            </p>
          </div>
        )}
      </Card>

      <BotonEnlace to="/" variante="fantasma">
        Inicio
      </BotonEnlace>
    </main>
  );
}
