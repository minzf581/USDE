#!/bin/bash

echo "🚀 Starting USDE Backend Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# Seed database (with error handling)
echo "🌱 Seeding database..."
node prisma/seed-users.js || echo "⚠️  Seeding failed, continuing..."

echo "✅ Deployment completed!"

# Start the server
echo "🚀 Starting server..."
npm start 