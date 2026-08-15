Consumer Attention Mapping System

Project Overview

The Consumer Attention Mapping System is a backend application developed to build the foundation for an AI-powered retail analytics platform. It provides secure user authentication, retail store and shelf management, PostgreSQL database integration, and OpenCV-based video stream verification.

This project was developed as Milestone 1, focusing on creating a scalable backend architecture before integrating computer vision and customer attention tracking.

---

Features

- JWT-based User Authentication
- Secure Password Hashing
- PostgreSQL Database Integration
- Store Management APIs
- Shelf Management APIs
- OpenCV Video Stream Verification
- FastAPI RESTful Backend
- SQLModel ORM Integration

---

Tech Stack

- Python 3.13
- FastAPI
- SQLModel
- PostgreSQL
- JWT Authentication
- OpenCV
- Uvicorn
- Postman
- Git & GitHub

---

Project Structure

backend/
│
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── services/
│   └── main.py
│
├── requirements.txt
├── .gitignore
└── README.md

---

API Endpoints

Authentication

- POST "/api/auth/register"
- POST "/api/auth/login"

Stores

- GET "/api/stores"
- POST "/api/stores"

Shelves

- GET "/api/stores/{store_id}/shelves"
- POST "/api/stores/{store_id}/shelves"

---

Database

The project uses PostgreSQL with the following entities:

- Users
- Roles
- Stores
- Shelves

---

OpenCV Verification

The project includes a video streaming service using OpenCV that:

- Opens the webcam
- Reads video frames
- Displays the live stream
- Processes frames continuously
- Closes safely without crashes

---

Installation

1. Clone the repository.
2. Create and activate a virtual environment.
3. Install dependencies using:

pip install -r requirements.txt

4. Configure the PostgreSQL database in the ".env" file.
5. Start the server:

uvicorn app.main:app --reload

---

Testing

The APIs were tested using:

- Swagger UI
- Postman

---

Future Enhancements

- Customer Detection
- Attention Heatmaps
- Person Tracking
- Shelf Interaction Analytics
- Retail Dashboard
- AI-based Consumer Behaviour Analysis


## Frontend Dashboard

This project also includes a frontend dashboard for visualizing shopper attention analytics.

Frontend files:
- index.html
- script.js
- style.css

Features:
- Total shopper count
- Attention time tracking
- Shopper segmentation
- Live shopper analytics table
- Attention heatmap interface

Run:
- Start backend API
- Run shopper detection service
- Open frontend/index.html in browser

---

Author

Shruti Kumari

B.Tech Computer Science & Engineering

Amity University