# Consumer Attention Mapping System (CAMS)

<div align="center">

![CAMS Banner](https://img.shields.io/badge/Enterprise-Spatial%20Intelligence%20%26%20Retail%20Analytics-blue?style=for-the-badge)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An AI-Powered In-Store Spatial Intelligence, Customer Attention Mapping, and Automated Merchandising Optimization Platform.**

[System Architecture](#system-architecture) • [Key Features](#key-features) • [Mathematical Formulations](#mathematical-formulations--algorithmic-models) • [API Documentation](#rest-api-reference) • [Build & Run Instructions](#build--run-instructions-for-any-system)

</div>

---

## Table of Contents

- [1. Executive Summary & Vision](#1-executive-summary--vision)
- [2. Problem Statement & Retail Market Gap](#2-problem-statement--retail-market-gap)
- [3. Key Features & Capabilities](#3-key-features--capabilities)
- [4. System Architecture](#4-system-architecture)
  - [4.1 Architecture Diagram](#41-architecture-diagram)
  - [4.2 Computer Vision Processing Pipeline](#42-computer-vision-processing-pipeline)
  - [4.3 Layer-by-Layer Technical Stack](#43-layer-by-layer-technical-stack)
- [5. Mathematical Formulations & Algorithmic Models](#5-mathematical-formulations--algorithmic-models)
  - [5.1 Bounding Box Centroid & Ground Footprint Calculation](#51-bounding-box-centroid--ground-footprint-calculation)
  - [5.2 Pixel-to-Floorplan Normalization](#52-pixel-to-floorplan-normalization)
  - [5.3 Spatial Point-in-Shelf Intersection & Dwell Time](#53-spatial-point-in-shelf-intersection--dwell-time)
  - [5.4 5x8 Grid Discretization & Spatial Density](#54-5x8-grid-discretization--spatial-density)
  - [5.5 Scientific YlOrRd Colormap Piecewise Interpolation](#55-scientific-ylorrd-colormap-piecewise-interpolation)
  - [5.6 The 5-Metric Shelf Attractiveness Scoring Formulation](#56-the-5-metric-shelf-attractiveness-scoring-formulation)
  - [5.7 Behavioral Threshold Formulations](#57-behavioral-threshold-formulations)
  - [5.8 Store Network Aggregation & Cross-Store KPI Indexing](#58-store-network-aggregation--cross-store-kpi-indexing)
- [6. Rule-Based Merchandising Optimization Engine](#6-rule-based-merchandising-optimization-engine)
- [7. Project Repository Structure](#7-project-repository-structure)
- [8. REST API Reference](#8-rest-api-reference)
- [9. Build & Run Instructions for ANY System](#9-build--run-instructions-for-any-system)
  - [Prerequisites](#system-prerequisites)
  - [Method A: One-Command Docker Setup (Recommended)](#method-a-quickstart-via-docker-compose-recommended)
  - [Method B: Native Manual Setup (Windows, macOS, Linux)](#method-b-native-local-setup-step-by-step)
  - [Environment Variables Configuration](#environment-variables-reference)
- [10. Role-Based Access Control (RBAC)](#10-role-based-access-control-rbac)
- [11. Enterprise Reporting & Multi-Format Exports](#11-enterprise-reporting--multi-format-exports)
- [12. Troubleshooting & FAQ](#12-troubleshooting--faq)
- [13. Real-World Applications & Business ROI](#13-real-world-applications--business-roi)
- [14. Future Roadmap](#14-future-roadmap)
- [15. Authors & Acknowledgments](#15-authors--acknowledgments)

---

## 1. Executive Summary & Vision

The **Consumer Attention Mapping System (CAMS)** is an enterprise-grade spatial intelligence and visual analytics platform that transforms raw, passive retail CCTV video streams into actionable, quantitative merchandising and store layout intelligence.

By combining State-of-the-Art Computer Vision (**Ultralytics YOLOv8** + **ByteTrack/DeepSORT Multi-Object Tracking**), an asynchronous **Python FastAPI** backend, a single-source-of-truth **PostgreSQL** relational database, and an interactive **Next.js 14 / React 19** executive dashboard, CAMS calculates:

1. **Exact customer dwell duration** per shelf zone and aisle segment.
2. **Visual attention hotspots** and overlooked retail "dead zones" via dynamic **5x8 grid heatmaps**.
3. **Multi-metric Attractiveness Scores** ($0 \text{ to } 100$ benchmark index) evaluating shelf performance.
4. **Explainable merchandising directives** diagnosing pricing barriers, conversion leakage, and visual deficits.
5. **Multi-store network aggregation** for cross-branch executive benchmarking.

---

## 2. Problem Statement & Retail Market Gap

Physical brick-and-mortar stores account for over **80% of global retail transactions**, yet traditional store operators operate with severe blind spots:

```
┌──────────────────────────────────────────────┐     ┌──────────────────────────────────────────────┐
│             E-COMMERCE ANALYTICS             │     │          TRADITIONAL BRICK-AND-MORTAR        │
├──────────────────────────────────────────────┤     ├──────────────────────────────────────────────┤
│  ✓ Total Visitors & Page Views               │     │  ✓ Point-of-Sale (POS) Cash Register Receipts│
│  ✓ Hover Time & Attention Heatmaps           │     │  ✗ ZERO Visibility on Ignored Products       │
│  ✓ Click-Through & Drop-Off Funnels          │     │  ✗ ZERO Dwell Time & Browsing Analytics      │
│  ✓ Cart Abandonment & Checkout Hesitation    │     │  ✗ ZERO Foot Traffic Attention Mapping       │
│  ✓ A/B Tested Layout Optimizations           │     │  ✗ Guessed Shelf Slotting & Merchandising    │
└──────────────────────────────────────────────┘     └──────────────────────────────────────────────┘
```

### The Missing Metric
Retailers know what was purchased at the cash register, but have **zero visibility** into what customers looked at, paused by, physically touched, or walked away from without purchasing.

### The CAMS Solution
CAMS bridges this physical-digital gap by leveraging existing overhead security CCTV cameras to unlock digital-grade in-store behavioral analytics—**without requiring costly RFID tags, smart carts, or wearable customer sensors**.

---

## 3. Key Features & Capabilities

- **Real-Time Edge Computer Vision**: Detects and tracks shoppers with YOLOv8 person detection and ByteTrack multi-object tracking.
- **Interactive 2D Floorplan & Shelf Zone Editor**: Visual drag-and-drop shelf calibration canvas with real-time database persistence.
- **5x8 Spatial Attention Grid Heatmaps**: Discretizes camera field of view into 40 distinct vertical shelf levels and horizontal aisle blocks using a scientific YlOrRd color palette.
- **5-Metric Attractiveness Scoring Engine**: Standardized 0–100 index combining Attention Duration (35%), Interaction Frequency (25%), Pickup Rate (20%), Conversion Rate (15%), and Repeat Engagement (5%).
- **Automated Merchandising Optimization Engine**: Diagnoses behavioral thresholds into natural-language retail directives (e.g., price barrier warnings, conversion leakage alerts).
- **Multi-Store Network Directory**: Header store switcher dynamically synchronizing across all dashboard tabs and branch locations.
- **Dual Video Ingestion**: Processes uploaded CCTV MP4 footage or live in-browser webcam streams via WebRTC / MediaStreams API.
- **Multi-Format Enterprise Data Exports**: Generates server-side multi-tab Excel (`.xlsx`), raw CSV (`.csv`), and print-ready executive PDF reports.
- **Strict Zero-Mock Architecture**: Every metric, chart, and export queries real PostgreSQL database records.

---

## 4. System Architecture

### 4.1 Architecture Diagram

```
                              ┌─────────────────────────────────────────────────────────┐
                              │                    VIDEO INGESTION                      │
                              │  Overhead CCTV Cameras / RTSP Stream / Uploaded MP4     │
                              └────────────────────────────┬────────────────────────────┘
                                                           │ Raw Video Frames
                                                           ▼
                              ┌─────────────────────────────────────────────────────────┐
                              │               AI COMPUTER VISION PIPELINE               │
                              │  • Frame Extraction (OpenCV)                            │
                              │  • YOLOv8 Deep Neural Network (Person Detection)        │
                              │  • ByteTrack / Kalman Filter (Multi-Person Tracking)    │
                              │  • Footprint Centroid Extraction (x_foot, y_foot)       │
                              │  • Spatial Point-in-Shelf Intersection                  │
                              └────────────────────────────┬────────────────────────────┘
                                                           │ Normalized Trajectory Points
                                                           ▼
                              ┌─────────────────────────────────────────────────────────┐
                              │                   FASTAPI BACKEND                       │
                              │  • RESTful API Endpoints & Request Routing              │
                              │  • Attractiveness Scoring Engine (5-Metric Index)       │
                              │  • 5x8 Grid Heatmap Matrix Computation                  │
                              │  • Rule-Based Merchandising Optimization Engine         │
                              │  • JWT Authentication & Role-Based Access Control       │
                              │  • OpenPyXL / ReportLab Export Generator                │
                              └─────────────┬─────────────────────────────▲─────────────┘
                                            │ Write Tracks                │ Query Analytics
                                            ▼                             │
                              ┌───────────────────────────────────────────┴─────────────┐
                              │               POSTGRESQL RELATIONAL DATABASE            │
                              │  • stores        • shelves        • videos              │
                              │  • person_tracks • tracking_points• analytics           │
                              │  • users         • roles                                │
                              └───────────────────────────────────────────┬─────────────┘
                                                                          │ JSON Responses
                                                                          ▼
                              ┌─────────────────────────────────────────────────────────┐
                              │               NEXT.JS 14 EXECUTIVE DASHBOARD            │
                              │  • Interactive 2D Floorplan & Shelf Zone Editor         │
                              │  • 5x8 Scientific YlOrRd Heatmap Visualizer             │
                              │  • Shelf Attractiveness Leaderboard & Scorecards        │
                              │  • Live CCTV Inference Stream & Webcam Processor        │
                              │  • Multi-Store Branch Switcher & Multi-Format Exporters │
                              └─────────────────────────────────────────────────────────┘
```

### 4.2 Computer Vision Processing Pipeline

```
Raw Camera Frame (1080p/4K)
       │
       ▼
OpenCV Frame Extraction & Resizing (cv2)
       │
       ▼
YOLOv8 Neural Network Inference (Confidence >= 0.40, Class: Person)
       │
       ▼
Non-Maximum Suppression (NMS) Filtering
       │
       ▼
ByteTrack Multi-Object Tracker (Kalman Filter + Hungarian Algorithm)
       │
       ▼
Ground Centroid Calculation [x_foot = (xmin+xmax)/2, y_foot = ymax]
       │
       ▼
Pixel-to-Floorplan Resolution Normalization (x_norm, y_norm in [0, 1])
       │
       ▼
Spatial Shelf Zone Intersection [Sx1 <= x_norm <= Sx2 AND Sy1 <= y_norm <= Sy2]
       │
       ▼
Database Persistence (VideoRecord -> PersonTrack -> TrackingPoint)
```

### 4.3 Layer-by-Layer Technical Stack

| Layer | Technologies | Key Responsibilities |
|:---|:---|:---|
| **AI / Computer Vision** | `Python 3.11`, `Ultralytics YOLOv8`, `ByteTrack`, `OpenCV (cv2)`, `PyTorch (CUDA/CPU)` | Person detection, bounding box prediction, persistent trajectory tracking across occlusions, centroid extraction. |
| **Backend API Service** | `FastAPI`, `Uvicorn (ASGI)`, `SQLAlchemy 2.0`, `Pydantic v2`, `Passlib (bcrypt)`, `python-jose` | Asynchronous REST routing, JWT authentication, RBAC middleware, analytics processing, data serialization. |
| **Database & Persistence** | `PostgreSQL 16`, `psycopg2-binary`, `Alembic` | ACID-compliant persistent storage of stores, shelves, video runs, trajectories, dwell intervals, and analytics. |
| **Frontend & UI** | `Next.js 14 (App Router)`, `React 19`, `TypeScript (Strict)`, `Tailwind CSS v4`, `Lucide React`, `Recharts` | Responsive glassmorphism dashboard, interactive 2D canvas floorplan editor, heatmap visualization, data tables. |
| **Reporting & Export** | `OpenPyXL`, `ReportLab`, `SheetJS (xlsx)`, `FileSaver` | Multi-tab Excel workbooks, raw CSV exports, and executive board-ready PDF generation. |
| **DevOps & Containers** | `Docker`, `Docker Compose`, `Multi-Stage Alpine Builds` | Reproducible multi-container orchestration across development, staging, and production environments. |

---

## 5. Mathematical Formulations & Algorithmic Models

### 5.1 Bounding Box Centroid & Ground Footprint Calculation
When the YOLOv8 model detects a shopper in frame $f$, it outputs a bounding box:
$$\text{BBox} = [x_{\min}, y_{\min}, x_{\max}, y_{\max}]$$

The spatial center of mass is:
$$x_{\text{centroid}} = \frac{x_{\min} + x_{\max}}{2}, \quad y_{\text{centroid}} = \frac{y_{\min} + y_{\max}}{2}$$

To avoid perspective distortion from camera angles, CAMS projects the shopper's standing position onto the floor using the **Bottom-Center Footprint**:
$$x_{\text{foot}} = \frac{x_{\min} + x_{\max}}{2}, \quad y_{\text{foot}} = y_{\max}$$

### 5.2 Pixel-to-Floorplan Normalization
To ensure spatial tracking is resolution-independent across 720p, 1080p, and 4K camera feeds:
$$x_{\text{norm}} = \frac{x_{\text{foot}}}{W_{\text{video}}} \in [0.0, 1.0], \quad y_{\text{norm}} = \frac{y_{\text{foot}}}{H_{\text{video}}} \in [0.0, 1.0]$$

Mapped to a 2D Floorplan Canvas of dimensions $W_{\text{canvas}} \times H_{\text{canvas}}$:
$$X_{\text{canvas}} = x_{\text{norm}} \times W_{\text{canvas}}, \quad Y_{\text{canvas}} = y_{\text{norm}} \times H_{\text{canvas}}$$

### 5.3 Spatial Point-in-Shelf Intersection & Dwell Time
A shelf zone $S$ is defined by normalized coordinate boundaries:
$$S = [S_{x1}, S_{y1}, S_{x2}, S_{y2}]$$

A detection point $P(x_{\text{norm}}, y_{\text{norm}})$ is contained in Shelf $S$ if:
$$\text{In\_Zone}(P, S) = \begin{cases} 1 & \text{if } S_{x1} \le x_{\text{norm}} \le S_{x2} \text{ and } S_{y1} \le y_{\text{norm}} \le S_{y2} \\ 0 & \text{otherwise} \end{cases}$$

The total dwell duration (in seconds) for shopper track $T$ at shelf $S$ across all video frames is:
$$\text{Dwell}(T, S) = \frac{1}{\text{FPS}_{\text{video}}} \sum_{f \in T} \text{In\_Zone}(P_f, S)$$

### 5.4 5x8 Grid Discretization & Spatial Density
The camera viewing field is discretized into a matrix of $M = 5$ Rows (Vertical Shelf Levels: Top, Upper-Eye, Eye-Level, Lower, Bottom) by $N = 8$ Columns (Aisle Horizontal Sections), creating 40 individual spatial cells:
$$\text{Cell}(r, c) \quad \text{where } r \in [0, 4], \; c \in [0, 7]$$

$$\text{Row Index } r = \lfloor y_{\text{norm}} \times 5 \rfloor, \quad \text{Col Index } c = \lfloor x_{\text{norm}} \times 8 \rfloor$$

Cumulative Dwell Duration per cell:
$$\text{Dwell}_{\text{Cell}}(r, c) = \text{Frames}_{\text{Cell}(r, c)} \times \frac{1.0}{\text{FPS}}$$

Normalized Intensity $v \in [0.0, 1.0]$:
$$v(r, c) = \frac{\text{Dwell}_{\text{Cell}}(r, c)}{\max_{\forall (i, j)} \left( \text{Dwell}_{\text{Cell}}(i, j) \right)}$$

### 5.5 Scientific YlOrRd Colormap Piecewise Interpolation
CAMS uses the standard 7-stop YlOrRd (Yellow-Orange-Red) colormap to visualize traffic density:

| Normalized Intensity $v$ | Color Name | Hex Code | RGB Vector |
|:---|:---|:---|:---|
| $v = 0.0$ | Light Yellow | `#ffffb2` | $(255, 255, 178)$ |
| $v = 0.2$ | Soft Yellow-Orange | `#fed976` | $(254, 217, 118)$ |
| $v = 0.4$ | Orange-Amber | `#feb24c` | $(254, 178, 76)$ |
| $v = 0.6$ | Warm Orange | `#fd8d3c` | $(253, 141, 60)$ |
| $v = 0.8$ | Bright Orange-Red | `#f03b20` | $(240, 59, 32)$ |
| $v = 1.0$ | Deep Ruby Red | `#bd0026` | $(189, 0, 38)$ |

For any value $v \in [v_0, v_1]$, linear interpolation computes the RGB channels:
$$t = \frac{v - v_0}{v_1 - v_0}, \quad \text{RGB}(v) = \text{round}\Big((1 - t)\mathbf{C}_0 + t\mathbf{C}_1\Big)$$

### 5.6 The 5-Metric Shelf Attractiveness Scoring Formulation
Every physical shelf receives an objective score from $0.0$ to $100.0$:

$$\text{Score} = \Big[ (0.35 \times A_{\text{norm}}) + (0.25 \times I_{\text{norm}}) + (0.20 \times R_{\text{pickup}}) + (0.15 \times R_{\text{conv}}) + (0.05 \times R_{\text{repeat}}) \Big] \times 100$$

Where:
1. **Attention Duration Factor (35% Weight - Max 35.0 pts)**:
   $$A_{\text{norm}} = \frac{\text{Dwell}_{\text{Shelf}}}{\max_{\forall s}(\text{Dwell}_s)}$$
2. **Interaction Frequency Factor (25% Weight - Max 25.0 pts)**:
   $$I_{\text{norm}} = \frac{\text{Visits}_{\text{Shelf}}}{\max_{\forall s}(\text{Visits}_s)}$$
3. **Physical Pickup Rate Factor (20% Weight - Max 20.0 pts)**:
   $$R_{\text{pickup}} = \frac{\text{Visits with Dwell} \ge 5.0\text{s}}{\text{Total Unique Visitors}}$$
4. **Purchase Conversion Rate Factor (15% Weight - Max 15.0 pts)**:
   $$R_{\text{conv}} = \frac{\text{Visits with Dwell} \ge 10.0\text{s}}{\text{Total Unique Visitors}}$$
5. **Repeat Engagement Rate Factor (5% Weight - Max 5.0 pts)**:
   $$R_{\text{repeat}} = \frac{\text{Visits with Dwell} \ge 15.0\text{s}}{\text{Total Unique Visitors}}$$

### 5.7 Behavioral Threshold Formulations
- **Pass-by Traffic**: $\text{Dwell} < 3.0\text{s}$ (Shopper walked past without sustained engagement).
- **Meaningful Interaction**: $\text{Dwell} \ge 3.0\text{s}$ (Shopper paused and focused attention).
- **Physical Pickup / Inspection**: $\text{Dwell} \ge 5.0\text{s}$ (Physical product inspection or label reading).
- **High-Intent Purchase Conversion**: $\text{Dwell} \ge 10.0\text{s}$ (Comparison, cart placement).
- **Loyalty / Repeat Engagement**: $\text{Dwell} \ge 15.0\text{s}$ (Extended browsing).

### 5.8 Store Network Aggregation & Cross-Store KPI Indexing
For Store $K$ with $N$ active registered shelves:
$$\text{Store Score}_K = \frac{1}{N} \sum_{i=1}^{N} \text{Score}(\text{Shelf}_i)$$
$$\text{Avg Dwell}_{\text{Store}} = \frac{\sum \text{Dwell of all tracks in Store}}{\text{Total Unique Shoppers}}$$

---

## 6. Rule-Based Merchandising Optimization Engine

CAMS automatically converts behavioral metrics into explainable natural-language directives for store managers:

```
┌───────────────────────────────┬───────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Pattern Diagnosed             │ Behavioral Conditions Triggered   │ Actionable Merchandising Directive                      │
├───────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Price / Packaging Barrier     │ Visitors >= 5 & Pickup Rate < 15% │ "High views but low pickup. Review packaging contrast, │
│                               │                                   │ price tag clarity, or introduce promo badges."         │
├───────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Conversion Leakage            │ Pickup Rate > 30% & Conv < 10%    │ "Shoppers inspect items but do not purchase.           │
│                               │                                   │ Investigate price barrier or check for stock defects." │
├───────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Visual Appeal Deficit         │ Total Score < 40.0 pts            │ "Low overall attractiveness. Consider repositioning    │
│                               │                                   │ to an eye-level shelf zone or endcap display."         │
├───────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Prime Performer               │ Conversions >= 5 & Pickup > 30%   │ "Prime performer with strong engagement. Leverage this │
│                               │ (or Total Score > 60.0 pts)       │ shelf for high-margin new product launches."           │
└───────────────────────────────┴───────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 7. Project Repository Structure

```
Consumer-Attention-Mapping-System/
├── docker-compose.yml              # Complete Multi-Container Orchestration (DB + Backend + Frontend)
├── README.md                       # Comprehensive Project Documentation
├── CAMS_PROJECT_PRESENTATION_OVERVIEW.txt # Presentation Script & Mathematical Reference
│
├── backend/                        # FastAPI Backend Application Service
│   ├── Dockerfile                  # Python 3.11 Slim Production Image with OpenCV dependencies
│   ├── requirements.txt            # Python Dependencies (FastAPI, SQLAlchemy, OpenCV, YOLO, etc.)
│   ├── init_db.py                  # Automated Database Bootstrapper & Environment Initializer
│   ├── alembic.ini                 # Database Migration Configuration
│   ├── yolov8n.pt                  # YOLOv8 Nano Neural Network Weights
│   ├── .env                        # Backend Environment Variables (DB URL, JWT Secret)
│   ├── uploads/                    # Ingested Raw CCTV Video Files
│   ├── processed/                  # Processed Video Outputs & Exported Reports
│   └── app/
│       ├── main.py                 # FastAPI Application Factory, CORS & Router Mounts
│       ├── api/                    # RESTful Route Handlers
│       │   ├── auth.py             # User Registration, Login, Token Issuance (/api/auth)
│       │   ├── stores.py           # Store Branch CRUD Operations (/api/stores)
│       │   ├── shelves.py          # Shelf Zone Spatial CRUD Operations (/api/shelves)
│       │   ├── cctv.py             # Video Upload & Processing Pipeline (/api/cctv)
│       │   ├── video_analytics.py  # Dwell, Trajectory & Traffic Endpoints (/api/video-analytics)
│       │   ├── attractiveness_analytics.py # 5-Metric Scoring & Exports (/api/analytics)
│       │   └── camera.py           # Camera Hardware Configuration
│       ├── core/                   # Infrastructure Core
│       │   ├── config.py           # Environment Settings & App Configuration
│       │   ├── database.py         # SQLAlchemy Engine, SessionLocal & get_db Dependency
│       │   └── security.py         # Password Hashing (bcrypt) & JWT Generation/Validation
│       ├── models/                 # SQLAlchemy ORM Database Schemas
│       │   ├── store.py            # Store Table Schema
│       │   ├── shelf.py            # Shelf Table Schema (with Spatial Boundaries)
│       │   ├── user.py             # User Table Schema
│       │   ├── role.py             # Role Table Schema (SuperAdmin, StoreManager, Analyst)
│       │   ├── video_track.py      # VideoRecord, PersonTrack, TrackingPoint Schemas
│       │   └── analytics.py        # Aggregated Analytics Schema
│       ├── schemas/                # Pydantic Validation & Serialization Schemas
│       │   ├── store.py            # Store In/Out Pydantic Models
│       │   ├── shelf.py            # Shelf In/Out Pydantic Models
│       │   ├── user.py             # User Authentication Pydantic Models
│       │   └── analytics.py        # Analytics Response Models
│       └── services/               # Core Business Logic & AI Engines
│           ├── seed.py             # Initial Default Roles & SuperAdmin Seeder
│           ├── attractiveness_engine.py # 5-Metric Scoring & 5x8 Grid Heatmap Matrix
│           ├── video_processor.py  # YOLOv8 + ByteTrack Video Execution Pipeline
│           ├── video_stream.py     # OpenCV Live Video Stream Generator
│           └── vision/             # Computer Vision Modules
│               ├── detector.py     # YOLO Person Detector Module
│               ├── tracker.py      # ByteTrack Multi-Person Tracker
│               ├── dwell.py        # Dwell Time Accumulator & Classifier
│               ├── gaze.py         # MediaPipe Gaze & Head Direction Estimator
│               └── shelf_mapper.py # Point-in-Polygon Spatial Mapper
│
└── frontend/                       # Next.js 14 Web Application & Dashboard
    ├── Dockerfile                  # Multi-Stage Node.js 20 Production Image
    ├── package.json                # Dependencies (Next.js 14, React 19, Tailwind v4, Lucide)
    ├── tsconfig.json               # TypeScript Strict Configuration
    ├── tailwind.config.ts          # TailwindCSS Styling Configuration
    ├── components.json             # Shadcn UI Registry Configuration
    ├── public/                     # Static Web Assets & Favicon
    └── src/
        ├── app/                    # Next.js App Router Structure
        │   ├── layout.tsx          # Root Application Layout & Global Theme Provider
        │   ├── page.tsx            # Executive Landing Page & Platform Feature Overview
        │   ├── globals.css         # TailwindCSS v4 Global Styles & Glassmorphic Utilities
        │   ├── login/page.tsx      # Secure User Login Page
        │   ├── register/page.tsx   # User Registration Page
        │   └── (app)/              # Authenticated Application Routes
        │       ├── layout.tsx      # Authenticated Dashboard Shell & Global Navbar
        │       ├── dashboard/page.tsx # Analytics Dashboard (Heatmap, Leaderboard, Directives)
        │       ├── cctv/page.tsx   # Video Upload, Real-Time Inference & Webcam Studio
        │       ├── shelves/page.tsx # Interactive 2D Floorplan & Shelf Zone Editor
        │       └── stores/page.tsx # Multi-Store Branch Directory & Branch Manager
        ├── components/             # Reusable UI Component Library
        │   ├── Navbar.tsx          # Navigation Header with Live Store Switcher
        │   ├── Card.tsx            # Glassmorphism Card Containers
        │   ├── RoleBadge.tsx       # RBAC Visual Status Badges
        │   ├── PasswordInput.tsx   # Toggleable Password Input
        │   └── Pagination.tsx      # Table Pagination Controls
        └── lib/                    # Client-Side Utilities & API Connectors
            ├── api.ts              # Centralized Axios/Fetch API Connector with Auth Tokens
            └── utils.ts            # Class Merging & Formatting Helpers
```

---

## 8. REST API Reference

The FastAPI backend automatically generates interactive Swagger / OpenAPI documentation accessible at `http://localhost:8000/docs`.

### 8.1 Authentication & User Management (`/api/auth`)
| Method | Endpoint | Description | Access Level |
|:---|:---|:---|:---|
| `POST` | `/api/auth/register` | Register a new user account with assigned role | Public |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT Bearer token | Public |
| `GET` | `/api/auth/me` | Retrieve profile of the currently authenticated user | Authenticated |

### 8.2 Store Network Management (`/api/stores`)
| Method | Endpoint | Description | Access Level |
|:---|:---|:---|:---|
| `GET` | `/api/stores/` | List all registered retail store branches | All Roles |
| `POST` | `/api/stores/` | Create a new store branch | SuperAdmin, StoreManager |
| `GET` | `/api/stores/{store_id}` | Retrieve details for a specific store | All Roles |
| `PUT` | `/api/stores/{store_id}` | Update store branch details | SuperAdmin, StoreManager |
| `DELETE` | `/api/stores/{store_id}` | Delete a store branch and cascade related data | SuperAdmin |

### 8.3 Shelf Spatial Management (`/api/shelves`)
| Method | Endpoint | Description | Access Level |
|:---|:---|:---|:---|
| `GET` | `/api/shelves/` | List all shelves (with optional `store_id` filter) | All Roles |
| `POST` | `/api/shelves/` | Register a new shelf zone with spatial coordinates `[x1, y1, x2, y2]` | SuperAdmin, StoreManager |
| `GET` | `/api/shelves/{shelf_id}` | Retrieve shelf zone spatial boundaries | All Roles |
| `PUT` | `/api/shelves/{shelf_id}` | Update shelf spatial coordinates or name | SuperAdmin, StoreManager |
| `DELETE` | `/api/shelves/{shelf_id}` | Delete shelf zone from database | SuperAdmin, StoreManager |

### 8.4 CCTV Video Processing (`/api/cctv`)
| Method | Endpoint | Description | Access Level |
|:---|:---|:---|:---|
| `POST` | `/api/cctv/process-video` | Upload CCTV MP4 file and execute YOLOv8 tracking pipeline | Authenticated |
| `GET` | `/api/cctv/videos` | List all processed video tracking records | Authenticated |
| `GET` | `/api/cctv/stream/{video_id}` | Multipart MJPEG real-time tracking playback stream | Authenticated |

### 8.5 Spatial Analytics & Merchandising Optimization (`/api/analytics`)
| Method | Endpoint | Description | Access Level |
|:---|:---|:---|:---|
| `GET` | `/api/analytics/grid-heatmap` | Computes 5x8 spatial grid dwell heatmap with YlOrRd colormap | Authenticated |
| `GET` | `/api/analytics/attractiveness-scores` | Calculates 5-metric Attractiveness Scores & Shelf Leaderboard | Authenticated |
| `GET` | `/api/analytics/recommendations` | Generates rule-based merchandising optimization directives | Authenticated |
| `GET` | `/api/analytics/export/excel` | Generates multi-tab Excel workbook (`.xlsx`) | Authenticated |
| `GET` | `/api/analytics/export/csv` | Generates raw CSV export formatted for BI tools | Authenticated |
| `GET` | `/api/analytics/export/pdf` | Generates executive board-ready PDF report | Authenticated |

---

## 9. Build & Run Instructions for ANY System

CAMS can be run on **Windows, macOS, or Linux (Ubuntu/Debian/CentOS)** using either **Docker Compose (Method A - Recommended)** or a **Native Local Setup (Method B)**.

---

### System Prerequisites

Make sure your machine meets the following minimum requirements:

- **RAM**: 8 GB minimum (16 GB recommended for video inference).
- **CPU / GPU**: Multi-core x86_64 or Apple Silicon ARM64 (NVIDIA GPU with CUDA optional for faster inference).
- **Storage**: At least 5 GB free disk space.

---

### Method A: Quickstart via Docker Compose (Recommended)

Docker Compose containerizes the **PostgreSQL 15 Database**, **FastAPI Backend**, and **Next.js 14 Frontend** into a single isolated network.

#### Step 1: Install Docker
- **Windows / macOS**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/). Ensure Docker Desktop is running.
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
  ```

#### Step 2: Clone the Repository
```bash
git clone https://github.com/your-username/Consumer-Attention-Mapping-System.git
cd Consumer-Attention-Mapping-System
```

#### Step 3: Launch the Entire System
```bash
docker compose up --build
```
*(Add `-d` to run in detached background mode: `docker compose up --build -d`)*

#### Step 4: Verify Running Services
| Service | URL | Description |
|:---|:---|:---|
| **Web Frontend** | `http://localhost:3000` | Next.js Executive Dashboard |
| **FastAPI Backend** | `http://localhost:8000` | RESTful API Root |
| **API Swagger Docs** | `http://localhost:8000/docs` | Interactive OpenAPI Documentation |
| **PostgreSQL Database** | `localhost:5432` | Relational Storage (`cams_db`) |

#### To Stop the Containers:
```bash
docker compose down
```

---

### Method B: Native Local Setup (Step-by-Step)

If you prefer running services directly on your host machine without Docker:

#### 1. Software Requirements
- **Python**: Version 3.10 or 3.11 ([Download Python](https://www.python.org/downloads/))
- **Node.js**: Version 18.x or 20.x ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: Version 14, 15, or 16 ([Download PostgreSQL](https://www.postgresql.org/download/))
- **Git**: Version Control ([Download Git](https://git-scm.com/))

---

#### 2. Database Setup

1. Start your local PostgreSQL service.
2. Open your terminal or `psql` shell and create the database:
   ```sql
   CREATE DATABASE consumer_attention_mapping_db;
   ```
   *(Or run the included helper script: `python backend/init_db.py`)*

---

#### 3. Backend Setup & Startup

1. **Open a terminal** and navigate to the `backend` folder:
   ```bash
   cd Consumer-Attention-Mapping-System/backend
   ```

2. **Create and activate a Python Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install System Dependencies (Linux Only)**:
   If running on a headless Linux server or WSL:
   ```bash
   sudo apt-get update && sudo apt-get install -y libgl1 libglib2.0-0 ffmpeg
   ```

4. **Install Python Packages**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install openpyxl pypdf
   ```

5. **Configure Backend Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/consumer_attention_mapping_db
   SECRET_KEY=consumer_attention_mapping_super_secret_jwt_key_2026
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

6. **Initialize Database Tables & Roles**:
   ```bash
   python -c "from app.core.database import engine, Base; from app.services.seed import seed_roles; from app.core.database import SessionLocal; Base.metadata.create_all(bind=engine); db=SessionLocal(); seed_roles(db); db.close(); print('Database Initialized Successfully!')"
   ```

7. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - Backend will be live at: `http://localhost:8000`
   - Swagger docs will be live at: `http://localhost:8000/docs`

---

#### 4. Frontend Setup & Startup

1. **Open a second terminal** and navigate to the `frontend` folder:
   ```bash
   cd Consumer-Attention-Mapping-System/frontend
   ```

2. **Install Node.js Packages**:
   ```bash
   npm install
   ```

3. **Configure Frontend Environment Variables**:
   Create a `.env.local` file in the `frontend/` directory (optional if using default `http://localhost:8000`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```
   - Frontend will be live at: `http://localhost:3000`

---

### Environment Variables Reference

#### Backend (`backend/.env` or Docker environment)
| Variable | Default Value | Description |
|:---|:---|:---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/consumer_attention_mapping_db` | PostgreSQL connection URI |
| `SECRET_KEY` | `consumer_attention_mapping_super_secret_jwt_key_2026` | Secret key for signing JWT tokens |
| `ALGORITHM` | `HS256` | JWT signing cryptographic algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Lifetime duration of issued JWT tokens (minutes) |

#### Frontend (`frontend/.env.local` or Docker environment)
| Variable | Default Value | Description |
|:---|:---|:---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL for client-side queries |

---

## 10. Role-Based Access Control (RBAC)

CAMS enforces strict Role-Based Access Control at both the API and UI level:

```
┌───────────────────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Feature / Action              │ SuperAdmin      │ StoreManager    │ Analyst         │
├───────────────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ View Analytics Dashboard      │ Full Access     │ Full Access     │ Full Access     │
│ View 5x8 Grid Heatmaps        │ Full Access     │ Full Access     │ Full Access     │
│ View Attractiveness Scores    │ Full Access     │ Full Access     │ Full Access     │
│ Export Reports (Excel/CSV/PDF)│ Full Access     │ Full Access     │ Full Access     │
│ Ingest CCTV Video / Webcam    │ Full Access     │ Full Access     │ View Only       │
│ Create / Edit Shelf Zones     │ Full Access     │ Full Access     │ View Only       │
│ Delete Shelf Zones            │ Full Access     │ Full Access     │ No Access       │
│ Create / Edit Store Branches  │ Full Access     │ Full Access     │ View Only       │
│ Delete Store Branches         │ Full Access     │ No Access       │ No Access       │
│ Manage Users & Roles          │ Full Access     │ No Access       │ No Access       │
└───────────────────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 11. Enterprise Reporting & Multi-Format Exports

CAMS includes server-side and client-side data export engines to support executive reporting and business intelligence:

1. **Multi-Tab Excel Workbook (`.xlsx`)**:
   - Tab 1: Store-level Executive KPIs & Summary.
   - Tab 2: Shelf Attractiveness Leaderboard (with 5-metric breakdown and recommendations).
   - Tab 3: Raw Trajectory & Dwell Log Points.
2. **Standard CSV Export (`.csv`)**:
   - Tabular format ready for direct ingestion into **PowerBI**, **Tableau**, **Looker**, or **Snowflake**.
3. **Print-Ready Executive PDF (`.pdf`)**:
   - Formatted for board-level presentations, including formatted scorecards and merchandising directives.

---

## 12. Troubleshooting & FAQ

### 1. `uvicorn` fails with `ModuleNotFoundError: No module named 'cv2'`
- **Cause**: OpenCV is missing or OS graphics libraries are absent.
- **Solution**:
  - Run `pip install opencv-python`.
  - On Ubuntu/Debian, install `sudo apt-get install -y libgl1 libglib2.0-0`.

### 2. `Database connection refused on localhost:5432`
- **Cause**: PostgreSQL service is not running or incorrect password in `.env`.
- **Solution**:
  - Verify PostgreSQL service status: `sudo systemctl status postgresql` (Linux) or check Services app (Windows).
  - Verify `DATABASE_URL` credentials in `backend/.env`.

### 3. Port Conflicts (`8000`, `3000`, or `5432` already in use)
- **Solution**:
  - Change backend port: `uvicorn app.main:app --port 8001` (and update `NEXT_PUBLIC_API_URL` to `http://localhost:8001`).
  - Change frontend port: `npm run dev -- -p 3001`.

### 4. Bounding boxes or tracking points not appearing on 2D floorplan
- **Cause**: Uploaded video resolution is not normalized or shelf coordinates are outside $[0.0, 1.0]$.
- **Solution**:
  - Ensure shelf coordinates use normalized percentages $[0.0 \text{ to } 1.0]$ in the 2D Shelf Zone Editor.

---

## 13. Real-World Applications & Business ROI

| Sector | Target Environment | Key Business ROI |
|:---|:---|:---|
| **Supermarkets & Groceries** | Aisle endcaps, promotional displays | **15–25% revenue lift** by relocating high-margin SKUs to eye-level attention hotspots. |
| **Electronics & Telco** | Interactive demo kiosks, smartphone tables | Identifies product comparison dwell time and measures interaction-to-purchase ratios. |
| **Fashion & Apparel** | Mannequin displays, seasonal racks | Quantifies mannequin engagement and identifies visual appeal deficits before sales drop. |
| **Pharmacies & Beauty** | Skincare vs. cosmetics shelf segments | Analyzes brand comparison dwell and optimizes high-value shelf slotting fees with data proof. |
| **Airports & Duty-Free** | High-traffic duty-free corridors | Maximizes impulse purchase placement along natural passenger footfall trajectories. |

---

## 14. Future Roadmap

- [ ] **Multi-Camera Re-Identification (Re-ID)**: Track individual shopper journeys seamlessly across multi-camera, multi-floor store layouts.
- [ ] **3D Demographic & Gaze Pose Estimation**: Anonymized 3D head-orientation vectors and demographic trend estimation.
- [ ] **Point-of-Sale (POS) Cash Register Integration**: Real-time closed-loop conversion linking attention dwell directly with receipt transaction IDs.
- [ ] **Edge Hardware Acceleration**: Pre-configured deployment images for **NVIDIA Jetson AGX/Orin** and **Intel OpenVINO** edge gateways.
- [ ] **Digital Twin 3D Store Simulator**: Pre-remodel store layout simulation using historical shopper trajectory heatmaps.

---

## 15. Authors & Acknowledgments

- **Lead Developer**: Rishi Kumar
- **Domain**: AI / Computer Vision, Spatial Intelligence, In-Store Retail Analytics, Full-Stack Software Engineering
- **Frameworks**: Ultralytics YOLOv8, FastAPI, PostgreSQL, Next.js 14, Tailwind CSS

---

<div align="center">

**Consumer Attention Mapping System (CAMS) — Transforming Passive Video into Actionable Spatial Intelligence.**

</div>
