"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Video,
  Camera,
  Play,
  Pause,
  Upload,
  FileVideo,
  Eye,
  Activity,
  Sparkles,
  Radio,
  Sliders,
  Shield,
  Layers,
  Store,
  Grid3X3,
  Cpu,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Flame,
  Route,
  Database,
  Clock,
  Users,
  Download,
} from "lucide-react";
import {
  uploadAndProcessCctvVideo,
  getProcessedVideos,
  getVideoHeatmap,
  getShelfGridHeatmap,
  getVideoStreamUrl,
  inferCctvFrame,
  getStores,
  PersonDetection,
  VideoListItem,
  VideoHeatmapData,
  GridHeatmapData,
} from "@/lib/api";
import { ShelfGridHeatmap } from "@/components/ShelfGridHeatmap";

interface StoreOption {
  id: number;
  name: string;
  location: string;
  cameras: string[];
}

export default function CctvMonitoringPage() {
  const [storesList, setStoresList] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"video" | "webcam" | "grid" | "heatmap" | "history">("video");
  const [selectedCameraId, setSelectedCameraId] = useState<string>("CAM-01");
  const [videoList, setVideoList] = useState<VideoListItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedVideoData, setSelectedVideoData] = useState<VideoListItem | null>(null);
  const [confidence, setConfidence] = useState<number>(0.35);

  // Live Webcam state
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [liveDetections, setLiveDetections] = useState<PersonDetection[]>([]);
  const [liveFps, setLiveFps] = useState<number>(0);

  // Upload & Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Heatmap State
  const [heatmapData, setHeatmapData] = useState<VideoHeatmapData | null>(null);
  const [gridHeatmapData, setGridHeatmapData] = useState<GridHeatmapData | null>(null);
  const [loadingGridHeatmap, setLoadingGridHeatmap] = useState<boolean>(false);
  const [showTrajectories, setShowTrajectories] = useState<boolean>(true);
  const [showHeatDensity, setShowHeatDensity] = useState<boolean>(true);
  const [heatmapIntensity, setHeatmapIntensity] = useState<number>(0.6);

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const webcamElementRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isInferring = useRef<boolean>(false);

  // Load stores dynamically from PostgreSQL
  useEffect(() => {
    async function loadStoresFromDb() {
      try {
        const token = localStorage.getItem("token") || "";
        const fetched = await getStores(token);
        if (Array.isArray(fetched) && fetched.length > 0) {
          const formatted: StoreOption[] = fetched.map((s: any) => ({
            id: s.id,
            name: s.name,
            location: s.location || "Store Location",
            cameras: ["CAM-01", "CAM-02", "CAM-03", "CAM-04"],
          }));
          setStoresList(formatted);
          setSelectedStoreId(formatted[0].id);
        }
      } catch (err) {
        console.warn("Could not load stores from database:", err);
      }
    }
    loadStoresFromDb();
  }, []);

  // Load existing processed videos for selected store
  useEffect(() => {
    async function loadVideos() {
      try {
        const list = await getProcessedVideos(selectedStoreId);
        setVideoList(list);
        if (list.length > 0) {
          setSelectedVideoId(list[0].id);
          setSelectedVideoData(list[0]);
        } else {
          setSelectedVideoId(null);
          setSelectedVideoData(null);
        }
      } catch (err) {
        console.warn("Could not load video list:", err);
      }
    }
    loadVideos();
  }, [selectedStoreId]);

  // Load Heatmap & Grid Heatmap Data when selectedVideoId changes
  useEffect(() => {
    if (!selectedVideoId) {
      setHeatmapData(null);
      setGridHeatmapData(null);
      return;
    }

    async function loadHeatmap() {
      try {
        const data = await getVideoHeatmap(selectedVideoId!);
        setHeatmapData(data);
      } catch (err) {
        console.warn("Heatmap fetch error:", err);
      }
    }

    async function loadGridHeatmap() {
      setLoadingGridHeatmap(true);
      try {
        const gridData = await getShelfGridHeatmap(selectedVideoId!, selectedStoreId, 5, 8);
        setGridHeatmapData(gridData);
      } catch (err) {
        console.warn("Grid heatmap fetch error:", err);
      } finally {
        setLoadingGridHeatmap(false);
      }
    }

    loadHeatmap();
    loadGridHeatmap();
  }, [selectedVideoId, selectedStoreId]);

  // Live Webcam lifecycle
  useEffect(() => {
    if (activeTab === "webcam") {
      let stream: MediaStream | null = null;
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 360, frameRate: { ideal: 30 } } })
        .then((s) => {
          stream = s;
          if (webcamElementRef.current) {
            webcamElementRef.current.srcObject = s;
            webcamElementRef.current.play().catch(() => {});
            setIsWebcamActive(true);
          }
        })
        .catch((err) => {
          console.warn("Webcam access error:", err);
          setIsWebcamActive(false);
        });

      return () => {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        setIsWebcamActive(false);
      };
    }
  }, [activeTab]);

  // Live AI Frame Inference Loop for Webcam
  useEffect(() => {
    if (activeTab !== "webcam" || !isWebcamActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let isMounted = true;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = 640;
    offCanvas.height = 360;
    const offCtx = offCanvas.getContext("2d");

    const loop = async () => {
      if (!isMounted) return;
      const video = webcamElementRef.current;
      if (video && video.readyState >= 2 && !isInferring.current) {
        try {
          isInferring.current = true;
          offCtx?.drawImage(video, 0, 0, 640, 360);
          const b64 = offCanvas.toDataURL("image/jpeg", 0.7);

          const result = await inferCctvFrame(b64, selectedCameraId, confidence);
          if (isMounted) {
            setLiveDetections(result.detections || []);
            setLiveFps(result.fps || 0);
          }
        } catch (err) {
          // resilient loop
        } finally {
          isInferring.current = false;
        }
      }

      if (isMounted) {
        setTimeout(() => {
          animFrameRef.current = requestAnimationFrame(loop);
        }, 120);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, isWebcamActive, selectedCameraId, confidence]);

  // Draw Real Bounding Boxes for Live Webcam
  useEffect(() => {
    if (activeTab !== "webcam") return;
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (liveDetections.length === 0) return;

    const scaleX = canvas.width / 640;
    const scaleY = canvas.height / 360;

    liveDetections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;
      const sx1 = x1 * scaleX;
      const sy1 = y1 * scaleY;
      const sx2 = x2 * scaleX;
      const sy2 = y2 * scaleY;
      const boxW = sx2 - sx1;
      const boxH = sy2 - sy1;

      const colors = ["#06b6d4", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"];
      const strokeColor = colors[Math.abs(det.id) % colors.length];

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx1, sy1, boxW, boxH);

      const cl = Math.min(12, boxW / 4, boxH / 4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx1, sy1 + cl); ctx.lineTo(sx1, sy1); ctx.lineTo(sx1 + cl, sy1);
      ctx.moveTo(sx2 - cl, sy1); ctx.lineTo(sx2, sy1); ctx.lineTo(sx2, sy1 + cl);
      ctx.moveTo(sx1, sy2 - cl); ctx.lineTo(sx1, sy2); ctx.lineTo(sx1 + cl, sy2);
      ctx.moveTo(sx2 - cl, sy2); ctx.lineTo(sx2, sy2); ctx.lineTo(sx2, sy2 - cl);
      ctx.stroke();

      const label = `PERSON #${det.id} [${Math.round(det.confidence * 100)}%]`;
      ctx.font = "bold 10px monospace";
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(sx1, Math.max(0, sy1 - 18), textWidth + 10, 18);
      ctx.fillStyle = "#000000";
      ctx.fillText(label, sx1 + 5, Math.max(12, sy1 - 5));

      if (det.gaze_detected && det.direction) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(sx1, sy2 + 4, 110, 16);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "9px monospace";
        ctx.fillText(`GAZE: ${det.direction} (${det.yaw ?? 0}°)`, sx1 + 4, sy2 + 16);
      }
    });
  }, [activeTab, liveDetections]);

  // Handle Video Upload & Real YOLO Pipeline
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadError(null);
    setUploadProgress(`Processing video for Store #${selectedStoreId} (${selectedCameraId})...`);

    try {
      const res = await uploadAndProcessCctvVideo(file, confidence, selectedCameraId, selectedStoreId);
      const videoResult = res.data;

      const updatedList = await getProcessedVideos(selectedStoreId);
      setVideoList(updatedList);

      if (videoResult?.video_id) {
        setSelectedVideoId(videoResult.video_id);
        const matching = updatedList.find((v) => v.id === videoResult.video_id);
        if (matching) setSelectedVideoData(matching);

        const heat = await getVideoHeatmap(videoResult.video_id);
        setHeatmapData(heat);
      }

      setActiveTab("video");
      setUploadProgress("");
    } catch (err: any) {
      console.error("Pipeline Error:", err);
      setUploadError(err.message || "Failed to process video with YOLO pipeline.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Draw Real Heatmap from Database Points
  useEffect(() => {
    if (activeTab !== "heatmap" || !heatmapData) return;

    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(1, "#03060b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const scaleX = canvas.width / (heatmapData.width || 1280);
    const scaleY = canvas.height / (heatmapData.height || 720);

    if (showHeatDensity && heatmapData.points.length > 0) {
      heatmapData.points.forEach((pt) => {
        const cx = pt.x * scaleX;
        const cy = pt.y * scaleY;
        const radius = 35 * heatmapIntensity;

        const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
        radGrad.addColorStop(0, "rgba(239, 68, 68, 0.25)");
        radGrad.addColorStop(0.4, "rgba(245, 158, 11, 0.18)");
        radGrad.addColorStop(0.7, "rgba(6, 182, 212, 0.1)");
        radGrad.addColorStop(1, "rgba(6, 182, 212, 0)");

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (showTrajectories && heatmapData.trajectories.length > 0) {
      const colors = ["#06b6d4", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

      heatmapData.trajectories.forEach((traj) => {
        if (traj.points.length < 2) return;

        const color = colors[traj.track_id % colors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        traj.points.forEach(([px, py], pIdx) => {
          const sx = px * scaleX;
          const sy = py * scaleY;
          if (pIdx === 0) {
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        });
        ctx.stroke();

        const [startX, startY] = traj.points[0];
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(startX * scaleX, startY * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();

        const [endX, endY] = traj.points[traj.points.length - 1];
        const lastSx = endX * scaleX;
        const lastSy = endY * scaleY;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lastSx, lastSy, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(lastSx + 8, lastSy - 10, 72, 18);
        ctx.strokeStyle = color;
        ctx.strokeRect(lastSx + 8, lastSy - 10, 72, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`ID #${traj.track_id}`, lastSx + 12, lastSy + 2);
      });
    }
  }, [activeTab, heatmapData, showTrajectories, showHeatDensity, heatmapIntensity]);

  const currentStore = storesList.find((s) => s.id === selectedStoreId) || storesList[0] || {
    id: selectedStoreId,
    name: `Store #${selectedStoreId}`,
    location: "Retail Store",
    cameras: ["CAM-01", "CAM-02", "CAM-03", "CAM-04"],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/avi,video/quicktime"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Store Webcam &amp; YOLO Multi-Object Tracking Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
            CCTV Video Analytics &amp; Store Webcams
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real YOLOv8 detection, ByteTrack session tracking, and spatial heatmaps across all connected store webcams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? "Processing Video..." : `Upload to ${selectedCameraId}`}</span>
          </button>
        </div>
      </div>

      {/* Store & Camera Selector Bar */}
      <div className="p-3.5 rounded-2xl glass-panel-glow border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        {/* Store Dropdown Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-cyan-400" />
            <label htmlFor="store-select" className="text-xs font-bold text-white">
              Select Active Store:
            </label>
          </div>

          <div className="relative">
            <select
              id="store-select"
              value={selectedStoreId}
              onChange={(e) => {
                const newId = parseInt(e.target.value, 10);
                setSelectedStoreId(newId);
                const found = storesList.find((s) => s.id === newId);
                if (found?.cameras?.[0]) {
                  setSelectedCameraId(found.cameras[0]);
                }
              }}
              className="bg-black/70 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-bold rounded-xl px-4 py-2 font-sans focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-md cursor-pointer min-w-[220px] transition-all"
            >
              {storesList.length === 0 ? (
                <option value={1} className="bg-slate-900 text-slate-400">
                  Loading stores...
                </option>
              ) : (
                storesList.map((st) => (
                  <option key={st.id} value={st.id} className="bg-slate-900 text-white font-sans py-1">
                    {st.name} {st.location ? `(${st.location})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Camera Selector for this Store */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Active Camera:</span>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="bg-black/70 border border-white/10 text-cyan-300 text-xs font-mono font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
          >
            {currentStore.cameras.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-white font-mono">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isProcessing && (
        <div className="p-4 rounded-2xl glass-panel-glow border border-cyan-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              {uploadProgress}
            </span>
            <span className="font-mono text-cyan-400">YOLOv8n + ByteTrack</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 w-full animate-pulse" />
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "video"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>AI Processed Video</span>
        </button>

        <button
          onClick={() => setActiveTab("webcam")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "webcam"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>Live Store Webcam Stream</span>
        </button>

        <button
          onClick={() => setActiveTab("grid")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "grid"
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Grid3X3 className="w-4 h-4 text-amber-400" />
          <span>5×8 Shelf Attention Grid</span>
        </button>

        <button
          onClick={() => setActiveTab("heatmap")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "heatmap"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Movement Trajectory Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Registry ({videoList.length})</span>
        </button>
      </div>

      {/* TAB 1: AI PROCESSED VIDEO */}
      {activeTab === "video" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="relative rounded-3xl glass-panel-glow border border-cyan-500/20 overflow-hidden shadow-2xl bg-black">
                <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {currentStore.name} ({selectedCameraId})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                    <span>{selectedVideoData?.fps || 30} FPS</span>
                    <span>•</span>
                    <span>{selectedVideoData?.resolution || "1280x720"}</span>
                  </div>
                </div>

                {selectedVideoId ? (
                  <video
                    ref={videoPlayerRef}
                    key={selectedVideoId}
                    src={getVideoStreamUrl(selectedVideoId)}
                    controls
                    autoPlay
                    loop
                    className="w-full aspect-[16/9] object-contain bg-black"
                  />
                ) : (
                  <div className="w-full aspect-[16/9] flex flex-col items-center justify-center p-8 text-center bg-black/80 text-slate-500">
                    <FileVideo className="w-16 h-16 mb-3 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">
                      No Processed Video For This Store Yet
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold"
                      >
                        Upload Video to {selectedCameraId}
                      </button>
                      <button
                        onClick={() => setActiveTab("webcam")}
                        className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold"
                      >
                        Switch to Live Webcam
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Unique Persons Tracked
                    </span>
                    <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
                      {selectedVideoData?.unique_tracks_count || 0} Tracks
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Total Analyzed Frames
                    </span>
                    <span className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5 block">
                      {selectedVideoData?.total_frames?.toLocaleString() || 0} Frames
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Video Duration
                    </span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
                      {selectedVideoData?.duration_seconds || 0}s
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Video List for This Store */}
            <div className="space-y-4">
              <div className="rounded-3xl glass-card p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Store Footage ({videoList.length})</span>
                  </h3>
                </div>

                {videoList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No videos processed yet for {currentStore.name}.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {videoList.map((v) => {
                      const isSelected = selectedVideoId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVideoId(v.id);
                            setSelectedVideoData(v);
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-cyan-500/20 via-purple-500/15 to-transparent border-cyan-500/50 shadow-md"
                              : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white truncate max-w-[140px]">
                              {v.video_name}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {v.duration_seconds}s
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{v.unique_tracks_count} Unique Persons</span>
                            <span className="font-mono text-cyan-300">{v.camera_id}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE STORE WEBCAM */}
      {activeTab === "webcam" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="relative rounded-3xl glass-panel-glow border border-cyan-500/30 overflow-hidden shadow-2xl bg-black">
                <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/40">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      LIVE: {currentStore.name} - {selectedCameraId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                    <span>{liveFps || 30} FPS</span>
                    <span>•</span>
                    <span>{liveDetections.length} Persons In Frame</span>
                  </div>
                </div>

                <div className="relative w-full aspect-[16/9] bg-black flex items-center justify-center">
                  <video
                    ref={webcamElementRef}
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={liveCanvasRef}
                    width={640}
                    height={360}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl glass-card p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time Telemetry</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {liveDetections.length} Active
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between">
                    <span className="text-slate-400">Store</span>
                    <span className="font-semibold text-white truncate max-w-[130px]">{currentStore.name}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between">
                    <span className="text-slate-400">Webcam Channel</span>
                    <span className="font-mono font-bold text-cyan-300">{selectedCameraId}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between">
                    <span className="text-slate-400">YOLO Model</span>
                    <span className="font-mono text-emerald-400">YOLOv8n ByteTrack</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
                    Tracked Persons in Frame
                  </span>
                  {liveDetections.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center text-slate-500 text-[11px]">
                      No persons currently in webcam view
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {liveDetections.map((det) => (
                        <div
                          key={det.id}
                          className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-[11px] font-mono"
                        >
                          <span className="text-cyan-300 font-bold">#PERSON-{det.id}</span>
                          <span className="text-emerald-400">{Math.round(det.confidence * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: 5x8 SHELF ATTENTION GRID MATRIX */}
      {activeTab === "grid" && (
        <div className="space-y-6">
          <ShelfGridHeatmap
            data={gridHeatmapData}
            loading={loadingGridHeatmap}
          />
        </div>
      )}

      {/* TAB 3: HEATMAP */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="relative rounded-3xl glass-panel-glow border border-purple-500/20 overflow-hidden shadow-2xl bg-black">
                <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      PostgreSQL Spatial Density Heatmap - {currentStore.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                    <span>{heatmapData?.total_points || 0} Points</span>
                    <span>•</span>
                    <span className="text-purple-300">{heatmapData?.unique_tracks || 0} Tracks</span>
                  </div>
                </div>

                <div className="relative w-full aspect-[16/9]">
                  <canvas
                    ref={heatmapCanvasRef}
                    width={960}
                    height={540}
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              </div>

              <div className="rounded-2xl glass-card p-5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowHeatDensity(!showHeatDensity)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                      showHeatDensity
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-white/[0.03] text-slate-400 border-white/10"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Occupancy Density</span>
                  </button>

                  <button
                    onClick={() => setShowTrajectories(!showTrajectories)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                      showTrajectories
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/[0.03] text-slate-400 border-white/10"
                    }`}
                  >
                    <Route className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Trajectory Lines</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Heat Radius:</span>
                  <input
                    type="range"
                    min="0.3"
                    max="1.2"
                    step="0.1"
                    value={heatmapIntensity}
                    onChange={(e) => setHeatmapIntensity(parseFloat(e.target.value))}
                    className="w-28 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-amber-300">{heatmapIntensity.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl glass-card p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Route className="w-4 h-4 text-cyan-400" />
                    <span>Tracked Shoppers</span>
                  </h3>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {heatmapData?.trajectories?.length || 0} Persons
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {heatmapData?.trajectories?.map((t) => (
                    <div
                      key={t.track_id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-white">#TRACK-{t.track_id}</span>
                      <span className="text-emerald-400 font-bold">{t.dwell_seconds}s Dwell</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE AUDIT */}
      {activeTab === "history" && (
        <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL Video Registry for {currentStore.name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic YOLOv8 tracked CCTV footage stored in PostgreSQL with exact telemetry metrics.
              </p>
            </div>

            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20">
              {videoList.length} Recorded Videos
            </span>
          </div>

          {videoList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No CCTV videos recorded in PostgreSQL for {currentStore.name} yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono">
                    <th className="pb-3 pr-4 uppercase">Video ID</th>
                    <th className="pb-3 pr-4 uppercase">Store</th>
                    <th className="pb-3 pr-4 uppercase">Camera</th>
                    <th className="pb-3 pr-4 uppercase">Resolution</th>
                    <th className="pb-3 pr-4 uppercase">Duration</th>
                    <th className="pb-3 pr-4 uppercase">Unique Persons</th>
                    <th className="pb-3 pr-4 uppercase">Date</th>
                    <th className="pb-3 pr-4 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                  {videoList.map((v) => {
                    const storeDisplayName =
                      v.store_name ||
                      storesList.find((s) => s.id === v.store_id)?.name ||
                      currentStore.name;

                    return (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 pr-4 text-cyan-400 font-bold">#{v.id}</td>
                        <td className="py-3.5 pr-4 text-purple-300 font-semibold">
                          {storeDisplayName}
                        </td>
                        <td className="py-3.5 pr-4 text-white font-bold">{v.camera_id}</td>
                        <td className="py-3.5 pr-4 text-slate-400">{v.resolution}</td>
                        <td className="py-3.5 pr-4 text-emerald-400 font-bold">
                          {v.duration_seconds}s
                        </td>
                        <td className="py-3.5 pr-4 text-cyan-300 font-bold">
                          {v.unique_tracks_count} Tracks
                        </td>
                        <td className="py-3.5 pr-4 text-slate-500">{v.created_at}</td>
                        <td className="py-3.5 pr-4">
                          <button
                            onClick={() => {
                              setSelectedVideoId(v.id);
                              setSelectedVideoData(v);
                              setActiveTab("video");
                            }}
                            className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all text-[11px] cursor-pointer"
                          >
                            Play Video
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
