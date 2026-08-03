import { readJson, storageKey, writeJson } from "@/lib/storage/localStorage";
import type { ExportFormat } from "./schema";
import { APP_VERSION, TRAZA_EXPORT_SCHEMA_VERSION } from "./schema";

const META_KEY = storageKey("data_meta");

export type DataMeta = {
  lastBackupAt: string | null;
  lastBackupSchemaVersion: number | null;
  lastBackupAppVersion: string | null;
  lastExportAt: string | null;
  lastExportFormat: ExportFormat | null;
  /** Human period label of last share/report export (not backup schema). */
  lastExportPeriodLabel: string | null;
};

const DEFAULT_META: DataMeta = {
  lastBackupAt: null,
  lastBackupSchemaVersion: null,
  lastBackupAppVersion: null,
  lastExportAt: null,
  lastExportFormat: null,
  lastExportPeriodLabel: null,
};

export function getDataMeta(): DataMeta {
  return { ...DEFAULT_META, ...readJson<Partial<DataMeta>>(META_KEY, {}) };
}

export function markBackupDone(at = new Date().toISOString()): DataMeta {
  const next: DataMeta = {
    ...getDataMeta(),
    lastBackupAt: at,
    lastBackupSchemaVersion: TRAZA_EXPORT_SCHEMA_VERSION,
    lastBackupAppVersion: APP_VERSION,
    lastExportAt: at,
    lastExportFormat: "json",
    lastExportPeriodLabel: "Copia completa",
  };
  writeJson(META_KEY, next);
  return next;
}

export function markExportDone(
  format: ExportFormat,
  options?: {
    at?: string;
    periodLabel?: string;
  },
): DataMeta {
  const at = options?.at ?? new Date().toISOString();
  const prev = getDataMeta();
  const next: DataMeta = {
    ...prev,
    lastExportAt: at,
    lastExportFormat: format,
    lastExportPeriodLabel: options?.periodLabel ?? prev.lastExportPeriodLabel,
    ...(format === "json"
      ? {
          lastBackupAt: at,
          lastBackupSchemaVersion: TRAZA_EXPORT_SCHEMA_VERSION,
          lastBackupAppVersion: APP_VERSION,
          lastExportPeriodLabel: options?.periodLabel ?? "Copia completa",
        }
      : {}),
  };
  writeJson(META_KEY, next);
  return next;
}
