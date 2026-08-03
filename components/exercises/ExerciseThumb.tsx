"use client";

import Image from "next/image";
import { ExerciseImageRepository } from "@/features/exercises";
import { cn } from "@/lib/utils/cn";

type ExerciseThumbProps = {
  imagePath: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: "size-[56px]",
  md: "size-[72px]",
  /** Detail / form preview — compact square well, full illustration visible. */
  lg: "mx-auto size-[120px]",
} as const;

export function ExerciseThumb({
  imagePath,
  alt,
  size = "sm",
  className,
}: ExerciseThumbProps) {
  const src = ExerciseImageRepository.resolveDisplayPath(imagePath);
  const isLg = size === "lg";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-surface-secondary",
        isLg ? "rounded-[24px]" : "rounded-[16px]",
        SIZE[size],
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={isLg ? "object-contain p-2" : "object-cover"}
        sizes={isLg ? "120px" : "72px"}
      />
    </div>
  );
}
