"use client";

import {
  formatSleepDuration,
  formatSleepScore,
  type SleepEntry,
} from "@/features/sleep";
import {
  ModuleHistoryList,
  ModuleHistoryRow,
} from "@/components/tracking";
import { formatEntryStamp } from "@/lib/tracking/dateTime";

type SleepHistoryListProps = {
  entries: SleepEntry[];
  onEdit: (entry: SleepEntry) => void;
  onDelete: (entry: SleepEntry) => void;
};

export function SleepHistoryList({
  entries,
  onEdit,
  onDelete,
}: SleepHistoryListProps) {
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
              {formatSleepDuration(entry.durationMinutes)}
            </p>
            {entry.score !== null ? (
              <p className="mt-0.5 text-[12px] font-medium tabular-nums text-text-secondary">
                {formatSleepScore(entry.score)}
              </p>
            ) : null}
          </div>
        </ModuleHistoryRow>
      ))}
    </ModuleHistoryList>
  );
}
