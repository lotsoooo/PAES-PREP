import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { DTOResultadoBusqueda } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { get, query } from '@/lib/api';
import { ATAJOS_PALETA } from '@/config/navegacion';
import { useAtajo, useDebounce } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';
import { usePaleta } from './paleta';

interface Resultado {
  id: string;
  grupo: string;
  etiqueta: string;
  detalle?: string;
  icono: string;
  to: string;
}

function normalizar(t: string) {
  return t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Buscador global + paleta de comandos (Ctrl/⌘ + K). */
export function PaletaComandos() {
  const { abierta, setAbierta } = usePaleta();
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const navigate = useNavigate();
  const q = useDebounce(texto.trim(), 200);

  useAtajo('k', (e) => {
    e.preventDefault();
    setAbierta(!usePaleta.getState().abierta);
  }, { ctrl: true, enCampos: true });

  const busqueda = useQuery({
    queryKey: ['buscar', q],
    queryFn: () => get<DTOResultadoBusqueda>(`/buscar${query({ q })}`),
    enabled: abierta && q.length >= 2,
    staleTime: 60_000,
  });

  const resultados = useMemo<Resultado[]>(() => {
    const n = normalizar(q);
    const paginas = ATAJOS_PALETA.filter((a) => !n || normalizar(`${a.etiqueta} ${a.palabras}`).includes(n))
      .slice(0, n ? 5 : 8)
      .map((a) => ({ id: `p-${a.to}`, grupo: 'Ir a', etiqueta: a.etiqueta, icono: a.icono, to: a.to }));
    const d = busqueda.data;
    if (!d || q.length < 2) return paginas;
    return [
      ...paginas,
      ...d.ensayos.map((e) => ({
        id: `e-${e.slug}`,
        grupo: 'Ensayos',
        etiqueta: e.titulo,
        detalle: e.premium ? 'Premium' : (MATERIA_ETIQUETA[e.prueba] ?? e.prueba),
        icono: 'assignment',
        to: `/app/ensayos/${e.slug}`,
      })),
      ...d.contenidos.map((c) => ({
        id: `c-${c.slug}`,
        grupo: 'Contenidos',
        etiqueta: c.titulo,
        detalle: MATERIA_ETIQUETA[c.materiaCodigo] ?? c.materiaCodigo,
        icono: 'menu_book',
        to: `/app/contenidos/${c.slug}`,
      })),
      ...d.publicaciones.map((p) => ({
        id: `pub-${p.id}`,
        grupo: 'Comunidad',
        etiqueta: p.titulo,
        icono: 'forum',
        to: `/app/comunidad/${p.id}`,
      })),
    ];
  }, [q, busqueda.data]);

  function ir(r: Resultado) {
    setAbierta(false);
    setTexto('');
    navigate(r.to);
  }

  function alTeclado(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((a) => Math.min(a + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && resultados[activo]) {
      e.preventDefault();
      ir(resultados[activo]);
    }
  }

  let grupoAnterior = '';

  return (
    <Dialog.Root
      open={abierta}
      onOpenChange={(v) => {
        setAbierta(v);
        if (!v) setTexto('');
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="animar-aparecer fixed inset-0 z-50 bg-inverse-surface/45" />
        <Dialog.Content
          className="animar-entrada fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface-container-lowest shadow-float"
          onKeyDown={alTeclado}
        >
          <Dialog.Title className="sr-only">Buscar en PAES Pro</Dialog.Title>
          <Dialog.Description className="sr-only">
            Escribe para buscar ensayos, contenidos, publicaciones o secciones. Usa las flechas y Enter.
          </Dialog.Description>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Icono nombre="search" className="text-on-surface-variant" />
            <input
              autoFocus
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setActivo(0);
              }}
              placeholder="Busca ensayos, contenidos, publicaciones…"
              aria-label="Buscar"
              aria-controls="paleta-resultados"
              autoComplete="off"
              spellCheck={false}
              className="min-h-14 flex-1 bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
            />
            {busqueda.isFetching && <Icono nombre="progress_activity" className="animate-spin text-on-surface-variant" />}
            <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 text-caption text-on-surface-variant sm:block">Esc</kbd>
          </div>
          <ul id="paleta-resultados" role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-y-auto overscroll-contain p-2 scrollbar-fino">
            {resultados.length === 0 && (
              <li className="px-3 py-8 text-center text-body-md text-on-surface-variant">
                {busqueda.isFetching ? 'Buscando…' : `Nada para “${q}”. Prueba con otra palabra.`}
              </li>
            )}
            {resultados.map((r, i) => {
              const titulo = r.grupo !== grupoAnterior ? r.grupo : null;
              grupoAnterior = r.grupo;
              return (
                <li key={r.id} role="presentation">
                  {titulo && <p className="px-3 pb-1 pt-3 text-caption font-medium text-on-surface-variant">{titulo}</p>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activo}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => ir(r)}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-body-md',
                      i === activo ? 'bg-surface-container text-on-surface' : 'text-on-surface',
                    )}
                  >
                    <Icono nombre={r.icono} className="text-on-surface-variant" />
                    <span className="min-w-0 flex-1 truncate">{r.etiqueta}</span>
                    {r.detalle && <span className="shrink-0 text-caption text-on-surface-variant">{r.detalle}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
