export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: Record<string, unknown>): AppError {
    return new AppError(400, code, message, details);
  }

  static unauthorized(code: string, message: string, details?: Record<string, unknown>): AppError {
    return new AppError(401, code, message, details);
  }

  static forbidden(code: string, message: string, details?: Record<string, unknown>): AppError {
    return new AppError(403, code, message, details);
  }

  static notFound(code: string, message: string, details?: Record<string, unknown>): AppError {
    return new AppError(404, code, message, details);
  }

  static conflict(code: string, message: string, details?: Record<string, unknown>): AppError {
    return new AppError(409, code, message, details);
  }

  static internal(code = 'INTERNAL_ERROR', message = 'An unexpected internal error occurred.'): AppError {
    return new AppError(500, code, message);
  }
}
