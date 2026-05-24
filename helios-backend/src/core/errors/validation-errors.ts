import { AppError } from './app-error.js';

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR', true, fieldErrors);
    this.fieldErrors = fieldErrors;
  }
}

