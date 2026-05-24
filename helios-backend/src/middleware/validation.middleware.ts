import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../core/errors/validation-errors.js';

interface ValidationTarget {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Request validation middleware factory using Zod schemas.
 * Validates body, query, and/or params and replaces them with parsed values.
 */
export function validate(schemas: ValidationTarget) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const fieldErrors: Record<string, string[]> = {};
          for (const issue of result.error.issues) {
            const path = issue.path.join('.') || '_root';
            if (!fieldErrors[path]) fieldErrors[path] = [];
            fieldErrors[path].push(issue.message);
          }
          throw new ValidationError(fieldErrors);
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const fieldErrors: Record<string, string[]> = {};
          for (const issue of result.error.issues) {
            const path = issue.path.join('.') || '_root';
            if (!fieldErrors[path]) fieldErrors[path] = [];
            fieldErrors[path].push(issue.message);
          }
          throw new ValidationError(fieldErrors);
        }
        req.query = result.data as any;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const fieldErrors: Record<string, string[]> = {};
          for (const issue of result.error.issues) {
            const path = issue.path.join('.') || '_root';
            if (!fieldErrors[path]) fieldErrors[path] = [];
            fieldErrors[path].push(issue.message);
          }
          throw new ValidationError(fieldErrors);
        }
        req.params = result.data as any;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}


