import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { DTOCarrera, DTOOferta } from '@paes-pro/shared';
import { useSesion, recargarUsuario } from '@/app/sesion';
import { ApiError } from '@/lib/api';
import { useCarreras, useOfertas } from '@/lib/data/catalogos';
import { useGenerarPlan, useGuardarDisponibilidad, useGuardarMeta, useOmitirOnboarding } from '@/lib/data/onboarding';
import { useDebounce, useTitulo } from '@/hooks/utiles';
import {
  CarrerasPopulares,
  ListaOfertas,
  MarcoOnboarding,
  MetaSeleccionada,
  SelectorDias,
  SelectorHoras,
  SelectorPruebas,
  TituloPaso,
} from '@/components/onboarding/Pasos';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const TOTAL = 3;

function mensajeError(e: unknown): string {
  return e instanceof ApiError ? e.message : 'No pudimos guardar. Revisa tu conexión e intenta de nuevo.';
}

export default function Meta() {
  useTitulo('Configura tu meta');
  const navigate = useNavigate();
  const usuario = useSesion((s) => s.usuario);
  const [paso, setPaso] = useState(1);

  // Paso 1 — se precarga con lo que el usuario ya tenga guardado.
  const [carrera, setCarrera] = useState<DTOCarrera | null>(usuario?.carrera ?? null);
  const [oferta, setOferta] = useState<{ universidadId: string; nombre: string; corte: number } | null>(
    usuario?.universidad
      ? { universidadId: usuario.universidad.id, nombre: usuario.universidad.nombre, corte: usuario.puntajeMeta ?? 0 }
      : null,
  );
  const [puntajePropio, setPuntajePropio] = useState<string>(usuario?.puntajeMeta ? String(usuario.puntajeMeta) : '');
  const [busqueda, setBusqueda] = useState('');
  const carreras = useCarreras(useDebounce(busqueda), 8);
  const populares = useCarreras('', 6);
  const ofertas = useOfertas(carrera?.id ?? null);

  // Pasos 2 y 3
  const [dias, setDias] = useState<number[]>(usuario?.diasDisponibles?.length ? usuario.diasDisponibles : [0, 2, 4]);
  const [horas, setHoras] = useState<number>(usuario?.horasSemana ?? 8);
  const [pruebas, setPruebas] = useState<string[]>(usuario?.pruebasObjetivo?.length ? usuario.pruebasObjetivo : ['M1', 'CL']);

  const guardarMeta = useGuardarMeta();
  const guardarDisp = useGuardarDisponibilidad();
  const generar = useGenerarPlan();
  const omitir = useOmitirOnboarding();

  const elegirCarrera = (c: DTOCarrera) => {
    setCarrera(c);
    setOferta(null);
    setPuntajePropio(c.puntajeReferencia ? String(c.puntajeReferencia) : '');
  };
  const elegirOferta = (o: DTOOferta) => {
    setOferta({ universidadId: o.universidad.id, nombre: o.universidad.nombre, corte: o.puntajeCorte });
    setPuntajePropio(String(o.puntajeCorte));
  };

  const puntajeRef = oferta?.corte || carrera?.puntajeReferencia || null;
  const puntajeNum = Number(puntajePropio);
  const puntajeInvalido = puntajePropio !== '' && (!Number.isInteger(puntajeNum) || puntajeNum < 100 || puntajeNum > 1000);

  async function continuarMeta() {
    if (!carrera) return setPaso(2);
    if (puntajeInvalido) return;
    try {
      await guardarMeta.mutateAsync({
        carreraId: carrera.id,
        universidadId: oferta?.universidadId ?? null,
        puntajeMeta: puntajePropio ? puntajeNum : undefined,
      });
      setPaso(2);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  async function generarPlan() {
    try {
      await guardarDisp.mutateAsync({ horasSemana: horas, diasDisponibles: dias, pruebasObjetivo: pruebas });
      await generar.mutateAsync();
      navigate('/onboarding/plan');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  async function omitirTodo() {
    try {
      await omitir.mutateAsync();
      await recargarUsuario();
      toast.success('Te armamos un plan base. Puedes ajustar tu meta cuando quieras desde tu perfil.');
      navigate('/app', { replace: true });
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  const atras =
    paso > 1 ? (
      <Button variante="fantasma" iconoIzquierdo="arrow_back" onClick={() => setPaso((p) => p - 1)}>
        Atrás
      </Button>
    ) : (
      <Button variante="fantasma" onClick={omitirTodo} cargando={omitir.isPending}>
        Configurar después
      </Button>
    );

  if (paso === 1) {
    return (
      <MarcoOnboarding
        paso={1}
        total={TOTAL}
        acciones={
          <>
            {atras}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {!carrera && (
                <Button variante="secundario" onClick={() => setPaso(2)}>
                  Omitir por ahora
                </Button>
              )}
              <Button
                tamano="lg"
                iconoDerecho="arrow_forward"
                disabled={!carrera || puntajeInvalido}
                cargando={guardarMeta.isPending}
                onClick={continuarMeta}
              >
                Continuar
              </Button>
            </div>
          </>
        }
      >
        <TituloPaso
          titulo="¿Cuál es tu meta?"
          descripcion="Cuéntanos a qué carrera y universidad quieres entrar. Con eso calculamos cuánto te falta y armamos tu plan de estudio."
        />
        <Combobox
          label="Buscar carrera"
          labelOculto
          placeholder="Ej.: Ingeniería Comercial, Medicina, Derecho…"
          valor={null}
          onSeleccionar={(o) => {
            const c = carreras.data?.find((x) => x.id === o?.id);
            if (c) elegirCarrera(c);
          }}
          opciones={(carreras.data ?? []).map((c) => ({
            id: c.id,
            etiqueta: c.nombre,
            detalle: [c.area, c.puntajeReferencia ? `ref. ${c.puntajeReferencia} pts` : null].filter(Boolean).join(' · '),
          }))}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          cargando={carreras.isFetching}
          vacio="No encontramos esa carrera. Prueba con otra palabra."
        />
        <CarrerasPopulares
          carreras={(populares.data ?? []).filter((c) => c.popular)}
          cargando={populares.isLoading}
          seleccionada={carrera?.id ?? null}
          onElegir={elegirCarrera}
        />

        {carrera && (
          <>
            <ListaOfertas
              ofertas={ofertas.data ?? []}
              cargando={ofertas.isLoading}
              error={ofertas.isError}
              seleccionada={oferta?.universidadId ?? null}
              onElegir={elegirOferta}
            />
            <MetaSeleccionada
              carrera={carrera}
              universidad={oferta?.nombre ?? null}
              puntaje={puntajeRef}
              onQuitar={() => {
                setCarrera(null);
                setOferta(null);
                setPuntajePropio('');
              }}
            />
            <Input
              contenedorClassName="mt-6 max-w-xs"
              label="Tu puntaje meta"
              type="number"
              inputMode="numeric"
              min={100}
              max={1000}
              step={1}
              value={puntajePropio}
              onChange={(e) => setPuntajePropio(e.target.value)}
              hint="Escala PAES de 100 a 1000. Puedes apuntar más alto que el corte."
              error={puntajeInvalido ? 'Ingresa un número entero entre 100 y 1000' : undefined}
            />
          </>
        )}
      </MarcoOnboarding>
    );
  }

  if (paso === 2) {
    return (
      <MarcoOnboarding
        paso={2}
        total={TOTAL}
        acciones={
          <>
            {atras}
            <Button tamano="lg" iconoDerecho="arrow_forward" disabled={dias.length === 0} onClick={() => setPaso(3)}>
              Continuar
            </Button>
          </>
        }
      >
        <TituloPaso
          titulo="¿Cuándo puedes estudiar?"
          descripcion="Repartimos tus sesiones solo en los días que marques. Lo puedes cambiar después desde tu plan."
        />
        <SelectorDias dias={dias} onCambio={setDias} />
        <SelectorHoras horas={horas} onCambio={setHoras} dias={dias.length} />
      </MarcoOnboarding>
    );
  }

  const generando = guardarDisp.isPending || generar.isPending;
  return (
    <MarcoOnboarding
      paso={3}
      total={TOTAL}
      acciones={
        <>
          {atras}
          <Button
            tamano="lg"
            iconoDerecho="auto_awesome"
            disabled={pruebas.length === 0}
            cargando={generando}
            textoCargando="Armando tu plan…"
            onClick={generarPlan}
          >
            Generar mi plan
          </Button>
        </>
      }
    >
      <TituloPaso
        titulo="¿Qué pruebas rendirás?"
        descripcion="Damos más horas a las pruebas donde tienes más brecha con tu meta y más peso en tu carrera."
      />
      <SelectorPruebas pruebas={pruebas} onCambio={setPruebas} />
    </MarcoOnboarding>
  );
}
