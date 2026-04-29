/**
 * Generates a unique identifier string.
 * Uses crypto.randomUUID when available, otherwise falls back to Math.random.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}
