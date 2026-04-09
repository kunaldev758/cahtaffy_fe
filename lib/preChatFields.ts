/** Name & Email (ids 1 & 2) cannot be removed from the form — only custom fields can be deleted. */
export const LOCKED_PRECHAT_FIELD_IDS = new Set([1, 2])

/** Returns a shallow copy of fields preserving saved order (used when loading theme settings). */
export function normalizePreChatFieldOrder<T extends { id: number }>(fields: T[]): T[] {
  return [...fields]
}
