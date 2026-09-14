export interface ApplicationErrorOptions {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class ApplicationError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, options: ApplicationErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'ApplicationError';
    this.status = options.status ?? 400;
    this.code = options.code ?? 'APPLICATION_ERROR';
    this.details = options.details;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, options: Omit<ApplicationErrorOptions, 'status'> & { status?: number } = {}) {
    super(message, { status: options.status ?? 400, code: options.code ?? 'VALIDATION_ERROR', details: options.details, cause: options.cause });
    this.name = 'ValidationError';
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, options: Omit<ApplicationErrorOptions, 'status'> = {}) {
    super(message, { status: 409, code: options.code ?? 'CONFLICT', details: options.details, cause: options.cause });
    this.name = 'ConflictError';
  }
}
