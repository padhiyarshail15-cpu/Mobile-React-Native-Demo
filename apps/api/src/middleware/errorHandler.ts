import type { NextFunction, Request, Response } from 'express';

interface HttpLikeError {
  status?: unknown;
  expose?: unknown;
  message?: unknown;
}

function readStatus(err: unknown): number {
  const status = (err as HttpLikeError | null)?.status;
  return typeof status === 'number' && status >= 400 && status <= 599
    ? status
    : 500;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = readStatus(err);
  const exposed = (err as HttpLikeError | null)?.expose === true;

  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  }

  res.status(status).json({
    error: {
      code: status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
      message:
        exposed && typeof (err as HttpLikeError).message === 'string'
          ? (err as HttpLikeError).message
          : status >= 500
          ? 'Something went wrong'
          : 'Bad request',
    },
  });
}
