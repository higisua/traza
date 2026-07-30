"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  ChartNoAxesColumn,
  Dumbbell,
  Home,
  Ellipsis,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  emphasize?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Inicio", icon: Home },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/train", label: "Entrenar", icon: Dumbbell, emphasize: true },
  { href: "/progress", label: "Progreso", icon: ChartNoAxesColumn },
  { href: "/more", label: "Más", icon: Ellipsis },
];

type BottomNavigationProps = {
  fixed?: boolean;
};

export function BottomNavigation({ fixed = true }: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "border-t border-border-light/70 bg-surface/92 backdrop-blur-xl pb-safe",
        fixed
          ? "fixed inset-x-0 bottom-0 z-[var(--traza-z-navigation)]"
          : "relative w-full",
      )}
    >
      <div className="mx-auto flex h-[length:var(--traza-bottom-nav-height)] max-w-[length:var(--traza-content-max)] items-end justify-between px-1 pb-1.5">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 px-0.5",
                active ? "text-text-primary" : "text-text-muted",
              )}
            >
              <motion.span
                className={cn(
                  "flex items-center justify-center",
                  item.emphasize
                    ? "mb-0.5 size-12 -mt-5 rounded-[18px] bg-primary text-text-primary shadow-train"
                    : "size-7",
                )}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <Icon
                  size={item.emphasize ? 22 : 18}
                  strokeWidth={active || item.emphasize ? 2.15 : 1.7}
                />
              </motion.span>

              <span
                className={cn(
                  "w-full text-center text-[10px] leading-none tracking-[-0.01em] whitespace-nowrap",
                  item.emphasize || active ? "font-semibold" : "font-medium",
                  item.emphasize && "text-text-primary",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
