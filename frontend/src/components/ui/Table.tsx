"use client";

import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   Data table primitives.

   A card wraps the table; the header is sticky within the card's scroll
   container; rows separate with hairlines rather than zebra stripes, which
   keeps long tables calm. Column sorting is driven by the page — these
   parts only draw the affordance.
   ──────────────────────────────────────────────────────────────────────── */

export type SortDirection = "asc" | "desc";

export function TableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrollbar-subtle max-h-[34rem] overflow-auto overscroll-contain",
        className
      )}
    >
      <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-sm">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  align = "left",
  sortable = false,
  active = false,
  direction,
  onSort,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right";
  sortable?: boolean;
  active?: boolean;
  direction?: SortDirection;
  onSort?: () => void;
}) {
  const Glyph = !active ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={
        !sortable
          ? undefined
          : active
            ? direction === "asc"
              ? "ascending"
              : "descending"
            : "none"
      }
      className={cn(
        "sticky top-0 z-10 border-b border-line bg-surface-sunken/90 px-5 py-3",
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted backdrop-blur",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md transition-colors duration-150",
            "hover:text-ink",
            active && "text-ink"
          )}
        >
          {children}
          <Glyph className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "group/row transition-colors duration-150 hover:bg-brand-soft/40",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  align = "left",
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={cn(
        "border-b border-line px-5 py-3.5 text-ink-muted",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Monospaced identifier cell — ids, coordinates, hashes. */
export function IdCell({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-xs text-ink-subtle tabular-nums">
      {children}
    </span>
  );
}

/** Toolbar above a table: count on the left, controls on the right. */
export function TableToolbar({
  children,
  count,
  className,
}: {
  children?: ReactNode;
  count?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {count && <div className="text-sm text-ink-muted">{count}</div>}

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {children}
      </div>
    </div>
  );
}
