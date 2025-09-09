// Add your form validation helpers here
export function isRequired(value: unknown): boolean {
  return !!value;
}

export function isValidEmail(email: string): boolean {
  // Basic email regex for format validation
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
}
