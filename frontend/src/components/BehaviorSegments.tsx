"use client";

import { Users, UsersRound } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkline } from "@/components/ui/Sparkline";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";
import type { AnalyticsSession } from "@/lib/api";

// Labels written by the backend K-Means segmentation
// (app/services/behavior/segmentation.py). Each is given a semantic tone
// rather than a raw colour so the palette stays in one place.
const SEGMENTS: { label: string; variant: Tone; blurb: string }[] = [
  {
    label: "Explorer",
    variant: "behavior",
    blurb: "Long dwell, wide path — browsing across zones",
  },
  {
    label: "Quick Buyer",
    variant: "brand",
    blurb: "Short dwell, direct path — decided on arrival",
  },
  {
    label: "Comparison Shopper",
    variant: "warning",
    blurb: "High gaze shifts — weighing options at the shelf",
  },
];

export function BehaviorSegments({
  sessions,
}: {
  sessions: AnalyticsSession[];
}) {
  const segmented = sessions.filter((session) => session.segment !== null);

  const distribution = SEGMENTS.map((segment) => {
    const rows = segmented.filter(
      (session) => session.segment === segment.label
    );

    const count = rows.length;
    const ratio = segmented.length === 0 ? 0 : count / segmented.length;

    const averageDwell =
      count === 0
        ? 0
        : rows.reduce((sum, row) => sum + row.dwell_time, 0) / count;

    return {
      ...segment,
      count,
      averageDwell,
      // Exact ratio drives the bar so rounding can't overflow the track;
      // the rounded value is only used for display.
      width: ratio * 100,
      share: Math.round(ratio * 100),
      // Dwell per session, ordered as recorded — enough for a shape.
      series: rows.slice(-12).map((row) => row.dwell_time),
    };
  });

  const dominant = distribution.reduce(
    (best, segment) => (segment.count > best.count ? segment : best),
    distribution[0]
  );

  return (
    <Card className="animate-rise-in p-5 sm:p-6">
      <CardHeader
        icon={<AccentIcon icon={Users} variant="behavior" />}
        title="Shopper Behavioral Segments"
        description="K-Means behavioral classification from completed shopper sessions."
        action={
          <StatusBadge variant={segmented.length > 0 ? "behavior" : "neutral"}>
            {segmented.length.toLocaleString()} segmented
          </StatusBadge>
        }
      />

      {segmented.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No behavioural data yet"
          description="Segments are assigned once enough sessions exist for the model to cluster them."
          variant="behavior"
          compact
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {distribution.map((segment) => (
              <div
                key={segment.label}
                className={cn(
                  "group/segment relative overflow-hidden rounded-xl border border-line p-5",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    tone(segment.variant).bar
                  )}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">
                      {segment.label}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-ink-subtle">
                      {segment.blurb}
                    </p>
                  </div>

                  <StatusBadge variant={segment.variant} size="sm">
                    {segment.share}%
                  </StatusBadge>
                </div>

                <p className="mt-4 font-display text-3xl font-bold tracking-tight text-ink tabular-nums">
                  {segment.count.toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-ink-subtle">
                  {segment.count === 1 ? "shopper" : "shoppers"} ·{" "}
                  {segment.averageDwell.toFixed(1)}s average dwell
                </p>

                {segment.series.length > 1 && (
                  <Sparkline
                    values={segment.series}
                    variant={segment.variant}
                    className="mt-4"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Combined distribution rail. */}
          <div className="mt-6">
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-surface-sunken"
              role="img"
              aria-label={distribution
                .map((s) => `${s.label} ${s.share}%`)
                .join(", ")}
            >
              {distribution.map((segment) =>
                segment.count === 0 ? null : (
                  <div
                    key={segment.label}
                    className={cn(
                      tone(segment.variant).bar,
                      "transition-[width] duration-700 ease-out"
                    )}
                    style={{ width: `${segment.width}%` }}
                    title={`${segment.label}: ${segment.count} (${segment.share}%)`}
                  />
                )
              )}
            </div>

            <p className="mt-3 text-xs text-ink-subtle">
              {dominant && dominant.count > 0 ? (
                <>
                  <span className="font-medium text-ink-muted">
                    {dominant.label}
                  </span>{" "}
                  is the dominant behaviour at {dominant.share}% of{" "}
                  {segmented.length.toLocaleString()} segmented{" "}
                  {segmented.length === 1 ? "session" : "sessions"}.
                </>
              ) : (
                <>
                  Segment distribution across {segmented.length.toLocaleString()}{" "}
                  segmented {segmented.length === 1 ? "session" : "sessions"}.
                </>
              )}
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
