import type { PaginationMetaDto } from './pagination-meta.dto.js';

export type PaginationMeta = PaginationMetaDto;

// Paginated list response envelope.
export interface ListResponse<T> {
  meta: PaginationMeta;
  data: T[];
}

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return { total, totalPages: Math.ceil(total / limit), limit, page };
}
