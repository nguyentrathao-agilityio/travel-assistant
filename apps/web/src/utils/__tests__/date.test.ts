import { todayClientIso, clientTimezone } from '@/utils/date';

describe('todayClientIso', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(todayClientIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's local date", () => {
    expect(todayClientIso()).toBe(new Date().toLocaleDateString('sv'));
  });

  it('returns the correct date for a specific mocked time', () => {
    const mockDate = new Date('2026-06-15T10:00:00');

    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);
    expect(todayClientIso()).toBe('2026-06-15');
    jest.restoreAllMocks();
  });
});

describe('clientTimezone', () => {
  it('returns a non-empty string', () => {
    expect(typeof clientTimezone()).toBe('string');
    expect(clientTimezone().length).toBeGreaterThan(0);
  });

  it('returns a valid IANA timezone format', () => {
    expect(clientTimezone()).toMatch(/^[A-Za-z]+(?:\/[A-Za-z_]+)*$/);
  });

  it('matches Intl.DateTimeFormat resolved timezone', () => {
    expect(clientTimezone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});
