"use client";

import {
  formatBodyFatPct,
  formatHistoryStamp,
  formatWeightKg,
  type WeightEntry,
} from "@/features/weight";
import {
  ModuleHistoryList,
  ModuleHistoryRow,
} from "@/components/tracking";

type WeightHistoryListProps = {
  entries: WeightEntry[];
  onEdit: (entry: WeightEntry) => void;
  onDelete: (entry: WeightEntry) => void;
};

export function WeightHistoryList({
  entries,
  onEdit,
  onDelete,
}: WeightHistoryListProps) {
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
              {formatHistoryStamp(entry)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold tabular-nums text-text-primary">
              {formatWeightKg(entry.weightKg)}{" "}
              <span className="text-[12px] font-semibold text-text-muted">kg</span>
            </p>
            <p className="mt-0.5 text-[12px] font-medium tabular-nums text-text-secondary">
              {entry.bodyFatPct !== null
                ? `${formatBodyFatPct(entry.bodyFatPct)} % grasa`
                : "Sin grasa"}
            </p>
          </div>
        </ModuleHistoryRow>
      ))}
    </ModuleHistoryList>
  );
}
