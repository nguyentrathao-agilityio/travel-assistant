import { getAmenityIcon, getAmenityColor, getRatingColor } from '@/utils/amenities';

describe('getAmenityIcon', () => {
  it('returns an icon for "wifi"', () => {
    expect(getAmenityIcon('wifi')).not.toBeNull();
  });

  it('returns an icon for "free wifi" (phrase match)', () => {
    expect(getAmenityIcon('free wifi')).not.toBeNull();
  });

  it('is case-insensitive', () => {
    expect(getAmenityIcon('WiFi')).not.toBeNull();
  });

  it('trims whitespace', () => {
    expect(getAmenityIcon('  pool  ')).not.toBeNull();
  });

  it('returns null for an unknown amenity', () => {
    expect(getAmenityIcon('unknown-amenity')).toBeNull();
  });

  it('returns same icon for "pool" and "swimming pool"', () => {
    expect(getAmenityIcon('pool')).toBe(getAmenityIcon('swimming pool'));
  });
});

describe('getAmenityColor', () => {
  it('returns a non-empty CSS class string', () => {
    expect(getAmenityColor('wifi', 0).length).toBeGreaterThan(0);
  });

  it('cycles through colors — index 0 and index 5 return the same class', () => {
    expect(getAmenityColor('wifi', 0)).toBe(getAmenityColor('wifi', 5));
  });

  it('returns different colors for consecutive indices', () => {
    expect(getAmenityColor('wifi', 0)).not.toBe(getAmenityColor('wifi', 1));
  });
});

describe('getRatingColor', () => {
  it('returns success classes for rating >= 4.5', () => {
    const { bgClass, textClass } = getRatingColor(4.8);
    expect(bgClass).toContain('success');
    expect(textClass).toContain('success');
  });

  it('returns secondary classes for rating >= 4 and < 4.5', () => {
    const { bgClass } = getRatingColor(4.2);
    expect(bgClass).toContain('secondary');
  });

  it('returns primary classes for rating >= 3.5 and < 4', () => {
    const { bgClass } = getRatingColor(3.7);
    expect(bgClass).toContain('primary');
  });

  it('returns warning classes for rating >= 3 and < 3.5', () => {
    const { bgClass } = getRatingColor(3.2);
    expect(bgClass).toContain('warning');
  });

  it('returns danger classes for rating < 3', () => {
    const { bgClass } = getRatingColor(2.5);
    expect(bgClass).toContain('danger');
  });

  it('returns success classes at exactly 4.5', () => {
    const { bgClass } = getRatingColor(4.5);
    expect(bgClass).toContain('success');
  });
});
