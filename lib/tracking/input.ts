export function parseLocaleNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function sanitizeDecimalInput(raw: string): string {
  const normalized = raw.replace(".", ",");
  const cleaned = normalized.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]},${parts.slice(1).join("")}`;
}

export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}
