#!/bin/bash

echo "🔍 Verifying Railway configuration..."

# Check if backend/railway.json exists
if [ -f "backend/railway.json" ]; then
    echo "✅ backend/railway.json exists"
    echo "📄 Content:"
    cat backend/railway.json
else
    echo "❌ backend/railway.json missing"
fi

echo ""

# Check if root railway-backend.json exists (should not)
if [ -f "railway-backend.json" ]; then
    echo "⚠️  railway-backend.json exists in root (should be removed)"
else
    echo "✅ railway-backend.json not in root (correct)"
fi

echo ""

# Check backend package.json
echo "📦 Backend package.json scripts:"
cat backend/package.json | grep -A 10 '"scripts"'

echo ""
echo "🚀 Ready to deploy with correct configuration!" 