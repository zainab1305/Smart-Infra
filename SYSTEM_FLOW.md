# 📊 System Flow & Architecture

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   LOGIN PAGE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    ADMIN     │  │     USER     │  │    WORKER    │       │
│  │ TAB          │  │ TAB          │  │ TAB          │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ Email        │  │ Register:    │  │ Worker ID    │       │
│  │ Password     │  │ • Name       │  │ Password     │       │
│  │              │  │ • Email      │  │              │       │
│  │ ↓            │  │ • Password   │  │ ↓            │       │
│  │ Login        │  │ • Phone      │  │ Login        │       │
│  │              │  │              │  │              │       │
│  │ OR Login:    │  │ • Email      │  │ (Created by  │       │
│  │ • Email      │  │ • Password   │  │  Admin)      │       │
│  │ • Password   │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         ↓                  ↓                  ↓              │
│    [Verify]           [Register]         [Verify]           │
│         ↓                  ↓                  ↓              │
│  JWT Token Generated  JWT Token Generated  JWT Token Generated
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 User Journey

### ADMIN FLOW
```
┌─────────────────┐
│ Admin Login     │
│ admin@...       │
│ admin123        │
└────────┬────────┘
         ↓
    ┌────────────────────────────────────────┐
    │      ADMIN DASHBOARD                    │
    ├────────────────────────────────────────┤
    │                                         │
    │  ┌──────────┐  ┌──────────┐            │
    │  │ Dashboard│  │ Workers  │            │
    │  │          │  │          │            │
    │  │• Stats   │  │• Create  │            │
    │  │• Summary │  │• View    │            │
    │  │• Weekly  │  │• Manage  │            │
    │  └──────────┘  └──────────┘            │
    │                                         │
    │  ┌──────────┐  ┌──────────┐            │
    │  │ Issues   │  │Tasks     │            │
    │  │          │  │          │            │
    │  │• View    │  │• View    │            │
    │  │• Assign  │  │• Track   │            │
    │  │  to      │  │• Status  │            │
    │  │  Worker  │  │• Update  │            │
    │  └──────────┘  └──────────┘            │
    │                                         │
    └────────────────────────────────────────┘
             ↓
    [Creates Worker Accounts]
    [Assigns Issues as Tasks]
    [Monitors Progress]
```

### WORKER FLOW
```
┌─────────────────────────┐
│ Worker Login            │
│ Worker ID + Password    │
│ (Created by Admin)      │
└────────┬────────────────┘
         ↓
    ┌────────────────────────┐
    │ WORKER DASHBOARD       │
    ├────────────────────────┤
    │                        │
    │ My Tasks for Week:     │
    │                        │
    │ ┌──────────────────┐   │
    │ │ Pending Tasks    │   │
    │ │                  │   │
    │ │ [Task]           │   │
    │ │ • Category       │   │
    │ │ • Location       │   │
    │ │ • Priority       │   │
    │ │                  │   │
    │ │ [View Details]   │   │
    │ └──────────────────┘   │
    │          ↓             │
    │ ┌──────────────────┐   │
    │ │ Task Response   │   │
    │ │                 │   │
    │ │ [Accept] [Reject]
    │ │ [Feedback Box]   │   │
    │ │                 │   │
    │ │ [Submit]        │   │
    │ └──────────────────┘   │
    │          ↓             │
    │ Status: In Progress    │
    │          ↓             │
    │ When Done:             │
    │ [Mark Completed]       │
    │          ↓             │
    │ Status: Completed      │
    │                        │
    │ Weekly Progress:       │
    │ • Completion %         │
    │ • Tasks Done           │
    │ • In Progress          │
    │ • Pending              │
    │                        │
    └────────────────────────┘
```

### USER FLOW
```
┌─────────────────────┐
│ User Register/Login │
│ • Email             │
│ • Password          │
└────────┬────────────┘
         ↓
    ┌────────────────────────┐
    │  USER DASHBOARD        │
    ├────────────────────────┤
    │                        │
    │ Report Issue Form:     │
    │                        │
    │ ┌──────────────────┐   │
    │ │ • Category       │   │
    │ │   (Dropdown)     │   │
    │ │ • Location       │   │
    │ │ • Image Upload   │   │
    │ │                  │   │
    │ │ [Report Issue]   │   │
    │ └──────────────────┘   │
    │          ↓             │
    │ Issue Created          │
    │ Status: Reported       │
    │          ↓             │
    │ Track Issues:          │
    │ ┌──────────────────┐   │
    │ │ Issue 1          │   │
    │ │ • Category       │   │
    │ │ • Location       │   │
    │ │ • Status         │   │
    │ │ • Priority       │   │
    │ │ • Confidence     │   │
    │ │ • AI Analysis    │   │
    │ │ • Image          │   │
    │ └──────────────────┘   │
    │                        │
    │ [Shows status updates  │
    │  as admin assigns      │
    │  and worker completes] │
    │                        │
    └────────────────────────┘
```

---

## 📅 Weekly Workflow

```
SUNDAY/MONDAY
    │
    ├─→ User Reports Issues
    │   └─→ Issue Status: "Reported"
    │
    └─→ System Calculates Priority Scores

MONDAY
    │
    ├─→ Admin Logs In
    │
    ├─→ Reviews All Issues
    │
    ├─→ Assigns Issues to Workers (Creates Tasks)
    │   └─→ Task Status: "Pending"
    │   └─→ Current Week Calculated
    │
    └─→ Sends Task Notifications


MONDAY-TUESDAY
    │
    ├─→ Workers Log In
    │
    ├─→ View Tasks
    │
    ├─→ Accept or Reject
    │   ├─→ Accept: Status → "In Progress"
    │   └─→ Reject: Status → "Pending" (can reassign)
    │
    └─→ Add Feedback


TUESDAY-THURSDAY
    │
    └─→ Workers Complete Work


FRIDAY
    │
    ├─→ Workers Mark Tasks Complete
    │   └─→ Task Status: "Completed"
    │   └─→ Issue Status: "Resolved"
    │
    └─→ System Generates Weekly Report


FRIDAY EVENING
    │
    ├─→ Admin Views Dashboard
    │
    ├─→ See statistics:
    │   ├─→ Tasks Completed
    │   ├─→ Completion Rate
    │   ├─→ Worker Performance
    │   └─→ Overview
    │
    └─→ Plan for Next Week
```

---

## 🗄️ Database Relationships

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│  USER                                                │
│  ├─ _id (ObjectId)                                   │
│  ├─ name                                             │
│  ├─ email (unique)                                   │
│  ├─ password                                         │
│  ├─ role: "admin" | "user" | "worker"               │
│  ├─ workerId (for workers)                           │
│  ├─ isActive                                         │
│  └─ timestamps                                       │
│                                                       │
│  ↓ (One-to-Many)                                     │
│  ├─────────────────────────────────────→ TASK        │
│  │                                      ├─ _id       │
│  │                                      ├─ workerId💫
│  │                                      ├─ issueId   │
│  │                                      ├─ status    │
│  │                                      ├─ dueDate   │
│  │                                      ├─ response  │
│  │                                      ├─ week #   │
│  │                                      └─ year      │
│  │                                         ↓         │
│  │                                    (Many-to-One)  │
│  │                                    ISSUE          │
│  │                  ↓                 ├─ _id        │
│  └─────────────────────────────────→ WEEKLY_REPORT  │
│  (One-to-Many)                      ├─ workerId💫 │
│  (Workers have weekly reports)      ├─ week #     │
│                                      ├─ year       │
│                                      ├─ completed  │
│                                      ├─ pending    │
│                                      ├─ rejected   │
│                                      ├─ rate       │
│                                      └─ summary    │
│                                                      │
└──────────────────────────────────────────────────────┘

💫 = Foreign Key Reference
```

---

## 🔄 API Communication

```
┌──────────────────────────────────────────┐
│         FRONTEND (React/Vite)            │
├──────────────────────────────────────────┤
│                                          │
│  Login.jsx → POST /api/auth/login/*     │
│  AdminDashboard.jsx → GET/POST /api/*   │
│  WorkerDashboard.jsx → GET/PUT /api/*   │
│  UserDashboard.jsx → POST /api/issues   │
│                                          │
└─────────────┬──────────────────────────┬─┘
              │                          │
       HTTP Requests                JWT Token
       (Axios)                      (Headers)
              │                          │
              ↓                          ↓
┌──────────────────────────────────────────┐
│     BACKEND (Express/Node.js)            │
├──────────────────────────────────────────┤
│                                          │
│  authRoutes.js → Auth Logic             │
│  taskRoutes.js → Task Management        │
│  issueRoutes.js → Issue Management      │
│                                          │
│  auth.js Middleware → Verify Token      │
│                                          │
└─────────────┬──────────────────────────┬─┘
              │                          │
              ↓                          ↓
┌──────────────────────────────────────────┐
│     MONGODB DATABASE                     │
├──────────────────────────────────────────┤
│                                          │
│  Collections:                            │
│  • users                                 │
│  • issues                                │
│  • tasks                                 │
│  • weeklyreports                         │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📋 Task Status Flow

```
         CREATED
            │
            ▼
       ┌─────────┐
       │ PENDING │  ← Admin assigns task
       └────┬────┘
            │ Worker receives
            ▼
      ┌──────────────┐
      │ ACCEPTANCE   │
      │ DECISION     │
      └──────┬───────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
  ┌────────┐   ┌─────────┐
  │ACCEPTED│   │ REJECTED│
  └────┬───┘   └────┬────┘
       │            │
       ▼            ▼
  ┌──────────┐  ┌────────┐
  │IN        │  │ PENDING│
  │PROGRESS  │  │(for re-│
  └────┬─────┘  │assign) │
       │        └────────┘
       │
       ▼
  ┌──────────┐
  │COMPLETED │  ← Worker marks done
  └──────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────┐
│  FRONTEND                                    │
│  ├─→ Store JWT in localStorage              │
│  ├─→ Validate user role                     │
│  └─→ Render appropriate components          │
└────────┬────────────────────────────────────┘
         │
    JWT Token in Header
         │
         ▼
┌─────────────────────────────────────────────┐
│  BACKEND                                     │
│  ├─→ Verify JWT signature                   │
│  ├─→ Check token expiration                 │
│  ├─→ Validate user role (admin/worker)     │
│  └─→ Check resource ownership               │
└────────┬────────────────────────────────────┘
         │
    JWT Valid
         │
         ▼
┌─────────────────────────────────────────────┐
│  DATABASE ACCESS                             │
│  ├─→ Execute query                          │
│  ├─→ Return data                            │
│  └─→ Log access                             │
└─────────────────────────────────────────────┘
```

This diagram shows the complete system architecture and data flow.
