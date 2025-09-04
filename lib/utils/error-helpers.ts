export function handleNextRedirectError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
    throw error;
  }
}
