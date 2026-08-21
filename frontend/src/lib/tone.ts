// Maps a semantic tone onto the concrete utility classes each shared
// primitive uses. Components pick a tone by meaning ("critical", "ai") and
// never reach for a raw colour, so the accent palette in globals.css stays
// the single place a colour is defined.
//
// Class strings are written out in full rather than composed at runtime —
// Tailwind scans source text, so `bg-${tone}-soft` would not be generated.

// healthFor is the single band table for the whole app. attractiveness.ts
// imports Tone from here with `import type`, which erases at build time, so
// this pairing is not a runtime cycle.
import { healthFor } from "@/lib/attractiveness";

export type Tone =
  | "brand"
  | "analytics"
  | "healthy"
  | "warning"
  | "critical"
  | "ai"
  | "behavior"
  | "neutral";

export type ToneStyles = {
  /** Tinted square behind an icon. */
  icon: string;
  /** Pill badge: tinted background, readable text. */
  badge: string;
  /** Solid fill for progress bars and rails. */
  bar: string;
  /** Text in the accent colour, for values and trends. */
  text: string;
  /** Left edge accent on a card. */
  edge: string;
  /** Border in the accent colour, at badge weight. */
  border: string;
  /** Two-stop gradient for hero icon chips and stat-card washes. */
  gradient: string;
  /** Very faint wash for a card background. */
  wash: string;
  /** Ring colour for focus and selected states. */
  ring: string;
};

export const TONES: Record<Tone, ToneStyles> = {
  brand: {
    icon: "bg-brand-soft text-brand-deep",
    badge: "bg-brand-soft text-brand-deep",
    bar: "bg-brand-base",
    text: "text-brand-deep",
    edge: "bg-brand-base",
    border: "border-brand-muted",
    gradient: "bg-gradient-to-br from-brand-base to-teal-base",
    wash: "bg-gradient-to-br from-brand-soft/70 to-transparent",
    ring: "ring-brand-base/40",
  },

  analytics: {
    icon: "bg-analytics-soft text-analytics-strong",
    badge: "bg-analytics-soft text-analytics-strong",
    bar: "bg-analytics-base",
    text: "text-analytics-strong",
    edge: "bg-analytics-base",
    border: "border-analytics-soft",
    gradient: "bg-gradient-to-br from-analytics-base to-ai-base",
    wash: "bg-gradient-to-br from-analytics-soft/70 to-transparent",
    ring: "ring-analytics-base/40",
  },

  healthy: {
    icon: "bg-healthy-soft text-healthy-strong",
    badge: "bg-healthy-soft text-healthy-strong",
    bar: "bg-healthy-base",
    text: "text-healthy-strong",
    edge: "bg-healthy-base",
    border: "border-healthy-soft",
    gradient: "bg-gradient-to-br from-healthy-base to-teal-base",
    wash: "bg-gradient-to-br from-healthy-soft/70 to-transparent",
    ring: "ring-healthy-base/40",
  },

  warning: {
    icon: "bg-warning-soft text-warning-strong",
    badge: "bg-warning-soft text-warning-strong",
    bar: "bg-warning-base",
    text: "text-warning-strong",
    edge: "bg-warning-base",
    border: "border-warning-soft",
    gradient: "bg-gradient-to-br from-warning-base to-critical-base",
    wash: "bg-gradient-to-br from-warning-soft/70 to-transparent",
    ring: "ring-warning-base/40",
  },

  critical: {
    icon: "bg-critical-soft text-critical-strong",
    badge: "bg-critical-soft text-critical-strong",
    bar: "bg-critical-base",
    text: "text-critical-strong",
    edge: "bg-critical-base",
    border: "border-critical-soft",
    gradient: "bg-gradient-to-br from-critical-base to-warning-base",
    wash: "bg-gradient-to-br from-critical-soft/70 to-transparent",
    ring: "ring-critical-base/40",
  },

  ai: {
    icon: "bg-ai-soft text-ai-strong",
    badge: "bg-ai-soft text-ai-strong",
    bar: "bg-ai-base",
    text: "text-ai-strong",
    edge: "bg-ai-base",
    border: "border-ai-soft",
    gradient: "bg-gradient-to-br from-ai-base to-analytics-base",
    wash: "bg-gradient-to-br from-ai-soft/70 to-transparent",
    ring: "ring-ai-base/40",
  },

  behavior: {
    icon: "bg-behavior-soft text-behavior-strong",
    badge: "bg-behavior-soft text-behavior-strong",
    bar: "bg-behavior-base",
    text: "text-behavior-strong",
    edge: "bg-behavior-base",
    border: "border-behavior-soft",
    gradient: "bg-gradient-to-br from-behavior-base to-analytics-base",
    wash: "bg-gradient-to-br from-behavior-soft/70 to-transparent",
    ring: "ring-behavior-base/40",
  },

  neutral: {
    icon: "bg-surface-sunken text-ink-muted",
    badge: "bg-surface-sunken text-ink-muted",
    bar: "bg-ink-subtle",
    text: "text-ink-muted",
    edge: "bg-line-strong",
    border: "border-line",
    gradient: "bg-gradient-to-br from-ink-subtle to-ink-muted",
    wash: "bg-gradient-to-br from-surface-sunken to-transparent",
    ring: "ring-line-strong",
  },
};

export function tone(name: Tone = "neutral"): ToneStyles {
  return TONES[name];
}

// Score-to-tone banding shared by attractiveness cards and any other
// 0-100 figure. Read from the health bands in src/lib/attractiveness.ts
// rather than restated here, so a gauge can never be a different colour
// from the status badge sitting beside it.
export function scoreTone(score: number): Tone {
  return healthFor(score).tone;
}

// Priority, as produced by the health bands in src/lib/attractiveness.ts.
// The backend rule engine's own vocabulary ("Excellent") is still mapped,
// so notifications written by earlier runs keep their colour.
export function priorityTone(priority: string): Tone {
  switch (priority) {
    case "Excellent":
      return "healthy";
    // Low priority means the shelf is in the Healthy band — nothing to fix.
    case "Low":
      return "healthy";
    case "Medium":
      return "warning";
    case "High":
      return "critical";
    case "Critical":
      return "critical";
    default:
      return "neutral";
  }
}
