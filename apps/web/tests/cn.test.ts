import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/cn';

describe('tokens tipográficos de Academic Velocity', () => {
  it('conserva el color accesible junto al tamaño del texto en cualquier orden', () => {
    for (const size of ['display', 'headline-lg', 'headline-lg-mobile', 'headline-md', 'body-lg', 'body-md', 'label-md', 'caption']) {
      expect(cn('text-on-primary', `text-${size}`)).toBe(`text-on-primary text-${size}`);
      expect(cn(`text-${size}`, 'text-on-primary')).toBe(`text-${size} text-on-primary`);
    }
  });

  it('resuelve por separado las variantes de tamaño y color', () => {
    expect(cn('text-body-md text-on-primary', 'text-label-md text-error')).toBe('text-label-md text-error');
    expect(cn('md:text-body-md md:text-primary', 'md:text-caption')).toBe('md:text-primary md:text-caption');
  });
});
