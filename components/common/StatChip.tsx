import { cn } from "@/lib/utils/cn";

type StatChipVariant = "neutral" | "success" | "warning" | "primary" | "muted";

type StatChipProps = {
  children: string;
  variant?: StatChipVariant;
  className?: string;
};

const variantClasses: Record<StatChipVariant, string> = {
  neutral: "bg-surface-secondary/80 text-text-secondary",
  success: "bg-[color-mix(in_srgb,var(--traza-success)_12%,white)] text-success",
  warning: "bg-[color-mix(in_srgb,var(--traza-warning)_14%,white)] text-[color:var(--traza-warning)]",
  primary: "bg-primary-soft text-text-primary",
  muted: "bg-transparent text-text-muted",
};

export function StatChip({
  children,
  variant = "neutral",
  className,
}: StatChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-s px-2.5",
        "text-label font-medium tracking-label uppercase",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
