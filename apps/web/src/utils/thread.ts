import type { DateGroupKey } from '@/constants';
import type { ThreadItem } from '@/stores/threadStore';

export type ThreadGroups = Record<DateGroupKey, ThreadItem[]>;

const toLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export const groupThreadsByDate = (threads: ThreadItem[]): ThreadGroups => {
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const yesterdayKey = toLocalDateKey(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  );

  const groups: ThreadGroups = { today: [], yesterday: [], older: [] };

  for (const thread of threads) {
    const key = toLocalDateKey(new Date(thread.createdAt));
    if (key === todayKey) {
      groups.today.push(thread);
    } else if (key === yesterdayKey) {
      groups.yesterday.push(thread);
    } else {
      groups.older.push(thread);
    }
  }

  return groups;
};
