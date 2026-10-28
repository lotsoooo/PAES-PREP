import { forwardRef, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { useSubirImagen } from '@/lib/data/comunidad';
import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Datos';
import { TextoMat } from '@/components/contenido/TextoMat';
import { CuerpoRico } from './CuerpoRico';

export interface PropsEditor {
  id: string;
  label: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  maximo?: number;
  placeholder?: string;
}

type Modo = 'escribir' | 'vista';

/**
 * Editor enriquecido sobre Markdown: la barra inserta la sintaxis en el
 * cursor, así lo que se publica es texto portable (y seguro: sin HTML).
 */
export const EditorMarkdown = forwardRef<HTMLTextAreaElement, PropsEditor>(function EditorMarkdown(
  { id, label, valor, onCambio, error, maximo = 8000, placeholder },
  ref,
) {
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => area.current!, []);
  const [modo, setModo] = useState<Modo>('escribir');
  const [formula, setFormula] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const subir = useSubirImagen();

  /** Reemplaza la selección por `antes + seleccion + despues` y deja el cursor en su lugar. */
  const envolver = (antes: string, despues = '', porDefecto = '') => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: ini, selectionEnd: fin } = el;
    const seleccion = valor.slice(ini, fin) || porDefecto;
    const nuevo = valor.slice(0, ini) + antes + seleccion + despues + valor.slice(fin);
    onCambio(nuevo.slice(0, maximo));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + antes.length, ini + antes.length + seleccion.length);
    });
  };

  /** Antepone un prefijo a cada línea seleccionada (listas). */
  const prefijarLineas = (prefijo: (i: number) => string) => {
    const el = area.current;
    if (!el) return;
    const ini = valor.lastIndexOf('\n', el.selectionStart - 1) + 1;
    const finLinea = valor.indexOf('\n', el.selectionEnd);
    const fin = finLinea === -1 ? valor.length : finLinea;
    const bloque = valor.slice(ini, fin) || 'Elemento';
    const conPrefijo = bloque
      .split('\n')
      .map((l, i) => prefijo(i) + l.replace(/^(\s*[-*]\s|\s*\d+\.\s)/, ''))
      .join('\n');
    const separador = ini > 0 && valor[ini - 1] !== '\n' ? '\n' : '';
    onCambio((valor.slice(0, ini) + separador + conPrefijo + valor.slice(fin)).slice(0, maximo));
    requestAnimationFrame(() => el.focus());
  };

  const insertar = (texto: string) => envolver(texto);

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'b') {
      e.preventDefault();
      envolver('**', '**', 'texto');
    } else if (k === 'i') {
      e.preventDefault();
      envolver('*', '*', 'texto');
    } else if (k === 'u') {
      e.preventDefault();
      envolver('++', '++', 'texto');
    }
  };

  const alElegirImagen = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Elige una imagen (JPG, PNG o WebP).');
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      toast.error('La imagen pesa más de 4 MB. Prueba con una más liviana.');
      return;
    }
    subir.mutate(f, {
      onSuccess: ({ url }) => {
        insertar(`\n![${f.name.replace(/\.[^.]+$/, '')}](${url})\n`);
        toast.success('Imagen agregada');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const herramientas = [
    { icono: 'format_bold', etiqueta: 'Negrita (Ctrl+B)', accion: () => envolver('**', '**', 'texto') },
    { icono: 'format_italic', etiqueta: 'Cursiva (Ctrl+I)', accion: () => envolver('*', '*', 'texto') },
    { icono: 'format_underlined', etiqueta: 'Subrayado (Ctrl+U)', accion: () => envolver('++', '++', 'texto') },
    { icono: 'format_list_bulleted', etiqueta: 'Lista', accion: () => prefijarLineas(() => '- ') },
    { icono: 'format_list_numbered', etiqueta: 'Lista numerada', accion: () => prefijarLineas((i) => `${i + 1}. `) },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label-md font-medium text-on-surface">
        {label}
      </label>
      <div
        className={cn(
          'overflow-hidden rounded border bg-surface-container-lowest transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25',
          error ? 'border-error' : 'border-border-strong',
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-container-low px-2 py-1.5">
          <div role="toolbar" aria-label="Formato" aria-controls={id} className="flex flex-wrap items-center gap-0.5">
            {herramientas.map((h) => (
              <Tooltip key={h.icono} texto={h.etiqueta}>
                <button
                  type="button"
                  onClick={h.accion}
                  disabled={modo === 'vista'}
                  aria-label={h.etiqueta}
                  className="flex size-10 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                >
                  <Icono nombre={h.icono} />
                </button>
              </Tooltip>
            ))}
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-outline-variant" />
            <button
              type="button"
              onClick={() => setFormula(true)}
              disabled={modo === 'vista'}
              className="inline-flex min-h-10 items-center gap-1.5 rounded px-3 text-label-md font-medium text-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
            >
              <Icono nombre="function" />
              Fórmula
            </button>
            <button
              type="button"
              onClick={() => archivo.current?.click()}
              disabled={modo === 'vista' || subir.isPending}
              className="inline-flex min-h-10 items-center gap-1.5 rounded px-3 text-label-md font-medium text-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
            >
              <Icono nombre={subir.isPending ? 'progress_activity' : 'image'} className={cn(subir.isPending && 'animate-spin')} />
              {subir.isPending ? 'Subiendo…' : 'Imagen'}
            </button>
            <input
              ref={archivo}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                alElegirImagen(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          <div className="ml-auto flex rounded bg-surface-container p-0.5" role="group" aria-label="Modo del editor">
            {(['escribir', 'vista'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => setModo(m)}
                className={cn(
                  'min-h-9 rounded-sm px-3 text-label-md font-medium transition-colors',
                  modo === m ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {m === 'escribir' ? 'Escribir' : 'Vista previa'}
              </button>
            ))}
          </div>
        </div>

        <textarea
          ref={area}
          id={id}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onKeyDown={alTeclear}
          maxLength={maximo}
          rows={12}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-ayuda`}
          hidden={modo === 'vista'}
          className="block min-h-64 w-full resize-y bg-transparent px-4 py-3 text-body-md leading-relaxed text-on-surface placeholder:text-outline focus:outline-none"
        />
        {modo === 'vista' && (
          <div className="min-h-64 px-4 py-3" aria-live="polite">
            {valor.trim() ? (
              <CuerpoRico texto={valor} className="text-body-md text-on-surface" />
            ) : (
              <p className="text-body-md text-on-surface-variant">Nada que mostrar todavía. Escribe algo y vuelve a esta pestaña.</p>
            )}
          </div>
        )}
      </div>
      <div id={`${id}-ayuda`} className="flex items-start justify-between gap-3 text-caption" aria-live="polite">
        {error ? (
          <p className="flex items-start gap-1 text-error">
            <Icono nombre="error" className="text-base leading-4" />
            {error}
          </p>
        ) : (
          <p className="text-on-surface-variant">
            Usa <code className="font-mono">$x^2$</code> para fórmulas y <code className="font-mono">#etiqueta</code> para que te encuentren.
          </p>
        )}
        <span className="shrink-0 tabular-nums text-on-surface-variant">
          {valor.length.toLocaleString('es-CL')}/{maximo.toLocaleString('es-CL')}
        </span>
      </div>

      <ModalFormula
        abierto={formula}
        onCerrar={() => setFormula(false)}
        onInsertar={(latex, bloque) => {
          setFormula(false);
          insertar(bloque ? `\n$$${latex}$$\n` : `$${latex}$`);
        }}
      />
    </div>
  );
});

const EJEMPLOS = ['\\frac{a}{b}', 'x^2 + y^2 = r^2', '\\sqrt{2}', 'P(A \\mid B)', '\\binom{n}{k}'];

function ModalFormula({
  abierto,
  onCerrar,
  onInsertar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onInsertar: (latex: string, bloque: boolean) => void;
}) {
  const [latex, setLatex] = useState('');
  const [bloque, setBloque] = useState(false);
  const limpio = latex.trim();
  return (
    <Modal
      abierto={abierto}
      onAbiertoChange={(v) => !v && onCerrar()}
      titulo="Insertar fórmula"
      descripcion="Escribe en LaTeX. La vista previa muestra cómo se verá en la publicación."
      pie={
        <>
          <Button variante="fantasma" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            disabled={!limpio}
            onClick={() => {
              onInsertar(limpio, bloque);
              setLatex('');
            }}
            iconoIzquierdo="add"
          >
            Insertar
          </Button>
        </>
      }
    >
      <Input
        id="latex-formula"
        label="Fórmula"
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        placeholder="\frac{1}{2} x^2"
        autoComplete="off"
        spellCheck={false}
        className="font-mono"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EJEMPLOS.map((ej) => (
          <button
            key={ej}
            type="button"
            onClick={() => setLatex(ej)}
            className="inline-flex min-h-9 items-center rounded-full bg-surface-container px-3 text-label-md text-on-surface-variant hover:bg-surface-container-high"
            aria-label={`Usar ejemplo ${ej}`}
          >
            <TextoMat texto={`$${ej}$`} modo="linea" />
          </button>
        ))}
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-body-md text-on-surface">
        <input type="checkbox" checked={bloque} onChange={(e) => setBloque(e.target.checked)} className="size-5 accent-[var(--color-primary)]" />
        Mostrar en su propia línea (centrada)
      </label>
      <div className="mt-4 rounded-md bg-surface-container-low p-4" aria-live="polite">
        <p className="text-caption text-on-surface-variant">Vista previa</p>
        <div className="mt-2 min-h-10 text-body-lg text-on-surface">
          {limpio ? <TextoMat texto={bloque ? `$$${limpio}$$` : `$${limpio}$`} /> : <span className="text-on-surface-variant">—</span>}
        </div>
      </div>
    </Modal>
  );
}
