import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from '../http/error-response.dto.js';
import { PaginationMetaDto } from '../http/pagination-meta.dto.js';

// Documents a `{ data: Model }` response.
export function ApiDataResponse(
  model: Type<unknown>,
  options: { status?: number; description?: string } = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: options.status ?? HttpStatus.OK,
      description: options.description,
      schema: {
        type: 'object',
        required: ['data'],
        properties: { data: { $ref: getSchemaPath(model) } },
      },
    }),
  );
}

// Documents a paginated `{ meta, data: Model[] }` response.
export function ApiListResponse(model: Type<unknown>, description?: string) {
  return applyDecorators(
    ApiExtraModels(PaginationMetaDto, model),
    ApiResponse({
      status: HttpStatus.OK,
      description,
      schema: {
        type: 'object',
        required: ['meta', 'data'],
        properties: {
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
        },
      },
    }),
  );
}

// Documents an error status with the `{ errors }` envelope.
export function ApiErrorResponse(status: number, description: string) {
  return ApiResponse({ status, description, type: ErrorResponseDto });
}
