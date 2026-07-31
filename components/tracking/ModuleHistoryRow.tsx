"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

const DELETE_WIDTH = 76;
const DELETE_THRESHOLD = 56;

type ModuleHistoryRowProps = {
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
};

export function ModuleHistoryRow({
  index,
  onEdit,
  onDelete,
  children,
}: ModuleHistoryRowProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-DELETE_WIDTH, -20, 0], [1, 0.5, 0]);
  const [dragging, setDragging] = useState(false);
  const openRef = useRef(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{
        delay: Math.min(index * 0.035, 0.2),
        duration: motionDuration.normal,
        ease: motionEase.standard,
      }}
      className="relative overflow-hidden rounded-[16px]"
    >
      <motion.button
        type="button"
        aria-label="Eliminar registro"
        style={{ opacity: deleteOpacity }}
        onClick={onDelete}
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
          onEdit();
        }}
        className={cn(
          "relative z-10 flex w-full items-center gap-3 bg-surface px-4 py-3.5 text-left shadow-xs",
          "ring-1 ring-black/[0.04]",
        )}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}
