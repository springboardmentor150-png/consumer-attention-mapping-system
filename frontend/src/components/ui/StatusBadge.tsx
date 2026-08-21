import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

/**
 * Small status pill — priority, score band, live/offline state.
 *
 * `dot` adds a leading indicator for states rather than classifications;
 * `pulse` animates that dot, and is reserved for genuinely live states
 * (an active session, a running pipeline) so it keeps its meaning.
 */
export function StatusBadge({
  children,
  variant = "neutral",
  dot = false,
  pulse = false,
  outline = false,
  size = "md",
  className,
}: {
  children: React.ReactNode;
  variant?: Tone;
  dot?: boolean;
  pulse?: boolean;
  /** Bordered rather than filled — for badges on a tinted surface. */
  outline?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const styles = tone(variant);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        outline
          ? cn("border bg-surface", styles.border, styles.text)
          : styles.badge,
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                styles.bar
              )}
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              styles.bar
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
