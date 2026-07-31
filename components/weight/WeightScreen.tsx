"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Scale } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import {
  ModuleComposeAction,
  ModuleEmptyState,
  ModuleScreen,
} from "@/components/tracking";
import { WeightEntrySheet } from "@/components/weight/WeightEntrySheet";
import { WeightHistoryList } from "@/components/weight/WeightHistoryList";
import { WeightSummaryCard } from "@/components/weight/WeightSummaryCard";
import { WeightTrendChart } from "@/components/weight/WeightTrendChart";
import { useWeightEntries, type WeightEntry } from "@/features/weight";
import { motionDuration, motionEase } from "@/lib/motion";

function EvolutionEmptyIllustration() {
  return (
    <svg viewBox="0 0 260 112" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="emptyArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 78 C 48 70, 72 42, 108 48 C 144 54, 168 28, 204 34 C 228 38, 244 22, 248 18 L 248 100 L 12 100 Z"
        fill="url(#emptyArea)"
      />
      <path
        d="M12 78 C 48 70, 72 42, 108 48 C 144 54, 168 28, 204 34 C 228 38, 244 22, 248 18"
        fill="none"
        stroke="var(--traza-text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle
        cx="248"
        cy="18"
        r="5"
        fill="var(--traza-primary)"
        stroke="var(--traza-text-primary)"
        strokeWidth="2"
        opacity="0.55"
      />
    </svg>
  );
}

export function WeightScreen() {
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
    <>
      <ModuleScreen title="Peso" isEmpty={isEmpty}>
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <ModuleEmptyState
              key="empty"
              icon={Scale}
              title="Empieza a trazar tu peso"
              description="Un registro al día basta. Aquí verás cómo evoluciona con el tiempo."
              actionLabel="Registrar primer peso"
              onAction={openCreate}
              illustration={<EvolutionEmptyIllustration />}
            />
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionDuration.normal, ease: motionEase.standard }}
              className="flex flex-col gap-4"
            >
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
      </ModuleScreen>

      {!isEmpty ? (
        <ModuleComposeAction label="Registrar peso" onClick={openCreate} />
      ) : null}

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
    </>
  );
}
