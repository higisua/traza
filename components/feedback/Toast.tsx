"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toastVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ToastTone = "default" | "success" | "danger";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--traza-bottom-nav-height)+24px)] z-[var(--traza-z-toast)] flex flex-col items-center gap-2 px-5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} tone={toast.tone} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

type ToastProps = {
  message: string;
  tone?: ToastTone;
  className?: string;
  /** When false, skip entrance hidden state (needed for SSR/static demos). */
  animateEntrance?: boolean;
};

export function Toast({
  message,
  tone = "default",
  className,
  animateEntrance = true,
}: ToastProps) {
  return (
    <motion.div
      role="status"
      variants={toastVariants}
      initial={animateEntrance ? "hidden" : false}
      animate="visible"
      exit="exit"
      className={cn(
        "pointer-events-auto w-full max-w-[length:var(--traza-content-max)]",
        "rounded-m px-5 py-4 text-body font-medium shadow-m",
        tone === "default" && "bg-text-primary text-text-inverse",
        tone === "success" && "bg-success text-text-inverse",
        tone === "danger" && "bg-danger text-text-inverse",
        className,
      )}
    >
      {message}
    </motion.div>
  );
}
