/**
 * videoStore.js — Shared video state + Stable Person ID color engine
 * 
 * FIX for person IDs 1, 5, 11:
 *  - ID 1  was #39FF14 — hex parse of "39" was OK but "FF" was being read as NaN in some edge cases
 *  - ID 5  was #FFE600 — "FF" hex can parse incorrectly when combined with string concatenation
 *  - ID 11 was #FF9900 — same issue
 * 
 * Solution: store colors as {r,g,b} objects internally, expose both hex and rgb components.
 * The PERSON_COLOR_MAP now stores {hex, r, g, b} for each tracker_id.
 */

// ─── 24 distinct, high-contrast colors — enough for any retail video ──────────
const RAW_PALETTE = [
  { hex: "#39FF14", r: 57,  g: 255, b: 20  }, // #1  Neon Green
  { hex: "#00F2FE", r: 0,   g: 242, b: 254 }, // #2  Cyan
  { hex: "#BD00FF", r: 189, g: 0,   b: 255 }, // #3  Violet
  { hex: "#FF5E36", r: 255, g: 94,  b: 54  }, // #4  Orange-Red
  { hex: "#FFE600", r: 255, g: 230, b: 0   }, // #5  Yellow       ← was buggy
  { hex: "#FF00BD", r: 255, g: 0,   b: 189 }, // #6  Hot Pink
  { hex: "#00FFB4", r: 0,   g: 255, b: 180 }, // #7  Mint
  { hex: "#4FACFE", r: 79,  g: 172, b: 254 }, // #8  Blue
  { hex: "#FF3366", r: 255, g: 51,  b: 102 }, // #9  Rose
  { hex: "#A0FF00", r: 160, g: 255, b: 0   }, // #10 Lime
  { hex: "#FF9900", r: 255, g: 153, b: 0   }, // #11 Amber       ← was buggy
  { hex: "#00E5FF", r: 0,   g: 229, b: 255 }, // #12 Sky Cyan
  { hex: "#FF6BEF", r: 255, g: 107, b: 239 }, // #13 Orchid
  { hex: "#69FF47", r: 105, g: 255, b: 71  }, // #14 Spring Green
  { hex: "#FFA200", r: 255, g: 162, b: 0   }, // #15 Gold
  { hex: "#00FFD5", r: 0,   g: 255, b: 213 }, // #16 Aqua
  { hex: "#FF4488", r: 255, g: 68,  b: 136 }, // #17 Deep Pink
  { hex: "#7DF9FF", r: 125, g: 249, b: 255 }, // #18 Electric Blue
  { hex: "#ADFF2F", r: 173, g: 255, b: 47  }, // #19 Green-Yellow
  { hex: "#FF8C00", r: 255, g: 140, b: 0   }, // #20 Dark Orange
  { hex: "#E040FB", r: 224, g: 64,  b: 251 }, // #21 Purple
  { hex: "#76FF03", r: 118, g: 255, b: 3   }, // #22 Light Green
  { hex: "#F50057", r: 245, g: 0,   b: 87  }, // #23 Pink
  { hex: "#18FFFF", r: 24,  g: 255, b: 255 }, // #24 Aqua Cyan
];

/**
 * Global stable color map keyed by tracker_id (always integer).
 * Once assigned: the same person ALWAYS gets the same color across ALL frames.
 */
const PERSON_COLOR_MAP = new Map();

/**
 * Returns the stable {hex, r, g, b} color entry for a given tracker_id.
 * Accepts string or number tracker_id — always normalizes to integer.
 * Handles edge cases: NaN, null, undefined → defaults to ID 1.
 */
export function getPersonColorEntry(trackerId) {
  let id = parseInt(trackerId, 10);
  if (isNaN(id) || id < 1) id = 1;

  if (!PERSON_COLOR_MAP.has(id)) {
    // Deterministic: ID 1 → palette[0], ID 5 → palette[4], ID 11 → palette[10]
    const entry = RAW_PALETTE[(id - 1) % RAW_PALETTE.length];
    PERSON_COLOR_MAP.set(id, { ...entry }); // store a copy
  }
  return PERSON_COLOR_MAP.get(id);
}

/**
 * Returns just the hex color string for a tracker_id.
 * This is what most rendering code needs.
 */
export function getPersonColor(trackerId) {
  return getPersonColorEntry(trackerId).hex;
}

/**
 * Returns an rgb(...) CSS string — safe for any context.
 */
export function getPersonColorRGB(trackerId) {
  const { r, g, b } = getPersonColorEntry(trackerId);
  return `rgb(${r},${g},${b})`;
}

/**
 * Returns a rgba(...) CSS string with the given alpha.
 */
export function getPersonColorRGBA(trackerId, alpha = 1) {
  const { r, g, b } = getPersonColorEntry(trackerId);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Interpolate between person color and a target rgb linearly.
 * Used for path gradient rendering — avoids parseInt(hex) bugs.
 * t = 0 → person color, t = 1 → target.
 */
export function lerpPersonColor(trackerId, t, targetR = 79, targetG = 172, targetB = 254) {
  const { r, g, b } = getPersonColorEntry(trackerId);
  const lr = Math.round(r + (targetR - r) * t);
  const lg = Math.round(g + (targetG - g) * t);
  const lb = Math.round(b + (targetB - b) * t);
  return `rgb(${lr},${lg},${lb})`;
}

/**
 * Clear the color map — call only when starting a brand new video session.
 * All person colors will be re-assigned from scratch.
 */
export function resetPersonColors() {
  PERSON_COLOR_MAP.clear();
}

export { RAW_PALETTE as COLOR_PALETTE };

// ─── Shared Video State ────────────────────────────────────────────────────────

let _selectedVideoId = "whatsapp-annotation-video";
let _selectedVideoSrc = "/vedio.mp4";
let _videoListeners = [];

export function getSelectedVideoId()  { return _selectedVideoId; }
export function getSelectedVideoSrc() { return _selectedVideoSrc; }

export function setSelectedVideo(videoId, videoSrc) {
  _selectedVideoId  = videoId;
  _selectedVideoSrc = videoSrc || "/vedio.mp4";
  _videoListeners.forEach((fn) => fn(_selectedVideoId, _selectedVideoSrc));
}

export function subscribeToVideoChange(fn) {
  _videoListeners.push(fn);
  return () => { _videoListeners = _videoListeners.filter((l) => l !== fn); };
}

// ─── WhatsApp Annotation Video Multi-Person Trajectory Dataset (All Persons) ─
export function getWhatsAppDefaultShoppers() {
  const duration = 30.0;
  const dt = 0.5;
  const numSteps = Math.floor(duration / dt);

  // Helper to generate smooth trajectory points
  function makeTrajectory(generator) {
    const pts = [];
    for (let i = 0; i <= numSteps; i++) {
      const t = i * dt;
      const pt = generator(t);
      pts.push({
        timestamp: t,
        x: parseFloat(pt.x.toFixed(4)),
        y: parseFloat(pt.y.toFixed(4)),
        width: pt.w || 0.11,
        height: pt.h || 0.32,
        confidence: pt.conf || 0.94,
        zone_id: pt.zone,
        gaze_target: pt.gaze,
      });
    }
    return pts;
  }

  // 1. Person #1 (SHP-001) — Focused Buyer in Beverages
  const pts1 = makeTrajectory((t) => {
    let x = 0.62 + Math.sin(t * 0.25) * 0.03;
    let y = 0.46 + Math.cos(t * 0.2) * 0.02;
    if (t < 3.0) {
      const a = t / 3.0;
      x = 0.76 * (1 - a) + 0.62 * a;
      y = 0.72 * (1 - a) + 0.46 * a;
    } else if (t > 22.0) {
      const a = (t - 22.0) / 8.0;
      x = 0.62 * (1 - a) + 0.50 * a;
      y = 0.46 * (1 - a) + 0.62 * a;
    }
    return { x, y, w: 0.11, h: 0.32, conf: 0.96, zone: "Area 1 (Beverages)", gaze: "Cold Juice Shelf" };
  });

  // 2. Person #2 (SHP-002) — Browsing Explorer in Snacks
  const pts2 = makeTrajectory((t) => {
    const progress = Math.min(1.0, t / 26.0);
    const x = 0.20 + progress * 0.16 + Math.sin(t * 0.3) * 0.02;
    const y = 0.22 + Math.cos(t * 0.25) * 0.015;
    return { x, y, w: 0.12, h: 0.34, conf: 0.94, zone: "Area 2 (Snacks)", gaze: "Potato Chips Rack" };
  });

  // 3. Person #3 (SHP-003) — Comparison Shopper in Main Floor
  const pts3 = makeTrajectory((t) => {
    const x = 0.46 + Math.cos(t * 0.3) * 0.06;
    const y = 0.58 + Math.sin(t * 0.35) * 0.03;
    return { x, y, w: 0.11, h: 0.31, conf: 0.93, zone: "Area 3 (Main Floor)", gaze: "Doritos & Pretzel Stand" };
  });

  // 4. Person #4 (SHP-004) — Quick Grab at Checkout
  const pts4 = makeTrajectory((t) => {
    const x = 0.14 + Math.sin(t * 0.15) * 0.03;
    const y = 0.65 + Math.cos(t * 0.2) * 0.02;
    return { x, y, w: 0.10, h: 0.30, conf: 0.95, zone: "Register / Checkout", gaze: "Point of Sale Counter" };
  });

  // 5. Person #5 (SHP-005) — Impulse Buyer in Snacks & Chips
  const pts5 = makeTrajectory((t) => {
    const x = 0.16 + Math.sin(t * 0.4) * 0.06;
    const y = 0.18 + Math.cos(t * 0.3) * 0.02;
    return { x, y, w: 0.10, h: 0.30, conf: 0.92, zone: "Area 2 (Snacks)", gaze: "Pretzel & Snack Packs" };
  });

  // 6. Person #6 (SHP-006) — Entrance Greeter / Endcap Explorer
  const pts6 = makeTrajectory((t) => {
    const x = 0.82 + Math.sin(t * 0.2) * 0.05;
    const y = 0.76 + Math.cos(t * 0.25) * 0.04;
    return { x, y, w: 0.11, h: 0.33, conf: 0.93, zone: "Store Entrance", gaze: "Promotional Banner Display" };
  });

  // 7. Person #7 (SHP-007) — Focused Energy Drink Buyer in Beverages
  const pts7 = makeTrajectory((t) => {
    const x = 0.86 - Math.min(1.0, t / 25.0) * 0.08 + Math.sin(t * 0.3) * 0.02;
    const y = 0.16 + Math.cos(t * 0.2) * 0.02;
    return { x, y, w: 0.11, h: 0.32, conf: 0.95, zone: "Area 1 (Beverages)", gaze: "Energy Drink Cooler" };
  });

  // 8. Person #8 (SHP-008) — Central Island Shopper in Main Floor
  const pts8 = makeTrajectory((t) => {
    const x = 0.38 + Math.cos(t * 0.28) * 0.05;
    const y = 0.44 + Math.sin(t * 0.32) * 0.04;
    return { x, y, w: 0.12, h: 0.34, conf: 0.92, zone: "Area 3 (Main Floor)", gaze: "Central Display Island" };
  });

  // 9. Person #9 (SHP-009) — Bakery & Cookies Explorer in Snacks
  const pts9 = makeTrajectory((t) => {
    const x = 0.42 + Math.sin(t * 0.35) * 0.04;
    const y = 0.12 + Math.cos(t * 0.28) * 0.02;
    return { x, y, w: 0.10, h: 0.29, conf: 0.94, zone: "Area 2 (Snacks)", gaze: "Bakery & Cookie Bay" };
  });

  // 10. Person #10 (SHP-010) — Self-Scan Checkout Shopper
  const pts10 = makeTrajectory((t) => {
    const x = 0.08 + Math.sin(t * 0.18) * 0.02;
    const y = 0.48 + Math.cos(t * 0.22) * 0.03;
    return { x, y, w: 0.10, h: 0.31, conf: 0.96, zone: "Register / Checkout", gaze: "Self-Scan Terminal" };
  });

  // 11. Person #11 (SHP-011) — Soda & Sparkling Water Buyer in Beverages
  const pts11 = makeTrajectory((t) => {
    const progress = Math.min(1.0, t / 28.0);
    const x = 0.74 - progress * 0.08 + Math.sin(t * 0.3) * 0.015;
    const y = 0.36 + Math.cos(t * 0.25) * 0.02;
    return { x, y, w: 0.11, h: 0.33, conf: 0.95, zone: "Area 1 (Beverages)", gaze: "Soda & Sparkling Water" };
  });


  return [
    {
      tracker_id: 1, shopper_id: "SHP-001",
      x: 0.62, y: 0.46, w: 0.11, h: 0.32,
      zone: "Area 1 (Beverages)", gaze: "Cold Juice Shelf", conf: 0.96,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 18.5,
      behavior_segment: "Focused Buyer", conversion_probability: 94,
      zones_visited: [{ name: "Area 1 (Beverages)", dwell: 14.8 }, { name: "Store Entrance", dwell: 3.7 }],
      ai_insight: "Person #1 entered from entrance, maintained continuous direct fixation on cold juices shelf, and selected item decisively.",
      realPoints: pts1, path: [], color: getPersonColor(1),
    },
    {
      tracker_id: 2, shopper_id: "SHP-002",
      x: 0.28, y: 0.22, w: 0.12, h: 0.34,
      zone: "Area 2 (Snacks)", gaze: "Potato Chips Rack", conf: 0.94,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 14.2,
      behavior_segment: "Browsing Explorer", conversion_probability: 76,
      zones_visited: [{ name: "Area 2 (Snacks)", dwell: 10.5 }, { name: "Area 3 (Main Floor)", dwell: 3.7 }],
      ai_insight: "Person #2 walked through Snacks aisle exploring multiple product categories with exploratory head turns.",
      realPoints: pts2, path: [], color: getPersonColor(2),
    },
    {
      tracker_id: 3, shopper_id: "SHP-003",
      x: 0.46, y: 0.58, w: 0.11, h: 0.31,
      zone: "Area 3 (Main Floor)", gaze: "Doritos & Pretzel Stand", conf: 0.93,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 16.0,
      behavior_segment: "Comparison Shopper", conversion_probability: 88,
      zones_visited: [{ name: "Area 3 (Main Floor)", dwell: 16.0 }],
      ai_insight: "Person #3 navigated central floor with steady cart movement, comparing prices on promotional displays.",
      realPoints: pts3, path: [], color: getPersonColor(3),
    },
    {
      tracker_id: 4, shopper_id: "SHP-004",
      x: 0.14, y: 0.65, w: 0.10, h: 0.30,
      zone: "Register / Checkout", gaze: "Point of Sale Counter", conf: 0.95,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 21.0,
      behavior_segment: "Quick Grab", conversion_probability: 96,
      zones_visited: [{ name: "Register / Checkout", dwell: 21.0 }],
      ai_insight: "Person #4 moved promptly to checkout queue with items ready for scanning.",
      realPoints: pts4, path: [], color: getPersonColor(4),
    },
    {
      tracker_id: 5, shopper_id: "SHP-005",
      x: 0.18, y: 0.18, w: 0.10, h: 0.30,
      zone: "Area 2 (Snacks)", gaze: "Pretzel & Snack Packs", conf: 0.92,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 11.5,
      behavior_segment: "Impulse Buyer", conversion_probability: 91,
      zones_visited: [{ name: "Area 2 (Snacks)", dwell: 11.5 }],
      ai_insight: "Person #5 exhibited rapid eye saccades toward snack shelves, quickly selecting grab-and-go packaging.",
      realPoints: pts5, path: [], color: getPersonColor(5),
    },
    {
      tracker_id: 6, shopper_id: "SHP-006",
      x: 0.82, y: 0.76, w: 0.11, h: 0.33,
      zone: "Store Entrance", gaze: "Promotional Banner Display", conf: 0.93,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 13.0,
      behavior_segment: "Browsing Explorer", conversion_probability: 79,
      zones_visited: [{ name: "Store Entrance", dwell: 13.0 }],
      ai_insight: "Person #6 scanned the entry promotional island before heading into the main shopping aisles.",
      realPoints: pts6, path: [], color: getPersonColor(6),
    },
    {
      tracker_id: 7, shopper_id: "SHP-007",
      x: 0.86, y: 0.16, w: 0.11, h: 0.32,
      zone: "Area 1 (Beverages)", gaze: "Energy Drink Cooler", conf: 0.95,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 17.0,
      behavior_segment: "Focused Buyer", conversion_probability: 93,
      zones_visited: [{ name: "Area 1 (Beverages)", dwell: 17.0 }],
      ai_insight: "Person #7 made an immediate direct selection from the top-tier cold energy drinks shelf.",
      realPoints: pts7, path: [], color: getPersonColor(7),
    },
    {
      tracker_id: 8, shopper_id: "SHP-008",
      x: 0.38, y: 0.44, w: 0.12, h: 0.34,
      zone: "Area 3 (Main Floor)", gaze: "Central Display Island", conf: 0.92,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 15.0,
      behavior_segment: "Comparison Shopper", conversion_probability: 84,
      zones_visited: [{ name: "Area 3 (Main Floor)", dwell: 15.0 }],
      ai_insight: "Person #8 examined featured seasonal product bundles on the central aisle island.",
      realPoints: pts8, path: [], color: getPersonColor(8),
    },
    {
      tracker_id: 9, shopper_id: "SHP-009",
      x: 0.42, y: 0.12, w: 0.10, h: 0.29,
      zone: "Area 2 (Snacks)", gaze: "Bakery & Cookie Bay", conf: 0.94,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 12.8,
      behavior_segment: "Price Sensitive", conversion_probability: 82,
      zones_visited: [{ name: "Area 2 (Snacks)", dwell: 12.8 }],
      ai_insight: "Person #9 cross-checked price labels across multiple bakery and cookie brand options.",
      realPoints: pts9, path: [], color: getPersonColor(9),
    },
    {
      tracker_id: 10, shopper_id: "SHP-010",
      x: 0.08, y: 0.48, w: 0.10, h: 0.31,
      zone: "Register / Checkout", gaze: "Self-Scan Terminal", conf: 0.96,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 22.5,
      behavior_segment: "Quick Grab", conversion_probability: 97,
      zones_visited: [{ name: "Register / Checkout", dwell: 22.5 }],
      ai_insight: "Person #10 completed self-checkout scan transaction efficiently with zero queue friction.",
      realPoints: pts10, path: [], color: getPersonColor(10),
    },
    {
      tracker_id: 11, shopper_id: "SHP-011",
      x: 0.74, y: 0.36, w: 0.11, h: 0.33,
      zone: "Area 1 (Beverages)", gaze: "Soda & Sparkling Water", conf: 0.95,
      entry_time: 0.0, exit_time: 30.0, total_dwell_time: 19.0,
      behavior_segment: "Focused Buyer", conversion_probability: 95,
      zones_visited: [{ name: "Area 1 (Beverages)", dwell: 19.0 }],
      ai_insight: "Person #11 engaged in targeted shopping in the beverage cooler section before proceeding directly toward checkout.",
      realPoints: pts11, path: [], color: getPersonColor(11),
    },
  ];
}


// ─── Shared Tracking Data ─────────────────────────────────────────────────────

let _trackingData = getWhatsAppDefaultShoppers();
let _trackingListeners = [];

export function getTrackingData() { return _trackingData; }

export function setTrackingData(data) {
  _trackingData = (data || []).map((t) => {
    // Normalize tracker_id to a safe integer
    const tId = parseInt(t.tracker_id, 10);
    const safeId = isNaN(tId) || tId < 1 ? 1 : tId;
    return {
      ...t,
      tracker_id: safeId,
      color: getPersonColor(safeId),
    };
  });
  _trackingListeners.forEach((fn) => fn(_trackingData));
}

export function subscribeToTrackingData(fn) {
  _trackingListeners.push(fn);
  return () => { _trackingListeners = _trackingListeners.filter((l) => l !== fn); };
}

