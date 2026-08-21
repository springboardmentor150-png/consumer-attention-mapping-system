"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStores,
  getShelves,
  getAnalyticsSummary,
  getAnalytics,
  getUnreadCount,
  regionLabel,
  zoneLabel,
  type AnalyticsSession,
  type AnalyticsSummary,
  type AttractivenessResponse,
  type RecommendationResponse,
} from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ChartSkeleton, StatGridSkeleton } from "@/components/ui/Skeleton";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import {
  TableShell,
  THead,
  TH,
  TRow,
  TD,
  IdCell,
} from "@/components/ui/Table";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { can, roleLabel } from "@/lib/permissions";
import {
  dashboardConfig,
  hasSection,
  type SectionKey,
} from "@/lib/dashboardConfig";
import { OverviewItem } from "@/components/OverviewItem";
import { DisplayAttentionChart } from "@/components/DisplayAttentionChart";
import { BehaviorSegments } from "@/components/BehaviorSegments";
import { HeatmapPanel } from "@/components/HeatmapPanel";
import { ProductIntelligence } from "@/components/ProductIntelligence";
import { ReportsPanel } from "@/components/ReportsPanel";
import {
  peakHour,
  sparkSeries,
  trendFrom,
} from "@/lib/analyticsDerived";
import { publishAnalyticsRefresh } from "@/lib/analyticsRefresh";
import {
  Store,
  LayoutGrid,
  ArrowRight,
  ShieldCheck,
  Camera,
  Users,
  Clock,
  PanelLeft,
  PanelRight,
  History,
  Bell,
  Gauge as GaugeIcon,
  Lightbulb,
  RefreshCw,
  UploadCloud,
  FileBarChart,
  Activity,
} from "lucide-react";

/* Heavy plots are split into their own chunks: the dashboard renders up to
   five of them, and none is needed for the first paint of the KPI row. */
const AttentionTimeline = dynamic(
  () =>
    import("@/components/charts/AttentionTimeline").then(
      (module) => module.AttentionTimeline
    ),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const FocusBreakdown = dynamic(
  () =>
    import("@/components/charts/FocusBreakdown").then(
      (module) => module.FocusBreakdown
    ),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const EngagementRadar = dynamic(
  () =>
    import("@/components/charts/EngagementRadar").then(
      (module) => module.EngagementRadar
    ),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const DwellDistribution = dynamic(
  () =>
    import("@/components/charts/DwellDistribution").then(
      (module) => module.DwellDistribution
    ),
  { loading: () => <ChartSkeleton />, ssr: false }
);

type StoreRecord = {
  id: number;
  name: string;
  location: string;
};

const RECENT_SESSION_LIMIT = 8;

function greetingFor(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

export default function DashboardPage() {
  const [storeCount, setStoreCount] = useState(0);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  // null = every store. Defaults to that so the dashboard keeps showing
  // sessions recorded before analytics carried a store id.
  const [storeId, setStoreId] = useState<number | null>(null);
  const [shelfCount, setShelfCount] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    total_shoppers: 0,
    average_dwell_time: 0,
    left_display_views: 0,
    right_display_views: 0,
    last_processed: null,
  });
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  // Bumped after a video is processed so the figures below refetch.
  const [refreshKey, setRefreshKey] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  // Mirrored from the AI panel so the KPI row can state the same scores
  // without issuing the scoring requests a second time.
  const [intelligence, setIntelligence] = useState<{
    scores: AttractivenessResponse[];
    recommendations: RecommendationResponse[];
    loading: boolean;
  }>({ scores: [], recommendations: [], loading: true });

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setEmail(localStorage.getItem("email") || "");

    async function loadDashboard() {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      setToken(token);

      try {
        const stores: StoreRecord[] = await getStores(token);

        if (Array.isArray(stores)) {
          setStoreCount(stores.length);
          setStores(stores);

          const shelvesPerStore = await Promise.all(
            stores.map((store) => getShelves(store.id, token).catch(() => []))
          );

          const total = shelvesPerStore.reduce(
            (sum: number, shelves) =>
              sum + (Array.isArray(shelves) ? shelves.length : 0),
            0
          );

          setShelfCount(total);
        }

        // Alert count is the same unread figure the bell shows; a failure
        // here must not take the analytics below down with it.
        getUnreadCount(token, storeId)
          .then(setAlertCount)
          .catch(() => setAlertCount(null));

        try {
          const summary = await getAnalyticsSummary(token, { storeId });

          setAnalytics({
            total_shoppers: summary?.total_shoppers ?? 0,
            average_dwell_time: summary?.average_dwell_time ?? 0,
            left_display_views: summary?.left_display_views ?? 0,
            right_display_views: summary?.right_display_views ?? 0,
            last_processed: summary?.last_processed ?? null,
          });

          const allSessions = await getAnalytics(token, { storeId });

          setSessions(Array.isArray(allSessions) ? allSessions : []);
          setAnalyticsError(false);
        } catch (error) {
          console.error(error);
          setAnalyticsError(true);
        } finally {
          setAnalyticsLoading(false);
        }
      } catch (error) {
        console.error(error);
        setAnalyticsLoading(false);
      }
    }

    loadDashboard();
  }, [storeId, refreshKey]);

  // Which panels this role sees, in what order, and how they are worded.
  // Every role reads the same endpoints and the same recommendation engine.
  const config = useMemo(() => dashboardConfig(role), [role]);

  const show = useCallback(
    (section: SectionKey) => hasSection(config, section),
    [config]
  );

  // `sessions` holds every session so segment counts cover the full set;
  // the table below only shows the most recent handful.
  const recentSessions = useMemo(
    () => sessions.slice(-RECENT_SESSION_LIMIT).reverse(),
    [sessions]
  );

  // ── Derived KPI inputs, all from the rows already fetched ──────────
  const sessionSpark = useMemo(() => sparkSeries(sessions, "sessions"), [sessions]);
  const dwellSpark = useMemo(() => sparkSeries(sessions, "dwell"), [sessions]);
  const gazeSpark = useMemo(() => sparkSeries(sessions, "gaze"), [sessions]);

  const sessionTrend = useMemo(() => trendFrom(sessionSpark), [sessionSpark]);
  const dwellTrend = useMemo(() => trendFrom(dwellSpark), [dwellSpark]);

  const peak = useMemo(() => peakHour(sessions), [sessions]);

  const engagedSessions = useMemo(
    () => sessions.filter((session) => session.dwell_time >= 5).length,
    [sessions]
  );

  const averageScore = useMemo(() => {
    const scores = intelligence.scores;

    if (scores.length === 0) return null;

    return Math.round(
      scores.reduce((sum, entry) => sum + entry.attractiveness_score, 0) /
        scores.length
    );
  }, [intelligence.scores]);

  const actionableRecommendations = useMemo(
    () =>
      intelligence.recommendations.reduce(
        (sum, entry) => sum + entry.recommendations.length,
        0
      ),
    [intelligence.recommendations]
  );

  const selectedStore = stores.find((store) => store.id === storeId);

  const quickActions = useMemo(() => {
    const actions: {
      label: string;
      description: string;
      href: string;
      icon: typeof UploadCloud;
    }[] = [];

    if (can(role, "cameraControls")) {
      actions.push({
        label: "Process footage",
        description: "Upload a clip to refresh analytics",
        href: "#heatmap",
        icon: UploadCloud,
      });
    }

    if (can(role, "viewReports")) {
      actions.push({
        label: "Export a report",
        description: "PDF or CSV for the selected store",
        href: "#reports",
        icon: FileBarChart,
      });
    }

    if (can(role, "viewStores")) {
      actions.push({
        label: can(role, "manageStores") ? "Manage stores" : "Browse stores",
        description: "Locations across the estate",
        href: "/stores",
        icon: Store,
      });
    }

    if (can(role, "viewShelves")) {
      actions.push({
        label: "Configure shelves",
        description: "Zones and coordinates per store",
        href: "/shelves",
        icon: LayoutGrid,
      });
    }

    return actions.slice(0, 3);
  }, [role]);

  /**
   * A processing run has finished and its analytics are settled.
   *
   * Bumping the key refetches this page's own figures and, through the
   * prop below, re-scores the AI panel and rebuilds the report — the two
   * panels whose numbers are derived from the sessions that just changed.
   * The announcement reaches the notification bell in the app shell, which
   * no prop from here can travel to.
   */
  const handleProcessed = useCallback(() => {
    setRefreshKey((key) => key + 1);
    publishAnalyticsRefresh(storeId);
  }, [storeId]);

  const handleIntelligence = useCallback(
    (results: {
      scores: AttractivenessResponse[];
      recommendations: RecommendationResponse[];
      loading: boolean;
    }) => {
      setIntelligence({
        scores: results.scores,
        recommendations: results.recommendations,
        loading: results.loading,
      });
    },
    []
  );

  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        eyebrow={
          <>
            <StatusBadge variant="brand" dot pulse>
              Live pipeline
            </StatusBadge>

            <StatusBadge variant="neutral" outline>
              {selectedStore ? selectedStore.name : "All stores"}
            </StatusBadge>
          </>
        }
        actions={
          <>
            {stores.length > 0 && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="analytics_store"
                  className="text-sm text-ink-muted"
                >
                  Store
                </label>

                <Select
                  id="analytics_store"
                  size="sm"
                  value={storeId ?? ""}
                  onChange={(event) =>
                    setStoreId(
                      event.target.value === ""
                        ? null
                        : Number(event.target.value)
                    )
                  }
                  className="w-44"
                >
                  <option value="">All stores</option>

                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((key) => key + 1)}
              loading={analyticsLoading}
            >
              {!analyticsLoading && <RefreshCw />}
              Refresh
            </Button>
          </>
        }
      />

      <DashboardHero
        greeting={greetingFor(new Date())}
        email={email}
        role={role}
        headline={config.subtitle}
        lastProcessed={analytics.last_processed}
        sessionCount={sessions.length}
        quickActions={quickActions}
      />

      {/* ── Estate context ───────────────────────────────────────────── */}
      {show("estateStats") && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Stores"
            value={storeCount}
            icon={Store}
            accent="analytics"
            hint={storeCount === 1 ? "location monitored" : "locations monitored"}
            style={{ ["--delay" as string]: "0ms" }}
          />

          <StatCard
            label="Total Shelves"
            value={shelfCount ?? 0}
            icon={LayoutGrid}
            accent="behavior"
            loading={shelfCount === null}
            hint="zones configured"
            style={{ ["--delay" as string]: "60ms" }}
          />

          <StatCard
            label="Open Alerts"
            value={alertCount ?? 0}
            icon={Bell}
            accent={alertCount && alertCount > 0 ? "critical" : "healthy"}
            loading={alertCount === null}
            hint={
              alertCount && alertCount > 0
                ? "unread notifications"
                : "nothing outstanding"
            }
            style={{ ["--delay" as string]: "120ms" }}
          />

          <StatCard
            label="Access Level"
            value={role ? roleLabel(role) : "—"}
            icon={ShieldCheck}
            accent="ai"
            hint={email || "signed in"}
            style={{ ["--delay" as string]: "180ms" }}
          />
        </div>
      )}

      {/* ── Analytics ────────────────────────────────────────────────── */}
      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          {config.kpiHeading}
        </h2>

        <StatusBadge variant="analytics" outline size="sm">
          <Activity className="h-3 w-3" aria-hidden="true" />
          {sessions.length.toLocaleString()} sessions in scope
        </StatusBadge>
      </div>

      {analyticsLoading ? (
        <StatGridSkeleton count={4} />
      ) : analyticsError ? (
        <ErrorState
          title="Analytics could not be loaded"
          description="The analytics service did not respond. Your other data is unaffected."
          onRetry={() => setRefreshKey((key) => key + 1)}
        />
      ) : (
        <>
          {show("analyticsKpis") && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Customers Detected"
                value={analytics.total_shoppers}
                icon={Users}
                accent="analytics"
                series={sessionSpark}
                trend={
                  sessionTrend ? (
                    <TrendIndicator
                      direction={sessionTrend.direction}
                      value={sessionTrend.value}
                      label="across intervals"
                      size="sm"
                    />
                  ) : undefined
                }
                style={{ ["--delay" as string]: "0ms" }}
              />

              <StatCard
                label="Average Dwell Time"
                value={analytics.average_dwell_time}
                decimals={2}
                unit="sec"
                icon={Clock}
                accent="behavior"
                series={dwellSpark}
                trend={
                  dwellTrend ? (
                    <TrendIndicator
                      direction={dwellTrend.direction}
                      value={dwellTrend.value}
                      label="vs first interval"
                      size="sm"
                    />
                  ) : undefined
                }
                style={{ ["--delay" as string]: "60ms" }}
              />

              <StatCard
                label="Shelf A Views"
                value={analytics.left_display_views}
                icon={PanelLeft}
                accent="brand"
                hint="gaze events recorded"
                style={{ ["--delay" as string]: "120ms" }}
              />

              <StatCard
                label="Shelf B Views"
                value={analytics.right_display_views}
                icon={PanelRight}
                accent="ai"
                hint="gaze events recorded"
                style={{ ["--delay" as string]: "180ms" }}
              />
            </div>
          )}

          {/* Engagement quality — derived from the same session rows. */}
          {show("analyticsKpis") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Engaged Sessions"
                value={engagedSessions}
                icon={Activity}
                accent="healthy"
                series={gazeSpark}
                hint={
                  sessions.length > 0
                    ? `${Math.round((engagedSessions / sessions.length) * 100)}% dwelled 5s or longer`
                    : "no sessions yet"
                }
                style={{ ["--delay" as string]: "0ms" }}
              />

              <StatCard
                label="Peak Interval"
                value={peak ? peak.label : "—"}
                icon={Clock}
                accent="warning"
                hint={peak ? `${peak.sessions} sessions in that hour` : "awaiting data"}
                style={{ ["--delay" as string]: "60ms" }}
              />

              <StatCard
                label="Avg Attention Score"
                value={averageScore ?? 0}
                icon={GaugeIcon}
                accent="analytics"
                loading={intelligence.loading && averageScore === null}
                unit="/ 100"
                hint="mean shelf attractiveness"
                style={{ ["--delay" as string]: "120ms" }}
              />

              <StatCard
                label="AI Recommendations"
                value={actionableRecommendations}
                icon={Lightbulb}
                accent="ai"
                loading={intelligence.loading}
                hint={`across ${intelligence.recommendations.length} monitored shelves`}
                style={{ ["--delay" as string]: "180ms" }}
              />
            </div>
          )}

          {/* ── Charts ─────────────────────────────────────────────── */}
          {show("shelfAttention") && (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <DisplayAttentionChart
                id="shelf-attention"
                shelfAViews={analytics.left_display_views}
                shelfBViews={analytics.right_display_views}
              />

              <AttentionTimeline id="timeline" sessions={sessions} />
            </div>
          )}

          {show("shelfAttention") && (
            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              <FocusBreakdown sessions={sessions} />
              <DwellDistribution sessions={sessions} />
              <EngagementRadar sessions={sessions} />
            </div>
          )}

          {show("heatmap") && (
            <div id="heatmap" className="mt-5 scroll-mt-24">
              <HeatmapPanel
                token={token}
                role={role}
                lastProcessed={analytics.last_processed}
                storeId={storeId}
                storeName={selectedStore?.name}
                onProcessed={handleProcessed}
              />
            </div>
          )}

          {show("segments") && (
            <div id="segments" className="mt-5 scroll-mt-24">
              <BehaviorSegments sessions={sessions} />
            </div>
          )}

          {show("productIntelligence") && (
            <div id="ai-insights" className="mt-5 scroll-mt-24">
              <ProductIntelligence
                token={token}
                storeId={storeId}
                refreshKey={refreshKey}
                onResults={handleIntelligence}
                framing={{
                  scoreTitle: config.scoreTitle,
                  scoreDescription: config.scoreDescription,
                  adviceTitle: config.adviceTitle,
                  adviceDescription: config.adviceDescription,
                  categories: config.categories,
                }}
              />
            </div>
          )}

          {show("reports") && (
            <div id="reports" className="mt-5 scroll-mt-24">
              <ReportsPanel
                token={token}
                storeId={storeId}
                storeName={selectedStore?.name}
                refreshKey={refreshKey}
                title={config.reportsTitle}
                description={config.reportsDescription}
              />
            </div>
          )}

          {/* ── Recent sessions ────────────────────────────────────── */}
          {show("recentSessions") && (
            <Card className="animate-rise-in mt-5 overflow-hidden">
              <div className="p-5 pb-0 sm:p-6 sm:pb-0">
                <CardHeader
                  icon={<AccentIcon icon={History} variant="behavior" />}
                  title={config.sessionsTitle}
                  description={config.sessionsDescription}
                  action={
                    sessions.length > 0 ? (
                      <StatusBadge variant="behavior">
                        {sessions.length.toLocaleString()} total
                      </StatusBadge>
                    ) : undefined
                  }
                />
              </div>

              {sessions.length === 0 ? (
                <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                  <EmptyState
                    icon={History}
                    title="No sessions recorded yet"
                    description="Each processed clip writes one row per shopper. Upload footage to populate this log."
                    variant="behavior"
                    compact
                  />
                </div>
              ) : (
                <TableShell className="max-h-none">
                  <THead>
                    <TH>Shopper</TH>
                    <TH>Dwell</TH>
                    <TH>Region</TH>
                    <TH>Focus</TH>
                    <TH>Segment</TH>
                    <TH align="right">Gaze shifts</TH>
                  </THead>

                  <tbody>
                    {recentSessions.map((session) => (
                      <TRow key={session.id}>
                        <TD>
                          <IdCell>#{session.shopper_id}</IdCell>
                        </TD>

                        <TD className="font-medium text-ink tabular-nums">
                          {session.dwell_time.toFixed(2)}s
                        </TD>

                        <TD>{regionLabel(session.region)}</TD>

                        <TD>
                          <StatusBadge variant="analytics" size="sm">
                            {zoneLabel(session.focus)}
                          </StatusBadge>
                        </TD>

                        <TD>
                          {session.segment ? (
                            <StatusBadge variant="behavior" size="sm">
                              {session.segment}
                            </StatusBadge>
                          ) : (
                            <span className="text-ink-subtle">—</span>
                          )}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {session.gaze_shifts}
                        </TD>
                      </TRow>
                    ))}
                  </tbody>
                </TableShell>
              )}
            </Card>
          )}
        </>
      )}

      {/* ── System overview ──────────────────────────────────────────── */}
      {show("systemOverview") && (
        <Card className="animate-rise-in mt-5 p-5 sm:p-6">
          <CardHeader
            icon={<AccentIcon icon={ShieldCheck} variant="analytics" />}
            title="System Overview"
            description="Platform configuration and access state."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewItem
              label="Current Role"
              value={role ? roleLabel(role) : "—"}
              icon={ShieldCheck}
              accent="ai"
            />

            <OverviewItem
              label="Total Stores"
              value={String(storeCount)}
              icon={Store}
              accent="analytics"
            />

            <OverviewItem
              label="Total Shelves"
              value={shelfCount === null ? "Loading…" : String(shelfCount)}
              icon={LayoutGrid}
              accent="behavior"
            />

            <OverviewItem
              label="Camera Integration"
              value="Batch processing"
              icon={Camera}
              accent="warning"
              badge={<StatusBadge variant="warning">On demand</StatusBadge>}
            />

            <OverviewItem
              label="Authentication"
              value="Secure (JWT)"
              icon={ShieldCheck}
              accent="healthy"
              badge={<StatusBadge variant="healthy">Active</StatusBadge>}
            />

            <OverviewItem
              label="Vision Pipeline"
              value={analytics.last_processed ? "Analytics written" : "Idle"}
              icon={Activity}
              accent={analytics.last_processed ? "healthy" : "neutral"}
              badge={
                <StatusBadge
                  variant={analytics.last_processed ? "healthy" : "neutral"}
                  dot
                  pulse={Boolean(analytics.last_processed)}
                >
                  {analytics.last_processed ? "Ready" : "Awaiting run"}
                </StatusBadge>
              }
            />
          </div>
        </Card>
      )}

      {/* ── Module links ─────────────────────────────────────────────── */}
      {show("quickLinks") && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {can(role, "viewStores") && (
            <Link href="/stores" className="rounded-2xl">
              <Card
                interactive
                glow="analytics"
                className="group flex items-center justify-between gap-4 p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <AccentIcon icon={Store} variant="analytics" size="lg" solid />

                  <div className="min-w-0">
                    <p className="font-display font-semibold text-ink">
                      {can(role, "manageStores")
                        ? "Manage Stores"
                        : "View Stores"}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {can(role, "manageStores")
                        ? "View, add and edit store locations"
                        : "Browse store locations"}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-1" />
              </Card>
            </Link>
          )}

          {can(role, "viewShelves") && (
            <Link href="/shelves" className="rounded-2xl">
              <Card
                interactive
                glow="behavior"
                className="group flex items-center justify-between gap-4 p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <AccentIcon
                    icon={LayoutGrid}
                    variant="behavior"
                    size="lg"
                    solid
                  />

                  <div className="min-w-0">
                    <p className="font-display font-semibold text-ink">
                      Manage Shelves
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      Configure shelf zones per store
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-1" />
              </Card>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
