import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

/**
 * A tiny inline trend line, drawn as hand-rolled SVG.
 *
 * Deliberately not Recharts: a stat card renders eight of these, and a full
 * chart runtime per card would cost far more than the 40 lines below. It is
 * decoration for a number that is stated in full beside it, so it carries
 * no axes, no tooltip and no accessible role.
 */
export function Sparkline({
  values,
  variant = "analytics",
  className,
  area = true,
  height = 34,
  width = 120,
}: {
  values: number[];
  variant?: Tone;
  className?: string;
  /** Fills under the line with a fading gradient. */
  area?: boolean;
  height?: number;
  width?: number;
}) {
  if (values.length < 2) {
    return (
      <div
        aria-hidden="true"
        className={cn("h-[34px] w-full rounded-md bg-surface-sunken/60", className)}
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero; render it down the middle instead.
  const span = max - min || 1;
  const pad = 3;
  const stepX = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * stepX;
    const y =
      max === min
        ? height / 2
        : pad + (1 - (value - min) / span) * (height - pad * 2);

    return [x, y] as const;
  });

  // Catmull-Rom-ish smoothing: each segment gets control points at the
  // midpoint, which reads as a curve without overshooting the data.
  const line = points
    .map(([x, y], index) => {
      if (index === 0) return `M ${x} ${y}`;
      const [px, py] = points[index - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(" ");

  const fill = `${line} L ${width} ${height} L 0 ${height} Z`;
  const gradientId = `spark-${variant}-${values.length}-${Math.round(max * 100)}`;
  const stroke = tone(variant).text;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-[34px] w-full overflow-visible", stroke, className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {area && <path d={fill} fill={`url(#${gradientId})`} stroke="none" />}

      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Head of the series, so the eye lands on the latest value. */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2.5"
        fill="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
