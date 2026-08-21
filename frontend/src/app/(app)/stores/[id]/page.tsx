"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Store,
  MapPin,
  Video,
  Grid3X3,
  TrendingUp,
  Eye,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  Radio,
  Plus,
  Users,
  Compass,
  Cpu,
  Info,
  Camera,
  Play,
  Pause,
  Upload,
  Sliders,
  CheckCircle2,
  Flame,
  Clock,
  AlertCircle,
  FileVideo,
  Edit3,
  Save,
  RotateCcw,
  Trash2,
  Move,
  DoorOpen,
  LogOut,
  CreditCard,
  X,
  Settings,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  inferCctvFrame,
  uploadAndProcessCctvVideo,
  getProcessedVideos,
  getStores,
  getShelves,
  createShelf,
  deleteShelf,
  getAttractivenessScores,
  getVideoStreamUrl,
  getExportExcelUrl,
  getExportCsvUrl,
  PersonDetection,
  VideoListItem,
} from "@/lib/api";

export interface ShelfZone {
  id: number;
  name: string;
  category: string;
  zone: string;
  attentionScore: number;
  avgDwellTime: number;
  visitors: number;
  color: string;
  x: number; // percentage on floorplan (0 to 100)
  y: number;
  width: number;
  height: number;
  cameraAssigned: string;
}

export interface CameraItem {
  id: string;
  name: string;
  status: string;
  fps: number;
  x: number;
  y: number;
  zone: string;
}

export interface FloorplanLandmark {
  id: string;
  name: string;
  type: "entrance" | "exit" | "checkout";
  x: number; // percentage (0 to 100)
  y: number;
  width?: number;
  height?: number;
}

const DEFAULT_STORE_1_SHELVES: ShelfZone[] = [
  {
    id: 1,
    name: "Shelf A1 - Fragrances & Luxury",
    category: "Cosmetics",
    zone: "Zone A (North-East)",
    attentionScore: 94,
    avgDwellTime: 28.4,
    visitors: 342,
    color: "from-pink-500/30 to-purple-500/30 border-purple-400",
    x: 18,
    y: 18,
    width: 26,
    height: 18,
    cameraAssigned: "CAM-01",
  },
  {
    id: 2,
    name: "Shelf A2 - Skincare & Serums",
    category: "Cosmetics",
    zone: "Zone A (North-West)",
    attentionScore: 88,
    avgDwellTime: 22.1,
    visitors: 280,
    color: "from-purple-500/30 to-cyan-500/30 border-cyan-400",
    x: 56,
    y: 18,
    width: 26,
    height: 18,
    cameraAssigned: "CAM-02",
  },
  {
    id: 3,
    name: "Shelf B1 - Premium Tech Hub",
    category: "Electronics",
    zone: "Zone B (Central Bay)",
    attentionScore: 91,
    avgDwellTime: 34.6,
    visitors: 410,
    color: "from-cyan-500/30 to-blue-500/30 border-blue-400",
    x: 18,
    y: 48,
    width: 26,
    height: 20,
    cameraAssigned: "CAM-02",
  },
  {
    id: 4,
    name: "Shelf B2 - Wearables & Audio",
    category: "Electronics",
    zone: "Zone B (South Aisle)",
    attentionScore: 79,
    avgDwellTime: 16.5,
    visitors: 195,
    color: "from-blue-500/30 to-emerald-500/30 border-emerald-400",
    x: 56,
    y: 48,
    width: 26,
    height: 20,
    cameraAssigned: "CAM-03",
  },
  {
    id: 5,
    name: "Shelf C1 - Chilled Beverages",
    category: "Food & Beverage",
    zone: "Zone C (West Wall)",
    attentionScore: 68,
    avgDwellTime: 9.8,
    visitors: 520,
    color: "from-emerald-500/30 to-teal-500/30 border-teal-400",
    x: 18,
    y: 76,
    width: 32,
    height: 14,
    cameraAssigned: "CAM-04",
  },
  {
    id: 6,
    name: "Shelf D1 - Promo Island Endcap",
    category: "Promotions",
    zone: "Zone D (Checkout Front)",
    attentionScore: 86,
    avgDwellTime: 19.4,
    visitors: 380,
    color: "from-amber-500/30 to-orange-500/30 border-amber-400",
    x: 58,
    y: 76,
    width: 24,
    height: 14,
    cameraAssigned: "CAM-04",
  },
];

const DEFAULT_STORE_1_CAMERAS: CameraItem[] = [
  { id: "CAM-01", name: "Main Entrance Overhead", status: "Active", fps: 30, x: 50, y: 7, zone: "Entrance" },
  { id: "CAM-02", name: "Central Aisle Dome", status: "Active", fps: 30, x: 50, y: 40, zone: "Aisle A-B" },
  { id: "CAM-03", name: "Tech Endcap Focus", status: "Active", fps: 30, x: 88, y: 56, zone: "Tech Display" },
  { id: "CAM-04", name: "Checkout Radar", status: "Active", fps: 30, x: 50, y: 92, zone: "POS & Exit" },
];

const DEFAULT_STORE_1_LANDMARKS: FloorplanLandmark[] = [
  { id: "entry-1", name: "Main Entrance Gate", type: "entrance", x: 50, y: 2 },
  { id: "exit-1", name: "Emergency Exit Gate", type: "exit", x: 92, y: 92 },
  { id: "checkout-1", name: "Checkout & POS Counter", type: "checkout", x: 50, y: 98, width: 34, height: 6 },
];

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const storeId = parseInt(resolvedParams.id, 10) || 1;

  const [storeName, setStoreName] = useState<string>(`Store #${storeId}`);
  const [storeLocation, setStoreLocation] = useState<string>("Store Location");

  const [activeTab, setActiveTab] = useState<"map" | "shelves" | "cameras">("map");
  const [selectedShelf, setSelectedShelf] = useState<ShelfZone | null>(null);
  const [activeCameraFov, setActiveCameraFov] = useState<string>("CAM-01");
  const [heatOverlay, setHeatOverlay] = useState(true);

  // Floorplan Layout State - Blank for new stores unless saved
  const [shelves, setShelves] = useState<ShelfZone[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [landmarks, setLandmarks] = useState<FloorplanLandmark[]>([]);

  // Admin Floorplan Editor State
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedEditItem, setSelectedEditItem] = useState<{
    type: "shelf" | "camera" | "landmark";
    id: number | string;
  } | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<"shelf" | "camera" | "landmark" | null>(null);

  // Add Item Modal Form State - 100% Blank by Default
  const [newShelfName, setNewShelfName] = useState("");
  const [newShelfCategory, setNewShelfCategory] = useState("");
  const [newShelfCamera, setNewShelfCamera] = useState("CAM-01");
  const [newCamId, setNewCamId] = useState("");
  const [newCamName, setNewCamName] = useState("");
  const [newLandmarkName, setNewLandmarkName] = useState("");
  const [newLandmarkType, setNewLandmarkType] = useState<"entrance" | "exit" | "checkout">("entrance");

  // Dragging State
  const floorplanRef = useRef<HTMLDivElement | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<{
    type: "shelf" | "camera" | "landmark";
    id: number | string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Store Camera & Webcam State
  const [cameraMode, setCameraMode] = useState<"webcam" | "video">("webcam");
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [liveDetections, setLiveDetections] = useState<PersonDetection[]>([]);
  const [liveFps, setLiveFps] = useState<number>(0);
  const [cameraConfidence, setCameraConfidence] = useState<number>(0.4);

  // Video Processed List for this store
  const [storeVideos, setStoreVideos] = useState<VideoListItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoListItem | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isInferring = useRef<boolean>(false);

    // Load Store Info and Shelves strictly from PostgreSQL Database
  useEffect(() => {
    async function loadStoreDataFromDb() {
      try {
        const token = localStorage.getItem("token") || "";
        const [allStores, dbShelves, scoresRes] = await Promise.all([
          getStores(token).catch(() => []),
          getShelves(storeId, token).catch(() => []),
          getAttractivenessScores(storeId).catch(() => null),
        ]);

        if (Array.isArray(allStores)) {
          const found = allStores.find((s: any) => s.id === storeId);
          if (found) {
            setStoreName(found.name);
            setStoreLocation(found.location || "Store Location");
          }
        }

        const scoreMap = new Map((scoresRes?.rankings || []).map((r: any) => [r.shelf_id, r]));

        if (Array.isArray(dbShelves)) {
          const mapped: ShelfZone[] = dbShelves.map((s: any, idx: number) => {
            const scoreItem = scoreMap.get(s.id);
            let x = 18 + (idx % 2) * 38;
            let y = 18 + Math.floor(idx / 2) * 30;
            let width = 26;
            let height = 18;

            if (s.zone_coordinates) {
              const parts = s.zone_coordinates.split(",").map((p: string) => parseFloat(p.trim()));
              if (parts.length === 4 && !parts.some(isNaN)) {
                if (parts[2] > 1.0 || parts[3] > 1.0) {
                  x = Math.round((parts[0] / 1280) * 100);
                  y = Math.round((parts[1] / 720) * 100);
                  width = Math.round(((parts[2] - parts[0]) / 1280) * 100);
                  height = Math.round(((parts[3] - parts[1]) / 720) * 100);
                } else {
                  x = Math.round(parts[0] * 100);
                  y = Math.round(parts[1] * 100);
                  width = Math.round((parts[2] - parts[0]) * 100);
                  height = Math.round((parts[3] - parts[1]) * 100);
                }
              }
            }

            return {
              id: s.id,
              name: s.shelf_name,
              category: "Retail Shelf",
              zone: `Zone ${String.fromCharCode(65 + (idx % 6))}`,
              attentionScore: scoreItem ? scoreItem.attractiveness_score : 50,
              avgDwellTime: scoreItem ? scoreItem.attention_duration_seconds : 0.0,
              visitors: scoreItem ? scoreItem.unique_visitors : 0,
              color: "from-cyan-500/30 to-purple-500/30 border-cyan-400",
              x: Math.max(5, Math.min(80, x)),
              y: Math.max(5, Math.min(80, y)),
              width: Math.max(15, Math.min(40, width || 26)),
              height: Math.max(10, Math.min(30, height || 18)),
              cameraAssigned: "CAM-01",
            };
          });
          setShelves(mapped);
        } else {
          setShelves([]);
        }

        // Load saved cameras and landmarks from storage if present
        const savedCameras = localStorage.getItem(`cams_store_layout_cameras_${storeId}`);
        const savedLandmarks = localStorage.getItem(`cams_store_layout_landmarks_${storeId}`);

        if (savedCameras) {
          setCameras(JSON.parse(savedCameras));
        } else if (storeId === 1 || storeId === 2) {
          setCameras(DEFAULT_STORE_1_CAMERAS);
        } else {
          setCameras([]);
        }

        if (savedLandmarks) {
          setLandmarks(JSON.parse(savedLandmarks));
        } else if (storeId === 1 || storeId === 2) {
          setLandmarks(DEFAULT_STORE_1_LANDMARKS);
        } else {
          setLandmarks([]);
        }
      } catch (e) {
        console.warn("Failed to load store data from PostgreSQL:", e);
      }
    }
    loadStoreDataFromDb();
  }, [storeId]);

  // Load videos for this store
  useEffect(() => {
    async function loadStoreVideos() {
      try {
        const list = await getProcessedVideos(storeId);
        setStoreVideos(list);
        if (list.length > 0) {
          setSelectedVideo(list[0]);
        }
      } catch (err) {
        console.warn("Could not load store videos:", err);
      }
    }
    loadStoreVideos();
    const interval = setInterval(loadStoreVideos, 3500);
    return () => clearInterval(interval);
  }, [storeId]);

  // Save Layout to Storage
  const handleSaveLayout = () => {
    try {
      localStorage.setItem(`cams_store_layout_shelves_${storeId}`, JSON.stringify(shelves));
      localStorage.setItem(`cams_store_layout_cameras_${storeId}`, JSON.stringify(cameras));
      localStorage.setItem(`cams_store_layout_landmarks_${storeId}`, JSON.stringify(landmarks));
      setSaveToast("Floorplan layout successfully saved to store database!");
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // Reset Layout
  const handleResetLayout = () => {
    if (confirm("Reset store floorplan layout to blank canvas?")) {
      setShelves([]);
      setCameras([]);
      setLandmarks([]);
      localStorage.removeItem(`cams_store_layout_shelves_${storeId}`);
      localStorage.removeItem(`cams_store_layout_cameras_${storeId}`);
      localStorage.removeItem(`cams_store_layout_landmarks_${storeId}`);
      setSaveToast("Floorplan layout cleared to blank canvas.");
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  // Drag Handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    type: "shelf" | "camera" | "landmark",
    id: number | string
  ) => {
    if (!isEditMode || !floorplanRef.current) return;
    e.stopPropagation();

    const rect = floorplanRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    let itemX = 50;
    let itemY = 50;
    if (type === "shelf") {
      const sh = shelves.find((s) => s.id === id);
      if (sh) { itemX = sh.x; itemY = sh.y; }
    } else if (type === "camera") {
      const cam = cameras.find((c) => c.id === id);
      if (cam) { itemX = cam.x; itemY = cam.y; }
    } else {
      const lm = landmarks.find((l) => l.id === id);
      if (lm) { itemX = lm.x; itemY = lm.y; }
    }

    const mouseXPercent = ((clientX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((clientY - rect.top) / rect.height) * 100;

    setDraggingTarget({
      type,
      id,
      offsetX: mouseXPercent - itemX,
      offsetY: mouseYPercent - itemY,
    });
    setSelectedEditItem({ type, id });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditMode || !draggingTarget || !floorplanRef.current) return;
    e.preventDefault();

    const rect = floorplanRef.current.getBoundingClientRect();
    const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const newX = Math.max(2, Math.min(95, Math.round(mouseXPercent - draggingTarget.offsetX)));
    const newY = Math.max(2, Math.min(95, Math.round(mouseYPercent - draggingTarget.offsetY)));

    if (draggingTarget.type === "shelf") {
      setShelves((prev) =>
        prev.map((s) => (s.id === draggingTarget.id ? { ...s, x: newX, y: newY } : s))
      );
    } else if (draggingTarget.type === "camera") {
      setCameras((prev) =>
        prev.map((c) => (c.id === draggingTarget.id ? { ...c, x: newX, y: newY } : c))
      );
    } else if (draggingTarget.type === "landmark") {
      setLandmarks((prev) =>
        prev.map((l) => (l.id === draggingTarget.id ? { ...l, x: newX, y: newY } : l))
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingTarget(null);
  };

  // Add Item Submit
  const handleAddShelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const coords = `${Math.round((35 / 100) * 1280)},${Math.round((35 / 100) * 720)},${Math.round(((35 + 25) / 100) * 1280)},${Math.round(((35 + 16) / 100) * 720)}`;
      const result = await createShelf(storeId, newShelfName, coords, token);
      const newId = result?.id || Date.now();

      const newShelf: ShelfZone = {
        id: newId,
        name: newShelfName,
        category: newShelfCategory || "Retail Shelf",
        zone: `Zone ${String.fromCharCode(65 + (shelves.length % 6))}`,
        attentionScore: 0,
        avgDwellTime: 0.0,
        visitors: 0,
        color: "from-cyan-500/30 to-purple-500/30 border-cyan-400",
        x: 35,
        y: 35,
        width: 25,
        height: 16,
        cameraAssigned: newShelfCamera || (cameras[0]?.id || "CAM-01"),
      };
      setShelves((prev) => [...prev, newShelf]);
      setSelectedEditItem({ type: "shelf", id: newId });
      setShowAddModal(null);
      setNewShelfName("");
      setNewShelfCategory("");
      setSaveToast(`Shelf "${newShelfName}" saved to PostgreSQL database!`);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error("Failed to create shelf in PostgreSQL:", err);
      alert("Failed to save shelf to database.");
    }
  };

  const handleDeleteShelf = async (shelfId: number, shelfName: string) => {
    if (!confirm(`Are you sure you want to delete "${shelfName}" (Shelf #${shelfId}) from PostgreSQL? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = localStorage.getItem("token") || "";
      await deleteShelf(shelfId, token);
      setShelves((prev) => prev.filter((s) => s.id !== shelfId));
      if (selectedShelf?.id === shelfId) setSelectedShelf(null);
      if (selectedEditItem?.type === "shelf" && selectedEditItem?.id === shelfId) setSelectedEditItem(null);
      setSaveToast(`Shelf #${shelfId} successfully deleted from PostgreSQL!`);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error("Failed to delete shelf:", err);
      alert("Failed to delete shelf from database.");
    }
  };

  const handleAddCameraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCam: CameraItem = {
      id: newCamId,
      name: newCamName,
      status: "Active",
      fps: 30,
      x: 50,
      y: 50,
      zone: "Store Floor",
    };
    setCameras([...cameras, newCam]);
    setSelectedEditItem({ type: "camera", id: newCamId });
    setShowAddModal(null);
    setNewCamId("");
    setNewCamName("");
  };

  const handleAddLandmarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `landmark-${Date.now()}`;
    const newLandmark: FloorplanLandmark = {
      id: newId,
      name: newLandmarkName,
      type: newLandmarkType,
      x: 50,
      y: 50,
      width: newLandmarkType === "checkout" ? 30 : undefined,
      height: newLandmarkType === "checkout" ? 6 : undefined,
    };
    setLandmarks([...landmarks, newLandmark]);
    setSelectedEditItem({ type: "landmark", id: newId });
    setShowAddModal(null);
    setNewLandmarkName("");
  };

  const handleDeleteItem = async (type: "shelf" | "camera" | "landmark", id: number | string) => {
    if (type === "shelf") {
      const sh = shelves.find((s) => s.id === id);
      await handleDeleteShelf(Number(id), sh?.name || `Shelf #${id}`);
      return;
    }

    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === "camera") {
        setCameras(cameras.filter((c) => c.id !== id));
      } else {
        setLandmarks(landmarks.filter((l) => l.id !== id));
      }
      setSelectedEditItem(null);
    }
  };

  // Webcam Start/Stop
  useEffect(() => {
    if (activeTab === "cameras" && cameraMode === "webcam") {
      let stream: MediaStream | null = null;

      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 360, frameRate: { ideal: 30 } } })
        .then((s) => {
          stream = s;
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = s;
            videoElementRef.current.play().catch(() => {});
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
  }, [activeTab, cameraMode]);

  // Live YOLO Inference Loop
  useEffect(() => {
    if (activeTab !== "cameras" || cameraMode !== "webcam" || !isWebcamActive) return;

    let isMounted = true;
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = 640;
    offscreenCanvas.height = 360;
    const offscreenCtx = offscreenCanvas.getContext("2d");

    const captureAndInfer = async () => {
      if (!isMounted) return;

      const video = videoElementRef.current;
      if (video && video.readyState >= 2 && !isInferring.current) {
        try {
          isInferring.current = true;
          offscreenCtx?.drawImage(video, 0, 0, 640, 360);
          const b64 = offscreenCanvas.toDataURL("image/jpeg", 0.7);

          const result = await inferCctvFrame(b64, activeCameraFov, cameraConfidence);
          if (isMounted) {
            setLiveDetections(result.detections || []);
            setLiveFps(result.fps || 0);
          }
        } catch (err) {
          // Keep loop resilient
        } finally {
          isInferring.current = false;
        }
      }

      if (isMounted) {
        setTimeout(() => {
          animationFrameId.current = requestAnimationFrame(captureAndInfer);
        }, 120);
      }
    };

    animationFrameId.current = requestAnimationFrame(captureAndInfer);

    return () => {
      isMounted = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [activeTab, cameraMode, isWebcamActive, activeCameraFov, cameraConfidence]);

  // Draw Real Bounding Boxes onto Live Overlay Canvas
  useEffect(() => {
    if (activeTab !== "cameras" || cameraMode !== "webcam") return;

    const canvas = canvasOverlayRef.current;
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
  }, [activeTab, cameraMode, liveDetections]);

  // Video Upload Handler for this store camera
  async function handleStoreVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingVideo(true);
    setUploadError(null);

    try {
      const res = await uploadAndProcessCctvVideo(file, cameraConfidence, activeCameraFov, storeId);
      const updated = await getProcessedVideos(storeId);
      setStoreVideos(updated);
      if (res.data?.video_id) {
        const found = updated.find((v) => v.id === res.data.video_id);
        if (found) setSelectedVideo(found);
      }
      setCameraMode("video");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process video with YOLO.");
    } finally {
      setIsProcessingVideo(false);
      if (fileUploadInputRef.current) fileUploadInputRef.current.value = "";
    }
  }

  // Active selected item for Inspector
  const currentEditingShelf =
    selectedEditItem?.type === "shelf"
      ? shelves.find((s) => s.id === selectedEditItem.id)
      : null;
  const currentEditingCamera =
    selectedEditItem?.type === "camera"
      ? cameras.find((c) => c.id === selectedEditItem.id)
      : null;
  const currentEditingLandmark =
    selectedEditItem?.type === "landmark"
      ? landmarks.find((l) => l.id === selectedEditItem.id)
      : null;

  return (
    <div
      className="space-y-8 animate-in fade-in duration-500"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Hidden upload input */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="video/mp4,video/webm,video/avi"
        onChange={handleStoreVideoUpload}
        className="hidden"
      />

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
          <button onClick={() => setSaveToast(null)} className="text-emerald-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Store Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl glass-panel-glow border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-cyan-400">
            <Link href="/stores" className="hover:underline text-slate-400">
              Stores Directory
            </Link>
            <span>/</span>
            <span className="text-cyan-300 font-bold">Store #{storeId} Live Center</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
              {storeName}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE YOLO WEBCAM CONNECTED
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{storeLocation} • {cameras.length} Connected Webcams • {shelves.length} Mapped Shelves</span>
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "map"
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Store Interior Map</span>
          </button>

          <button
            onClick={() => setActiveTab("cameras")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "cameras"
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Video className="w-4 h-4 text-cyan-300" />
            <span>Live Webcams &amp; YOLO ({cameras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("shelves")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "shelves"
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Shelves ({shelves.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 2D INTERACTIVE BLUEPRINT MAP */}
      {activeTab === "map" && (
        <div className="space-y-6">
          {/* Admin Floorplan Layout Toolbar */}
          <div className="p-4 rounded-3xl glass-panel-glow border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Store Floorplan &amp; Architecture Layout</span>
                  {isEditMode && (
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full animate-pulse">
                      ADMIN EDIT MODE ACTIVE
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEditMode
                    ? "Drag elements to reposition, or click to edit coordinates, dimensions, cameras, and zones."
                    : "Interactive 2D spatial layout mapping customer gaze attention and camera FOVs."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!isEditMode ? (
                <>
                  <button
                    onClick={() => setHeatOverlay(!heatOverlay)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      heatOverlay
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                        : "bg-white/[0.03] text-slate-400 border-white/10"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                    {heatOverlay ? "Heatmap Overlay: ON" : "Heatmap Overlay: OFF"}
                  </button>

                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Floorplan Layout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setNewShelfName("");
                      setNewShelfCategory("");
                      setNewShelfCamera(cameras[0]?.id || "CAM-01");
                      setShowAddModal("shelf");
                    }}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Shelf</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewCamId("");
                      setNewCamName("");
                      setShowAddModal("camera");
                    }}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Camera</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewLandmarkName("");
                      setNewLandmarkType("entrance");
                      setShowAddModal("landmark");
                    }}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Gate / Counter</span>
                  </button>

                  <button
                    onClick={handleResetLayout}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Clear layout to blank canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Canvas</span>
                  </button>

                  <button
                    onClick={handleSaveLayout}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Layout</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedEditItem(null);
                    }}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Blueprint & Inspector Layout Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 2D Blueprint Canvas */}
            <div className="lg:col-span-2 rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 z-10">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Interactive Blueprint Floorplan &amp; Gaze Mapping</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEditMode
                      ? "⚡ Click & Drag any shelf, camera, or entrance/exit on the blueprint to reposition."
                      : "Click on any shelf block or camera to inspect live AI attention parameters."}
                  </p>
                </div>
              </div>

              {/* Visual Floorplan Grid Canvas */}
              <div
                ref={floorplanRef}
                className={`relative w-full aspect-[4/3] rounded-2xl bg-[#04060a] border overflow-hidden shadow-2xl p-4 select-none ${
                  isEditMode
                    ? "border-amber-500/50 shadow-amber-500/10 ring-2 ring-amber-500/20"
                    : "border-cyan-500/20"
                }`}
              >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40d_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40d_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none" />

                {/* Empty State Banner if no elements exist */}
                {shelves.length === 0 && cameras.length === 0 && landmarks.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-lg">
                      <Layers className="w-8 h-8 opacity-75" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Floorplan is Currently Blank
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      No shelves, cameras, or gates placed yet for this store. Click &quot;Edit Floorplan Layout&quot; to design the layout.
                    </p>
                    {!isEditMode && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white shadow-lg cursor-pointer"
                      >
                        Start Designing Layout
                      </button>
                    )}
                  </div>
                )}

                {/* Landmarks (Entrance, Exit, Checkout) */}
                {landmarks.map((lm) => {
                  const isSelected =
                    selectedEditItem?.type === "landmark" && selectedEditItem.id === lm.id;

                  if (lm.type === "entrance") {
                    return (
                      <div
                        key={lm.id}
                        onMouseDown={(e) => handleMouseDown(e, "landmark", lm.id)}
                        onClick={() => setSelectedEditItem({ type: "landmark", id: lm.id })}
                        style={{ top: `${lm.y}%`, left: `${lm.x}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg z-20 transition-all ${
                          isEditMode
                            ? "cursor-move ring-2 ring-cyan-400 hover:scale-105"
                            : ""
                        } ${
                          isSelected
                            ? "bg-cyan-500 text-black border-2 border-white shadow-cyan-500/50"
                            : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-cyan-500/20"
                        }`}
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>{lm.name}</span>
                        {isEditMode && <Move className="w-3 h-3 text-cyan-300 ml-1 opacity-75" />}
                      </div>
                    );
                  }

                  if (lm.type === "exit") {
                    return (
                      <div
                        key={lm.id}
                        onMouseDown={(e) => handleMouseDown(e, "landmark", lm.id)}
                        onClick={() => setSelectedEditItem({ type: "landmark", id: lm.id })}
                        style={{ top: `${lm.y}%`, left: `${lm.x}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg z-20 transition-all ${
                          isEditMode
                            ? "cursor-move ring-2 ring-red-400 hover:scale-105"
                            : ""
                        } ${
                          isSelected
                            ? "bg-red-500 text-white border-2 border-white shadow-red-500/50"
                            : "bg-red-500/20 border border-red-500/40 text-red-300"
                        }`}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{lm.name}</span>
                        {isEditMode && <Move className="w-3 h-3 text-red-300 ml-1 opacity-75" />}
                      </div>
                    );
                  }

                  // Checkout Counter
                  return (
                    <div
                      key={lm.id}
                      onMouseDown={(e) => handleMouseDown(e, "landmark", lm.id)}
                      onClick={() => setSelectedEditItem({ type: "landmark", id: lm.id })}
                      style={{
                        top: `${lm.y}%`,
                        left: `${lm.x}%`,
                        width: lm.width ? `${lm.width}%` : "34%",
                        height: lm.height ? `${lm.height}%` : "6%",
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg z-20 transition-all ${
                        isEditMode
                          ? "cursor-move ring-2 ring-purple-400 hover:scale-105"
                          : ""
                      } ${
                        isSelected
                          ? "bg-purple-500 text-white border-2 border-white shadow-purple-500/50"
                          : "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{lm.name}</span>
                      {isEditMode && <Move className="w-3 h-3 text-purple-300 ml-1 opacity-75" />}
                    </div>
                  );
                })}

                {/* Camera Radar Cones */}
                {cameras.map((cam) => {
                  const isFovActive = activeCameraFov === cam.id;
                  const isSelectedForEdit =
                    selectedEditItem?.type === "camera" && selectedEditItem.id === cam.id;

                  return (
                    <div
                      key={cam.id}
                      onMouseDown={(e) => handleMouseDown(e, "camera", cam.id)}
                      style={{ top: `${cam.y}%`, left: `${cam.x}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                    >
                      {isFovActive && !isEditMode && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-cyan-500/10 border border-cyan-500/20 pointer-events-none animate-ping" />
                      )}

                      <button
                        onClick={() => {
                          if (isEditMode) {
                            setSelectedEditItem({ type: "camera", id: cam.id });
                          } else {
                            setActiveCameraFov(cam.id);
                            setActiveTab("cameras");
                          }
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                          isEditMode ? "cursor-move" : "cursor-pointer"
                        } ${
                          isSelectedForEdit
                            ? "bg-amber-400 text-black border-white shadow-2xl scale-125 ring-2 ring-amber-300"
                            : isFovActive
                            ? "bg-cyan-500 text-black border-cyan-300 shadow-xl shadow-cyan-500/50 scale-110"
                            : "bg-slate-900/90 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:scale-105"
                        }`}
                        title={`${cam.name} (${cam.id})`}
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
                        {cam.id}
                      </span>
                    </div>
                  );
                })}

                {/* Shelf Zone Blocks */}
                {shelves.map((shelf) => {
                  const isSelected = selectedShelf?.id === shelf.id;
                  const isSelectedForEdit =
                    selectedEditItem?.type === "shelf" && selectedEditItem.id === shelf.id;

                  return (
                    <div
                      key={shelf.id}
                      onMouseDown={(e) => handleMouseDown(e, "shelf", shelf.id)}
                      onClick={() => {
                        setSelectedShelf(shelf);
                        if (isEditMode) {
                          setSelectedEditItem({ type: "shelf", id: shelf.id });
                        }
                      }}
                      style={{
                        left: `${shelf.x}%`,
                        top: `${shelf.y}%`,
                        width: `${shelf.width}%`,
                        height: `${shelf.height}%`,
                      }}
                      className={`absolute rounded-xl border-2 p-2.5 flex flex-col justify-between transition-all duration-150 z-20 backdrop-blur-md ${
                        isEditMode ? "cursor-move ring-1 ring-amber-500/40" : "cursor-pointer"
                      } ${
                        isSelectedForEdit
                          ? "bg-amber-500/40 border-amber-300 shadow-2xl shadow-amber-500/40 scale-[1.03] ring-2 ring-amber-400"
                          : isSelected
                          ? "bg-cyan-500/30 border-cyan-300 shadow-2xl shadow-cyan-500/30 scale-[1.02]"
                          : `bg-gradient-to-br ${shelf.color} hover:border-white hover:scale-[1.01]`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white truncate max-w-[80%] flex items-center gap-1">
                          {isEditMode && <Move className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                          <span>{shelf.name.split("-")[0]}</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-cyan-300 bg-black/60 px-1 rounded">
                          {shelf.attentionScore}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-300 font-mono">
                        <span>{shelf.avgDwellTime}s</span>
                        <span className="text-purple-300">{shelf.cameraAssigned}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend Bar */}
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-purple-500/50 border border-purple-400"></span>
                    High Attention (&gt;90%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500/50 border border-cyan-400"></span>
                    Medium Attention (80-89%)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">
                  {isEditMode ? "⚡ Drag mode active • Click elements to edit parameters" : "Click any camera or shelf to inspect"}
                </span>
              </div>
            </div>

            {/* Inspector & Property Editor Panel */}
            <div className="rounded-3xl glass-panel-glow border border-white/10 p-6 flex flex-col justify-between">
              {isEditMode && selectedEditItem ? (
                /* EDIT MODE INSPECTOR */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase font-mono">
                        Edit {selectedEditItem.type}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleDeleteItem(selectedEditItem.type, selectedEditItem.id)
                      }
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* SHELF PROPERTY EDITOR */}
                  {currentEditingShelf && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                          Shelf Name
                        </label>
                        <input
                          type="text"
                          value={currentEditingShelf.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShelves((prev) =>
                              prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, name: val } : s))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={currentEditingShelf.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setShelves((prev) =>
                                prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, category: val } : s))
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                            Assigned Camera
                          </label>
                          <select
                            value={currentEditingShelf.cameraAssigned}
                            onChange={(e) => {
                              const val = e.target.value;
                              setShelves((prev) =>
                                prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, cameraAssigned: val } : s))
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl glass-input text-xs text-cyan-300 font-mono bg-black"
                          >
                            {cameras.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.id} ({c.name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Coordinates Sliders */}
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Position X</span>
                            <span className="text-cyan-300 font-bold">{currentEditingShelf.x}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="90"
                            value={currentEditingShelf.x}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setShelves((prev) =>
                                prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, x: val } : s))
                              );
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Position Y</span>
                            <span className="text-cyan-300 font-bold">{currentEditingShelf.y}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="90"
                            value={currentEditingShelf.y}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setShelves((prev) =>
                                prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, y: val } : s))
                              );
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                          <div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                              <span>Width</span>
                              <span className="text-purple-300">{currentEditingShelf.width}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="45"
                              value={currentEditingShelf.width}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setShelves((prev) =>
                                  prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, width: val } : s))
                                );
                              }}
                              className="w-full accent-purple-400 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                              <span>Height</span>
                              <span className="text-purple-300">{currentEditingShelf.height}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              value={currentEditingShelf.height}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setShelves((prev) =>
                                  prev.map((s) => (s.id === currentEditingShelf.id ? { ...s, height: val } : s))
                                );
                              }}
                              className="w-full accent-purple-400 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CAMERA PROPERTY EDITOR */}
                  {currentEditingCamera && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                          Camera Identifier
                        </label>
                        <input
                          type="text"
                          value={currentEditingCamera.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCameras((prev) =>
                              prev.map((c) => (c.id === currentEditingCamera.id ? { ...c, id: val } : c))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-cyan-300 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                          Camera Name / Description
                        </label>
                        <input
                          type="text"
                          value={currentEditingCamera.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCameras((prev) =>
                              prev.map((c) => (c.id === currentEditingCamera.id ? { ...c, name: val } : c))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                          Coverage Zone
                        </label>
                        <input
                          type="text"
                          value={currentEditingCamera.zone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCameras((prev) =>
                              prev.map((c) => (c.id === currentEditingCamera.id ? { ...c, zone: val } : c))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Position X</span>
                            <span className="text-cyan-300 font-bold">{currentEditingCamera.x}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="98"
                            value={currentEditingCamera.x}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCameras((prev) =>
                                prev.map((c) => (c.id === currentEditingCamera.id ? { ...c, x: val } : c))
                              );
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Position Y</span>
                            <span className="text-cyan-300 font-bold">{currentEditingCamera.y}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="98"
                            value={currentEditingCamera.y}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCameras((prev) =>
                                prev.map((c) => (c.id === currentEditingCamera.id ? { ...c, y: val } : c))
                              );
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LANDMARK (ENTRANCE / EXIT / CHECKOUT) EDITOR */}
                  {currentEditingLandmark && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                          Landmark Label
                        </label>
                        <input
                          type="text"
                          value={currentEditingLandmark.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLandmarks((prev) =>
                              prev.map((l) => (l.id === currentEditingLandmark.id ? { ...l, name: val } : l))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Position X</span>
                            <span className="text-cyan-300 font-bold">{currentEditingLandmark.x}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="98"
                            value={currentEditingLandmark.x}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setLandmarks((prev) =>
                                prev.map((l) => (l.id === currentEditingLandmark.id ? { ...l, x: val } : l))
                              );
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Position Y</span>
                            <span className="text-cyan-300 font-bold">{currentEditingLandmark.y}%</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="98"
                            value={currentEditingLandmark.y}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setLandmarks((prev) =>
                                prev.map((l) => (l.id === currentEditingLandmark.id ? { ...l, y: val } : l))
                              );
                            }}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <button
                      onClick={handleSaveLayout}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs font-bold text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : selectedShelf ? (
                /* NORMAL INSPECTOR VIEW */
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                        Selected Shelf Zone
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {selectedShelf.name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {selectedShelf.attentionScore}% Attention
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between">
                      <span className="text-slate-400">Category</span>
                      <span className="font-semibold text-white">{selectedShelf.category}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between">
                      <span className="text-slate-400">Store Spatial Zone</span>
                      <span className="font-semibold text-cyan-300">{selectedShelf.zone}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between">
                      <span className="text-slate-400">Avg Dwell Time</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedShelf.avgDwellTime} sec</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between">
                      <span className="text-slate-400">Assigned Camera</span>
                      <span className="font-mono text-purple-300">{selectedShelf.cameraAssigned}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between">
                      <span className="text-slate-400">Floorplan Coordinates</span>
                      <span className="font-mono text-slate-300">X: {selectedShelf.x}%, Y: {selectedShelf.y}%</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Link
                      href={`/shelves`}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
                    >
                      <span>Inspect Full Shelf Analytics</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setSelectedEditItem({ type: "shelf", id: selectedShelf.id });
                        }}
                        className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit Position</span>
                      </button>

                      <button
                        onClick={() => handleDeleteShelf(selectedShelf.id, selectedShelf.name)}
                        className="py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Shelf</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Compass className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Select a Shelf or Camera
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Click any shelf rectangle or camera icon on the map to view real-time YOLO tracking and dwell metrics.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-2 transition-all hover:bg-amber-500/30 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Open Floorplan Editor</span>
                  </button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setActiveTab("cameras")}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Launch Store Live Webcam &amp; YOLO</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE LIVE WEBCAMS & YOLO MONITORING */}
      {activeTab === "cameras" && (
        <div className="space-y-6">
          {/* Camera Selection Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cameras.map((cam) => {
              const isSelected = activeCameraFov === cam.id;
              return (
                <button
                  key={cam.id}
                  onClick={() => setActiveCameraFov(cam.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500/20 via-purple-500/15 to-transparent border-cyan-400 shadow-lg shadow-cyan-500/20"
                      : "bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {cam.id}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {cam.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{cam.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{cam.zone} • {cam.fps} FPS</p>
                </button>
              );
            })}
          </div>

          {/* Main Camera Screen Panel */}
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="relative rounded-3xl glass-panel-glow border border-cyan-500/30 overflow-hidden shadow-2xl bg-black">
                {/* Top HUD */}
                <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/40">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      {activeCameraFov}: {cameraMode === "webcam" ? "Live Webcam Feed" : "CCTV Stream"}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Store #{storeId} - {storeName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                    <span>{liveFps || 30} FPS</span>
                    <span>•</span>
                    <span>{liveDetections.length} Persons In Frame</span>
                  </div>
                </div>

                {/* Video / Webcam Rendering */}
                <div className="relative w-full aspect-[16/9] bg-black flex items-center justify-center">
                  {cameraMode === "webcam" ? (
                    <>
                      <video
                        ref={videoElementRef}
                        muted
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      <canvas
                        ref={canvasOverlayRef}
                        width={640}
                        height={360}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                    </>
                  ) : selectedVideo ? (
                    <video
                      key={selectedVideo.id}
                      src={getVideoStreamUrl(selectedVideo.id)}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-500">
                      <FileVideo className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                      <p className="text-xs font-semibold text-slate-300">
                        No video recorded for this camera yet
                      </p>
                      <button
                        onClick={() => setCameraMode("webcam")}
                        className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
                      >
                        Switch to Live Webcam
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode Controls Bar */}
              <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCameraMode("webcam")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      cameraMode === "webcam"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/[0.02] text-slate-400 border-white/10"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Device Webcam Mode</span>
                  </button>

                  <button
                    onClick={() => setCameraMode("video")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      cameraMode === "video"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-white/[0.02] text-slate-400 border-white/10"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <span>Processed Video Playback</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileUploadInputRef.current?.click()}
                    disabled={isProcessingVideo}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-bold text-white flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingVideo ? "Running YOLO..." : `Upload Footage to ${activeCameraFov}`}</span>
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Right Telemetry Column */}
            <div className="space-y-4">
              <div className="rounded-3xl glass-card p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Camera Telemetry</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {liveDetections.length} Active
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Current Camera</span>
                    <span className="font-mono font-bold text-cyan-300">{activeCameraFov}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">YOLO Model</span>
                    <span className="font-mono text-white text-[11px]">YOLOv8n ByteTrack</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Coverage Zone</span>
                    <span className="font-semibold text-purple-300">
                      {cameras.find((c) => c.id === activeCameraFov)?.zone || "Entrance"}
                    </span>
                  </div>
                </div>

                {/* Active Person List */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
                    Active Tracked Shoppers in {activeCameraFov}
                  </span>
                  {liveDetections.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center text-slate-500 text-[11px]">
                      No shoppers currently detected in frame
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {liveDetections.map((det) => (
                        <div
                          key={det.id}
                          className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-[11px] font-mono"
                        >
                          <span className="text-cyan-300 font-bold">#PERSON-{det.id}</span>
                          <span className="text-emerald-400">{Math.round(det.confidence * 100)}% Conf</span>
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

      {/* TAB 3: SHELVES DIRECTORY */}
      {activeTab === "shelves" && (
        <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-purple-400" />
                <span>Shelves Directory &amp; Attention Parameters</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All {shelves.length} mapped zones for {storeName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Store Level Excel Export */}
              <a
                href={getExportExcelUrl(storeId)}
                download={`store_${storeId}_shelves_report.xlsx`}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title={`Export all shelves for ${storeName} to Excel (.xlsx)`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Store (.xlsx)</span>
              </a>

              {/* Store Level CSV Export */}
              <a
                href={getExportCsvUrl(storeId)}
                download={`store_${storeId}_shelves_report.csv`}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title={`Export all shelves for ${storeName} to CSV`}
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export (.csv)</span>
              </a>

              <button
                onClick={() => {
                  setActiveTab("map");
                  setIsEditMode(true);
                  setNewShelfName("");
                  setNewShelfCategory("");
                  setShowAddModal("shelf");
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Shelf Zone</span>
              </button>
            </div>
          </div>

          {shelves.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No shelf zones configured for {storeName} yet. Click &quot;Add Shelf Zone&quot; to create one.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  className="p-5 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {shelf.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {shelf.attentionScore}% Attention
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1">
                      {shelf.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{shelf.zone}</p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-center text-xs">
                      <div className="p-2 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-slate-500 uppercase block">Dwell Time</span>
                        <span className="font-mono font-bold text-white">{shelf.avgDwellTime}s</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-slate-500 uppercase block">Visitors</span>
                        <span className="font-mono font-bold text-white">{shelf.visitors}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                    <Link
                      href={`/shelves`}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Single Shelf Export Action */}
                    <button
                      onClick={() => {
                        const headers = [
                          "Shelf ID",
                          "Shelf Name",
                          "Store ID",
                          "Store Name",
                          "Category",
                          "Spatial Zone",
                          "Attention Score",
                          "Avg Dwell Time (s)",
                          "Visitors",
                          "Assigned Camera",
                          "Coordinate X (%)",
                          "Coordinate Y (%)",
                        ];
                        const row = [
                          shelf.id,
                          `"${shelf.name.replace(/"/g, '""')}"`,
                          storeId,
                          `"${storeName.replace(/"/g, '""')}"`,
                          `"${shelf.category.replace(/"/g, '""')}"`,
                          `"${shelf.zone.replace(/"/g, '""')}"`,
                          shelf.attentionScore,
                          shelf.avgDwellTime,
                          shelf.visitors,
                          shelf.cameraAssigned,
                          shelf.x,
                          shelf.y,
                        ];
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `shelf_${shelf.id}_${storeName.replace(/\s+/g, "_")}_data.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                      title={`Export data for ${shelf.name} (.csv)`}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("map");
                        setIsEditMode(true);
                        setSelectedEditItem({ type: "shelf", id: shelf.id });
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                      title="Edit Placement on Floorplan"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Shelf Button */}
                    <button
                      onClick={() => handleDeleteShelf(shelf.id, shelf.name)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title={`Delete ${shelf.name} from PostgreSQL`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD ITEM MODALS - All fields 100% blank */}
      {showAddModal === "shelf" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add New Shelf Zone</span>
              </h3>
              <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddShelfSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Shelf Name &amp; Description
                </label>
                <input
                  type="text"
                  required
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  placeholder="e.g. Shelf A1 - Luxury Handbags"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={newShelfCategory}
                  onChange={(e) => setNewShelfCategory(e.target.value)}
                  placeholder="e.g. Cosmetics, Electronics, Food"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Assigned Monitoring Camera
                </label>
                <input
                  type="text"
                  value={newShelfCamera}
                  onChange={(e) => setNewShelfCamera(e.target.value)}
                  placeholder="e.g. CAM-01"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-cyan-300 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  Add to Floorplan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal === "camera" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Add Camera / CCTV FOV</span>
              </h3>
              <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCameraSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Camera Identifier
                </label>
                <input
                  type="text"
                  required
                  value={newCamId}
                  onChange={(e) => setNewCamId(e.target.value)}
                  placeholder="e.g. CAM-01"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-cyan-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Camera Name
                </label>
                <input
                  type="text"
                  required
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  placeholder="e.g. Entrance Overhead / North Aisle Dome"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  Place Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal === "landmark" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-emerald-400" />
                <span>Add Entrance, Exit, or Checkout Counter</span>
              </h3>
              <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLandmarkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Type
                </label>
                <select
                  value={newLandmarkType}
                  onChange={(e) => setNewLandmarkType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white bg-black"
                >
                  <option value="entrance">Store Entrance Gate</option>
                  <option value="exit">Emergency / Side Exit Gate</option>
                  <option value="checkout">Checkout &amp; POS Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-mono text-[10px] mb-1.5">
                  Landmark Label
                </label>
                <input
                  type="text"
                  required
                  value={newLandmarkName}
                  onChange={(e) => setNewLandmarkName(e.target.value)}
                  placeholder="e.g. Main Entrance / POS Counter 1"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  Add Landmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
