import { useEffect, useRef, useState } from 'react';
import { FiActivity, FiCamera, FiEye, FiLayers, FiMaximize2, FiPause, FiPlay, FiRefreshCw, FiServer, FiShield, FiTv, FiUser } from 'react-icons/fi';
import { getDashboardSummary } from '../services/analyticsService';

const VIDEO_FEEDS = {
  cosmetics: {
    title: 'Cam 01 - Cosmetics & Beauty Aisle',
    videoUrl: '/cctv_cosmetics.mp4',
    fallbackImg: '/cctv_cosmetics.jpg',
    shoppers: [
      { id: 101, name: 'Alex Rivera', role: 'Shopper', age: '25-34', x: 670, y: 440, w: 75, h: 180, shelf: 'Shelf A - Cosmetics', status: 'Inspecting Product', dwellSec: 64, color: '#00f2fe', path: ['Entrance', 'Shelf A - Cosmetics'] },
      { id: 102, name: 'Emma Watson', role: 'Shopper', age: '18-24', x: 740, y: 460, w: 70, h: 170, shelf: 'Shelf A - Cosmetics', status: 'High Dwell (Pick-up)', dwellSec: 82, color: '#ff007f', path: ['Entrance', 'Shelf A - Cosmetics'] },
      { id: 103, name: 'Sarah Jenkins', role: 'Shopper', age: '35-49', x: 800, y: 480, w: 85, h: 190, shelf: 'Cosmetics Corridor', status: 'Pushing Cart', dwellSec: 24, color: '#00ff87', path: ['Entrance', 'Aisle 8'] },
      { id: 104, name: 'Marcus Vance', role: 'Shopper', age: '35-49', x: 880, y: 420, w: 65, h: 160, shelf: 'Shelf A - Fragrances', status: 'Browsing Shelf', dwellSec: 38, color: '#ffb199', path: ['Entrance', 'Shelf A'] }
    ]
  },
  electronics: {
    title: 'Cam 02 - Tech Innovation & Electronics',
    videoUrl: '/cctv_electronics.mp4',
    fallbackImg: '/cctv_electronics.jpg',
    shoppers: [
      { id: 101, name: 'Alex Rivera', role: 'Store Tech Staff', age: '25-34', x: 410, y: 340, w: 70, h: 180, shelf: 'Laptop Desk 1', status: 'Assisting Customer', dwellSec: 120, color: '#38bdf8', path: ['Staff Desk', 'Laptop Desk'] },
      { id: 102, name: 'Emma Watson', role: 'Shopper', age: '25-34', x: 210, y: 440, w: 80, h: 190, shelf: 'Shelf B - Smartwatches', status: 'Inspecting Watch', dwellSec: 95, color: '#ec4899', path: ['Entrance', 'Smartwatches'] },
      { id: 103, name: 'Marcus Vance', role: 'Shopper', age: '35-49', x: 810, y: 550, w: 85, h: 200, shelf: 'Shelf B - Headphones', status: 'Testing Audio', dwellSec: 54, color: '#10b981', path: ['Entrance', 'Headphones'] },
      { id: 104, name: 'Sophia Chen', role: 'Shopper', age: '18-24', x: 620, y: 530, w: 80, h: 195, shelf: 'Shelf B - Smartwatches', status: 'High Gaze Focus', dwellSec: 72, color: '#a855f7', path: ['Entrance', 'Smartwatches'] },
      { id: 105, name: 'Daniel Kim', role: 'Shopper', age: '25-34', x: 730, y: 410, w: 75, h: 185, shelf: 'Main Corridor', status: 'Walking to Checkout', dwellSec: 18, color: '#f59e0b', path: ['Entrance', 'Smartphones'] }
    ]
  },
  fashion: {
    title: 'Cam 03 - Men\'s & Women\'s Fashion Dept',
    videoUrl: '/cctv_fashion.mp4',
    fallbackImg: '/cctv_fashion.jpg',
    shoppers: [
      { id: 101, name: 'Alex Rivera', role: 'Shopper', age: '25-34', x: 560, y: 420, w: 75, h: 190, shelf: 'Shelf C - Men\'s Shirts', status: 'Checking Size', dwellSec: 48, color: '#38bdf8', path: ['Entrance', 'Men\'s Apparel'] },
      { id: 102, name: 'Emma Watson', role: 'Shopper', age: '18-24', x: 430, y: 500, w: 80, h: 195, shelf: 'Shelf C - New Arrivals', status: 'Inspecting Jacket', dwellSec: 88, color: '#ec4899', path: ['Entrance', 'New Arrivals'] },
      { id: 103, name: 'Sophia Chen', role: 'Shopper', age: '25-34', x: 650, y: 520, w: 80, h: 190, shelf: 'Shelf C - Dresses', status: 'Browsing Rack', dwellSec: 35, color: '#a855f7', path: ['Entrance', 'Women\'s Apparel'] },
      { id: 104, name: 'Marcus Vance', role: 'Shopper', age: '35-49', x: 880, y: 310, w: 65, h: 165, shelf: 'Outerwear Rack', status: 'High Dwell', dwellSec: 62, color: '#10b981', path: ['Entrance', 'Outerwear'] }
    ]
  }
};

export default function LiveCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentFeedKey, setCurrentFeedKey] = useState('cosmetics');
  const [selectedShopper, setSelectedShopper] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Overlay Toggles
  const [showBoxes, setShowBoxes] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [showGaze, setShowGaze] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const currentFeed = VIDEO_FEEDS[currentFeedKey];

  // Render bounding box & AI overlays on canvas synchronized with video frame
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderOverlay = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const shoppers = currentFeed.shoppers;

      // Draw Heatmap layer if enabled
      if (showHeatmap) {
        shoppers.forEach((s) => {
          const grad = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, 110);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
          grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 110, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Shopper Bounding Boxes, Gaze Rays & Name Labels
      shoppers.forEach((s) => {
        const isSelected = selectedShopper?.id === s.id;
        const scaleX = canvas.width / 1280;
        const scaleY = canvas.height / 720;

        const bx = (s.x - s.w / 2) * scaleX;
        const by = (s.y - s.h / 2) * scaleY;
        const bw = s.w * scaleX;
        const bh = s.h * scaleY;

        // 1. Gaze Direction Ray
        if (showGaze) {
          ctx.beginPath();
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.moveTo(s.x * scaleX, (s.y - s.h / 3) * scaleY);
          ctx.lineTo((s.x + 60) * scaleX, (s.y - 10) * scaleY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc((s.x + 60) * scaleX, (s.y - 10) * scaleY, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Bounding Box
        if (showBoxes) {
          ctx.strokeStyle = isSelected ? '#00f2fe' : s.color;
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.strokeRect(bx, by, bw, bh);

          // Corner cyber brackets
          const cl = 10;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          // TL
          ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
          // TR
          ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
          // BL
          ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
          // BR
          ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();
        }

        // 3. Name & Status Badges
        if (showNames) {
          const label = `ID #${s.id}: ${s.name}`;
          ctx.font = 'bold 12px Inter, sans-serif';
          const tw = ctx.measureText(label).width;

          // Header Tag
          ctx.fillStyle = isSelected ? '#0284c7' : 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(bx, by - 24, tw + 16, 20);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by - 24, tw + 16, 20);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, bx + 8, by - 10);

          // Subtag
          const subText = `${s.status} • ${s.dwellSec}s`;
          ctx.font = '10px Inter, sans-serif';
          const stw = ctx.measureText(subText).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(bx, by + bh + 4, stw + 12, 18);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(subText, bx + 6, by + bh + 17);
        }
      });

      if (isPlaying) {
        animId = requestAnimationFrame(renderOverlay);
      }
    };

    renderOverlay();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentFeedKey, showBoxes, showNames, showGaze, showHeatmap, selectedShopper]);

  // Click handler to select shopper inside realistic video canvas
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (1280 / rect.width);
    const clickY = (e.clientY - rect.top) * (720 / rect.height);

    const clicked = currentFeed.shoppers.find(
      s => Math.hypot(s.x - clickX, s.y - clickY) < 90
    );
    setSelectedShopper(clicked || null);
  };

  return (
    <section className="live-camera-card cyber-dashboard-container">
      {/* CCTV HEADER & HUD */}
      <div className="panel-header flex-between">
        <div className="flex-align-gap">
          <div className="cyber-pulse-badge">
            <span className="pulse-dot-red"></span>
            LIVE CCTV REAL-TIME FEED
          </div>
          <h2 className="cyber-title">{currentFeed.title}</h2>
        </div>

        <div className="cam-header-actions">
          <div className="feed-btn-group">
            <button
              type="button"
              className={`feed-btn ${currentFeedKey === 'cosmetics' ? 'active' : ''}`}
              onClick={() => { setCurrentFeedKey('cosmetics'); setSelectedShopper(null); }}
            >
              💅 Cosmetics (Cam 01)
            </button>
            <button
              type="button"
              className={`feed-btn ${currentFeedKey === 'electronics' ? 'active' : ''}`}
              onClick={() => { setCurrentFeedKey('electronics'); setSelectedShopper(null); }}
            >
              ⚡ Electronics (Cam 02)
            </button>
            <button
              type="button"
              className={`feed-btn ${currentFeedKey === 'fashion' ? 'active' : ''}`}
              onClick={() => { setCurrentFeedKey('fashion'); setSelectedShopper(null); }}
            >
              👔 Fashion (Cam 03)
            </button>
          </div>
          <button
            type="button"
            className="play-pause-btn"
            onClick={() => {
              if (videoRef.current) {
                if (isPlaying) videoRef.current.pause();
                else videoRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
        </div>
      </div>

      {/* OVERLAY TOOLBAR CONTROL */}
      <div className="cyber-overlay-bar">
        <div className="ai-model-tag"><FiServer /> YOLOv8x-Pose + ByteTrack 3.0</div>
        <div className="layer-toggles">
          <label className="cyber-checkbox">
            <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
            <span>Names & IDs</span>
          </label>
          <label className="cyber-checkbox">
            <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} />
            <span>AI Bounding Boxes</span>
          </label>
          <label className="cyber-checkbox">
            <input type="checkbox" checked={showGaze} onChange={(e) => setShowGaze(e.target.checked)} />
            <span>Gaze Vectors</span>
          </label>
          <label className="cyber-checkbox">
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
            <span>Attention Heatmap</span>
          </label>
        </div>
      </div>

      {/* REAL VIDEO PLAYER & OVERLAY CANVAS */}
      <div className="cyber-video-grid">
        <div className="video-player-container">
          {/* Real Human Store Video Stream */}
          <video
            ref={videoRef}
            src={currentFeed.videoUrl}
            poster={currentFeed.fallbackImg}
            autoPlay
            loop
            muted
            playsInline
            className="real-store-video"
          />

          {/* AI Overlays Canvas Layer */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onClick={handleCanvasClick}
            className="ai-overlay-canvas"
          />

          {/* CCTV HUD Telemetry Overlay */}
          <div className="cctv-hud-top flex-between">
            <span className="hud-red"><span className="red-blink">●</span> REC  1080p 60FPS</span>
            <span className="hud-cyan">2026-08-19 {new Date().toLocaleTimeString()} UTC+5:30  |  CAM-ID: #0492</span>
          </div>

          <div className="cctv-hud-bottom">
            <span>💡 Click on any person in the video feed to open their real-time AI journey telemetry drawer.</span>
          </div>
        </div>

        {/* SHOPPER TELEMETRY SIDEBAR PANEL */}
        <div className="cyber-telemetry-panel">
          {selectedShopper ? (
            <div className="shopper-card-cyber">
              <div className="shopper-card-header">
                <div className="shopper-avatar-glow" style={{ borderColor: selectedShopper.color }}>
                  {selectedShopper.name.charAt(0)}
                </div>
                <div>
                  <h3 className="shopper-name">{selectedShopper.name}</h3>
                  <span className="shopper-meta">ID #{selectedShopper.id} • {selectedShopper.age} • {selectedShopper.role}</span>
                </div>
                <button type="button" className="close-btn" onClick={() => setSelectedShopper(null)}>✕</button>
              </div>

              <div className="cyber-metrics-grid">
                <div className="cyber-metric-box">
                  <span className="metric-lbl">Current Location</span>
                  <strong className="metric-val cyan">{selectedShopper.shelf}</strong>
                </div>
                <div className="cyber-metric-box">
                  <span className="metric-lbl">Live Action</span>
                  <strong className="metric-val">{selectedShopper.status}</strong>
                </div>
                <div className="cyber-metric-box">
                  <span className="metric-lbl">Shelf Dwell Time</span>
                  <strong className="metric-val emerald">{selectedShopper.dwellSec} seconds</strong>
                </div>
                <div className="cyber-metric-box">
                  <span className="metric-lbl">Attractiveness</span>
                  <strong className="metric-val pink">94.2 Score</strong>
                </div>
              </div>

              <div className="journey-flow-section">
                <h4>Path Sequence Flow</h4>
                <div className="flow-steps">
                  {selectedShopper.path.map((step, idx) => (
                    <div className="flow-step-item" key={idx}>
                      <span className="flow-num">{idx + 1}</span>
                      <span className="flow-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="cctv-summary-cyber">
              <h3 className="cyber-subheading"><FiActivity /> Real-Time Telemetry Summary</h3>

              <div className="telemetry-rows">
                <div className="t-row">
                  <span>Feed Source:</span>
                  <strong className="cyan-text">HD CCTV Stream (1080p)</strong>
                </div>
                <div className="t-row">
                  <span>Detection Model:</span>
                  <strong className="emerald-text">YOLOv8x-Pose (Active)</strong>
                </div>
                <div className="t-row">
                  <span>Re-ID Tracking:</span>
                  <strong className="emerald-text">ByteTrack 3.0 (Active)</strong>
                </div>
                <div className="t-row">
                  <span>Active Shoppers:</span>
                  <strong>{currentFeed.shoppers.length} Persons Detected</strong>
                </div>
                <div className="t-row">
                  <span>Primary Hotzone:</span>
                  <strong className="amber-text">{currentFeed.shoppers[0]?.shelf}</strong>
                </div>
              </div>

              <div className="detected-persons-list">
                <h4>Identified Persons in Feed:</h4>
                <div className="person-buttons">
                  {currentFeed.shoppers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="person-btn"
                      style={{ borderLeftColor: s.color }}
                      onClick={() => setSelectedShopper(s)}
                    >
                      <strong className="p-id">#{s.id}</strong> {s.name} ({s.shelf.split(' - ')[0]})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
