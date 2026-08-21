# Consumer Attention Mapping System

A full-stack application for analysing in-store shopper attention from camera feeds. It combines computer-vision tracking with a React dashboard to help teams understand dwell time, shelf engagement, customer paths, heatmaps, and product attractiveness.

## Features

- Live camera management and video-based shopper tracking
- Attention, dwell-time, gaze, and zone analysis
- Store and shelf management
- Interactive dashboards for different user roles
- Heatmaps, customer paths, analytics, recommendations, and reports
- FastAPI REST API with PostgreSQL persistence

## Tech stack

- **Frontend:** React, Vite, React Router, Chart.js, Recharts, Axios
- **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn
- **Computer vision:** OpenCV, MediaPipe, Ultralytics YOLO, Supervision
- **Database:** PostgreSQL (SQLite-compatible schema support is included)
- **Containerisation:** Docker Compose

## Project structure

```text
consumer-attention-mapping-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── routers/
│   ├── models/
│   └── requirements.txt
│
├── .gitignore
├── docker-compose.yml
├── README.md
└── LICENSE
```

## Prerequisites

- Python 3.11 or later
- Node.js 18 or later
- PostgreSQL 16 (or Docker)

## Run with Docker

Docker Compose starts the API and PostgreSQL database:

```bash
docker compose up --build
```

The API is available at `http://localhost:8000`. Stop the services with `docker compose down`.

## Run locally

### 1. Configure and start the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

Install dependencies and configure the database URL:

```bash
pip install -r requirements.txt
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux
```

Set `DATABASE_URL` in `.env` to your PostgreSQL instance, then run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API initialises its schema and seed data at startup. Visit `http://localhost:8000/docs` for the interactive OpenAPI documentation.

### 2. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the address printed by Vite (normally `http://localhost:5173`).

## Useful commands

```bash
# Build the frontend for production
cd frontend && npm run build

# Run backend tests
cd backend && pytest
```

## Configuration

The backend reads its database connection from `DATABASE_URL`. A local example is provided in [`backend/.env.example`](backend/.env.example). Keep real credentials in `backend/.env`, which is ignored by Git.

## License

This project is licensed under the terms in [LICENSE](LICENSE).
