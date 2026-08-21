"use client";

import { Sparkles, Target, TrendingUp } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Gauge, Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { scoreTone, tone } from "@/lib/tone";
import {
  healthFor,
  METRIC_KEYS,
  METRIC_LABELS,
} from "@/lib/attractiveness";
import { zoneLabel, type AttractivenessResponse } from "@/lib/api";

function lastUpdated(value: string | null | undefined) {
  if (!value) return "Awaiting analytics";

  const parsed = new Date(value);

  return Number.isNaN(parsed.valueOf())
    ? "Awaiting analytics"
    : parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

// Status word for a 0-100 score. Read from the shared health bands in
// src/lib/attractiveness.ts rather than a local table, so this badge can
// never disagree with the priority on the advice card for the same shelf.
function scoreBand(score: number) {
  return healthFor(score).label;
}

// The five inputs the formula consumes, in the order it weights them.
// Labels only — the values come from metrics_used on the response.
const METRIC_ROWS = METRIC_KEYS.map((key) => ({
  key,
  label: METRIC_LABELS[key],
}));

export function AttractivenessGrid({
  products,
  loading = false,
  error = false,
  title = "Product Attractiveness Scoring",
  description = "Scored automatically from camera analytics. No manual input required.",
}: {
  products: AttractivenessResponse[];
  loading?: boolean;
  error?: boolean;
  /** Headline copy, so a role dashboard can reframe the same data. */
  title?: string;
  description?: string;
}) {
  const average =
    products.length === 0
      ? null
      : Math.round(
          products.reduce(
            (sum, product) => sum + product.attractiveness_score,
            0
          ) / products.length
        );

  return (
    <Card className="animate-rise-in p-5 sm:p-6">
      <CardHeader
        icon={<AccentIcon icon={Sparkles} variant="ai" />}
        title={title}
        description={description}
        action={
          <>
            {average !== null && (
              <StatusBadge variant={scoreTone(average)}>
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {average} avg
              </StatusBadge>
            )}

            <StatusBadge variant="ai" outline>
              AI scored
            </StatusBadge>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="rounded-xl border border-line p-5">
              <div className="flex items-center gap-5">
                <Skeleton className="h-[132px] w-[132px] rounded-full" />

                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-2 w-3/4 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Scores could not be calculated"
          description="The scoring engine did not respond. Existing analytics are unaffected."
          compact
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No shelf zones to score yet"
          description="Attractiveness is scored per shelf zone from processed camera analytics."
          variant="ai"
          compact
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((product) => {
            const score = product.attractiveness_score;
            const variant = scoreTone(score);
            const metrics = product.metrics_used;

            return (
              <div
                key={product.zone ?? product.product_name}
                className={cn(
                  "group/score relative overflow-hidden rounded-xl border border-line p-5",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl",
                    tone(variant).bar
                  )}
                />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                  <Gauge
                    value={score}
                    variant={variant}
                    caption="/ 100"
                    className="mx-auto shrink-0 sm:mx-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-semibold text-ink">
                          {product.zone
                            ? zoneLabel(product.zone)
                            : product.product_name}
                        </p>

                        <p className="mt-0.5 text-xs text-ink-subtle">
                          {product.analytics_sessions != null
                            ? `${product.analytics_sessions} sessions scored`
                            : "Attractiveness score"}
                        </p>
                      </div>

                      <StatusBadge variant={variant} size="sm">
                        {scoreBand(score)}
                      </StatusBadge>
                    </div>

                    {/* The formula's five inputs, as the backend resolved
                        them. Rendered only when the response carries them. */}
                    {metrics && (
                      <dl className="mt-4 space-y-2">
                        {METRIC_ROWS.map(({ key, label }) => {
                          const raw = (metrics as Record<string, number>)[key];

                          if (typeof raw !== "number") return null;

                          const source = product.metric_sources?.[key];

                          return (
                            <div
                              key={key}
                              className="flex items-center gap-3 text-xs"
                            >
                              <dt className="w-20 shrink-0 truncate text-ink-subtle">
                                {label}
                              </dt>

                              <dd className="flex flex-1 items-center gap-2">
                                <Progress
                                  value={Math.min(raw, 100)}
                                  variant={variant}
                                  size="sm"
                                  label={`${label} input`}
                                  className="flex-1"
                                />

                                <span className="w-10 shrink-0 text-right font-medium tabular-nums text-ink-muted">
                                  {raw.toFixed(0)}
                                </span>

                                {source === "generated" && (
                                  <span
                                    title="Derived by the scoring engine from attention duration"
                                    className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium text-ai-strong"
                                  >
                                    est
                                  </span>
                                )}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}

                    <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                      Last updated {lastUpdated(product.analytics_updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
