"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type FieldInputProps = {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function FieldInput({
  label,
  error,
  hint,
  containerClassName,
  className,
  id,
  ...props
}: FieldInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
      <label
        htmlFor={inputId}
        className="text-label font-medium tracking-label text-text-muted uppercase"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-[length:var(--traza-input-height)] w-full rounded-[var(--traza-radius-input)]",
          "border border-border/80 bg-surface px-4 shadow-xs",
          "text-body font-semibold text-text-primary tabular-nums",
          "transition-[border-color,box-shadow] duration-[var(--traza-duration-normal)]",
          "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25",
          error && "border-danger focus:ring-danger/25",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="text-caption text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
