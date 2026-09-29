// Types
import type { ThreadItem } from '../services';

export interface ThreadSection {
  title: string;
  data: ThreadItem[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THREAD_SECTION_TITLE = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  LAST_SEVEN_DAYS: 'Last 7 Days',
  OLDER: 'Older',
} as const;
const SECTION_TITLES = Object.values(THREAD_SECTION_TITLE);

const dayIndex = (iso: string): number => {
  const date = new Date(iso);

  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
};

/** Buckets threads by how long ago they were created, relative to `now`. */
export const groupThreadsByDate = (
  threads: ThreadItem[],
  now: Date = new Date()
): ThreadSection[] => {
  const todayIndex = dayIndex(now.toISOString());
  const buckets: Record<(typeof SECTION_TITLES)[number], ThreadItem[]> = {
    [THREAD_SECTION_TITLE.TODAY]: [],
    [THREAD_SECTION_TITLE.YESTERDAY]: [],
    [THREAD_SECTION_TITLE.LAST_SEVEN_DAYS]: [],
    [THREAD_SECTION_TITLE.OLDER]: [],
  };

  for (const thread of threads) {
    const daysAgo = todayIndex - dayIndex(thread.createdAt);

    if (daysAgo <= 0) buckets[THREAD_SECTION_TITLE.TODAY].push(thread);
    else if (daysAgo === 1) buckets[THREAD_SECTION_TITLE.YESTERDAY].push(thread);
    else if (daysAgo <= 6) buckets[THREAD_SECTION_TITLE.LAST_SEVEN_DAYS].push(thread);
    else buckets[THREAD_SECTION_TITLE.OLDER].push(thread);
  }

  return SECTION_TITLES.map((title) => ({ title, data: buckets[title] })).filter(
    (section) => section.data.length > 0
  );
};
