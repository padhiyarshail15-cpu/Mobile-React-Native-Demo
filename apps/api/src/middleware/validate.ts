import type { z } from 'zod';

import { AppError } from './AppError';

// Express 5 makes req.query read-only, so handlers call this and use the
// returned, typed value instead of mutating the request.
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown
): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  // Report the field and the rule, never the value the client sent.
  throw new AppError(
    400,
    'VALIDATION_ERROR',
    'Invalid request',
    result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'request',
      message: issue.message,
    }))
  );
}
