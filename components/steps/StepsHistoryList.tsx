"use client";

import { formatStepsCount, type StepsEntry } from "@/features/steps";
import {
  ModuleHistoryList,
  ModuleHistoryRow,
} from "@/components/tracking";
import { formatEntryStamp } from "@/lib/tracking/dateTime";

type StepsHistoryListProps = {
  entries: StepsEntry[];
  onEdit: (entry: StepsEntry) => void;
  onDelete: (entry: StepsEntry) => void;
};

export function StepsHistoryList({
  entries,
  onEdit,
  onDelete,
}: StepsHistoryListProps) {
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
          <p className="text-[15px] font-bold tabular-nums text-text-primary">
            {formatStepsCount(entry.steps)}{" "}
            <span className="text-[12px] font-semibold text-text-muted">
              pasos
            </span>
          </p>
        </ModuleHistoryRow>
      ))}
    </ModuleHistoryList>
  );
}
