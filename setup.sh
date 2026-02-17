#!/bin/bash

# Smart Infrastructure Management - Quick Setup Guide
# This script helps set up the entire project

echo "========================================"
echo "Smart Infrastructure Setup"
echo "========================================"

# Backend Setup
echo -e "\n📦 Setting up Backend..."
cd backend
npm install

echo -e "\n⚙️ Creating .env file..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env created. Please update MongoDB URI:"
  echo "   Edit backend/.env and set your MONGODB_URI"
else
  echo "✅ .env already exists"
fi

# Frontend Setup
echo -e "\n📦 Setting up Frontend..."
cd ../frontend
npm install

# Return to root
cd ..

echo -e "\n\n========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo -e "\n📋 Next Steps:"
echo "1. Update backend/.env with your MongoDB connection"
echo "2. Start MongoDB service"
echo "3. In backend folder: npm start (or nodemon server.js)"
echo "4. In frontend folder: npm run dev"
echo "5. Open http://localhost:5173"
echo -e "\n🔑 Default Admin Credentials:"
echo "   Email: admin@smartinfra.com"
echo "   Password: admin123"
echo -e "\n📖 See DASHBOARD_README.md for detailed documentation"
echo "========================================"
