import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { toErrorResponse } from './api-exception.filter.js';
import { ValidationFailedException } from './validation-failed.exception.js';

describe('toErrorResponse', () => {
  it('maps validation failures to 400 VALIDATION_FAILED with details', () => {
    const details = [{ field: 'email', description: 'email must be an email' }];

    expect(toErrorResponse(new ValidationFailedException(details))).toEqual({
      status: 400,
      body: {
        errors: {
          code: 'VALIDATION_FAILED',
          message: 'The provided data is invalid.',
          details,
        },
      },
    });
  });

  it.each([
    [new BadRequestException(), 400, 'BAD_REQUEST'],
    [new UnauthorizedException(), 401, 'UNAUTHORIZED'],
    [new ForbiddenException(), 403, 'FORBIDDEN'],
    [new NotFoundException(), 404, 'NOT_FOUND'],
    [new ConflictException(), 409, 'CONFLICT'],
    [new PayloadTooLargeException(), 413, 'PAYLOAD_TOO_LARGE'],
  ])('maps %s to its status and code', (exception, status, code) => {
    const result = toErrorResponse(exception);

    expect(result.status).toBe(status);
    expect(result.body.errors.code).toBe(code);
    expect(result.body.errors).not.toHaveProperty('details');
  });

  it.each([
    [new UnauthorizedException(), 'Missing or invalid JWT token'],
    [
      new ForbiddenException(),
      'You do not have permission to perform this action',
    ],
    [new NotFoundException(), 'Resource not found'],
    [new ConflictException(), 'Resource already exists or conflict state.'],
  ])('uses the documented default message for %s', (exception, message) => {
    expect(toErrorResponse(exception).body.errors.message).toBe(message);
  });

  it('keeps an explicit message from the code', () => {
    const result = toErrorResponse(
      new ConflictException('Email is already registered'),
    );

    expect(result.body.errors.message).toBe('Email is already registered');
  });

  it('hides details of unexpected errors behind a generic 500', () => {
    const result = toErrorResponse(new Error('db password is hunter2'));

    expect(result).toEqual({
      status: 500,
      body: {
        errors: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal Server Error',
        },
      },
    });
  });

  it('does not expose messages of 5xx HTTP exceptions', () => {
    const result = toErrorResponse(
      new ServiceUnavailableException('redis at 10.0.0.5 is down'),
    );

    expect(result.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(result.body.errors.code).toBe('SERVICE_UNAVAILABLE');
    expect(result.body.errors.message).not.toContain('10.0.0.5');
  });

  it('handles non-standard status codes', () => {
    const result = toErrorResponse(new HttpException('Teapot', 418));

    expect(result.status).toBe(418);
    expect(result.body.errors.code).toBe('I_AM_A_TEAPOT');
  });
});
