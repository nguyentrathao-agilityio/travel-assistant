import { cn } from '@/utils/cn';

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('merges multiple classes', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('deduplicates conflicting Tailwind classes — last one wins', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('removes falsy values', () => {
    expect(cn('px-4', false, null, undefined, 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional class objects', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold');
  });

  it('handles arrays of classes', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
  });

  it('returns empty string for no valid classes', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
