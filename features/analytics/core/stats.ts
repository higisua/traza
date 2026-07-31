/**
 * Basic aggregate stats over numeric arrays.
 */

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

export function min(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let best = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < best) best = values[i];
  }
  return best;
}

export function max(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let best = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > best) best = values[i];
  }
  return best;
}

export function first<T>(items: readonly T[]): T | null {
  return items.length > 0 ? items[0] : null;
}

export function last<T>(items: readonly T[]): T | null {
  return items.length > 0 ? items[items.length - 1] : null;
}

/**
 * Count occurrences of each key. Ratios sum to 1 when total > 0.
 */
export function distribution<T extends string>(
  keys: readonly T[],
): Array<{ key: T; count: number; ratio: number }> {
  if (keys.length === 0) return [];

  const counts = new Map<T, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = keys.length;
  return Array.from(counts.entries())
    .map(([key, count]) => ({
      key,
      count,
      ratio: count / total,
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}
