#!/bin/bash

echo "🚀 Starting USDE Full Stack Deployment..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# Seed database
echo "🌱 Seeding database..."
node prisma/seed-users.js || echo "⚠️  Seeding failed, continuing..."

# Build frontend
echo "🔨 Building frontend..."
cd ../frontend
npm install

# Set production environment
echo "🔧 Setting production environment..."
cp env.production .env.production

# Build React app
echo "🔨 Building React application..."
npm run build

# Start both services
echo "🚀 Starting full stack application..."
cd ..

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Start frontend
echo "🌐 Starting frontend server..."
cd ../frontend
npx serve -s build -l 3000 &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 