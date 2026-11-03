const KEY_ATTRIBUTES = ["PK", "SK", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK", "entityType", "expiresAt"] as const;

/** Removes table key attributes so repositories return clean domain objects. */
export function stripKeys<T>(item: Record<string, unknown>): T {
  const copy: Record<string, unknown> = { ...item };
  for (const key of KEY_ATTRIBUTES) delete copy[key];
  return copy as T;
}

/** Splits an array into chunks (BatchGet allows 100 keys, BatchWrite 25 items). */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
