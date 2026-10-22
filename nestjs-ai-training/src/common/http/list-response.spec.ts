import { buildMeta } from './list-response.js';

describe('buildMeta', () => {
  it('computes the number of pages', () => {
    expect(buildMeta(21, 2, 10)).toEqual({
      total: 21,
      totalPages: 3,
      limit: 10,
      page: 2,
    });
  });

  it('reports zero pages when there are no items', () => {
    expect(buildMeta(0, 1, 10)).toEqual({
      total: 0,
      totalPages: 0,
      limit: 10,
      page: 1,
    });
  });
});
