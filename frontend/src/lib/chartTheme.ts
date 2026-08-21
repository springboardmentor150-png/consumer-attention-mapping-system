// Recharts styling drawn from the same design tokens as the rest of the app
// (see the @theme block in globals.css). Values are `var(--color-…)` strings
// rather than hex so a palette change — including the dark-theme swap, which
// redefines the same variable names — lands here too, with no second source
// of colour to keep in sync.

export const CHART_COLORS = {
  brand: "var(--color-brand-base)",
  analytics: "var(--color-analytics-base)",
  healthy: "var(--color-healthy-base)",
  warning: "var(--color-warning-base)",
  critical: "var(--color-critical-base)",
  ai: "var(--color-ai-base)",
  behavior: "var(--color-behavior-base)",
} as const;

/** Ordered series palette, for charts that colour by index. */
export const SERIES = [
  CHART_COLORS.brand,
  CHART_COLORS.behavior,
  CHART_COLORS.analytics,
  CHART_COLORS.ai,
  CHART_COLORS.warning,
  CHART_COLORS.critical,
] as const;

export const CHART_INK = {
  grid: "var(--color-line)",
  axis: "var(--color-line-strong)",
  tick: "var(--color-ink-muted)",
  surface: "var(--color-surface)",
} as const;

/** Shared axis tick styling — 12px, muted, tabular so digits align. */
export const axisTick = {
  fill: CHART_INK.tick,
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
} as const;

/**
 * Shared tooltip chrome. Rendered as an HTML div, so tokens resolve here.
 * Recharts writes these as inline styles, which is why they are objects
 * rather than utility classes.
 */
export const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid var(--color-line)",
  background: "var(--color-surface)",
  boxShadow: "var(--shadow-pop)",
  fontSize: 12,
  color: "var(--color-ink)",
  padding: "10px 14px",
} as const;

export const tooltipLabelStyle = {
  color: "var(--color-ink-muted)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  marginBottom: 4,
};

export const tooltipItemStyle = {
  color: "var(--color-ink)",
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
};

export const tooltipCursor = {
  fill: "var(--color-surface-sunken)",
  radius: 8,
} as const;

/** Cursor for line/area charts, where a filled band would be too heavy. */
export const lineCursor = {
  stroke: "var(--color-line-strong)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
} as const;

/**
 * Gradient stops for an area fill, as a fraction of the series colour.
 * Recharts needs a <defs> entry per gradient; `gradientId` keeps those ids
 * unique per chart instance.
 */
export function areaGradientStops(color: string) {
  return [
    { offset: "0%", color, opacity: 0.28 },
    { offset: "55%", color, opacity: 0.08 },
    { offset: "100%", color, opacity: 0 },
  ];
}

/**
 * Tooltip value formatter.
 *
 * Recharts types the incoming value as `ValueType | undefined`, so callers
 * that only care about numbers would each need their own narrowing. This
 * wrapper does it once and hands back a `[value, label]` pair in the shape
 * Recharts expects.
 */
export function formatValue(
  render: (value: number) => string,
  label?: string
) {
  return (value: unknown, name: unknown): [string, string] => {
    const numeric = typeof value === "number" ? value : Number(value ?? 0);

    return [
      render(Number.isFinite(numeric) ? numeric : 0),
      label ?? String(name ?? ""),
    ];
  };
}
