import {
  Flame,
  LayoutDashboard,
  LayoutGrid,
  FileBarChart,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS, type Capability } from "@/lib/permissions";
import type { SectionKey } from "@/lib/dashboardConfig";

/* ────────────────────────────────────────────────────────────────────────
   Navigation presentation.

   Which modules exist and who may see them stays in lib/permissions.ts —
   this file only decides how they are grouped, iconed and ordered in the
   sidebar, so the nav and the route guards cannot drift apart.

   The analytics entries are anchors into the dashboard rather than routes:
   heatmaps, AI insights and reports render as panels there, and linking to
   them keeps one page authoritative instead of duplicating the fetches.
   ──────────────────────────────────────────────────────────────────────── */

export type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  capability: Capability;
  /** Only shown when the role's dashboard actually renders this section. */
  section?: SectionKey;
  description?: string;
};

export type NavGroup = {
  label: string;
  entries: NavEntry[];
};

const ROUTE_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/stores": Store,
  "/shelves": LayoutGrid,
};

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/dashboard": "Live analytics overview",
  "/stores": "Locations and estate",
  "/shelves": "Zones and coordinates",
};

/** Routes, taken straight from the permission table. */
export const ROUTE_ENTRIES: NavEntry[] = NAV_ITEMS.map((item) => ({
  href: item.href,
  label: item.label,
  icon: ROUTE_ICONS[item.href] ?? LayoutDashboard,
  capability: item.capability,
  description: ROUTE_DESCRIPTIONS[item.href],
}));

/** Dashboard panels, addressable by anchor. */
export const ANALYTICS_ENTRIES: NavEntry[] = [
  {
    href: "/dashboard#heatmap",
    label: "Heatmaps",
    icon: Flame,
    capability: "viewHeatmaps",
    section: "heatmap",
    description: "Movement hotspots",
  },
  {
    href: "/dashboard#segments",
    label: "Segments",
    icon: Users,
    capability: "viewSegmentation",
    section: "segments",
    description: "Shopper behaviour",
  },
  {
    href: "/dashboard#ai-insights",
    label: "AI Insights",
    icon: Sparkles,
    capability: "viewRecommendations",
    section: "productIntelligence",
    description: "Scores and actions",
  },
  {
    href: "/dashboard#reports",
    label: "Reports",
    icon: FileBarChart,
    capability: "viewReports",
    section: "reports",
    description: "Export PDF or CSV",
  },
];

export const NAV_GROUPS: NavGroup[] = [
  { label: "Platform", entries: ROUTE_ENTRIES },
  { label: "Intelligence", entries: ANALYTICS_ENTRIES },
];

/** Breadcrumb trail for a pathname. */
export function breadcrumbFor(pathname: string): { label: string; href?: string }[] {
  const entry = ROUTE_ENTRIES.find((item) => item.href === pathname);

  if (!entry) return [{ label: "Platform" }];

  return [
    { label: "Platform", href: "/dashboard" },
    { label: entry.label },
  ];
}
