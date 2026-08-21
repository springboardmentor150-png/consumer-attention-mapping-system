"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, Tile } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { priorityTone, scoreTone } from "@/lib/tone";
import { assessShelves } from "@/lib/attractiveness";
import {
  downloadReport,
  getStoreReport,
  type ReportFormat,
  type ReportZone,
  type StoreReport,
} from "@/lib/api";

function stamp(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;

  const parsed = new Date(value);

  return Number.isNaN(parsed.valueOf())
    ? fallback
    : parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function ReportsPanel({
  token,
  storeId = null,
  storeName,
  refreshKey = 0,
  title = "Reports & Export",
  description = "Download this store's attention report as PDF or CSV.",
}: {
  token: string;
  /** Reports are per store; null means no store is selected yet. */
  storeId?: number | null;
  storeName?: string;
  /**
   * Bumped by the page when a processing run writes new analytics, so the
   * report, its shelf scores and its alerts are rebuilt from the new
   * sessions rather than the ones fetched when the page opened.
   */
  refreshKey?: number;
  title?: string;
  description?: string;
}) {
  const [report, setReport] = useState<StoreReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<ReportFormat | null>(null);
  const [exportMessage, setExportMessage] = useState("");
  const [exportFailed, setExportFailed] = useState(false);

  useEffect(() => {
    setExportMessage("");
    setExportFailed(false);

    if (!token || storeId == null) {
      setReport(null);
      setError("");
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");

    getStoreReport(storeId, token)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReport(null);
        setError(err instanceof Error ? err.message : "Failed to load report.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // refreshKey: the report is scored from analytics, so a processing run
    // invalidates its zones, its severities and its alerts.
  }, [token, storeId, refreshKey]);

  async function handleExport(format: ReportFormat) {
    if (storeId == null) return;

    setExporting(format);
    setExportMessage("");
    setExportFailed(false);

    try {
      const filename = await downloadReport(storeId, format, token);
      setExportMessage(`Downloaded ${filename}`);
    } catch (err) {
      console.error(err);
      setExportFailed(true);
      setExportMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  /* ── Scoring model ───────────────────────────────────────────────────
     GET /reports/ runs the same scoring engine as the AI panel, so its
     zones are put through the same model — see src/lib/attractiveness.ts.
     Both panels on this page therefore state one score, one status and one
     severity per shelf.

     Scope note: this is the displayed report. The PDF and CSV exports are
     rendered by the backend and carry its own figures.
     ──────────────────────────────────────────────────────────────────── */
  // Keyed on the shelf label, which is what the AI panel keys on too
  // (see shelfLabel in ProductIntelligence). The key seeds the model's
  // deterministic input generation, so keying the two panels differently
  // would give the same shelf two different scores on one page.
  const assessed = useMemo(
    () =>
      assessShelves(
        (report?.zones ?? []).map((zone) => ({
          key: zone.shelf,
          metrics: zone.metrics_used,
          sessions: zone.sessions,
          dwellSeconds: zone.average_dwell_seconds,
        }))
      ),
    [report]
  );

  const scoreOf = (zone: ReportZone) =>
    assessed.get(zone.shelf)?.score ?? zone.attractiveness_score;

  const statusOf = (zone: ReportZone) =>
    assessed.get(zone.shelf)?.health.label ?? zone.priority;

  const severityOf = (zone: ReportZone) =>
    assessed.get(zone.shelf)?.health.priority ?? zone.priority;

  /**
   * System health alerts, derived rather than taken from the response.
   *
   * The backend surfaces its own High-priority band as "current alerts"
   * (see build_store_report). Escalating from the computed score instead
   * is what stops a shelf scoring in the Good band raising a High-priority
   * alert, and each message names the input costing that shelf the most.
   */
  const alerts = useMemo(
    () =>
      (report?.zones ?? [])
        .map((zone) => {
          const shelf = assessed.get(zone.shelf);

          return shelf?.alert
            ? {
                shelf: zone.shelf,
                severity: shelf.alert.severity,
                attractiveness_score: shelf.score,
                message: shelf.alert.message,
              }
            : null;
        })
        .filter((alert): alert is NonNullable<typeof alert> => alert !== null),
    [report, assessed]
  );

  const ready = storeId != null && report !== null;

  return (
    <Card className="animate-rise-in p-5 sm:p-6">
      <CardHeader
        icon={<AccentIcon icon={FileText} variant="analytics" />}
        title={title}
        description={description}
        action={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              loading={exporting === "pdf"}
              disabled={!ready || exporting !== null}
              title={
                ready ? undefined : "Select a single store to export a report"
              }
            >
              {exporting !== "pdf" && <FileText />}
              PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              loading={exporting === "csv"}
              disabled={!ready || exporting !== null}
              title={
                ready ? undefined : "Select a single store to export a report"
              }
            >
              {exporting !== "csv" && <FileSpreadsheet />}
              CSV
            </Button>
          </>
        }
      />

      {storeId == null ? (
        <EmptyState
          icon={Building2}
          title="Select a store to build a report"
          description="Reports cover one store at a time. Choose a store from the selector above."
          variant="analytics"
          compact
        />
      ) : loading ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Building the report{storeName ? ` for ${storeName}` : ""}…
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Report could not be built"
          description={error}
          compact
        />
      ) : report ? (
        <>
          {/* ── Headline figures ─────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["Total shoppers", report.summary.total_shoppers.toLocaleString(), "analytics"],
                [
                  "Average dwell",
                  `${report.summary.average_dwell_time.toFixed(2)}s`,
                  "behavior",
                ],
                ["Shelf A views", report.summary.shelf_a_views.toLocaleString(), "brand"],
                ["Shelf B views", report.summary.shelf_b_views.toLocaleString(), "ai"],
              ] as const
            ).map(([label, value]) => (
              <Tile key={label} className="bg-surface-sunken/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
                  {label}
                </p>

                <p className="mt-1.5 font-display text-2xl font-bold tabular-nums tracking-tight text-ink">
                  {value}
                </p>
              </Tile>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* ── Shelf performance ──────────────────────────────────── */}
            <Tile>
              <p className="font-display text-sm font-semibold text-ink">
                Shelf performance
              </p>

              {report.zones.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  No shelf zones scored for this store yet.
                </p>
              ) : (
                <ul className="mt-3.5 space-y-3.5">
                  {report.zones.map((zone) => (
                    <li key={zone.zone}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium text-ink">
                          {zone.shelf}
                        </span>

                        <span className="flex shrink-0 items-center gap-2">
                          <StatusBadge
                            variant={priorityTone(severityOf(zone))}
                            size="sm"
                          >
                            {statusOf(zone)}
                          </StatusBadge>

                          <span className="w-8 text-right text-sm font-semibold tabular-nums text-ink">
                            {Math.round(scoreOf(zone))}
                          </span>
                        </span>
                      </div>

                      <Progress
                        value={scoreOf(zone)}
                        variant={scoreTone(scoreOf(zone))}
                        size="sm"
                        label={`${zone.shelf} attractiveness`}
                        className="mt-2"
                      />

                      <p className="mt-1.5 text-xs text-ink-subtle">
                        {zone.sessions} sessions ·{" "}
                        {zone.average_dwell_seconds.toFixed(2)}s average dwell
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Tile>

            {/* ── Segments ───────────────────────────────────────────── */}
            <Tile>
              <p className="font-display text-sm font-semibold text-ink">
                Shopper segments
              </p>

              {Object.keys(report.segments).length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  No segmented sessions yet.
                </p>
              ) : (
                <ul className="mt-3.5 space-y-3">
                  {Object.entries(report.segments).map(([segment, count]) => {
                    const total = Object.values(report.segments).reduce(
                      (sum, value) => sum + value,
                      0
                    );

                    return (
                      <li key={segment}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-ink-muted">
                            {segment}
                          </span>

                          <span className="shrink-0 font-semibold tabular-nums text-ink">
                            {count}
                          </span>
                        </div>

                        <Progress
                          value={total === 0 ? 0 : (count / total) * 100}
                          variant="behavior"
                          size="sm"
                          label={`${segment} share`}
                          className="mt-2"
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Tile>
          </div>

          {/* ── Alerts ───────────────────────────────────────────────── */}
          <Tile
            className={cn(
              "mt-4",
              alerts.length > 0 && "border-critical-soft bg-critical-soft/20"
            )}
          >
            <div className="flex items-center gap-2">
              {alerts.length > 0 ? (
                <AlertTriangle
                  className="h-4 w-4 text-critical-base"
                  aria-hidden="true"
                />
              ) : (
                <ShieldCheck
                  className="h-4 w-4 text-healthy-base"
                  aria-hidden="true"
                />
              )}

              <p className="font-display text-sm font-semibold text-ink">
                Current alerts
              </p>

              {alerts.length > 0 && (
                <StatusBadge variant="critical" size="sm">
                  {alerts.length}
                </StatusBadge>
              )}
            </div>

            {alerts.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">
                No shelves are currently in the alert band.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {alerts.map((alert) => (
                  <li
                    key={alert.shelf}
                    className="flex flex-wrap items-start gap-2 text-sm"
                  >
                    <StatusBadge
                      variant={priorityTone(alert.severity)}
                      size="sm"
                    >
                      {alert.shelf}
                    </StatusBadge>

                    <span className="min-w-0 flex-1 text-ink-muted text-pretty">
                      {alert.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3 text-xs text-ink-subtle">
            <span className="font-medium text-ink-muted">
              {report.store.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{report.store.location}</span>
            <span aria-hidden="true">·</span>
            <span>Generated {stamp(report.generated_at, "just now")}</span>
            <span aria-hidden="true">·</span>
            <span>
              Analytics last processed{" "}
              {stamp(report.summary.last_processed, "never")}
            </span>
          </p>
        </>
      ) : null}

      {exportMessage && (
        <div
          role="status"
          className={cn(
            "mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm",
            exportFailed
              ? "border-critical-soft bg-critical-soft/40 text-critical-strong"
              : "border-healthy-soft bg-healthy-soft/50 text-healthy-strong"
          )}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          {exportMessage}
        </div>
      )}
    </Card>
  );
}
