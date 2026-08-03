export {
  TRAZA_EXPORT_SCHEMA_VERSION,
  APP_VERSION,
  ALL_EXPORT_CONTENT_KEYS,
  EXPORT_CONTENT_LABELS_ES,
  EXPORT_FORMAT_COPY_ES,
  EXPORT_PURPOSE_LABELS_ES,
  EXPORT_TYPE_LABELS_ES,
  PDF_DETAIL_COPY_ES,
  emptyRecordCounts,
  countsFromBackup,
} from "./schema";
export type {
  TrazaBackupPayload,
  ExportFormat,
  ExportPeriodPreset,
  ExportContentKey,
  ExportPurpose,
  PdfDetailLevel,
  DateRange,
  RestoreMode,
  BackupRecordCounts,
} from "./schema";

export {
  resolveExportRange,
  formatRangeLabelEs,
  PERIOD_PRESET_LABELS_ES,
} from "./period";

export { buildFullBackup, collectLiveData, filterByRange } from "./collectData";
export { runExport } from "./exportService";
export type { RunExportInput, RunExportResult } from "./exportService";

export {
  parseBackupJson,
  applyBackup,
  migrateBackupPayload,
  backupCompatibilityNote,
} from "./restore";
export type { RestoreSummary, ParseBackupResult } from "./restore";

export { getStorageInfo, formatBytesEs } from "./storageStats";
export type { StorageInfo } from "./storageStats";

export { getDataMeta } from "./dataMeta";

export {
  listExportHistory,
  recordExportHistory,
  contentSummaryEs,
  historyTypeLabelEs,
  historyPurposeLabelEs,
  inferPurpose,
} from "./exportHistory";
export type {
  ExportHistoryEntry,
  ExportHistoryKind,
} from "./exportHistory";

export {
  COACH_ANALYSIS_PROMPT_ES,
  buildCoachAnalysisPrompt,
  copyCoachPromptToClipboard,
} from "./coachPrompt";
export type { CoachPromptContext } from "./coachPrompt";

export {
  buildPdfNarrative,
  buildHighlights,
  buildNaturalConclusions,
  formatDurationHm,
} from "./reportNarrative";
export type {
  PdfReportNarrative,
  NarrativeLabeledMessage,
  TrainingRating,
} from "./reportNarrative";
