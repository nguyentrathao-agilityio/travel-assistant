import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto.js';

function parse(query: Record<string, string>) {
  const dto = plainToInstance(PaginationQueryDto, query);
  return { dto, errors: validateSync(dto).map((e) => e.property) };
}

describe('PaginationQueryDto', () => {
  it('defaults to page 1 and limit 10', () => {
    const { dto, errors } = parse({});

    expect(errors).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('converts query strings to numbers', () => {
    const { dto, errors } = parse({ page: '3', limit: '100' });

    expect(errors).toEqual([]);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(100);
  });

  it.each([
    ['limit', '0'],
    ['limit', '101'],
    ['limit', '2.5'],
    ['limit', 'abc'],
    ['page', '0'],
    ['page', '-1'],
    ['page', '1.5'],
  ])('rejects %s=%s', (field, value) => {
    expect(parse({ [field]: value }).errors).toEqual([field]);
  });
});
