import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder.
 *
 * Loading states are drawn as the shape of the content that is coming, not
 * as the word "Loading" — so the layout does not jump when data lands.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block overflow-hidden rounded-lg bg-surface-sunken",
        "after:absolute after:inset-0 after:animate-shimmer after:shimmer after:content-['']",
        className
      )}
    />
  );
}

/** Stat-card shaped placeholder — matches <StatCard /> exactly. */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>

      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
      <Skeleton className="mt-4 h-8 w-full rounded-md" />
    </div>
  );
}

/** A row of stat-card placeholders. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Chart-panel shaped placeholder: header, legend, plot. */
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="mb-6 flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Varying heights so the placeholder reads as a plot, not a block. */}
      <div className={cn("flex items-end gap-3", height)}>
        {[
          "h-[60%]",
          "h-[88%]",
          "h-[42%]",
          "h-[72%]",
          "h-[96%]",
          "h-[54%]",
          "h-[80%]",
        ].map((bar, index) => (
          <Skeleton key={index} className={cn("flex-1 rounded-t-lg", bar)} />
        ))}
      </div>
    </div>
  );
}

/** Table-shaped placeholder. */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              key={column}
              className={cn(
                "h-3.5",
                column === 0 ? "w-10" : column === 1 ? "flex-[2]" : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Generic panel placeholder for a card whose content is text and lists. */
export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="mb-5 flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
