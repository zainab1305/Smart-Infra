# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 1. **MongoDB Connection Error**

**Error:** `MongoError: connect ECONNREFUSED`

**Solutions:**
```bash
# Check MongoDB is running
# Windows:
mongod

# Mac/Linux:
brew services start mongodb-community
# or
sudo systemctl start mongod

# Or use MongoDB Atlas (Cloud)
# Update .env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-infra
```

---

### 2. **Port Already in Use**

**Error:** `Error: listen EADDRINUSE :::5000`

**Solution:**
```bash
# Find and kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>

# Or change port in server.js:
const PORT = 5001; // Change to another port
```

---

### 3. **CORS Errors**

**Error:** `Access to XMLHttpRequest at 'http://localhost:5000/...' blocked by CORS policy`

**Solution:** Ensure backend has CORS enabled
```javascript
// In server.js
app.use(cors());

// Or specify frontend origin:
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
```

---

### 4. **Auth Token Errors**

**Error:** `Invalid token` or `No token provided`

**Solutions:**
- Clear browser localStorage: 
  ```javascript
  localStorage.clear()
  // Refresh page and login again
  ```
- Check token is being sent correctly
- Verify JWT_SECRET is consistent

---

### 5. **Image Upload Issues**

**Error:** `ENOENT: no such file or directory, open '/uploads'`

**Solution:**
```bash
# Create uploads folder
cd backend
mkdir uploads

# Or ensure permissions are correct
chmod 755 uploads
```

---

### 6. **File Not Found Errors**

**Error:** `Cannot find module './models/User'`

**Solutions:**
- Check file names match exactly (case-sensitive on Linux/Mac)
- Ensure all files are created in correct directories
- Verify import paths are correct

---

### 7. **Dependencies Not Installed**

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Reinstall dependencies
cd backend
rm package-lock.json
rm -rf node_modules
npm install

# Same for frontend
cd ../frontend
rm package-lock.json
rm -rf node_modules
npm install
```

---

### 8. **Frontend Not Loading**

**Error:** Blank page or can't connect to localhost:5173

**Solutions:**
```bash
# Kill any existing node processes
# Windows:
taskkill /IM node.exe /F

# Mac/Linux:
pkill node

# Restart frontend
cd frontend
npm run dev

# Check terminal for errors and port messages
```

---

### 9. **Worker Not Receiving Tasks**

**Solutions:**
- Make sure task is assigned to correct worker ID
- Check worker is logged in with correct account
- Verify week number calculation (should be auto)
- Check MongoDB task collection has correct workerId

---

### 10. **Admin Login Not Working**

**Solutions:**
```bash
# Double-check credentials (case-sensitive)
Email: admin@smartinfra.com
Password: admin123

# Or change in .env:
ADMIN_EMAIL=your-email@company.com
ADMIN_PASSWORD=your-password
```

---

## 🔍 Debugging Tips

### 1. Check Backend Logs
```bash
# Terminal should show:
# - Server running on port 5000
# - MongoDB connected
# - API request logs
```

### 2. Check Browser Console
- **F12** → Console tab
- Look for JavaScript errors
- Check Network tab for API responses

### 3. Check MongoDB Data
```bash
# Connect to MongoDB
mongo

# Or use MongoDB Compass GUI

# Check collections:
use smart-infra
db.users.find()
db.issues.find()
db.tasks.find()
```

### 4. Enable Verbose Logging
```javascript
// Add to server.js:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

## 🚨 Production Checklist

Before deploying:

- [ ] Change admin email and password
- [ ] Use strong JWT secret (min 32 chars)
- [ ] Use bcryptjs for password hashing
- [ ] Set MONGODB_URI to production database
- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting to API
- [ ] Add input validation
- [ ] Set CORS origin to production domain
- [ ] Use environment variables for all secrets
- [ ] Test all authentication flows
- [ ] Test task assignments
- [ ] Test image uploads
- [ ] Monitor error logs

---

## 📞 Getting Help

If you're stuck:

1. Check this troubleshooting guide
2. Review DASHBOARD_README.md for architecture
3. Check browser console for errors (F12)
4. Check terminal logs for backend errors
5. Look at MongoDB compass for data issues
6. Verify all .env settings are correct

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Can login with admin credentials
- [ ] Can create new user account
- [ ] Can report infrastructure issue
- [ ] Can see issue in admin dashboard
- [ ] Admin can create worker account
- [ ] Admin can assign task to worker
- [ ] Worker can login and see tasks
- [ ] Worker can accept/reject tasks
- [ ] Worker can mark task complete
- [ ] Dashboard shows correct stats

If all checks pass ✅ - You're ready to go!
