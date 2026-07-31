"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { SleepEntrySheet } from "@/components/sleep/SleepEntrySheet";
import { SleepHistoryList } from "@/components/sleep/SleepHistoryList";
import { SleepSummaryCard } from "@/components/sleep/SleepSummaryCard";
import { SleepTrendChart } from "@/components/sleep/SleepTrendChart";
import {
  ModuleComposeAction,
  ModuleEmptyState,
  ModuleScreen,
} from "@/components/tracking";
import { motionDuration, motionEase } from "@/lib/motion";
import { useSleepEntries, type SleepEntry } from "@/features/sleep";

function SleepEmptyIllustration() {
  return (
    <svg viewBox="0 0 260 112" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sleepWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="78" rx="88" ry="22" fill="url(#sleepWash)" />
      <path
        d="M78 64 C 98 42, 118 42, 138 58 C 158 74, 178 74, 198 52"
        fill="none"
        stroke="var(--traza-text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="188" cy="34" r="10" fill="var(--traza-primary-soft)" />
      <circle
        cx="188"
        cy="34"
        r="6"
        fill="var(--traza-primary)"
        opacity="0.75"
      />
      <circle cx="72" cy="40" r="2" fill="var(--traza-text-primary)" opacity="0.25" />
      <circle cx="92" cy="28" r="1.5" fill="var(--traza-text-primary)" opacity="0.2" />
      <circle cx="210" cy="48" r="1.5" fill="var(--traza-text-primary)" opacity="0.2" />
    </svg>
  );
}

export function SleepScreen() {
  const { showToast } = useToast();
  const { entries, summary, chartPoints, remove } = useSleepEntries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SleepEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SleepEntry | null>(null);

  const isEmpty = entries.length === 0;

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: SleepEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function handleSaved(mode: "create" | "edit") {
    showToast(
      mode === "create" ? "Sueño guardado" : "Registro actualizado",
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
      <ModuleScreen title="Sueño" isEmpty={isEmpty}>
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <ModuleEmptyState
              key="empty"
              icon={Moon}
              title="Empieza a trazar tu sueño"
              description="Con el tiempo podrás entender cómo evoluciona tu descanso."
              actionLabel="Registrar primer sueño"
              onAction={openCreate}
              illustration={<SleepEmptyIllustration />}
            />
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionDuration.normal, ease: motionEase.standard }}
              className="flex flex-col gap-4"
            >
              <SleepTrendChart
                key={chartPoints.map((point) => point.id).join("-")}
                points={chartPoints}
              />
              <SleepSummaryCard summary={summary} />
              <SleepHistoryList
                entries={entries}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ModuleScreen>

      {!isEmpty ? (
        <ModuleComposeAction label="Registrar sueño" onClick={openCreate} />
      ) : null}

      <SleepEntrySheet
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
