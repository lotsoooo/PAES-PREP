import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Los tamaños de Academic Velocity son tokens propios. Sin declararlos,
// tailwind-merge interpreta text-body-md como color y elimina text-on-primary.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'headline-lg', 'headline-lg-mobile', 'headline-md', 'body-lg', 'body-md', 'label-md', 'caption'] }],
    },
  },
});

/** Combina clases resolviendo conflictos de Tailwind (la última gana). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
