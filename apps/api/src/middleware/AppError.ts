export interface ErrorDetail {
  field: string;
  message: string;
}

// An error we expect and describe on purpose (bad input, not found, ...).
// Anything else that reaches the error handler is treated as a bug (500).
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}
