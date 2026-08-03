/**
 * Export history — metadata only (no file blobs).
 * Extends local history shape; does NOT touch backup JSON schema.
 */

import { readJson, storageKey, writeJson } from "@/lib/storage/localStorage";
import type {
  ExportContentKey,
  ExportFormat,
  ExportPeriodPreset,
  ExportPurpose,
} from "./schema";
import {
  EXPORT_PURPOSE_LABELS_ES,
  EXPORT_TYPE_LABELS_ES,
} from "./schema";

const HISTORY_KEY = storageKey("export_history");
const MAX_ENTRIES = 40;

export type ExportHistoryKind = "export" | "backup" | "coach";

export type ExportHistoryEntry = {
  id: string;
  at: string;
  format: ExportFormat;
  period: ExportPeriodPreset;
  periodLabel: string;
  /** Selected domains, or "all" / "backup" for full payloads. */
  content: ExportContentKey[] | "all" | "backup";
  kind: ExportHistoryKind;
  /** Why it was generated — story, not filename. Optional for older entries. */
  purpose?: ExportPurpose;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listExportHistory(): ExportHistoryEntry[] {
  const raw = readJson<ExportHistoryEntry[]>(HISTORY_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e) =>
        e &&
        typeof e === "object" &&
        typeof e.at === "string" &&
        typeof e.format === "string",
    )
    .slice(0, MAX_ENTRIES);
}

export function recordExportHistory(
  entry: Omit<ExportHistoryEntry, "id">,
): ExportHistoryEntry {
  const next: ExportHistoryEntry = { ...entry, id: newId() };
  const prev = listExportHistory();
  writeJson(HISTORY_KEY, [next, ...prev].slice(0, MAX_ENTRIES));
  return next;
}

export function contentSummaryEs(
  content: ExportHistoryEntry["content"],
): string {
  if (content === "backup") return "Copia completa";
  if (content === "all") return "Todo";
  if (!Array.isArray(content) || content.length === 0) return "—";
  if (content.length >= 11) return "Todo";
  return `${content.length} dominios`;
}

export function historyTypeLabelEs(format: ExportFormat): string {
  return EXPORT_TYPE_LABELS_ES[format] ?? format;
}

export function historyPurposeLabelEs(
  entry: ExportHistoryEntry,
): string {
  if (entry.purpose && EXPORT_PURPOSE_LABELS_ES[entry.purpose]) {
    return EXPORT_PURPOSE_LABELS_ES[entry.purpose];
  }
  if (entry.kind === "backup") return EXPORT_PURPOSE_LABELS_ES.backup;
  if (entry.kind === "coach") return EXPORT_PURPOSE_LABELS_ES.chatgpt;
  return EXPORT_PURPOSE_LABELS_ES.analysis;
}

export function inferPurpose(
  kind: ExportHistoryKind,
  format: ExportFormat,
): ExportPurpose {
  if (kind === "backup" || format === "json") return "backup";
  if (kind === "coach") return "chatgpt";
  return "analysis";
}
