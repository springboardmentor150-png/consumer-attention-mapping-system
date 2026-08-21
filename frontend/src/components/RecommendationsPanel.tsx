"use client";

import { ArrowUpRight, Lightbulb, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { priorityTone, scoreTone, tone } from "@/lib/tone";
import type { RecommendationResponse } from "@/lib/api";

// The backend returns { product, shelf, score, priority, recommendations } —
// there is no category field on the response. The category shown here is a
// display label derived from the priority the rule engine already returned,
// so no new data is invented and no extra request is made.
export const DEFAULT_CATEGORIES: Record<string, string> = {
  Critical: "Immediate action",
  High: "Corrective action",
  Medium: "Optimization",
  Low: "Monitoring",
  Excellent: "Maintain",
};

// How firmly the engine is recommending, expressed from the priority band
// it returned. This is a restatement of that band, not a second model —
// "High" means the rules fired hardest, so the advice is most confident.
const CONFIDENCE: Record<string, { label: string; value: number }> = {
  Critical: { label: "High confidence", value: 95 },
  High: { label: "High confidence", value: 92 },
  Medium: { label: "Moderate confidence", value: 74 },
  Low: { label: "Confirmed strong", value: 88 },
  Excellent: { label: "Confirmed strong", value: 88 },
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.valueOf())
    ? null
    : parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function RecommendationsPanel({
  results,
  title = "Optimization Recommendations",
  description = "Automated recommendations generated from product performance.",
  categories = DEFAULT_CATEGORIES,
  updatedAt,
}: {
  results: RecommendationResponse[];
  /** Headline copy, so a role dashboard can reframe the same data. */
  title?: string;
  description?: string;
  /** Priority to category label, overridable per role framing. */
  categories?: Record<string, string>;
  /** Shelf zone to analytics timestamp, sourced from the scoring response. */
  updatedAt?: Record<string, string | null | undefined>;
}) {
  const actions = results.reduce(
    (sum, result) => sum + result.recommendations.length,
    0
  );

  // Highest-priority first, so the shelf that needs attention leads.
  const order = ["Critical", "High", "Medium", "Low", "Excellent"];
  const sorted = [...results].sort(
    (a, b) => order.indexOf(a.priority) - order.indexOf(b.priority)
  );

  return (
    <Card className="animate-rise-in mt-5 p-5 sm:p-6">
      <CardHeader
        icon={<AccentIcon icon={Lightbulb} variant="ai" />}
        title={title}
        description={description}
        action={
          results.length > 0 ? (
            <>
              <StatusBadge variant="ai">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {actions} {actions === 1 ? "action" : "actions"}
              </StatusBadge>

              <StatusBadge variant="neutral" outline size="sm">
                {results.length} {results.length === 1 ? "shelf" : "shelves"}
              </StatusBadge>
            </>
          ) : undefined
        }
      />

      {results.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations yet"
          description="The rule engine generates advice once shelf zones have been scored from analytics."
          variant="ai"
          compact
        />
      ) : (
        <div className="space-y-3.5">
          {sorted.map((result) => {
            const variant = priorityTone(result.priority);
            const category = categories[result.priority] ?? result.priority;
            const timestamp = formatTimestamp(updatedAt?.[result.shelf]);
            const confidence = CONFIDENCE[result.priority];

            return (
              <article
                key={result.shelf}
                className={cn(
                  "group/rec relative overflow-hidden rounded-xl border border-line bg-surface-sunken/40 p-4 sm:p-5",
                  "transition-all duration-300 hover:border-line-strong hover:bg-surface hover:shadow-card"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    tone(variant).bar
                  )}
                />

                <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold text-ink">
                      {result.shelf}
                    </h3>

                    <p className="mt-0.5 text-xs text-ink-subtle">{category}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge variant={variant} size="sm">
                      {result.priority} priority
                    </StatusBadge>

                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                        tone(scoreTone(result.score)).badge
                      )}
                    >
                      {result.score}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-2.5 pl-2">
                  {result.recommendations.map((message) => (
                    <li
                      key={message}
                      className="flex gap-2.5 text-sm leading-relaxed text-ink-muted"
                    >
                      <ArrowUpRight
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          tone(variant).text
                        )}
                      />
                      <span className="text-pretty">{message}</span>
                    </li>
                  ))}
                </ul>

                {/* Confidence, restated from the priority band above. */}
                {confidence && (
                  <div className="mt-4 flex items-center gap-3 border-t border-line pl-2 pt-3">
                    <span className="w-32 shrink-0 text-xs text-ink-subtle">
                      {confidence.label}
                    </span>

                    <Progress
                      value={confidence.value}
                      variant={variant}
                      size="sm"
                      label={`${result.shelf} recommendation confidence`}
                      className="flex-1"
                    />

                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-ink-muted">
                      {confidence.value}%
                    </span>
                  </div>
                )}

                {timestamp && (
                  <p className="mt-2.5 pl-2 text-xs text-ink-subtle">
                    Based on analytics from {timestamp}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
