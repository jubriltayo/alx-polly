export function logError(error: unknown, context?: string) {
  // You can extend this to send errors to a logging service
  if (context) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error);
  } else {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred.';
}
