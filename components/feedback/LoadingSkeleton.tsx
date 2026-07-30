import { cn } from "@/lib/utils/cn";

type LoadingSkeletonProps = {
  className?: string;
  rounded?: "s" | "m" | "l" | "xl" | "2xl";
};

const radiusMap = {
  s: "rounded-s",
  m: "rounded-m",
  l: "rounded-l",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
} as const;

export function LoadingSkeleton({
  className,
  rounded = "m",
}: LoadingSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-surface-secondary/80",
        radiusMap[rounded],
        className,
      )}
    />
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-hero">
      <div className="grid grid-cols-[1fr_108px] gap-3 px-5 pt-5">
        <div>
          <LoadingSkeleton className="h-2.5 w-16" />
          <LoadingSkeleton className="mt-2 h-4 w-24" />
          <LoadingSkeleton className="mt-2 h-3 w-28" />
          <LoadingSkeleton className="mt-4 h-9 w-28" />
          <LoadingSkeleton className="mt-3 h-3 w-36" />
          <LoadingSkeleton className="mt-3 h-1 w-full" rounded="s" />
        </div>
        <LoadingSkeleton className="h-[132px] w-full" rounded="l" />
      </div>
      <div className="p-5 pt-4">
        <LoadingSkeleton className="h-14 w-full" rounded="m" />
      </div>
    </div>
  );
}

export function MetricCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "bg-surface",
        featured ? "rounded-l px-5 py-4 shadow-s" : "rounded-l px-4 py-3.5 shadow-xs",
      )}
    >
      <LoadingSkeleton className="h-2.5 w-12" />
      <LoadingSkeleton className={cn("w-24", featured ? "mt-3 h-9" : "mt-2.5 h-6")} />
      <LoadingSkeleton className="mt-2 h-3 w-16" />
    </div>
  );
}

export function HistoryRowSkeleton() {
  return (
    <div className="flex h-[length:var(--traza-history-row-height)] items-center rounded-l bg-surface px-4 shadow-xs">
      <LoadingSkeleton className="h-3 w-20" />
      <LoadingSkeleton className="ml-auto h-4 w-16" />
    </div>
  );
}
