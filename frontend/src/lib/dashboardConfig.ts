import {
  SUPER_ADMIN,
  STORE_MANAGER,
  ANALYST,
  MARKETING_MANAGER,
} from "@/lib/permissions";

// Which panels a role sees, in what order, and how the shared panels are
// worded for them. Every role reads the same endpoints and the same single
// recommendation engine — this table only selects and reframes.

export type SectionKey =
  | "estateStats" // store / shelf / user context cards
  | "systemOverview" // Quick Overview tile grid
  | "analyticsKpis" // shopper + dwell + per-shelf view counts
  | "shelfAttention" // bar chart
  | "heatmap"
  | "segments"
  | "productIntelligence" // attractiveness scores + recommendations
  | "recentSessions"
  | "reports"
  | "quickLinks";

export type DashboardConfig = {
  title: string;
  subtitle: string;
  sections: SectionKey[];
  /** Headline for the KPI row, since each role reads those numbers differently. */
  kpiHeading: string;
  scoreTitle: string;
  scoreDescription: string;
  adviceTitle: string;
  adviceDescription: string;
  /** Priority to category label. Presentation only — priority comes from the backend. */
  categories: Record<string, string>;
  sessionsTitle: string;
  sessionsDescription: string;
  reportsTitle: string;
  reportsDescription: string;
};

const ADMIN: DashboardConfig = {
  title: "Platform Dashboard",
  subtitle: "System-wide view of stores, cameras and shopper analytics.",
  sections: [
    "estateStats",
    "systemOverview",
    "analyticsKpis",
    "shelfAttention",
    "heatmap",
    "segments",
    "productIntelligence",
    "reports",
    "recentSessions",
    "quickLinks",
  ],
  kpiHeading: "Platform Analytics",
  scoreTitle: "Platform Performance",
  scoreDescription:
    "Attractiveness across every monitored shelf, scored from camera analytics.",
  adviceTitle: "System Health & Alerts",
  adviceDescription:
    "Where the platform is flagging degraded performance across monitored shelves.",
  categories: {
    Critical: "Critical alert",
    High: "Degraded performance",
    Medium: "Performance warning",
    Low: "Stable",
    Excellent: "Healthy",
  },
  reportsTitle: "Reports & Export",
  reportsDescription:
    "Platform-wide attention report for the selected store.",
  sessionsTitle: "Recent Activity",
  sessionsDescription: "Latest shopper sessions recorded by the pipeline.",
};

const MANAGER: DashboardConfig = {
  title: "Store Operations",
  subtitle: "Shelf performance and shopper flow for your store.",
  sections: [
    "estateStats",
    "analyticsKpis",
    "shelfAttention",
    "heatmap",
    "segments",
    "productIntelligence",
    "reports",
    "recentSessions",
    "quickLinks",
  ],
  kpiHeading: "Store Analytics",
  scoreTitle: "Shelf Performance",
  scoreDescription:
    "How each shelf is performing, scored from processed camera analytics.",
  adviceTitle: "Operational Actions",
  adviceDescription:
    "Placement, organization and product positioning fixes for the floor team.",
  categories: {
    Critical: "Fix now",
    High: "Fix this week",
    Medium: "Adjust placement",
    Low: "Routine check",
    Excellent: "Keep as is",
  },
  reportsTitle: "Store Reports",
  reportsDescription:
    "Shelf performance report for your store, ready to share.",
  sessionsTitle: "Recent Shopper Sessions",
  sessionsDescription: "Latest shopper visits on the floor.",
};

const RETAIL_ANALYST: DashboardConfig = {
  title: "Consumer Behavior Analytics",
  subtitle: "Attention patterns, segmentation and shopper journeys.",
  sections: [
    "analyticsKpis",
    "shelfAttention",
    "segments",
    "heatmap",
    "productIntelligence",
    "recentSessions",
    "reports",
  ],
  kpiHeading: "Attention Analytics",
  scoreTitle: "Shelf Attractiveness",
  scoreDescription:
    "Attention-weighted score per shelf, derived from dwell and gaze data.",
  adviceTitle: "Behavioral Insights",
  adviceDescription:
    "What the attention data suggests about each shelf's engagement.",
  categories: {
    Critical: "Severe attention deficit",
    High: "Low-attention shelf",
    Medium: "Mixed engagement",
    Low: "Steady engagement",
    Excellent: "High engagement",
  },
  reportsTitle: "Analysis Reports",
  reportsDescription:
    "Behavioural and attention findings, exportable for analysis.",
  sessionsTitle: "Customer Journey Log",
  sessionsDescription:
    "Session-level dwell, region and focus for journey analysis.",
};

const MARKETING: DashboardConfig = {
  title: "Marketing Insights",
  subtitle: "Product visibility and shopper engagement.",
  sections: [
    "analyticsKpis",
    "shelfAttention",
    "productIntelligence",
    "reports",
  ],
  kpiHeading: "Engagement Metrics",
  scoreTitle: "Product Visibility",
  scoreDescription:
    "How visible each shelf's products are to shoppers, scored from camera analytics.",
  adviceTitle: "Campaign Opportunities",
  adviceDescription:
    "Where promotion could lift visibility for low-performing products.",
  categories: {
    Critical: "Urgent promotion opportunity",
    High: "Promotion opportunity",
    Medium: "Visibility boost",
    Low: "Monitor",
    Excellent: "Hero product",
  },
  reportsTitle: "Marketing Reports",
  reportsDescription:
    "Product visibility and engagement summary for campaigns.",
  sessionsTitle: "Recent Sessions",
  sessionsDescription: "Latest shopper sessions.",
};

const BY_ROLE: Record<string, DashboardConfig> = {
  [SUPER_ADMIN]: ADMIN,
  [STORE_MANAGER]: MANAGER,
  [ANALYST]: RETAIL_ANALYST,
  [MARKETING_MANAGER]: MARKETING,
};

/** Falls back to the most restrictive layout for an unrecognised role. */
export function dashboardConfig(role: string): DashboardConfig {
  return BY_ROLE[role] ?? MARKETING;
}

export function hasSection(config: DashboardConfig, section: SectionKey) {
  return config.sections.includes(section);
}
