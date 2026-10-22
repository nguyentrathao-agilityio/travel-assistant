import type { ValidationError } from 'class-validator';
import {
  type FieldError,
  ValidationFailedException,
} from './validation-failed.exception.js';

function toFieldErrors(
  errors: ValidationError[],
  parentPath?: string,
): FieldError[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own = Object.values(error.constraints ?? {}).map((description) => ({
      field,
      description,
    }));
    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}

// Used as ValidationPipe's exceptionFactory (field errors → VALIDATION_FAILED).
export function validationExceptionFactory(
  errors: ValidationError[],
): ValidationFailedException {
  return new ValidationFailedException(toFieldErrors(errors));
}
