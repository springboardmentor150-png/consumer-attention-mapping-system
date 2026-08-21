"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AttractivenessGrid } from "@/components/AttractivenessGrid";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import {
  calculateAttractiveness,
  getRecommendation,
  zoneLabel,
  SHELF_ZONES,
  type AttractivenessResponse,
  type RecommendationResponse,
} from "@/lib/api";
import { assessShelves } from "@/lib/attractiveness";

/**
 * Shelf label as both panels print it — the join key between an
 * attractiveness response and its recommendation.
 */
function shelfLabel(entry: AttractivenessResponse): string {
  return entry.zone ? zoneLabel(entry.zone) : entry.product_name;
}

/**
 * Projects the scoring model onto the two panels below.
 *
 * Both panels are built from one `assessShelves` pass, so the score on an
 * attractiveness card, the score on its advice card, the status word, the
 * priority badge and the KPI average are all the same computed number.
 *
 * The score itself comes straight from the weighted formula in
 * src/lib/attractiveness.ts and is never adjusted afterwards; the advice
 * and the priority are derived from that score and the weakest of its five
 * inputs. The backend response is still the source of the shelf identity
 * and its analytics timestamp.
 */
function applyModel(
  scores: AttractivenessResponse[],
  recommendations: RecommendationResponse[]
): {
  scores: AttractivenessResponse[];
  recommendations: RecommendationResponse[];
} {
  const assessed = assessShelves(
    scores.map((entry) => ({
      key: shelfLabel(entry),
      metrics: entry.metrics_used,
      sessions: entry.analytics_sessions,
    }))
  );

  return {
    scores: scores.map((entry) => {
      const shelf = assessed.get(shelfLabel(entry));

      if (!shelf) return entry;

      // metrics_used and metric_sources travel with the score, so the five
      // bars on the card are exactly the inputs that produced the figure
      // above them. Substituted inputs stay labelled "generated", which the
      // card already marks with an "est" chip.
      return {
        ...entry,
        attractiveness_score: shelf.score,
        metrics_used: shelf.metrics,
        metric_sources: shelf.sources,
      };
    }),

    recommendations: recommendations.map((result) => {
      const shelf = assessed.get(result.shelf);

      if (!shelf) return result;

      return {
        ...result,
        // Rounded to match the gauge on the card above, which rounds for
        // display. The unrounded score stays on the attractiveness entry,
        // so the KPI average is still computed from full precision.
        score: Math.round(shelf.score),
        priority: shelf.health.priority,
        recommendations: shelf.recommendations,
      };
    }),
  };
}

/** Copy overrides so a role dashboard can reframe the same data. */
export type ProductIntelligenceFraming = {
  scoreTitle?: string;
  scoreDescription?: string;
  adviceTitle?: string;
  adviceDescription?: string;
  categories?: Record<string, string>;
};

export function ProductIntelligence({
  token,
  storeId = null,
  refreshKey = 0,
  framing = {},
  showScores = true,
  showRecommendations = true,
  onResults,
}: {
  token: string;
  /** Scopes scores to one store. Null pools every store's analytics. */
  storeId?: number | null;
  /**
   * Bumped by the page when a processing run writes new analytics.
   *
   * Scoring reads those analytics, so a run invalidates every figure below.
   * Without this the panel would keep showing the previous run's scores and
   * advice while the KPI row above it counted the new sessions.
   */
  refreshKey?: number;
  framing?: ProductIntelligenceFraming;
  showScores?: boolean;
  showRecommendations?: boolean;
  /**
   * Reports what this panel loaded, so the page above can show the same
   * figures in its KPI row without issuing the requests a second time.
   */
  onResults?: (results: {
    scores: AttractivenessResponse[];
    recommendations: RecommendationResponse[];
    loading: boolean;
    error: boolean;
  }) => void;
}) {
  const [scores, setScores] = useState<AttractivenessResponse[]>([]);
  const [recommendations, setRecommendations] = useState<
    RecommendationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Held in a ref so a caller passing an inline arrow function does not
  // re-run the fetch below on every render of the page above. Written in an
  // effect rather than during render, so the ref is only mutated after the
  // render that produced the new callback has been committed.
  const reportRef = useRef(onResults);

  useEffect(() => {
    reportRef.current = onResults;
  }, [onResults]);

  const report = useCallback(
    (results: {
      scores: AttractivenessResponse[];
      recommendations: RecommendationResponse[];
      loading: boolean;
      error: boolean;
    }) => reportRef.current?.(results),
    []
  );

  // Same refresh pattern the other analytics panels use (see HeatmapPanel):
  // fetch once per mount, keyed on the token. Scoring is fully automatic now,
  // so re-entering the dashboard after a video is processed picks up the new
  // attention duration and the score moves with it.
  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadScores() {
      setLoading(true);
      setError(false);
      report({ scores: [], recommendations: [], loading: true, error: false });

      try {
        const scored = await Promise.all(
          SHELF_ZONES.map((zone) =>
            calculateAttractiveness(
              { product_name: zoneLabel(zone), zone, store_id: storeId },
              token
            )
          )
        );

        const advice = await Promise.all(
          scored.map((entry) =>
            getRecommendation(
              entry.product_name,
              entry.zone ?? null,
              entry.attractiveness_score,
              token,
              { storeId }
            )
          )
        );

        if (cancelled) return;

        setScores(scored);
        setRecommendations(advice);

        // The KPI row above mirrors what these panels show, so it reads
        // the same computed figures. State keeps the raw responses.
        const presented = applyModel(scored, advice);

        report({
          scores: presented.scores,
          recommendations: presented.recommendations,
          loading: false,
          error: false,
        });
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(true);
          report({
            scores: [],
            recommendations: [],
            loading: false,
            error: true,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadScores();

    return () => {
      cancelled = true;
    };
  }, [token, storeId, report, refreshKey]);

  // Scored copies. State above holds the raw backend responses.
  const presented = useMemo(
    () => applyModel(scores, recommendations),
    [scores, recommendations]
  );

  // The recommendation response carries no timestamp of its own. Both panels
  // are built from the same scoring call, so the shelf's analytics timestamp
  // is reused here rather than requesting anything extra.
  const updatedAt = useMemo(() => {
    const byShelf: Record<string, string | null | undefined> = {};

    scores.forEach((entry) => {
      const label = entry.zone ? zoneLabel(entry.zone) : entry.product_name;
      byShelf[label] = entry.analytics_updated_at;
    });

    return byShelf;
  }, [scores]);

  return (
    <>
      {showScores && (
        <AttractivenessGrid
          products={presented.scores}
          loading={loading}
          error={error}
          title={framing.scoreTitle}
          description={framing.scoreDescription}
        />
      )}

      {showRecommendations && (
        <RecommendationsPanel
          results={presented.recommendations}
          title={framing.adviceTitle}
          description={framing.adviceDescription}
          categories={framing.categories}
          updatedAt={updatedAt}
        />
      )}
    </>
  );
}
