"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { BloodPressureEntrySheet } from "@/components/blood-pressure/BloodPressureEntrySheet";
import { BloodPressureHistoryList } from "@/components/blood-pressure/BloodPressureHistoryList";
import { BloodPressureSummaryCard } from "@/components/blood-pressure/BloodPressureSummaryCard";
import { BloodPressureTrendChart } from "@/components/blood-pressure/BloodPressureTrendChart";
import {
  ModuleComposeAction,
  ModuleEmptyState,
  ModuleScreen,
} from "@/components/tracking";
import {
  useBloodPressureEntries,
  type BloodPressureEntry,
} from "@/features/blood-pressure";
import { motionDuration, motionEase } from "@/lib/motion";

function StatusEmptyIllustration() {
  return (
    <svg viewBox="0 0 260 112" className="h-full w-full" aria-hidden>
      <circle cx="130" cy="56" r="40" fill="var(--traza-primary-soft)" />
      <circle
        cx="130"
        cy="56"
        r="28"
        fill="none"
        stroke="var(--traza-primary)"
        strokeWidth="3"
        opacity="0.55"
      />
      <circle
        cx="130"
        cy="56"
        r="14"
        fill="var(--traza-primary)"
        opacity="0.7"
      />
      <path
        d="M78 56 H108 M152 56 H182"
        stroke="var(--traza-text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  );
}

export function BloodPressureScreen() {
  const { showToast } = useToast();
  const { entries, summary, chartPoints, remove } = useBloodPressureEntries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BloodPressureEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BloodPressureEntry | null>(
    null,
  );

  const isEmpty = entries.length === 0;

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: BloodPressureEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function handleSaved(mode: "create" | "edit") {
    showToast(
      mode === "create" ? "Tensión guardada" : "Registro actualizado",
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
      <ModuleScreen title="Tensión" isEmpty={isEmpty}>
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <ModuleEmptyState
              key="empty"
              icon={HeartPulse}
              title="Empieza a trazar tu tensión"
              description="Un registro rápido. Aquí verás el estado de tu lectura y cómo se mueve en el tiempo."
              actionLabel="Registrar primera tensión"
              onAction={openCreate}
              illustration={<StatusEmptyIllustration />}
            />
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionDuration.normal, ease: motionEase.standard }}
              className="flex flex-col gap-4"
            >
              {/* Same structure as Weight; personality lives in the summary (estado). */}
              <BloodPressureTrendChart points={chartPoints} />
              <BloodPressureSummaryCard summary={summary} />
              <BloodPressureHistoryList
                entries={entries}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ModuleScreen>

      {!isEmpty ? (
        <ModuleComposeAction label="Registrar tensión" onClick={openCreate} />
      ) : null}

      <BloodPressureEntrySheet
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
