"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Film,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProcessingWorkspace } from "@/components/processing/ProcessingWorkspace";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import {
  ACCEPTED_VIDEO_TYPES,
  fetchStoreHeatmap,
  getShelves,
  PROCESSING_ZONES,
  type HeatmapResult,
  type ProcessVideoResult,
  type ShelfRecord,
} from "@/lib/api";

// Analytics only change when a video is processed, so the panel states when
// that last happened rather than implying a live feed.
function processedLabel(value: string | null | undefined) {
  if (!value) return "Not yet processed";

  const parsed = new Date(value);

  return Number.isNaN(parsed.valueOf())
    ? "Not yet processed"
    : `Processed ${parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`;
}

// The colour ramp the backend renders the heatmap with, described for the
// legend. Cold to hot, matching how the image reads.
const RAMP = [
  { label: "Low", className: "bg-analytics-base" },
  { label: "", className: "bg-behavior-base" },
  { label: "Moderate", className: "bg-healthy-base" },
  { label: "", className: "bg-warning-base" },
  { label: "High", className: "bg-critical-base" },
];

export function HeatmapPanel({
  token,
  role = "",
  lastProcessed,
  storeId = null,
  storeName,
  onProcessed,
}: {
  token: string;
  role?: string;
  /** From the analytics summary — when the pipeline last wrote data. */
  lastProcessed?: string | null;
  /** Store the processed footage belongs to. Required to run the pipeline. */
  storeId?: number | null;
  /** Shown in the processing workspace header, so a run names its store. */
  storeName?: string;
  /**
   * Called after a run writes new analytics. The surrounding dashboard fetched
   * its figures before the upload, so without this it would keep showing the
   * old numbers — reading "0 shoppers" directly beneath "4 sessions written".
   */
  onProcessed?: () => void;
}) {
  const [result, setResult] = useState<HeatmapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // The clip currently being processed. Set when the run starts, which is
  // what opens the workspace; cleared when it closes. The run itself lives in
  // the workspace, so this doubles as "a run is in flight".
  const [runningClip, setRunningClip] = useState<File | null>(null);
  const [processMessage, setProcessMessage] = useState("");
  const [processFailed, setProcessFailed] = useState(false);
  const [processedAt, setProcessedAt] = useState<string | null | undefined>(
    undefined
  );

  // Shelves belonging to the selected store, and which one each frame region
  // maps to. The pipeline emits regions, not shelf records, so this mapping
  // has to come from the user rather than being inferred.
  const [shelves, setShelves] = useState<ShelfRecord[]>([]);
  const [shelfMap, setShelfMap] = useState<Record<string, number>>({});

  // The clip to process. The pipeline reads a whole file and stops at its end,
  // so this is an upload-and-process flow rather than a live feed.
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  // Presentation only: expands the plate to full width for close reading.
  const [expanded, setExpanded] = useState(false);

  // Running the pipeline is operational configuration — same tier the backend
  // gates POST /api/camera/process behind.
  // Processing writes analytics rows, and every row must be attributable to a
  // store — so the button stays disabled until a specific store is selected.
  const canProcess = can(role, "cameraControls");
  const canRun = canProcess && storeId != null;

  // A run is in flight for exactly as long as the workspace is open, so the
  // upload controls below lock on the same condition they always did.
  const processing = runningClip !== null;

  const shownTimestamp = processedAt !== undefined ? processedAt : lastProcessed;

  async function loadHeatmap() {
    setLoading(true);
    setError(false);

    try {
      const heatmap = await fetchStoreHeatmap(token);

      setResult((previous) => {
        // Release the previous blob before replacing it.
        if (previous?.status === "ready") {
          URL.revokeObjectURL(previous.imageUrl);
        }
        return heatmap;
      });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    async function initialLoad() {
      setLoading(true);
      setError(false);

      try {
        const heatmap = await fetchStoreHeatmap(token);

        if (cancelled) {
          if (heatmap.status === "ready") {
            URL.revokeObjectURL(heatmap.imageUrl);
          }
          return;
        }

        if (heatmap.status === "ready") {
          objectUrl = heatmap.imageUrl;
        }

        setResult(heatmap);
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [token]);

  useEffect(() => {
    // A mapping only makes sense for one store, so drop it when the store
    // changes rather than sending another store's shelf ids.
    setShelfMap({});
    setVideoFile(null);

    if (!token || storeId == null) {
      setShelves([]);
      return;
    }

    let cancelled = false;

    getShelves(storeId, token)
      .then((rows: ShelfRecord[]) => {
        if (!cancelled) setShelves(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setShelves([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token, storeId]);

  function setZoneShelf(region: string, value: string) {
    setShelfMap((current) => {
      const next = { ...current };

      if (value === "") {
        delete next[region];
      } else {
        next[region] = Number(value);
      }

      return next;
    });
  }

  /**
   * Open the processing workspace on the chosen clip.
   *
   * The run is streamed from there rather than awaited here, so the pipeline
   * is watchable while it works instead of the panel sitting on a spinner.
   * The request it issues carries the same store, clip and shelf mapping the
   * batch endpoint takes.
   */
  function handleRefresh() {
    setProcessMessage("");
    setProcessFailed(false);

    if (storeId == null) {
      setProcessFailed(true);
      setProcessMessage("Select a store before processing footage.");
      return;
    }

    if (!videoFile) {
      setProcessFailed(true);
      setProcessMessage("Choose a video file to process.");
      return;
    }

    setRunningClip(videoFile);
  }

  /** The run finished. Refresh onto its results. */
  async function handleProcessed(summary: ProcessVideoResult) {
    setRunningClip(null);
    setProcessedAt(summary.last_processed ?? null);

    setProcessMessage(
      `Processed ${summary.frames_processed} frames · ` +
        `${summary.sessions_written} sessions written` +
        (summary.session_write_failures > 0
          ? ` · ${summary.session_write_failures} failed to save`
          : "")
    );

    setVideoFile(null);

    await loadHeatmap();

    // Let the dashboard refetch now that this store has new analytics.
    onProcessed?.();
  }

  return (
    <>
      {/* The run itself, shown frame by frame while it works. */}
      {runningClip && storeId != null && (
        <ProcessingWorkspace
          token={token}
          storeId={storeId}
          storeName={storeName}
          file={runningClip}
          shelfMap={shelfMap}
          shelves={shelves}
          onClose={() => setRunningClip(null)}
          onComplete={handleProcessed}
        />
      )}

      <Card className="animate-rise-in p-5 sm:p-6">
      <CardHeader
        icon={<AccentIcon icon={Flame} variant="critical" />}
        title="Store Traffic Heatmap"
        description="Shopper movement hotspots rendered from the last processed video."
        action={
          <>
            <StatusBadge
              variant={shownTimestamp ? "healthy" : "neutral"}
              dot
              pulse={Boolean(shownTimestamp)}
            >
              {processedLabel(shownTimestamp)}
            </StatusBadge>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={loadHeatmap}
              aria-label="Reload heatmap"
              title="Reload heatmap"
              disabled={loading || processing}
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
            </Button>

            {canProcess && (
              <Button
                type="button"
                size="sm"
                onClick={handleRefresh}
                loading={processing}
                disabled={!canRun || !videoFile}
                title={
                  !canRun
                    ? "Select a single store to process footage into"
                    : !videoFile
                      ? "Choose a video file first"
                      : undefined
                }
              >
                {!processing && <Upload />}
                {processing ? "Processing…" : "Process video"}
              </Button>
            )}
          </>
        }
      />

      {/* ── Upload & mapping ──────────────────────────────────────────── */}
      {canRun && (
        <div className="mb-5 rounded-xl border border-line bg-surface-sunken/50 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">Source footage</p>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-ink-subtle">
            The clip is uploaded and processed once, end to end — this is not a
            live camera feed. Accepted formats:{" "}
            <span className="font-mono">{ACCEPTED_VIDEO_TYPES}</span>.
          </p>

          {/* Drop zone. The native input stays underneath so keyboard and
              file-picker flows are unchanged. */}
          <label
            htmlFor="video_file"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);

              const dropped = event.dataTransfer.files?.[0];
              if (dropped && !processing) setVideoFile(dropped);
            }}
            className={cn(
              "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-7 text-center",
              "transition-all duration-200",
              dragging
                ? "border-brand-base bg-brand-soft/60"
                : "border-line hover:border-line-strong hover:bg-surface",
              processing && "pointer-events-none opacity-60"
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200",
                videoFile
                  ? "bg-healthy-soft text-healthy-strong"
                  : "bg-brand-soft text-brand-deep",
                dragging && "scale-110"
              )}
            >
              {videoFile ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Upload className="h-5 w-5" aria-hidden="true" />
              )}
            </span>

            {videoFile ? (
              <>
                <span className="text-sm font-medium text-ink">
                  {videoFile.name}
                </span>
                <span className="text-xs text-ink-subtle">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB · click to
                  replace
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-ink">
                  Drop a video here, or click to browse
                </span>
                <span className="text-xs text-ink-subtle">
                  One clip per run, processed to completion
                </span>
              </>
            )}

            <input
              id="video_file"
              type="file"
              accept={ACCEPTED_VIDEO_TYPES}
              disabled={processing}
              onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          {/* Region → shelf mapping. */}
          <div className="mt-5 flex items-center gap-2">
            <Layers className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">Shelf mapping</p>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-ink-subtle">
            The pipeline detects frame regions, not shelf records. Choose which
            shelf each region belongs to so sessions are filed correctly.
            Regions left unmapped are still recorded, just without a shelf.
          </p>

          {shelves.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line px-4 py-3 text-sm text-ink-muted">
              This store has no shelves yet — add one to map regions to it.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {PROCESSING_ZONES.map((zone) => (
                <div key={zone.region}>
                  <label
                    htmlFor={`zone_${zone.region}`}
                    className="mb-1.5 block text-xs font-medium text-ink-muted"
                  >
                    {zone.label}
                  </label>

                  <Select
                    id={`zone_${zone.region}`}
                    size="sm"
                    value={shelfMap[zone.region] ?? ""}
                    onChange={(event) =>
                      setZoneShelf(zone.region, event.target.value)
                    }
                    disabled={processing}
                  >
                    <option value="">Not mapped</option>

                    {shelves.map((shelf) => (
                      <option key={shelf.id} value={shelf.id}>
                        {shelf.shelf_name}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {processMessage && (
        <div
          role="status"
          className={cn(
            "mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
            processFailed
              ? "border-critical-soft bg-critical-soft/40 text-critical-strong"
              : "border-healthy-soft bg-healthy-soft/50 text-healthy-strong"
          )}
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{processMessage}</span>
        </div>
      )}

      {/* ── The plate ─────────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : error ? (
        <ErrorState
          title="Heatmap could not be loaded"
          description="The heatmap image did not come back from the server."
          onRetry={loadHeatmap}
          compact
        />
      ) : result?.status === "pending" ? (
        <EmptyState
          icon={Flame}
          title="No heatmap generated yet"
          description={result.message}
          variant="critical"
          compact
        />
      ) : result?.status === "ready" ? (
        <figure className="overflow-hidden rounded-xl border border-line bg-canvas-deep">
          <div
            className={cn(
              "group/plate relative flex justify-center overflow-auto p-3",
              expanded ? "max-h-none" : "max-h-[520px]"
            )}
          >
            {/* w-auto/max-w-full preserve the source aspect ratio and stop the
                backend-generated image being upscaled on wide screens. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.imageUrl}
              alt="Store traffic heatmap showing shopper movement hotspots"
              className={cn(
                "h-auto rounded-lg object-contain transition-transform duration-500 ease-out",
                expanded
                  ? "w-full max-w-none"
                  : "max-h-[480px] w-auto max-w-full group-hover/plate:scale-[1.02]"
              )}
            />

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setExpanded((current) => !current)}
              aria-label={expanded ? "Fit heatmap" : "Expand heatmap"}
              title={expanded ? "Fit to panel" : "Expand to full width"}
              className="absolute right-4 top-4 opacity-0 transition-opacity duration-200 group-hover/plate:opacity-100 focus-visible:opacity-100"
            >
              {expanded ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </div>

          <figcaption className="flex flex-col gap-3 border-t border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-ink-subtle">
              Warmer areas mark where shoppers dwelled longest.
            </span>

            {/* Intensity legend. */}
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-ink-subtle">
                Low
              </span>

              <span
                aria-hidden="true"
                className="flex h-2 w-32 overflow-hidden rounded-full"
              >
                {RAMP.map((stop, index) => (
                  <span
                    key={index}
                    className={cn("flex-1", stop.className)}
                  />
                ))}
              </span>

              <span className="text-[11px] font-medium text-ink-subtle">
                High
              </span>
            </span>
          </figcaption>
        </figure>
      ) : null}
      </Card>
    </>
  );
}
