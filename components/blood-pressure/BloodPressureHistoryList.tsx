"use client";

import {
  formatBloodPressureReading,
  formatPulse,
  type BloodPressureEntry,
} from "@/features/blood-pressure";
import {
  ModuleHistoryList,
  ModuleHistoryRow,
} from "@/components/tracking";
import { formatEntryStamp } from "@/lib/tracking/dateTime";

type BloodPressureHistoryListProps = {
  entries: BloodPressureEntry[];
  onEdit: (entry: BloodPressureEntry) => void;
  onDelete: (entry: BloodPressureEntry) => void;
};

export function BloodPressureHistoryList({
  entries,
  onEdit,
  onDelete,
}: BloodPressureHistoryListProps) {
  return (
    <ModuleHistoryList count={entries.length}>
      {entries.map((entry, index) => (
        <ModuleHistoryRow
          key={entry.id}
          index={index}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry)}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold tabular-nums text-text-primary">
              {formatEntryStamp(entry)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold tabular-nums text-text-primary">
              {formatBloodPressureReading(entry.systolic, entry.diastolic)}
            </p>
            <p className="mt-0.5 text-[12px] font-medium tabular-nums text-text-secondary">
              {formatPulse(entry.pulse)}
            </p>
          </div>
        </ModuleHistoryRow>
      ))}
    </ModuleHistoryList>
  );
}
