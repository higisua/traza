"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Dumbbell, LayoutList } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { cn } from "@/lib/utils/cn";

export function TrainingHubScreen() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader title="Gestión de entrenamiento" onBack={() => router.push("/more")} />

        <p className="mt-2 text-caption text-text-secondary">
          Tu biblioteca de ejercicios y, más adelante, rutinas.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          <HubLink
            href="/more/training/exercises"
            icon={Dumbbell}
            title="Biblioteca de ejercicios"
            description="Catálogo personal · ejercicios disponibles"
          />
          <HubLink
            href="/more/training/routines"
            icon={LayoutList}
            title="Rutinas"
            description="Próximamente"
            soon
          />
        </ul>
      </div>
    </div>
  );
}

function HubLink({
  href,
  icon: Icon,
  title,
  description,
  soon = false,
}: {
  href: string;
  icon: typeof Dumbbell;
  title: string;
  description: string;
  soon?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]",
          "transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]",
        )}
      >
        <span className="flex size-[48px] items-center justify-center rounded-[14px] bg-primary/25 text-text-primary">
          <Icon size={22} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-text-primary">
              {title}
            </span>
            {soon ? (
              <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[12px] font-semibold text-text-muted">
                Pronto
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-[13px] text-text-secondary">
            {description}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-text-muted" />
      </Link>
    </li>
  );
}
