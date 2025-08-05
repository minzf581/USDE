#!/bin/bash

echo "🚀 Starting USDE Frontend Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment
echo "🔧 Setting production environment..."
cp env.production .env.production

# Build React app
echo "🔨 Building React application..."
npm run build

# Start the application with proper configuration
echo "🚀 Starting frontend server..."
npx serve -s build -l $PORT 