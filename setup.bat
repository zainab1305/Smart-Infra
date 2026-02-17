@echo off
REM Smart Infrastructure Management - Quick Setup Guide (Windows)
REM This script helps set up the entire project

echo.
echo ========================================
echo Smart Infrastructure Setup (Windows)
echo ========================================

REM Backend Setup
echo.
echo 📦 Setting up Backend...
cd backend
call npm install

echo.
echo ⚙️  Creating .env file...
if not exist .env (
  copy .env.example .env
  echo ✅ .env created. Please update MongoDB URI:
  echo    Edit backend/.env and set your MONGODB_URI
) else (
  echo ✅ .env already exists
)

REM Frontend Setup
echo.
echo 📦 Setting up Frontend...
cd ..\frontend
call npm install

REM Return to root
cd ..

echo.
echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo 📋 Next Steps:
echo 1. Update backend\.env with your MongoDB connection
echo 2. Start MongoDB service
echo 3. In backend folder: npm start (or nodemon server.js)
echo 4. In frontend folder: npm run dev
echo 5. Open http://localhost:5173
echo.
echo 🔑 Default Admin Credentials:
echo    Email: admin@smartinfra.com
echo    Password: admin123
echo.
echo 📖 See DASHBOARD_README.md for detailed documentation
echo ========================================
echo.
pause
