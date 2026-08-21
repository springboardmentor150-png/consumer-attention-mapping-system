import type { ReactNode } from "react";
import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

/* ────────────────────────────────────────────────────────────────────────
   Empty and error states.

   Both draw the same illustration frame — a tonal orb behind the icon on a
   dotted field — so an empty panel and a failed panel sit at the same
   weight in the page and neither reads as a bug.
   ──────────────────────────────────────────────────────────────────────── */

function Illustration({
  icon: Icon,
  variant,
}: {
  icon: LucideIcon;
  variant: Tone;
}) {
  const styles = tone(variant);

  return (
    <span className="relative flex h-16 w-16 items-center justify-center">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-2xl opacity-25 blur-xl",
          styles.bar
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-2xl border border-dashed",
          styles.border
        )}
      />

      <span
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl",
          styles.icon
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.9} />
      </span>
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "neutral",
  compact = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Usually a <Button /> or a <Link />. */
  action?: ReactNode;
  variant?: Tone;
  /** Tighter padding, for an empty state inside a small tile. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line",
        "bg-surface-sunken/40 bg-dots text-center",
        compact ? "gap-3 px-6 py-8" : "gap-4 px-6 py-12",
        className
      )}
    >
      <Illustration icon={icon} variant={variant} />

      <div className="max-w-sm">
        <p className="font-display text-sm font-semibold text-ink">{title}</p>

        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  compact = false,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-critical-soft",
        "bg-critical-soft/30 text-center",
        compact ? "gap-3 px-6 py-8" : "gap-4 px-6 py-12",
        className
      )}
    >
      <Illustration icon={AlertTriangle} variant="critical" />

      <div className="max-w-sm">
        <p className="font-display text-sm font-semibold text-ink">{title}</p>

        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty">
            {description}
          </p>
        )}
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
