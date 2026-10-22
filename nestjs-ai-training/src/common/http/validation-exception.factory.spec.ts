import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-exception.factory.js';
import { ValidationFailedException } from './validation-failed.exception.js';

describe('validationExceptionFactory', () => {
  it('turns each failed constraint into a field-level detail', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
        children: [],
      },
      {
        property: 'password',
        constraints: {
          isString: 'password must be a string',
          minLength: 'password must be longer than or equal to 8 characters',
        },
        children: [],
      },
    ];

    const exception = validationExceptionFactory(errors);

    expect(exception).toBeInstanceOf(ValidationFailedException);
    expect(exception.details).toEqual([
      { field: 'email', description: 'email must be an email' },
      { field: 'password', description: 'password must be a string' },
      {
        field: 'password',
        description: 'password must be longer than or equal to 8 characters',
      },
    ]);
  });

  it('uses dotted paths for nested fields', () => {
    const errors: ValidationError[] = [
      {
        property: 'address',
        children: [
          {
            property: 'city',
            constraints: { isNotEmpty: 'city should not be empty' },
            children: [],
          },
        ],
      },
    ];

    expect(validationExceptionFactory(errors).details).toEqual([
      { field: 'address.city', description: 'city should not be empty' },
    ]);
  });
});
