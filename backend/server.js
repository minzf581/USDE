const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const responseTime = require('./middleware/responseTime');
require('dotenv').config();

const { router: authRoutes } = require('./routes/auth');
const companyRoutes = require('./routes/company');
const kycRoutes = require('./routes/kyc');
const paymentRoutes = require('./routes/payment');
const stakeRoutes = require('./routes/stake');
const depositRoutes = require('./routes/deposit');
const withdrawalRoutes = require('./routes/withdrawal');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const treasuryRoutes = require('./routes/treasury');
const enterpriseRoutes = require('./routes/enterprise');
const settingsRoutes = require('./routes/settings');
const { calculateDailyEarnings } = require('./services/earningService');
const paymentService = require('./services/paymentService');

const app = express();
const PORT = process.env.PORT || 5001;

console.log(`🔧 Server configuration:`);
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// CORS middleware - must be before other middleware
app.use(cors({
  origin: [
    'https://usde-frontend-usde.up.railway.app', 
    'http://localhost:3000',
    'https://optimistic-fulfillment-usde.up.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://optimistic-fulfillment-usde.up.railway.app"]
    }
  }
}));

// 响应时间监控中间件
app.use(responseTime);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware (for all routes except Stripe webhook)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/deposit/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle CORS preflight requests
app.options('*', cors());

// Debug CORS endpoint
app.get('/api/debug-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'USDE Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      company: '/api/company',
      kyc: '/api/kyc',
      payment: '/api/payment',
      stake: '/api/stake',
      deposit: '/api/deposit',
      withdrawal: '/api/withdrawal',
      dashboard: '/api/dashboard',
      admin: '/api/admin',
      treasury: '/api/treasury',
      enterprise: '/api/enterprise',
      settings: '/api/settings'
    }
  });
});

// 增强的健康检查端点
app.get('/api/health', async (req, res) => {
  const checks = {};
  let overall = 'healthy';
  
  try {
    // 数据库检查
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    overall = 'unhealthy';
  }
  
  try {
    // Stripe连接检查
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.paymentMethods.list({ limit: 1 });
    checks.stripe = 'healthy';
  } catch (error) {
    checks.stripe = 'unhealthy';
    overall = 'degraded';
  }
  
  // 内存使用检查
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  checks.memory = {
    status: memUsageMB > 400 ? 'warning' : 'healthy',
    usage: `${memUsageMB}MB`
  };
  
  res.status(overall === 'healthy' ? 200 : 503).json({
    status: overall,
    timestamp: new Date().toISOString(),
    service: 'usde-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.RAILWAY_ENVIRONMENT || 'development',
    uptime: process.uptime(),
    checks
  });
});

// 新增：指标端点
app.get('/api/metrics', async (req, res) => {
  try {
    const simpleMetrics = require('./services/simpleMetrics');
    const [appMetrics, dbMetrics] = await Promise.all([
      simpleMetrics.getMetrics(),
      simpleMetrics.getDatabaseMetrics()
    ]);
    
    res.json({
      timestamp: new Date().toISOString(),
      application: appMetrics,
      database: dbMetrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/stake', stakeRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/settings', settingsRoutes);

// 增强错误处理中间件
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });
  
  // Prisma错误处理
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry. This record already exists.',
      code: 'DUPLICATE_ERROR'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found.',
      code: 'NOT_FOUND'
    });
  }
  
  // Stripe错误处理
  if (err.type === 'StripeCardError') {
    return res.status(402).json({
      success: false,
      error: 'Your card was declined.',
      code: 'CARD_DECLINED',
      stripeError: err.code
    });
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      root: '/',
      health: '/api/health',
      auth: '/api/auth/*',
      company: '/api/company/*',
      kyc: '/api/kyc/*',
      payment: '/api/payment/*',
      stake: '/api/stake/*',
      deposit: '/api/deposit/*',
      withdrawal: '/api/withdrawal/*',
      dashboard: '/api/dashboard/*',
      admin: '/api/admin/*',
      treasury: '/api/treasury/*',
      enterprise: '/api/enterprise/*',
      settings: '/api/settings/*'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Available endpoints:`);
  console.log(`   GET  / - API info`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/auth/register - Register`);
  console.log(`   POST /api/auth/login - Login`);
  
  // Initialize daily earnings calculation (runs at midnight)
  if (process.env.NODE_ENV === 'production') {
    console.log('💰 Daily earnings calculation scheduled');
  }
});

module.exports = app; 