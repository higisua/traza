/** Shared SVG path helpers for Progress compact charts. */

export function buildSmoothLine(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    return `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  }

  let path = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

/** Miniature chart geometry — ~40% shorter than the first Progress pass. */
export const COMPACT_CHART = {
  width: 320,
  height: 56,
  padLeft: 4,
  padRight: 4,
  padTop: 6,
  padBottom: 14,
} as const;
