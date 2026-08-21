"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Check,
  Clock,
  Cpu,
  Film,
  Gauge,
  Layers,
  LayoutGrid,
  Loader2,
  ScanFace,
  Users,
  X,
} from "lucide-react";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";
import {
  PROCESSING_STAGES,
  regionLabel,
  streamVideoProcessing,
  WALKING_AISLE_LABEL,
  type ProcessingFrame,
  type ProcessingStage,
  type ProcessingStart,
  type ProcessVideoResult,
  type ShelfRecord,
  type StageState,
} from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════════
   Processing workspace.

   Shows a run of the vision pipeline while it is happening: the annotated
   frames, the live counters and which stage the run has reached.

   Nothing here computes, redraws or estimates anything. Every frame shown
   is the JPEG the backend produced after it finished drawing its own
   overlays — the YOLO boxes, the ByteTrack ids, the MediaPipe face mesh and
   the shelf region rectangles are all already in the image. Every counter
   is a value the pipeline measured and reported. When the stream ends, the
   caller is handed the same summary POST /api/camera/process returns and
   the dashboard refreshes onto the new analytics.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * What the coloured overlays in the streamed frame mean.
 *
 * The backend draws boxes and labels in green and the shelf regions in blue
 * (see start_video_stream), so the swatches below are fixed to those two
 * colours rather than to a theme token — they describe pixels in a JPEG,
 * not UI chrome.
 */
const OVERLAY_LEGEND = [
  { color: "#22c55e", label: "YOLO box · track id · gaze" },
  { color: "#3b82f6", label: "Shelf zone regions" },
];

const STAGE_ICONS: Record<ProcessingStage, typeof Boxes> = {
  yolo: Boxes,
  bytetrack: Activity,
  pose: ScanFace,
  heatmap: Layers,
  analytics: Gauge,
};

type StageMap = Record<ProcessingStage, StageState>;

const INITIAL_STAGES = PROCESSING_STAGES.reduce(
  (all, entry) => ({ ...all, [entry.stage]: "pending" as StageState }),
  {} as StageMap
);

const STAGE_TONE: Record<StageState, Tone> = {
  pending: "neutral",
  running: "brand",
  complete: "healthy",
  failed: "critical",
};

/** The value most of the tracked shoppers share, or null when none do. */
function modeOf(values: string[]): string | null {
  if (values.length === 0) return null;

  const counts = new Map<string, number>();

  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  variant = "neutral",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  variant?: Tone;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn("h-3.5 w-3.5", tone(variant).text)}
          aria-hidden="true"
        />
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
          {label}
        </span>
      </div>

      <p className="mt-1.5 truncate font-display text-lg font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>

      {hint && (
        <p className="mt-0.5 truncate text-[11px] text-ink-subtle">{hint}</p>
      )}
    </div>
  );
}

export function ProcessingWorkspace({
  token,
  storeId,
  storeName,
  file,
  shelfMap,
  shelves,
  onClose,
  onComplete,
}: {
  token: string;
  storeId: number;
  storeName?: string;
  /** The clip being processed. */
  file: File;
  /** Frame region to shelf id, as configured before the run. */
  shelfMap: Record<string, number>;
  /** Shelves of the selected store, so a mapped region can be named. */
  shelves: ShelfRecord[];
  /** Dismiss the workspace without waiting for the dashboard to refresh. */
  onClose: () => void;
  /**
   * Called once the run has finished and its analytics are settled. The
   * dashboard refetches here, which is the transition onto the new results.
   */
  onComplete: (summary: ProcessVideoResult) => void;
}) {
  const [start, setStart] = useState<ProcessingStart | null>(null);
  const [frame, setFrame] = useState<ProcessingFrame | null>(null);
  const [stages, setStages] = useState<StageMap>(INITIAL_STAGES);
  const [summary, setSummary] = useState<ProcessVideoResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [running, setRunning] = useState(true);

  // Held so the close button can abort a run in flight rather than leaving
  // the request streaming into a component that no longer exists.
  const abortRef = useRef<AbortController | null>(null);

  // The run is started from an effect keyed only on the things that identify
  // it, so a re-render never starts a second run over the same clip.
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function run() {
      try {
        const stream = streamVideoProcessing(storeId, token, {
          file,
          shelfMap,
          signal: controller.signal,
        });

        for await (const event of stream) {
          if (cancelled) return;

          if (event.kind === "start") {
            setStart(event.data);
          } else if (event.kind === "frame") {
            setFrame(event.data);
          } else if (event.kind === "stage") {
            setStages((current) => ({
              ...current,
              [event.data.stage]: event.data.state,
            }));
          } else if (event.kind === "finish") {
            setSummary(event.data);
          } else if (event.kind === "failed") {
            setFailure(event.data.detail);
          }
        }
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;

        console.error(error);

        setFailure(
          error instanceof Error ? error.message : "Processing failed."
        );
      } finally {
        if (!cancelled) setRunning(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, storeId, file]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  // Held in a ref so the auto-transition below is not restarted by a caller
  // passing a fresh arrow function on every render.
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  /*
   * Hand back to the dashboard once the run has settled.
   *
   * The short pause is deliberate: the summary and the final frame are worth
   * a beat before the view changes underneath the reader. The button below
   * does the same thing immediately for anyone who would rather not wait.
   */
  useEffect(() => {
    if (!summary) return;

    const timer = window.setTimeout(() => completeRef.current(summary), 1800);

    return () => window.clearTimeout(timer);
  }, [summary]);

  // Escape closes the workspace, matching every other overlay in the app.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") stop();
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  /* ── Live figures, all read straight from the reported frame ───────── */

  // Region is where a shopper is standing; focus is what they are looking
  // at. Both are the pipeline's own values, already labelled by the backend.
  const currentZone = useMemo(
    () => (frame ? modeOf(Object.values(frame.regions)) : null),
    [frame]
  );

  const currentFocus = useMemo(
    () => (frame ? modeOf(Object.values(frame.focuses)) : null),
    [frame]
  );

  // Which shelf record that region was mapped to before the run. Unmapped
  // regions are named as such rather than guessed at.
  const currentShelf = useMemo(() => {
    if (!currentZone || currentZone === WALKING_AISLE_LABEL) return null;

    const region = Object.entries(shelfMap).find(
      ([value]) => regionLabel(value) === currentZone
    );

    if (!region) return null;

    return shelves.find((shelf) => shelf.id === region[1])?.shelf_name ?? null;
  }, [currentZone, shelfMap, shelves]);

  const expected = start?.expected_frames ?? 0;

  /*
   * Percentage complete.
   *
   * A run ends at whichever of its two bounds is reached first: the last
   * frame of the clip, or the server's time limit. Detection is a good deal
   * slower than real time on a large frame, so a 30-second budget routinely
   * stops a clip a fraction of the way through its frames — tracking frames
   * alone would sit at 20% and then jump straight to done. Taking whichever
   * bound is further along is the honest reading of how much of *this run*
   * is left.
   *
   * A source that can report neither — a camera, or a container with no
   * frame count and no limit — leaves the rail indeterminate rather than
   * showing an invented figure.
   */
  const progress = (() => {
    if (summary) return 100;

    if (!frame) return null;

    const bounds: number[] = [];

    if (expected > 0) bounds.push((frame.frame_index / expected) * 100);

    if (start?.max_seconds) {
      bounds.push((frame.elapsed / start.max_seconds) * 100);
    }

    if (bounds.length === 0) return null;

    // Capped below 100: only the finish event may say the run is done.
    return Math.min(99, Math.max(...bounds));
  })();

  const trackIds = frame?.track_ids ?? [];

  const finished = summary !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video processing workspace"
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-canvas-deep/80 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="animate-scale-in my-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <AccentIcon icon={Film} variant="brand" />

            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                Processing workspace
              </h2>

              <p className="mt-0.5 truncate text-sm text-ink-muted">
                {file.name}
                {storeName ? ` · ${storeName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {failure ? (
              <StatusBadge variant="critical" dot>
                Run failed
              </StatusBadge>
            ) : finished ? (
              <StatusBadge variant="healthy" dot>
                Complete
              </StatusBadge>
            ) : (
              <StatusBadge variant="brand" dot pulse>
                {running ? "Pipeline running" : "Finishing"}
              </StatusBadge>
            )}

            {start && start.width > 0 && (
              <StatusBadge variant="neutral" outline size="sm">
                {start.width}×{start.height}
                {start.source_fps > 0 ? ` · ${start.source_fps} fps` : ""}
              </StatusBadge>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={stop}
              aria-label="Close processing workspace"
              title={
                running
                  ? "Stop watching and close. Sessions already written are kept."
                  : "Close"
              }
            >
              <X />
            </Button>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* ── The processed frame ──────────────────────────────── */}
          <div className="min-w-0">
            <figure className="overflow-hidden rounded-xl border border-line bg-canvas-deep">
              <div className="relative flex aspect-video items-center justify-center">
                {frame ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frame.image}
                    alt={`Processed frame ${frame.frame_index}, annotated by the detection pipeline`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-ink-subtle">
                    <Loader2
                      className="h-7 w-7 animate-spin"
                      aria-hidden="true"
                    />
                    <p className="text-sm">
                      {failure
                        ? "The run stopped before any frame was read."
                        : "Opening the clip and loading the models…"}
                    </p>
                  </div>
                )}

                {frame && (
                  <span className="absolute left-3 top-3 rounded-md bg-canvas-deep/75 px-2 py-1 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
                    Frame {frame.frame_index.toLocaleString()}
                    {expected > 0 ? ` / ${expected.toLocaleString()}` : ""}
                  </span>
                )}
              </div>

              <figcaption className="flex flex-col gap-2 border-t border-line bg-surface px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-ink-subtle">
                  Frames are shown exactly as the pipeline annotated them.
                </span>

                <span className="flex flex-wrap items-center gap-3">
                  {OVERLAY_LEGEND.map((entry) => (
                    <span
                      key={entry.label}
                      className="flex items-center gap-1.5 text-[11px] text-ink-subtle"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-[3px]"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.label}
                    </span>
                  ))}
                </span>
              </figcaption>
            </figure>

            {/* ── Progress ──────────────────────────────────────── */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-ink-muted">
                  {finished
                    ? "Run complete"
                    : progress === null
                      ? "Processing — clip length unknown"
                      : "Processing"}
                </span>

                <span className="tabular-nums text-ink-subtle">
                  {progress === null
                    ? frame
                      ? `${frame.elapsed.toFixed(1)}s elapsed`
                      : "—"
                    : `${Math.round(progress)}%`}
                </span>
              </div>

              <Progress
                value={progress ?? (frame ? 100 : 0)}
                variant={
                  failure ? "critical" : finished ? "healthy" : "brand"
                }
                size="sm"
                label="Video processing progress"
                className={cn(
                  progress === null && !finished && "animate-pulse"
                )}
              />
            </div>

            {/* ── Live statistics ───────────────────────────────── */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat
                icon={Film}
                label="Frames"
                value={(
                  summary?.frames_processed ??
                  frame?.frame_index ??
                  0
                ).toLocaleString()}
                hint="processed"
                variant="brand"
              />

              <Stat
                icon={Gauge}
                label="FPS"
                value={frame ? frame.fps.toFixed(1) : "—"}
                hint="pipeline throughput"
                variant="analytics"
              />

              <Stat
                icon={Users}
                label="People"
                value={frame ? String(frame.people) : "—"}
                hint="detected this frame"
                variant="behavior"
              />

              <Stat
                icon={Activity}
                label="Track IDs"
                value={
                  trackIds.length > 0
                    ? trackIds.map((id) => `#${id}`).join(" ")
                    : "—"
                }
                hint={`${trackIds.length} active`}
                variant="ai"
              />

              <Stat
                icon={LayoutGrid}
                label="Current shelf"
                value={currentShelf ?? "Not mapped"}
                hint={
                  currentShelf
                    ? "mapped from the frame region"
                    : "region has no shelf record"
                }
                variant="warning"
              />

              <Stat
                icon={Layers}
                label="Current zone"
                value={currentZone ?? "—"}
                hint={currentFocus ? `looking at ${currentFocus}` : "frame region"}
                variant="healthy"
              />
            </div>
          </div>

          {/* ── Stages and run state ─────────────────────────────── */}
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Pipeline stages
            </p>

            <ul className="mt-2.5 space-y-2">
              {PROCESSING_STAGES.map((entry) => {
                const state = stages[entry.stage];
                const variant = STAGE_TONE[state];

                // The heatmap and segmentation stages only run when the clip
                // produced tracked positions to build them from. On a run
                // that found nobody they never start, so once the run is over
                // "pending" would be misleading — nothing more is coming.
                const label =
                  state === "pending" && (finished || failure)
                    ? "did not run"
                    : state;
                const Icon = STAGE_ICONS[entry.stage];

                return (
                  <li
                    key={entry.stage}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300",
                      state === "pending"
                        ? "border-line bg-surface-sunken/40"
                        : cn("bg-surface", tone(variant).border)
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        state === "pending"
                          ? "bg-surface-sunken text-ink-subtle"
                          : tone(variant).icon
                      )}
                    >
                      {state === "complete" ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : state === "running" ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : state === "failed" ? (
                        <AlertTriangle
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {entry.label}
                      </span>
                      <span className="block text-[11px] first-letter:uppercase text-ink-subtle">
                        {label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Secondary counters — the run's cumulative output. */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat
                icon={Clock}
                label="Elapsed"
                value={
                  summary
                    ? `${summary.duration_seconds.toFixed(1)}s`
                    : frame
                      ? `${frame.elapsed.toFixed(1)}s`
                      : "—"
                }
                hint={
                  start?.max_seconds ? `limit ${start.max_seconds}s` : undefined
                }
                variant="analytics"
              />

              <Stat
                icon={Cpu}
                label="Memory"
                value={frame ? `${Math.round(frame.memory_mb)} MB` : "—"}
                hint="resident set"
                variant="neutral"
              />

              <Stat
                icon={Users}
                label="Sessions"
                value={String(
                  summary?.sessions_written ?? frame?.sessions_written ?? 0
                )}
                hint="written so far"
                variant="healthy"
              />

              <Stat
                icon={Layers}
                label="Heat points"
                value={(frame?.heatmap_points ?? 0).toLocaleString()}
                hint="positions recorded"
                variant="critical"
              />
            </div>

            {/* ── Outcome ────────────────────────────────────────── */}
            {failure && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-critical-soft bg-critical-soft/40 px-4 py-3 text-sm text-critical-strong"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{failure}</span>
              </div>
            )}

            {summary && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-healthy-soft bg-healthy-soft/40 px-4 py-3 text-sm text-healthy-strong"
              >
                <p className="font-medium">
                  Processed {summary.frames_processed.toLocaleString()} frames ·{" "}
                  {summary.sessions_written} sessions written
                  {summary.session_write_failures > 0
                    ? ` · ${summary.session_write_failures} failed to save`
                    : ""}
                </p>

                <p className="mt-1 text-xs">
                  Heatmap {summary.heatmap_generated ? "regenerated" : "unchanged"}{" "}
                  · segmentation{" "}
                  {summary.segmentation_ran ? "re-ran" : "did not run"}. Opening
                  the dashboard on the new results…
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {summary ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onComplete(summary)}
                >
                  View analytics
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={stop}>
                  {failure ? "Close" : "Stop watching"}
                </Button>
              )}

              {!failure && !summary && (
                <p className="text-xs text-ink-subtle">
                  Closing stops the preview. Sessions already written are kept.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
