#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting USDE Enterprise Platform..."

# 智能环境检测
echo "🔍 检测运行环境..."
if [[ -n "$RAILWAY_ENVIRONMENT" || -n "$RAILWAY_SERVICE_NAME" ]]; then
    echo "🚂 检测到Railway环境，使用PostgreSQL数据库"
    export NODE_ENV=production
    export DATABASE_PROVIDER=postgresql
    # Railway环境使用环境变量中的DATABASE_URL
elif [[ "$NODE_ENV" == "production" ]]; then
    echo "🏭 检测到生产环境，使用PostgreSQL数据库"
    export DATABASE_PROVIDER=postgresql
    # 生产环境使用环境变量中的DATABASE_URL
else
    echo "💻 检测到本地开发环境，使用SQLite数据库"
    export NODE_ENV=development
    export DATABASE_PROVIDER=sqlite
    export DATABASE_URL="file:$SCRIPT_DIR/backend/prisma/data/app.db"
fi

# Kill existing processes
echo "🔄 Killing existing processes..."
pkill -f "node.*backend" || true
pkill -f "react-scripts" || true

# Wait a moment for processes to terminate
sleep 2

# Setup database and seed data (仅本地环境)
if [[ "$DATABASE_PROVIDER" == "sqlite" ]]; then
    echo "🗄️  设置本地SQLite数据库..."
    cd "$SCRIPT_DIR/backend"
    
    # 创建数据库目录
    mkdir -p prisma/data
    
    # 生成Prisma客户端
    npm run db:generate
    
    # 推送数据库schema
    npm run db:push
    
    # 种子数据（如果存在）
    if npm run db:seed 2>/dev/null; then
        echo "✅ 数据库种子数据已加载"
    else
        echo "ℹ️  跳过种子数据加载"
    fi
else
    echo "🗄️  使用PostgreSQL数据库，跳过本地数据库设置"
    cd "$SCRIPT_DIR/backend"
    
    # 仅生成Prisma客户端
    npm run db:generate
fi

# Start backend
echo "🔧 Starting backend server..."
cd "$SCRIPT_DIR/backend"

# 根据环境选择启动命令
if [[ "$DATABASE_PROVIDER" == "sqlite" ]]; then
    echo "   - 数据库: SQLite (本地)"
    echo "   - 端口: 5001"
    echo "   - 环境: 开发"
    npm run dev &
else
    echo "   - 数据库: PostgreSQL (Railway/生产)"
    echo "   - 端口: $PORT (环境变量)"
    echo "   - 环境: 生产"
    npm start &
fi

BACKEND_PID=$!

# Wait for backend to start
echo "⏳ 等待后端服务启动..."
sleep 5

# Start frontend (仅本地环境)
if [[ "$DATABASE_PROVIDER" == "sqlite" ]]; then
    echo "🎨 Starting frontend application..."
    cd "$SCRIPT_DIR/frontend" && npm start &
    FRONTEND_PID=$!
    
    echo "✅ Services started successfully!"
    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:5001"
    echo ""
    echo "🔑 Default Admin Credentials:"
    echo "📧 Email: admin@usde.com"
    echo "🔑 Password: admin123"
    
    # Wait for user to stop
    echo ""
    echo "Press Ctrl+C to stop all services"
    trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
else
    echo "✅ Backend service started successfully!"
    echo "Backend PID: $BACKEND_PID"
    echo "Backend: http://localhost:$PORT"
    echo ""
    echo "🚂 Railway环境 - 前端将通过Railway单独部署"
    echo "Press Ctrl+C to stop backend service"
    trap "echo '🛑 Stopping backend service...'; kill $BACKEND_PID; exit" INT
    wait
fi 