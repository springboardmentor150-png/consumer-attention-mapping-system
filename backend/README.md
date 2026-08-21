# Consumer Attention Mapping System - Backend

## Overview

The backend of the Consumer Attention Mapping System is built using **FastAPI** and **PostgreSQL**. It provides secure REST APIs for authentication, store management, shelf management, and role-based access control. It also includes OpenCV integration for video streaming, forming the foundation for future computer vision analytics.

---

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Pydantic
- JWT Authentication
- Passlib (bcrypt)
- OpenCV
- Uvicorn

---

## Features

- User Registration & Login
- JWT Authentication
- Role-Based Access Control (RBAC)
- Store CRUD Operations
- Shelf CRUD Operations
- PostgreSQL Database Integration
- OpenCV Video Stream Support
- Automatic Role Seeding

---

## Project Structure

```
backend/
│
├── app/
│   ├── api/
│   ├── core/
│   ├── crud/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
│
├── requirements.txt
└── README.md
```

---

## Installation

### Create Virtual Environment

```bash
python -m venv venv
```

Activate

Windows

```bash
venv\Scripts\activate
```

---

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

### Configure Environment Variables

Create a `.env` file inside the backend folder.

Example:

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### Run Backend

```bash
uvicorn app.main:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

Swagger Documentation

```
http://127.0.0.1:8000/docs
```

---

## API Modules

- Authentication
- Stores
- Shelves

---

## Authentication

Uses JWT Bearer Tokens.

Roles supported:

- SuperAdmin
- StoreManager
- Analyst

---

## OpenCV Video Stream

Supports:

- Local Webcam
- MP4 Video Files
- RTSP Camera Streams

Displays:

- Frame Count
- Timestamp
- FPS
- Memory Usage

---

## Milestone 1 Deliverables

- Authentication
- JWT Authorization
- RBAC
- PostgreSQL Integration
- CRUD APIs
- OpenCV Streaming