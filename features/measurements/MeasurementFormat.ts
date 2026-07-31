export function formatCm(value: number): string {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatSignedDeltaCm(delta: number): string {
  const abs = formatCm(Math.abs(delta));
  if (Math.abs(delta) < 0.05) return `→ ${abs} cm`;
  return `${delta > 0 ? "↑" : "↓"} ${delta > 0 ? "+" : "−"}${abs} cm`;
}
