/**
 * Application error hierarchy. Services throw these; the API layer converts
 * them into consistent JSON responses with the right HTTP status code.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request contains invalid data.", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request.", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You need to sign in to do that.") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", message?: string) {
    super(404, "NOT_FOUND", message ?? `${resource} was not found.`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(409, code, message, details);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "We could not reach the database. Please try again.", details?: unknown) {
    super(503, "DATABASE_UNAVAILABLE", message, details);
    this.name = "DatabaseError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
