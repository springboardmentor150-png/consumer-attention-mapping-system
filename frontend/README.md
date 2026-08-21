# Consumer Attention Mapping System - Frontend

## Overview

The frontend is developed using **Next.js** and **React** to provide a modern dashboard for managing stores, shelves, authentication, and future retail analytics.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide Icons

---

## Features

- User Login & Registration
- JWT Authentication
- Role-Based Dashboard
- Store Management
- Shelf Management
- Search
- Pagination
- Responsive UI
- Password Visibility Toggle

---

## Project Structure

```
frontend/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── styles/
│
├── public/
├── package.json
└── README.md
```

---

## Installation

Install packages

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

Frontend runs at

```
http://localhost:3000
```

---

## Folder Overview

### app/

Contains all application pages.

Examples

- Dashboard
- Login
- Register
- Stores
- Shelves

---

### components/

Reusable UI Components

Examples

- Navbar
- RoleBadge
- PasswordInput
- Pagination
- SearchInput
- Card
- TableState

---

### lib/

Contains API helper functions for communicating with the FastAPI backend.

---

## Authentication

JWT tokens are stored in browser Local Storage.

The frontend automatically includes the token in API requests.

---

## Role-Based Access

### SuperAdmin

- View Stores
- Create Stores
- Edit Stores
- Delete Stores

### StoreManager

- View Stores
- Create Stores
- Edit Stores

### Analyst

- View Stores
- View Shelves

No create, update or delete permissions.

---

## Milestone 1 Features

- Authentication
- Dashboard
- Store Management
- Shelf Management
- Search
- Pagination
- Responsive Layout
- Role-Based UI