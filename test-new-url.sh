#!/bin/bash

echo "🧪 Testing new backend URL..."

# Test the root endpoint
echo "1. Testing root endpoint..."
curl -s https://optimistic-fulfillment-usde.up.railway.app/ | jq .

echo ""
echo "2. Testing health endpoint..."
curl -s https://optimistic-fulfillment-usde.up.railway.app/api/health | jq .

echo ""
echo "3. Testing CORS debug endpoint..."
curl -H "Origin: https://usde-frontend-usde.up.railway.app" \
  https://optimistic-fulfillment-usde.up.railway.app/api/debug-cors | jq .

echo ""
echo "4. Testing OPTIONS preflight..."
curl -X OPTIONS \
  -H "Origin: https://usde-frontend-usde.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -I https://optimistic-fulfillment-usde.up.railway.app/api/auth/login

echo ""
echo "✅ URL testing complete!" 