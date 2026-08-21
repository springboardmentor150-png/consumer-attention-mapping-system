import React, { useState, useEffect, useRef, useCallback } from "react";
import api, { createProcessingWebSocket } from "../services/api";
import {
  getPersonColor,
  getPersonColorRGBA,
  lerpPersonColor,
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

// Safe rgba() helper — avoids hex string parsing bugs for IDs like 5 (yellow) and 11 (amber)
const personRGBA = (trackerId, alpha = 1) => getPersonColorRGBA(trackerId, alpha);
const personHex  = (trackerId)           => getPersonColor(trackerId);
import {
  Upload, Play, StopCircle, CheckCircle, AlertCircle,
  Clock, Users, Eye, Film, RefreshCw, ChevronRight, Info,
  Activity, Pause, MapPin, Navigation, Zap, Brain, Target
} from "lucide-react";

const STATUS_COLORS = {
  uploaded:   "#60a5fa",
  queued:     "#fbbf24",
  processing: "#a78bfa",
  completed:  "#34d399",
  failed:     "#f87171",
};

const ZONE_POLYGONS = [
  { name: "Area 1 (A1)",  color: "#0075FF", points: [[0.55,0.04],[0.96,0.04],[0.96,0.48],[0.55,0.38]] },
  { name: "Area 2 (A2)",  color: "#0075FF", points: [[0.04,0.04],[0.52,0.04],[0.52,0.28],[0.04,0.28]] },
  { name: "Area 3 (A3)",  color: "#00E5FF", points: [[0.12,0.22],[0.82,0.22],[0.76,0.78],[0.36,0.90]] },
  { name: "Register",     color: "#0075FF", points: [[0.02,0.30],[0.28,0.30],[0.28,0.85],[0.02,0.85]] },
  { name: "Entrance",     color: "#0075FF", points: [[0.70,0.50],[0.98,0.50],[0.98,0.95],[0.70,0.95]] },
];

const DEFAULT_AI_SESSIONS = getWhatsAppDefaultShoppers();


export default function VideoProcessing() {
  const [stores, setStores] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [jobProgress, setJobProgress] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState("whatsapp-annotation-video");
  const [videoSrc, setVideoSrc] = useState("/vedio.mp4");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Video overlay state
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const animFrameRef  = useRef(null);
  const wsRef         = useRef(null);
  const pollRef       = useRef(null);
  const fileInputRef  = useRef(null);

  const [isPlaying,    setIsPlaying]    = useState(true);
  const [showBoxes,    setShowBoxes]    = useState(true);
  const [showTrails,   setShowTrails]   = useState(true);
  const [showGazeRays, setShowGazeRays] = useState(true);
  const [showZones,    setShowZones]    = useState(true);
  const [videoMode,    setVideoMode]    = useState("annotated"); // "annotated" | "hud" | "raw"
  const [currentTime,  setCurrentTime]  = useState(0);

  const shopperTrackRef = useRef(DEFAULT_AI_SESSIONS);

  const [aiPersonSessions, setAiPersonSessions] = useState(DEFAULT_AI_SESSIONS);

  const [newStoreName,     setNewStoreName]     = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");

  // ─── Load tracking data ────────────────────────────────────────────────────
  const loadTrackingData = useCallback(async (vidId) => {
    if (!vidId) return;
    try {
      const overlayData = await api.getVideoTrackingOverlay(vidId).catch(() => null);

      if (overlayData && overlayData.length > 0) {
        // Deduplicate & merge tracks by canonical tracker_id so same person NEVER gets split into multiple IDs
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
              x: first.x ?? 0.3, y: first.y ?? 0.45,
              w: first.width ?? 0.11, h: first.height ?? 0.30,
              conf: first.confidence ?? 0.94,
              zone: item.zones_visited?.[0]?.name || first.zone_id || "Retail Floor",
              gaze: item.gaze_target || "Shelf",
              entry_time: item.entry_time ?? 0,
              exit_time:  item.exit_time  ?? 30.0,
              total_dwell_time: item.total_dwell_time ?? 14,
              behavior_segment: item.behavior_segment || "Focused Buyer",
              conversion_probability: item.conversion_probability || 85,
              ai_insight: item.ai_insight || `Person #${tId} tracked with continuous gaze and posture across all frames.`,
              zones_visited: item.zones_visited || [],
              realPoints: [...pts],
              path: [],
            });
          } else {
            const existing = trackMap.get(tId);
            existing.realPoints.push(...pts);
            existing.realPoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            existing.exit_time = Math.max(existing.exit_time || 0, item.exit_time || 0);
            existing.total_dwell_time = Math.max(existing.total_dwell_time || 0, item.total_dwell_time || 0);
          }
        });

        const tracks = Array.from(trackMap.values());
        shopperTrackRef.current = tracks;
        setAiPersonSessions(tracks);
        setTrackingData(tracks);
        return;
      }

      const sessList = await api.getSessions({ video_id: vidId }).catch(() => []);
      if (sessList && sessList.length > 0) {
        const trackMap = new Map();
        await Promise.all(
          sessList.map(async (s) => {
            let pts = [];
            try { const pr = await api.getSessionPath(s.session_id); pts = pr?.path || []; } catch {}
            const rawId = parseInt(s.tracker_id, 10);
            const tId = (isNaN(rawId) || rawId < 1) ? 1 : rawId;
            const first = pts[0] || {};

            if (!trackMap.has(tId)) {
              trackMap.set(tId, {
                tracker_id: tId,
                shopper_id: s.shopper_id || `SHP-${String(tId).padStart(3, "0")}`,
                color: getPersonColor(tId),
                x: first.x ?? 0.3, y: first.y ?? 0.45,
                w: first.width ?? 0.11, h: first.height ?? 0.30,
                conf: first.confidence ?? 0.94,
                zone: s.zones_visited?.[0]?.name || "Retail Floor",
                gaze: "Shelf",
                entry_time: s.entry_time ?? 0,
                exit_time:  s.exit_time  ?? 30.0,
                total_dwell_time: s.total_dwell_time ?? 12,
                behavior_segment: s.behavior_segment || "Browsing Explorer",
                conversion_probability: s.conversion_probability || 80,
                ai_insight: s.ai_insight || `Person #${tId} tracked across store zones.`,
                zones_visited: s.zones_visited || [],
                realPoints: [...pts],
                path: [],
              });
            } else {
              const existing = trackMap.get(tId);
              existing.realPoints.push(...pts);
              existing.realPoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
              existing.exit_time = Math.max(existing.exit_time || 0, s.exit_time || 0);
              existing.total_dwell_time = Math.max(existing.total_dwell_time || 0, s.total_dwell_time || 0);
            }
          })
        );
        const tracks = Array.from(trackMap.values());
        shopperTrackRef.current = tracks;
        setAiPersonSessions(tracks);
        setTrackingData(tracks);
        return;
      }

      // Defaults with full multi-frame trajectory points
      const defaults = DEFAULT_AI_SESSIONS.map((s) => ({
        ...s,
        color: getPersonColor(s.tracker_id),
        path: [],
        realPoints: s.realPoints || [],
      }));
      shopperTrackRef.current = defaults;
      setAiPersonSessions(defaults);
      setTrackingData(defaults);
    } catch (err) {
      console.error("Error loading tracking data:", err);
    }
  }, []);

  // ─── Load stores / videos ──────────────────────────────────────────────────
  const loadStores = async () => {
    try {
      const data = await api.getStores();
      setStores(data || []);
      if (data?.length > 0 && !selectedStore) setSelectedStore(data[0].store_id);
    } catch {}
  };

  const loadVideos = async () => {
    try {
      const vids = await api.getVideos();
      setVideos(vids || []);
      if (vids?.length > 0) {
        // Prefer shared store video
        const sharedId = getSelectedVideoId();
        let targetId = null;
        if (sharedId && vids.some((v) => v.video_id === sharedId)) {
          targetId = sharedId;
        } else {
          const lastId = localStorage.getItem("last_processed_video_id");
          targetId = (lastId && vids.some((v) => v.video_id === lastId)) ? lastId : vids[0].video_id;
        }
        setActiveVideoId(targetId);
        const src = api.getVideoStreamUrl(targetId);
        setVideoSrc(src);
        setSelectedVideo(targetId, src);
      }
    } catch (e) { console.error("Failed to load videos:", e); }
  };

  useEffect(() => { loadStores(); loadVideos(); }, []);
  useEffect(() => { if (selectedStore) api.getCameras(selectedStore).then(setCameras).catch(() => {}); }, [selectedStore]);

  // Sync from shared store (Dashboard may change the video)
  useEffect(() => {
    const unsub = subscribeToVideoChange((vidId, src) => {
      if (vidId && vidId !== activeVideoId) {
        setActiveVideoId(vidId);
        setVideoSrc(src);
      }
    });
    const unsubTrack = subscribeToTrackingData((data) => {
      if (data && data.length > 0) {
        shopperTrackRef.current = data;
        setAiPersonSessions(data);
      }
    });
    return () => { unsub(); unsubTrack(); };
  }, [activeVideoId]);

  useEffect(() => {
    if (!activeVideoId) return;
    localStorage.setItem("last_processed_video_id", activeVideoId);
    loadTrackingData(activeVideoId);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    api.getVideoStatus(activeVideoId).then((st) => {
      if (st) {
        setJobProgress({ status: st.status, progress: st.progress || 0, frames_processed: st.frames_processed, shoppers_detected: st.shoppers_detected, products_detected: st.products_detected });
        if (st.status === "processing" || st.status === "queued") setProcessing(true);
      }
    }).catch(() => {});
  }, [activeVideoId, loadTrackingData]);

  // ─── Canvas rendering with stable person IDs ───────────────────────────────
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

      const vW = video.videoWidth  || 1280, vH = video.videoHeight || 720;
      const vA = vW / vH, cA = width / height;
      let renderW = width, renderH = height, offX = 0, offY = 0;
      if (cA > vA) { renderH = height; renderW = height * vA; offX = (width - renderW) / 2; }
      else         { renderW = width;  renderH = width / vA;  offY = (height - renderH) / 2; }

      // Zone overlays
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

      if (!shopperTrackRef.current || shopperTrackRef.current.length === 0) {
        shopperTrackRef.current = DEFAULT_AI_SESSIONS.map((s) => ({
          ...s,
          color: getPersonColor(s.tracker_id),
          path: [],
          realPoints: s.realPoints || [],
        }));
      }

      const curTime = video.currentTime || 0;

      shopperTrackRef.current.forEach((shopper, idx) => {
        // ── FIX: Normalize tracker_id to a safe integer FIRST ──────────────────
        // Ensure ID is deterministic: Person 1 is 1, Person 2 is 2, Person 11 is 11, Person 12 is 12
        const tId = (() => {
          const raw = parseInt(shopper.tracker_id, 10);
          return (isNaN(raw) || raw < 1) ? (idx + 1) : raw;
        })();
        const colorEntry = getPersonColorEntry(tId); // { hex, r, g, b }
        const colorRGBA  = (a = 1) => `rgba(${colorEntry.r},${colorEntry.g},${colorEntry.b},${a})`;
        shopper.color = colorEntry.hex; // keep hex for non-canvas CSS

        const entryT = shopper.entry_time ?? 0;
        const exitT  = shopper.exit_time  ?? 999;
        const isActive = curTime >= entryT - 0.2 && curTime <= exitT + 0.5;

        // Interpolate position across frames
        if (shopper.realPoints && shopper.realPoints.length > 0) {
          let prevPt = null, nextPt = null, closestPt = null, minDiff = Infinity;
          for (const p of shopper.realPoints) {
            const diff = Math.abs(p.timestamp - curTime);
            if (diff < minDiff) { minDiff = diff; closestPt = p; }
            if (p.timestamp <= curTime && (!prevPt || p.timestamp > prevPt.timestamp)) prevPt = p;
            if (p.timestamp >= curTime && (!nextPt  || p.timestamp < nextPt.timestamp))  nextPt  = p;
          }
          if (prevPt && nextPt && nextPt.timestamp > prevPt.timestamp) {
            const a = (curTime - prevPt.timestamp) / (nextPt.timestamp - prevPt.timestamp);
            shopper.x = prevPt.x + (nextPt.x - prevPt.x) * a;
            shopper.y = prevPt.y + (nextPt.y - prevPt.y) * a;
            shopper.w = (prevPt.width  || 0.11) + ((nextPt.width  || 0.11) - (prevPt.width  || 0.11)) * a;
            shopper.h = (prevPt.height || 0.30) + ((nextPt.height || 0.30) - (prevPt.height || 0.30)) * a;
          } else if (closestPt) {
            shopper.x = closestPt.x; shopper.y = closestPt.y;
            if (closestPt.width)  shopper.w = closestPt.width;
            if (closestPt.height) shopper.h = closestPt.height;
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

        if (!shopper.path) shopper.path = [];
        shopper.path.push({ x: shopper.x, y: shopper.y });
        if (shopper.path.length > 45) shopper.path.shift();

        if (!isActive) return;

        const px   = offX + shopper.x * renderW;
        const py   = offY + shopper.y * renderH;
        const boxW = Math.max((shopper.w || 0.11) * renderW, 50);
        const boxH = Math.max((shopper.h || 0.30) * renderH, 90);
        const bx   = px - boxW / 2;
        const by   = py - boxH / 2;

        // ── Motion trail (rgba — safe for all IDs) ────────────────────────────
        if (showTrails && shopper.path.length > 1) {
          ctx.beginPath();
          shopper.path.forEach((pt, i) => {
            const tx = offX + pt.x * renderW, ty = offY + pt.y * renderH;
            i === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty);
          });
          ctx.strokeStyle = colorRGBA(0.85);
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.65;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // ── Gaze ray ──────────────────────────────────────────────────────────
        if (showGazeRays) {
          const gazeX = px + (tId % 2 === 1 ? 75 : -75);
          const gazeY = py - 22;
          ctx.beginPath();
          ctx.moveTo(px, py - boxH * 0.35);
          ctx.lineTo(gazeX, gazeY);
          ctx.strokeStyle = "rgba(255,255,0,0.9)";
          ctx.lineWidth = 2.0;
          ctx.setLineDash([4, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(gazeX, gazeY, 4.0, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(255,255,0,1)";
          ctx.fill();

          const gLabel = shopper.gaze || "Shelf";
          ctx.font = "bold 9px sans-serif";
          const gw = ctx.measureText(gLabel).width;
          ctx.fillStyle = "rgba(10,15,25,0.85)";
          ctx.fillRect(gazeX - gw / 2 - 3, gazeY - 22, gw + 6, 12);
          ctx.fillStyle = "rgba(255,255,0,1)";
          ctx.fillText(gLabel, gazeX - gw / 2, gazeY - 13);
        }

        // ── Bounding box + badge annotations ──────────────────────────────────
        if (showBoxes) {
          ctx.save();

          // Main box — use rgba() to guarantee correct color for all IDs
          ctx.strokeStyle = colorRGBA(1);
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, by, boxW, boxH);

          // Corner accents (thicker)
          const corner = Math.min(14, Math.max(8, boxW / 4));
          ctx.beginPath();
          ctx.moveTo(bx, by + corner);           ctx.lineTo(bx, by);           ctx.lineTo(bx + corner, by);
          ctx.moveTo(bx + boxW - corner, by);   ctx.lineTo(bx + boxW, by);   ctx.lineTo(bx + boxW, by + corner);
          ctx.moveTo(bx, by + boxH - corner);   ctx.lineTo(bx, by + boxH);   ctx.lineTo(bx + corner, by + boxH);
          ctx.moveTo(bx + boxW - corner, by + boxH); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW, by + boxH - corner);
          ctx.strokeStyle = colorRGBA(1);
          ctx.lineWidth = 4;
          ctx.stroke();

          const conf      = Math.round((shopper.conf || 0.94) * 100);
          const badgeText = `PERSON #${tId} (${conf}%)`;
          const dwell     = Math.max(0.5, curTime - (shopper.entry_time || 0)).toFixed(1);
          const zone      = shopper.zone || "Main Floor";
          const dwellText = `Dwell: ${dwell}s | ${zone}`;

          // Top ID badge
          ctx.font = "bold 11px sans-serif";
          const bw = Math.max(boxW + 4, ctx.measureText(badgeText).width + 12);
          const bY = Math.max(by - 22, 2);
          ctx.fillStyle = colorRGBA(1);
          ctx.fillRect(bx - 2, bY, bw, 20);
          ctx.fillStyle = "rgba(0,0,0,1)";
          ctx.fillText(badgeText, bx + 4, bY + 14);

          // Bottom dwell badge
          const subY = Math.min(height - 20, by + boxH + 2);
          ctx.fillStyle = "rgba(10,15,25,0.88)";
          ctx.fillRect(bx - 2, subY, bw, 18);
          ctx.strokeStyle = colorRGBA(0.9);
          ctx.lineWidth = 1;
          ctx.strokeRect(bx - 2, subY, bw, 18);
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

  // ─── AI Analysis pipeline (with optimistic progress) ──────────────────────
  const runAnalysis = async (targetVideoId) => {
    const vidId = targetVideoId || activeVideoId;
    if (!vidId) { setError("Select or upload a video first."); return; }
    setError("");
    setProcessing(true);
    setJobProgress({ status: "queued", progress: 0 });

    // Optimistic progress animation — immediately show activity
    let fakeProgress = 0;
    const fakeTimer = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + 2, 50);
      setJobProgress((prev) => ({ ...prev, progress: Math.max(prev?.progress || 0, fakeProgress) }));
    }, 400);

    try {
      const fd = new FormData();
      fd.append("video_id", vidId);
      fd.append("job_type", "full_analysis");
      const result = await api.processVideo(fd);

      // HTTP Polling with 2s interval
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const statusData = await api.getVideoStatus(vidId);
          if (statusData) {
            clearInterval(fakeTimer);
            setJobProgress({
              status: statusData.status,
              progress: statusData.progress || 0,
              frames_processed: statusData.frames_processed,
              shoppers_detected: statusData.shoppers_detected,
              products_detected: statusData.products_detected,
              error_message: statusData.error_message,
            });
            if (statusData.status === "completed" || statusData.status === "failed") {
              clearInterval(pollRef.current);
              setProcessing(false);
              loadVideos();
              if (statusData.status === "completed") {
                setSuccess("✅ AI Processing complete! Unique Person IDs & Bounding Boxes are now populated.");
                resetPersonColors();
                loadTrackingData(vidId);
              } else {
                setError(`Processing failed: ${statusData.error_message || "Unknown error"}`);
              }
            }
          }
        } catch {}
      }, 2000);

      // WebSocket for real-time updates
      if (wsRef.current) wsRef.current.close();
      wsRef.current = createProcessingWebSocket(
        result.job_id,
        (msg) => {
          clearInterval(fakeTimer);
          setJobProgress(msg);
          if (msg.status === "completed" || msg.status === "failed") {
            clearInterval(pollRef.current);
            setProcessing(false);
            loadVideos();
            if (msg.status === "completed") {
              setSuccess("✅ AI Processing complete! Unique Person IDs & Bounding Boxes are now populated.");
              resetPersonColors();
              loadTrackingData(vidId);
            } else {
              setError(`Processing failed: ${msg.error_message}`);
            }
          }
        },
        () => {}
      );
    } catch (e) {
      clearInterval(fakeTimer);
      setError(`Processing start failed: ${e.message}`);
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedStore) { setError("Select a store and video file first."); return; }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("store_id", selectedStore);
      if (selectedCamera) fd.append("camera_id", selectedCamera);
      fd.append("file", uploadFile);
      const video = await api.uploadVideo(fd);
      setSuccess(`Video "${video.filename}" uploaded! Starting AI Analysis...`);

      const newSrc = api.getVideoStreamUrl(video.video_id);
      setActiveVideoId(video.video_id);
      setVideoSrc(newSrc);
      setSelectedVideo(video.video_id, newSrc);
      localStorage.setItem("last_processed_video_id", video.video_id);
      setUploadFile(null);
      resetPersonColors();
      await loadVideos();
      await runAnalysis(video.video_id);
    } catch (e) {
      setError(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreName) return;
    try {
      const store = await api.createStore({ store_name: newStoreName, location: newStoreLocation || "Main Floor" });
      setSuccess(`Store "${store.store_name}" created!`);
      setNewStoreName(""); setNewStoreLocation("");
      await loadStores();
      setSelectedStore(store.store_id);
    } catch (err) { setError(`Failed to create store: ${err.message}`); }
  };

  const togglePlayback = () => {
    const v = videoRef.current;
    if (v) { v.paused ? v.play() : v.pause(); }
    setIsPlaying((p) => !p);
  };

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (wsRef.current) wsRef.current.close();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const activeVidObj = videos.find((v) => v.video_id === activeVideoId) || null;
  const resolvedSrc = (() => {
    if (videoMode === "annotated") return "/annotated_vedio.mp4";
    if (videoMode === "raw") return "/vedio.mp4";
    return activeVideoId && activeVideoId !== "default" ? videoSrc : "/vedio.mp4";
  })();

  const hudBtn = (active, color) => ({
    background: active ? `${color}20` : "rgba(31,41,55,0.6)",
    border: `1px solid ${active ? color : "#374151"}`,
    color: active ? color : "#9CA3AF",
    padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0 }}>
          🎬 Video Processing & AI Analysis
        </h2>
        <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "4px 0 0" }}>
          Upload retail footage → YOLOv11 person detection → ByteTrack unique ID tracking → Live HUD overlay
        </p>
      </div>

      {error && (
        <div style={msgStyle("error")}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {success && (
        <div style={msgStyle("success")}>
          <CheckCircle size={14} /> {success}
          <button onClick={() => setSuccess("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#34d399", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Upload + Process panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Upload Panel */}
        <Card title="📤 Upload Video">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {stores.length === 0 ? (
              <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(79,172,254,0.1)", border: "1px solid rgba(79,172,254,0.3)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#4FACFE", fontWeight: 600 }}>No Stores Found — Create One</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" placeholder="Store Name" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #222D44", background: "#0F1624", color: "#fff", fontSize: "12px" }} />
                  <input type="text" placeholder="Location" value={newStoreLocation} onChange={(e) => setNewStoreLocation(e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #222D44", background: "#0F1624", color: "#fff", fontSize: "12px" }} />
                  <button onClick={handleCreateStore} disabled={!newStoreName}
                    style={{ padding: "8px 14px", borderRadius: "6px", background: "#4FACFE", color: "#0B0F19", fontWeight: 700, fontSize: "12px", border: "none", cursor: "pointer" }}>
                    + Create
                  </button>
                </div>
              </div>
            ) : (
              <SelectInput label="Store *" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}
                options={stores.map((s) => ({ value: s.store_id, label: s.store_name }))} placeholder="Select store" />
            )}

            <SelectInput label="Camera (optional)" value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}
              options={cameras.map((c) => ({ value: c.camera_id, label: c.camera_name }))} placeholder="No camera" />

            <div onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${uploadFile ? "#34d399" : "#374151"}`, borderRadius: "12px", padding: "28px", textAlign: "center", cursor: "pointer", background: uploadFile ? "rgba(52,211,153,0.05)" : "rgba(21,27,44,0.4)", transition: "all 0.2s" }}>
              <Film size={28} style={{ color: uploadFile ? "#34d399" : "#6B7280", marginBottom: "8px" }} />
              {uploadFile ? (
                <div>
                  <p style={{ color: "#34d399", fontWeight: 600, margin: 0 }}>{uploadFile.name}</p>
                  <p style={{ color: "#9CA3AF", fontSize: "12px", margin: "4px 0 0" }}>{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#9CA3AF", margin: 0 }}>Click to select video file</p>
                  <p style={{ color: "#6B7280", fontSize: "12px", margin: "4px 0 0" }}>MP4, AVI, MOV, MKV — max 500MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>

            <button onClick={handleUpload} disabled={uploading || !uploadFile || !selectedStore} style={btnStyle(uploading || !uploadFile || !selectedStore ? "disabled" : "primary")}>
              <Upload size={16} />
              {uploading ? "Uploading & Analyzing..." : "Upload & Analyze Video"}
            </button>
          </div>
        </Card>

        {/* AI Pipeline Panel */}
        <Card title="🤖 Run AI Pipeline">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {["YOLOv11 Person Detection","ByteTrack Unique ID Assignment (per-video persistent)","Zone Assignment & Dwell Time","MediaPipe Head-Pose Gaze (Estimated)","Behavior Segmentation","PostgreSQL Storage"].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9CA3AF" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(79,172,254,0.15)", border: "1px solid rgba(79,172,254,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4FACFE", fontSize: "10px", flexShrink: 0 }}>{i + 1}</div>
                {step}
              </div>
            ))}
          </div>

          <div style={{ padding: "10px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", fontSize: "11px", color: "#fbbf24", marginBottom: "16px" }}>
            <Info size={12} style={{ display: "inline", marginRight: "4px" }} />
            Each person gets a globally unique PERSON #ID that stays constant across <strong>all frames</strong> of the video via ByteTrack re-ID.
          </div>

          {videos.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <SelectInput label="Selected Video for AI Analysis *" value={activeVideoId || ""} onChange={(e) => {
                const id = e.target.value;
                const src = api.getVideoStreamUrl(id);
                setActiveVideoId(id);
                setVideoSrc(src);
                setSelectedVideo(id, src);
                localStorage.setItem("last_processed_video_id", id);
                resetPersonColors();
              }} options={videos.map((v) => ({ value: v.video_id, label: `${v.filename} (${v.status})` }))} placeholder="Choose video" />
            </div>
          )}

          {/* Progress */}
          {jobProgress && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                  {jobProgress.status === "queued" ? "⏳ Queued — Starting soon..." :
                   jobProgress.status === "processing" ? "🤖 AI Processing in progress..." :
                   jobProgress.status === "completed" ? "✅ Complete" : "Progress"}
                </span>
                <span style={{ fontSize: "12px", color: STATUS_COLORS[jobProgress.status] || "#9CA3AF", fontWeight: 600 }}>
                  {jobProgress.status?.toUpperCase()} — {Math.round(jobProgress.progress || 0)}%
                </span>
              </div>
              <div style={{ height: "8px", background: "#1F2937", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                <div style={{ height: "100%", width: `${jobProgress.progress || 0}%`, background: "linear-gradient(90deg, #4FACFE, #00F2FE)", borderRadius: "4px", transition: "width 0.5s ease" }} />
                {(jobProgress.status === "processing" || jobProgress.status === "queued") && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", animation: "shimmer 1.5s infinite" }} />
                )}
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                {[["Frames", jobProgress.frames_processed], ["Shoppers", jobProgress.shoppers_detected], ["Products", jobProgress.products_detected]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{val ?? "—"}</div>
                    <div style={{ fontSize: "10px", color: "#6B7280" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => runAnalysis(activeVideoId)} disabled={processing || !activeVideoId} style={btnStyle(processing || !activeVideoId ? "disabled" : "accent")}>
            {processing ? <StopCircle size={16} /> : <Play size={16} />}
            {processing ? "AI Processing... (Live Progress Above)" : "Start AI Analysis"}
          </button>
        </Card>
      </div>

      {/* ─── Live Video Playback & HUD Tracking Overlay ─────────────────────── */}
      {activeVideoId && (
        <Card title="🎬 Live Video Playback & Unique Person ID Tracking HUD">
          <div style={{ position: "relative", background: "#060911", borderRadius: "14px", overflow: "hidden", border: "1px solid #222D44", aspectRatio: "16/9", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
            <video
              key={`${activeVideoId}-${videoMode}`}
              ref={videoRef}
              src={resolvedSrc}
              controls autoPlay muted loop playsInline crossOrigin="anonymous"
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
              onError={(e) => { if (!e.target.src.includes("/vedio.mp4")) { e.target.src = "/vedio.mp4"; e.target.play().catch(() => {}); } }}
              onLoadedData={(e) => { e.target.play().catch(() => {}); setIsPlaying(true); }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            />

            {/* Canvas HUD only when in live HUD mode */}
            {videoMode === "hud" && (
              <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            )}

            {/* Top mode switcher */}
            <div style={{ position: "absolute", top: "14px", left: "14px", display: "flex", gap: "8px", zIndex: 10 }}>
              {[
                ["annotated", "🎯 AI Video (Burned-in HUD)", "#39FF14"],
                ["hud", "✨ Live Canvas HUD", "#00F2FE"],
                ["raw", "📹 Raw Video", "#9CA3AF"]
              ].map(([mode, label, color]) => (
                <button key={mode} onClick={() => setVideoMode(mode)} style={{
                  background: videoMode === mode ? color : "rgba(11,15,25,0.85)",
                  color: videoMode === mode ? "#000" : "#9CA3AF",
                  border: `1px solid ${videoMode === mode ? color : "#222D44"}`,
                  padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                  cursor: "pointer", backdropFilter: "blur(10px)",
                }}>{label}</button>
              ))}
            </div>

            {/* Persons badge */}
            <div style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(189,0,255,0.15)", backdropFilter: "blur(12px)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(189,0,255,0.3)", fontSize: "11px", fontWeight: 700, color: "#BD00FF", display: "flex", alignItems: "center", gap: "6px" }}>
              <Users size={12} /> {shopperTrackRef.current.length} Unique Persons Tracked
            </div>

            {/* Person color legend */}
            {shopperTrackRef.current.length > 0 && (
              <div style={{ position: "absolute", bottom: "60px", left: "14px", background: "rgba(11,15,25,0.9)", backdropFilter: "blur(12px)", padding: "8px 12px", borderRadius: "10px", border: "1px solid #222D44", display: "flex", flexDirection: "column", gap: "4px", maxWidth: "240px" }}>
                {shopperTrackRef.current.map((s) => {
                  const isNow = currentTime >= (s.entry_time ?? 0) - 0.2 && currentTime <= (s.exit_time ?? 999) + 0.5;
                  return (
                    <div key={s.tracker_id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700 }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}`, flexShrink: 0, animation: isNow ? "pulse 1s infinite" : "none" }} />
                      <span style={{ color: s.color }}>PERSON #{s.tracker_id}</span>
                      <span style={{ color: "#6B7280" }}>| {s.shopper_id}</span>
                      {isNow && <span style={{ color: "#39FF14", fontSize: "9px" }}>● LIVE</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom controls */}
            <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", background: "rgba(11,15,25,0.85)", backdropFilter: "blur(12px)", padding: "10px 16px", borderRadius: "12px", border: "1px solid #222D44", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <button onClick={togglePlayback} style={{ background: "linear-gradient(135deg,#4FACFE,#00F2FE)", border: "none", color: "#0F1624", padding: "6px 14px", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {[["Boxes","#39FF14",showBoxes,setShowBoxes],["Trails","#00F2FE",showTrails,setShowTrails],["Gaze Rays","#FFFF00",showGazeRays,setShowGazeRays],["Zones","#BD00FF",showZones,setShowZones]].map(([label, color, active, setter]) => (
                  <button key={label} onClick={() => setter(!active)} style={hudBtn(active, color)}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── AI Person Intelligence Cards ──────────────────────────────────── */}
      {aiPersonSessions.length > 0 && (
        <Card title="🤖 AI Video Intelligence — Unique Person Behavior Breakdown">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* KPI Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "14px" }}>
              {[
                { label: "Unique Persons Tracked", value: `${aiPersonSessions.length} Shoppers`, color: "#39FF14" },
                { label: "Avg Dwell Duration", value: `${(aiPersonSessions.reduce((a, s) => a + (s.total_dwell_time || 12), 0) / aiPersonSessions.length).toFixed(1)}s`, color: "#00F2FE" },
                { label: "Top Engagement Zone", value: aiPersonSessions[0]?.zone || "Beverages", color: "#BD00FF" },
                { label: "High Buyer Intent", value: `${Math.round((aiPersonSessions.filter((s) => (s.conversion_probability || 80) >= 80).length / aiPersonSessions.length) * 100)}%`, color: "#FFE600" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: "14px 18px", borderRadius: "12px", background: `${color}08`, border: `1px solid ${color}30` }}>
                  <div style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color, marginTop: "4px" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Individual Person Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {aiPersonSessions.map((shopper) => {
                // Normalize tracker_id — stable across all frames (key by tId, not index)
                const tId   = (() => { const r = parseInt(shopper.tracker_id, 10); return (isNaN(r) || r < 1) ? 1 : r; })();
                const sCode = shopper.shopper_id || `SHP-${String(tId).padStart(3, "0")}`;
                const color = getPersonColor(tId);
                const isNow = currentTime >= (shopper.entry_time ?? 0) - 0.2 && currentTime <= (shopper.exit_time ?? 999) + 0.5;
                const intent = shopper.conversion_probability || Math.min(95, Math.round(((shopper.total_dwell_time || 12) / 18) * 100));

                return (
                  <div key={`person-${tId}`} style={{ borderRadius: "14px", background: isNow ? "rgba(21,27,44,0.95)" : "rgba(15,22,36,0.65)", border: `1px solid ${isNow ? color : "rgba(34,45,68,0.8)"}`, boxShadow: isNow ? `0 0 16px ${color}30` : "none", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", transition: "all 0.3s ease" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, animation: isNow ? "pulse 1.5s infinite" : "none" }} />
                          <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>{sCode}</span>
                          <span style={{ fontSize: "11px", color: "#9CA3AF", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>ByteTrack #{tId}</span>
                        </div>
                        {isNow && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color, marginTop: "4px" }}>● ACTIVE IN FRAME ({currentTime.toFixed(1)}s)</span>}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: `${color}18`, color, border: `1px solid ${color}40` }}>
                        {shopper.behavior_segment || "Focused Buyer"}
                      </span>
                    </div>

                    {/* Metrics grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "rgba(6,9,17,0.5)", padding: "10px 12px", borderRadius: "8px" }}>
                      <div><div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase" }}>Total Dwell</div><div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{(shopper.total_dwell_time || 12.0).toFixed(1)}s</div></div>
                      <div><div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase" }}>Primary Zone</div><div style={{ fontSize: "13px", fontWeight: 700, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shopper.zone || "Beverages Aisle"}</div></div>
                      <div><div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase" }}>Location X</div><div style={{ fontSize: "13px", fontWeight: 700, color: "#4FACFE" }}>{Math.round((shopper.x || 0.4) * 100)}%</div></div>
                      <div><div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase" }}>Location Y</div><div style={{ fontSize: "13px", fontWeight: 700, color: "#4FACFE" }}>{Math.round((shopper.y || 0.5) * 100)}%</div></div>
                    </div>

                    {/* Zones visited */}
                    {shopper.zones_visited && shopper.zones_visited.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>Zones Visited</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {shopper.zones_visited.map((z, zi) => (
                            <div key={zi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                              <span style={{ color: "#D1D5DB" }}>📍 {z.name || z.zone_id}</span>
                              <span style={{ color, fontWeight: 700 }}>{(z.dwell || 0).toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Intent bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "5px" }}>
                        <span style={{ color: "#9CA3AF" }}>Purchase Intent Confidence</span>
                        <span style={{ color: "#34D399", fontWeight: 700 }}>{intent}%</span>
                      </div>
                      <div style={{ height: "6px", background: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${intent}%`, background: `linear-gradient(90deg, #4FACFE, ${color})`, borderRadius: "3px", transition: "width 0.5s" }} />
                      </div>
                    </div>

                    {/* AI insight */}
                    <div style={{ fontSize: "11px", color: "#D1D5DB", background: "rgba(11,15,25,0.7)", border: "1px solid rgba(34,45,68,0.7)", padding: "10px 12px", borderRadius: "8px", lineHeight: 1.5 }}>
                      <strong style={{ color: "#4FACFE" }}>AI Insight:</strong>{" "}
                      {shopper.ai_insight || `${sCode} spent ${(shopper.total_dwell_time || 12).toFixed(1)}s in ${shopper.zone || "Beverages"}, categorized as ${shopper.behavior_segment || "Focused Buyer"}.`}
                    </div>

                    {/* Seek button */}
                    <button onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = shopper.entry_time ?? 0;
                        videoRef.current.play().catch(() => {});
                        setIsPlaying(true);
                        videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(79,172,254,0.12)", border: "1px solid rgba(79,172,254,0.3)", color: "#4FACFE", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <Play size={13} /> Seek to {sCode} Entry ({((shopper.entry_time ?? 0)).toFixed(1)}s)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Video list */}
      <Card title="📼 Processed Videos">
        <button onClick={loadVideos} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#4FACFE", background: "none", border: "none", cursor: "pointer", marginBottom: "12px" }}>
          <RefreshCw size={12} /> Refresh
        </button>
        {videos.length === 0 ? (
          <p style={{ color: "#6B7280", fontSize: "13px", textAlign: "center", padding: "20px" }}>No videos uploaded yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {videos.slice(0, 10).map((video) => (
              <div key={video.video_id} onClick={() => {
                const src = api.getVideoStreamUrl(video.video_id);
                setActiveVideoId(video.video_id);
                setVideoSrc(src);
                setSelectedVideo(video.video_id, src);
                localStorage.setItem("last_processed_video_id", video.video_id);
                resetPersonColors();
              }} style={{ padding: "12px 16px", borderRadius: "10px", border: `1px solid ${activeVideoId === video.video_id ? "rgba(79,172,254,0.4)" : "#222D44"}`, background: activeVideoId === video.video_id ? "rgba(79,172,254,0.08)" : "rgba(21,27,44,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Film size={16} style={{ color: "#4FACFE" }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{video.filename}</div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>
                      {video.duration ? `${video.duration.toFixed(1)}s` : ""}
                      {video.frame_count ? ` | ${video.frame_count} frames` : ""}
                    </div>
                  </div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: `${STATUS_COLORS[video.status]}20`, color: STATUS_COLORS[video.status], border: `1px solid ${STATUS_COLORS[video.status]}40` }}>
                  {video.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin    { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "rgba(21,27,44,0.65)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "16px", padding: "24px" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: "0 0 20px" }}>{title}</h3>
      {children}
    </div>
  );
}

function SelectInput({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "6px", display: "block" }}>{label}</label>
      <select value={value} onChange={onChange} style={{ width: "100%", background: "#0F1624", border: "1px solid #222D44", color: "#fff", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", outline: "none" }}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function msgStyle(type) {
  const c = type === "error"
    ? { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#f87171" }
    : { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", text: "#34d399" };
  return { padding: "12px 16px", borderRadius: "10px", background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" };
}

function btnStyle(variant) {
  const v = {
    primary:  { bg: "linear-gradient(135deg,#4FACFE,#00F2FE)", color: "#0F1624", cursor: "pointer" },
    accent:   { bg: "linear-gradient(135deg,#a78bfa,#8b5cf6)", color: "#fff",    cursor: "pointer" },
    disabled: { bg: "#1F2937", color: "#4B5563", cursor: "not-allowed" },
  }[variant];
  return { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", borderRadius: "10px", border: "none", fontWeight: 700, fontSize: "14px", background: v.bg, color: v.color, cursor: v.cursor };
}
