"use client";

import { formatCm, type MeasurementEntry } from "@/features/measurements";
import {
  ModuleHistoryList,
  ModuleHistoryRow,
} from "@/components/tracking";
import { formatEntryStamp } from "@/lib/tracking/dateTime";

type MeasurementsHistoryListProps = {
  entries: MeasurementEntry[];
  onEdit: (entry: MeasurementEntry) => void;
  onDelete: (entry: MeasurementEntry) => void;
};

export function MeasurementsHistoryList({
  entries,
  onEdit,
  onDelete,
}: MeasurementsHistoryListProps) {
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
            <p className="mt-1 text-[12px] font-medium tabular-nums text-text-secondary">
              Cintura {formatCm(entry.waistCm)} cm
              <span className="mx-1.5 text-border-strong">·</span>
              Brazo {formatCm(entry.armCm)} cm
              <span className="mx-1.5 text-border-strong">·</span>
              Pierna {formatCm(entry.legCm)} cm
            </p>
          </div>
        </ModuleHistoryRow>
      ))}
    </ModuleHistoryList>
  );
}
