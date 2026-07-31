"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "@/components/navigation/BottomSheet";
import {
  DangerButton,
  GhostButton,
  PrimaryButton,
} from "@/components/forms/Button";

type RecordBottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  onRequestDelete?: () => void;
  whenSlot: ReactNode;
  children: ReactNode;
};

export function RecordBottomSheet({
  open,
  title,
  onClose,
  onSave,
  saving = false,
  onRequestDelete,
  whenSlot,
  children,
}: RecordBottomSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {whenSlot}
        {children}
        <div className="mt-1 flex flex-col gap-2">
          <PrimaryButton loading={saving} onClick={onSave}>
            Guardar
          </PrimaryButton>
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          {onRequestDelete ? (
            <DangerButton onClick={onRequestDelete}>
              Eliminar registro
            </DangerButton>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
}
