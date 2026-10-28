import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { urlArchivo } from '@/lib/api';
import { cn } from '@/lib/cn';

/**
 * Cuerpo de publicaciones y comentarios: Markdown + KaTeX como `TextoMat`, más
 * subrayado con `++texto++` (Markdown no lo tiene y no aceptamos HTML crudo) e
 * imágenes subidas al API con carga diferida.
 */

interface NodoMd {
  type: string;
  value?: string;
  children?: NodoMd[];
  data?: { hName?: string };
}

/** remark: `++texto++` → <u>texto</u>, sin depender de HTML crudo. */
function remarkSubrayado() {
  const recorrer = (nodo: NodoMd) => {
    if (!nodo.children) return;
    const hijos: NodoMd[] = [];
    for (const hijo of nodo.children) {
      if (hijo.type === 'text' && hijo.value?.includes('++')) {
        const partes = hijo.value.split(/\+\+([^+\n]+?)\+\+/g);
        partes.forEach((p, i) => {
          if (!p) return;
          hijos.push(i % 2 === 1 ? { type: 'subrayado', data: { hName: 'u' }, children: [{ type: 'text', value: p }] } : { type: 'text', value: p });
        });
      } else {
        recorrer(hijo);
        hijos.push(hijo);
      }
    }
    nodo.children = hijos;
  };
  return (arbol: NodoMd) => recorrer(arbol);
}

const esquema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./, 'math-inline', 'math-display']],
  },
};

export const CuerpoRico = memo(function CuerpoRico({ texto, className }: { texto: string; className?: string }) {
  return (
    <div className={cn('texto-mat break-words', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkSubrayado]}
        rehypePlugins={[[rehypeSanitize, esquema], rehypeKatex] as never}
        components={{
          img: ({ src, alt }) => (
            <img
              src={urlArchivo(typeof src === 'string' ? src : null) ?? undefined}
              alt={alt ?? 'Imagen adjunta'}
              loading="lazy"
              decoding="async"
              className="my-2 max-h-96 rounded-md border border-border object-contain"
            />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
});
