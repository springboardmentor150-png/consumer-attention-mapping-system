"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Page stepper for the data tables.
 *
 * Numbered buttons are shown up to seven pages and collapse to a
 * "page x of y" readout past that, so the control never wraps onto a
 * second line on a narrow screen.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const numbered = totalPages <= 7;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex items-center justify-between gap-3 border-t border-line px-5 py-3.5",
        className
      )}
    >
      <p className="text-xs text-ink-subtle tabular-nums">
        Page <span className="font-semibold text-ink-muted">{page}</span> of{" "}
        {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {numbered &&
          Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <button
                key={number}
                type="button"
                onClick={() => onPageChange(number)}
                aria-current={number === page ? "page" : undefined}
                className={cn(
                  "h-8 min-w-8 rounded-lg px-2 text-xs font-medium tabular-nums",
                  "transition-colors duration-200",
                  number === page
                    ? "bg-brand-base text-white shadow-brand"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                )}
              >
                {number}
              </button>
            )
          )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors duration-200 hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
