"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { MeasurementsEntrySheet } from "@/components/measurements/MeasurementsEntrySheet";
import { MeasurementsHistoryList } from "@/components/measurements/MeasurementsHistoryList";
import { MeasurementsSummaryCard } from "@/components/measurements/MeasurementsSummaryCard";
import { MeasurementsTrendChart } from "@/components/measurements/MeasurementsTrendChart";
import {
  ModuleComposeAction,
  ModuleEmptyState,
  ModuleScreen,
} from "@/components/tracking";
import { motionDuration, motionEase } from "@/lib/motion";
import {
  useMeasurementEntries,
  type MeasurementEntry,
} from "@/features/measurements";

function MeasurementsEmptyIllustration() {
  return (
    <svg viewBox="0 0 260 112" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="measureWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="86" rx="78" ry="16" fill="url(#measureWash)" />
      <path
        d="M78 70 C 98 48, 118 44, 138 52 C 158 60, 178 58, 198 42"
        fill="none"
        stroke="var(--traza-text-primary)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M82 78 C 104 66, 124 64, 146 68 C 168 72, 186 70, 204 58"
        fill="none"
        stroke="var(--traza-info)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M74 86 C 102 80, 130 78, 160 80 C 186 82, 206 78, 220 70"
        fill="none"
        stroke="var(--traza-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="198" cy="42" r="4.5" fill="var(--traza-text-primary)" />
      <circle cx="204" cy="58" r="3.5" fill="var(--traza-info)" />
      <circle cx="220" cy="70" r="3.5" fill="var(--traza-primary)" />
    </svg>
  );
}

export function MeasurementsScreen() {
  const { showToast } = useToast();
  const { entries, summary, chartPoints, remove } = useMeasurementEntries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MeasurementEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MeasurementEntry | null>(
    null,
  );

  const isEmpty = entries.length === 0;

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: MeasurementEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function handleSaved(mode: "create" | "edit") {
    showToast(
      mode === "create" ? "Medición guardada" : "Registro actualizado",
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
      <ModuleScreen title="Medición corporal" isEmpty={isEmpty}>
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <ModuleEmptyState
              key="empty"
              icon={Ruler}
              title="Empieza a trazar tu cuerpo"
              description="Las medidas corporales muestran cambios que el peso no siempre refleja."
              actionLabel="Registrar primera medición"
              onAction={openCreate}
              illustration={<MeasurementsEmptyIllustration />}
            />
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionDuration.normal, ease: motionEase.standard }}
              className="flex flex-col gap-4"
            >
              <MeasurementsTrendChart
                key={chartPoints.map((p) => p.id).join("-")}
                points={chartPoints}
              />
              <MeasurementsSummaryCard summary={summary} />
              <MeasurementsHistoryList
                entries={entries}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ModuleScreen>

      {!isEmpty ? (
        <ModuleComposeAction
          label="Registrar medición"
          onClick={openCreate}
        />
      ) : null}

      <MeasurementsEntrySheet
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
        description="Esta sesión de medición se eliminará de forma permanente. Úsalo si la creaste por error."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
