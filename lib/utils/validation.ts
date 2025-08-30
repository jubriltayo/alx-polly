// Add your form validation helpers here
export function isRequired(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}
