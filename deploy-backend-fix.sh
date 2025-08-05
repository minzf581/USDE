#!/bin/bash

echo "🚀 Deploying backend with CORS fixes..."

# Navigate to backend directory
cd backend

# Deploy to Railway (using backend directory as root)
echo "📦 Deploying to Railway from backend directory..."
railway up --service optimistic-fulfillment-production

echo "✅ Backend deployment complete!"
echo "🔗 Backend URL: https://optimistic-fulfillment-production.up.railway.app"
echo "🧪 Test CORS: https://optimistic-fulfillment-production.up.railway.app/api/debug-cors"
echo ""
echo "📝 Note: Railway is configured to use backend/railway.json as the configuration file" 