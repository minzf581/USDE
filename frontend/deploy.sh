#!/bin/bash

echo "🚀 Starting USDE Frontend Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment
echo "🔧 Setting production environment..."
cp env.production .env.production

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🚀 Starting application..."
npm start 