# Consumer Attention Mapping System (CAMS)

An AI-powered retail intelligence platform that leverages Computer Vision and Deep Learning to analyze shopper behavior, attention patterns, shelf interactions, and in-store engagement. The system enables retailers to make data-driven decisions by transforming retail camera feeds into actionable business insights.

---

## Project Overview

Consumer Attention Mapping System (CAMS) is designed to help retail stores understand customer movement, product engagement, dwell time, and shopping behavior using AI-based video analytics.

The platform provides:

- Secure authentication with Role-Based Access Control (RBAC)
- Retail store and shelf management
- Camera registration and monitoring
- Video stream verification using OpenCV
- Scalable backend architecture with PostgreSQL, MongoDB, and Redis
- Modern dashboard built with Next.js and Tailwind CSS

---

# Tech Stack

## Backend

- Python 3.11
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- MongoDB (Motor)
- Redis
- Alembic
- JWT Authentication
- Loguru

## Frontend

- Next.js 14
- React 18
- TypeScript
- Redux Toolkit
- Axios
- Tailwind CSS
- shadcn/ui

## AI / Computer Vision

- OpenCV
- YOLOv8
- PyTorch
- MediaPipe
- DeepSORT

---

# Project Structure

```
Consumer-Attention-Mapping-System/

├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── scripts/
│   │   └── verify_stream.py
│   │
│   ├── migrations/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── store/
│   ├── lib/
│   └── package.json
│
└── README.md
```

---

# Features

## Authentication

- User Registration
- User Login
- JWT Access Tokens
- Refresh Tokens
- Secure Password Hashing (bcrypt)
- User Profile Management
- Role-Based Access Control

Supported Roles

- Super Admin
- Store Manager
- Retail Analyst
- Marketing Manager

---

## Retail Management

- Store Registration
- Shelf Management
- Zone Management
- Camera Registration
- Camera Assignment
- Camera Health Monitoring
- Heartbeat API

---

## Database

### PostgreSQL

- Users
- Stores
- Shelves
- Zones
- Cameras
- Products

### MongoDB

- Attention Data
- Heatmaps
- Sessions

### Redis

- Session Cache
- Future Real-time Messaging

---

## Computer Vision

Current milestone includes:

- Video Stream Verification
- Webcam Support
- RTSP Stream Support
- MP4 File Support
- Frame Metadata Logging
- FPS Monitoring
- Person Detection
- Product Detection
- Consumer Tracking
- Heatmap Generation
- Attention Analytics
- Report Generation

---

# All 4 Milestones are completed

---

# Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/jagrat2004/Consumer-Attention-Mapping-System.git

cd Consumer-Attention-Mapping-System
```

---

# Backend Setup

## Create Virtual Environment

Windows

```bash
python -m venv venv

venv\Scripts\activate
```

Linux / macOS

```bash
python3 -m venv venv

source venv/bin/activate
```

---

## Install Dependencies

```bash
cd backend

pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
APP_NAME=
APP_ENV=
DEBUG=

POSTGRES_HOST=
POSTGRES_PORT=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

DATABASE_URL=

MONGO_URL=
MONGO_DB=

REDIS_URL=

JWT_SECRET_KEY=change-this-jwt-key
JWT_ALGORITHM=HS256

API_V1_PREFIX=/api
```

---

## Run Database Migrations

```bash
cd backend

alembic upgrade head
```

---

## Start Backend

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs at

```
http://localhost:8000
```

Swagger Documentation

```
http://localhost:8000/api/docs
```

---

# Frontend Setup

Go to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

Frontend runs at

```
http://localhost:3000
```

---

# Running the Complete Application

Start services in this order:

1. PostgreSQL
2. MongoDB
3. Redis (optional)
4. Backend
5. Frontend

Open

```
Frontend
http://localhost:3000
```

```
Swagger API
http://localhost:8000/api/docs
```

---

# Default Test Credentials

The following account can be used for local development and testing.

## Super Admin

Email

```
admin@example.com
storemanager@gmail.com
storemanager23@gmail.com
```

Password

```
Admin@123
store@23
store@231

```

Role

```
Super Admin
```

> If the database is empty, first register this user through the `/api/auth/register` endpoint or the registration page using:
>
> - **Username:** `admin`
> - **Full Name:** `Admin User`
> - **Email:** `admin@example.com`
> - **Password:** `Admin@123`
> - **Role:** `Super Admin`

---

# Step 3: Start the AI Vision Engine

This script captures video, tracks people using YOLOv8 & ByteTrack, evaluates where they look (gaze estimation), and calculates dwell times.

To use your computer's webcam (Great for testing yourself): 
Open a third terminal and run:

```powershell
cd backend
python scripts/run_tracking.py --source 0

```
*(The `--source 0` tells it to use your main webcam).*

To use a pre-recorded shop video instead of a webcam: 
If you have a video file (e.g., `shop_video.mp4`), put it in the backend folder and run:

```powershell
cd backend
python scripts/run_tracking.py --source "shop_video.mp4"
```
if you dont want the video to appear on the screen use this command

```powershell
cd backend
python scripts/run_tracking.py --source "shop_video.mp4" ---no-display
```

When the video window pops up, you can stop it at any time by pressing `q` on your keyboard.

Analysis

```powershell
cd backend
python scripts/run_behavior_analysis.py
```

---

# API Documentation

Interactive Swagger UI

```
http://localhost:8000/api/docs
```

Core endpoints include:

### Authentication

- Register
- Login
- Refresh Token
- Logout
- User Profile

### Stores

- Create Store
- View Stores
- Update Store
- Delete Store

### Shelves

- Create Shelf
- View Shelves

### Cameras

- Register Camera
- Update Camera
- Delete Camera
- Camera Health
- Heartbeat

---

# Current Progress

### Milestone 1 & 2 Completed

- Project Initialization
- Backend Architecture
- Frontend Dashboard
- Authentication System
- Role-Based Access Control
- PostgreSQL Integration
- MongoDB Integration
- Redis Integration
- Store Management APIs
- Shelf Management APIs
- Camera Management APIs
- Video Stream Integration
- YOLOv8 Person Detection
- ByteTrack Tracking
- Attention Mapping & Gaze Estimation
- Dwell Time Analytics
- Real-time Frontend Dashboard

---

# License

This project is developed for academic and research purposes as part of the **Infosys Springboard** program.