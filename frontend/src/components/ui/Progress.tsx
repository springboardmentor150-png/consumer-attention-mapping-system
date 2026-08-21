import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

/** Horizontal 0-100 rail. */
export function Progress({
  value,
  variant = "analytics",
  label,
  size = "md",
  className,
}: {
  value: number;
  variant?: Tone;
  /** Accessible name — required whenever the rail is not beside its label. */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-full bg-surface-sunken",
        size === "sm" ? "h-1.5" : "h-2",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone(variant).bar
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/**
 * Circular gauge for a single 0-100 figure.
 *
 * Drawn as two stroked circles with a dash offset, so it animates as a
 * single CSS transition and needs no chart library.
 */
export function Gauge({
  value,
  variant = "analytics",
  size = 132,
  thickness = 10,
  label,
  caption,
  className,
}: {
  value: number;
  variant?: Tone;
  size?: number;
  thickness?: number;
  /** Big text in the middle. Defaults to the rounded value. */
  label?: string;
  /** Small text under the value. */
  caption?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  // 75% of the circle is the track; the gap sits at the bottom.
  const sweep = 0.75;
  const dash = circumference * sweep;
  const offset = dash * (1 - clamped / 100);
  const styles = tone(variant);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? Math.round(clamped)}${caption ? ` — ${caption}` : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-[225deg]"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="stroke-surface-sunken"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-out",
            styles.text
          )}
          stroke="currentColor"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-display text-3xl font-bold tabular-nums tracking-tight",
            styles.text
          )}
        >
          {label ?? Math.round(clamped)}
        </span>

        {caption && (
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
