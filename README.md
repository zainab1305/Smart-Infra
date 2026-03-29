# Smart Infrastructure Management System

Smart Infrastructure is a full-stack web application for reporting civic infrastructure issues, prioritizing and scheduling work, tracking worker execution, and enabling private admin-worker communication.

It includes:

- Citizen issue reporting with location picker and image upload
- AI-assisted image confidence scoring via Python image service
- Priority scoring and grouped complaint handling
- Admin task assignment and auto-scheduling
- Worker task actions (accept, reject, complete)
- Weekly and monthly report summary with PDF export
- Private admin-worker chat with optional issue tagging

## Tech Stack

- Frontend: React + Vite + Axios + Recharts + Leaflet
- Backend: Node.js + Express + JWT + Multer
- Database: MongoDB + Mongoose
- Image Service: FastAPI + OpenCV + NumPy + Pillow

## Project Structure

- frontend: React app (UI, dashboards, chat, maps)
- backend: Express API (auth, issues, tasks, messages)
- image-service: FastAPI model service for image analysis

## Core Features

### User

- Report issue by category
- Location input options:
	- Use current location (browser geolocation)
	- Select location on map (Leaflet + OpenStreetMap)
	- Manual address input fallback
- Image input options:
	- Capture from camera (mobile-friendly)
	- Upload from device
- Track reported issue status

### Admin

- View platform dashboard analytics
- Create worker accounts
- Assign issues to workers
- Generate priority list
- Auto-schedule unassigned issues
- Generate and export report summaries
- Private chat with selected worker

### Worker

- View assigned tasks
- Accept or reject tasks with feedback
- Mark tasks as completed
- View progress analytics
- Private chat with admin

## Messaging Behavior

- Chat is private between admin and a selected worker
- Admin selects worker first
- Conversation shows all messages between admin and that worker
- Issue tagging is optional while sending messages
- Chat refreshes via HTTP polling every ~4 seconds

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MongoDB (local or cloud)

## Environment Configuration

### Backend env file

Copy backend/.env.example to backend/.env and set values.

Important note:

- Current backend code reads MONGO_URI from backend/config/db.js
- backend/.env.example contains MONGODB_URI

Set MONGO_URI in backend/.env to avoid connection issues.

Recommended backend/.env values:

- MONGO_URI=mongodb://localhost:27017/smart-infra
- JWT_SECRET=change_this_in_production
- ADMIN_EMAIL=admin@smartinfra.com
- ADMIN_PASSWORD=admin123

## Setup

### Option 1: Scripted setup

Windows:

- Run setup.bat from project root

Linux/macOS:

- Run setup.sh from project root

### Option 2: Manual setup

Backend:

1. cd backend
2. npm install
3. configure backend/.env

Frontend:

1. cd frontend
2. npm install

Image Service:

1. cd image-service
2. pip install -r requirements.txt

## Run the Application

Use 3 terminals.

Terminal 1: image service

1. cd image-service
2. py -m uvicorn main:app --reload --port 800

Terminal 2: backend

1. cd backend
2. node server.js

Terminal 3: frontend

1. cd frontend
2. npm run dev

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000
- Image service docs: http://localhost:8000/docs

## Default Admin Login

- Email: admin@smartinfra.com
- Password: admin123

Update these for production via backend/.env.

## API Overview

### Auth

- POST /api/auth/login/admin
- POST /api/auth/login/user
- POST /api/auth/login/worker
- POST /api/auth/register/user
- POST /api/auth/create-worker (admin)
- GET /api/auth/users (admin)

### Issues

- POST /api/issues
- GET /api/issues
- GET /api/issues/priority-list (admin)

### Tasks

- POST /api/tasks/assign (admin)
- POST /api/tasks/auto-schedule (admin)
- GET /api/tasks/my-tasks (worker)
- GET /api/tasks/dashboard/week-summary (admin)
- GET /api/tasks/report-summary (admin)
- GET /api/tasks/worker/:workerId/issues (admin)
- PUT /api/tasks/:taskId/respond (worker)
- PUT /api/tasks/:taskId/complete (worker)

### Messages

- GET /api/messages
	- Admin uses workerId query to load selected admin-worker conversation
	- Optional issueId query to filter by tagged issue
- POST /api/messages
	- Admin sends to selected worker
	- Worker sends to admin
	- Optional issueId tag

## Notes and Limitations

- Backend currently uses a fixed port value 5000 in backend/server.js
- Image service URL is currently hardcoded to http://localhost:8000 in backend/services/imageService.js
- Chat transport uses polling, not WebSockets

## Production Hardening Suggestions

- Store hashed passwords instead of plain text
- Move hardcoded service URLs and ports to environment variables
- Add request rate limiting and centralized logging
- Add tests for auth, task assignment, and messaging authorization
- Replace polling chat with WebSocket for real-time delivery at scale

## Troubleshooting

- 401 on API calls:
	- Login again and ensure Authorization header has Bearer token

- MongoDB connection failure:
	- Verify backend/.env has MONGO_URI and MongoDB is reachable

- Image confidence always zero:
	- Ensure FastAPI service is running on port 8000

- Messages not appearing:
	- Ensure backend was restarted after route changes
	- Ensure admin selected worker in chat view

## License

Academic/mini-project use.