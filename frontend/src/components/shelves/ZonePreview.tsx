"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Draws a shelf's zone polygon on a camera-frame plate.
 *
 * Coordinates are stored as free text — the backend accepts whatever the
 * operator typed — so this parses defensively and simply says the shape is
 * unreadable rather than throwing. It is a preview, not a validator: what
 * the API accepts is unchanged.
 */
export function ZonePreview({
  coordinates,
  label,
  compact = false,
  className,
}: {
  coordinates: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const points = useMemo(() => parsePolygon(coordinates), [coordinates]);

  const viewBox = useMemo(() => {
    if (points.length === 0) return { width: 320, height: 200 };

    // Frame the polygon with a margin, so a small zone is still legible.
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);

    const width = Math.max(...xs, 320);
    const height = Math.max(...ys, 200);

    return { width: width * 1.1, height: height * 1.1 };
  }, [points]);

  const polygon = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-canvas-deep",
        compact ? "h-32" : "h-48",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label={
          points.length >= 3
            ? `Zone polygon for ${label ?? "this shelf"}, ${points.length} points`
            : "No readable zone polygon"
        }
      >
        <defs>
          <pattern
            id="zone-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          </pattern>

          <linearGradient id="zone-fill" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-base)"
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor="var(--color-teal-base)"
              stopOpacity="0.15"
            />
          </linearGradient>
        </defs>

        {/* Camera frame. */}
        <rect width="100%" height="100%" fill="url(#zone-grid)" />

        {points.length >= 3 ? (
          <>
            <polygon
              points={polygon}
              fill="url(#zone-fill)"
              stroke="var(--color-brand-base)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {points.map(([x, y], index) => (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="var(--color-surface)"
                stroke="var(--color-brand-base)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </>
        ) : null}
      </svg>

      {points.length < 3 && (
        <figcaption className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-ink-subtle">
          {coordinates.trim()
            ? "Coordinates not readable as a polygon yet"
            : "Enter polygon points to preview the zone"}
        </figcaption>
      )}

      {points.length >= 3 && (
        <figcaption className="absolute bottom-2 left-2 rounded-md bg-surface/85 px-2 py-1 font-mono text-[10px] text-ink-muted backdrop-blur">
          {points.length} points
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Pulls (x, y) pairs out of the stored coordinate string.
 *
 * Accepts the documented `[(x,y),(x,y)…]` form and tolerates JSON-style
 * brackets and stray whitespace, because the field is free text and older
 * records were entered by hand.
 */
function parsePolygon(value: string): [number, number][] {
  if (!value) return [];

  const pairs = value.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?/g);

  if (!pairs) return [];

  return pairs
    .map((pair) => {
      const [x, y] = pair.split(",").map((part) => Number(part.trim()));

      return [x, y] as [number, number];
    })
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}
