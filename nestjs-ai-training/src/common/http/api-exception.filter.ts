import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  type FieldError,
  ValidationFailedException,
} from './validation-failed.exception.js';

export interface ErrorResponseBody {
  errors: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

// Default messages from the API design's "Common errors" section.
const DEFAULT_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Invalid request syntax or missing field',
  [HttpStatus.UNAUTHORIZED]: 'Missing or invalid JWT token',
  [HttpStatus.FORBIDDEN]: 'You do not have permission to perform this action',
  [HttpStatus.NOT_FOUND]: 'Resource not found',
  [HttpStatus.CONFLICT]: 'Resource already exists or conflict state.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

function codeFor(status: number): string {
  return (HttpStatus[status] as string | undefined) ?? `HTTP_${status}`;
}

// Nest only adds `error` to the response when the exception was given an
// explicit message, e.g. `new ConflictException('Email is already registered')`.
function hasExplicitMessage(exception: HttpException): boolean {
  const response = exception.getResponse();
  return (
    typeof response === 'string' ||
    (typeof response === 'object' && 'error' in response)
  );
}

export function toErrorResponse(exception: unknown): {
  status: number;
  body: ErrorResponseBody;
} {
  if (exception instanceof ValidationFailedException) {
    return {
      status: HttpStatus.BAD_REQUEST,
      body: {
        errors: {
          code: 'VALIDATION_FAILED',
          message: exception.message,
          details: exception.details,
        },
      },
    };
  }

  if (!(exception instanceof HttpException)) {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        errors: {
          code: 'INTERNAL_SERVER_ERROR',
          message: DEFAULT_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR]!,
        },
      },
    };
  }

  const status = exception.getStatus();
  const isServerError = status >= 500;
  const message =
    !isServerError && hasExplicitMessage(exception)
      ? exception.message
      : (DEFAULT_MESSAGES[isServerError ? 500 : status] ?? exception.message);

  return { status, body: { errors: { code: codeFor(status), message } } };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
