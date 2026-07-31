"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { pressAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
} & Omit<HTMLMotionProps<"button">, "children" | "disabled" | "type">;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-primary shadow-train hover:bg-primary-hover active:bg-primary-pressed hover:shadow-m",
  secondary:
    "bg-surface text-text-primary border border-border/80 shadow-xs hover:bg-surface-hover hover:border-border",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-secondary/70",
  danger:
    "bg-surface text-danger border border-danger/40 hover:border-danger hover:bg-[color-mix(in_srgb,var(--traza-danger)_5%,white)]",
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  fullWidth = true,
  disabled,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileTap={pressAnimation.whileTap}
      transition={pressAnimation.transition}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "h-[length:var(--traza-button-height)] rounded-m px-6",
        "text-body font-semibold leading-title tracking-title",
        "transition-[background-color,box-shadow,border-color] duration-[var(--traza-duration-normal)]",
        "disabled:pointer-events-none disabled:bg-surface-secondary disabled:text-text-muted disabled:shadow-none disabled:border-transparent disabled:opacity-[var(--traza-opacity-disabled)]",
        fullWidth ? "w-full" : "w-auto min-w-[128px]",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-pulse rounded-full bg-current opacity-40" />
          <span>Cargando…</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}

export function GhostButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="ghost" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="danger" {...props} />;
}
