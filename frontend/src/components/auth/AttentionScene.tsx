import { cn } from "@/lib/utils";

/**
 * Decorative illustration of the platform's core idea: two shelf zones, a
 * walking aisle between them, shoppers moving through it, and gaze cones
 * landing on the shelves.
 *
 * Pure SVG and CSS — no image asset and no animation library — so it
 * inherits the theme through the colour tokens and costs nothing to load.
 * Marked aria-hidden: it illustrates the copy beside it rather than adding
 * information of its own.
 */
export function AttentionScene({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur",
        className
      )}
    >
      <svg viewBox="0 0 420 220" className="w-full" fill="none">
        <defs>
          <linearGradient id="scene-shelf-a" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-base)"
              stopOpacity="0.42"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-base)"
              stopOpacity="0.1"
            />
          </linearGradient>

          <linearGradient id="scene-shelf-b" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-analytics-base)"
              stopOpacity="0.4"
            />
            <stop
              offset="100%"
              stopColor="var(--color-analytics-base)"
              stopOpacity="0.08"
            />
          </linearGradient>

          <radialGradient id="scene-heat" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--color-critical-base)"
              stopOpacity="0.5"
            />
            <stop
              offset="60%"
              stopColor="var(--color-warning-base)"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="var(--color-warning-base)"
              stopOpacity="0"
            />
          </radialGradient>

          <pattern
            id="scene-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Floor plan */}
        <rect width="420" height="220" fill="url(#scene-grid)" rx="12" />

        {/* Heat blooms where shoppers dwell */}
        <circle cx="120" cy="112" r="62" fill="url(#scene-heat)" />
        <circle cx="300" cy="86" r="48" fill="url(#scene-heat)" />

        {/* Shelf A */}
        <rect
          x="26"
          y="34"
          width="86"
          height="152"
          rx="10"
          fill="url(#scene-shelf-a)"
          stroke="var(--color-brand-base)"
          strokeWidth="1.5"
        />
        <text
          x="69"
          y="26"
          textAnchor="middle"
          className="fill-ink-subtle"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Shelf A
        </text>

        {/* Shelf B */}
        <rect
          x="308"
          y="34"
          width="86"
          height="152"
          rx="10"
          fill="url(#scene-shelf-b)"
          stroke="var(--color-analytics-base)"
          strokeWidth="1.5"
        />
        <text
          x="351"
          y="26"
          textAnchor="middle"
          className="fill-ink-subtle"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Shelf B
        </text>

        {/* Walking aisle */}
        <rect
          x="132"
          y="34"
          width="156"
          height="152"
          rx="10"
          fill="var(--color-surface-sunken)"
          fillOpacity="0.6"
          stroke="var(--color-line)"
          strokeDasharray="5 5"
        />

        {/* Shopper path */}
        <path
          d="M150 178 C 178 146, 168 116, 196 96 S 250 78, 274 60"
          stroke="var(--color-teal-base)"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />

        {/* Gaze cones */}
        <path
          d="M196 96 L 116 60 L 116 132 Z"
          fill="var(--color-brand-base)"
          fillOpacity="0.16"
          stroke="var(--color-brand-base)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
        <path
          d="M274 60 L 306 34 L 306 96 Z"
          fill="var(--color-analytics-base)"
          fillOpacity="0.16"
          stroke="var(--color-analytics-base)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />

        {/* Shoppers, drifting slowly so the scene reads as live */}
        <g className="animate-float">
          <circle
            cx="196"
            cy="96"
            r="7"
            fill="var(--color-brand-base)"
            stroke="var(--color-surface)"
            strokeWidth="2.5"
          />
        </g>

        <g className="animate-float [animation-delay:-3.5s]">
          <circle
            cx="274"
            cy="60"
            r="7"
            fill="var(--color-analytics-base)"
            stroke="var(--color-surface)"
            strokeWidth="2.5"
          />
        </g>

        <g className="animate-float [animation-delay:-5s]">
          <circle
            cx="160"
            cy="158"
            r="5.5"
            fill="var(--color-teal-base)"
            stroke="var(--color-surface)"
            strokeWidth="2.5"
          />
        </g>

        {/* Detection box on the leading shopper */}
        <rect
          x="180"
          y="78"
          width="34"
          height="36"
          rx="4"
          fill="none"
          stroke="var(--color-brand-base)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>

      {/* Scanning sweep across the plate. */}
      <span
        className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-brand-base/12 to-transparent"
        aria-hidden="true"
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-ink-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-base" />
          Gaze cone
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-base" />
          Shopper path
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning-base" />
          Dwell hotspot
        </span>
      </div>
    </div>
  );
}
