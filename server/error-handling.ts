import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error for Zod schema validation
 */
export class ValidationError extends AppError {
  constructor(zodError: ZodError) {
    const message = 'Validation failed';
    const details = zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Database error wrapper
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: any) {
    super(`Database error: ${message}`, 500, 'DATABASE_ERROR', originalError);
  }
}

/**
 * SMS service error wrapper
 */
export class SMSError extends AppError {
  constructor(message: string, details?: any) {
    super(`SMS error: ${message}`, 500, 'SMS_ERROR', details);
  }
}

/**
 * Authentication/Authorization error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🔥 Error caught by handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).session?.user?.id,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(err);
    return res.status(400).json({
      error: validationError.message,
      code: validationError.code,
      details: validationError.details,
    });
  }

  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Database service unavailable',
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  // JWT/Token errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }

  // Default server error
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
  });
};

/**
 * Validate request data using Zod schema
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Safe database operation wrapper
 */
export const safeDbOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database error: ${errorMessage}`, error);
    throw new DatabaseError(errorMessage, error);
  }
};

/**
 * Safe SMS operation wrapper
 */
export const safeSMSOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'SMS operation failed'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`SMS error: ${errorMessage}`, error);
    throw new SMSError(errorMessage, error);
  }
};

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * File upload error
 */
export class FileUploadError extends AppError {
  constructor(message: string) {
    super(`File upload error: ${message}`, 400, 'FILE_UPLOAD_ERROR');
  }
}

/**
 * Permission error
 */
export class PermissionError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'PERMISSION_DENIED');
  }
}