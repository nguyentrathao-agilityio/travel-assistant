import type { ThreadItem } from '../services';

export interface ThreadSection {
  title: string;
  data: ThreadItem[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SECTION_TITLES = ['Today', 'Yesterday', 'Last 7 Days', 'Older'] as const;

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
    Today: [],
    Yesterday: [],
    'Last 7 Days': [],
    Older: [],
  };

  for (const thread of threads) {
    const daysAgo = todayIndex - dayIndex(thread.createdAt);

    if (daysAgo <= 0) buckets.Today.push(thread);
    else if (daysAgo === 1) buckets.Yesterday.push(thread);
    else if (daysAgo <= 6) buckets['Last 7 Days'].push(thread);
    else buckets.Older.push(thread);
  }

  return SECTION_TITLES.map((title) => ({ title, data: buckets[title] })).filter(
    (section) => section.data.length > 0
  );
};
