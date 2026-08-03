"use client";

import { useRouter } from "next/navigation";
import { LayoutList } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";

export function RoutinesComingSoonScreen() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh px-5 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader
        title="Rutinas"
        onBack={() => router.push("/more/training")}
      />
      <EmptyState
        className="mt-6"
        title="Próximamente"
        description="El editor de rutinas llegará en una fase posterior. Tu biblioteca de ejercicios ya queda lista para ellas."
        illustration={
          <span className="flex size-[64px] items-center justify-center rounded-[18px] bg-surface-secondary text-text-muted">
            <LayoutList size={28} strokeWidth={2} />
          </span>
        }
      />
    </div>
  );
}
