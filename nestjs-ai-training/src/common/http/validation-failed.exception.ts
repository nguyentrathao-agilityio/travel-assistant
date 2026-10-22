import { BadRequestException } from '@nestjs/common';

export interface FieldError {
  field: string;
  description: string;
}

export class ValidationFailedException extends BadRequestException {
  constructor(readonly details: FieldError[]) {
    super('The provided data is invalid.');
  }
}
