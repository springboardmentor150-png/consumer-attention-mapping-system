import type { MetricSource, ScoringMetrics } from "@/lib/api";
import type { Tone } from "@/lib/tone";

/* ═══════════════════════════════════════════════════════════════════════
   Product attractiveness — scoring, health banding and advice.

   One model, consumed by every surface in the app: the attractiveness
   cards, the recommendation panel, the KPI row, the report zones and the
   system health alerts. Because they all read the figures produced here,
   no two panels can state a different score or a different severity for
   the same shelf.

   ── The formula ──────────────────────────────────────────────────────
   Exactly as specified, and identical to
   calculate_attractiveness_score() in
   backend/app/services/scoring/attractiveness.py:

     score = attention_duration    * 0.35
           + interaction_frequency * 0.25
           + pickup_rate           * 0.20
           + conversion_rate       * 0.15
           + repeat_engagement     * 0.05

   The score is NEVER adjusted, rescaled or remapped after this sum. The
   only thing this module ever substitutes is a missing or unusable
   *input*; the formula then runs on those inputs untouched.

   ── Why inputs are sometimes substituted ─────────────────────────────
   The vision pipeline can only observe attention. Interaction, pickup,
   conversion and repeat engagement need a POS feed the prototype does not
   have, so the backend derives them from attention duration.

   That derivation is now usable on its own: the backend normalizes dwell
   against a 12-second engaged visit, so a real shelf lands across the whole
   0-100 range rather than bunching into single digits. Measured shelves are
   therefore scored from the backend's own inputs, untouched — which is what
   lets the notification bell and the exported reports state the same score
   as this screen.

   Substitution is now the exception it was meant to be: a shelf with no
   metrics at all, or with too few sessions to be representative, still gets
   a realistic set (deterministically, anchored to whatever real signal
   exists). Those are labelled "generated", which the attractiveness cards
   surface with an "est" marker — so an estimated shelf is visibly distinct
   from a measured one.
   ═══════════════════════════════════════════════════════════════════════ */

export const METRIC_KEYS = [
  "attention_duration",
  "interaction_frequency",
  "pickup_rate",
  "conversion_rate",
  "repeat_engagement",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

/** Formula weights. These are the specification; do not tune them. */
export const SCORING_WEIGHTS: Record<MetricKey, number> = {
  attention_duration: 0.35,
  interaction_frequency: 0.25,
  pickup_rate: 0.2,
  conversion_rate: 0.15,
  repeat_engagement: 0.05,
};

/** Display names for the five inputs, used in advice and alert copy. */
export const METRIC_LABELS: Record<MetricKey, string> = {
  attention_duration: "Attention",
  interaction_frequency: "Interaction",
  pickup_rate: "Pickup",
  conversion_rate: "Conversion",
  repeat_engagement: "Repeat",
};

/**
 * The weighted formula. Clamped to 0-100 and rounded to two decimals, so a
 * frontend-computed score is bit-comparable with the backend's.
 */
export function attractivenessScore(metrics: ScoringMetrics): number {
  const total = METRIC_KEYS.reduce(
    (sum, key) => sum + (metrics[key] ?? 0) * SCORING_WEIGHTS[key],
    0
  );

  return Math.round(Math.max(0, Math.min(100, total)) * 100) / 100;
}

/* ── Health bands ───────────────────────────────────────────────────────
   Derived from the final computed score and nothing else, which is what
   guarantees severity can never contradict the number beside it. A shelf
   scoring 90 cannot raise a High-priority alert.
   ─────────────────────────────────────────────────────────────────────── */

export type HealthBand = {
  /** Status shown on the score card. */
  label: string;
  /** Priority shown on the advice card. */
  priority: "Low" | "Medium" | "High" | "Critical";
  tone: Tone;
  /** True when the band calls for corrective action rather than upkeep. */
  corrective: boolean;
  /** How many weak inputs the advice should address. */
  focusCount: number;
};

const BANDS: { min: number; band: HealthBand }[] = [
  {
    min: 85,
    band: {
      label: "Healthy",
      priority: "Low",
      tone: "healthy",
      corrective: false,
      focusCount: 0,
    },
  },
  {
    min: 70,
    band: {
      label: "Good",
      priority: "Medium",
      tone: "warning",
      corrective: true,
      focusCount: 1,
    },
  },
  {
    min: 55,
    band: {
      label: "Monitor",
      priority: "Medium",
      tone: "warning",
      corrective: true,
      focusCount: 2,
    },
  },
  {
    min: 35,
    band: {
      label: "Needs Attention",
      priority: "High",
      tone: "critical",
      corrective: true,
      focusCount: 3,
    },
  },
  {
    min: 0,
    band: {
      label: "Critical",
      priority: "Critical",
      tone: "critical",
      corrective: true,
      focusCount: 3,
    },
  },
];

/** Band for a computed score. Single source of truth for severity. */
export function healthFor(score: number): HealthBand {
  return (BANDS.find((entry) => score >= entry.min) ?? BANDS[BANDS.length - 1])
    .band;
}

/* ── Input resolution ───────────────────────────────────────────────────
   Substitution happens here and only here.
   ─────────────────────────────────────────────────────────────────────── */

/** Fewer sessions than this and the inputs are not yet representative. */
const MIN_SESSIONS = 5;

/** Dwell, in seconds, that reads as a fully engaged shelf visit. */
const DWELL_REFERENCE_SECONDS = 12;

/** Session count that reads as a well-sampled shelf. */
const SESSION_REFERENCE = 40;

/**
 * Realistic retail range for each input, and how widely shelves vary on it.
 *
 * Ranges narrow down the funnel: a shopper looks at a shelf more often than
 * they touch it, touches more often than they buy, and buys more often than
 * they come back. Spread widens for the same reason — the further down the
 * funnel, the more one shelf differs from the next.
 */
const INPUT_RANGES: Record<
  MetricKey,
  { min: number; max: number; spread: number }
> = {
  attention_duration: { min: 30, max: 94, spread: 8 },
  interaction_frequency: { min: 24, max: 90, spread: 10 },
  pickup_rate: { min: 20, max: 86, spread: 11 },
  conversion_rate: { min: 16, max: 82, spread: 12 },
  repeat_engagement: { min: 12, max: 78, spread: 13 },
};

export type ShelfInput = {
  /** Stable identity — the shelf label or zone value. */
  key: string;
  /** `metrics_used` from the backend, when the response carries it. */
  metrics?: ScoringMetrics | null;
  /** Sessions the backend scored from. */
  sessions?: number | null;
  /** Average dwell in seconds, when the caller has it. */
  dwellSeconds?: number | null;
};

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * A stable value in [0, 1) derived from a string.
 *
 * FNV-1a, mirroring the intent of the backend's blake2b helper: the same
 * shelf always produces the same number, a different shelf produces an
 * unrelated one, and nothing reads a clock, a seed or process state. This
 * is what makes generated inputs identical on every refresh.
 */
function hashUnit(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash / 0x100000000;
}

/**
 * How well this shelf is performing, in [0, 1], from whatever the pipeline
 * actually measured.
 *
 * Dwell and session volume are real signals, so they lead. The hash only
 * fills the remainder, and takes over entirely for a shelf with no
 * measurements at all — so two unmeasured shelves still differ from each
 * other, stably.
 */
function performanceAnchor(input: ShelfInput): number {
  const sessions = input.sessions;

  // attention_duration is normalize(avg_dwell, 0, 60), which inverts. It is
  // preferred over a caller-supplied dwell precisely because every caller has
  // it: the scoring response and the report response both carry it, rounded
  // the same way, so two panels scoring the same shelf start from the same
  // number even though only one of them was handed a dwell figure. Taking the
  // caller's dwell first would let those two panels disagree in the decimals.
  const attention = input.metrics?.attention_duration;

  const dwellSeconds =
    typeof attention === "number"
      ? (attention / 100) * 60
      : // No metrics at all — a caller that measured dwell itself can still
        // anchor the shelf with it.
        (input.dwellSeconds ?? null);

  const baseline = 0.3 + hashUnit(`${input.key}|anchor`) * 0.5;

  let anchor = 0;
  let weight = 0;

  if (dwellSeconds != null) {
    anchor += clamp01(dwellSeconds / DWELL_REFERENCE_SECONDS) * 0.5;
    weight += 0.5;
  }

  if (sessions != null && sessions > 0) {
    anchor +=
      clamp01(Math.log1p(sessions) / Math.log1p(SESSION_REFERENCE)) * 0.3;
    weight += 0.3;
  }

  // Whatever is left over is carried by the shelf's own stable baseline.
  return clamp01(anchor + baseline * (1 - weight));
}

/**
 * True when the backend's inputs cannot carry a meaningful score.
 *
 * "Sparse" means missing or unrepresentative — no metrics at all, or too few
 * sessions behind them. It deliberately does not mean "low": a shelf the
 * cameras genuinely watched shoppers walk past without stopping scores
 * badly, and that is a finding, not a gap in the data. Substituting there
 * would replace a real measurement with an invented one and would put a
 * comfortable number over a shelf that needs attention.
 *
 * A score threshold used to sit here as well, because the backend
 * normalized dwell against a 60-second reference and every real shelf came
 * out in single digits. That reference is now calibrated to a 12-second
 * engaged visit (DWELL_TIME_REFERENCE in the backend scoring service), so
 * measured shelves land across the usable range and no longer need
 * rescuing.
 */
export function inputsAreSparse(input: ShelfInput): boolean {
  const metrics = input.metrics;

  if (!metrics) return true;

  if (METRIC_KEYS.some((key) => typeof metrics[key] !== "number")) return true;

  return (input.sessions ?? 0) < MIN_SESSIONS;
}

/**
 * The five formula inputs for a shelf, and where each came from.
 *
 * Real backend metrics are returned untouched whenever they are usable.
 * Otherwise a realistic set is generated, anchored to the shelf's measured
 * performance so the ordering still follows the analytics.
 */
export function resolveInputs(input: ShelfInput): {
  metrics: ScoringMetrics;
  sources: Record<MetricKey, MetricSource>;
  generated: boolean;
} {
  if (!inputsAreSparse(input) && input.metrics) {
    const metrics = input.metrics;

    return {
      metrics,
      sources: METRIC_KEYS.reduce(
        (all, key) => ({ ...all, [key]: "analytics" as MetricSource }),
        {} as Record<MetricKey, MetricSource>
      ),
      generated: false,
    };
  }

  const anchor = performanceAnchor(input);

  const metrics = METRIC_KEYS.reduce((all, key) => {
    const range = INPUT_RANGES[key];

    // Centred on the shelf's performance, then nudged by a deterministic
    // offset so no two shelves sit on exactly the same curve.
    const offset = (hashUnit(`${input.key}|${key}`) - 0.5) * range.spread;

    const value = range.min + (range.max - range.min) * anchor + offset;

    return {
      ...all,
      [key]:
        Math.round(
          Math.max(range.min, Math.min(range.max, value)) * 100
        ) / 100,
    };
  }, {} as ScoringMetrics);

  return {
    metrics,
    sources: METRIC_KEYS.reduce(
      (all, key) => ({ ...all, [key]: "generated" as MetricSource }),
      {} as Record<MetricKey, MetricSource>
    ),
    generated: true,
  };
}

/* ── Advice ─────────────────────────────────────────────────────────────
   Driven by the weakest contributing inputs and the final score. Never
   random, never a fixed list.
   ─────────────────────────────────────────────────────────────────────── */

const PLAYBOOK: Record<MetricKey, string[]> = {
  attention_duration: [
    "Raise visibility: move the range to eye level so shoppers register it on approach.",
    "Add shelf-edge signage and a clearer category header to draw the eye.",
    "Check lighting on this bay — poorly lit fixtures suppress dwell time.",
  ],
  interaction_frequency: [
    "Review packaging and facings so the range reads clearly at a distance.",
    "Add a promotional display or end-cap tie-in to invite engagement.",
    "Trial a demo or sampling touchpoint to lift hands-on interaction.",
  ],
  pickup_rate: [
    "Improve accessibility: bring stock forward and clear obstructions at reach height.",
    "Reorganise the shelf by category so individual products are easy to isolate.",
    "Reduce facing density — crowded bays measurably suppress pick-up.",
  ],
  conversion_rate: [
    "Review pricing against the alternatives sitting beside it.",
    "Add a clear offer or multi-buy to close the decision at the shelf.",
    "Expand shelf-edge product information so shoppers can compare without help.",
  ],
  repeat_engagement: [
    "Broaden the assortment so returning shoppers find something new.",
    "Tie this bay into the loyalty programme with a targeted reward.",
    "Improve the post-purchase experience to bring this category's shoppers back.",
  ],
};

/** Upkeep advice for a shelf that is already performing. */
const MAINTENANCE = [
  "Performance is strong — hold the current planogram.",
  "Keep facings stocked and review weekly for drift.",
  "Use this bay as the reference layout for comparable fixtures.",
];

export type WeakInput = {
  metric: MetricKey;
  label: string;
  value: number;
  /** Points of score lost on this input: weight × (100 − value). */
  shortfall: number;
};

/**
 * The inputs costing this shelf the most score, worst first.
 *
 * Ranked by weighted shortfall rather than raw value, so "weakest" means
 * "holding the score down hardest" — a mediocre attention figure outranks a
 * poor repeat figure, because attention carries seven times the weight.
 */
export function weakestInputs(metrics: ScoringMetrics): WeakInput[] {
  return METRIC_KEYS.map((metric) => {
    const value = metrics[metric] ?? 0;

    return {
      metric,
      label: METRIC_LABELS[metric],
      value,
      shortfall:
        Math.round(SCORING_WEIGHTS[metric] * (100 - value) * 100) / 100,
    };
  }).sort((a, b) => b.shortfall - a.shortfall);
}

/** "a", "a and b", "a, b and c" — for naming the inputs being addressed. */
function listOf(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Advice for one shelf.
 *
 * A healthy shelf gets maintenance and monitoring; every other band gets
 * one corrective action per weak input, as many as the band calls for. The
 * action chosen from each playbook is picked by a stable hash of the shelf
 * and the metric, so it never shuffles between refreshes but does differ
 * between shelves.
 */
export function adviceFor(
  key: string,
  metrics: ScoringMetrics,
  score: number
): string[] {
  const band = healthFor(score);

  if (!band.corrective) {
    return MAINTENANCE;
  }

  const focus = weakestInputs(metrics).slice(0, band.focusCount);

  const actions = focus.map((weak) => {
    const options = PLAYBOOK[weak.metric];

    return options[Math.floor(hashUnit(`${key}|${weak.metric}|advice`) * options.length) % options.length];
  });

  // Always close with the monitoring line, so even a corrective card says
  // what to do after the fix.
  actions.push(
    `Re-measure ${listOf(
      focus.map((weak) => weak.label.toLowerCase())
    )} after the next footage run to confirm the change landed.`
  );

  return actions;
}

/* ── The assessment every surface consumes ──────────────────────────── */

export type ShelfAssessment = {
  key: string;
  metrics: ScoringMetrics;
  sources: Record<MetricKey, MetricSource>;
  /** True when the five inputs were substituted. */
  generated: boolean;
  /** Straight from the weighted formula. Never adjusted afterwards. */
  score: number;
  health: HealthBand;
  weakest: WeakInput[];
  recommendations: string[];
  /** Present only for bands that call for escalation. */
  alert: { severity: string; message: string } | null;
};

export function assessShelf(input: ShelfInput): ShelfAssessment {
  const { metrics, sources, generated } = resolveInputs(input);

  // The formula, run on the resolved inputs. Nothing touches the result.
  const score = attractivenessScore(metrics);

  const health = healthFor(score);
  const weakest = weakestInputs(metrics);
  const recommendations = adviceFor(input.key, metrics, score);

  // Alerts escalate only from the two lowest bands, so a shelf scoring in
  // the Good or Healthy range can never appear in the alert list.
  const alerting = health.priority === "High" || health.priority === "Critical";

  return {
    key: input.key,
    metrics,
    sources,
    generated,
    score,
    health,
    weakest,
    recommendations,
    alert: alerting
      ? {
          severity: health.priority,
          message: `${health.label}: ${weakest[0].label.toLowerCase()} is the largest drag on this shelf, costing ${weakest[0].shortfall.toFixed(1)} points.`,
        }
      : null,
  };
}

/** Assess a set of shelves, keyed for lookup. */
export function assessShelves(
  inputs: ShelfInput[]
): Map<string, ShelfAssessment> {
  return new Map(inputs.map((input) => [input.key, assessShelf(input)]));
}
