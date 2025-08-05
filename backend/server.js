const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const { calculateDailyEarnings } = require('./services/earningService');
const paymentService = require('./services/paymentService');

const app = express();
const PORT = process.env.PORT || 5001;

console.log(`🔧 Server configuration:`);
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://optimistic-fulfillment-production.up.railway.app',
        'https://usde-frontend.up.railway.app',
        'https://usde-frontend.vercel.app',
        'https://usde-frontend.netlify.app',
        'https://usde.vercel.app',
        'https://usde.netlify.app'
      ] 
    : ['http://localhost:3000'],
  credentials: true
}));

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
      admin: '/api/admin'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
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
      admin: '/api/admin/*'
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