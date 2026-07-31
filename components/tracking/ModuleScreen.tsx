"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { fadeSlideVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ModuleScreenProps = {
  title: string;
  children: ReactNode;
  isEmpty?: boolean;
  backHref?: string;
  action?: ReactNode;
};

export function ModuleScreen({
  title,
  children,
  isEmpty = false,
  backHref = "/home",
  action,
}: ModuleScreenProps) {
  const router = useRouter();

  return (
    <motion.div
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative min-h-dvh",
        isEmpty
          ? "pb-[max(24px,env(safe-area-inset-bottom))]"
          : "pb-[calc(88px+env(safe-area-inset-bottom))]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title={title}
          onBack={() => router.push(backHref)}
          action={action}
        />
        <div className="mt-3 flex flex-col gap-4">{children}</div>
      </div>
    </motion.div>
  );
}
