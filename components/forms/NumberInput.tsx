"use client";

import { X } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  useId,
} from "react";
import { cn } from "@/lib/utils/cn";

type NumberInputProps = {
  label?: string;
  hint?: string;
  error?: string;
  unit?: string;
  onClear?: () => void;
  containerClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      label,
      hint,
      error,
      unit,
      onClear,
      className,
      containerClassName,
      id,
      disabled,
      value,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const showClear = Boolean(onClear && value !== undefined && value !== "" && !disabled);

    return (
      <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-label font-medium tracking-label text-text-muted uppercase"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            disabled={disabled}
            value={value}
            onFocus={(event) => event.currentTarget.select()}
            autoComplete="off"
            className={cn(
              "h-[length:var(--traza-input-height)] w-full rounded-[var(--traza-radius-input)]",
              "border border-border/80 bg-surface px-4 shadow-xs",
              "text-section font-bold leading-display tracking-title text-text-primary tabular-nums",
              "placeholder:text-text-muted placeholder:text-body placeholder:font-normal",
              "transition-[border-color,box-shadow] duration-[var(--traza-duration-normal)]",
              "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25",
              "disabled:bg-surface-secondary disabled:text-text-disabled disabled:opacity-[var(--traza-opacity-disabled)]",
              error && "border-danger focus:ring-danger/25",
              (unit || showClear) && "pr-16",
              className,
            )}
            {...props}
          />

          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-2">
            {unit ? (
              <span className="text-caption font-medium text-text-muted">{unit}</span>
            ) : null}
            {showClear ? (
              <button
                type="button"
                aria-label="Borrar"
                onClick={onClear}
                className="pointer-events-auto flex size-8 items-center justify-center rounded-xs text-text-muted hover:bg-surface-secondary hover:text-text-primary"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="text-caption text-danger">{error}</p>
        ) : hint ? (
          <p className="text-caption text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
