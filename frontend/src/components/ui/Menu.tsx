"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   Dropdown menu.

   Base UI supplies the behaviour — focus trapping, typeahead, roving
   tabindex, outside-press and escape handling — so keyboard users get the
   full ARIA menu contract for free. Only the surface is styled here.
   ──────────────────────────────────────────────────────────────────────── */

export const MenuRoot = MenuPrimitive.Root;
export const MenuTrigger = MenuPrimitive.Trigger;

export function MenuContent({
  children,
  align = "end",
  sideOffset = 8,
  className,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          className={cn(
            "z-50 min-w-56 origin-[var(--transform-origin)] overflow-hidden rounded-xl",
            "border border-line bg-surface p-1.5 shadow-pop",
            "animate-scale-in outline-none",
            className
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />;
}

export function MenuItem({
  children,
  onClick,
  tone: itemTone = "default",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "critical";
  className?: string;
}) {
  return (
    <MenuPrimitive.Item
      onClick={onClick}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2",
        "text-sm outline-none transition-colors duration-150",
        "data-[highlighted]:bg-surface-sunken",
        itemTone === "critical"
          ? "text-critical-strong data-[highlighted]:bg-critical-soft"
          : "text-ink",
        "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-ink-subtle",
        itemTone === "critical" && "[&_svg]:text-critical-base",
        className
      )}
    >
      {children}
    </MenuPrimitive.Item>
  );
}
