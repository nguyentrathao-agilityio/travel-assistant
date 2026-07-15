import { SEED_DATA } from '../data/seed-data';

export type SeedDoc = {
  filename: string;
  content: string;
};

export const RAG_SEED_DOCS: SeedDoc[] = [
  {
    filename: 'travel-guide.txt',
    content: SEED_DATA,
  },
];
