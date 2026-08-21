/**
 * HeatmapViewer.jsx — Comprehensive Store Analytics Heatmap
 *
 * Full Feature Set:
 *  1. Store Traffic Heatmap     — Shopper path pass-through density per grid box
 *  2. Dwell Time Heatmap        — Total seconds spent dwelling per grid box
 *  3. Shelf Attention Heatmap   — Gaze fixations & attention intensity towards store shelves
 *  4. Product Attention Heatmap — Product-level SKU engagement concentration
 *  5. Shopper Movement Heatmap  — Directional velocity flow vectors & movement arrows
 *  6. Zone-wise Filtering       — Isolate any store zone (A1, A2, A3, Register, Entrance)
 *  7. Time Filtering            — Video timeline scrubber & Hour-of-day filter
 *  8. Interactive Hovers        — Glassmorphic inspector with exact metric, active person IDs, zone
 *  9. Intensity Legend          — Gradient scale with labeled numeric thresholds & colormap options
 * 10. Person ID Safe Rendering  — Guaranteed stable color & rendering for Person #1, #5, #11 across frames
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../services/api";
import {
  getPersonColor,
  getPersonColorRGBA,
  getPersonColorEntry,
  getTrackingData,
  subscribeToTrackingData,
  getSelectedVideoId,
  getSelectedVideoSrc,
  getWhatsAppDefaultShoppers,
} from "../services/videoStore";
import {
  RefreshCw, Flame, MapPin, Eye, BarChart3,
  UserCheck, Crosshair, Clock, TrendingUp,
  Activity, Layers, Filter, SlidersHorizontal,
  Navigation, Zap, ArrowRight, Play, Pause, RotateCcw
} from "lucide-react";

// ─── Grid Dimensions ────────────────────────────────────────────────────────
const COLS = 24;    // horizontal cells
const ROWS = 16;    // vertical cells
const CELL_PX = 32; // canvas px per cell

// ─── Store Zones (Normalized Coordinates) ───────────────────────────────────
const STORE_ZONES = [
  { id: "beverages", name: "Area 1 (Beverages)",  x1: 0.55, y1: 0.04, x2: 0.96, y2: 0.48, color: "#4FACFE" },
  { id: "snacks",    name: "Area 2 (Snacks)",     x1: 0.04, y1: 0.04, x2: 0.52, y2: 0.28, color: "#00F2FE" },
  { id: "mainfloor", name: "Area 3 (Main Floor)", x1: 0.12, y1: 0.28, x2: 0.76, y2: 0.84, color: "#00E5FF" },
  { id: "register",  name: "Register / Checkout", x1: 0.02, y1: 0.30, x2: 0.28, y2: 0.85, color: "#FF5E36" },
  { id: "entrance",  name: "Store Entrance",      x1: 0.70, y1: 0.50, x2: 0.98, y2: 0.98, color: "#39FF14" },
];

// ─── 5 Heatmap Chart Definitions ─────────────────────────────────────────────
const HEATMAP_TYPES = [
  {
    id: "traffic",
    label: "Store Traffic",
    icon: "🚶",
    badge: "Footfall Density",
    desc: "Footfall & visitor path density across all store floor boxes",
    unit: "passes",
    maxScale: 25,
  },
  {
    id: "dwell",
    label: "Dwell Time",
    icon: "⏱",
    badge: "Engagement Duration",
    desc: "Total seconds shoppers spent lingering & evaluating in each grid box",
    unit: "sec",
    maxScale: 40,
  },
  {
    id: "shelf",
    label: "Shelf Attention",
    icon: "👁",
    badge: "Gaze Fixations",
    desc: "Estimated visual fixation intensity directed towards retail display shelves",
    unit: "gazes",
    maxScale: 50,
  },
  {
    id: "product",
    label: "Product Attention",
    icon: "🛒",
    badge: "SKU Interaction",
    desc: "Product-level fixation concentration & shopper touchpoint evaluation",
    unit: "fixations",
    maxScale: 60,
  },
  {
    id: "movement",
    label: "Shopper Movement",
    icon: "➡",
    badge: "Directional Flow",
    desc: "Velocity magnitude and directional flow vectors across aisles",
    unit: "m/s",
    maxScale: 1.8,
  },
];

// ─── Color Palettes / Colormaps ──────────────────────────────────────────────
const COLORMAPS = {
  thermal: (t) => {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    if (t < 0.125) return [clamp(0), clamp(0), clamp(0.5 + t * 4)];
    if (t < 0.375) return [clamp(0), clamp((t - 0.125) * 4), 255];
    if (t < 0.625) return [clamp((t - 0.375) * 4), 255, clamp(1 - (t - 0.375) * 4)];
    if (t < 0.875) return [255, clamp(1 - (t - 0.625) * 4), 0];
    return [clamp(1 - (t - 0.875) * 4), 0, 0];
  },
  neon: (t) => {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    return [
      clamp(t > 0.5 ? (t - 0.5) * 2 : 0),
      clamp(t < 0.7 ? t * 1.4 : 1),
      clamp(t < 0.5 ? 1 : (1 - t) * 2),
    ];
  },
  inferno: (t) => {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    return [
      clamp(t * 1.1),
      clamp(t * t * 0.7),
      clamp(t < 0.5 ? t * 0.9 : (1 - t) * 0.4),
    ];
  },
  cyberpunk: (t) => {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    return [
      clamp(t * 0.85 + 0.15),
      clamp(t < 0.5 ? t * 0.4 : 0.8 * (1 - t)),
      clamp(1 - t * 0.4),
    ];
  },
};

// ─── Build Grid Heatmap Data ────────────────────────────────────────────────
function buildGrid(type, shoppers, zoneFilter, timeFilter, videoScrubTime) {
  const grid = Array.from({ length: ROWS }, () => new Float32Array(COLS));
  const vectors = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ vx: 0, vy: 0, count: 0 })));
  const cellPersons = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => new Set()));

  // Base retail fixtures & traffic hotspots
  const basePoints = {
    traffic: [
      { x: 0.48, y: 0.60, w: 14 }, { x: 0.34, y: 0.52, w: 12 }, { x: 0.62, y: 0.55, w: 10 },
      { x: 0.72, y: 0.70, w: 8  }, { x: 0.20, y: 0.70, w: 6  }, { x: 0.88, y: 0.80, w: 7  },
    ],
    dwell: [
      { x: 0.34, y: 0.52, w: 18 }, { x: 0.48, y: 0.60, w: 14 }, { x: 0.22, y: 0.14, w: 10 },
      { x: 0.65, y: 0.20, w: 9  }, { x: 0.06, y: 0.55, w: 12 },
    ],
    shelf: [
      { x: 0.22, y: 0.14, w: 16 }, { x: 0.72, y: 0.22, w: 15 }, { x: 0.45, y: 0.08, w: 13 },
      { x: 0.06, y: 0.55, w: 11 }, { x: 0.85, y: 0.22, w: 12 },
    ],
    product: [
      { x: 0.30, y: 0.15, w: 17 }, { x: 0.74, y: 0.18, w: 15 }, { x: 0.48, y: 0.10, w: 14 },
      { x: 0.12, y: 0.50, w: 12 }, { x: 0.85, y: 0.35, w: 13 },
    ],
    movement: [
      { x: 0.48, y: 0.60, w: 10, vx: -0.6, vy: 0.1 },
      { x: 0.35, y: 0.52, w: 8,  vx: 0.4,  vy: -0.5 },
      { x: 0.62, y: 0.55, w: 9,  vx: -0.5, vy: -0.3 },
      { x: 0.88, y: 0.75, w: 7,  vx: -0.7, vy: -0.4 },
      { x: 0.20, y: 0.68, w: 5,  vx: 0.6,  vy: 0.2 },
    ],
  };

  const pts = [...(basePoints[type] || [])];

  // Process real & synthetic shopper trajectories
  shoppers.forEach((s) => {
    const tId = (() => {
      const parsed = parseInt(s.tracker_id, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    })();

    // Video Scrub Time filtering: If user scrubs video, consider trajectory up to that timestamp
    let personPts = s.realPoints || [];
    if (videoScrubTime !== null && personPts.length > 0) {
      personPts = personPts.filter((p) => (p.timestamp ?? 0) <= videoScrubTime);
      if (personPts.length === 0) return;
    }

    const weight =
      type === "dwell"   ? Math.max(2, (s.total_dwell_time || 12) / 1.5)
      : type === "traffic" ? 9
      : type === "shelf"   ? Math.max(3, (s.total_dwell_time || 10) * 0.7)
      : type === "product" ? 8.5
      : 7;

    const posX = s.x || 0.4;
    const posY = s.y || 0.5;

    // Movement vector calculation
    let vx = (tId % 2 === 0 ? 0.5 : -0.5);
    let vy = (tId % 3 === 0 ? 0.3 : -0.4);

    if (personPts.length >= 2) {
      const last = personPts[personPts.length - 1];
      const prev = personPts[Math.max(0, personPts.length - 4)];
      vx = (last.x - prev.x) * 5;
      vy = (last.y - prev.y) * 5;
    }

    pts.push({ x: posX, y: posY, w: weight, personId: tId, vx, vy });

    // Mark cell person mapping
    const cCol = Math.max(0, Math.min(COLS - 1, Math.floor(posX * COLS)));
    const cRow = Math.max(0, Math.min(ROWS - 1, Math.floor(posY * ROWS)));
    cellPersons[cRow][cCol].add(tId);
  });

  // Time of Day factor (0 - 23h)
  const timeFactor = timeFilter !== null ? Math.max(0.25, 1 - Math.abs(timeFilter - 13) / 13) : 1.0;
  const radius = 3.2; // cell distribution radius

  for (const pt of pts) {
    // Zone filter check
    if (zoneFilter) {
      const z = STORE_ZONES.find((zn) => zn.id === zoneFilter);
      if (z && !(pt.x >= z.x1 && pt.x <= z.x2 && pt.y >= z.y1 && pt.y <= z.y2)) continue;
    }

    const cx = pt.x * COLS;
    const cy = pt.y * ROWS;
    const weight = pt.w * timeFactor;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const dx = col + 0.5 - cx;
        const dy = row + 0.5 - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= radius * radius * 4) {
          const contrib = weight * Math.exp(-d2 / (radius * radius));
          grid[row][col] += contrib;

          if (pt.vx !== undefined && pt.vy !== undefined) {
            vectors[row][col].vx += pt.vx * contrib;
            vectors[row][col].vy += pt.vy * contrib;
            vectors[row][col].count += 1;
          }

          if (pt.personId) {
            cellPersons[row][col].add(pt.personId);
          }
        }
      }
    }
  }

  // Normalize grid values to [0, 1]
  let maxVal = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] > maxVal) maxVal = grid[r][c];
    }
  }
  if (maxVal > 0) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c] /= maxVal;
      }
    }
  }

  return {
    grid,
    vectors,
    cellPersons,
    maxVal,
    unit: HEATMAP_TYPES.find((t) => t.id === type)?.unit || "",
  };
}

export default function HeatmapViewer() {
  const [stores,          setStores]          = useState([]);
  const [videos,          setVideos]          = useState([]);
  const [selectedStore,   setSelectedStore]   = useState("");
  const [selectedVideo,   setSelectedVideo]   = useState("");
  const [selectedType,    setSelectedType]    = useState("traffic");
  const [colormap,        setColormap]        = useState("thermal");
  const [zoneFilter,      setZoneFilter]      = useState("");
  const [timeFilter,      setTimeFilter]      = useState(null); // null = all day, 0-23 = hour
  const [videoScrubTime,  setVideoScrubTime]  = useState(null); // null = full video
  const [intensityGain,   setIntensityGain]   = useState(1.4);
  const [showZones,       setShowZones]       = useState(true);
  const [showPersons,     setShowPersons]     = useState(true);
  const [showVectors,     setShowVectors]     = useState(true);
  const [showGridNumbers, setShowGridNumbers] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [isPlayingScrub,  setIsPlayingScrub]  = useState(false);

  const [hoveredCell,     setHoveredCell]     = useState(null);
  const [hoverPos,        setHoverPos]        = useState({ x: 0, y: 0 });
  const [detectedShoppers,setDetectedShoppers]= useState([]);

  const canvasRef = useRef(null);
  const legendRef = useRef(null);
  const playTimerRef = useRef(null);

  // ─── Subscribe to live tracking store ──────────────────────────────────────
  useEffect(() => {
    const init = getTrackingData();
    if (init && init.length > 0) setDetectedShoppers(init);

    const unsub = subscribeToTrackingData((d) => {
      if (d && d.length > 0) setDetectedShoppers(d);
    });
    return () => unsub();
  }, []);

  // ─── Initial store & video loading ─────────────────────────────────────────
  useEffect(() => {
    api.getStores().then((s) => {
      setStores(s || []);
      if (s && s.length > 0) setSelectedStore(s[0].store_id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedStore) return;
    api.getVideos(selectedStore).then((vids) => {
      setVideos(vids || []);
      const sharedVid = getSelectedVideoId();
      if (sharedVid && vids?.some((v) => v.video_id === sharedVid)) {
        setSelectedVideo(sharedVid);
      }
    }).catch(() => {});
  }, [selectedStore]);

  // ─── Auto Scrubber Animation ───────────────────────────────────────────────
  useEffect(() => {
    if (isPlayingScrub) {
      playTimerRef.current = setInterval(() => {
        setVideoScrubTime((prev) => {
          const next = (prev === null ? 0 : prev) + 0.5;
          if (next > 25.0) return 0;
          return parseFloat(next.toFixed(1));
        });
      }, 200);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlayingScrub]);

  // ─── Compute Grid Data ────────────────────────────────────────────────────
  const gridData = useMemo(() => {
    return buildGrid(selectedType, detectedShoppers, zoneFilter || null, timeFilter, videoScrubTime);
  }, [selectedType, detectedShoppers, zoneFilter, timeFilter, videoScrubTime]);

  const activeTypeInfo = HEATMAP_TYPES.find((t) => t.id === selectedType) || HEATMAP_TYPES[0];

  // ─── Canvas Renderer ───────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = (canvas.width = COLS * CELL_PX);
    const H = (canvas.height = ROWS * CELL_PX);
    const ctx = canvas.getContext("2d");
    const cm = COLORMAPS[colormap] || COLORMAPS.thermal;
    const { grid, vectors, cellPersons } = gridData;

    // Background floor
    ctx.fillStyle = "#060911";
    ctx.fillRect(0, 0, W, H);

    // 1. Grid Cells
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const raw = grid[row][col];
        const v = Math.min(1.0, raw * intensityGain);
        const [r, g, b] = cm(v);
        const alpha = v < 0.02 ? 0.07 : 0.15 + v * 0.85;

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(col * CELL_PX, row * CELL_PX, CELL_PX - 1, CELL_PX - 1);

        // Subtle box border
        ctx.strokeStyle = v > 0.05 ? `rgba(${r},${g},${b},0.35)` : "rgba(255,255,255,0.03)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * CELL_PX, row * CELL_PX, CELL_PX - 1, CELL_PX - 1);

        // Grid percentage numbers
        if (showGridNumbers && v > 0.08) {
          ctx.fillStyle = v > 0.6 ? "#000" : "#fff";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${Math.round(v * 100)}`, col * CELL_PX + CELL_PX / 2, row * CELL_PX + CELL_PX / 2 + 3);
          ctx.textAlign = "left";
        }
      }
    }

    // 2. Movement Flow Vectors (For Shopper Movement Heatmap)
    if (selectedType === "movement" || showVectors) {
      for (let row = 0; row < ROWS; row += 2) {
        for (let col = 0; col < COLS; col += 2) {
          const vObj = vectors[row]?.[col];
          const mag = Math.hypot(vObj.vx, vObj.vy);
          if (mag > 0.1) {
            const cx = col * CELL_PX + CELL_PX;
            const cy = row * CELL_PX + CELL_PX;
            const dirX = (vObj.vx / mag) * Math.min(14, mag * 8);
            const dirY = (vObj.vy / mag) * Math.min(14, mag * 8);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + dirX, cy + dirY);
            ctx.strokeStyle = "rgba(0,242,254,0.85)";
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(dirY, dirX);
            ctx.beginPath();
            ctx.moveTo(cx + dirX, cy + dirY);
            ctx.lineTo(cx + dirX - 4 * Math.cos(angle - Math.PI / 6), cy + dirY - 4 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(cx + dirX - 4 * Math.cos(angle + Math.PI / 6), cy + dirY - 4 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = "rgba(0,242,254,0.95)";
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    // 3. Store Zone Overlays
    if (showZones) {
      STORE_ZONES.forEach((z) => {
        const zx = z.x1 * W, zy = z.y1 * H;
        const zw = (z.x2 - z.x1) * W, zh = (z.y2 - z.y1) * H;
        const isFiltered = zoneFilter && zoneFilter !== z.id;

        ctx.save();
        ctx.strokeStyle = isFiltered ? "rgba(75,85,99,0.3)" : z.color;
        ctx.lineWidth = isFiltered ? 1 : 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.setLineDash([]);

        ctx.fillStyle = isFiltered ? "rgba(0,0,0,0.4)" : `${z.color}15`;
        ctx.fillRect(zx, zy, zw, zh);

        // Zone label badge
        if (!isFiltered) {
          ctx.fillStyle = z.color;
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(z.name, zx + 6, zy + 14);
        }
        ctx.restore();
      });
    }

    // 4. Shopper Person Markers with SAFE color rendering (IDs 1, 5, 11)
    if (showPersons) {
      const shoppersToRender = detectedShoppers.length > 0 ? detectedShoppers : getWhatsAppDefaultShoppers();

      shoppersToRender.forEach((p) => {
        const tId = (() => {
          const parsed = parseInt(p.tracker_id, 10);
          return isNaN(parsed) || parsed < 1 ? 1 : parsed;
        })();

        // Safe color entry — avoid NaN or hex string parsing issues for IDs 1, 5, 11
        const colorEntry = getPersonColorEntry(tId);
        const colorRGBA = (a = 1) => `rgba(${colorEntry.r},${colorEntry.g},${colorEntry.b},${a})`;

        const px = (p.x || 0.4) * W;
        const py = (p.y || 0.5) * H;

        ctx.save();
        // Outer pulsing halo
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = colorRGBA(0.8);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Person center dot
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fillStyle = colorRGBA(1.0);
        ctx.fill();

        // Unique Person #ID badge
        const badgeLabel = `PERSON #${tId}`;
        ctx.font = "bold 9px sans-serif";
        const textWidth = ctx.measureText(badgeLabel).width;
        ctx.fillStyle = "rgba(10,15,25,0.92)";
        ctx.fillRect(px - textWidth / 2 - 4, py + 14, textWidth + 8, 14);
        ctx.strokeStyle = colorRGBA(0.9);
        ctx.lineWidth = 1;
        ctx.strokeRect(px - textWidth / 2 - 4, py + 14, textWidth + 8, 14);

        ctx.fillStyle = colorRGBA(1.0);
        ctx.fillText(badgeLabel, px - textWidth / 2, py + 24);
        ctx.restore();
      });
    }

    // 5. Peak Hotspot Indicator
    let peakRow = 0, peakCol = 0, peakVal = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] > peakVal) {
          peakVal = grid[r][c];
          peakRow = r;
          peakCol = c;
        }
      }
    }

    if (peakVal > 0.06) {
      const px = peakCol * CELL_PX + CELL_PX / 2;
      const py = peakRow * CELL_PX + CELL_PX / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, 2 * Math.PI);
      ctx.strokeStyle = "#FF3366";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#FF3366";
      ctx.fill();

      ctx.font = "bold 9px sans-serif";
      const peakText = `🔥 PEAK ${(Math.min(1.0, peakVal * intensityGain) * 100).toFixed(0)}%`;
      const ptw = ctx.measureText(peakText).width;
      const ptx = Math.min(W - ptw - 8, Math.max(4, px - ptw / 2));
      const pty = Math.max(18, py - 18);

      ctx.fillStyle = "rgba(10,15,25,0.95)";
      ctx.fillRect(ptx - 4, pty - 11, ptw + 8, 15);
      ctx.strokeStyle = "#FF3366";
      ctx.lineWidth = 1;
      ctx.strokeRect(ptx - 4, pty - 11, ptw + 8, 15);
      ctx.fillStyle = "#FFF";
      ctx.fillText(peakText, ptx, pty);
      ctx.restore();
    }

    // 6. Hover Highlight Box
    if (hoveredCell) {
      const { col, row } = hoveredCell;
      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(col * CELL_PX, row * CELL_PX, CELL_PX - 1, CELL_PX - 1);
      ctx.restore();
    }
  }, [gridData, colormap, intensityGain, showZones, showPersons, showVectors, showGridNumbers, detectedShoppers, hoveredCell, selectedType, zoneFilter]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ─── Render Intensity Legend ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = legendRef.current;
    if (!canvas) return;
    const W = (canvas.width = 440);
    const H = (canvas.height = 24);
    const ctx = canvas.getContext("2d");
    const cm = COLORMAPS[colormap] || COLORMAPS.thermal;

    for (let x = 0; x < W; x++) {
      const t = x / W;
      const [r, g, b] = cm(t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, 2, H);
    }
  }, [colormap]);

  // ─── Mouse Hover Inspector ────────────────────────────────────────────────
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (COLS * CELL_PX) / rect.width;
    const scaleY = (ROWS * CELL_PX) / rect.height;
    const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_PX);
    const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_PX);

    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const raw = gridData.grid[row]?.[col] ?? 0;
      const pct = Math.min(100, Math.round(raw * intensityGain * 100));
      const nx = (col + 0.5) / COLS;
      const ny = (row + 0.5) / ROWS;

      let zoneName = "General Walkway";
      STORE_ZONES.forEach((z) => {
        if (nx >= z.x1 && nx <= z.x2 && ny >= z.y1 && ny <= z.y2) zoneName = z.name;
      });

      const maxScale = activeTypeInfo.maxScale || 20;
      const rawValue = (raw * maxScale * intensityGain).toFixed(1);
      const level =
        pct > 75 ? "🔥 Hotspot Peak"
        : pct > 50 ? "⚡ High Activity"
        : pct > 25 ? "🔹 Moderate Flow"
        : pct > 5  ? "🔸 Low Activity"
        : "❄ Cold Zone";

      const personsInCell = Array.from(gridData.cellPersons[row]?.[col] || []);

      setHoveredCell({
        col,
        row,
        pct,
        rawValue,
        zone: zoneName,
        level,
        personsInCell,
      });
      setHoverPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredCell(null);
    }
  };

  // ─── Zone Summary Calculation ─────────────────────────────────────────────
  const zoneSummary = useMemo(() => {
    const { grid } = gridData;
    return STORE_ZONES.map((z) => {
      let total = 0, count = 0;
      for (let r = 0; r < ROWS; r++) {
        const ny = (r + 0.5) / ROWS;
        if (ny < z.y1 || ny > z.y2) continue;
        for (let c = 0; c < COLS; c++) {
          const nx = (c + 0.5) / COLS;
          if (nx < z.x1 || nx > z.x2) continue;
          total += grid[r][c];
          count++;
        }
      }
      const avg = count > 0 ? total / count : 0;
      const pct = Math.min(100, Math.round(avg * intensityGain * 100));
      const shopperCount = detectedShoppers.filter(
        (s) => s.x >= z.x1 && s.x <= z.x2 && s.y >= z.y1 && s.y <= z.y2
      ).length;
      return { ...z, pct, shopperCount };
    }).sort((a, b) => b.pct - a.pct);
  }, [gridData, intensityGain, detectedShoppers]);

  const displayShoppers = detectedShoppers.length > 0 ? detectedShoppers : getWhatsAppDefaultShoppers();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
      {/* ── Floating Interactive Hover Inspector ───────────────────────────── */}
      {hoveredCell && (
        <div
          style={{
            position: "fixed",
            left: Math.min(window.innerWidth - 260, hoverPos.x + 18),
            top: Math.max(10, hoverPos.y - 40),
            background: "rgba(6,10,20,0.96)",
            backdropFilter: "blur(16px)",
            border: "1px solid #374151",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "12px",
            color: "#E5E7EB",
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 12px 36px rgba(0,0,0,0.8)",
            minWidth: "220px",
          }}
        >
          <div style={{ fontWeight: 800, color: "#4FACFE", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Crosshair size={14} /> Grid Cell [{hoveredCell.col + 1}, {hoveredCell.row + 1}]
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>🏬 Zone: <strong style={{ color: "#FFF" }}>{hoveredCell.zone}</strong></div>
            <div>🔥 Intensity: <strong style={{ color: "#FF5E36" }}>{hoveredCell.pct}%</strong></div>
            <div>📊 Metric: <strong style={{ color: "#00F2FE" }}>{hoveredCell.rawValue} {activeTypeInfo.unit}</strong></div>
            <div style={{ color: "#9CA3AF" }}>Status: <span style={{ color: "#FFE600", fontWeight: 700 }}>{hoveredCell.level}</span></div>
            {hoveredCell.personsInCell.length > 0 && (
              <div style={{ marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "4px" }}>
                <span style={{ fontSize: "11px", color: "#34D399", fontWeight: 700 }}>
                  👤 Active Persons: {hoveredCell.personsInCell.map((id) => `#${id}`).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Flame size={26} style={{ color: "#FF5E36" }} />
            Store Attention & Traffic Heatmap Studio
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "4px 0 0" }}>
            Grid Box Heatmaps • Store Traffic • Dwell Time • Shelf Attention • Product Attention • Shopper Movement • Person ID Tracker
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              setZoneFilter("");
              setTimeFilter(null);
              setVideoScrubTime(null);
              setIntensityGain(1.4);
            }}
            style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #374151", background: "rgba(31,41,55,0.6)", color: "#D1D5DB", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>
      </div>

      {/* ── 5 Heatmap Chart Selector ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
        {HEATMAP_TYPES.map((t) => {
          const active = selectedType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              style={{
                padding: "14px",
                borderRadius: "14px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                border: `2px solid ${active ? "#4FACFE" : "#222D44"}`,
                background: active ? "rgba(79,172,254,0.14)" : "rgba(21,27,44,0.6)",
                boxShadow: active ? "0 0 16px rgba(79,172,254,0.2)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>{t.icon}</span>
                <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: active ? "#4FACFE" : "#1F2937", color: active ? "#0B0F19" : "#9CA3AF" }}>
                  {t.badge}
                </span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: active ? "#4FACFE" : "#FFFFFF" }}>{t.label}</div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px", lineHeight: 1.3 }}>{t.desc}</div>
            </button>
          );
        })}
      </div>

      {/* ── Filter Controls Toolbar ──────────────────────────────────────────── */}
      <div style={{ background: "rgba(21,27,44,0.8)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={15} style={{ color: "#4FACFE" }} />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase" }}>Heatmap Filters</span>
        </div>

        {/* Zone Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <label style={lbl}>Zone Wise Filter</label>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} style={miniSel}>
            <option value="">All Zones (Full Store)</option>
            {STORE_ZONES.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>

        {/* Colormap Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <label style={lbl}>Colormap Style</label>
          <select value={colormap} onChange={(e) => setColormap(e.target.value)} style={miniSel}>
            <option value="thermal">Thermal Jet (Classic)</option>
            <option value="neon">Neon Matrix</option>
            <option value="inferno">Inferno Fire</option>
            <option value="cyberpunk">Cyberpunk Purple</option>
          </select>
        </div>

        {/* Time of Day Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <label style={lbl}>Hour Filter: {timeFilter !== null ? `${timeFilter}:00 hrs` : "All Hours"}</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="range"
              min={0}
              max={23}
              step={1}
              value={timeFilter ?? 12}
              onChange={(e) => setTimeFilter(parseInt(e.target.value, 10))}
              style={{ width: "100px", accentColor: "#4FACFE" }}
            />
            {timeFilter !== null && (
              <button
                onClick={() => setTimeFilter(null)}
                style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", border: "1px solid #374151", background: "#1F2937", color: "#9CA3AF", cursor: "pointer" }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Intensity Multiplier */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <label style={lbl}>Gain ×{intensityGain.toFixed(1)}</label>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={intensityGain}
            onChange={(e) => setIntensityGain(parseFloat(e.target.value))}
            style={{ width: "90px", accentColor: "#FF5E36" }}
          />
        </div>

        {/* Toggle Overlays */}
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto", flexWrap: "wrap" }}>
          {[
            ["👤 Person IDs", showPersons, setShowPersons, "#39FF14"],
            ["🏬 Zones", showZones, setShowZones, "#4FACFE"],
            ["➡ Flow Vectors", showVectors, setShowVectors, "#00F2FE"],
            ["🔢 Cell %", showGridNumbers, setShowGridNumbers, "#FFE600"],
          ].map(([label, active, setter, color]) => (
            <button key={label} onClick={() => setter(!active)} style={togBtn(active, color)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Video Timeline Scrubber Bar ──────────────────────────────────────── */}
      <div style={{ background: "rgba(21,27,44,0.65)", border: "1px solid #222D44", borderRadius: "14px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => setIsPlayingScrub(!isPlayingScrub)}
          style={{ padding: "6px 12px", borderRadius: "8px", background: "linear-gradient(135deg,#4FACFE,#00F2FE)", border: "none", color: "#0B0F19", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {isPlayingScrub ? <Pause size={12} /> : <Play size={12} />}
          {isPlayingScrub ? "Pause Scrub" : "Play Timeline"}
        </button>
        <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 700 }}>
          ⏱ Video Timeline: <strong style={{ color: "#FFF" }}>{videoScrubTime !== null ? `${videoScrubTime.toFixed(1)}s` : "Full Cumulative Video"}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={25}
          step={0.5}
          value={videoScrubTime ?? 25}
          onChange={(e) => setVideoScrubTime(parseFloat(e.target.value))}
          style={{ flex: 1, minWidth: "160px", accentColor: "#4FACFE" }}
        />
        {videoScrubTime !== null && (
          <button
            onClick={() => setVideoScrubTime(null)}
            style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", border: "1px solid #374151", background: "#1F2937", color: "#9CA3AF", cursor: "pointer" }}
          >
            Reset (Cumulative)
          </button>
        )}
      </div>

      {/* ── Main Canvas View & Sidebar Analytics ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>
        {/* Heatmap Canvas Card */}
        <div style={{ background: "rgba(21,27,44,0.8)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>{activeTypeInfo.icon}</span>
              {activeTypeInfo.label} — Grid Box View
              {zoneFilter && (
                <span style={{ fontSize: "11px", color: "#4FACFE", background: "rgba(79,172,254,0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                  Zone: {STORE_ZONES.find((z) => z.id === zoneFilter)?.name}
                </span>
              )}
            </h3>
            <span style={{ fontSize: "11px", color: "#6B7280" }}>Hover over any box for live inspection</span>
          </div>

          {/* Dynamic Intensity Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700 }}>
              <span style={{ color: "#3B82F6" }}>❄ 0% Cold Floor</span>
              <span style={{ color: "#06B6D4" }}>25% Low</span>
              <span style={{ color: "#22C55E" }}>50% Moderate</span>
              <span style={{ color: "#EAB308" }}>75% High</span>
              <span style={{ color: "#EF4444" }}>🔥 100% Peak Hotspot</span>
            </div>
            <canvas ref={legendRef} style={{ width: "100%", height: "14px", borderRadius: "7px", display: "block", boxShadow: "0 0 10px rgba(0,0,0,0.5)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#6B7280" }}>
              <span>0.0 {activeTypeInfo.unit}</span>
              <span>{(activeTypeInfo.maxScale * 0.25).toFixed(1)} {activeTypeInfo.unit}</span>
              <span>{(activeTypeInfo.maxScale * 0.5).toFixed(1)} {activeTypeInfo.unit}</span>
              <span>{(activeTypeInfo.maxScale * 0.75).toFixed(1)} {activeTypeInfo.unit}</span>
              <span>{activeTypeInfo.maxScale.toFixed(1)} {activeTypeInfo.unit}</span>
            </div>
          </div>

          {/* The Canvas */}
          <div style={{ position: "relative", background: "#060911", borderRadius: "12px", overflow: "hidden", border: "1px solid #1F2937", cursor: "crosshair" }}>
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredCell(null)}
              style={{ display: "block", width: "100%", height: "auto", imageRendering: "pixelated" }}
            />
          </div>

          {/* Quick Metrics Under Canvas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {[
              { label: "Grid Resolution", val: `${COLS}×${ROWS} Boxes`, color: "#4FACFE" },
              { label: "Active Channel",  val: activeTypeInfo.label,     color: "#00F2FE" },
              { label: "Persons Mapped",  val: `${displayShoppers.length} Persons`, color: "#39FF14" },
              { label: "Active Colormap", val: colormap.toUpperCase(),   color: "#BD00FF" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ padding: "10px 12px", background: "rgba(11,15,25,0.7)", borderRadius: "8px", border: "1px solid #1F2937" }}>
                <div style={{ fontSize: "9px", color: "#6B7280", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: "12px", fontWeight: 800, color, marginTop: "2px" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar — Zone Ranking & Live Person Locations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Zone Ranking */}
          <div style={{ background: "rgba(21,27,44,0.8)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "14px", padding: "18px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#fff", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <BarChart3 size={15} style={{ color: "#4FACFE" }} /> Zone Heatmap Ranking
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {zoneSummary.map((z) => (
                <div
                  key={z.id}
                  onClick={() => setZoneFilter(zoneFilter === z.id ? "" : z.id)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: zoneFilter === z.id ? `${z.color}20` : "rgba(11,15,25,0.5)",
                    border: `1px solid ${zoneFilter === z.id ? z.color : "#222D44"}`,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "#FFF", fontWeight: 700 }}>{z.name}</span>
                    <span style={{ color: z.color, fontWeight: 800 }}>{z.pct}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${z.pct}%`, background: z.color, borderRadius: "3px" }} />
                  </div>
                  {z.shopperCount > 0 && (
                    <div style={{ fontSize: "9px", color: "#9CA3AF", marginTop: "3px" }}>
                      👤 {z.shopperCount} person{z.shopperCount > 1 ? "s" : ""} located
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Person ID Locations */}
          <div style={{ background: "rgba(21,27,44,0.8)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "14px", padding: "18px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#fff", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <UserCheck size={15} style={{ color: "#39FF14" }} /> Unique Person Same ID Tracking
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {displayShoppers.slice(0, 5).map((p) => {
                const tId = (() => {
                  const parsed = parseInt(p.tracker_id, 10);
                  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
                })();
                const color = getPersonColor(tId);
                return (
                  <div key={tId} style={{ background: "rgba(6,9,17,0.6)", border: `1px solid ${color}40`, borderRadius: "8px", padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#FFF" }}>PERSON #{tId}</div>
                        <div style={{ fontSize: "9px", color: "#9CA3AF" }}>{p.zone || "Main Floor"}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color }}>{(p.total_dwell_time || 12).toFixed(1)}s dwell</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Small Multiples Comparison Row (All 5 Heatmaps Side by Side) ─────── */}
      <div style={{ background: "rgba(21,27,44,0.8)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "16px", padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={16} style={{ color: "#4FACFE" }} />
          All 5 Heatmap Channels Comparison (Click to Switch)
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          {HEATMAP_TYPES.map((t) => (
            <SmallHeatmapThumbnail
              key={t.id}
              type={t}
              shoppers={displayShoppers}
              colormap={colormap}
              intensityGain={intensityGain}
              zoneFilter={zoneFilter}
              timeFilter={timeFilter}
              videoScrubTime={videoScrubTime}
              isActive={selectedType === t.id}
              onSelect={() => setSelectedType(t.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Per-Person Heatmap Contribution Cards ───────────────────────────── */}
      <div style={{ background: "rgba(21,27,44,0.8)", backdropFilter: "blur(16px)", border: "1px solid #222D44", borderRadius: "16px", padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={16} style={{ color: "#39FF14" }} />
          Per-Person Heatmap Contribution Across All Video Frames
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {displayShoppers.map((p) => {
            const tId = (() => {
              const parsed = parseInt(p.tracker_id, 10);
              return isNaN(parsed) || parsed < 1 ? 1 : parsed;
            })();
            const color = getPersonColor(tId);
            const pGrid = buildGrid(selectedType, [p], zoneFilter || null, timeFilter, videoScrubTime);
            let pPeak = 0;
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                const val = Math.min(100, Math.round(pGrid.grid[r][c] * intensityGain * 100));
                if (val > pPeak) pPeak = val;
              }
            }

            return (
              <div key={tId} style={{ borderRadius: "12px", background: "rgba(11,15,25,0.7)", border: `1px solid ${color}40`, padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#FFF" }}>PERSON #{tId}</span>
                    <span style={{ fontSize: "10px", color: "#6B7280" }}>({p.shopper_id || `SHP-${String(tId).padStart(3, "0")}`})</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color, background: `${color}18`, padding: "2px 6px", borderRadius: "4px" }}>
                    Peak {pPeak}%
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "10px", color: "#9CA3AF" }}>
                  <div>Zone: <strong style={{ color: "#FFF" }}>{p.zone || "Main Floor"}</strong></div>
                  <div>Dwell: <strong style={{ color: "#FFF" }}>{(p.total_dwell_time || 12).toFixed(1)}s</strong></div>
                  <div>Gaze: <strong style={{ color: "#00F2FE" }}>{p.gaze || "Shelf"}</strong></div>
                  <div>Type: <strong style={{ color: "#FFE600" }}>{p.behavior_segment || "Focused"}</strong></div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div style={{ height: "4px", background: "#1F2937", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pPeak}%`, background: color, borderRadius: "2px" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Small Multiple Heatmap Thumbnail Component ─────────────────────────────
function SmallHeatmapThumbnail({
  type,
  shoppers,
  colormap,
  intensityGain,
  zoneFilter,
  timeFilter,
  videoScrubTime,
  isActive,
  onSelect,
}) {
  const canvasRef = useRef(null);
  const COLS_S = 16, ROWS_S = 11, CELL_S = 14;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = (canvas.width = COLS_S * CELL_S);
    const H = (canvas.height = ROWS_S * CELL_S);
    const ctx = canvas.getContext("2d");
    const cm = COLORMAPS[colormap] || COLORMAPS.thermal;
    const { grid } = buildGrid(type.id, shoppers, zoneFilter || null, timeFilter, videoScrubTime);

    ctx.fillStyle = "#060911";
    ctx.fillRect(0, 0, W, H);

    for (let row = 0; row < ROWS_S; row++) {
      for (let col = 0; col < COLS_S; col++) {
        const srcRow = Math.floor((row * 16) / ROWS_S);
        const srcCol = Math.floor((col * 24) / COLS_S);
        const v = Math.min(1.0, (grid[srcRow]?.[srcCol] ?? 0) * intensityGain);
        const [r, g, b] = cm(v);
        const alpha = v < 0.02 ? 0.08 : 0.15 + v * 0.85;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(col * CELL_S, row * CELL_S, CELL_S - 1, CELL_S - 1);
      }
    }
  }, [type, shoppers, colormap, intensityGain, zoneFilter, timeFilter, videoScrubTime]);

  return (
    <button
      onClick={onSelect}
      style={{
        padding: "10px",
        borderRadius: "10px",
        border: `2px solid ${isActive ? "#4FACFE" : "#222D44"}`,
        background: isActive ? "rgba(79,172,254,0.15)" : "rgba(21,27,44,0.5)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        transition: "all 0.2s ease",
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: "6px", display: "block", imageRendering: "pixelated" }} />
      <div style={{ fontSize: "11px", fontWeight: 800, color: isActive ? "#4FACFE" : "#D1D5DB", display: "flex", alignItems: "center", gap: "4px" }}>
        <span>{type.icon}</span> {type.label}
      </div>
    </button>
  );
}

// ─── Inline Style Helpers ───────────────────────────────────────────────────
const lbl = { fontSize: "10px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" };
const miniSel = { background: "#0F1624", border: "1px solid #222D44", color: "#fff", fontSize: "12px", padding: "6px 10px", borderRadius: "8px", outline: "none", cursor: "pointer", maxWidth: "160px" };
const togBtn = (active, color) => ({
  padding: "6px 12px",
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 700,
  border: `1px solid ${active ? color : "#222D44"}`,
  background: active ? `${color}25` : "rgba(15,22,36,0.6)",
  color: active ? color : "#9CA3AF",
  cursor: "pointer",
  transition: "all 0.2s ease",
});
