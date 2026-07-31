"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Footprints } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { StepsEntrySheet } from "@/components/steps/StepsEntrySheet";
import { StepsHistoryList } from "@/components/steps/StepsHistoryList";
import { StepsSummaryCard } from "@/components/steps/StepsSummaryCard";
import { StepsTrendChart } from "@/components/steps/StepsTrendChart";
import {
  ModuleComposeAction,
  ModuleEmptyState,
  ModuleScreen,
} from "@/components/tracking";
import { useStepsEntries, type StepsEntry } from "@/features/steps";

function StepsEmptyIllustration() {
  return (
    <svg viewBox="0 0 260 112" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="stepsWash" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="36" y="58" width="18" height="28" rx="7" fill="var(--traza-text-primary)" opacity="0.12" />
      <rect x="66" y="42" width="18" height="44" rx="7" fill="var(--traza-text-primary)" opacity="0.18" />
      <rect x="96" y="30" width="18" height="56" rx="7" fill="var(--traza-primary)" opacity="0.55" />
      <rect x="126" y="22" width="18" height="64" rx="7" fill="var(--traza-primary)" opacity="0.85" />
      <rect x="156" y="36" width="18" height="50" rx="7" fill="var(--traza-text-primary)" opacity="0.2" />
      <rect x="186" y="48" width="18" height="38" rx="7" fill="var(--traza-text-primary)" opacity="0.14" />
      <line
        x1="30"
        x2="220"
        y1="40"
        y2="40"
        stroke="var(--traza-text-muted)"
        strokeWidth="1.5"
        strokeDasharray="4 5"
        opacity="0.5"
      />
      <path
        d="M214 28 l8 8 -8 8"
        fill="none"
        stroke="var(--traza-text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function StepsScreen() {
  const { showToast } = useToast();
  const { entries, summary, chartPoints, remove } = useStepsEntries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StepsEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StepsEntry | null>(null);

  const isEmpty = entries.length === 0;

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: StepsEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function handleSaved(mode: "create" | "edit") {
    showToast(
      mode === "create" ? "Pasos guardados" : "Registro actualizado",
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
      <ModuleScreen title="Pasos" isEmpty={isEmpty}>
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <ModuleEmptyState
              key="empty"
              icon={Footprints}
              title="Empieza a trazar tu actividad"
              description="Empieza a registrar tus pasos y descubre cómo evoluciona tu nivel de actividad."
              actionLabel="Registrar primeros pasos"
              onAction={openCreate}
              illustration={<StepsEmptyIllustration />}
            />
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              {/* Progress answer first in glance — chart still follows structure */}
              <StepsTrendChart
                key={chartPoints.map((p) => `${p.entryDate}:${p.totalSteps}`).join("|")}
                points={chartPoints}
              />
              <StepsSummaryCard summary={summary} />
              <StepsHistoryList
                entries={entries}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ModuleScreen>

      {!isEmpty ? (
        <ModuleComposeAction label="Registrar pasos" onClick={openCreate} />
      ) : null}

      <StepsEntrySheet
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
