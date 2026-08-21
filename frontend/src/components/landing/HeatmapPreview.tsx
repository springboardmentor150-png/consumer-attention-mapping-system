import { cn } from "@/lib/utils";

/**
 * Illustrative store heatmap for the marketing page.
 *
 * Drawn rather than screenshotted so it themes correctly and stays sharp at
 * any size. The real product renders this from processed footage; this is a
 * representation of that output, labelled as a sample in the caption.
 */
export function HeatmapPreview({ className }: { className?: string }) {
  const blooms = [
    { cx: 96, cy: 126, r: 74, intensity: 0.55 },
    { cx: 214, cy: 92, r: 62, intensity: 0.45 },
    { cx: 322, cy: 148, r: 54, intensity: 0.35 },
    { cx: 168, cy: 186, r: 44, intensity: 0.28 },
  ];

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-canvas-deep shadow-card",
        className
      )}
    >
      <svg viewBox="0 0 420 260" className="w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="bloom-hot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-critical-base)" stopOpacity="0.85" />
            <stop offset="35%" stopColor="var(--color-warning-base)" stopOpacity="0.5" />
            <stop offset="70%" stopColor="var(--color-healthy-base)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-analytics-base)" stopOpacity="0" />
          </radialGradient>

          <pattern id="floor" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="420" height="260" fill="url(#floor)" />

        {/* Fixtures */}
        {[
          { x: 24, y: 32, w: 72, h: 180 },
          { x: 176, y: 32, w: 68, h: 96 },
          { x: 176, y: 156, w: 68, h: 72 },
          { x: 324, y: 32, w: 72, h: 180 },
        ].map((rect, index) => (
          <rect
            key={index}
            {...rect}
            rx="8"
            fill="var(--color-surface-sunken)"
            fillOpacity="0.65"
            stroke="var(--color-line-strong)"
            strokeWidth="1"
          />
        ))}

        {/* Dwell blooms */}
        {blooms.map((bloom, index) => (
          <circle
            key={index}
            cx={bloom.cx}
            cy={bloom.cy}
            r={bloom.r}
            fill="url(#bloom-hot)"
            opacity={bloom.intensity}
          />
        ))}

        {/* Traffic trace */}
        <path
          d="M40 236 C 96 220, 108 168, 150 148 S 220 132, 244 100 S 300 78, 344 96"
          stroke="var(--color-teal-base)"
          strokeWidth="2"
          strokeDasharray="7 6"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>

      <figcaption className="flex flex-col gap-3 border-t border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-ink-subtle">
          Sample store heatmap — warmer areas mark longer dwell.
        </span>

        <span className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-ink-subtle">Low</span>

          <span className="flex h-2 w-28 overflow-hidden rounded-full">
            {[
              "bg-analytics-base",
              "bg-behavior-base",
              "bg-healthy-base",
              "bg-warning-base",
              "bg-critical-base",
            ].map((stop) => (
              <span key={stop} className={cn("flex-1", stop)} />
            ))}
          </span>

          <span className="text-[11px] font-medium text-ink-subtle">High</span>
        </span>
      </figcaption>
    </figure>
  );
}
