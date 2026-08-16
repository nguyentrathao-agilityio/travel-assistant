import { groupThreadsByDate, isCurrentThread } from '@/utils/thread';
import type { ThreadItem } from '@/stores/threadStore';

const makeThread = (overrides: Partial<ThreadItem> = {}): ThreadItem => ({
  id: 'thread-1',
  title: 'Test Thread',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const localDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

describe('groupThreadsByDate', () => {
  it('places a thread created today in the today group', () => {
    const thread = makeThread({ createdAt: localDate(0) });
    const groups = groupThreadsByDate([thread]);
    expect(groups.today).toHaveLength(1);
    expect(groups.yesterday).toHaveLength(0);
    expect(groups.older).toHaveLength(0);
  });

  it('places a thread created yesterday in the yesterday group', () => {
    const thread = makeThread({ createdAt: localDate(-1) });
    const groups = groupThreadsByDate([thread]);
    expect(groups.yesterday).toHaveLength(1);
    expect(groups.today).toHaveLength(0);
  });

  it('places a thread older than yesterday in the older group', () => {
    const thread = makeThread({ createdAt: localDate(-2) });
    const groups = groupThreadsByDate([thread]);
    expect(groups.older).toHaveLength(1);
  });

  it('returns all empty groups for an empty array', () => {
    const groups = groupThreadsByDate([]);
    expect(groups.today).toHaveLength(0);
    expect(groups.yesterday).toHaveLength(0);
    expect(groups.older).toHaveLength(0);
  });

  it('distributes multiple threads into correct groups', () => {
    const threads = [
      makeThread({ id: '1', createdAt: localDate(0) }),
      makeThread({ id: '2', createdAt: localDate(-1) }),
      makeThread({ id: '3', createdAt: localDate(-3) }),
      makeThread({ id: '4', createdAt: localDate(-5) }),
    ];
    const groups = groupThreadsByDate(threads);
    expect(groups.today).toHaveLength(1);
    expect(groups.yesterday).toHaveLength(1);
    expect(groups.older).toHaveLength(2);
  });
});

describe('isCurrentThread', () => {
  it('returns true when the data thread id matches the active thread id', () => {
    expect(isCurrentThread('thread-1', 'thread-1')).toBe(true);
  });

  it('returns false when the data thread id differs from the active thread id', () => {
    expect(isCurrentThread('thread-1', 'thread-2')).toBe(false);
  });

  it('returns false when either id is null', () => {
    expect(isCurrentThread(null, 'thread-1')).toBe(false);
    expect(isCurrentThread('thread-1', null)).toBe(false);
  });

  it('returns true when both ids are null', () => {
    expect(isCurrentThread(null, null)).toBe(true);
  });
});
