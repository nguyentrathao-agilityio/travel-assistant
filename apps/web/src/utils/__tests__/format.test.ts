import {
  formatDuration,
  formatPrice,
  formatRelativeTime,
  formatTime,
  formatDateRange,
} from '@/utils/format';

describe('formatDuration', () => {
  it('formats minutes only when under 1 hour', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats whole hours with no minutes', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes together', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('handles 0 minutes', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('handles exactly 1 hour', () => {
    expect(formatDuration(60)).toBe('1h');
  });
});

describe('formatPrice', () => {
  it('formats USD with currency symbol', () => {
    expect(formatPrice(1200, 'USD')).toBe('$1,200');
  });

  it('formats large numbers with thousand separators', () => {
    expect(formatPrice(10000, 'USD')).toBe('$10,000');
  });

  it('formats EUR', () => {
    expect(formatPrice(500, 'EUR')).toBe('€500');
  });
});

describe('formatTime', () => {
  it('extracts HH:MM from ISO datetime', () => {
    expect(formatTime('2026-06-10T14:35:00Z')).toBe('14:35');
  });

  it('returns original string when no T separator', () => {
    expect(formatTime('14:35')).toBe('14:35');
  });
});

describe('formatDateRange', () => {
  it('formats check-in and check-out as range', () => {
    const result = formatDateRange('2026-06-10', '2026-06-17');
    expect(result).toBe('Jun 10 - Jun 17');
  });
});

describe('formatRelativeTime', () => {
  it('returns "Just now" for timestamps under 1 minute ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
  });

  it('returns minutes for timestamps under 1 hour ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('returns hours for timestamps under 24 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days for timestamps under 7 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});
