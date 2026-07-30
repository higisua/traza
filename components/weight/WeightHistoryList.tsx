"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import type { WeightEntry } from "@/features/weight";
import {
  formatBodyFatPct,
  formatHistoryStamp,
  formatWeightKg,
} from "@/features/weight";
import { cn } from "@/lib/utils/cn";

const DELETE_WIDTH = 76;
const DELETE_THRESHOLD = 56;

type WeightHistoryItemProps = {
  entry: WeightEntry;
  index: number;
  onEdit: (entry: WeightEntry) => void;
  onDelete: (entry: WeightEntry) => void;
};

export function WeightHistoryItem({
  entry,
  index,
  onEdit,
  onDelete,
}: WeightHistoryItemProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-DELETE_WIDTH, -20, 0], [1, 0.5, 0]);
  const [dragging, setDragging] = useState(false);
  const openRef = useRef(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{
        delay: Math.min(index * 0.035, 0.2),
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-[16px]"
    >
      <motion.button
        type="button"
        aria-label="Eliminar registro"
        style={{ opacity: deleteOpacity }}
        onClick={() => onDelete(entry)}
        className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-danger text-text-inverse"
      >
        <Trash2 size={18} strokeWidth={1.8} />
      </motion.button>

      <motion.button
        type="button"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -DELETE_WIDTH, right: 0 }}
        dragElastic={0.08}
        onDragStart={() => setDragging(true)}
        onDragEnd={(_, info) => {
          setDragging(false);
          const shouldOpen =
            info.offset.x < -DELETE_THRESHOLD || info.velocity.x < -400;
          openRef.current = shouldOpen;
          x.set(shouldOpen ? -DELETE_WIDTH : 0);
        }}
        onClick={() => {
          if (dragging) return;
          if (openRef.current) {
            openRef.current = false;
            x.set(0);
            return;
          }
          onEdit(entry);
        }}
        className={cn(
          "relative z-10 flex w-full items-center gap-3 bg-surface px-4 py-3.5 text-left shadow-xs",
          "ring-1 ring-black/[0.03]",
        )}
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
      </motion.button>
    </motion.div>
  );
}

type WeightHistoryListProps = {
  entries: WeightEntry[];
  onEdit: (entry: WeightEntry) => void;
  onDelete: (entry: WeightEntry) => void;
  footer?: ReactNode;
};

export function WeightHistoryList({
  entries,
  onEdit,
  onDelete,
  footer,
}: WeightHistoryListProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
            Historial
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-text-muted">
            Pulsa para editar · Desliza para eliminar
          </p>
        </div>
        <p className="shrink-0 text-[11px] font-medium text-text-muted">
          {entries.length} {entries.length === 1 ? "registro" : "registros"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {entries.map((entry, index) => (
            <WeightHistoryItem
              key={entry.id}
              entry={entry}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
        {footer}
      </div>
    </section>
  );
}
