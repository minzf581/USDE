#!/bin/bash

echo "🚀 Initializing Enterprise Treasury Control Module..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one based on env.example"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migrations..."
npx prisma migrate dev --name add-treasury-control

echo "🌱 Seeding RBAC system..."
node prisma/seed-rbac.js

echo "✅ Treasury Control Module initialization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend server: npm start"
echo "2. Access the treasury control at: /treasury"
echo "3. Create enterprise users and assign roles"
echo "4. Configure treasury settings"
echo ""
echo "🔧 Available roles:"
echo "   - admin: Full system access"
echo "   - finance_manager: Can approve payments/withdrawals"
echo "   - finance_operator: Can initiate payments/withdrawals"
echo "   - observer: Read-only access" 