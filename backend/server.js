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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-domain.railway.app'] 
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize daily earnings calculation (runs at midnight)
  if (process.env.NODE_ENV === 'production') {
    console.log('💰 Daily earnings calculation scheduled');
  }
});

module.exports = app; 