const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Debug CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://usde-frontend-usde.up.railway.app',
        'https://optimistic-fulfillment-production.up.railway.app',
        'https://usde-frontend.up.railway.app',
        'https://usde-frontend.vercel.app',
        'https://usde-frontend.netlify.app',
        'https://usde.vercel.app',
        'https://usde.netlify.app',
        // Allow all Railway domains
        /^https:\/\/.*\.up\.railway\.app$/,
        /^https:\/\/.*\.railway\.app$/
      ] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

console.log('🔧 CORS Configuration:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('   CORS Origins:', corsOptions.origin);

app.use(cors(corsOptions));

// Test endpoint
app.get('/api/test-cors', (req, res) => {
  console.log('📨 Request received from:', req.headers.origin);
  res.json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CORS Debug Server running on port ${PORT}`);
  console.log(`🌐 Test endpoint: http://localhost:${PORT}/api/test-cors`);
}); 