import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { tone } from "@/lib/tone";

/**
 * Direction-of-travel marker for a metric.
 *
 * `direction` is passed in rather than inferred from the sign, because for
 * some metrics a fall is the good outcome. `label` describes the comparison
 * period ("vs last run") and is optional.
 */
export function TrendIndicator({
  direction,
  value,
  label,
  intent = "positive-up",
  size = "md",
  className,
}: {
  direction: "up" | "down" | "flat";
  value: string;
  label?: string;
  /** Which direction should read as healthy. */
  intent?: "positive-up" | "positive-down";
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : Minus;

  const good =
    intent === "positive-up" ? direction === "up" : direction === "down";

  const variant =
    direction === "flat" ? "neutral" : good ? "healthy" : "critical";

  const styles = tone(variant);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md font-semibold tabular-nums",
          size === "sm" ? "px-1 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-xs",
          styles.badge
        )}
      >
        <Icon className="h-3 w-3" aria-hidden="true" strokeWidth={2.4} />
        {value}
      </span>

      {label && (
        <span
          className={cn(
            "text-ink-subtle",
            size === "sm" ? "text-[11px]" : "text-xs"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
