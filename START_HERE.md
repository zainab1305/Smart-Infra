# 🎯 START HERE - First Steps

## ⚡ Your Smart Infrastructure Dashboard is Ready!

This file will guide you through the FIRST steps to get everything running.

---

## ✅ Step 1: Understand What You Have (2 minutes)

You now have:
- ✅ Complete backend with 3-role authentication
- ✅ Complete frontend with 3 different dashboards
- ✅ Database models ready to use
- ✅ All API endpoints configured
- ✅ Comprehensive documentation

---

## 🚀 Step 2: Install & Configure (10 minutes)

### For Windows Users:
```bash
# Run setup script
setup.bat

# Then manually edit backend\.env and set:
MONGODB_URI=mongodb://localhost:27017/smart-infra
```

### For Mac/Linux Users:
```bash
# Make script executable
chmod +x setup.sh

# Run setup script
./setup.sh

# Then manually edit backend/.env and set:
MONGODB_URI=mongodb://localhost:27017/smart-infra
```

### Manual Install (if scripts don't work):
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## 🗄️ Step 3: Set Up MongoDB (5 minutes)

### Option A: Local MongoDB
```bash
# Install MongoDB locally, then start it
mongod

# Verify connection works:
mongo --eval "db.adminCommand('ping')"
```

### Option B: MongoDB Atlas (Cloud)
1. Go to mongodb.com
2. Create free account
3. Create cluster
4. Get connection string
5. Update in `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-infra
```

---

## 🎮 Step 4: Start the Application (3 minutes)

### Terminal 1 - Start Backend:
```bash
cd backend
npm start
# You should see: "Server running on port 5000"
```

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
# You should see: "Local: http://localhost:5173"
```

### Terminal 3 (Optional) - Python Image Service:
```bash
cd image-service
python main.py
```

---

## 🌐 Step 5: Open in Browser (1 minute)

**Go to:** `http://localhost:5173`

You should see the Login page with 3 tabs! ✨

---

## 🔐 Step 6: Test Login (2 minutes)

Click the **ADMIN** tab and enter:
```
Email: admin@smartinfra.com
Password: admin123
```

Click **LOGIN**

You should see the **Admin Dashboard**! 🎉

---

## 📋 Step 7: Explore the Features (5 minutes)

### In Admin Dashboard:
1. Click "📊 Dashboard" - See statistics
2. Click "👷 Workers" - Create a test worker
3. Click "🔧 Issues" - View and assign issues
4. Click "📋 Tasks" - Track task progress

### Try These Actions:
1. **Create a worker:**
   - Click "Create New Worker Account"
   - Fill in test data
   - Note the Worker ID

2. **Report an issue:**
   - Switch to USER tab (logout first)
   - Register as new user
   - Report an issue with category and location

3. **Assign task:**
   - Go back to ADMIN
   - Go to Issues tab
   - Assign the reported issue to your test worker

4. **Accept task as worker:**
   - Switch to WORKER tab (login with Worker ID)
   - View the assigned task
   - Click "View Details"
   - Accept the task

5. **Complete task:**
   - Mark it as completed
   - Admin sees it updates!

---

## 📁 Important Files & Locations

### To Change Admin Credentials:
Edit: `backend/.env`
```
ADMIN_EMAIL=your-email@company.com
ADMIN_PASSWORD=your-password
```

### To Change App Title:
Edit: `frontend/src/App.jsx`
```jsx
<h1>Your Custom Title</h1>
```

### To View Database:
```bash
mongo
use smart-infra
db.users.find()     # See users
db.tasks.find()     # See tasks
db.issues.find()    # See issues
```

---

## ✨ Features to Try

### As Admin:
- [ ] View dashboard with stats
- [ ] Create worker account
- [ ] View all users
- [ ] See weekly summary
- [ ] Assign task to worker

### As Worker:
- [ ] See assigned tasks
- [ ] View task details
- [ ] Accept a task
- [ ] View progress stats

### As User:
- [ ] Register account
- [ ] Report infrastructure issue
- [ ] Upload image
- [ ] See issue status

---

## 🐛 If Something Doesn't Work

### Backend won't start?
```bash
# Kill any existing node processes
# Windows: taskkill /IM node.exe /F
# Mac/Linux: pkill node

# Try starting again
npm start
```

### Can't connect to MongoDB?
```bash
# Check if MongoDB is running
# Windows: Open Services and start MongoDB
# Mac/Linux: brew services start mongodb-community
```

### Frontend blank page?
```bash
# Clear browser cache (Ctrl+Shift+Del)
# Close and reopen browser
```

### Port already in use?
```bash
# Change port in backend/server.js
const PORT = 5001;  // Change from 5000
```

See **TROUBLESHOOTING.md** for more help!

---

## 📚 Documentation Guide

After you get it working, read:

1. **QUICK_REFERENCE.md** - Quick lookup guide
2. **DASHBOARD_README.md** - Full feature docs
3. **SYSTEM_FLOW.md** - How everything works
4. **TROUBLESHOOTING.md** - Fix problems
5. **IMPLEMENTATION_SUMMARY.md** - What was built

---

## 🎯 Typical Test Flow (15 minutes)

1. **Admin logs in** (admin@smartinfra.com / admin123)
2. **Creates a worker** with ID "W001"
3. **Logs out and switches to User**
4. **Registers new account**
5. **Reports an issue** with image
6. **Logs out and back to Admin**
7. **Assigns the issue to W001**
8. **Logs out and switches to Worker W001**
9. **Accepts the task**
10. **Marks task complete**
11. **Admin refreshes dashboard** → sees completion!

---

## ✅ Checklist - First Time Setup

- [ ] Cloned/have the project
- [ ] Ran `npm install` in backend and frontend
- [ ] MongoDB is running and configured in `.env`
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Can login with admin credentials
- [ ] Can see admin dashboard
- [ ] Can create a worker account
- [ ] Tested all three user roles
- [ ] Can report and assign issues
- [ ] Can track tasks

If all checked ✅ → You're ready for production!

---

## 🚀 Next: Advanced Features

After testing basic features, try:
1. Upload real images with issues
2. Monitor weekly statistics
3. Test with multiple workers
4. Check completion rates
5. Customize colors and text
6. Deploy to production

---

## 💾 Auto-Save Reminder

Your code is in:
```
c:\college\Sem 6\Mini Project\Project\Smart-Infra
```

All files created:
- ✅ backend/ (updated)
- ✅ frontend/ (updated)
- ✅ Documentation files (new)
- ✅ Setup scripts (new)

**Back up your project!** 💾

---

## 🆘 Quick Help

| Issue | Quick Fix |
|-------|-----------|
| Can't login | Clear localStorage, refresh |
| Port conflict | Change port in server.js |
| MongoDB error | Start mongod/MongoDB service |
| Files not found | Check spelling, use correct paths |
| Dependencies fail | Delete node_modules, run npm install again |

---

## 📞 Where to Go for Help

1. **Technical issue?** → Check TROUBLESHOOTING.md
2. **How to use feature?** → Check DASHBOARD_README.md
3. **How does it work?** → Check SYSTEM_FLOW.md
4. **Just need quick answer?** → Check QUICK_REFERENCE.md

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just:

1. ✅ Run npm install
2. ✅ Start backend & frontend
3. ✅ Go to localhost:5173
4. ✅ Login & explore

**That's it!** 🚀

Good luck with your project! 📊✨

P.S. - Don't forget to change admin credentials for production! 🔒
