# ⚡ Quick Reference Card

## 🎯 What's New

Your Smart Infrastructure Management system now has a complete **dashboard with 3-role authentication and weekly task tracking**.

---

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd backend && npm install && cd ../frontend && npm install
```

### Step 2: Configure MongoDB
Update `.env` in backend folder:
```
MONGODB_URI=mongodb://localhost:27017/smart-infra
```

### Step 3: Start Services
```bash
# Terminal 1 - Start Backend
cd backend && npm start

# Terminal 2 - Start Frontend (in new terminal)
cd frontend && npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:5173**

### Step 5: Login & Test
```
Email: admin@smartinfra.com
Password: admin123
```

---

## 👥 Three User Types

### 👔 ADMIN
- Email & password login
- Create worker accounts
- Assign tasks to workers
- View team dashboard
- Monitor progress

### 👷 WORKER
- Worker ID & password login (created by admin)
- See assigned tasks
- Accept/reject tasks
- Mark tasks complete
- View personal stats

### 👤 USER
- Self-register with email
- Report infrastructure issues
- Upload images
- Track reported issues
- See resolution status

---

## 🔐 Default Credentials

| Role | Email/ID | Password | 
|------|----------|----------|
| Admin | admin@smartinfra.com | admin123 |
| User | [Self Register] | [Your choice] |
| Worker | [Admin creates] | [Admin sets] |

⚠️ Change admin credentials in `.env` for production!

---

## 📋 API Quick Reference

### 🔑 Authentication
```
POST /api/auth/login/admin           Admin login
POST /api/auth/register/user         User signup
POST /api/auth/login/user            User login
POST /api/auth/login/worker          Worker login
POST /api/auth/create-worker         Create worker (admin)
```

### 📊 Tasks
```
POST /api/tasks/assign               Assign task (admin)
GET  /api/tasks/my-tasks             My tasks (worker)
PUT  /api/tasks/{id}/respond         Accept/reject
PUT  /api/tasks/{id}/complete        Mark done
GET  /api/tasks/dashboard/week-summary  Stats
```

### 🔧 Issues
```
GET  /api/issues                     All issues
POST /api/issues                     Report issue
```

---

## 📂 Key Files

### Backend
```
backend/models/User.js              ← Admin/Worker/User accounts
backend/models/Task.js              ← Task assignments
backend/routes/authRoutes.js        ← Login/Register
backend/routes/taskRoutes.js        ← Task management
backend/server.js                   ← Main server file
```

### Frontend
```
frontend/src/components/Login.jsx           ← Login page
frontend/src/components/AdminDashboard.jsx  ← Admin view
frontend/src/components/WorkerDashboard.jsx ← Worker view
frontend/src/components/UserDashboard.jsx   ← User view
frontend/src/App.jsx                        ← Main app
```

---

## 🔄 Weekly Workflow

```
SUNDAY/MONDAY        Users report issues
        ↓
MONDAY              Admin assigns tasks
        ↓
MONDAY-TUESDAY      Workers accept/reject
        ↓
TUE-THU             Workers work on tasks
        ↓
FRIDAY              Workers complete tasks
        ↓
ADMIN VIEWS         Dashboard shows stats
```

---

## 🐛 Common Commands

### Install Dependencies
```bash
npm install                  # In backend or frontend folder
```

### Start Backend
```bash
npm start                    # In backend folder
# or with auto-reload:
nodemon server.js
```

### Start Frontend
```bash
npm run dev                  # In frontend folder
```

### Check MongoDB
```bash
mongo                        # Connect to db
use smart-infra             # Select database
db.users.find()             # View users
db.tasks.find()             # View tasks
```

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 in use | `taskkill /IM node.exe /F` (Windows) |
| MongoDB not connecting | Start MongoDB: `mongod` |
| Dependencies missing | `npm install` again |
| CORS error | Check backend cors() is enabled |
| Can't login | Clear localStorage & try again |
| Image not uploading | Check `/backend/uploads` folder exists |

---

## ✏️ Customization

### Change Admin Email
```env
# In backend/.env
ADMIN_EMAIL=your-email@company.com
ADMIN_PASSWORD=new-password
```

### Change App Title
```jsx
// In frontend/src/App.jsx
<h1>Your App Name</h1>
```

### Change Colors
```css
/* In frontend/src/components/Login.css */
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
```

### Add More Issue Categories
```jsx
// In UserDashboard.jsx
<option value="New Category">New Category</option>
```

---

## 📊 Features at a Glance

✅ Three-role authentication (Admin, User, Worker)
✅ Worker account management
✅ Task assignment system
✅ Weekly dashboard with stats
✅ Image upload with issues
✅ Automatic priority scoring
✅ Task acceptance workflow
✅ Completion tracking
✅ Weekly performance reports
✅ Role-based access control
✅ JWT authentication
✅ Responsive mobile design

---

## 📚 Full Documentation

- **DASHBOARD_README.md** - Complete feature guide
- **IMPLEMENTATION_SUMMARY.md** - What was built
- **TROUBLESHOOTING.md** - Fix common issues
- **SYSTEM_FLOW.md** - Architecture & diagrams
- **FILES_MANIFEST.md** - All created files

---

## 💡 Pro Tips

1. **Use VS Code extensions:** REST Client, MongoDB for Explorers
2. **Save browser tabs:** Open 3 tabs for Admin/Worker/User testing
3. **Test all roles:** Switch roles to verify access control
4. **Monitor console:** Ctrl+Shift+J (browser) for debugging
5. **Check network tab:** See API responses in Chrome DevTools

---

## 🎓 Learning Resources

- JWT: `jsonwebtoken.io`
- Express: `expressjs.com`
- MongoDB: `mongodb.com/docs`
- React: `react.dev`
- Vite: `vitejs.dev`

---

## ✅ Verify Installation

After setup, check:
- [ ] Can login with admin credentials
- [ ] Can create new user account
- [ ] Can report issues
- [ ] Admin can create worker
- [ ] Admin can assign task
- [ ] Worker can see task
- [ ] Worker can accept task
- [ ] Task shows as "In Progress"
- [ ] Worker can mark complete
- [ ] Dashboard updates stats

---

## 🚀 You're Ready!

Everything is set up and documented. Just:

1. Install dependencies ✓
2. Configure MongoDB ✓
3. Start backend & frontend ✓
4. Login & test ✓
5. Customize as needed ✓

**Happy coding!** 🎉
