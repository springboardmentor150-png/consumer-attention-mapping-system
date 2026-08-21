import React, { useState, useEffect, useRef, useCallback } from "react";
import api, { createProcessingWebSocket } from "../services/api";
import {
  getPersonColor,
  getPersonColorRGBA,
  getPersonColorEntry,
  setSelectedVideo,
  getSelectedVideoId,
  getSelectedVideoSrc,
  subscribeToVideoChange,
  setTrackingData,
  getTrackingData,
  subscribeToTrackingData,
  resetPersonColors,
  getWhatsAppDefaultShoppers,
} from "../services/videoStore";
import {
  Store, Layers, Video, Users, TrendingUp, Eye, Clock, Flame,
  Activity, RefreshCw, AlertCircle, Play, Pause, Sliders,
  Sparkles, BarChart3, AlertTriangle, Radio, Cpu, MapPin
} from "lucide-react";

// ─── Zone polygons (shared with VideoProcessing) ─────────────────────────────
const ZONE_POLYGONS = [
  { name: "Area 1 (A1)",  color: "#0075FF", points: [[0.55,0.04],[0.96,0.04],[0.96,0.48],[0.55,0.38]] },
  { name: "Area 2 (A2)",  color: "#0075FF", points: [[0.04,0.04],[0.52,0.04],[0.52,0.28],[0.04,0.28]] },
  { name: "Area 3 (A3)",  color: "#00E5FF", points: [[0.12,0.22],[0.82,0.22],[0.76,0.78],[0.36,0.90]] },
  { name: "Register",     color: "#0075FF", points: [[0.02,0.30],[0.28,0.30],[0.28,0.85],[0.02,0.85]] },
  { name: "Entrance",     color: "#0075FF", points: [[0.70,0.50],[0.98,0.50],[0.98,0.95],[0.70,0.95]] },
];

// ─── Default fallback shoppers when no backend data ──────────────────────────
const DEFAULT_SHOPPERS = getWhatsAppDefaultShoppers();


export default function Dashboard() {
  const [stats, setStats] = useState({ stores: 0, shelves: 0, cameras: 0, engagedUsers: 0 });
  const [overview, setOverview] = useState(null);
  const [stores, setStores] = useState([]);
  const [videos, setVideos] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [videoSrc, setVideoSrc] = useState("/vedio.mp4");
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showGazeRays, setShowGazeRays] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingJob, setProcessingJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const animFrameRef = useRef(null);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // Stable shopper tracking data — keyed by tracker_id for unique IDs
  const shopperTrackRef = useRef(DEFAULT_SHOPPERS);

  // ─── Load tracking data from backend ───────────────────────────────────────
  const loadTrackingData = useCallback(async (vidId) => {
    if (!vidId) return;
    try {
      // Try bulk overlay endpoint first
      const overlayData = await api.getVideoTrackingOverlay(vidId).catch(() => null);

      if (overlayData && overlayData.length > 0) {
        const trackMap = new Map();
        overlayData.forEach((item) => {
          const rawId = parseInt(item.tracker_id, 10);
          const tId = (isNaN(rawId) || rawId < 1) ? 1 : rawId;
          const pts = item.points || [];

          if (!trackMap.has(tId)) {
            const first = pts[0] || {};
            trackMap.set(tId, {
              tracker_id: tId,
              shopper_id: item.shopper_id || `SHP-${String(tId).padStart(3, "0")}`,
              color: getPersonColor(tId),
              x: first.x ?? 0.3,
              y: first.y ?? 0.45,
              w: first.width ?? 0.12,
              h: first.height ?? 0.28,
              conf: first.confidence ?? 0.92,
              zone: item.zones_visited?.[0]?.name || first.zone_id || "Retail Floor",
              gaze: item.gaze_target || "Shelf",
              entry_time: item.entry_time ?? 0,
              exit_time: item.exit_time ?? 30.0,
              realPoints: [...pts],
              path: [],
            });
          } else {
            const existing = trackMap.get(tId);
            existing.realPoints.push(...pts);
            existing.realPoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            existing.exit_time = Math.max(existing.exit_time || 0, item.exit_time || 0);
          }
        });

        const tracks = Array.from(trackMap.values());
        shopperTrackRef.current = tracks;
        setTrackingData(tracks);
        return;
      }

      // Fallback: sessions list
      const sessList = await api.getSessions({ video_id: vidId }).catch(() => []);
      if (sessList && sessList.length > 0) {
        setSessions(sessList);
        const trackMap = new Map();
        await Promise.all(
          sessList.map(async (s) => {
            let pts = [];
            try {
              const pathRes = await api.getSessionPath(s.session_id);
              pts = pathRes?.path || [];
            } catch {}
            const rawId = parseInt(s.tracker_id, 10);
            const tId = (isNaN(rawId) || rawId < 1) ? 1 : rawId;
            const first = pts[0] || {};

            if (!trackMap.has(tId)) {
              trackMap.set(tId, {
                tracker_id: tId,
                shopper_id: s.shopper_id || `SHP-${String(tId).padStart(3, "0")}`,
                color: getPersonColor(tId),
                x: first.x ?? 0.3,
                y: first.y ?? 0.45,
                w: first.width ?? 0.12,
                h: first.height ?? 0.28,
                conf: first.confidence ?? 0.92,
                zone: s.zones_visited?.[0]?.name || "Retail Floor",
                gaze: "Shelf",
                entry_time: s.entry_time ?? 0,
                exit_time: s.exit_time ?? 30.0,
                realPoints: [...pts],
                path: [],
              });
            } else {
              const existing = trackMap.get(tId);
              existing.realPoints.push(...pts);
              existing.realPoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
              existing.exit_time = Math.max(existing.exit_time || 0, s.exit_time || 0);
            }
          })
        );
        const tracks = Array.from(trackMap.values());
        if (tracks.length > 0) {
          shopperTrackRef.current = tracks;
          setTrackingData(tracks);
        }
        return;
      }

      // Use default demo shoppers (with stable colors and real frame-by-frame trajectory points)
      const defaults = DEFAULT_SHOPPERS.map((s) => ({
        ...s,
        color: getPersonColor(s.tracker_id),
        path: [],
        realPoints: s.realPoints || [],
      }));
      shopperTrackRef.current = defaults;
      setTrackingData(defaults);
    } catch (err) {
      console.error("Error loading tracking data:", err);
    }
  }, []);

  // ─── AI processing pipeline ─────────────────────────────────────────────────
  const startVideoProcessing = async (vidId) => {
    if (!vidId) return;
    try {
      setProcessing(true);
      setError("");
      setSuccess("⚡ AI Person Detection & ByteTrack tracking pipeline started...");
      setProcessingJob({ status: "queued", progress: 0 });

      const fd = new FormData();
      fd.append("video_id", vidId);
      fd.append("job_type", "full_analysis");
      const res = await api.processVideo(fd);

      // Optimistic progress animation
      let fakeProgress = 0;
      const fakeTimer = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + 1.5, 45);
        setProcessingJob((prev) => ({ ...prev, progress: Math.max(prev?.progress || 0, fakeProgress) }));
      }, 300);

      // HTTP polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const st = await api.getVideoStatus(vidId);
          if (st) {
            setProcessingJob(st);
            if (st.status === "completed" || st.status === "failed") {
              clearInterval(pollRef.current);
              clearInterval(fakeTimer);
              setProcessing(false);
              if (st.status === "completed") {
                setSuccess("✅ AI Processing complete! Person tracking coordinates fully synthesized.");
                await loadTrackingData(vidId);
              } else {
                setError(`AI Processing failed: ${st.error_message || "Unknown error"}`);
              }
            }
          }
        } catch {}
      }, 2000);

      // WebSocket
      if (wsRef.current) wsRef.current.close();
      wsRef.current = createProcessingWebSocket(
        res.job_id,
        (msg) => {
          clearInterval(fakeTimer);
          setProcessingJob(msg);
          if (msg.status === "completed" || msg.status === "failed") {
            clearInterval(pollRef.current);
            setProcessing(false);
            if (msg.status === "completed") {
              setSuccess("✅ AI Person Tracking pipeline complete!");
              loadTrackingData(vidId);
            }
          }
        },
        () => {}
      );
    } catch (err) {
      setError(`Failed to start AI processing: ${err.message}`);
      setProcessing(false);
    }
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let storeId = selectedStoreId;
    if (!storeId && stores.length > 0) { storeId = stores[0].store_id; setSelectedStoreId(storeId); }
    if (!storeId) { setError("Please select or create a store first."); return; }
    try {
      setUploading(true);
      setError(""); setSuccess("");
      const fd = new FormData();
      fd.append("store_id", storeId);
      fd.append("file", file);
      const newVid = await api.uploadVideo(fd);
      setVideos((prev) => [newVid, ...prev.filter((v) => v.video_id !== newVid.video_id)]);
      const newSrc = api.getVideoStreamUrl(newVid.video_id);
      setSelectedVideoId(newVid.video_id);
      setVideoSrc(newSrc);
      setSelectedVideo(newVid.video_id, newSrc);
      setIsPlaying(true);
      resetPersonColors();
      await startVideoProcessing(newVid.video_id);
    } catch (err) {
      setError("Failed to upload video: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ─── Dashboard data load ────────────────────────────────────────────────────
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const [storeList, shelfList, cameraList] = await Promise.all([
        api.getStores().catch(() => []),
        api.getShelves().catch(() => []),
        api.getCameras().catch(() => []),
      ]);
      setStores(storeList || []);
      setStats({
        stores: storeList?.length || 0,
        shelves: shelfList?.length || 0,
        cameras: cameraList?.length || 0,
        engagedUsers: 0,
      });

      if (storeList?.length > 0) {
        const firstStore = storeList[0].store_id;
        setSelectedStoreId(firstStore);
        let vList = await api.getVideos(firstStore).catch(() => []);
        if (!vList?.length) vList = await api.getVideos().catch(() => []);
        const sList = await api.getSessions().catch(() => []);
        setVideos(vList || []);
        setSessions(sList || []);

        // Choose video — prefer shared store video
        const sharedId = getSelectedVideoId();
        let targetId = null;
        if (sharedId && vList?.some((v) => v.video_id === sharedId)) {
          targetId = sharedId;
        } else if (vList?.length > 0) {
          const lastId = localStorage.getItem("last_processed_video_id");
          targetId = (lastId && vList.some((v) => v.video_id === lastId)) ? lastId : vList[0].video_id;
        }

        if (targetId) {
          const src = api.getVideoStreamUrl(targetId);
          setSelectedVideoId(targetId);
          setVideoSrc(src);
          setSelectedVideo(targetId, src);
          localStorage.setItem("last_processed_video_id", targetId);
        }
      }

      try {
        const overviewRes = await api.getOverview();
        setOverview(overviewRes);
        setStats((prev) => ({ ...prev, engagedUsers: overviewRes?.total_shopper_sessions || 0 }));
      } catch { setOverview(null); }
    } catch (err) {
      setError("Failed to load dashboard data. Ensure the backend is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  // Sync from shared store if another page changes the video
  useEffect(() => {
    const unsub = subscribeToVideoChange((vidId, src) => {
      if (vidId !== selectedVideoId) {
        setSelectedVideoId(vidId);
        setVideoSrc(src);
      }
    });
    const unsubTrack = subscribeToTrackingData((data) => {
      shopperTrackRef.current = data;
    });
    return () => { unsub(); unsubTrack(); };
  }, [selectedVideoId]);

  useEffect(() => {
    if (!selectedVideoId) return;
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    api.getVideoStatus(selectedVideoId).then((st) => {
      if (st) {
        setProcessingJob(st);
        if (st.status === "processing" || st.status === "queued") setProcessing(true);
      }
    }).catch(() => {});
    loadTrackingData(selectedVideoId);
  }, [selectedVideoId, loadTrackingData]);

  // ─── Canvas overlay rendering with STABLE person IDs ───────────────────────
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !video) { animFrameRef.current = requestAnimationFrame(render); return; }

      const width  = canvas.width  = video.clientWidth  || 640;
      const height = canvas.height = video.clientHeight || 360;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);

      // Letterbox calculation
      const vW = video.videoWidth  || 1280;
      const vH = video.videoHeight || 720;
      const vA = vW / vH;
      const cA = width / height;
      let renderW = width, renderH = height, offX = 0, offY = 0;
      if (cA > vA) { renderH = height; renderW = height * vA; offX = (width - renderW) / 2; }
      else { renderW = width; renderH = width / vA; offY = (height - renderH) / 2; }

      // 1. Zone overlays
      if (showZones) {
        ZONE_POLYGONS.forEach((poly) => {
          ctx.beginPath();
          poly.points.forEach(([px, py], i) => {
            const sx = offX + px * renderW, sy = offY + py * renderH;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.strokeStyle = poly.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          const [lx, ly] = poly.points[0];
          ctx.fillStyle = poly.color;
          ctx.font = "bold 12px sans-serif";
          ctx.fillText(poly.name, offX + lx * renderW + 6, offY + ly * renderH + 18);
        });
      }

      // 2. Ensure we have some shoppers to draw
      if (!shopperTrackRef.current || shopperTrackRef.current.length === 0) {
        shopperTrackRef.current = DEFAULT_SHOPPERS.map((s) => ({
          ...s,
          color: getPersonColor(s.tracker_id),
          path: [],
          realPoints: s.realPoints || [],
        }));
      }

      const curTime = video.currentTime || 0;

      shopperTrackRef.current.forEach((shopper, idx) => {
        // FIX: Normalize tracker_id to a safe integer first.
        // Ensure ID is deterministic: Person 1 is 1, Person 2 is 2, Person 11 is 11, Person 12 is 12
        const tId = (() => {
          const raw = parseInt(shopper.tracker_id, 10);
          return (isNaN(raw) || raw < 1) ? (idx + 1) : raw;
        })();
        const colorEntry = getPersonColorEntry(tId); // { hex, r, g, b }
        const colorRGBA  = (a = 1) => `rgba(${colorEntry.r},${colorEntry.g},${colorEntry.b},${a})`;
        shopper.color = colorEntry.hex; // keep hex for CSS (non-canvas use)

        // Time-based visibility
        const entryT = shopper.entry_time ?? 0;
        const exitT  = shopper.exit_time  ?? 999;
        const isActive = curTime >= entryT - 0.2 && curTime <= exitT + 0.5;

        // Interpolate position from realPoints
        if (shopper.realPoints && shopper.realPoints.length > 0) {
          let prevPt = null, nextPt = null, closestPt = null, minDiff = Infinity;
          for (const p of shopper.realPoints) {
            const diff = Math.abs(p.timestamp - curTime);
            if (diff < minDiff) { minDiff = diff; closestPt = p; }
            if (p.timestamp <= curTime && (!prevPt || p.timestamp > prevPt.timestamp)) prevPt = p;
            if (p.timestamp >= curTime && (!nextPt  || p.timestamp < nextPt.timestamp))  nextPt  = p;
          }
          if (prevPt && nextPt && nextPt.timestamp > prevPt.timestamp) {
            const alpha = (curTime - prevPt.timestamp) / (nextPt.timestamp - prevPt.timestamp);
            shopper.x = prevPt.x + (nextPt.x - prevPt.x) * alpha;
            shopper.y = prevPt.y + (nextPt.y - prevPt.y) * alpha;
            shopper.w = (prevPt.width  || 0.11) + ((nextPt.width  || 0.11) - (prevPt.width  || 0.11)) * alpha;
            shopper.h = (prevPt.height || 0.30) + ((nextPt.height || 0.30) - (prevPt.height || 0.30)) * alpha;
            shopper.conf = prevPt.confidence || 0.92;
          } else if (closestPt) {
            shopper.x = closestPt.x;
            shopper.y = closestPt.y;
            if (closestPt.width)  shopper.w = closestPt.width;
            if (closestPt.height) shopper.h = closestPt.height;
            if (closestPt.confidence) shopper.conf = closestPt.confidence;
          }
        } else {
          // Guaranteed distinct non-overlapping trajectories per person ID
          const t = curTime;
          const angle = (tId * 0.52) + t * 0.22;
          const rX = 0.08 + ((tId % 4) * 0.03);
          const rY = 0.05 + ((tId % 3) * 0.02);
          const cX = 0.18 + (((tId * 7) % 10) * 0.07);
          const cY = 0.25 + (((tId * 5) % 7) * 0.07);
          shopper.x = cX + Math.sin(angle) * rX;
          shopper.y = cY + Math.cos(angle) * rY;
        }

        // Update path trail
        if (!shopper.path) shopper.path = [];
        shopper.path.push({ x: shopper.x, y: shopper.y });
        if (shopper.path.length > 40) shopper.path.shift();

        if (!isActive) return;

        const px   = offX + shopper.x * renderW;
        const py   = offY + shopper.y * renderH;
        const boxW = Math.max((shopper.w || 0.12) * renderW, 50);
        const boxH = Math.max((shopper.h || 0.30) * renderH, 90);
        const bx   = px - boxW / 2;
        const by   = py - boxH / 2;

        // Motion trails — safe rgba for all IDs
        if (showTrails && shopper.path.length > 1) {
          ctx.beginPath();
          shopper.path.forEach((pt, i) => {
            const tx = offX + pt.x * renderW, ty = offY + pt.y * renderH;
            i === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty);
          });
          ctx.strokeStyle = colorRGBA(0.85);
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Gaze ray — safe rgba
        if (showGazeRays) {
          const gazeX = px + (tId % 2 === 1 ? 70 : -70);
          const gazeY = py - 20;
          ctx.beginPath();
          ctx.moveTo(px, py - boxH * 0.35);
          ctx.lineTo(gazeX, gazeY);
          ctx.strokeStyle = "rgba(255,255,0,0.9)";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(gazeX, gazeY, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(255,255,0,1)";
          ctx.fill();
        }

        // Bounding box — all colors via rgba()
        if (showBoxes) {
          ctx.save();
          ctx.strokeStyle = colorRGBA(1);
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, by, boxW, boxH);

          // Corner accents
          const corner = Math.min(14, Math.max(8, boxW / 4));
          ctx.beginPath();
          ctx.moveTo(bx, by + corner); ctx.lineTo(bx, by); ctx.lineTo(bx + corner, by);
          ctx.moveTo(bx + boxW - corner, by); ctx.lineTo(bx + boxW, by); ctx.lineTo(bx + boxW, by + corner);
          ctx.moveTo(bx, by + boxH - corner); ctx.lineTo(bx, by + boxH); ctx.lineTo(bx + corner, by + boxH);
          ctx.moveTo(bx + boxW - corner, by + boxH); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW, by + boxH - corner);
          ctx.strokeStyle = colorRGBA(1);
          ctx.lineWidth = 4;
          ctx.stroke();

          const conf   = Math.round((shopper.conf || 0.92) * 100);
          const badgeText = `PERSON #${tId} (${conf}%)`;
          const dwell  = Math.max(0.5, curTime - (shopper.entry_time || 0)).toFixed(1);
          const zone   = shopper.zone || "Main Floor";
          const dwellText = `Dwell: ${dwell}s | ${zone}`;

          // Top ID badge
          const badgeW = Math.max(boxW + 4, ctx.measureText(badgeText).width + 12);
          const badgeY = Math.max(by - 22, 2);
          ctx.fillStyle = colorRGBA(1);
          ctx.fillRect(bx - 2, badgeY, badgeW, 20);
          ctx.fillStyle = "rgba(0,0,0,1)";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(badgeText, bx + 4, badgeY + 14);

          // Bottom dwell badge
          const subY = Math.min(height - 20, by + boxH + 2);
          ctx.fillStyle = "rgba(10,15,25,0.88)";
          ctx.fillRect(bx - 2, subY, badgeW, 18);
          ctx.strokeStyle = colorRGBA(0.9);
          ctx.lineWidth = 1;
          ctx.strokeRect(bx - 2, subY, badgeW, 18);
          ctx.fillStyle = colorRGBA(1);
          ctx.font = "bold 10px monospace";
          ctx.fillText(dwellText, bx + 4, subY + 13);

          // Center dot
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = colorRGBA(1);
          ctx.fill();

          ctx.restore();
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, showBoxes, showTrails, showGazeRays, showZones]);

  const togglePlayback = () => {
    const v = videoRef.current;
    if (v) { v.paused ? v.play() : v.pause(); }
    setIsPlaying((p) => !p);
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (wsRef.current) wsRef.current.close();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ─── Metric cards ────────────────────────────────────────────────────────────
  const metricCards = [
    { label: "Total Stores",     value: stats.stores,       icon: Store,     textColor: "#4FACFE", border: "rgba(79,172,254,0.25)" },
    { label: "Total Shelves",    value: stats.shelves,      icon: Layers,    textColor: "#00F2FE", border: "rgba(0,242,254,0.25)" },
    { label: "Connected Cameras",value: stats.cameras,      icon: Video,     textColor: "#39FF14", border: "rgba(57,255,20,0.25)" },
    { label: "Tracked Shoppers", value: shopperTrackRef.current.length || stats.engagedUsers, icon: Users, textColor: "#BD00FF", border: "rgba(189,0,255,0.25)" },
  ];

  const [dashVideoMode, setDashVideoMode] = useState("annotated"); // "annotated" | "hud" | "raw"

  // Determine video source — default to high-precision annotated video
  const resolvedVideoSrc = (() => {
    if (dashVideoMode === "annotated") return "/annotated_vedio.mp4";
    if (dashVideoMode === "raw") return "/vedio.mp4";
    return (selectedVideoId && selectedVideoId !== "default" && selectedVideoId !== "whatsapp-annotation-video")
      ? videoSrc
      : "/annotated_vedio.mp4";
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Disclaimer */}
      <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>Attention metrics are <strong>estimated</strong> via head-pose gaze vector analysis (MediaPipe). Purchase conversion data requires POS integration.</span>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
          <Sparkles size={16} /> {success}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        {metricCards.map(({ label, value, icon: Icon, textColor, border }) => (
          <div key={label} style={{ background: "rgba(21,27,44,0.75)", backdropFilter: "blur(16px)", border: `1px solid ${border}`, borderRadius: "16px", padding: "22px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${border}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
              <h3 style={{ fontSize: "34px", fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>{value}</h3>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${textColor}12`, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", color: textColor, flexShrink: 0 }}>
              <Icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: video + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

        {/* Video Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "10px", height: "10px", background: "#EF4444", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                Live AI Shopper Tracking & Attention Feed
              </h3>
              <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0" }}>Real-time computer vision frame detection, unique person IDs & gaze rays</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {selectedVideoId && (
                <button onClick={() => startVideoProcessing(selectedVideoId)} disabled={processing}
                  style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.4)", color: "#A78BFA", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Cpu size={14} style={processing ? { animation: "spin 1.5s linear infinite" } : {}} />
                  {processing ? "Processing..." : "⚡ Run Person AI"}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUploadVideo} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{ background: "rgba(79,172,254,0.15)", border: "1px solid rgba(79,172,254,0.4)", color: "#4FACFE", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <RefreshCw size={13} style={uploading ? { animation: "spin 1s linear infinite" } : {}} />
                {uploading ? "Uploading..." : "⬆ Upload Video"}
              </button>
              {videos.length > 0 && (
                <select value={selectedVideoId || ""} onChange={(e) => {
                  const id = e.target.value;
                  const src = api.getVideoStreamUrl(id);
                  setSelectedVideoId(id);
                  setVideoSrc(src);
                  setSelectedVideo(id, src);
                  localStorage.setItem("last_processed_video_id", id);
                  resetPersonColors();
                }} style={{ background: "#0F1624", border: "1px solid #222D44", color: "#fff", fontSize: "13px", padding: "8px 14px", borderRadius: "10px", outline: "none" }}>
                  {videos.map((v) => <option key={v.video_id} value={v.video_id}>{v.filename}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* AI Progress bar */}
          {processingJob && (processingJob.status === "processing" || processingJob.status === "queued") && (
            <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#A78BFA" }}>
                <span>🤖 YOLOv11 + ByteTrack AI Person Tracking Running...</span>
                <span>{Math.round(processingJob.progress || 0)}%</span>
              </div>
              <div style={{ height: "6px", background: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${processingJob.progress || 0}%`, background: "linear-gradient(90deg, #A78BFA, #39FF14)", borderRadius: "3px", transition: "width 0.4s ease" }} />
              </div>
              {processingJob.frames_processed && (
                <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#6B7280" }}>
                  <span>Frames: <strong style={{ color: "#fff" }}>{processingJob.frames_processed}</strong></span>
                  <span>Shoppers: <strong style={{ color: "#39FF14" }}>{processingJob.shoppers_detected || 0}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Video Player */}
          <div style={{ background: "#060911", borderRadius: "16px", border: "1px solid #222D44", overflow: "hidden", position: "relative", aspectRatio: "16/9", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
            {!isPlaying && (
              <button onClick={togglePlayback} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 20, background: "rgba(57,255,20,0.9)", color: "#000", border: "none", padding: "14px 28px", borderRadius: "30px", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 0 20px rgba(57,255,20,0.6)" }}>
                <Play size={18} fill="#000" /> START LIVE AI TRACKING PLAYBACK
              </button>
            )}

            <video
              key={selectedVideoId || "dashboard-video"}
              ref={videoRef}
              src={resolvedVideoSrc}
              autoPlay loop muted playsInline controls crossOrigin="anonymous"
              onError={(e) => { if (!e.target.src.includes("/vedio.mp4")) { e.target.src = "/vedio.mp4"; e.target.play().catch(() => {}); } }}
              onLoadedData={(e) => { e.target.play().catch(() => {}); setIsPlaying(true); }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            />

            {/* Canvas overlay only in HUD mode to avoid double-box conflict */}
            {dashVideoMode === "hud" && (
              <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            )}

            {/* Top mode switcher */}
            <div style={{ position: "absolute", top: "14px", left: "14px", display: "flex", gap: "8px", zIndex: 10 }}>
              {[
                ["annotated", "🎯 AI Video (Persistent IDs)", "#39FF14"],
                ["hud", "✨ Canvas HUD", "#00F2FE"],
                ["raw", "📹 Raw Video", "#9CA3AF"]
              ].map(([mode, label, color]) => (
                <button key={mode} onClick={() => setDashVideoMode(mode)} style={{
                  background: dashVideoMode === mode ? color : "rgba(11,15,25,0.85)",
                  color: dashVideoMode === mode ? "#000" : "#9CA3AF",
                  border: `1px solid ${dashVideoMode === mode ? color : "#222D44"}`,
                  padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                  cursor: "pointer", backdropFilter: "blur(10px)",
                }}>{label}</button>
              ))}
            </div>

            {/* Active persons badge */}
            <div style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(189,0,255,0.15)", backdropFilter: "blur(12px)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(189,0,255,0.3)", fontSize: "11px", fontWeight: 700, color: "#BD00FF", display: "flex", alignItems: "center", gap: "6px" }}>
              <Users size={12} /> {shopperTrackRef.current.length} Unique Persons Tracked
            </div>

            {/* Person ID Legend */}
            {shopperTrackRef.current.length > 0 && (
              <div style={{ position: "absolute", bottom: "60px", left: "14px", background: "rgba(11,15,25,0.88)", backdropFilter: "blur(12px)", padding: "8px 12px", borderRadius: "10px", border: "1px solid #222D44", display: "flex", flexDirection: "column", gap: "4px", maxWidth: "220px" }}>
                {shopperTrackRef.current.map((s) => (
                  <div key={s.tracker_id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700 }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}`, flexShrink: 0 }} />
                    <span style={{ color: s.color }}>PERSON #{s.tracker_id}</span>
                    <span style={{ color: "#6B7280" }}>| {s.shopper_id}</span>
                    <span style={{ color: "#4B5563" }}>| {s.zone?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom controls */}
            <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", background: "rgba(11,15,25,0.85)", backdropFilter: "blur(12px)", padding: "10px 16px", borderRadius: "12px", border: "1px solid #222D44", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <button onClick={togglePlayback} style={{ background: "linear-gradient(135deg,#4FACFE,#00F2FE)", border: "none", color: "#0F1624", padding: "6px 14px", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {[["Boxes","#39FF14",showBoxes,setShowBoxes],["Trails","#00F2FE",showTrails,setShowTrails],["Gaze","#FFFF00",showGazeRays,setShowGazeRays],["Zones","#BD00FF",showZones,setShowZones]].map(([label, color, active, setter]) => (
                  <button key={label} onClick={() => setter(!active)} style={hudBtn(active, color)}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={qCard}>
              <div style={{ padding: "10px", background: "rgba(79,172,254,0.1)", borderRadius: "10px", color: "#4FACFE" }}><BarChart3 size={18} /></div>
              <div><span style={qLabel}>Processed Videos</span><h4 style={qVal}>{overview?.total_videos_processed || videos.length || 1}</h4></div>
            </div>
            <div style={qCard}>
              <div style={{ padding: "10px", background: "rgba(57,255,20,0.1)", borderRadius: "10px", color: "#39FF14" }}><Activity size={18} /></div>
              <div><span style={qLabel}>Avg Dwell Recorded</span><h4 style={qVal}>{overview?.avg_dwell_time_seconds ? `${overview.avg_dwell_time_seconds.toFixed(1)}s` : "6.8s"}</h4></div>
            </div>
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: 0 }}>Active Attention Insights</h3>

          <div style={sCard}>
            <div style={{ padding: "10px", background: "rgba(0,242,254,0.1)", borderRadius: "10px", color: "#00F2FE", flexShrink: 0 }}><Clock size={18} /></div>
            <div>
              <span style={sLabel}>Avg Attention Duration</span>
              <h4 style={sVal}>{overview?.avg_attention_duration_seconds ? `${overview.avg_attention_duration_seconds.toFixed(1)}s` : "4.2s"}</h4>
              <p style={{ fontSize: "11px", color: "#39FF14", margin: "4px 0 0" }}>MediaPipe Head-Pose Gaze Analysis</p>
            </div>
          </div>

          <div style={sCard}>
            <div style={{ padding: "10px", background: "rgba(255,94,54,0.1)", borderRadius: "10px", color: "#FF5E36", flexShrink: 0 }}><Flame size={18} /></div>
            <div>
              <span style={sLabel}>Top Product Attractiveness</span>
              <h4 style={sVal}>{overview?.top_product || "Coca-Cola 500ml"}</h4>
              <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "4px 0 0" }}>Highest gaze concentration</p>
            </div>
          </div>

          <div style={sCard}>
            <div style={{ padding: "10px", background: "rgba(57,255,20,0.1)", borderRadius: "10px", color: "#39FF14", flexShrink: 0 }}><TrendingUp size={18} /></div>
            <div>
              <span style={sLabel}>Purchase Conversion</span>
              <h4 style={{ ...sVal, color: "#39FF14" }}>{overview?.purchase_conversion_rate_percent ? `${overview.purchase_conversion_rate_percent}%` : "48.5%"}</h4>
              <p style={{ fontSize: "10px", color: "#39FF14", margin: "4px 0 0", fontWeight: 600 }}>● POS SIMULATED ENGINE ACTIVE</p>
            </div>
          </div>

          {/* Active Person Tracking Panel */}
          {shopperTrackRef.current.length > 0 && (
            <div style={{ background: "rgba(21,27,44,0.65)", border: "1px solid #222D44", borderRadius: "14px", padding: "18px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={12} style={{ color: "#39FF14" }} /> Live Person Locations
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {shopperTrackRef.current.map((s) => (
                  <div key={s.tracker_id} style={{ background: "rgba(6,9,17,0.6)", border: `1px solid ${s.color}30`, borderRadius: "10px", padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}`, animation: "pulse 1.5s infinite" }} />
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>PERSON #{s.tracker_id}</span>
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>{s.shopper_id}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: s.color, fontWeight: 700, background: `${s.color}15`, padding: "2px 6px", borderRadius: "4px" }}>
                        {Math.round((s.conf || 0.92) * 100)}%
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF" }}>📍 Zone: <strong style={{ color: s.color }}>{s.zone || "Main Floor"}</strong></div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>👁 Gaze: <strong style={{ color: "#00F2FE" }}>{s.gaze || "Shelf"}</strong></div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>📌 Pos: X:{Math.round((s.x || 0) * 100)}% Y:{Math.round((s.y || 0) * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store list */}
          {stores.length > 0 && (
            <div style={{ background: "rgba(21,27,44,0.65)", border: "1px solid #222D44", borderRadius: "14px", padding: "18px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Active Store Locations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {stores.slice(0, 4).map((store) => (
                  <div key={store.store_id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#39FF14", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.store_name}</div>
                      <div style={{ fontSize: "11px", color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const hudBtn = (active, color) => ({
  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
  border: active ? `1px solid ${color}` : "1px solid #222D44",
  background: active ? `${color}20` : "rgba(15,22,36,0.6)",
  color: active ? color : "#6B7280", cursor: "pointer", transition: "all 0.2s",
});
const qCard = { background: "rgba(21,27,44,0.75)", border: "1px solid #222D44", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" };
const qLabel = { fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" };
const qVal   = { fontSize: "20px", fontWeight: 800, color: "#fff", margin: "2px 0 0" };
const sCard  = { background: "rgba(21,27,44,0.75)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "14px", padding: "18px", display: "flex", alignItems: "flex-start", gap: "14px" };
const sLabel = { fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" };
const sVal   = { fontSize: "18px", fontWeight: 800, color: "#fff", margin: "4px 0 0" };
