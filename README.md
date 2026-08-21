# Consumer Attention Mapping System

## Overview

The Consumer Attention Mapping (CAM) System is an AI-powered retail analytics platform that leverages computer vision to analyze shopper behavior in retail environments. The system processes video feeds to detect and track shoppers, estimate customer attention using head pose and gaze analysis, measure dwell time, compute product attractiveness scores, and generate actionable retail recommendations.

The platform integrates a computer vision pipeline with a full-stack web application, enabling retailers to visualize real-time analytics through an interactive dashboard.

---

## Features

### Authentication and User Management

- JWT-based Authentication
- Role-Based Access Control (RBAC)
- Secure Login and Registration
- Protected API Endpoints

### Retail Management

- Store Management (CRUD)
- Shelf Management (CRUD)
- Product Management (CRUD)
- Store-Shelf Mapping

### Computer Vision

- Real-time Person Detection using YOLOv8
- Multi-Person Tracking using ByteTrack
- Face Detection using MediaPipe Face Mesh
- Head Pose Estimation
- Gaze Estimation
- Shopper Behaviour Analysis
- Shelf Attention Mapping
- Dwell Time Analysis
- Shopper Session Tracking

### Retail Analytics

- Shopper Count
- Shelf Attention Analysis
- Dwell Time Analytics
- Behaviour Analytics
- Product Attractiveness Scoring
- Retail Recommendation Generation
- Analytics Reports

### Dashboard

- Live Video Stream
- Shopper Analytics
- Shelf-wise Analytics
- Behaviour Statistics
- Product Attractiveness Scores
- Retail Recommendations
- Reports Dashboard

---

## Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT Authentication

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Computer Vision

- OpenCV
- YOLOv8
- ByteTrack
- MediaPipe Face Mesh
- NumPy

### Database

- PostgreSQL

---

## System Architecture

```text
Camera Feed
      │
      ▼
OpenCV Frame Capture
      │
      ▼
YOLOv8 Person Detection
      │
      ▼
ByteTrack Multi-Person Tracking
      │
      ▼
MediaPipe Face Mesh
      │
      ▼
Head Pose Estimation
      │
      ▼
Gaze Estimation
      │
      ▼
Behaviour Analysis
      │
      ▼
Shelf Attention Mapping
      │
      ▼
Product Attractiveness Scoring
      │
      ▼
Recommendation Engine
      │
      ▼
PostgreSQL Database
      │
      ▼
FastAPI REST APIs
      │
      ▼
Next.js Dashboard
```

---

## Project Structure

```text
ConsumerAttentionMappingSystem
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── crud
│   │   ├── db
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   │   ├── vision
│   │   │   ├── behavior
│   │   │   └── scoring
│   │   ├── recommendations.py
│   │   ├── video_stream.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   ├── hooks
│   │   ├── lib
│   │   └── types
│   └── package.json
│
├── assets
│
└── README.md
```

---

## Core Functionalities

### Shopper Detection

Detects shoppers in each video frame using YOLOv8.

### Shopper Tracking

Maintains unique shopper identities across frames using ByteTrack and records shopper movement throughout the store.

### Head Pose and Gaze Estimation

Uses MediaPipe Face Mesh to estimate head orientation and infer customer attention towards retail shelves.

### Shelf Attention Mapping

Maps shopper positions and attention to predefined shelf regions.

- Shelf A
- Walking Aisle
- Shelf B

### Dwell Time Analysis

Measures the amount of time shoppers spend near individual shelves.

### Behaviour Analysis

Analyzes shopper behaviour including:

- Browsing
- Passing
- Engaged

### Product Attractiveness Scoring

Computes a weighted attractiveness score using shopper analytics and shelf engagement metrics. The scoring model combines automatically generated analytics with configurable business metrics where required.

### Recommendation Engine

Generates actionable recommendations to improve shelf visibility, product placement, and overall retail performance based on computed analytics.

### Analytics Dashboard

Provides real-time visualization of:

- Shopper Count
- Dwell Time
- Shelf Analytics
- Behaviour Statistics
- Product Attractiveness Scores
- Recommendations
- Reports

---

## REST API Modules

- Authentication APIs
- User Management APIs
- Store Management APIs
- Shelf Management APIs
- Product Management APIs
- Analytics APIs
- Behaviour Analysis APIs
- Product Attractiveness APIs
- Recommendation APIs

---

## Database Models

The system stores and manages information related to:

- Users
- Stores
- Shelves
- Products
- Shopper Sessions
- Analytics
- Behaviour Records
- Product Attractiveness Scores
- Recommendations

---

## Key Capabilities

- Real-time shopper detection and tracking
- Shelf-wise attention analysis
- Behaviour classification
- Gaze estimation
- Dwell time measurement
- Product attractiveness evaluation
- Retail recommendation generation
- Interactive analytics dashboard
- Full-stack REST API architecture
- Secure authentication and authorization

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/ConsumerAttentionMappingSystem.git
cd ConsumerAttentionMappingSystem
```

### Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate
# Windows
venv\Scripts\activate

pip install -r requirements.txt

alembic upgrade head

uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## Future Enhancements

- Multi-camera analytics
- POS system integration
- Smart shelf integration
- Product pickup detection
- Customer journey analysis
- Predictive retail analytics
- Cloud deployment
- Containerization using Docker

---

## Author

Developed as part of an AI-powered Retail Analytics project focused on integrating Computer Vision, Artificial Intelligence, Full-Stack Web Development, and Data Analytics to provide actionable insights for retail environments.