export const threadQueryKeys = {
  all: ['threads'] as const,
  recent: (limit: number) => [...threadQueryKeys.all, 'recent', limit] as const,
  list: () => [...threadQueryKeys.all, 'list'] as const,
  history: (threadId: string) => [...threadQueryKeys.all, 'history', threadId] as const,
};
