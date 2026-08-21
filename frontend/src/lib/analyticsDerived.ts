import {
  regionLabel,
  zoneLabel,
  type AnalyticsSession,
} from "@/lib/api";

/* ────────────────────────────────────────────────────────────────────────
   Chart series derived from sessions the backend already returns.

   Every figure below is computed from GET /analytics/ rows — nothing is
   requested, invented or estimated. The vision pipeline writes one row per
   shopper session with dwell, region, focus, path length, shelf visits and
   gaze shifts; these helpers only reshape those rows into the series each
   chart wants, so the charts and the tables can never disagree.
   ──────────────────────────────────────────────────────────────────────── */

function parseTime(value: string): number | null {
  const parsed = new Date(value).valueOf();

  return Number.isNaN(parsed) ? null : parsed;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type TimelinePoint = {
  label: string;
  sessions: number;
  dwell: number;
  gaze: number;
};

/**
 * Sessions bucketed by the hour they were recorded.
 *
 * Sessions arrive in batches — one per processed clip — so bucketing by
 * clock hour is what turns them into a readable trend rather than a spike
 * at a single timestamp. Buckets with no sessions are not invented: only
 * hours that actually contain rows appear.
 */
export function attentionTimeline(
  sessions: AnalyticsSession[],
  maxBuckets = 12
): TimelinePoint[] {
  const buckets = new Map<
    number,
    { dwell: number[]; gaze: number[]; count: number }
  >();

  sessions.forEach((session) => {
    const at = parseTime(session.timestamp) ?? parseTime(session.entry_time);

    if (at === null) return;

    // Floor to the hour.
    const key = Math.floor(at / 3_600_000) * 3_600_000;
    const bucket = buckets.get(key) ?? { dwell: [], gaze: [], count: 0 };

    bucket.dwell.push(session.dwell_time);
    bucket.gaze.push(session.gaze_shifts);
    bucket.count += 1;

    buckets.set(key, bucket);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .slice(-maxBuckets)
    .map(([key, bucket]) => ({
      label: new Date(key).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
      sessions: bucket.count,
      dwell: Number(mean(bucket.dwell).toFixed(2)),
      gaze: Number(mean(bucket.gaze).toFixed(2)),
    }));
}

export type ShareSlice = {
  name: string;
  value: number;
};

/** Where shoppers were looking, counted across every session. */
export function focusBreakdown(sessions: AnalyticsSession[]): ShareSlice[] {
  const counts = new Map<string, number>();

  sessions.forEach((session) => {
    const label = zoneLabel(session.focus);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Where shoppers stood, counted across every session. */
export function regionBreakdown(sessions: AnalyticsSession[]): ShareSlice[] {
  const counts = new Map<string, number>();

  sessions.forEach((session) => {
    const label = regionLabel(session.region);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export type EngagementAxis = {
  metric: string;
  /** One key per region, normalised to 0-100 across regions. */
  [region: string]: string | number;
};

/**
 * Region-by-region engagement profile.
 *
 * The four behavioural measures are on different scales — seconds, pixels,
 * counts — so each axis is normalised against the strongest region on that
 * axis. The shape is therefore comparative, which is what a radar is for;
 * absolute values stay in the tables.
 */
export function engagementProfile(sessions: AnalyticsSession[]): {
  axes: EngagementAxis[];
  regions: string[];
} {
  const grouped = new Map<string, AnalyticsSession[]>();

  sessions.forEach((session) => {
    const label = regionLabel(session.region);
    grouped.set(label, [...(grouped.get(label) ?? []), session]);
  });

  const regions = Array.from(grouped.keys());

  if (regions.length === 0) return { axes: [], regions: [] };

  const measures: { metric: string; of: (s: AnalyticsSession) => number }[] = [
    { metric: "Dwell", of: (s) => s.dwell_time },
    { metric: "Gaze shifts", of: (s) => s.gaze_shifts },
    { metric: "Shelf visits", of: (s) => s.shelf_visits },
    { metric: "Path length", of: (s) => s.path_length },
    { metric: "Sessions", of: () => 1 },
  ];

  const axes = measures.map(({ metric, of }) => {
    const raw = regions.map((region) => {
      const rows = grouped.get(region) ?? [];

      return metric === "Sessions" ? rows.length : mean(rows.map(of));
    });

    const peak = Math.max(...raw, 0) || 1;

    const axis: EngagementAxis = { metric };

    regions.forEach((region, index) => {
      axis[region] = Math.round((raw[index] / peak) * 100);
    });

    return axis;
  });

  return { axes, regions };
}

export type DwellBucket = {
  band: string;
  shoppers: number;
};

/**
 * Dwell time distribution.
 *
 * Fixed bands rather than quantiles, so the shape of the histogram is
 * comparable between two runs of different sizes.
 */
export function dwellDistribution(sessions: AnalyticsSession[]): DwellBucket[] {
  const bands: { band: string; test: (value: number) => boolean }[] = [
    { band: "0–2s", test: (v) => v < 2 },
    { band: "2–5s", test: (v) => v >= 2 && v < 5 },
    { band: "5–10s", test: (v) => v >= 5 && v < 10 },
    { band: "10–20s", test: (v) => v >= 10 && v < 20 },
    { band: "20s+", test: (v) => v >= 20 },
  ];

  return bands.map(({ band, test }) => ({
    band,
    shoppers: sessions.filter((session) => test(session.dwell_time)).length,
  }));
}

/**
 * A short series for a stat card's sparkline, from the same hourly buckets
 * the timeline uses. Returns an empty array when there is not enough
 * history to draw a line — the card then simply omits it.
 */
export function sparkSeries(
  sessions: AnalyticsSession[],
  metric: "sessions" | "dwell" | "gaze" = "sessions"
): number[] {
  const points = attentionTimeline(sessions, 10);

  if (points.length < 2) return [];

  return points.map((point) => point[metric]);
}

/**
 * Percentage change between the first and last bucket of a series.
 *
 * Returned as a direction plus a formatted value so a caller can hand it
 * straight to <TrendIndicator />. Null when there is nothing to compare —
 * an unmeasured trend is left blank rather than shown as 0%.
 */
export function trendFrom(series: number[]): {
  direction: "up" | "down" | "flat";
  value: string;
} | null {
  if (series.length < 2) return null;

  const first = series[0];
  const last = series[series.length - 1];

  if (first === 0 && last === 0) return { direction: "flat", value: "0%" };

  if (first === 0) return { direction: "up", value: "New" };

  const change = ((last - first) / Math.abs(first)) * 100;

  if (Math.abs(change) < 0.5) return { direction: "flat", value: "0%" };

  return {
    direction: change > 0 ? "up" : "down",
    value: `${change > 0 ? "+" : ""}${change.toFixed(0)}%`,
  };
}

/** Peak activity hour, or null when nothing has been recorded. */
export function peakHour(sessions: AnalyticsSession[]): {
  label: string;
  sessions: number;
} | null {
  const points = attentionTimeline(sessions, 48);

  if (points.length === 0) return null;

  return points.reduce((best, point) =>
    point.sessions > best.sessions ? point : best
  );
}
