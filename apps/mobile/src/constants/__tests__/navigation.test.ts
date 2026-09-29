import { DASHBOARD_THREAD_TAG, THREADS_THREAD_TAG } from '../navigation';

describe('navigation thread tags', () => {
  it('exposes stable tags for thread creation sources', () => {
    expect(DASHBOARD_THREAD_TAG).toBe('dashboard');
    expect(THREADS_THREAD_TAG).toBe('threads');
  });
});
