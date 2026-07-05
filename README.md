# Consumer Attention Mapping System

A starter full-stack project for managing stores, shelves, cameras, and users in a consumer attention mapping workflow.

## Project Structure

```text
.
|-- backend
|   |-- app
|   |   |-- config
|   |   |-- models
|   |   |-- routes
|   |   |-- schemas
|   |   `-- utils
|   `-- requirements.txt
|-- frontend
|   |-- package.json
|   `-- src
|-- docker-compose.yml
|-- README.md
`-- .gitignore
```

## Stack

- FastAPI backend
- SQLAlchemy models
- Pydantic schemas
- React frontend scaffold
- SQLite for local persistence

## Current API Endpoints

- `GET /`
- `POST /login`
- `GET /users`
- `GET /stores`
- `GET /shelves`
- `GET /cameras`

## Run Locally

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

### Frontend

The `frontend/` directory currently contains React source files, but it does not yet include the full Vite/React runtime setup needed to start a browser app. Once the frontend tooling is completed, it can be run separately from that folder.

## Docker Compose

`docker-compose.yml` currently starts the backend service only, because the frontend scaffold is not fully wired for container startup yet.

```powershell
docker compose up --build
```

This will expose the API at `http://localhost:8000`.
