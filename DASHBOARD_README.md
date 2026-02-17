# Smart Infrastructure Management Dashboard

A comprehensive web application for managing infrastructure issues, task assignments, and weekly worker performance tracking.

## 🎯 Features

### Admin Dashboard
- ✅ Create and manage worker accounts with unique Worker IDs
- ✅ View all users, workers, and issues
- ✅ Assign tasks to workers from reported issues
- ✅ Monitor weekly task completion rates
- ✅ View team performance metrics
- ✅ Track task status in real-time

### User Dashboard
- ✅ Report infrastructure issues (potholes, broken pipes, street lights, etc.)
- ✅ Upload images of issues
- ✅ View all reported issues with status
- ✅ Track issue resolution progress
- ✅ View AI-based priority scores and explanations

### Worker Dashboard
- ✅ View assigned tasks for the week
- ✅ Accept or reject tasks with feedback
- ✅ Mark tasks as completed
- ✅ View personal weekly progress
- ✅ Track completion rates

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
```
backend/
├── models/
│   ├── User.js (Admin, User, Worker)
│   ├── Issue.js
│   ├── Task.js
│   └── WeeklyReport.js
├── routes/
│   ├── authRoutes.js (Authentication)
│   ├── issueRoutes.js (Issue Management)
│   └── taskRoutes.js (Task Management)
├── middleware/
│   └── auth.js (JWT Authentication)
├── config/
│   └── db.js (MongoDB Connection)
└── server.js
```

### Frontend (React + Vite)
```
frontend/
├── components/
│   ├── Login.jsx (Authentication UI)
│   ├── AdminDashboard.jsx
│   ├── WorkerDashboard.jsx
│   ├── UserDashboard.jsx
│   ├── IssueReport.jsx
│   └── Login.css
└── App.jsx
```

### Python Image Service
```
image-service/
├── main.py (AI image analysis)
└── requirements.txt
```

## 🔐 Authentication System

### Admin Login
- **Default Email:** admin@smartinfra.com
- **Default Password:** admin123
- ⚠️ Change these credentials in production (.env file)

### User Registration & Login
- Users can self-register with email and password
- Standard user authentication with JWT tokens

### Worker Authentication
- Admin creates worker accounts
- Workers login with Worker ID + Password
- Workers get auto-generated tokens

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login/admin` - Admin login
- `POST /api/auth/register/user` - User registration
- `POST /api/auth/login/user` - User login
- `POST /api/auth/login/worker` - Worker login
- `POST /api/auth/create-worker` - Create worker (Admin only)
- `GET /api/auth/users` - Get all users (Admin only)

### Issues
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Report new issue (with image upload)
- `GET /api/issues/:id` - Get issue details

### Tasks
- `POST /api/tasks/assign` - Assign task (Admin only)
- `GET /api/tasks/my-tasks` - Get worker's tasks
- `GET /api/tasks/week/:weekNumber` - Get week's tasks (Admin)
- `PUT /api/tasks/:taskId/respond` - Worker responds to task
- `PUT /api/tasks/:taskId/complete` - Mark task complete
- `GET /api/tasks/dashboard/week-summary` - Dashboard summary

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Python 3.8+ (for image service)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (use `.env.example` as template):
```bash
cp .env.example .env
```

4. Update MongoDB URI in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/smart-infra
```

5. Start the server:
```bash
npm start
# or for development with auto-reload:
nodemon server.js
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Python Image Service Setup

1. Navigate to image-service folder:
```bash
cd image-service
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the service:
```bash
python main.py
```

Service will run on `http://localhost:8000`

## 📊 Database Schema

### User (Admin/User/Worker)
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  role: "admin" | "user" | "worker",
  workerId: String (unique, for workers),
  phone: String,
  isActive: Boolean
}
```

### Issue
```javascript
{
  category: String,
  location: String,
  imageUrl: String,
  confidenceScore: Number,
  priorityScore: Number,
  explanation: String,
  status: "Reported" | "Assigned" | "Resolved",
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Task
```javascript
{
  issueId: ObjectId (ref: Issue),
  workerId: ObjectId (ref: User),
  assignedDate: DateTime,
  dueDate: DateTime,
  status: "Pending" | "In Progress" | "Completed" | "Rejected",
  workerResponse: {
    accepted: Boolean,
    feedback: String,
    responseDate: DateTime
  },
  weekNumber: Number,
  year: Number
}
```

### WeeklyReport
```javascript
{
  workerId: ObjectId,
  weekNumber: Number,
  year: Number,
  tasksCompleted: Number,
  tasksPending: Number,
  tasksRejected: Number,
  totalTasks: Number,
  completionRate: Number,
  summary: String
}
```

## 🔄 Typical Workflow

### Week Overview
1. **Sunday-Monday:** Admin reviews reported issues
2. **Monday:** Admin assigns tasks to workers with deadlines
3. **Monday-Friday:** Workers view tasks and respond (accept/reject)
4. **Tuesday-Thursday:** Workers work on accepted tasks
5. **Friday:** Workers mark tasks complete
6. **Friday Evening:** System generates weekly reports

### User Flow
1. **User** → Reports infrastructure issue with location + image
2. **Admin** → Reviews priority score and assigns to worker
3. **Worker** → Gets notification, accepts/rejects task
4. **Worker** → Completes work and marks task done
5. **Dashboard** → Shows completion stats and performance

## 🔑 Key Features Explained

### Weekly Dashboard
- Automatically calculates current week number
- Shows all workers' task statistics
- Displays completion rates
- Tracks task status throughout the week

### Priority Scoring
- Based on image confidence and category
- Updates issue importance automatically
- Helps admin prioritize task assignments

### Worker Performance
- Weekly completion rates
- Task status breakdown
- Response metrics

## 🛠️ Configuration

### Change Admin Credentials
Edit `.env` file:
```
ADMIN_EMAIL=your-admin-email@company.com
ADMIN_PASSWORD=your-secure-password
```

### Change JWT Secret
```
JWT_SECRET=your-long-random-secret-string
```

### MongoDB Connection
For MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-infra
```

## 📦 Dependencies

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin requests
- `multer` - File uploads
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables

### Frontend
- `react` - UI library
- `axios` - HTTP client
- `vite` - Build tool

## 🚨 Important Notes

1. **Change admin credentials** before production deployment
2. **Use strong JWT secret** in production
3. **Enable HTTPS** in production
4. **Use database authentication** in production
5. **Implement rate limiting** for API endpoints
6. **Add input validation** for all forms

## 📝 License

College Mini Project - Smart Infrastructure Management

## 🤝 Support

For issues or questions, contact the development team.
