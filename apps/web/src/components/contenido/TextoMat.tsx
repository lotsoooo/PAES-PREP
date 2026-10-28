import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/cn';

/**
 * Sanitiza el Markdown del usuario ANTES de KaTeX: así el HTML de KaTeX (que
 * generamos nosotros) no se filtra, y el del usuario sí. remark-math deja las
 * fórmulas como `code.math-inline` / `code.math-display`.
 */
const esquema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./, 'math-inline', 'math-display']],
  },
};

export interface PropsTextoMat {
  /** Markdown con fórmulas en `$…$` (en línea) o `$$…$$` (bloque). */
  texto: string;
  /** `bloque` admite párrafos y listas; `linea` lo renderiza dentro de un span. */
  modo?: 'bloque' | 'linea';
  className?: string;
}

/**
 * Texto con matemática (KaTeX) para enunciados, alternativas, explicaciones,
 * lecciones y publicaciones. Nunca muestra LaTeX crudo.
 */
export const TextoMat = memo(function TextoMat({ texto, modo = 'bloque', className }: PropsTextoMat) {
  const plugins = { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [[rehypeSanitize, esquema], rehypeKatex] as never };
  if (modo === 'linea') {
    return (
      <span className={cn('texto-mat [&_p]:inline', className)}>
        <ReactMarkdown {...plugins} components={{ p: ({ children }) => <>{children}</> }}>
          {texto}
        </ReactMarkdown>
      </span>
    );
  }
  return (
    <div className={cn('texto-mat', className)}>
      <ReactMarkdown {...plugins}>{texto}</ReactMarkdown>
    </div>
  );
});
