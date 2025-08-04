#!/bin/bash

echo "🚀 Starting USDE Backend Deployment..."

# Check environment variables
echo "🔍 Checking environment variables..."
node check-env.js

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Fix module paths
echo "🔧 Fixing module paths..."
node fix-paths.js

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Initialize database (create tables and verify)
echo "🗄️ Initializing database..."
node init-db.js

# Seed database with initial data
echo "🌱 Seeding database..."
node prisma/seed-users.js

echo "✅ Deployment completed successfully!"

# Start the server
echo "🚀 Starting server..."
npm start 