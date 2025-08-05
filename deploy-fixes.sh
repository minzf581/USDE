#!/bin/bash

echo "🚀 Deploying fixes for manifest and CORS issues..."

# Deploy backend first
echo "📦 Deploying backend..."
cd backend
railway up --service optimistic-fulfillment-production

# Deploy frontend
echo "📦 Deploying frontend..."
cd ../frontend
railway up --service usde-frontend-usde

echo "✅ Deployment complete!"
echo "🔗 Backend: https://optimistic-fulfillment-production.up.railway.app"
echo "🔗 Frontend: https://usde-frontend-usde.up.railway.app" 