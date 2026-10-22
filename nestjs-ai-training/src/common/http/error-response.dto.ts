import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ErrorResponseBody } from './api-exception.filter.js';
import type { FieldError } from './validation-failed.exception.js';

// Documentation-only classes for the `{ errors }` envelope.
export class FieldErrorDto implements FieldError {
  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ example: 'email must be an email' })
  description: string;
}

export class ErrorDto {
  @ApiProperty({
    enum: [
      'BAD_REQUEST',
      'VALIDATION_FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'INTERNAL_SERVER_ERROR',
    ],
    example: 'VALIDATION_FAILED',
  })
  code: string;

  @ApiProperty({ example: 'The provided data is invalid.' })
  message: string;

  @ApiPropertyOptional({
    type: [FieldErrorDto],
    description: 'Only for VALIDATION_FAILED',
  })
  details?: FieldErrorDto[];
}

export class ErrorResponseDto implements ErrorResponseBody {
  @ApiProperty({ type: ErrorDto })
  errors: ErrorDto;
}
