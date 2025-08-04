#!/bin/bash

echo "🚀 Starting USDE Backend Deployment..."

# Check environment variables
echo "🔍 Checking environment variables..."
node check-env.js

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Update Prisma imports to use shared client
echo "🔧 Updating Prisma imports..."
node update-prisma-imports.js

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Test database connection
echo "🔍 Testing database connection..."
node test-db.js

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# Seed database with initial data
echo "🌱 Seeding database..."
node prisma/seed-users.js

echo "✅ Deployment completed successfully!"

# Start the server
echo "🚀 Starting server..."
npm start 