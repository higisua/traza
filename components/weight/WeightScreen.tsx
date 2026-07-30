"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { WeightComposeAction } from "@/components/weight/WeightFab";
import { WeightEmptyState } from "@/components/weight/WeightEmptyState";
import { WeightEntrySheet } from "@/components/weight/WeightEntrySheet";
import { WeightHistoryList } from "@/components/weight/WeightHistoryList";
import { WeightSummaryCard } from "@/components/weight/WeightSummaryCard";
import { WeightTrendChart } from "@/components/weight/WeightTrendChart";
import { useWeightEntries, type WeightEntry } from "@/features/weight";
import { cn } from "@/lib/utils/cn";

export function WeightScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { entries, summary, chartPoints, remove } = useWeightEntries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WeightEntry | null>(null);

  const isEmpty = entries.length === 0;

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: WeightEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function handleSaved(mode: "create" | "edit") {
    showToast(
      mode === "create" ? "Peso guardado" : "Registro actualizado",
      "success",
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    remove(pendingDelete.id);
    setPendingDelete(null);
    showToast("Registro eliminado", "danger");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative min-h-dvh",
        isEmpty
          ? "pb-[max(24px,env(safe-area-inset-bottom))]"
          : "pb-[calc(88px+env(safe-area-inset-bottom))]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative px-5 pt-2">
        <PageHeader title="Peso" onBack={() => router.push("/home")} />

        <div className="mt-2 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <WeightEmptyState key="empty" onCreate={openCreate} />
            ) : (
              <motion.div
                key="filled"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4"
              >
                {/* Evolution first — the personality of this module */}
                <WeightTrendChart points={chartPoints} />
                <WeightSummaryCard summary={summary} />
                <WeightHistoryList
                  entries={entries}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!isEmpty ? <WeightComposeAction onClick={openCreate} /> : null}

      <WeightEntrySheet
        open={sheetOpen}
        entry={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        onRequestDelete={(entry) => {
          setEditing(null);
          setPendingDelete(entry);
        }}
      />

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Eliminar registro"
        description="Este registro se eliminará de forma permanente. Úsalo si lo creaste por error."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </motion.div>
  );
}
