"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeSlideVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type FadeInProps = {
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "animate" | "variants">;

/**
 * Entrance animation that stays visible during SSR.
 * Animates only after the client has mounted.
 */
export function FadeIn({ children, className, ...props }: FadeInProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      variants={fadeSlideVariants}
      initial={false}
      animate={mounted ? "visible" : "visible"}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
