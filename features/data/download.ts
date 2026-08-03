/**
 * Browser download helpers — client-only.
 */

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export function downloadJson(data: unknown, filename: string): void {
  const text = JSON.stringify(data, null, 2);
  downloadBlob(
    new Blob([text], { type: "application/json;charset=utf-8" }),
    filename,
  );
}

export function stampFilename(prefix: string, extension: string, now = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  return `${prefix}_${stamp}.${extension}`;
}
