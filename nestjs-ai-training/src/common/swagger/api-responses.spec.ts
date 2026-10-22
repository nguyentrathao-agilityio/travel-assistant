import { Controller, Get, type INestApplication } from '@nestjs/common';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import {
  ApiDataResponse,
  ApiErrorResponse,
  ApiListResponse,
} from './api-responses.js';

class ItemDto {
  @ApiProperty()
  name: string;
}

@Controller('items')
class ItemsController {
  @Get()
  @ApiListResponse(ItemDto, 'Items, newest first')
  list(): void {}

  @Get('one')
  @ApiDataResponse(ItemDto, { status: 201, description: 'Created item' })
  @ApiErrorResponse(404, 'Item not found')
  one(): void {}
}

describe('Swagger response decorators', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ItemsController],
    }).compile();
    app = moduleRef.createNestApplication();
    document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
  });

  afterAll(async () => {
    await app.close();
  });

  const responses = (path: string) => document.paths[path].get!.responses;

  it('wraps a single item in { data }', () => {
    expect(responses('/items/one')['201']).toEqual({
      description: 'Created item',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['data'],
            properties: { data: { $ref: '#/components/schemas/ItemDto' } },
          },
        },
      },
    });
  });

  it('wraps a list in { meta, data }', () => {
    expect(responses('/items')['200']).toEqual({
      description: 'Items, newest first',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['meta', 'data'],
            properties: {
              meta: { $ref: '#/components/schemas/PaginationMetaDto' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/ItemDto' },
              },
            },
          },
        },
      },
    });
  });

  it('documents errors with the error envelope', () => {
    expect(responses('/items/one')['404']).toEqual({
      description: 'Item not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponseDto' },
        },
      },
    });
  });

  it('registers the envelope schemas', () => {
    const schemas = document.components!.schemas!;

    expect(schemas.PaginationMetaDto).toMatchObject({
      required: ['total', 'totalPages', 'limit', 'page'],
    });
    expect(schemas.ErrorResponseDto).toMatchObject({
      required: ['errors'],
      properties: { errors: { $ref: '#/components/schemas/ErrorDto' } },
    });
    expect(schemas.ErrorDto).toMatchObject({
      required: ['code', 'message'],
      properties: {
        details: {
          type: 'array',
          items: { $ref: '#/components/schemas/FieldErrorDto' },
        },
      },
    });
    expect(schemas.FieldErrorDto).toMatchObject({
      required: ['field', 'description'],
    });
  });
});
