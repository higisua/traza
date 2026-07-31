import type { DeltaResult } from "./types";

/**
 * Absolute and percent change from `from` → `to`.
 * Percent is null when the baseline is exactly 0.
 */
export function delta(from: number, to: number): DeltaResult {
  const absolute = to - from;
  const percent =
    from === 0 ? null : (absolute / Math.abs(from)) * 100;
  return { absolute, percent, from, to };
}

/**
 * Convenience: delta when either endpoint may be missing.
 */
export function deltaOrNull(
  from: number | null | undefined,
  to: number | null | undefined,
): DeltaResult | null {
  if (
    from == null ||
    to == null ||
    !Number.isFinite(from) ||
    !Number.isFinite(to)
  ) {
    return null;
  }
  return delta(from, to);
}
